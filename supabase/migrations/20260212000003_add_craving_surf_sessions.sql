-- Migration: Add craving_surf_sessions table
-- Timestamp: 20260212000003
-- Description: Creates craving_surf_sessions table for urge surfing sessions with encrypted fields

CREATE TABLE IF NOT EXISTS craving_surf_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  encrypted_initial_rating TEXT NOT NULL,
  encrypted_final_rating TEXT,
  encrypted_distraction_used TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_craving_surf_sessions_user
  ON craving_surf_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_craving_surf_sessions_created
  ON craving_surf_sessions(created_at DESC);

CREATE TRIGGER update_craving_surf_sessions_updated_at
  BEFORE UPDATE ON craving_surf_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE craving_surf_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own craving surf sessions"
  ON craving_surf_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own craving surf sessions"
  ON craving_surf_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own craving surf sessions"
  ON craving_surf_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own craving surf sessions"
  ON craving_surf_sessions FOR DELETE
  USING (auth.uid() = user_id);
