-- Migration: Add updated_at to achievements
-- Timestamp: 20260313000002
-- Description: Adds updated_at to remote achievements table to match local schema (migration v22).
--              Without this column, pull sync for achievements fails in upsertLocalRecord()
--              because the last-write-wins conflict resolution queries updated_at on all pull tables.
--
--              Back-fill: set updated_at = earned_at for all existing rows (closest proxy to
--              when the record was last meaningfully changed).

ALTER TABLE achievements
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Back-fill: use earned_at as the initial updated_at for existing rows
UPDATE achievements
  SET updated_at = earned_at
  WHERE updated_at IS NULL AND earned_at IS NOT NULL;

-- Default remaining nulls to now
UPDATE achievements
  SET updated_at = NOW()
  WHERE updated_at IS NULL;

-- Add trigger to auto-update on row changes (same pattern as other tables)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE TRIGGER update_achievements_updated_at
      BEFORE UPDATE ON achievements
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- No RLS changes required — existing per-user policies cover new columns.
