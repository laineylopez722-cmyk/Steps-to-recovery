-- ============================================
-- Steps to Recovery - Supabase Database Schema
-- ============================================
-- This is the COMPLETE base schema. Apply this first, then run migrations
-- in supabase/migrations/ for additional tables.
--
-- Dashboard > SQL Editor > New Query > Paste and Run
--
-- Tables defined here: profiles, journal_entries, step_work, sponsorships
-- Tables defined in migrations: daily_checkins, favorite_meetings,
--   reading_reflections, weekly_reports, sponsor_connections,
--   sponsor_shared_entries, risky_contacts, close_calls,
--   sponsor_notifications, meeting_reflections, crisis_checkpoints,
--   ai_usage, user_ai_settings

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  sobriety_start_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries table (encrypted content)
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Encrypted on client
  mood TEXT,
  tags TEXT[], -- Array of tags
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with UUID[], -- Array of sponsor user IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step work table (encrypted content)
CREATE TABLE IF NOT EXISTS step_work (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL CHECK (step_number >= 1 AND step_number <= 12),
  content TEXT NOT NULL, -- Encrypted on client
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsorships table (for Phase 3)
CREATE TABLE IF NOT EXISTS sponsorships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sponsor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sponsee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sponsor_id, sponsee_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_journal_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_created_at ON journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_step_work_user_id ON step_work(user_id);
CREATE INDEX IF NOT EXISTS idx_step_work_step_number ON step_work(step_number);
CREATE INDEX IF NOT EXISTS idx_sponsorships_sponsor ON sponsorships(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_sponsee ON sponsorships(sponsee_id);

-- ============================================
-- TRIGGERS (Auto-update timestamps)
-- ============================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_step_work_updated_at
  BEFORE UPDATE ON step_work
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsorships_updated_at
  BEFORE UPDATE ON sponsorships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- JOURNAL ENTRIES POLICIES
-- ============================================

-- Users can view own entries OR entries shared with them as sponsor
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    (is_shared = true AND auth.uid() = ANY(shared_with))
  );

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- STEP WORK POLICIES
-- ============================================

CREATE POLICY "Users can view own step work"
  ON step_work FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own step work"
  ON step_work FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own step work"
  ON step_work FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own step work"
  ON step_work FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SPONSORSHIPS POLICIES
-- ============================================

CREATE POLICY "Users can view sponsorships where they are involved"
  ON sponsorships FOR SELECT
  USING (auth.uid() = sponsor_id OR auth.uid() = sponsee_id);

CREATE POLICY "Users can create sponsorships as sponsor or sponsee"
  ON sponsorships FOR INSERT
  WITH CHECK (auth.uid() = sponsor_id OR auth.uid() = sponsee_id);

CREATE POLICY "Users can update sponsorships where they are involved"
  ON sponsorships FOR UPDATE
  USING (auth.uid() = sponsor_id OR auth.uid() = sponsee_id)
  WITH CHECK (auth.uid() = sponsor_id OR auth.uid() = sponsee_id);

CREATE POLICY "Users can delete sponsorships where they are involved"
  ON sponsorships FOR DELETE
  USING (auth.uid() = sponsor_id OR auth.uid() = sponsee_id);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Uncomment to verify setup:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public';

-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public';
