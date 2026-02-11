# Sync Architecture Reference

_Offline-first sync system for Steps-to-Recovery. SQLite is source of truth; Supabase is backup/sync._

---

## Architecture Overview

```
User Action → Encrypt → Write SQLite → Add to sync_queue → Background Worker → Supabase Upsert
                                                                    ↓
                                                          Retry (3x, exponential backoff)
                                                                    ↓
                                                          Mark synced (supabase_id + status)
```

### Core Principle: Offline-First
- SQLite/IndexedDB is the **source of truth**
- Supabase is backup and cross-device sync
- App works fully offline; syncs when connectivity available
- All data encrypted client-side before sync (Supabase stores encrypted blobs)

---

## Sync Queue (sync_queue table)

### Schema
| Column | Type | Purpose |
|--------|------|---------|
| id | TEXT PK | Queue item ID |
| table_name | TEXT | Target table (e.g., 'journal_entries') |
| record_id | TEXT | Local record ID |
| operation | TEXT | 'insert' / 'update' / 'delete' |
| supabase_id | TEXT | Cloud record ID (for deletes) |
| retry_count | INTEGER | Attempts so far (max 3) |
| last_error | TEXT | Last failure message |
| failed_at | TEXT | Timestamp when max retries exceeded |
| created_at | TEXT | When queued |

**Unique Constraint**: (table_name, record_id, operation)
**Uses**: `INSERT OR REPLACE` (idempotent re-queuing)

---

## Queue Operations

### After INSERT
```typescript
await db.runAsync('INSERT INTO journal_entries (...) VALUES (...)', [...]);
await addToSyncQueue(db, 'journal_entries', entryId, 'insert');
```

### After UPDATE
```typescript
await db.runAsync('UPDATE journal_entries SET ... WHERE id = ?', [...]);
await addToSyncQueue(db, 'journal_entries', entryId, 'update');
```

### BEFORE DELETE (captures supabase_id first!)
```typescript
await addDeleteToSyncQueue(db, 'journal_entries', entryId, userId);
await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [entryId]);
```

**Critical**: `addDeleteToSyncQueue` must be called BEFORE the actual delete because it looks up the `supabase_id` from the local record.

---

## Processing Order

### CRITICAL: Delete-Before-Insert Rule

```
1. Fetch all pending items (retry_count < 3, failed_at IS NULL)
2. PHASE 1: Execute ALL DELETE operations first
3. PHASE 2: Execute ALL INSERT/UPDATE (upserts) second
```

**Why**: Prevents foreign key constraint violations when a record is deleted and recreated, or when related records have dependencies.

---

## Retry & Backoff

| Property | Value |
|----------|-------|
| Max Retries | 3 |
| Backoff | Exponential: `1s × 2^(retry-1)` |
| Max Delay | 30 seconds |
| Timeout | 30 seconds per operation |
| After Max Retries | Mark `failed_at` timestamp, skip in future |

### Failure Handling
```
Attempt 1 → fail → wait 1s → retry
Attempt 2 → fail → wait 2s → retry
Attempt 3 → fail → mark failed_at → skip permanently
```

---

## Sync Triggers

| Trigger | Mechanism |
|---------|-----------|
| Periodic | Every 5 minutes when online |
| Network Reconnect | When offline → online detected |
| App Foreground | When app returns from background |
| Manual | User-triggered sync button |

### Network Detection
- **Mobile**: `@react-native-community/netinfo` subscription
- **Web**: `navigator.onLine` + `online`/`offline` events

### Foreground Detection
- **Mobile**: React Native `AppState` listener
- **Web**: `document.visibilitychange` event

---

## Concurrency Control

### Mutex Pattern
- Single sync process at a time via `syncMutexRef`
- If sync already running, new trigger is ignored
- Prevents duplicate upserts and race conditions

### Idempotency
- Supabase upserts use `onConflict: 'id'` (auto-upsert)
- Queue uses `INSERT OR REPLACE` (same ID overwrites)
- Delete of unsynced record (no supabase_id) → silently skipped

---

## Sync Status Tracking

### Local Columns on Syncable Tables
- `sync_status`: 'pending' | 'synced' | 'error'
- `supabase_id`: UUID assigned by Supabase after first sync

### After Successful Sync
```sql
UPDATE table_name 
SET supabase_id = ?, sync_status = 'synced', updated_at = ?
WHERE id = ?
```

---

## Synced Tables

| Table | Sync Support | Added Version |
|-------|-------------|---------------|
| journal_entries | ✅ | v0 |
| daily_checkins | ✅ | v0 (supabase_id v1) |
| step_work | ✅ | v0 (supabase_id v4) |
| reading_reflections | ✅ | v5 |
| favorite_meetings | ✅ | v3 |
| sponsor_connections | ✅ | v7 (sync v9) |
| sponsor_shared_entries | ✅ | v7 (sync v9) |
| weekly_reports | ✅ | v8 (sync v9) |

---

## SyncContext Lifecycle

### Initialization
1. Subscribe to network state
2. Start 5-minute periodic sync timer
3. Listen for app foreground events

### On Logout
1. Set `pendingLogoutClearRef.current = true`
2. When user becomes null + db ready → `clearDatabase(db)`
3. Deletes all local data (sync queue included)

### On Login/Auth Change
1. Reset sync state
2. Trigger initial sync

---

## Conflict Resolution

**Strategy**: Last-Write-Wins (LWW) for MVP
- No complex merge logic
- Cloud record overwrites on upsert via `onConflict: 'id'`
- `updated_at` timestamp used for ordering
- Future: Consider vector clocks or CRDTs for multi-device

---

## Key Files

| File | Purpose |
|------|---------|
| `src/services/syncService.ts` | Queue processing, retry, batch operations |
| `src/services/backgroundSync.ts` | Background fetch integration |
| `src/contexts/SyncContext.tsx` | Sync lifecycle, network state, periodic triggers |
| `src/hooks/useOfflineMutation.ts` | React Query mutation with offline queue |

---

## Agent Implementation Checklist

When adding a new syncable feature:
1. Add `sync_status TEXT DEFAULT 'pending'` and `supabase_id TEXT` columns
2. Call `addToSyncQueue()` after every INSERT/UPDATE
3. Call `addDeleteToSyncQueue()` BEFORE every DELETE
4. Create Supabase table with matching schema
5. Add RLS policy: `auth.uid() = user_id`
6. Add table to sync service's table list
7. Ensure all sensitive columns are encrypted before write
8. Test: offline write → come online → verify sync → check Supabase
