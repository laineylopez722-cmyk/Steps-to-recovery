-- ============================================
-- Supabase Migration: Add day_rating to daily_checkins
-- ============================================
-- This migration adds the day_rating column to the existing daily_checkins table.
--
-- The day_rating field is used in evening check-ins to rate the overall day
-- on a scale of 1-10. It's derived from the craving level (inverted scale).
--
-- Run this in Supabase SQL Editor:
-- Dashboard > SQL Editor > New Query > Paste and Run
--
-- IMPORTANT: Run AFTER supabase-migration-daily-checkins.sql

-- ============================================
-- ADD COLUMN
-- ============================================

-- Add day_rating column if it doesn't exist
-- Using DO block for idempotent execution
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'daily_checkins'
    AND column_name = 'day_rating'
  ) THEN
    ALTER TABLE daily_checkins
    ADD COLUMN day_rating INTEGER CHECK (day_rating >= 1 AND day_rating <= 10);

    RAISE NOTICE 'Column day_rating added to daily_checkins';
  ELSE
    RAISE NOTICE 'Column day_rating already exists in daily_checkins';
  END IF;
END
$$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Uncomment to verify the column was added:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'daily_checkins'
-- AND column_name = 'day_rating';

-- Check table structure:
-- SELECT table_name, column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'daily_checkins'
-- ORDER BY ordinal_position;
