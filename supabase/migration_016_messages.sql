-- Nova migration 016: member ↔ coach chat.
--
-- One thread per member, identified by client_id. A coach sees the threads of
-- the clients on their roster and nobody else's; an admin sees everything.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  -- Whose thread this is — always the member, whoever wrote the message.
  client_id uuid not null references public.profiles (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  sender_role text not null check (sender_role in ('client', 'coach', 'admin')),
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_thread_idx
  on public.messages (client_id, created_at desc);

alter table public.messages enable row level security;

drop policy if exists "messages: client reads own thread" on public.messages;
create policy "messages: client reads own thread" on public.messages
  for select using (
    auth.uid() = client_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
  );

drop policy if exists "messages: client writes own thread" on public.messages;
create policy "messages: client writes own thread" on public.messages
  for insert with check (
    auth.uid() = client_id
    and auth.uid() = sender_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
  );

drop policy if exists "messages: coach reads assigned threads" on public.messages;
create policy "messages: coach reads assigned threads" on public.messages
  for select using (
    public.is_active_admin()
    or (public.is_active_coach() and public.is_my_client(client_id))
  );

-- A coach can only post into a thread of their own client, and only as
-- themselves — no writing on someone else's behalf.
drop policy if exists "messages: coach writes assigned threads" on public.messages;
create policy "messages: coach writes assigned threads" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and (
      public.is_active_admin()
      or (public.is_active_coach() and public.is_my_client(client_id))
    )
  );

-- Marking messages read is the only update anyone makes.
drop policy if exists "messages: participants mark read" on public.messages;
create policy "messages: participants mark read" on public.messages
  for update using (
    auth.uid() = client_id
    or public.is_active_admin()
    or (public.is_active_coach() and public.is_my_client(client_id))
  );

-- Realtime delivery: without this the client subscribes successfully but
-- never receives a row.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- The admin panel (hardcoded login) reading a thread.
create or replace function public.admin_list_messages(p_client_id uuid)
returns setof public.messages
language sql
stable
security definer
set search_path = public
as $$
  select * from public.messages
  where client_id = p_client_id
  order by created_at;
$$;
