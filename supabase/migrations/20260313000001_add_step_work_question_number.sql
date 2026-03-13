-- Migration: Add question_number to step_work
-- Timestamp: 20260313000001
-- Description: Adds question_number to the remote step_work table to match local mobile schema.
--              Local schema has UNIQUE(user_id, step_number, question_number).
--              Without this column, pushing multiple questions per step would succeed (different ids)
--              but pulling them back would produce UNIQUE constraint violations because all would
--              default to question_number=1.
--
--              Back-fill: existing rows all get question_number=1 (safe — they were pushed without
--              the field so they each represent "question 1 for that step").

ALTER TABLE step_work
  ADD COLUMN IF NOT EXISTS question_number INTEGER NOT NULL DEFAULT 1;

-- Rebuild the unique constraint to include question_number.
-- The old constraint (if any) is dropped first to avoid conflicts.
-- NOTE: If the table previously had UNIQUE(user_id, step_number), that is intentionally replaced.
DO $$
BEGIN
  -- Drop old constraint if it exists (may vary by original table setup)
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'step_work_user_id_step_number_key'
      AND conrelid = 'step_work'::regclass
  ) THEN
    ALTER TABLE step_work DROP CONSTRAINT step_work_user_id_step_number_key;
  END IF;
END $$;

-- Add the correct unique constraint matching local schema
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'step_work_user_id_step_number_question_number_key'
      AND conrelid = 'step_work'::regclass
  ) THEN
    ALTER TABLE step_work
      ADD CONSTRAINT step_work_user_id_step_number_question_number_key
      UNIQUE (user_id, step_number, question_number);
  END IF;
END $$;

-- No RLS changes required — existing per-user policies cover new columns.
