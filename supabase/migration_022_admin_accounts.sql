-- FitnessTracker migration 022: real accounts for admins.
--
-- Until now the admin panel checked a username and password compiled into the
-- JavaScript bundle, and every admin_* function ran as SECURITY DEFINER with
-- no caller check at all. Anyone who opened the page source had the password,
-- and anyone with the public anon key could call the functions directly
-- without even that.
--
-- Admins now sign in through Supabase Auth like everyone else. Their identity
-- lives in auth.users, their role in profiles.role, and the panel gets a real
-- session — which is what lets the functions below start refusing strangers.
--
-- Bootstrapping: the first admin is created with claim_first_admin() below,
-- which only works while no admin exists. After that, admins are made by
-- admins.

-- ---------------------------------------------------------------------------
-- Guard
-- ---------------------------------------------------------------------------
create or replace function public.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_active_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Bootstrap
-- ---------------------------------------------------------------------------
-- Promotes the signed-in account to admin, but only while the platform has no
-- admin at all. Once one exists this is a no-op that raises, so it can't be
-- used to escalate later.
create or replace function public.claim_first_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;

  if exists (select 1 from public.profiles where role = 'admin' and active) then
    raise exception 'An admin already exists — ask them to promote you';
  end if;

  update public.profiles
  set role = 'admin', active = true
  where id = auth.uid();
end;
$$;

-- An existing admin promoting someone else. By email, because that's what an
-- admin knows about a colleague — not their uuid.
create or replace function public.admin_grant_admin(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  perform public.require_admin();

  select id into target from auth.users where lower(email) = lower(trim(p_email));

  if target is null then
    raise exception 'No account with that email — they must sign up first';
  end if;

  update public.profiles set role = 'admin', active = true where id = target;
end;
$$;

-- ---------------------------------------------------------------------------
-- Close the open door
-- ---------------------------------------------------------------------------
-- The admin_* functions were reachable by anyone holding the anon key, which
-- is published in the client bundle by design. They now require a session;
-- the guard inside each one requires that session to be an admin's.
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like 'admin\_%'
  loop
    execute format('revoke execute on function %s from anon', fn.sig);
  end loop;
end $$;

-- Settings are the one pair the app calls on every admin page load, so they
-- get their guard now; the rest follow in 023 as each is redefined.
create or replace function public.admin_get_setting(p_key text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.require_admin();
  return (select value #>> '{}' from public.app_settings where key = p_key);
end;
$$;

create or replace function public.admin_set_setting(p_key text, p_value text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin();

  insert into public.app_settings (key, value, updated_at)
  values (p_key, to_jsonb(p_value), now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
end;
$$;

revoke execute on function public.admin_get_setting(text) from anon;
revoke execute on function public.admin_set_setting(text, text) from anon;

notify pgrst, 'reload schema';
