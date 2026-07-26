-- Nova migration 005: force a password change on a coach's first login.

alter table public.profiles add column if not exists must_change_password boolean not null default false;

-- admin_promote_to_coach now also flags the account so the app forces a
-- password change the first time this coach logs in.
create or replace function public.admin_promote_to_coach(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set role = 'coach', must_change_password = true where id = p_id;
$$;
