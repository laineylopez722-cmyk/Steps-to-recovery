-- Create profiles table
-- This is the foundational user profile table that all other tables reference.
-- It stores onboarding status and basic user configuration.
-- Must run BEFORE: add_safe_dial_tables, add_push_token, and any other migration
--                  that includes REFERENCES profiles(id).
-- Created: 2026-01-15

-- ========================================
-- Table: profiles
-- ========================================
CREATE TABLE IF NOT EXISTS profiles (
  -- Primary key matches auth.users(id) exactly
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Display / identity
  display_name TEXT,
  avatar_url   TEXT,

  -- Recovery journey
  sobriety_date DATE,
  home_group    TEXT,
  step_number   INTEGER DEFAULT 1 CHECK (step_number BETWEEN 1 AND 12),

  -- Onboarding
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,

  -- Push notifications (populated by add_push_token migration)
  push_token            TEXT,
  push_token_updated_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- Auto-update updated_at trigger
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE TRIGGER trg_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ========================================
-- Indexes
-- ========================================
CREATE INDEX IF NOT EXISTS idx_profiles_sobriety_date ON profiles(sobriety_date);

-- ========================================
-- Row Level Security
-- ========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles are inserted via trigger (see below), so no INSERT policy for users
-- The service role / trigger inserts the row on auth.users insert

-- ========================================
-- Auto-create profile on sign-up
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users (runs once per new user registration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ========================================
-- Comments
-- ========================================
COMMENT ON TABLE profiles IS 'Core user profile. Created automatically on auth.users INSERT. Referenced as FK by risky_contacts, close_calls, and other feature tables.';
COMMENT ON COLUMN profiles.id IS 'Matches auth.users(id) exactly — 1:1 relationship.';
COMMENT ON COLUMN profiles.onboarding_complete IS 'Set to TRUE by the app after completing the onboarding flow.';
COMMENT ON COLUMN profiles.sobriety_date IS 'User-entered sobriety start date. Used to calculate clean time.';
