-- Nova migration 018: the coach-first pipeline.
--
-- Every client now follows one path: sign up → medical assessment → AI drafts
-- a report and program → the assigned coach edits and approves → only then is
-- it published to the client. Nothing reaches a client dashboard without a
-- coach signing off on it.
--
-- Existing clients are unaffected: their plans are already approved, and the
-- app treats an approved plan as published.

-- ---------------------------------------------------------------------------
-- Assessments
-- ---------------------------------------------------------------------------
-- Answers live in jsonb rather than 30 columns: the form is expected to keep
-- growing (Nova's Google Form questions are still being folded in), and a
-- coach only ever reads it as a whole.
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  -- Which step the client reached, so an interrupted form resumes in place.
  current_step int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'processed')),
  -- Storage paths for equipment photos (home-workout clients).
  equipment_photos text[] not null default '{}',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessments_client_idx on public.assessments (client_id, created_at desc);

alter table public.assessments enable row level security;

-- The active check goes through a SECURITY DEFINER helper rather than an
-- inline subquery, so reading an assessment doesn't drag the profiles
-- policies in behind it.
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

drop policy if exists "assessments: client manages own" on public.assessments;
create policy "assessments: client manages own" on public.assessments
  for all using (auth.uid() = client_id and public.is_active_user())
  with check (auth.uid() = client_id and public.is_active_user());

drop policy if exists "assessments: coach reads assigned" on public.assessments;
create policy "assessments: coach reads assigned" on public.assessments
  for select using (
    public.is_active_admin()
    or (public.is_active_coach() and public.is_my_client(client_id))
  );

-- ---------------------------------------------------------------------------
-- Plans: the review pipeline
-- ---------------------------------------------------------------------------
alter table public.plans add column if not exists assessment_id uuid references public.assessments (id) on delete set null;
-- The AI's written analysis of the assessment, shown to the coach and (once
-- published) to the client.
alter table public.plans add column if not exists ai_report jsonb;
alter table public.plans add column if not exists generated_by text
  check (generated_by is null or generated_by in ('ai', 'fallback', 'coach'));
alter table public.plans add column if not exists published_at timestamptz;

-- Widen the status pipeline. 'approved' is kept as the published state so
-- every existing row, query and policy keeps working untouched.
do $$
begin
  alter table public.plans drop constraint if exists plans_status_check;
  alter table public.plans add constraint plans_status_check
    check (status in ('awaiting_ai', 'pending', 'approved', 'changes_requested'));
end $$;

-- Anything already approved counts as published from the moment it was.
update public.plans set published_at = coalesce(published_at, approved_at)
where status = 'approved' and published_at is null;

-- ---------------------------------------------------------------------------
-- Coach profiles — the client meets a person, not a platform
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists photo_url text;
alter table public.profiles add column if not exists qualifications text;
alter table public.profiles add column if not exists years_experience int;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists coaching_philosophy text;
alter table public.profiles add column if not exists working_hours text;
-- The welcome experience is shown once, before the first workout.
alter table public.profiles add column if not exists welcomed_at timestamptz;

-- A client must be able to read their own coach's profile card even though
-- the roster policy only lets coaches read downward.
--
-- The coach lookup goes through a SECURITY DEFINER function on purpose: a
-- policy on profiles that queries profiles re-enters its own policy set and
-- Postgres rejects it with "infinite recursion detected". See migration 020.
create or replace function public.my_coach_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select assigned_coach_id from public.profiles where id = auth.uid();
$$;

drop policy if exists "profiles: client reads own coach" on public.profiles;
create policy "profiles: client reads own coach" on public.profiles
  for select using (role = 'coach' and id = public.my_coach_id());

-- ---------------------------------------------------------------------------
-- Submitting an assessment
-- ---------------------------------------------------------------------------
-- Creates the plan shell in 'awaiting_ai' so it shows up in the coach's queue
-- immediately, even if generation is slow or fails. The edge function fills in
-- days + ai_report afterwards; a coach can always write the program by hand.
create or replace function public.submit_assessment(p_assessment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.assessments;
  new_plan_id uuid;
  client_name text;
begin
  select * into a from public.assessments where id = p_assessment_id;

  if a.id is null or a.client_id <> auth.uid() then
    raise exception 'That assessment is not yours to submit';
  end if;

  update public.assessments
  set status = 'submitted', submitted_at = now(), updated_at = now()
  where id = p_assessment_id;

  select full_name into client_name from public.profiles where id = a.client_id;

  insert into public.plans (
    client_id, full_name, goal, medical_conditions, medical_notes,
    age, height_cm, weight_kg, experience_level,
    days, status, assessment_id, wants_coach
  )
  values (
    a.client_id,
    coalesce(nullif(trim(a.answers ->> 'full_name'), ''), client_name, ''),
    a.answers ->> 'primary_goal',
    '{}',
    a.answers ->> 'medical_history',
    nullif(a.answers ->> 'age', '')::int,
    nullif(a.answers ->> 'height_cm', '')::numeric,
    nullif(a.answers ->> 'weight_kg', '')::numeric,
    nullif(a.answers ->> 'experience_level', ''),
    '[]'::jsonb,
    'awaiting_ai',
    p_assessment_id,
    true
  )
  returning id into new_plan_id;

  return new_plan_id;
end;
$$;

-- Publishing is the coach's act, and the only way a plan reaches a client.
create or replace function public.publish_plan(p_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_client uuid;
begin
  select client_id into target_client from public.plans where id = p_plan_id;

  if not (public.is_active_admin() or (public.is_active_coach() and public.is_my_client(target_client))) then
    raise exception 'You can only publish plans for your own clients';
  end if;

  update public.plans
  set status = 'approved',
      approved_at = coalesce(approved_at, now()),
      published_at = now()
  where id = p_plan_id;
end;
$$;

-- The admin panel's unauthenticated equivalents.
create or replace function public.admin_publish_plan(p_plan_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.plans
  set status = 'approved',
      approved_at = coalesce(approved_at, now()),
      published_at = now()
  where id = p_plan_id;
$$;

create or replace function public.admin_list_assessments(p_client_id uuid)
returns setof public.assessments
language sql
stable
security definer
set search_path = public
as $$
  select * from public.assessments where client_id = p_client_id order by created_at desc;
$$;
