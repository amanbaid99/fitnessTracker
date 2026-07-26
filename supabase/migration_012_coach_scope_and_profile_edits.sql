-- Nova migration 012: scope coaches to their own clients, and let the admin
-- panel edit staff details.
--
-- Until now a coach could read every profile and every plan in the database.
-- The UI only ever showed them their own clients, but the rules underneath
-- didn't say so. These policies make the database agree with the product.

-- Policies that need "is the caller a coach/admin?" previously sub-queried
-- public.profiles from inside a policy *on* public.profiles. These definer
-- helpers answer the same question without re-entering the policy, which is
-- both cheaper and free of recursion risk.
create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active
  );
$$;

create or replace function public.is_active_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'coach' and active
  );
$$;

-- Is this client on the calling coach's roster?
create or replace function public.is_my_client(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_client_id and assigned_coach_id = auth.uid()
  );
$$;

-- Profiles: a coach sees only the clients assigned to them (their own row is
-- already covered by the "read own" policy from schema.sql).
drop policy if exists "profiles: coaches read all" on public.profiles;
drop policy if exists "profiles: coach reads assigned" on public.profiles;
create policy "profiles: coach reads assigned" on public.profiles
  for select using (
    public.is_active_admin()
    or (public.is_active_coach() and assigned_coach_id = auth.uid())
  );

-- ...and can only deactivate/reactivate those same clients.
drop policy if exists "profiles: coach updates client active state" on public.profiles;
create policy "profiles: coach updates assigned clients" on public.profiles
  for update using (
    role = 'client'
    and assigned_coach_id = auth.uid()
    and public.is_active_coach()
  );

-- Plans follow the same roster.
drop policy if exists "plans: coach reads all" on public.plans;
create policy "plans: coach reads assigned" on public.plans
  for select using (
    public.is_active_admin()
    or (public.is_active_coach() and public.is_my_client(client_id))
  );

drop policy if exists "plans: coach updates all" on public.plans;
create policy "plans: coach updates assigned" on public.plans
  for update using (
    public.is_active_admin()
    or (public.is_active_coach() and public.is_my_client(client_id))
  );

drop policy if exists "exercise_logs: coach reads assigned" on public.exercise_logs;
create policy "exercise_logs: coach reads assigned" on public.exercise_logs
  for select using (
    public.is_active_admin()
    or (public.is_active_coach() and public.is_my_client(client_id))
  );

-- A coach building a plan from scratch (migration 010) must own that client.
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
  if not (public.is_active_admin() or (public.is_active_coach() and public.is_my_client(p_client_id))) then
    raise exception 'You can only create plans for your own clients';
  end if;

  select full_name into client_name from public.profiles where id = p_client_id;

  insert into public.plans (client_id, full_name, goal, medical_conditions, days, status)
  values (p_client_id, coalesce(client_name, ''), p_goal, '{}', p_days, 'pending')
  returning id into new_id;

  return new_id;
end;
$$;

-- The admin panel has no auth.uid() session (its login is hardcoded in the
-- app), so staff management goes through definer functions as before.

-- Profiles carry no email — it lives in auth.users — but the admin needs to
-- see the login ID they handed out, so join it here.
create or replace function public.admin_list_staff(p_role text)
returns table (
  id uuid,
  full_name text,
  role text,
  active boolean,
  assigned_coach_id uuid,
  must_change_password boolean,
  email text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.role, p.active, p.assigned_coach_id,
         p.must_change_password, u.email::text, p.created_at
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.role = p_role
  order by p.created_at desc;
$$;

-- Edit a coach's (or member's) details. Null arguments leave that field alone,
-- so the caller can update just the name, or just the password flag.
create or replace function public.admin_update_profile(
  p_id uuid,
  p_full_name text default null,
  p_must_change_password boolean default null
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
      must_change_password = coalesce(p_must_change_password, must_change_password)
  where id = p_id;
$$;

-- A coach adding their own client assigns it to themselves. Same shape as
-- admin_assign_coach, but it can't be pointed at another coach's roster.
create or replace function public.coach_claim_client(p_client_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_active_coach() then
    raise exception 'Only an active coach can claim a client';
  end if;

  update public.profiles
  set assigned_coach_id = auth.uid()
  where id = p_client_id and role = 'client';
end;
$$;
