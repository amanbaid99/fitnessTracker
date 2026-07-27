-- Nova migration 020: stop the profiles policies recursing.
--
-- Symptom: every read of `profiles` — and so every page in the app — failed
-- with "infinite recursion detected in policy for relation profiles".
--
-- Cause: a row-level policy *on* profiles that runs a subquery *against*
-- profiles re-enters its own policy set, and Postgres refuses. Two policies
-- did this: the client-reads-own-coach rule added in 018, and the original
-- admin rule from 002.
--
-- Fix: the same trick migration 012 already uses everywhere else — put the
-- lookup in a SECURITY DEFINER function. Those run outside RLS, so the policy
-- asks a plain question and never re-enters itself.
--
-- Safe to run on a database that's already had 018 applied; it only replaces
-- policies and adds functions.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.my_coach_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select assigned_coach_id from public.profiles where id = auth.uid();
$$;

-- "Is the person calling a real, active account?" — used by policies on other
-- tables so they don't have to reach into profiles and drag its RLS along.
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- 018's version inlined `select assigned_coach_id from public.profiles`.
drop policy if exists "profiles: client reads own coach" on public.profiles;
create policy "profiles: client reads own coach" on public.profiles
  for select using (role = 'coach' and id = public.my_coach_id());

-- 002's version inlined `exists (select 1 from public.profiles p ...)`.
drop policy if exists "profiles: admin manages all" on public.profiles;
create policy "profiles: admin manages all" on public.profiles
  for all using (public.is_active_admin());

-- ---------------------------------------------------------------------------
-- assessments
-- ---------------------------------------------------------------------------
-- Same shape of problem one table over: these reached into profiles, which
-- meant every assessment read evaluated the profiles policies too.
drop policy if exists "assessments: client manages own" on public.assessments;
create policy "assessments: client manages own" on public.assessments
  for all using (auth.uid() = client_id and public.is_active_user())
  with check (auth.uid() = client_id and public.is_active_user());
