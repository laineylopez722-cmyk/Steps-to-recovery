-- Migration: Add gratitude_entries table
-- Timestamp: 20260212000002
-- Description: Creates gratitude_entries table for daily gratitude journaling with encrypted fields

CREATE TABLE IF NOT EXISTS gratitude_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL,
  encrypted_item_1 TEXT NOT NULL,
  encrypted_item_2 TEXT NOT NULL,
  encrypted_item_3 TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user
  ON gratitude_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user_date
  ON gratitude_entries(user_id, entry_date DESC);

CREATE TRIGGER update_gratitude_entries_updated_at
  BEFORE UPDATE ON gratitude_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE gratitude_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gratitude entries"
  ON gratitude_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gratitude entries"
  ON gratitude_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gratitude entries"
  ON gratitude_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own gratitude entries"
  ON gratitude_entries FOR DELETE
  USING (auth.uid() = user_id);
