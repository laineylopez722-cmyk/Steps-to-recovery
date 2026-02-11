-- =====================================================
-- Encrypt Meeting Reflection Mood Columns
-- =====================================================
-- Migration: 20260212000000_encrypt_meeting_reflection_moods
-- Description: Change mood columns from INTEGER to TEXT
--   to support encrypted mood values (AES-256-CBC strings).
-- Date: 2026-02-12
-- =====================================================

-- Drop CHECK constraints (encrypted values are strings, not integers)
ALTER TABLE meeting_reflections DROP CONSTRAINT IF EXISTS meeting_reflections_pre_mood_check;
ALTER TABLE meeting_reflections DROP CONSTRAINT IF EXISTS meeting_reflections_post_mood_check;

-- Change column types from INTEGER to TEXT for encrypted mood storage
ALTER TABLE meeting_reflections ALTER COLUMN pre_mood TYPE TEXT USING pre_mood::TEXT;
ALTER TABLE meeting_reflections ALTER COLUMN post_mood TYPE TEXT USING post_mood::TEXT;

-- Add comment explaining the change
COMMENT ON COLUMN meeting_reflections.pre_mood IS 'Encrypted pre-meeting mood (1-5 scale, AES-256-CBC encrypted)';
COMMENT ON COLUMN meeting_reflections.post_mood IS 'Encrypted post-meeting mood (1-5 scale, AES-256-CBC encrypted)';

-- =====================================================
-- Success message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: meeting_reflections mood columns changed to TEXT for encryption';
END $$;
