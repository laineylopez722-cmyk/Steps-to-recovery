---
id: "DB-002"
title: "Sync queue has no cleanup for successfully processed entries"
category: "database"
severity: "medium"
status: "open"
priority: "P2"
created: "2026-03-21"
updated: "2026-03-21"
labels:
  - "sync"
  - "sqlite"
  - "performance"
  - "cleanup"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "S"
effort_hours: "2-4"
---

## Problem Statement

The `sync_queue` table accumulates all write operations queued for sync to Supabase. After
a sync operation succeeds, entries are marked as synced (via a status field or similar) but
are never deleted from the table.

On a device with months of regular usage, this table will contain tens of thousands of rows.
This causes:

1. Slower sync scans — the worker must skip already-synced entries on every run
2. Larger SQLite database file on device storage
3. Backup exports including historical queue data the user does not need
4. The CLAUDE.md troubleshooting note "SELECT * FROM sync_queue WHERE retry_count >= 3" becomes
   increasingly expensive over time

The CLAUDE.md troubleshooting section acknowledges the risk: "sync_queue table has thousands of rows"
is listed as a known symptom, but the fix described is reactive (manual debugging) rather than
preventive (automated cleanup).

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | All users with long-running installations (>30 days) |
| How often | Continuously worsening over time |
| Severity when triggered | Noticeable sync delay on devices with >6 months of data |
| Workaround available | Yes — manually delete processed rows via SQLite query |

---

## Steps to Reproduce

1. Use the app normally for 30+ days with a network connection
2. Open a SQLite browser on the device database
3. Query: `SELECT COUNT(*) FROM sync_queue` — will show a large and growing number
4. Query: `SELECT COUNT(*) FROM sync_queue WHERE synced_at IS NOT NULL` — most rows are done

**Expected:** Successfully synced entries are periodically removed from the table
**Actual:** All entries accumulate indefinitely

---

## Acceptance Criteria

- [ ] After a successful sync batch, processed entries older than 7 days are deleted
- [ ] The cleanup runs as part of the existing sync cycle (not a separate background task)
- [ ] Failed entries (`retry_count >= 3`) are NOT deleted — they need to be investigated
- [ ] A configurable retention period is used (default: 7 days) — stored as a constant
- [ ] The cleanup is tested: confirm rows are deleted after a sync, failed rows are not
- [ ] `CLAUDE.md` troubleshooting section updated to reflect the cleanup behaviour
- [ ] No TypeScript errors introduced (`npx tsc --noEmit` passes)

---

## Implementation Notes

- Sync service: `apps/mobile/src/services/syncService.ts`
- Add a cleanup step at the end of the `processSyncQueue` function:
  ```typescript
  const SYNC_QUEUE_RETENTION_DAYS = 7;

  async function cleanupSyncQueue(db: StorageAdapter, userId: string): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - SYNC_QUEUE_RETENTION_DAYS);

    await db.runAsync(
      `DELETE FROM sync_queue
       WHERE user_id = ?
         AND status = 'synced'
         AND synced_at < ?
         AND retry_count < 3`,
      [userId, cutoff.toISOString()]
    );
  }
  ```
- Verify the actual column names in `sync_queue` — status field may be named differently
- Run cleanup after the sync batch completes successfully, not before (to avoid losing data on retry)
- Consider logging the count of rows deleted: `logger.info('Sync queue cleanup', { deletedRows })`

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | S |
| Hours estimate | 2-4 hours |
| Confidence | high |
| Rationale | Simple SQL DELETE in the existing sync flow; main effort is finding correct column names and writing the test |

---

## Blocked By

None.

---

## Related Documentation

- `apps/mobile/src/services/syncService.ts` — sync queue processing
- `apps/mobile/src/utils/database.ts` — sync_queue table schema
- `CLAUDE.md` — "Background Sync Architecture" and "Troubleshooting: Sync Queue Growing Indefinitely"
