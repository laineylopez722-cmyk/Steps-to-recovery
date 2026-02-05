# Crisis Checkpoint Migration - Copy & Paste
**File**: Run this in Supabase SQL Editor  
**Time**: 30 seconds  
**Status**: Final migration before testing

---

## 📋 Instructions

1. Go to: https://supabase.com/dashboard/project/tbiunmmvfbakwlzykpwq
2. Click **SQL Editor** → **New Query**
3. Copy everything below the line
4. Paste into editor
5. Click **Run**
6. ✅ See success message

---

## 📝 SQL (Copy from here down)

```sql
-- =====================================================
-- Crisis Checkpoints Table
-- "Before You Use" crisis intervention system
-- =====================================================

CREATE TABLE IF NOT EXISTS crisis_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Outcome
  outcome TEXT NOT NULL CHECK (outcome IN ('resisted', 'used', 'abandoned')),
  
  -- Stage 1: Initial acknowledgment
  craving_intensity INTEGER NOT NULL CHECK (craving_intensity >= 1 AND craving_intensity <= 10),
  trigger_description TEXT,
  
  -- Stage 2: Delay tactics
  waited_10_minutes BOOLEAN DEFAULT FALSE,
  called_sponsor BOOLEAN DEFAULT FALSE,
  texted_sponsor BOOLEAN DEFAULT FALSE,
  
  -- Stage 3: Reflection
  journal_entry TEXT,
  emotions_identified TEXT[],
  
  -- Stage 4: Final outcome
  final_craving_intensity INTEGER CHECK (final_craving_intensity >= 1 AND final_craving_intensity <= 10),
  hours_resisted NUMERIC(10, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_crisis_checkpoints_user 
  ON crisis_checkpoints(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_crisis_checkpoints_active 
  ON crisis_checkpoints(user_id, completed_at) WHERE completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_crisis_checkpoints_outcome 
  ON crisis_checkpoints(user_id, outcome, created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE crisis_checkpoints ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read own checkpoints
DROP POLICY IF EXISTS crisis_checkpoints_read_own ON crisis_checkpoints;
CREATE POLICY crisis_checkpoints_read_own
  ON crisis_checkpoints
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can insert own checkpoints
DROP POLICY IF EXISTS crisis_checkpoints_insert_own ON crisis_checkpoints;
CREATE POLICY crisis_checkpoints_insert_own
  ON crisis_checkpoints
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update own checkpoints
DROP POLICY IF EXISTS crisis_checkpoints_update_own ON crisis_checkpoints;
CREATE POLICY crisis_checkpoints_update_own
  ON crisis_checkpoints
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE crisis_checkpoints IS 'Before You Use crisis intervention checkpoints - tracks resistance attempts';
```

---

## ✅ Success!

If you see "Success. No rows returned" - **that's good!**

Table is now created. Crisis checkpoint feature is ready to test!

---

## 🎯 What This Enables

- "Before You Use" button on Emergency screen works
- Craving intensity tracking saves
- 10-minute timer completion logs
- Emotion identification saves
- Sponsor contact attempts logged
- Outcome tracking (resisted/used)
- Crisis statistics and analytics

---

**After running**: Crisis checkpoint fully functional! 🚀
