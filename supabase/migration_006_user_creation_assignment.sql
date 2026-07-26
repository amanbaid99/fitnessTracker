-- Nova migration 006: admin-created client accounts + client-to-coach assignment.

alter table public.profiles add column if not exists assigned_coach_id uuid references public.profiles (id);

create or replace function public.admin_assign_coach(p_client_id uuid, p_coach_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set assigned_coach_id = p_coach_id where id = p_client_id;
$$;

-- Same pattern as admin_promote_to_coach, but for a plain client account the
-- admin created directly (no role change needed — 'client' is the default).
create or replace function public.admin_flag_password_change(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set must_change_password = true where id = p_id;
$$;
