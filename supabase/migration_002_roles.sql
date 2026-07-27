-- Nova migration 002: admin/coach user management + seeded admin & coach accounts.
-- Run this once in the Supabase SQL Editor, after schema.sql has already been run.

alter table public.profiles add column if not exists active boolean not null default true;

-- Emails an admin or coach has "added" ahead of time. When someone signs up
-- with a matching email, they're assigned this role automatically instead of
-- the default 'client'. This lets admins/coaches grant access without ever
-- needing Supabase's secret admin key in the browser.
create table if not exists public.invited_roles (
  email text primary key,
  role text not null check (role in ('client', 'coach')),
  invited_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.invited_roles enable row level security;

-- Re-scope the coach/admin read policies from schema.sql to also require the
-- caller's own account still be active — otherwise a "removed" coach or
-- admin could keep calling the database directly even though the UI blocks
-- them, since deactivation is just a flag, not a revoked session.
drop policy if exists "profiles: coaches read all" on public.profiles;
create policy "profiles: coaches read all" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('coach', 'admin') and p.active
    )
  );

drop policy if exists "plans: coach reads all" on public.plans;
create policy "plans: coach reads all" on public.plans
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('coach', 'admin') and p.active
    )
  );

drop policy if exists "plans: coach updates all" on public.plans;
create policy "plans: coach updates all" on public.plans
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('coach', 'admin') and p.active
    )
  );

-- A deactivated client should also lose access to their own plan, not just
-- coaches/admins.
drop policy if exists "plans: client reads own" on public.plans;
create policy "plans: client reads own" on public.plans
  for select using (
    auth.uid() = client_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
  );

drop policy if exists "plans: client inserts own" on public.plans;
create policy "plans: client inserts own" on public.plans
  for insert with check (
    auth.uid() = client_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
  );

create policy "invited_roles: admin manages all" on public.invited_roles
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.active)
  );

create policy "invited_roles: coach manages client invites" on public.invited_roles
  for all using (
    role = 'client'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'coach' and p.active)
  )
  with check (
    role = 'client'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'coach' and p.active)
  );

-- Replace the signup trigger so invited emails pick up their assigned role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  assigned_role text;
begin
  select role into assigned_role from public.invited_roles where email = new.email;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(assigned_role, 'client')
  );

  delete from public.invited_roles where email = new.email;

  return new;
end;
$$;

-- Admins manage every profile (role + active state) — but only while their
-- own account is still active.
-- NOTE: this inline subquery makes the policy re-enter itself, which Postgres
-- rejects with "infinite recursion detected in policy for relation profiles".
-- Migration 020 replaces it with public.is_active_admin(). Left here as it
-- originally shipped so the migration history still reads true.
create policy "profiles: admin manages all" on public.profiles
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.active)
  );

-- Coaches can deactivate/reactivate client profiles only (not other coaches),
-- and only while their own account is still active.
create policy "profiles: coach updates client active state" on public.profiles
  for update using (
    role = 'client'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'coach' and p.active)
  );

-- Seed the two fixed accounts. This bypasses the app's normal signup flow
-- entirely (writes straight into Supabase's auth tables), so the password
-- length rules that normally apply to sign-up don't apply here — the exact
-- passwords requested are used as-is.
create extension if not exists pgcrypto;

do $$
declare
  admin_id uuid := gen_random_uuid();
  coach_id uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email = 'admin@nova.local') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) values (
      '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
      'admin@nova.local', crypt('Admin', gen_salt('bf')), now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Admin"}'
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), admin_id, admin_id::text,
      jsonb_build_object('sub', admin_id::text, 'email', 'admin@nova.local'),
      'email', now(), now(), now()
    );

    insert into public.profiles (id, full_name, role) values (admin_id, 'Admin', 'admin');
  end if;

  if not exists (select 1 from auth.users where email = 'coach@nova.local') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) values (
      '00000000-0000-0000-0000-000000000000', coach_id, 'authenticated', 'authenticated',
      'coach@nova.local', crypt('Coachpassword', gen_salt('bf')), now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Coach"}'
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), coach_id, coach_id::text,
      jsonb_build_object('sub', coach_id::text, 'email', 'coach@nova.local'),
      'email', now(), now(), now()
    );

    insert into public.profiles (id, full_name, role) values (coach_id, 'Coach', 'coach');
  end if;
end $$;

-- Login credentials created by this script:
--   Admin — email admin@nova.local (log in with just "admin") / password: Admin
--   Coach — email coach@nova.local (log in with just "coach") / password: Coachpassword
