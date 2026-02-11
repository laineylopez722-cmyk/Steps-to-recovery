-- Migration: Add weekly_reports table
-- Timestamp: 20260211000001
-- Description: Creates weekly_reports table for weekly summary data

CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  report_json TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_user
  ON weekly_reports(user_id);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_week
  ON weekly_reports(week_start DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_week
  ON weekly_reports(user_id, week_start DESC);

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
