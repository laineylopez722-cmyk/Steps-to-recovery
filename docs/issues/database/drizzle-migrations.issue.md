---
id: "DB-001"
title: "Drizzle ORM schema not in sync with SQLite DatabaseContext migrations"
category: "database"
severity: "high"
status: "open"
priority: "P1"
created: "2026-03-21"
updated: "2026-03-21"
labels:
  - "drizzle"
  - "sqlite"
  - "schema"
  - "migrations"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "M"
effort_hours: "4-8"
---

## Problem Statement

The codebase maintains two parallel representations of the database schema:

1. **Drizzle ORM schema** (`apps/mobile/src/db/`) — TypeScript schema definitions used for
   type-safe queries via drizzle-orm
2. **Imperative SQL** (`apps/mobile/src/utils/database.ts`) — Raw `CREATE TABLE IF NOT EXISTS`
   statements run by DatabaseContext during startup

These two definitions can diverge silently. If a developer adds a column to the Drizzle schema
but forgets to add it to the SQL initialisation, or vice versa, the app will boot without error
but Drizzle queries will fail at runtime with "no such column" errors.

There is no automated check that the two representations describe the same tables. This risk
grows as new features add columns (e.g., when the AI companion feature adds new fields).

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | Developers adding new features that touch the database schema |
| How often | Every time a new column or table is added |
| Severity when triggered | Runtime "no such column" errors; data not saved correctly |
| Workaround available | Yes — manually compare both files before committing |

---

## Steps to Reproduce

1. Add a new column to a Drizzle table definition in `apps/mobile/src/db/schema.ts`
2. Forget to add the corresponding column to the `CREATE TABLE` SQL in `utils/database.ts`
3. Run the app — no error at startup
4. Call a Drizzle query that selects the new column — runtime error: "no such column"

**Expected:** A CI check or test that detects the schema mismatch before it reaches runtime
**Actual:** Mismatch goes undetected until runtime

---

## Acceptance Criteria

- [ ] A test or script compares Drizzle schema column names against the SQLite PRAGMA output
- [ ] The check runs in CI as part of the test suite
- [ ] Mismatch produces a clear error listing the differing columns and which file needs updating
- [ ] The test covers all tables defined in both the Drizzle schema and the SQL initialiser
- [ ] Documentation in `CLAUDE.md` updated: "When adding a database column, update BOTH files"
- [ ] No TypeScript errors introduced (`npx tsc --noEmit` passes)
- [ ] Encryption tests still pass (`npm run test:encryption` in apps/mobile)

---

## Implementation Notes

- Drizzle schema location: `apps/mobile/src/db/` — look for `schema.ts` or similar
- SQL initialiser: `apps/mobile/src/utils/database.ts` — contains `CREATE TABLE IF NOT EXISTS`
- Approach: In a test, open an in-memory SQLite database using the SQL initialiser, then run
  `PRAGMA table_info(table_name)` for each table and compare columns against Drizzle schema
- Alternative: Extract column names from Drizzle schema type definitions and compare with
  a static analysis of the SQL string (fragile — prefer the PRAGMA approach)
- Consider using drizzle-kit's `push` command for future migrations instead of raw SQL, but
  this is a larger architectural change (track separately)
- PRAGMA query example:
  ```sql
  PRAGMA table_info(journal_entries);
  -- Returns: cid, name, type, notnull, dflt_value, pk
  ```

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | M |
| Hours estimate | 4-8 hours |
| Confidence | medium |
| Rationale | Test setup with in-memory SQLite is the main complexity; column extraction from Drizzle schema needs investigation |

---

## Blocked By

None.

---

## Related Documentation

- `apps/mobile/src/db/` — Drizzle ORM schema
- `apps/mobile/src/utils/database.ts` — SQL schema initialiser
- `apps/mobile/src/contexts/DatabaseContext.tsx` — uses the SQL initialiser
- `CLAUDE.md` — "Database Schema" and "Offline-First" sections
