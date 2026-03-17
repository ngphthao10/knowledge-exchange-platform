-- Credentials table: CV, certificates, awards, portfolio
create table credentials (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(user_id) on delete cascade not null,
  type text not null check (type in ('cv', 'certificate', 'award', 'portfolio', 'other')),
  title text not null,
  file_url text not null,
  file_name text not null,
  file_size integer,
  created_at timestamptz default now()
);

alter table credentials enable row level security;

-- Anyone can view credentials (builds trust)
create policy "credentials_select" on credentials for select using (true);
-- Only owner can insert/delete
create policy "credentials_insert" on credentials for insert with check (auth.uid() = user_id);
create policy "credentials_delete" on credentials for delete using (auth.uid() = user_id);
  
-- Storage bucket: run this in Supabase Dashboard > Storage > New bucket
-- Bucket name: "credentials", Public: true
-- Or via SQL:
-- insert into storage.buckets (id, name, public) values ('credentials', 'credentials', true);
-- create policy "credentials_storage_select" on storage.objects for select using (bucket_id = 'credentials');
-- create policy "credentials_storage_insert" on storage.objects for insert with check (bucket_id = 'credentials' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "credentials_storage_delete" on storage.objects for delete using (bucket_id = 'credentials' and auth.uid()::text = (storage.foldername(name))[1]);
