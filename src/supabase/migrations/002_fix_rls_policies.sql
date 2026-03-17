-- Fix missing INSERT policies (RLS was blocking all inserts)

-- matches: allow authenticated users to create matches
create policy "matches_insert" on matches for insert
  with check (auth.uid() = user_a_id);

-- sessions: allow teacher/learner to create sessions
create policy "sessions_insert" on sessions for insert
  with check (auth.uid() = teacher_id or auth.uid() = learner_id);

-- learning_paths: allow users to create their own paths
create policy "learning_paths_insert" on learning_paths for insert
  with check (auth.uid() = user_id);

-- assessment_sessions: allow users to create their own sessions
create policy "assessment_sessions_insert" on assessment_sessions for insert
  with check (auth.uid() = user_id);
