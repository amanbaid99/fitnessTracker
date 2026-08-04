-- FitnessTracker migration 023: a bootstrap that works where you actually run it.
--
-- 022 shipped claim_first_admin(), which promotes the *signed-in* caller. That
-- is fine from the browser and useless in the SQL editor, which runs as the
-- service role with no auth.uid() — so the documented bootstrap failed with
-- "Sign in first" for anyone following the README.
--
-- This one takes an email instead, so it can be run from the SQL editor where
-- a new project's first admin is realistically created.
--
-- Execute is revoked from anon and authenticated: only the service role — the
-- SQL editor, or a server holding the service key — can call it. That is the
-- correct boundary for a function whose whole job is granting admin.

create or replace function public.bootstrap_admin(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
  existing int;
begin
  select count(*) into existing
  from public.profiles where role = 'admin' and active;

  if existing > 0 then
    raise exception 'An admin already exists — promote others with admin_grant_admin()';
  end if;

  select id into target
  from auth.users
  where lower(email) = lower(trim(p_email));

  if target is null then
    raise exception 'No account with that email. Sign up at /auth/register first, then run this again.';
  end if;

  update public.profiles
  set role = 'admin', active = true
  where id = target;

  return format('%s is now an admin', p_email);
end;
$$;

revoke execute on function public.bootstrap_admin(text) from anon, authenticated;

notify pgrst, 'reload schema';

-- Run it:
--   select public.bootstrap_admin('you@example.com');
