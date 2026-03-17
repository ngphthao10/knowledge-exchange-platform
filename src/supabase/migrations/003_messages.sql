-- Messages table for real-time chat between accepted matches
create table messages (
  id         uuid default gen_random_uuid() primary key,
  match_id   uuid references matches(id) on delete cascade not null,
  sender_id  uuid references profiles(user_id) on delete cascade not null,
  content    text not null check (char_length(content) > 0 and char_length(content) <= 4000),
  created_at timestamptz default now() not null
);

create index messages_match_id_idx on messages (match_id, created_at asc);

alter table messages enable row level security;

-- Only match participants can read messages
create policy "messages_select" on messages for select
  using (
    exists (
      select 1 from matches m
      where m.id = match_id
        and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

-- Only participants of an ACCEPTED match can send messages
create policy "messages_insert" on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from matches m
      where m.id = match_id
        and m.status = 'accepted'
        and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

-- IMPORTANT: Enable Realtime for this table in Supabase Dashboard
-- Database → Replication → add "messages" table to supabase_realtime publication
-- Or run: alter publication supabase_realtime add table messages;
