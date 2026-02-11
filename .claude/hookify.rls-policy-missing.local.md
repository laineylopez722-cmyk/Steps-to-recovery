---
name: rls-policy-missing
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: supabase.*\.sql$
  - field: new_text
    operator: regex_match
    pattern: CREATE\s+TABLE|ALTER\s+TABLE.*ADD\s+COLUMN
  - field: new_text
    operator: not_contains
    pattern: ALTER TABLE.*ENABLE ROW LEVEL SECURITY|CREATE POLICY
---

🔐 **Database Security: Missing RLS Policy**

You're creating/modifying a Supabase table without Row-Level Security (RLS) policies!

**Why this is CRITICAL:**
- RLS is the PRIMARY defense against unauthorized data access
- Without RLS, users could query other users' encrypted journal entries
- Violates the privacy-first principle
- Supabase anon key is safe to expose ONLY because of RLS

**What to do:**
Every table with user data MUST have:
1. RLS enabled
2. A policy that filters by `auth.uid()`

**Example:**
```sql
-- Create table
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  encrypted_body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY for user's own entries
CREATE POLICY "Users can only access their own journal entries"
  ON journal_entries
  FOR ALL
  USING (auth.uid() = user_id);

-- For shared entries, add sponsor access
CREATE POLICY "Sponsors can read shared entries"
  ON journal_entries
  FOR SELECT
  USING (
    id IN (
      SELECT entry_id FROM shared_entries
      WHERE shared_with_id = auth.uid()
    )
  );
```

**Tables requiring RLS:**
- journal_entries ✓
- daily_checkins ✓
- step_work ✓
- user_profile ✓
- shared_entries ✓
- achievements ✓
- sponsorships ✓

See CLAUDE.md "Supabase RLS Policies" section.
