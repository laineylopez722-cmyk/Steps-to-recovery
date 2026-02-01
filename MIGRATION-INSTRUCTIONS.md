# Supabase Migration Instructions

## Critical: Apply daily_checkins Migration

**Status**: ⚠️ REQUIRED - Daily check-ins are currently not backing up to Supabase

**Priority**: P0 CRITICAL

### What This Fixes

Daily check-ins (morning intentions and evening pulses) are currently:

- ✅ Saving to local SQLite/IndexedDB successfully
- ✅ Being queued in the sync queue
- ❌ **FAILING to sync to Supabase** (table doesn't exist)

**Result**: Users' check-in data is NOT being backed up to the cloud, creating a data loss risk.

---

## How to Apply the Migration

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select project: **tbiunmmvfbakwlzykpwq**
3. Navigate to: **SQL Editor** (left sidebar)
4. Click: **New Query**

### Step 2: Run the Migration

1. Open the file: `supabase-migration-daily-checkins.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click: **Run** (or press Ctrl+Enter)

### Step 3: Verify Success

You should see output like:

```
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE TRIGGER
ALTER TABLE
CREATE POLICY
CREATE POLICY
CREATE POLICY
CREATE POLICY
```

### Step 4: Verify Table Exists

Run this verification query in SQL Editor:

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'daily_checkins'
ORDER BY ordinal_position;
```

**Expected Result**: Should show 9 columns:

- id (uuid)
- user_id (uuid)
- checkin_type (text)
- checkin_date (date)
- intention (text)
- notes (text)
- challenges_faced (text)
- mood (text)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

### Step 5: Verify RLS Policies

Run this verification query:

```sql
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'daily_checkins';
```

**Expected Result**: Should show 4 policies:

- Users can view own check-ins (SELECT)
- Users can insert own check-ins (INSERT)
- Users can update own check-ins (UPDATE)
- Users can delete own check-ins (DELETE)

---

## Testing After Migration

### Test 1: Create a Check-In

1. Run the mobile app
2. Complete a morning intention or evening pulse check-in
3. Check the sync queue: Should see the check-in queued for sync

### Test 2: Verify Sync

1. Ensure device is online
2. Wait for automatic sync (runs every 5 minutes) OR trigger manual sync
3. Check Supabase dashboard > Table Editor > daily_checkins
4. You should see the encrypted check-in data

**Expected Data**:

- `checkin_type`: "morning" or "evening"
- `intention`: (encrypted string for morning)
- `notes`: (encrypted string for evening)
- `mood`: (encrypted string)
- `challenges_faced`: (encrypted string for evening)

### Test 3: Verify Sync Queue Clears

After successful sync, check local database:

```sql
SELECT * FROM sync_queue WHERE table_name = 'daily_checkins' AND retry_count < 3;
```

**Expected**: Should be empty (or show only new pending items)

---

## Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Remove RLS policies
DROP POLICY IF EXISTS "Users can view own check-ins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can insert own check-ins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can update own check-ins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can delete own check-ins" ON daily_checkins;

-- Drop table
DROP TABLE IF EXISTS daily_checkins;
```

---

## Migration History

| Date       | Migration                     | Status  | Applied By |
| ---------- | ----------------------------- | ------- | ---------- |
| 2026-01-02 | Add daily_checkins table      | Pending | -          |
| 2026-02-01 | Add reading_reflections table | Pending | -          |
| 2026-02-01 | Add day_rating column         | Pending | -          |
| 2026-02-01 | Add favorite_meetings table   | Pending | -          |

---

## Additional Required Migrations

### Migration 2: reading_reflections Table

**File**: `supabase-migration-reading-reflections.sql`

**Purpose**: Enables cloud sync for daily reading reflections feature.

**Run After**: `supabase-migration-daily-checkins.sql`

**Steps**:
1. Open Supabase SQL Editor
2. Copy contents of `supabase-migration-reading-reflections.sql`
3. Paste and Run

**Verify**:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'reading_reflections';
```

---

### Migration 3: day_rating Column

**File**: `supabase-migration-add-day-rating.sql`

**Purpose**: Adds `day_rating` column to `daily_checkins` for evening check-in ratings.

**Run After**: `supabase-migration-daily-checkins.sql`

**Steps**:
1. Open Supabase SQL Editor
2. Copy contents of `supabase-migration-add-day-rating.sql`
3. Paste and Run

**Verify**:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'daily_checkins' AND column_name = 'day_rating';
```

---

### Migration 4: favorite_meetings Table

**File**: `supabase-migration-favorite-meetings.sql`

**Purpose**: Enables cloud sync for user's favorite meetings.

**Run After**: `supabase-schema.sql`

**Steps**:
1. Open Supabase SQL Editor
2. Copy contents of `supabase-migration-favorite-meetings.sql`
3. Paste and Run

**Verify**:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'favorite_meetings';
```

---

## Complete Migration Order

Run these migrations in order for a fresh Supabase setup:

1. `supabase-schema.sql` (base schema)
2. `supabase-migration-daily-checkins.sql` (check-ins table)
3. `supabase-migration-add-day-rating.sql` (day_rating column)
4. `supabase-migration-favorite-meetings.sql` (meetings table)
5. `supabase-migration-reading-reflections.sql` (reflections table)

For Supabase CLI users, migrations are also available in `supabase/migrations/`:
```bash
npx supabase db push
```

---

## Next Steps After This Migration

Once daily_checkins is working, the next priority tasks are:

1. **Complete Sponsor Feature** (5 hours)
   - Implement sponsor invitation flow
   - Add shared entries view
   - Wire up navigation

2. **Build Step Work Answer Forms** (6-8 hours)
   - Create StepDetailScreen
   - Add question answer forms
   - Implement progress tracking

See `C:\Users\laine\.claude\plans\reactive-hugging-torvalds.md` for the complete plan.
