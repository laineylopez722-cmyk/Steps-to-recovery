---
id: "SEC-001"
title: "RLS policies not validated against all synced tables"
category: "security"
severity: "high"
status: "open"
priority: "P1"
created: "2026-03-21"
updated: "2026-03-21"
labels:
  - "rls"
  - "supabase"
  - "security-audit"
  - "data-privacy"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "M"
effort_hours: "4-8"
---

## Problem Statement

The app syncs data to 8 Supabase tables: `journal_entries`, `step_work`, `daily_checkins`,
`favorite_meetings`, `reading_reflections`, `weekly_reports`, `sponsor_connections`, and
`sponsor_shared_entries`.

`CLAUDE.md` documents RLS policies for `journal_entries` only, with a note about
`sponsor_shared_entries`. The remaining 6 tables have no documented or verified RLS policies.

Without confirmed RLS policies, there is a risk that:
1. A user could read another user's data via the Supabase REST API
2. A compromised anon key could expose all rows in unprotected tables
3. Sync operations could accidentally overwrite other users' records

This is a data privacy risk for all users of the app.

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | All app users (data privacy risk) |
| How often | Continuously — RLS is always-on or always-off per table |
| Severity when triggered | Potential cross-user data exposure via Supabase API |
| Workaround available | No — this requires server-side policy verification |

---

## Steps to Reproduce

1. Open Supabase dashboard for project `tbiunmmvfbakwlzykpwq`
2. Navigate to Authentication > Policies
3. Observe which tables have RLS enabled and which do not
4. For tables with RLS, verify each policy covers SELECT, INSERT, UPDATE, DELETE

**Expected:** All 8 synced tables have RLS enabled with `auth.uid() = user_id` policies
**Actual:** Policy coverage is unknown for 6 of 8 tables

---

## Acceptance Criteria

- [ ] RLS is confirmed enabled on all 8 synced tables
- [ ] Each table has policies covering SELECT, INSERT, UPDATE, and DELETE
- [ ] All policies use `auth.uid() = user_id` pattern (or equivalent)
- [ ] `sponsor_shared_entries` has a secondary SELECT policy for the sponsor side
- [ ] Verified policies are documented in `supabase-schema.sql` with comments
- [ ] A manual test is run: authenticate as user A, attempt to read user B's data — should return empty
- [ ] Results documented in `SECURITY.md` with audit date

---

## Implementation Notes

- Supabase project ref: `tbiunmmvfbakwlzykpwq`
- Standard RLS policy pattern from CLAUDE.md:
  ```sql
  ALTER TABLE step_work ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can only access their own step work"
    ON step_work FOR ALL
    USING (auth.uid() = user_id);
  ```
- For `sponsor_shared_entries`, need a dual-access policy:
  ```sql
  -- Owner can read/write their own shared entries
  CREATE POLICY "Owners can manage their shared entries"
    ON sponsor_shared_entries FOR ALL
    USING (auth.uid() = owner_id);

  -- Sponsor (shared_with) can only read
  CREATE POLICY "Sponsors can read entries shared with them"
    ON sponsor_shared_entries FOR SELECT
    USING (auth.uid() = shared_with_id);
  ```
- Verification query (run as different user via Supabase SQL Editor):
  ```sql
  SELECT * FROM step_work WHERE user_id != auth.uid() LIMIT 1;
  -- Should return 0 rows if RLS is correct
  ```
- All policy SQL should be added to `supabase-schema.sql`

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | M |
| Hours estimate | 4-8 hours |
| Confidence | medium |
| Rationale | Need to audit all 8 tables, write missing policies, test, and document |

---

## Blocked By

None.

---

## Related Documentation

- `supabase-schema.sql` — base schema with some RLS policies
- `CLAUDE.md` — "Supabase RLS Policies" section with pattern
- `SECURITY.md` — security audit history
- `apps/mobile/src/services/syncService.ts` — lists tables synced
