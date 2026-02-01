# CLAUDE-BACKEND.md

Backend documentation for Steps to Recovery - Supabase, database, sync, and encryption.

## Supabase Project

**Project Reference**: `tbiunmmvfbakwlzykpwq`
**Dashboard**: Supabase Dashboard > Project Settings
**MCP URL**: `https://mcp.supabase.com/mcp?project_ref=tbiunmmvfbakwlzykpwq`

## Database Schema

### Core Tables

| Table               | Purpose                            | Encryption                                                                           |
| ------------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| `profiles`          | User metadata (extends auth.users) | No                                                                                   |
| `journal_entries`   | Journal entries with mood/tags     | `content` encrypted                                                                  |
| `step_work`         | 12-step work progress              | `content` encrypted                                                                  |
| `sponsorships`      | Sponsor-sponsee relationships      | No                                                                                   |
| `daily_checkins`    | Morning/evening check-ins          | `encrypted_intention`, `encrypted_reflection`, `encrypted_mood`, `encrypted_craving` |
| `favorite_meetings` | User's saved meetings              | No                                                                                   |

### Table Schemas

```sql
-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  sobriety_start_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries (encrypted content)
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,        -- Encrypted on client
  content TEXT NOT NULL,      -- Encrypted on client
  mood TEXT,
  tags TEXT[],
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with UUID[],         -- Sponsor user IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step work (encrypted content)
CREATE TABLE step_work (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  step_number INTEGER CHECK (step_number >= 1 AND step_number <= 12),
  content TEXT NOT NULL,      -- Encrypted on client
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsorships
CREATE TABLE sponsorships (
  id UUID PRIMARY KEY,
  sponsor_id UUID REFERENCES auth.users(id),
  sponsee_id UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row-Level Security (RLS)

**CRITICAL**: All tables MUST have RLS enabled. Never disable RLS in production.

### Pattern: User Owns Data

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- User can only access their own data
CREATE POLICY "Users can view own data"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON table_name FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON table_name FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON table_name FOR DELETE
  USING (auth.uid() = user_id);
```

### Pattern: Shared Data (Journal Entries)

```sql
-- Users can view own entries OR entries shared with them
CREATE POLICY "Users can view shared entries"
  ON journal_entries FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    (is_shared = true AND auth.uid() = ANY(shared_with))
  );
```

### Pattern: Sponsorships (Both Parties)

```sql
-- Both sponsor and sponsee can view the relationship
CREATE POLICY "View sponsorships"
  ON sponsorships FOR SELECT
  USING (auth.uid() = sponsor_id OR auth.uid() = sponsee_id);
```

---

## Sync Architecture

### Queue-Based Eventual Consistency

```
Local Write → Add to sync_queue → Background Worker → Process Queue → Upsert to Supabase
                                        ↓
                                  Retry Logic (3 attempts, exponential backoff)
                                        ↓
                              DELETES processed BEFORE INSERTS/UPDATES
```

### Sync Queue Table

```sql
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT CHECK (operation IN ('insert', 'update', 'delete')),
  supabase_id TEXT,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Key Sync Service Functions

**File**: `apps/mobile/src/services/syncService.ts`

```typescript
// Add item to sync queue after local write
export async function addToSyncQueue(
  db: StorageAdapter,
  tableName: string,
  recordId: string,
  operation: 'insert' | 'update',
): Promise<void>;

// Add delete to queue (captures supabase_id before deletion)
export async function addDeleteToSyncQueue(
  db: StorageAdapter,
  tableName: string,
  recordId: string,
  userId: string,
): Promise<void>;

// Process pending queue items
export async function processSyncQueue(db: StorageAdapter): Promise<SyncResult>;
```

### Sync Constants

| Constant             | Value | Purpose                            |
| -------------------- | ----- | ---------------------------------- |
| `NETWORK_TIMEOUT_MS` | 30000 | Max wait for Supabase response     |
| `MAX_RETRY_COUNT`    | 3     | Attempts before marking failed     |
| `BASE_BACKOFF_MS`    | 1000  | Base delay for exponential backoff |

### Sync Triggers

1. **Automatic**: Every 5 minutes when online
2. **App foreground**: When app returns from background
3. **Network reconnection**: When device comes online
4. **Manual**: User-triggered sync button

---

## Encryption

### Client-Side Encryption

All sensitive data is encrypted on the client BEFORE sending to Supabase.

**File**: `apps/mobile/src/utils/encryption.ts`

```typescript
// Encrypt before storage
const encryptedBody = await encryptContent(journalText);

// Decrypt after retrieval
const plaintext = await decryptContent(encryptedBody);
```

### Encryption Details

| Aspect         | Value                                             |
| -------------- | ------------------------------------------------- |
| Algorithm      | AES-256-CBC                                       |
| Key Derivation | PBKDF2                                            |
| IV             | Unique per encryption (prevents pattern analysis) |
| Key Storage    | SecureStore (device Keychain/Keystore)            |

### What's Encrypted

| Table             | Encrypted Fields                                                                     |
| ----------------- | ------------------------------------------------------------------------------------ |
| `journal_entries` | `title`, `content`                                                                   |
| `step_work`       | `content`                                                                            |
| `daily_checkins`  | `encrypted_intention`, `encrypted_reflection`, `encrypted_mood`, `encrypted_craving` |

### Never Store in Supabase

- Encryption keys
- Session tokens (use Supabase Auth)
- Plaintext sensitive content

---

## Migrations

### Running Migrations

1. Go to Supabase Dashboard > SQL Editor
2. Click "New Query"
3. Paste migration SQL
4. Click "Run"

### Migration Files

| File                                       | Purpose                                                  | Required     |
| ------------------------------------------ | -------------------------------------------------------- | ------------ |
| `supabase-schema.sql`                      | Base schema (profiles, journal, step_work, sponsorships) | Yes          |
| `supabase-migration-daily-checkins.sql`    | Check-in sync support                                    | **CRITICAL** |
| `supabase-migration-favorite-meetings.sql` | Favorite meetings                                        | Optional     |
| `supabase-schema-enhanced.sql`             | Extended features                                        | Optional     |

### Migration Checklist

- [ ] RLS enabled on all new tables
- [ ] Indexes on frequently queried columns (user_id, created_at)
- [ ] Updated_at triggers applied
- [ ] Policies for all CRUD operations
- [ ] Test with RLS enabled (never test with service key)

---

## Common Queries

### Check User's Journal Entries

```typescript
const { data, error } = await supabase
  .from('journal_entries')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Upsert Pattern (Sync)

```typescript
const { error } = await supabase.from('journal_entries').upsert(
  {
    id: localId,
    user_id: userId,
    title: encryptedTitle,
    content: encryptedContent,
    // ...
  },
  { onConflict: 'id' },
);
```

### Check Sync Queue Status

```sql
-- In SQLite (local)
SELECT * FROM sync_queue WHERE retry_count >= 3;
```

---

## Testing Database Changes

### Local Testing

1. Test with actual Supabase project (not mocked)
2. Create test user account
3. Verify RLS blocks cross-user access
4. Test sync queue processing

### RLS Testing

```typescript
// Should succeed (own data)
const { data, error } = await supabase
  .from('journal_entries')
  .select('*')
  .eq('user_id', currentUserId);

// Should return empty (other user's data)
const { data: otherData } = await supabase
  .from('journal_entries')
  .select('*')
  .eq('user_id', 'other-user-id'); // RLS blocks this
```

### Sync Testing

```bash
# Run sync service tests
cd apps/mobile && npm test -- syncService.test.ts
```

---

## Troubleshooting

### Sync Queue Growing

**Symptom**: `sync_queue` has many rows
**Check**: Network, Supabase credentials, RLS policies
**Debug**: `SELECT * FROM sync_queue WHERE retry_count >= 3`

### RLS Denies Access

**Symptom**: "permission denied" or empty results
**Check**: `auth.uid()` matches `user_id` column
**Debug**: Test policy with Supabase SQL Editor

### Encryption Key Missing

**Symptom**: Decrypt fails, data appears garbled
**Cause**: Key deleted from SecureStore
**Fix**: User must re-onboard (generates new key)

---

## Security Checklist

- [ ] RLS enabled on ALL tables
- [ ] All sensitive content encrypted before storage
- [ ] Encryption keys NEVER sent to Supabase
- [ ] Policies use `auth.uid()` for user isolation
- [ ] Service role key NEVER used in client code
- [ ] Anon key safe (RLS + client encryption protects data)
