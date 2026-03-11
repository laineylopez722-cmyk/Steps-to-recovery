-- Migration: Add reading_reflections table
-- Timestamp: 20260201120000
-- Description: Creates reading_reflections table for daily readings feature

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

CREATE INDEX IF NOT EXISTS idx_reading_reflections_user
  ON reading_reflections(user_id);

CREATE INDEX IF NOT EXISTS idx_reading_reflections_date
  ON reading_reflections(reading_date DESC);

CREATE INDEX IF NOT EXISTS idx_reading_reflections_user_date
  ON reading_reflections(user_id, reading_date DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE TRIGGER update_reading_reflections_updated_at
      BEFORE UPDATE ON reading_reflections
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

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
