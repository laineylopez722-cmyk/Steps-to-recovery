-- =====================================================
-- Meeting Reflections Table
-- =====================================================
-- Migration: 20260206000002_meeting_reflections
-- Description: Add meeting reflections (pre/post prompts)
-- Date: 2026-02-06
-- =====================================================

-- Create meeting_reflections table
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
  post_mood INTEGER CHECK (post_mood >= 1 AND pre_mood <= 5),
  post_gratitude TEXT,
  post_will_apply TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(checkin_id)
);

-- Add indexes
CREATE INDEX idx_meeting_reflections_user ON meeting_reflections(user_id, created_at DESC);
CREATE INDEX idx_meeting_reflections_checkin ON meeting_reflections(checkin_id);

-- Row Level Security (RLS)
ALTER TABLE meeting_reflections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read own reflections
CREATE POLICY meeting_reflections_read_own
  ON meeting_reflections
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can insert own reflections
CREATE POLICY meeting_reflections_insert_own
  ON meeting_reflections
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update own reflections
CREATE POLICY meeting_reflections_update_own
  ON meeting_reflections
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE meeting_reflections IS 'Pre and post meeting reflection prompts for users';

-- =====================================================
-- Success message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: meeting_reflections table created';
END $$;
