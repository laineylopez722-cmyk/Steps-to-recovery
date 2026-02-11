# Sync Queue Integration

## Import Statement

```typescript
import { addToSyncQueue, addDeleteToSyncQueue } from '@/services/syncService';
```

## After INSERT Operations

```typescript
// After inserting a record, queue it for cloud sync
const id = generateUUID();
await db.runAsync(
  'INSERT INTO table_name (id, user_id, encrypted_content, created_at) VALUES (?, ?, ?, ?)',
  [id, userId, encryptedContent, new Date().toISOString()]
);

// Queue for sync
await addToSyncQueue(db, 'table_name', id, 'insert');
```

## After UPDATE Operations

```typescript
// After updating a record, queue it for sync
await db.runAsync(
  'UPDATE table_name SET encrypted_content = ?, updated_at = ? WHERE id = ?',
  [encryptedContent, new Date().toISOString(), id]
);

// Queue for sync
await addToSyncQueue(db, 'table_name', id, 'update');
```

## Before DELETE Operations

```typescript
// BEFORE deleting, queue the delete operation (captures supabase_id)
await addDeleteToSyncQueue(db, 'table_name', id, userId);

// Then delete from local database
await db.runAsync('DELETE FROM table_name WHERE id = ?', [id]);
```

## Sync Queue Best Practices

- [ ] Always add to sync queue after INSERT/UPDATE operations
- [ ] Always add delete to queue BEFORE deleting from local DB
- [ ] Delete operations are processed BEFORE inserts/updates (avoids FK conflicts)
- [ ] Preserve `supabase_id` for idempotent upserts
- [ ] Set `sync_status` to `pending` after queuing
- [ ] Sync queue is processed automatically every 5 minutes when online
