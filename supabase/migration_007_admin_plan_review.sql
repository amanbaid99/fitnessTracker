-- Nova migration 007: let the hardcoded admin review and approve plans too.

create or replace function public.admin_list_plans()
returns setof public.plans
language sql
stable
security definer
set search_path = public
as $$
  select * from public.plans order by created_at desc;
$$;

create or replace function public.admin_update_plan_status(p_id uuid, p_status text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.plans
  set status = p_status,
      approved_at = case when p_status = 'approved' then now() else null end
  where id = p_id;
$$;
