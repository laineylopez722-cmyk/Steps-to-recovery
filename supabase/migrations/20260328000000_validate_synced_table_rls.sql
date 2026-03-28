-- Migration: Validate and backfill RLS policies for synced recovery tables
-- Timestamp: 20260328000000
-- Description: Ensures all synced privacy-sensitive tables have RLS enabled with
--              user-scoped CRUD policies and sponsor read policy for shared entries.

-- ---------------------------------------------------------------------------
-- journal_entries
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS journal_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'journal_entries'
      AND policyname = 'Users can view own journal entries'
  ) THEN
    CREATE POLICY "Users can view own journal entries"
      ON journal_entries FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'journal_entries'
      AND policyname = 'Users can insert own journal entries'
  ) THEN
    CREATE POLICY "Users can insert own journal entries"
      ON journal_entries FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'journal_entries'
      AND policyname = 'Users can update own journal entries'
  ) THEN
    CREATE POLICY "Users can update own journal entries"
      ON journal_entries FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'journal_entries'
      AND policyname = 'Users can delete own journal entries'
  ) THEN
    CREATE POLICY "Users can delete own journal entries"
      ON journal_entries FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- step_work
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS step_work ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'step_work'
      AND policyname = 'Users can view own step work'
  ) THEN
    CREATE POLICY "Users can view own step work"
      ON step_work FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'step_work'
      AND policyname = 'Users can insert own step work'
  ) THEN
    CREATE POLICY "Users can insert own step work"
      ON step_work FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'step_work'
      AND policyname = 'Users can update own step work'
  ) THEN
    CREATE POLICY "Users can update own step work"
      ON step_work FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'step_work'
      AND policyname = 'Users can delete own step work'
  ) THEN
    CREATE POLICY "Users can delete own step work"
      ON step_work FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- sponsor_shared_entries sponsor-side read policy
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sponsor_shared_entries'
      AND policyname = 'Connected sponsors can view shared entries'
  ) THEN
    CREATE POLICY "Connected sponsors can view shared entries"
      ON sponsor_shared_entries FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM sponsor_connections sc
          WHERE sc.id = sponsor_shared_entries.connection_id
            AND sc.user_id = auth.uid()
            AND sc.status = 'connected'
        )
      );
  END IF;
END $$;
