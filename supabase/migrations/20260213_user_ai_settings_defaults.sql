-- Additive updates for user_ai_settings fields consumed by ai-chat edge function
-- Safe to run multiple times

ALTER TABLE IF EXISTS user_ai_settings
  ADD COLUMN IF NOT EXISTS system_prompt TEXT,
  ADD COLUMN IF NOT EXISTS assistant_name TEXT,
  ADD COLUMN IF NOT EXISTS default_model TEXT,
  ADD COLUMN IF NOT EXISTS default_temperature DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS default_max_tokens INT;

-- Ensure tier check allows current runtime values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'user_ai_settings'::regclass
      AND conname = 'user_ai_settings_tier_check'
  ) THEN
    ALTER TABLE user_ai_settings DROP CONSTRAINT user_ai_settings_tier_check;
  END IF;

  ALTER TABLE user_ai_settings
    ADD CONSTRAINT user_ai_settings_tier_check
    CHECK (tier IN ('free', 'pro', 'premium'));
END $$;
