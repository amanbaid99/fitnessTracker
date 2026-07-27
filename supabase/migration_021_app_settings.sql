-- Nova migration 021: gym-wide settings.
--
-- First setting is how new plans get drafted:
--
--   'ai'     — Nova calls Claude with the assessment (the default)
--   'static' — no API call at all; the closest admin template, or the closest
--              built-in preset if there are no templates yet
--
-- Static mode exists so the gym can keep taking clients when the API key is
-- missing, spend is capped, or someone simply wants predictable programmes.
-- The edge function reads this on every run, so flipping it takes effect on
-- the next assessment with nothing to redeploy.

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('generation_mode', '"ai"'::jsonb)
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

-- Staff can see the settings; nobody writes through RLS. The admin panel has
-- no Supabase session (it's the hardcoded staff login), so writes go through
-- the SECURITY DEFINER function below, matching every other admin_* action.
drop policy if exists "settings: staff read" on public.app_settings;
create policy "settings: staff read" on public.app_settings
  for select using (public.is_active_admin() or public.is_active_coach());

create or replace function public.admin_get_setting(p_key text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select value from public.app_settings where key = p_key;
$$;

create or replace function public.admin_set_setting(p_key text, p_value jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.app_settings (key, value, updated_at)
  values (p_key, p_value, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
$$;
