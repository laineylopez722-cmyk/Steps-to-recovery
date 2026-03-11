-- Migration: Add sponsor_shared_entries table
-- Timestamp: 20260211000003
-- Description: Creates sponsor_shared_entries table for sharing journal entries with sponsors

CREATE TABLE IF NOT EXISTS sponsor_shared_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_id UUID REFERENCES sponsor_connections(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('outgoing', 'incoming', 'comment')),
  journal_entry_id UUID,
  payload TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsor_shared_entries_user
  ON sponsor_shared_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_sponsor_shared_entries_connection
  ON sponsor_shared_entries(connection_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE TRIGGER update_sponsor_shared_entries_updated_at
      BEFORE UPDATE ON sponsor_shared_entries
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

ALTER TABLE sponsor_shared_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shared entries"
  ON sponsor_shared_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shared entries"
  ON sponsor_shared_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shared entries"
  ON sponsor_shared_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shared entries"
  ON sponsor_shared_entries FOR DELETE
  USING (auth.uid() = user_id);
