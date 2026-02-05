-- ============================================
-- Supabase Migration: Additional Tables
-- ============================================
-- This migration adds tables that exist locally but are missing in Supabase.
-- Run this in Supabase SQL Editor AFTER the base schema and daily_checkins migration.
--
-- Dashboard > SQL Editor > New Query > Paste and Run

-- ============================================
-- FAVORITE MEETINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS favorite_meetings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meeting_id TEXT NOT NULL,
  notes TEXT, -- Encrypted on client
  notification_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, meeting_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_meetings_user ON favorite_meetings(user_id);

ALTER TABLE favorite_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorite meetings"
  ON favorite_meetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorite meetings"
  ON favorite_meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorite meetings"
  ON favorite_meetings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite meetings"
  ON favorite_meetings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- READING REFLECTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS reading_reflections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reading_id TEXT NOT NULL,
  reading_date DATE NOT NULL,
  encrypted_reflection TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reading_date)
);

CREATE INDEX IF NOT EXISTS idx_reading_reflections_user ON reading_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_reflections_date ON reading_reflections(reading_date);

ALTER TABLE reading_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading reflections"
  ON reading_reflections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading reflections"
  ON reading_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading reflections"
  ON reading_reflections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading reflections"
  ON reading_reflections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- WEEKLY REPORTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  report_json TEXT NOT NULL, -- Encrypted on client
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_user ON weekly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON weekly_reports(week_start);

ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly reports"
  ON weekly_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly reports"
  ON weekly_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly reports"
  ON weekly_reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly reports"
  ON weekly_reports FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SPONSOR CONNECTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS sponsor_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('sponsee', 'sponsor')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'connected')),
  invite_code TEXT NOT NULL,
  display_name TEXT,
  own_public_key TEXT NOT NULL,
  peer_public_key TEXT,
  shared_key TEXT,
  pending_private_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, invite_code, role)
);

CREATE INDEX IF NOT EXISTS idx_sponsor_connections_user ON sponsor_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_connections_status ON sponsor_connections(status);
CREATE INDEX IF NOT EXISTS idx_sponsor_connections_invite ON sponsor_connections(invite_code);

ALTER TABLE sponsor_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sponsor connections"
  ON sponsor_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sponsor connections"
  ON sponsor_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sponsor connections"
  ON sponsor_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sponsor connections"
  ON sponsor_connections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SPONSOR SHARED ENTRIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS sponsor_shared_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_id UUID REFERENCES sponsor_connections(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('outgoing', 'incoming', 'comment')),
  journal_entry_id TEXT,
  payload TEXT NOT NULL, -- Encrypted on client
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsor_shared_entries_connection ON sponsor_shared_entries(connection_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_shared_entries_user ON sponsor_shared_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_shared_entries_entry ON sponsor_shared_entries(journal_entry_id);

ALTER TABLE sponsor_shared_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shared entries"
  ON sponsor_shared_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shared entries"
  ON sponsor_shared_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shared entries"
  ON sponsor_shared_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shared entries"
  ON sponsor_shared_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ADD MISSING COLUMNS TO DAILY_CHECKINS
-- ============================================

-- Add day_rating column (for craving inversion: high craving = low rating)
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS day_rating INTEGER CHECK (day_rating >= 1 AND day_rating <= 10);

-- Add gratitude column (encrypted on client)
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS gratitude TEXT;

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE TRIGGER update_favorite_meetings_updated_at
  BEFORE UPDATE ON favorite_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_reflections_updated_at
  BEFORE UPDATE ON reading_reflections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsor_connections_updated_at
  BEFORE UPDATE ON sponsor_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsor_shared_entries_updated_at
  BEFORE UPDATE ON sponsor_shared_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Uncomment to verify the tables were created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('favorite_meetings', 'reading_reflections', 'weekly_reports', 'sponsor_connections', 'sponsor_shared_entries');

-- Verify RLS policies:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
