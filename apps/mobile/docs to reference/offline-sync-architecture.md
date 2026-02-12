# Offline-First Sync Architecture — Steps to Recovery

> Queue-based eventual consistency between local SQLite and Supabase.

## Architecture Overview

```
Local Write
    ↓
Encrypt sensitive data (encryptContent)
    ↓
INSERT/UPDATE/DELETE in SQLite
    ↓
addToSyncQueue(db, table, id, operation)
    ↓
Background Sync Worker (every 5 min or on triggers)
    ↓
Process Queue: Deletes FIRST, then Inserts/Updates
    ↓
Upsert to Supabase (encrypted blobs)
    ↓
Mark sync_queue entry as synced
    ↓
On failure: retry with exponential backoff (max 3 attempts)
```

## Sync Triggers

1. **Automatic**: Every 5 minutes when online
2. **App foreground**: `AppState.addEventListener('change')`
3. **Network reconnection**: NetInfo change listener
4. **Manual**: User-triggered pull-to-refresh

## Sync Queue Table

```sql
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'insert' | 'update' | 'delete'
  payload TEXT,            -- JSON blob for the record
  retry_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  last_attempted_at TEXT,
  status TEXT DEFAULT 'pending' -- 'pending' | 'processing' | 'failed' | 'synced'
);
```

## Usage Patterns

### After INSERT
```typescript
await db.runAsync(
  'INSERT INTO journal_entries (id, user_id, encrypted_body, ...) VALUES (?, ?, ?, ...)',
  [id, userId, encryptedBody, ...]
);
await addToSyncQueue(db, 'journal_entries', id, 'insert');
```

### After UPDATE
```typescript
await db.runAsync(
  'UPDATE journal_entries SET encrypted_body = ? WHERE id = ?',
  [encryptedBody, entryId]
);
await addToSyncQueue(db, 'journal_entries', entryId, 'update');
```

### Before DELETE (captures supabase_id)
```typescript
await addDeleteToSyncQueue(db, 'journal_entries', entryId, userId);
await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [entryId]);
```

## Synced Tables (8 total)

| Table | Sync | Encryption |
|-------|------|-----------|
| journal_entries | ✅ | ✅ encrypted_body |
| step_work | ✅ | ✅ encrypted_responses |
| daily_checkins | ✅ | ✅ encrypted_* fields |
| favorite_meetings | ✅ | ❌ |
| reading_reflections | ✅ | ✅ encrypted_reflection |
| weekly_reports | ✅ | ✅ encrypted_summary |
| sponsor_connections | ✅ | ❌ |
| sponsor_shared_entries | ✅ | ✅ encrypted_content |

## Conflict Resolution

**Strategy**: Last-write-wins (MVP)
- Most recent `updated_at` timestamp wins during upsert
- No merge-level conflict resolution yet
- Future: Consider CRDTs for critical data

## Processing Order

**Critical**: Deletes processed BEFORE inserts/updates to avoid FK conflicts.

```typescript
// In syncService.ts
async function processQueue(db: Database): Promise<void> {
  // 1. Process deletes first
  const deletes = await db.getAllAsync(
    "SELECT * FROM sync_queue WHERE operation = 'delete' AND status = 'pending' ORDER BY created_at ASC"
  );
  for (const item of deletes) await processDelete(item);

  // 2. Then inserts and updates
  const upserts = await db.getAllAsync(
    "SELECT * FROM sync_queue WHERE operation != 'delete' AND status = 'pending' ORDER BY created_at ASC"
  );
  for (const item of upserts) await processUpsert(item);
}
```

## Retry Logic

- Max retries: 3
- Backoff: Exponential (1s, 4s, 9s)
- After max retries: Mark as failed, log error
- Debug: `SELECT * FROM sync_queue WHERE retry_count >= 3`

## Network Detection

| Platform | Method |
|----------|--------|
| Mobile | `@react-native-community/netinfo` |
| Web | `navigator.onLine` + online/offline events |

## Testing Sync

1. **Offline mode**: Enable airplane mode, make changes, verify queued
2. **Reconnection**: Disable airplane mode, verify sync processes
3. **Retry**: Simulate network error, verify retry with backoff
4. **Order**: Verify deletes before inserts
5. **Encryption**: Verify data remains encrypted in Supabase
