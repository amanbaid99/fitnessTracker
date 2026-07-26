-- Nova migration 008: workout completion logs, body metrics, richer intake.

alter table public.plans add column if not exists height_cm numeric;
alter table public.plans add column if not exists weight_kg numeric;
alter table public.plans add column if not exists experience_level text
  check (experience_level in ('beginner', 'intermediate', 'advanced'));

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  plan_day_id text not null,
  completed_at timestamptz not null default now()
);

alter table public.workout_logs enable row level security;

drop policy if exists "workout_logs: client manages own" on public.workout_logs;
create policy "workout_logs: client manages own" on public.workout_logs
  for all using (
    auth.uid() = client_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
  )
  with check (
    auth.uid() = client_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
  );

create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  weight_kg numeric,
  body_fat_pct numeric,
  logged_at timestamptz not null default now()
);

alter table public.body_metrics enable row level security;

drop policy if exists "body_metrics: client manages own" on public.body_metrics;
create policy "body_metrics: client manages own" on public.body_metrics
  for all using (
    auth.uid() = client_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
  )
  with check (
    auth.uid() = client_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
  );
