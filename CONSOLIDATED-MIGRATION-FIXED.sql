-- =====================================================
-- CONSOLIDATED DATABASE MIGRATION (Fixed Permissions)
-- Steps to Recovery - All Pending Changes
-- =====================================================
-- Date: 2026-02-06
-- Description: Combines all pending migrations into one safe script
-- Fixed: Removed schema permission issues
-- =====================================================

-- =====================================================
-- 1. READING REFLECTIONS TABLE
-- For JFT Daily Reading feature
-- =====================================================

CREATE TABLE IF NOT EXISTS reading_reflections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reading_id TEXT NOT NULL,
  reading_date DATE NOT NULL,
  encrypted_reflection TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reading_date)
);

CREATE INDEX IF NOT EXISTS idx_reading_reflections_user
  ON reading_reflections(user_id);

CREATE INDEX IF NOT EXISTS idx_reading_reflections_date
  ON reading_reflections(reading_date DESC);

CREATE INDEX IF NOT EXISTS idx_reading_reflections_user_date
  ON reading_reflections(user_id, reading_date DESC);

ALTER TABLE reading_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reading reflections" ON reading_reflections;
CREATE POLICY "Users can view own reading reflections"
  ON reading_reflections FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reading reflections" ON reading_reflections;
CREATE POLICY "Users can insert own reading reflections"
  ON reading_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reading reflections" ON reading_reflections;
CREATE POLICY "Users can update own reading reflections"
  ON reading_reflections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reading reflections" ON reading_reflections;
CREATE POLICY "Users can delete own reading reflections"
  ON reading_reflections FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. DAY RATING COLUMN
-- Add day rating to daily check-ins
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_checkins') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'daily_checkins'
      AND column_name = 'day_rating'
    ) THEN
      ALTER TABLE daily_checkins
      ADD COLUMN day_rating INTEGER CHECK (day_rating >= 1 AND day_rating <= 10);
    END IF;
  END IF;
END
$$;

-- =====================================================
-- 3. MEETING CHECK-INS TABLE
-- For 90 in 90 tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS meeting_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_name TEXT NOT NULL,
  meeting_type TEXT,
  location TEXT,
  checked_in_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT,
  mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 5),
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 5)
);

CREATE INDEX IF NOT EXISTS idx_meeting_checkins_user 
  ON meeting_checkins(user_id, checked_in_at DESC);

CREATE INDEX IF NOT EXISTS idx_meeting_checkins_date 
  ON meeting_checkins(checked_in_at DESC);

ALTER TABLE meeting_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own meeting checkins" ON meeting_checkins;
CREATE POLICY "Users manage own meeting checkins"
  ON meeting_checkins
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. USER ACHIEVEMENTS TABLE
-- For unlocking badges
-- =====================================================

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user 
  ON user_achievements(user_id, unlocked_at DESC);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own achievements" ON user_achievements;
CREATE POLICY "Users manage own achievements"
  ON user_achievements
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. SAFE DIAL TABLES
-- Crisis intervention system
-- =====================================================

CREATE TABLE IF NOT EXISTS risky_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  relationship_type TEXT CHECK (relationship_type IN ('dealer', 'old_friend', 'trigger_person', 'other')),
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT unique_user_phone UNIQUE (user_id, phone_number)
);

CREATE TABLE IF NOT EXISTS close_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  risky_contact_id UUID REFERENCES risky_contacts(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  action_taken TEXT NOT NULL CHECK (action_taken IN ('called_sponsor', 'texted_sponsor', 'waited', 'dismissed', 'proceeded', 'played_game')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risky_contacts_user 
  ON risky_contacts(user_id);

CREATE INDEX IF NOT EXISTS idx_risky_contacts_active 
  ON risky_contacts(user_id, is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_close_calls_user 
  ON close_calls(user_id);

CREATE INDEX IF NOT EXISTS idx_close_calls_created 
  ON close_calls(user_id, created_at DESC);

ALTER TABLE risky_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE close_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own risky contacts" ON risky_contacts;
CREATE POLICY "Users manage own risky contacts" 
  ON risky_contacts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own close calls" ON close_calls;
CREATE POLICY "Users manage own close calls" 
  ON close_calls
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 6. SPONSOR NOTIFICATIONS TABLE
-- For risk detection alerts
-- =====================================================

CREATE TABLE IF NOT EXISTS sponsor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sponsee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('risk_alert', 'milestone', 'check_in', 'general')),
  message TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sponsor_notifications_sponsor 
  ON sponsor_notifications(sponsor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sponsor_notifications_sponsee 
  ON sponsor_notifications(sponsee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sponsor_notifications_unread 
  ON sponsor_notifications(sponsor_id, read_at) WHERE read_at IS NULL;

ALTER TABLE sponsor_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sponsor_notifications_read_own ON sponsor_notifications;
CREATE POLICY sponsor_notifications_read_own
  ON sponsor_notifications
  FOR SELECT
  USING (sponsor_id = auth.uid());

DROP POLICY IF EXISTS sponsor_notifications_insert_for_sponsor ON sponsor_notifications;
CREATE POLICY sponsor_notifications_insert_for_sponsor
  ON sponsor_notifications
  FOR INSERT
  WITH CHECK (sponsee_id = auth.uid());

DROP POLICY IF EXISTS sponsor_notifications_update_own ON sponsor_notifications;
CREATE POLICY sponsor_notifications_update_own
  ON sponsor_notifications
  FOR UPDATE
  USING (sponsor_id = auth.uid())
  WITH CHECK (sponsor_id = auth.uid());

-- =====================================================
-- 7. MEETING REFLECTIONS TABLE
-- Pre/post meeting prompts
-- =====================================================

CREATE TABLE IF NOT EXISTS meeting_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_id UUID NOT NULL REFERENCES meeting_checkins(id) ON DELETE CASCADE,
  
  -- Pre-meeting prompts
  pre_intention TEXT,
  pre_mood INTEGER CHECK (pre_mood >= 1 AND pre_mood <= 5),
  pre_hope TEXT,
  
  -- Post-meeting prompts
  post_key_takeaway TEXT,
  post_mood INTEGER CHECK (post_mood >= 1 AND post_mood <= 5),
  post_gratitude TEXT,
  post_will_apply TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(checkin_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_reflections_user 
  ON meeting_reflections(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_meeting_reflections_checkin 
  ON meeting_reflections(checkin_id);

ALTER TABLE meeting_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meeting_reflections_read_own ON meeting_reflections;
CREATE POLICY meeting_reflections_read_own
  ON meeting_reflections
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS meeting_reflections_insert_own ON meeting_reflections;
CREATE POLICY meeting_reflections_insert_own
  ON meeting_reflections
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS meeting_reflections_update_own ON meeting_reflections;
CREATE POLICY meeting_reflections_update_own
  ON meeting_reflections
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
