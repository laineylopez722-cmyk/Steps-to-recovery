-- Migration: Add personal_inventory table
-- Timestamp: 20260212000001
-- Description: Creates personal_inventory table for nightly Tenth Step inventory with encrypted fields

CREATE TABLE IF NOT EXISTS personal_inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  check_date DATE NOT NULL,
  encrypted_answers TEXT NOT NULL,
  encrypted_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, check_date)
);

CREATE INDEX IF NOT EXISTS idx_personal_inventory_user
  ON personal_inventory(user_id);

CREATE INDEX IF NOT EXISTS idx_personal_inventory_user_date
  ON personal_inventory(user_id, check_date);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE TRIGGER update_personal_inventory_updated_at
      BEFORE UPDATE ON personal_inventory
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

ALTER TABLE personal_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own personal inventory"
  ON personal_inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personal inventory"
  ON personal_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal inventory"
  ON personal_inventory FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own personal inventory"
  ON personal_inventory FOR DELETE
  USING (auth.uid() = user_id);
