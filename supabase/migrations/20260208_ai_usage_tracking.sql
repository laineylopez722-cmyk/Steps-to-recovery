-- AI Usage Tracking for Free Tier Limits
-- Run this migration to enable the backend proxy with usage limits

-- Track daily usage per user
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INT NOT NULL DEFAULT 0,
  token_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- User AI settings (tier, BYOK status)
CREATE TABLE IF NOT EXISTS user_ai_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_own_key BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_provider TEXT CHECK (preferred_provider IN ('openai', 'anthropic')),
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to increment usage (called by Edge Function)
CREATE OR REPLACE FUNCTION increment_ai_usage(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_usage (user_id, date, message_count, updated_at)
  VALUES (p_user_id, p_date, 1, NOW())
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    message_count = ai_usage.message_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage(date);

-- RLS policies
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can view own usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see/update their own settings
CREATE POLICY "Users can view own settings" ON user_ai_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_ai_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_ai_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant execute on function
GRANT EXECUTE ON FUNCTION increment_ai_usage TO authenticated;
GRANT EXECUTE ON FUNCTION increment_ai_usage TO service_role;

COMMENT ON TABLE ai_usage IS 'Tracks daily AI message usage for free tier limits';
COMMENT ON TABLE user_ai_settings IS 'User AI preferences and tier status';
COMMENT ON FUNCTION increment_ai_usage IS 'Atomically increments message count for a user on a given date';
