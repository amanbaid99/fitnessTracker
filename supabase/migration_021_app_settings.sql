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

-- Both RPCs speak plain text rather than jsonb. PostgREST matches functions by
-- argument name *and* type, and a jsonb parameter is the kind of thing that
-- resolves differently depending on how the client serialises the body — text
-- has no such ambiguity. The column stays jsonb for future settings that
-- aren't strings.
--
-- The drops matter: if an earlier jsonb version of these already exists, both
-- signatures would live side by side and PostgREST would refuse to choose.
drop function if exists public.admin_get_setting(text);
drop function if exists public.admin_set_setting(text, jsonb);
drop function if exists public.admin_set_setting(text, text);

create or replace function public.admin_get_setting(p_key text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  -- #>> '{}' unwraps a jsonb scalar to its plain text value.
  select value #>> '{}' from public.app_settings where key = p_key;
$$;

create or replace function public.admin_set_setting(p_key text, p_value text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.app_settings (key, value, updated_at)
  values (p_key, to_jsonb(p_value), now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
$$;

-- PostgREST caches the schema; without this the new functions stay invisible
-- until the API restarts on its own.
notify pgrst, 'reload schema';
