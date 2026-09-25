-- FitnessTracker migration 024: keep the project awake.
--
-- Supabase pauses a free-tier project after roughly a week with no activity,
-- and waking it is manual. A scheduled job calls ping() once a day — see
-- .github/workflows/keepalive.yml — which is enough to keep the project live
-- with several days of margin if a run is skipped.
--
-- Why a dedicated function rather than selecting from a real table: the ping
-- has to work with the anon key, and every real table is behind row-level
-- security that (correctly) returns nothing to an anonymous caller. Tying the
-- keepalive to whatever table happens to be readable today would make it
-- silently stop working the first time a policy changed.

create table if not exists public.keepalive (
  id boolean primary key default true,
  -- One row, forever. The constraint is what enforces that.
  constraint keepalive_single_row check (id),
  last_ping timestamptz not null default now(),
  ping_count bigint not null default 0
);

insert into public.keepalive (id) values (true) on conflict (id) do nothing;

alter table public.keepalive enable row level security;
-- No policies: nothing reads this table through the API. The function below
-- is SECURITY DEFINER and is the only way in.

create or replace function public.ping()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  pinged timestamptz;
begin
  update public.keepalive
  set last_ping = now(), ping_count = ping_count + 1
  where id
  returning last_ping into pinged;

  return pinged;
end;
$$;

-- Deliberately callable without a session: the scheduled job has no user to
-- sign in as. It writes one timestamp to one row and reveals nothing.
grant execute on function public.ping() to anon, authenticated;

notify pgrst, 'reload schema';

-- Check on it any time with:
--   select last_ping, ping_count, now() - last_ping as since from public.keepalive;
