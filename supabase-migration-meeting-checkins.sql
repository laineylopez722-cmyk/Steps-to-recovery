-- ============================================
-- Steps to Recovery - Meeting Check-Ins & Achievements Migration
-- ============================================
-- Purpose: Gamify meeting attendance with check-ins, streaks, and achievements
-- Run this in Supabase SQL Editor after the main schema

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MEETING CHECK-INS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS meeting_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meeting_id TEXT, -- Meeting ID from external API (or null for manual check-ins)
  meeting_name TEXT NOT NULL,
  meeting_address TEXT,
  check_in_type TEXT NOT NULL CHECK (check_in_type IN ('geofence', 'manual', 'qr')),
  latitude FLOAT,
  longitude FLOAT,
  notes TEXT, -- Optional user notes about the meeting
  created_at TIMESTAMPTZ DEFAULT NOW(),
  supabase_id UUID UNIQUE, -- For offline sync support
  -- Constraint: One check-in per meeting per day per user
  CONSTRAINT unique_daily_checkin UNIQUE(user_id, meeting_id, DATE(created_at))
);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_key TEXT NOT NULL, -- 'first_meeting', '30_in_30', '90_in_90', etc.
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraint: Each achievement can only be unlocked once per user
  CONSTRAINT unique_user_achievement UNIQUE(user_id, achievement_key)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_meeting_checkins_user_id ON meeting_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_checkins_created_at ON meeting_checkins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_checkins_user_date ON meeting_checkins(user_id, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_key ON achievements(achievement_key);

-- ============================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE meeting_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Meeting Check-ins Policies
CREATE POLICY "Users can view own check-ins"
  ON meeting_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins"
  ON meeting_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins"
  ON meeting_checkins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own check-ins"
  ON meeting_checkins FOR DELETE
  USING (auth.uid() = user_id);

-- Achievements Policies
CREATE POLICY "Users can view own achievements"
  ON achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: Achievements typically shouldn't be updated or deleted, so no policies for those

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get current streak for a user
CREATE OR REPLACE FUNCTION get_user_meeting_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  check_date DATE;
  has_checkin BOOLEAN;
BEGIN
  -- Start from yesterday and work backwards
  check_date := CURRENT_DATE - INTERVAL '1 day';
  
  LOOP
    -- Check if user has a check-in for this date
    SELECT EXISTS(
      SELECT 1 FROM meeting_checkins
      WHERE user_id = user_uuid
        AND DATE(created_at) = check_date
    ) INTO has_checkin;
    
    -- If no check-in found, break the streak
    EXIT WHEN NOT has_checkin;
    
    -- Increment streak and check previous day
    streak_count := streak_count + 1;
    check_date := check_date - INTERVAL '1 day';
    
    -- Safety limit: don't check more than 1000 days
    EXIT WHEN streak_count >= 1000;
  END LOOP;
  
  RETURN streak_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get total meetings attended by a user
CREATE OR REPLACE FUNCTION get_user_total_meetings(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT DATE(created_at))
    FROM meeting_checkins
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check 90-in-90 progress
CREATE OR REPLACE FUNCTION get_90_in_90_progress(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  first_checkin_date DATE;
  days_completed INTEGER;
  days_elapsed INTEGER;
  target_date DATE;
  is_complete BOOLEAN;
BEGIN
  -- Get the date of the first check-in
  SELECT DATE(MIN(created_at)) INTO first_checkin_date
  FROM meeting_checkins
  WHERE user_id = user_uuid;
  
  -- If no check-ins, return empty progress
  IF first_checkin_date IS NULL THEN
    RETURN json_build_object(
      'daysCompleted', 0,
      'daysRemaining', 90,
      'isComplete', false,
      'startDate', NULL,
      'targetDate', NULL
    );
  END IF;
  
  -- Calculate target date (90 days from first check-in)
  target_date := first_checkin_date + INTERVAL '89 days';
  
  -- Count unique days with check-ins within the 90-day window
  SELECT COUNT(DISTINCT DATE(created_at)) INTO days_completed
  FROM meeting_checkins
  WHERE user_id = user_uuid
    AND DATE(created_at) >= first_checkin_date
    AND DATE(created_at) <= target_date;
  
  -- Check if complete
  is_complete := days_completed >= 90;
  
  -- Calculate days elapsed in the challenge
  days_elapsed := LEAST(
    (CURRENT_DATE - first_checkin_date)::INTEGER + 1,
    90
  );
  
  RETURN json_build_object(
    'daysCompleted', days_completed,
    'daysRemaining', GREATEST(90 - days_completed, 0),
    'isComplete', is_complete,
    'startDate', first_checkin_date,
    'targetDate', target_date,
    'daysElapsed', days_elapsed
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to automatically check and unlock achievements after check-in
CREATE OR REPLACE FUNCTION check_achievement_unlocks()
RETURNS TRIGGER AS $$
DECLARE
  total_meetings INTEGER;
  current_streak INTEGER;
  ninety_in_ninety JSON;
BEGIN
  -- Get current stats
  total_meetings := get_user_total_meetings(NEW.user_id);
  current_streak := get_user_meeting_streak(NEW.user_id);
  ninety_in_ninety := get_90_in_90_progress(NEW.user_id);
  
  -- First meeting achievement
  IF total_meetings = 1 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (NEW.user_id, 'first_meeting')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;
  
  -- Week strong (7-day streak)
  IF current_streak >= 7 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (NEW.user_id, 'week_strong')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;
  
  -- 30 in 30
  IF (ninety_in_ninety->>'daysCompleted')::INTEGER >= 30 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (NEW.user_id, '30_in_30')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;
  
  -- 90 in 90 (the big one!)
  IF (ninety_in_ninety->>'isComplete')::BOOLEAN THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (NEW.user_id, '90_in_90')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;
  
  -- Centurion (100 total meetings)
  IF total_meetings >= 100 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (NEW.user_id, 'centurion')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;
  
  -- Year strong (365-day streak)
  IF current_streak >= 365 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (NEW.user_id, 'year_strong')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;
  
  -- Marathon (500 total meetings)
  IF total_meetings >= 500 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (NEW.user_id, 'marathon')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_achievement_unlocks
  AFTER INSERT ON meeting_checkins
  FOR EACH ROW
  EXECUTE FUNCTION check_achievement_unlocks();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Uncomment to verify the migration:

-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('meeting_checkins', 'achievements');

-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('meeting_checkins', 'achievements');

-- SELECT routine_name
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_name LIKE '%meeting%'
--   OR routine_name LIKE '%90_in_90%';
