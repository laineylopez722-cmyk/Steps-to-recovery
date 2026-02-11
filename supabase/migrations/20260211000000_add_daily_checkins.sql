-- Migration: Add daily_checkins table
-- Timestamp: 20260211000000
-- Description: Creates daily_checkins table for morning/evening check-ins with encrypted fields

CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  checkin_type TEXT NOT NULL CHECK (checkin_type IN ('morning', 'evening')),
  checkin_date DATE NOT NULL,
  intention TEXT,
  notes TEXT,
  mood TEXT,
  gratitude TEXT,
  challenges_faced TEXT,
  day_rating INTEGER CHECK (day_rating >= 1 AND day_rating <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date, checkin_type)
);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user
  ON daily_checkins(user_id);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_date
  ON daily_checkins(checkin_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date
  ON daily_checkins(user_id, checkin_date DESC);

CREATE TRIGGER update_daily_checkins_updated_at
  BEFORE UPDATE ON daily_checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily checkins"
  ON daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily checkins"
  ON daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily checkins"
  ON daily_checkins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily checkins"
  ON daily_checkins FOR DELETE
  USING (auth.uid() = user_id);
