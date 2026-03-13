-- Migration: Add craving and audio columns to journal_entries
-- Timestamp: 20260313000000
-- Description: Adds craving (encrypted craving intensity) and audio (encrypted audio journal path)
--              to journal_entries to match local mobile schema (migration v19-v20).
--              Both columns are nullable TEXT — no data is lost on existing rows.

ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS craving TEXT,
  ADD COLUMN IF NOT EXISTS audio TEXT;

-- No RLS changes required — existing per-user policies cover new columns.
