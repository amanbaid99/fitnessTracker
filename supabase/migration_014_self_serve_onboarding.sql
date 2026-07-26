-- Nova migration 014: self-serve sign-up.
--
-- New members register with just an email, name and password, fill in a short
-- details step, then pick a ready-made plan (or ask for a coach-built one).
-- Existing accounts are untouched: their plans already exist, so they go
-- straight to the dashboard as before.

-- Basic details now live on the profile. They're collected before a plan
-- exists, and they outlive any individual plan, so the profile is the right
-- home for them — each new plan copies them across for the coach to read.
alter table public.profiles add column if not exists age int;
alter table public.profiles add column if not exists height_cm numeric;
alter table public.profiles add column if not exists weight_kg numeric;
alter table public.profiles add column if not exists experience_level text;
alter table public.profiles add column if not exists goal text;
alter table public.profiles add column if not exists details_completed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_experience_level_check'
  ) then
    alter table public.profiles
      add constraint profiles_experience_level_check
      check (experience_level is null or experience_level in ('beginner', 'intermediate', 'advanced'));
  end if;
end $$;

-- Which ready-made split the plan came from (null for coach-built or custom),
-- and whether the member asked for a coach rather than self-serving.
alter table public.plans add column if not exists preset_id text;
alter table public.plans add column if not exists wants_coach boolean not null default false;

-- Free-tier plans are created already approved, so a self-serve member trains
-- immediately. The extra intake a coach needs is only asked for on the
-- coach-built path.
alter table public.plans add column if not exists intake jsonb;

-- Everything a self-serve member fills in is optional up front, so the strict
-- not-null on goal would block the "pick a plan first, refine later" flow.
alter table public.plans alter column goal drop not null;
