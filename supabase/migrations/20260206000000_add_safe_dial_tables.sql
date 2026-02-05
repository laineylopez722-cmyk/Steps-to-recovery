-- Safe Dial / Trigger Protection Feature
-- Database schema for crisis intervention system
-- Created: 2026-02-06

-- ========================================
-- Table: risky_contacts
-- Stores contacts that trigger relapse risk
-- ========================================
CREATE TABLE IF NOT EXISTS risky_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  relationship_type TEXT CHECK (relationship_type IN ('dealer', 'old_friend', 'trigger_person', 'other')),
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Ensure unique phone numbers per user
  CONSTRAINT unique_user_phone UNIQUE (user_id, phone_number)
);

-- ========================================
-- Table: close_calls
-- Logs intervention attempts and outcomes
-- ========================================
CREATE TABLE IF NOT EXISTS close_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  risky_contact_id UUID REFERENCES risky_contacts(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  action_taken TEXT NOT NULL CHECK (action_taken IN ('called_sponsor', 'texted_sponsor', 'waited', 'dismissed', 'proceeded', 'played_game')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- Indexes for Performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_risky_contacts_user ON risky_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_risky_contacts_active ON risky_contacts(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_close_calls_user ON close_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_close_calls_created ON close_calls(user_id, created_at DESC);

-- ========================================
-- Row Level Security (RLS)
-- ========================================
ALTER TABLE risky_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE close_calls ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only manage their own risky contacts
CREATE POLICY "Users manage own risky contacts" 
  ON risky_contacts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only manage their own close calls
CREATE POLICY "Users manage own close calls" 
  ON close_calls
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- Helper Functions
-- ========================================

-- Function: Get close call statistics for a user
CREATE OR REPLACE FUNCTION get_close_call_stats(p_user_id UUID)
RETURNS TABLE (
  total_close_calls BIGINT,
  times_resisted BIGINT,
  times_proceeded BIGINT,
  last_close_call TIMESTAMP WITH TIME ZONE,
  longest_streak_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_close_calls,
    COUNT(*) FILTER (WHERE action_taken IN ('called_sponsor', 'texted_sponsor', 'waited', 'dismissed', 'played_game'))::BIGINT AS times_resisted,
    COUNT(*) FILTER (WHERE action_taken = 'proceeded')::BIGINT AS times_proceeded,
    MAX(created_at) AS last_close_call,
    COALESCE(
      (
        SELECT MAX(days_between)
        FROM (
          SELECT 
            EXTRACT(DAY FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))::INTEGER AS days_between
          FROM close_calls
          WHERE user_id = p_user_id
        ) streaks
      ),
      0
    )::INTEGER AS longest_streak_days
  FROM close_calls
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_close_call_stats(UUID) TO authenticated;

-- ========================================
-- Comments for Documentation
-- ========================================
COMMENT ON TABLE risky_contacts IS 'Contacts that pose relapse risk - user-defined "Danger Zone"';
COMMENT ON TABLE close_calls IS 'Log of intervention attempts when user tries to contact risky contacts';
COMMENT ON FUNCTION get_close_call_stats IS 'Returns aggregated statistics about close calls for a user';
