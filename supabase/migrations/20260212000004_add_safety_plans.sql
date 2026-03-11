-- Migration: Add safety_plans table
-- Timestamp: 20260212000004
-- Description: Creates safety_plans table for crisis safety plan with encrypted plan blob

CREATE TABLE IF NOT EXISTS safety_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  encrypted_plan TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_plans_user
  ON safety_plans(user_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE TRIGGER update_safety_plans_updated_at
      BEFORE UPDATE ON safety_plans
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

ALTER TABLE safety_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own safety plan"
  ON safety_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own safety plan"
  ON safety_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own safety plan"
  ON safety_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own safety plan"
  ON safety_plans FOR DELETE
  USING (auth.uid() = user_id);
