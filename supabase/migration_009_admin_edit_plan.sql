-- Nova migration 009: let the hardcoded admin save edits to a plan's workout.

create or replace function public.admin_save_plan(p_id uuid, p_days jsonb, p_coach_notes text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.plans
  set days = p_days, coach_notes = p_coach_notes
  where id = p_id;
$$;
