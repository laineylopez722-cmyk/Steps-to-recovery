-- Migration: Add sponsor_connections table
-- Timestamp: 20260211000002
-- Description: Creates sponsor_connections table for sponsor/sponsee relationships with key exchange

CREATE TABLE IF NOT EXISTS sponsor_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('sponsee', 'sponsor')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected')),
  invite_code TEXT NOT NULL,
  display_name TEXT,
  own_public_key TEXT NOT NULL,
  peer_public_key TEXT,
  shared_key TEXT,
  pending_private_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsor_connections_user
  ON sponsor_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_sponsor_connections_invite
  ON sponsor_connections(invite_code);

CREATE TRIGGER update_sponsor_connections_updated_at
  BEFORE UPDATE ON sponsor_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE sponsor_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sponsor connections"
  ON sponsor_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sponsor connections"
  ON sponsor_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sponsor connections"
  ON sponsor_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sponsor connections"
  ON sponsor_connections FOR DELETE
  USING (auth.uid() = user_id);
