-- Nova schema: run this once in the Supabase SQL Editor (Project > SQL Editor > New query).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'client' check (role in ('client', 'coach', 'admin')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  age int,
  goal text not null,
  medical_conditions text[] not null default '{}',
  medical_notes text,
  days jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'changes_requested')),
  coach_notes text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.plans enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: coaches read all" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('coach', 'admin'))
  );

create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

create policy "plans: client reads own" on public.plans
  for select using (auth.uid() = client_id);

create policy "plans: client inserts own" on public.plans
  for insert with check (auth.uid() = client_id);

create policy "plans: coach reads all" on public.plans
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('coach', 'admin'))
  );

create policy "plans: coach updates all" on public.plans
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('coach', 'admin'))
  );

-- After running this, promote your own test account to coach so you can see the
-- approval screen (run after you've signed up at least one account):
--
--   update public.profiles set role = 'coach' where id =
--     (select id from auth.users where email = 'your-coach-email@example.com');
