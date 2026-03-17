-- Enable pgvector for semantic matching
create extension if not exists vector;

-- Profiles table
create table profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  full_name text not null,
  bio text default '',
  avatar_url text,
  skills_teach jsonb default '[]'::jsonb,
  skills_learn jsonb default '[]'::jsonb,
  availability text[] default '{}',
  timezone text default 'Asia/Ho_Chi_Minh',
  assessment_completed boolean default false,
  skill_embedding vector(768),        -- Gemini embedding for matching
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Matches table
create table matches (
  id uuid default gen_random_uuid() primary key,
  user_a_id uuid references profiles(user_id) not null,
  user_b_id uuid references profiles(user_id) not null,
  match_score float not null,
  match_reason text not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  unique(user_a_id, user_b_id)
);

-- Sessions table
create table sessions (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references matches(id) not null,
  teacher_id uuid references profiles(user_id) not null,
  learner_id uuid references profiles(user_id) not null,
  skill_topic text not null,
  scheduled_at timestamptz not null,
  duration_minutes integer default 90,
  meet_link text not null,
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  notes text,
  rating integer check (rating between 1 and 5),
  created_at timestamptz default now()
);

-- Learning paths table
create table learning_paths (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(user_id) not null,
  skill_name text not null,
  current_level text not null,
  target_level text not null,
  weekly_goal text not null,
  resources jsonb default '[]'::jsonb,
  milestones jsonb default '[]'::jsonb,
  generated_at timestamptz default now()
);

-- Assessment history (store conversation for context)
create table assessment_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(user_id) not null,
  skill_name text not null,
  messages jsonb default '[]'::jsonb,
  final_score float,
  final_level text,
  completed boolean default false,
  created_at timestamptz default now()
);

-- RLS Policies
alter table profiles enable row level security;
alter table matches enable row level security;
alter table sessions enable row level security;
alter table learning_paths enable row level security;
alter table assessment_sessions enable row level security;

-- Profiles: users only see/edit own profile
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update" on profiles for update using (auth.uid() = user_id);

-- Matches: users see matches involving them
create policy "matches_select" on matches for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);
create policy "matches_update" on matches for update
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- Sessions: users see sessions involving them
create policy "sessions_select" on sessions for select
  using (auth.uid() = teacher_id or auth.uid() = learner_id);
create policy "sessions_insert" on sessions for insert
  with check (auth.uid() = teacher_id or auth.uid() = learner_id);
create policy "sessions_update" on sessions for update
  using (auth.uid() = teacher_id or auth.uid() = learner_id);

-- Learning paths: own only
create policy "learning_paths_all" on learning_paths for all using (auth.uid() = user_id);
create policy "assessment_sessions_all" on assessment_sessions for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'User'));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at();

-- Vector similarity search function
create or replace function match_profiles(
  query_embedding vector(768),
  current_user_id uuid,
  match_threshold float default 0.5,
  match_count int default 10
)
returns table (
  user_id uuid,
  similarity float
)
language sql stable as $$
  select
    p.user_id,
    1 - (p.skill_embedding <=> query_embedding) as similarity
  from profiles p
  where
    p.user_id != current_user_id
    and p.skill_embedding is not null
    and p.assessment_completed = true
    and 1 - (p.skill_embedding <=> query_embedding) > match_threshold
  order by p.skill_embedding <=> query_embedding
  limit match_count;
$$;
