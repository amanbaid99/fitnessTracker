-- Nova migration 011: record which plan a completed workout belonged to.
--
-- The dashboard suggests the next training day by looking at the last one the
-- client finished and stepping forward through that plan's rotation. Day ids
-- ("day-1", "day-2", …) are only unique within a plan, so without this column
-- a workout logged against the coach's plan could be mistaken for progress
-- through the client's own plan, and vice versa.

alter table public.workout_logs
  add column if not exists plan_source text not null default 'coach';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workout_logs_plan_source_check'
  ) then
    alter table public.workout_logs
      add constraint workout_logs_plan_source_check
      check (plan_source in ('coach', 'custom'));
  end if;
end $$;
