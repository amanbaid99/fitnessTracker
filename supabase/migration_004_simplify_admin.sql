-- Nova migration 004: simplify admin/coach access.
--
-- Admin login is now a hardcoded check in the app itself (admin/admin123),
-- not a Supabase account — there's no real auth.uid() session for it. These
-- functions let the admin panel manage coach/client accounts anyway, by
-- running with elevated privileges (SECURITY DEFINER) instead of relying on
-- row-level security tied to a logged-in admin session.
--
-- This intentionally trades some security rigor for simplicity, matching a
-- private/demo deployment. A production version would put real
-- authentication in front of these.

create or replace function public.admin_list_profiles(p_role text)
returns setof public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from public.profiles where role = p_role order by created_at desc;
$$;

create or replace function public.admin_set_active(p_id uuid, p_active boolean)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set active = p_active where id = p_id;
$$;

-- Called right after the admin panel signs a new coach up (via the normal
-- supabase.auth.signUp() client call, which is the reliable path) to flip
-- their role from the default 'client' to 'coach'.
create or replace function public.admin_promote_to_coach(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set role = 'coach' where id = p_id;
$$;
