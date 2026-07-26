-- Nova migration 013: per-set logging and personal records.
--
-- Logging used to capture one row per exercise ("3 × 8 @ 60kg"). Real
-- sessions aren't that tidy — sets drop off, weight climbs mid-exercise — so
-- each set is now recorded individually, and the best set feeds a personal
-- record per exercise.

alter table public.exercise_logs
  add column if not exists sets jsonb not null default '[]'::jsonb;

-- The individual sets: [{ "weight_kg": 60, "reps": 8 }, …]. The existing
-- sets_completed / reps / weight_kg columns are kept as the summary of the
-- best set, so older rows and any existing reads stay valid.

/**
 * Personal records, one row per exercise per client.
 *
 * exercise_key is the catalog id when the exercise came from the library, and
 * a normalised name otherwise — so "Barbell Bench Press" logged from the
 * library and a custom "barbell bench press" don't drift into two records.
 */
create table if not exists public.exercise_prs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  exercise_key text not null,
  exercise_name text not null,
  weight_kg numeric,
  reps int,
  -- Epley estimate, stored so records with different rep ranges can be
  -- compared without recomputing everywhere.
  estimated_1rm numeric,
  source text not null default 'logged' check (source in ('starting', 'logged')),
  achieved_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, exercise_key)
);

alter table public.exercise_prs enable row level security;

drop policy if exists "exercise_prs: client manages own" on public.exercise_prs;
create policy "exercise_prs: client manages own" on public.exercise_prs
  for all using (
    auth.uid() = client_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
  )
  with check (
    auth.uid() = client_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
  );

drop policy if exists "exercise_prs: coach reads assigned" on public.exercise_prs;
create policy "exercise_prs: coach reads assigned" on public.exercise_prs
  for select using (
    public.is_active_admin()
    or (public.is_active_coach() and public.is_my_client(client_id))
  );

-- Every time a record improves, a row lands here. Keeping the timeline
-- separate from the current record means the progress chart doesn't have to
-- re-derive history from every set ever logged.
create table if not exists public.exercise_pr_history (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  exercise_key text not null,
  exercise_name text not null,
  weight_kg numeric,
  reps int,
  estimated_1rm numeric,
  source text not null default 'logged' check (source in ('starting', 'logged')),
  achieved_at timestamptz not null default now()
);

create index if not exists exercise_pr_history_client_idx
  on public.exercise_pr_history (client_id, exercise_key, achieved_at);

alter table public.exercise_pr_history enable row level security;

drop policy if exists "exercise_pr_history: client manages own" on public.exercise_pr_history;
create policy "exercise_pr_history: client manages own" on public.exercise_pr_history
  for all using (
    auth.uid() = client_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
  )
  with check (
    auth.uid() = client_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
  );

drop policy if exists "exercise_pr_history: coach reads assigned" on public.exercise_pr_history;
create policy "exercise_pr_history: coach reads assigned" on public.exercise_pr_history
  for select using (
    public.is_active_admin()
    or (public.is_active_coach() and public.is_my_client(client_id))
  );

-- Admin panel reads (no auth.uid() session of its own).
create or replace function public.admin_list_prs(p_client_id uuid)
returns setof public.exercise_prs
language sql
stable
security definer
set search_path = public
as $$
  select * from public.exercise_prs
  where client_id = p_client_id
  order by updated_at desc;
$$;
