CREATE TABLE IF NOT EXISTS favorite_meetings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Meeting reference (ID from Meeting Guide API or local cache)
  meeting_id TEXT NOT NULL,

  -- User's personal notes about this meeting (encrypted client-side)
  notes TEXT,

  -- Notification preferences (for future geofencing feature)
  notification_enabled BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure user can't favorite the same meeting twice
  UNIQUE(user_id, meeting_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_meetings_user
  ON favorite_meetings(user_id);

CREATE INDEX IF NOT EXISTS idx_favorite_meetings_user_created
  ON favorite_meetings(user_id, created_at DESC);

-- Trigger to update updated_at
-- We assume update_updated_at_column exists as it is standard in Supabase starters
-- If it fails, we might need to create it.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_favorite_meetings_updated_at
        BEFORE UPDATE ON favorite_meetings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

ALTER TABLE favorite_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorite meetings"
  ON favorite_meetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorite meetings"
  ON favorite_meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorite meetings"
  ON favorite_meetings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite meetings"
  ON favorite_meetings FOR DELETE
  USING (auth.uid() = user_id);;
