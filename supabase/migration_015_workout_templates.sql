-- Nova migration 015: shared workout templates.
--
-- Templates are reusable programs staff can assign to members. Ownership
-- decides who may change one:
--
--   admin templates  — every coach can see and use them, none can edit them
--   coach templates  — every coach can see and use them; only the coach who
--                      wrote it (or an admin) can change or delete it

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  days jsonb not null default '[]'::jsonb,
  days_per_week int,
  -- Null when written from the admin panel, which has no Supabase session.
  created_by uuid references public.profiles (id) on delete set null,
  owner_role text not null default 'coach' check (owner_role in ('admin', 'coach')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_templates_owner_idx
  on public.workout_templates (owner_role, created_by);

alter table public.workout_templates enable row level security;

-- Everyone on staff can read every template — that's the point of sharing.
drop policy if exists "templates: staff read all" on public.workout_templates;
create policy "templates: staff read all" on public.workout_templates
  for select using (public.is_active_coach() or public.is_active_admin());

drop policy if exists "templates: coach creates own" on public.workout_templates;
create policy "templates: coach creates own" on public.workout_templates
  for insert with check (
    public.is_active_coach()
    and created_by = auth.uid()
    and owner_role = 'coach'
  );

-- A coach may only rewrite their own, and may not promote it to an admin
-- template. Admin-owned rows are read-only to every coach.
drop policy if exists "templates: coach updates own" on public.workout_templates;
create policy "templates: coach updates own" on public.workout_templates
  for update using (
    public.is_active_coach() and created_by = auth.uid() and owner_role = 'coach'
  )
  with check (
    created_by = auth.uid() and owner_role = 'coach'
  );

drop policy if exists "templates: coach deletes own" on public.workout_templates;
create policy "templates: coach deletes own" on public.workout_templates
  for delete using (
    public.is_active_coach() and created_by = auth.uid() and owner_role = 'coach'
  );

-- Real admin accounts (not the hardcoded panel login) manage everything.
drop policy if exists "templates: admin manages all" on public.workout_templates;
create policy "templates: admin manages all" on public.workout_templates
  for all using (public.is_active_admin()) with check (public.is_active_admin());

-- The admin panel signs in against a hardcoded credential rather than
-- Supabase, so its writes go through definer functions as elsewhere.
create or replace function public.admin_list_templates()
returns table (
  id uuid,
  name text,
  description text,
  days jsonb,
  days_per_week int,
  created_by uuid,
  owner_name text,
  owner_role text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select t.id, t.name, t.description, t.days, t.days_per_week, t.created_by,
         coalesce(p.full_name, 'Admin') as owner_name, t.owner_role,
         t.created_at, t.updated_at
  from public.workout_templates t
  left join public.profiles p on p.id = t.created_by
  order by t.updated_at desc;
$$;

create or replace function public.admin_save_template(
  p_id uuid,
  p_name text,
  p_description text,
  p_days jsonb,
  p_days_per_week int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_id uuid;
begin
  if p_id is null then
    insert into public.workout_templates (name, description, days, days_per_week, owner_role)
    values (p_name, p_description, p_days, p_days_per_week, 'admin')
    returning id into saved_id;
  else
    update public.workout_templates
    set name = p_name,
        description = p_description,
        days = p_days,
        days_per_week = p_days_per_week,
        updated_at = now()
    where id = p_id
    returning id into saved_id;
  end if;

  return saved_id;
end;
$$;

create or replace function public.admin_delete_template(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.workout_templates where id = p_id;
$$;

-- Assigning a starting plan at account-creation time. Plans are otherwise
-- insert-only by the member themselves, so staff need a definer path.
create or replace function public.admin_create_plan(
  p_client_id uuid,
  p_goal text default 'general-fitness',
  p_days jsonb default '[]'::jsonb,
  p_status text default 'approved',
  p_preset_id text default null
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
  select full_name into client_name from public.profiles where id = p_client_id;

  insert into public.plans (
    client_id, full_name, goal, medical_conditions, days, status, approved_at, preset_id
  )
  values (
    p_client_id, coalesce(client_name, ''), p_goal, '{}', p_days, p_status,
    case when p_status = 'approved' then now() else null end,
    p_preset_id
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- Coaches get the same ability for their own clients, with the roster check
-- from migration 012 still enforced.
create or replace function public.coach_create_plan(
  p_client_id uuid,
  p_goal text default 'general-fitness',
  p_days jsonb default '[]'::jsonb,
  p_status text default 'pending',
  p_preset_id text default null
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

  insert into public.plans (
    client_id, full_name, goal, medical_conditions, days, status, approved_at, preset_id
  )
  values (
    p_client_id, coalesce(client_name, ''), p_goal, '{}', p_days, p_status,
    case when p_status = 'approved' then now() else null end,
    p_preset_id
  )
  returning id into new_id;

  return new_id;
end;
$$;
