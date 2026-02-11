-- Add push token columns to profiles table for remote push notifications
-- Allows the server to send push notifications to specific user devices

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMPTZ;

-- RLS: users can only update their own push token
-- (Existing RLS on profiles should already cover this, but adding explicit policy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users can update own push token'
  ) THEN
    CREATE POLICY "Users can update own push token"
      ON profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
