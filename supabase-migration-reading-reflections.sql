-- ============================================
-- Supabase Migration: Add reading_reflections Table
-- ============================================
-- This migration adds the reading_reflections table for the Daily Readings feature.
--
-- The schema supports:
-- - User's reflections on daily recovery readings (encrypted client-side)
-- - Word count tracking for engagement metrics
-- - One reflection per day per user
--
-- Run this in Supabase SQL Editor:
-- Dashboard > SQL Editor > New Query > Paste and Run
--
-- IMPORTANT: Run AFTER supabase-schema.sql and supabase-migration-daily-checkins.sql

-- ============================================
-- CREATE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS reading_reflections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Reading reference (ID from daily_readings table in local DB)
  reading_id TEXT NOT NULL,

  -- Date of the reading (YYYY-MM-DD format)
  reading_date DATE NOT NULL,

  -- User's reflection text (encrypted client-side)
  encrypted_reflection TEXT NOT NULL,

  -- Word count for engagement tracking (computed client-side before encryption)
  word_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One reflection per day per user
  UNIQUE(user_id, reading_date)
);

-- ============================================
-- INDEXES
-- ============================================

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_reading_reflections_user
  ON reading_reflections(user_id);

-- Index for date-based queries (calendar view, streaks)
CREATE INDEX IF NOT EXISTS idx_reading_reflections_date
  ON reading_reflections(reading_date DESC);

-- Composite index for user + date queries
CREATE INDEX IF NOT EXISTS idx_reading_reflections_user_date
  ON reading_reflections(user_id, reading_date DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
-- (Uses update_updated_at_column() function from base schema)
CREATE TRIGGER update_reading_reflections_updated_at
  BEFORE UPDATE ON reading_reflections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE reading_reflections ENABLE ROW LEVEL SECURITY;

-- Users can view their own reading reflections
CREATE POLICY "Users can view own reading reflections"
  ON reading_reflections FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reading reflections
CREATE POLICY "Users can insert own reading reflections"
  ON reading_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reading reflections
CREATE POLICY "Users can update own reading reflections"
  ON reading_reflections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reading reflections
CREATE POLICY "Users can delete own reading reflections"
  ON reading_reflections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Uncomment to verify the table was created:
-- SELECT table_name, column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'reading_reflections'
-- ORDER BY ordinal_position;

-- Verify RLS policies:
-- SELECT policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename = 'reading_reflections';
