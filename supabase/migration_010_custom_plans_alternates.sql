-- Nova migration 010: client-built custom plans, alternate exercises, and
-- per-exercise logging.
--
-- Run this once in the Supabase SQL Editor, after migration 009.

-- The coach-built program still lives in plans.days. A client's own plan is
-- kept alongside it so switching back and forth never destroys either one.
alter table public.plans add column if not exists custom_days jsonb;
alter table public.plans add column if not exists custom_days_per_week int;
alter table public.plans add column if not exists active_plan text not null default 'coach';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'plans_active_plan_check'
  ) then
    alter table public.plans
      add constraint plans_active_plan_check check (active_plan in ('coach', 'custom'));
  end if;
end $$;

-- Alternate exercises live inside the days JSON (each exercise carries an
-- `alternates` array of up to three swaps), so no schema change is needed for
-- them — but the log below records which one was actually performed.
create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  plan_day_id text not null,
  plan_source text not null default 'coach' check (plan_source in ('coach', 'custom')),
  -- The slot in the plan...
  planned_name text not null,
  -- ...and what the client actually did for it (the primary or an alternate).
  performed_name text not null,
  is_alternate boolean not null default false,
  week_number int,
  sets_completed int,
  reps text,
  weight_kg numeric,
  notes text,
  logged_at timestamptz not null default now()
);

create index if not exists exercise_logs_client_logged_idx
  on public.exercise_logs (client_id, logged_at desc);

alter table public.exercise_logs enable row level security;

drop policy if exists "exercise_logs: client manages own" on public.exercise_logs;
create policy "exercise_logs: client manages own" on public.exercise_logs
  for all using (
    auth.uid() = client_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
  )
  with check (
    auth.uid() = client_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
  );

-- Coaches need to see what their clients actually logged, including which
-- alternate they picked, but must never write to it.
drop policy if exists "exercise_logs: coach reads assigned" on public.exercise_logs;
create policy "exercise_logs: coach reads assigned" on public.exercise_logs
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('coach', 'admin') and p.active
    )
  );

-- Clients edit only their own custom plan. Row-level security can't restrict
-- *which columns* an update touches, so instead of opening up plans to client
-- updates these definer functions write exactly the custom-plan columns of
-- the caller's own latest plan.
create or replace function public.save_custom_plan(
  p_days jsonb,
  p_days_per_week int,
  p_make_active boolean default true
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.plans
  set custom_days = p_days,
      custom_days_per_week = p_days_per_week,
      active_plan = case when p_make_active then 'custom' else active_plan end
  where client_id = auth.uid()
    and id = (
      select id from public.plans
      where client_id = auth.uid()
      order by created_at desc
      limit 1
    );
$$;

create or replace function public.set_active_plan(p_active text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.plans
  set active_plan = p_active
  where client_id = auth.uid()
    and p_active in ('coach', 'custom')
    and id = (
      select id from public.plans
      where client_id = auth.uid()
      order by created_at desc
      limit 1
    );
$$;

-- Plans are normally created by the client's own intake form, so the insert
-- policy is client-only. A coach building a program for someone who never
-- filled the form in (an account the admin created directly) needs this
-- instead — it checks the caller really is an active coach or admin.
create or replace function public.coach_create_plan(
  p_client_id uuid,
  p_goal text default 'general-fitness',
  p_days jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  client_name text;
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('coach', 'admin') and p.active
  ) then
    raise exception 'Only an active coach or admin can create a plan';
  end if;

  select full_name into client_name from public.profiles where id = p_client_id;

  insert into public.plans (client_id, full_name, goal, medical_conditions, days, status)
  values (p_client_id, coalesce(client_name, ''), p_goal, '{}', p_days, 'pending')
  returning id into new_id;

  return new_id;
end;
$$;

-- The admin panel (hardcoded login, no auth.uid() session) needs the same
-- read of a single client's plan that a coach gets through RLS.
create or replace function public.admin_list_exercise_logs(p_client_id uuid)
returns setof public.exercise_logs
language sql
stable
security definer
set search_path = public
as $$
  select * from public.exercise_logs
  where client_id = p_client_id
  order by logged_at desc;
$$;
