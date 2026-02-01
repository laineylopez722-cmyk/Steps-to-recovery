-- Migration: Add day_rating column to daily_checkins
-- Timestamp: 20260201120001
-- Description: Adds day_rating column for evening check-in ratings

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'daily_checkins'
    AND column_name = 'day_rating'
  ) THEN
    ALTER TABLE daily_checkins
    ADD COLUMN day_rating INTEGER CHECK (day_rating >= 1 AND day_rating <= 10);

    COMMENT ON COLUMN daily_checkins.day_rating IS 'Optional overall day rating for the day (1 = worst, 10 = best). NULL means no rating was provided.';
  END IF;
END
$$;
