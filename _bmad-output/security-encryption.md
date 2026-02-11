# Security & Encryption Reference

_Complete encryption implementation guide for Steps-to-Recovery. All sensitive data MUST follow these patterns._

---

## Encryption Architecture

### Algorithm: AES-256-CBC + HMAC-SHA256 (Encrypt-then-MAC)

| Property | Value |
|----------|-------|
| Cipher | AES-256-CBC |
| Padding | PKCS7 |
| Key Size | 256-bit (32 bytes) |
| IV | 16 random bytes, unique per encryption |
| MAC | HMAC-SHA256 over `{iv}:{ciphertext}` |
| MAC Comparison | Constant-time (`constantTimeEqual()`) |
| Key Derivation | PBKDF2, 100,000 iterations |
| Format | `{iv_hex}:{ciphertext_base64}:{mac_hex}` |
| Legacy Format | `{iv}:{ciphertext}` (accepted on read, migrated on write) |

### Encryption Flow
```
plaintext
  → Generate random 16-byte IV
  → AES-256-CBC encrypt with derived key
  → Compute HMAC-SHA256 over "{iv}:{ciphertext}"
  → Return "{iv_hex}:{ciphertext_base64}:{mac_hex}"
```

### Decryption Flow
```
encrypted_string
  → Split on ":" → [iv, ciphertext, mac]
  → Verify HMAC-SHA256 (constant-time comparison)
  → If MAC invalid → throw error (fail fast)
  → AES-256-CBC decrypt with derived key
  → Return plaintext
```

---

## Key Storage — Platform Rules

### IMMUTABLE RULE: Keys NEVER in AsyncStorage, SQLite, or Supabase

| Platform | Storage Backend | Access API | Notes |
|----------|----------------|------------|-------|
| iOS | Keychain (hardware-backed) | `expo-secure-store` | Generated on onboarding, deleted on logout |
| Android | Keystore (hardware-backed) | `expo-secure-store` | May return null after device reboot (prompt unlock) |
| Web | localStorage + Web Crypto API | AES-GCM encrypted seed | Seed + salt in localStorage; key derived on-demand via PBKDF2 |

### Web Key Derivation
1. Generate 32 random bytes → `seed` (stored in localStorage as JSON array)
2. Generate 32 random bytes → `salt` (stored in localStorage per-user)
3. Derive key: `PBKDF2(seed, salt, 100k iterations)` → AES-GCM-256
4. Master key NEVER persisted directly
5. Both seed & salt deleted on `clearSession()` (logout)

### Key Lifecycle
```
Onboarding → generateEncryptionKey() → store in SecureStore
App Launch → getEncryptionKey() → derive working key
Logout → performLogoutCleanup() → delete key → clear DB → clear web session
```

---

## Data Flow Patterns

### Encrypt Before Storage
```typescript
// ✅ CORRECT
const encrypted = await encryptContent(journalText);
await db.runAsync(
  'INSERT INTO journal_entries (id, user_id, encrypted_body, ...) VALUES (?, ?, ?, ...)',
  [id, userId, encrypted, ...]
);
await addToSyncQueue(db, 'journal_entries', id, 'insert');

// ❌ WRONG — plaintext storage
await db.runAsync('INSERT INTO journal_entries (id, body) VALUES (?, ?)', [id, journalText]);
```

### Decrypt on Read
```typescript
const entries = await db.getAllAsync<JournalEntry>(
  'SELECT * FROM journal_entries WHERE user_id = ?', [userId]
);
return Promise.all(entries.map(async (e) => ({
  ...e,
  content: await decryptContent(e.encrypted_body),
})));
```

### Multi-Field Encryption (Tags, Arrays)
- Encrypt array as single JSON string: `encryptContent(JSON.stringify(tags))`
- Supabase stores as single-element array `[encrypted_blob]`
- On read: Extract first element, decrypt, JSON.parse

### Fields Always Encrypted
- Journal: title, body, mood, craving, tags
- Check-ins: intention, reflection, mood, craving, gratitude
- Step work: answers
- Reading reflections
- Favorite meeting notes
- Sponsor shared entry payloads

### Fields NOT Encrypted (for filtering/sorting)
- IDs, user_id, timestamps
- sync_status, supabase_id
- step_number, question_number, is_complete
- check_in_type, check_in_date
- Meeting location data (public)

---

## Sync Queue Security

### Queue Order: DELETE → INSERT/UPDATE
1. Fetch all pending items (retry_count < 3, failed_at IS NULL)
2. **Phase 1**: Execute all DELETE operations
3. **Phase 2**: Execute all INSERT/UPDATE (upserts)

### Queue Functions
```typescript
// After INSERT/UPDATE
await addToSyncQueue(db, 'journal_entries', entryId, 'insert');

// BEFORE DELETE (captures supabase_id first)
await addDeleteToSyncQueue(db, 'journal_entries', entryId, userId);
await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [entryId]);
```

### Security Properties
- Encrypted blob sent directly to Supabase (no re-encryption)
- Supabase cannot decrypt (RLS only filters by user_id)
- Mutex prevents concurrent queue processing
- Max 3 retries with exponential backoff (1s base, 30s cap)

---

## Supabase RLS Policies

### Standard Pattern
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own data"
  ON table_name FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Shared Data Pattern (Journal Entries)
```sql
CREATE POLICY "Users can view own or shared entries"
  ON journal_entries FOR SELECT
  USING (
    auth.uid() = user_id
    OR (is_shared = true AND auth.uid() = ANY(shared_with))
  );
```

### Sponsorship Pattern
```sql
CREATE POLICY "View if involved"
  ON sponsorships FOR SELECT
  USING (auth.uid() = sponsor_id OR auth.uid() = sponsee_id);
```

---

## Logout Cleanup (CRITICAL)

**Call `performLogoutCleanup()` BEFORE `supabase.auth.signOut()`**

### Cleanup Order (errors don't block):
1. Delete encryption key from SecureStore
2. Clear web session (seed + salt from localStorage)
3. Clear all local database tables
4. Clear shared database (native only)

### SyncContext Safety Net:
- Sets `pendingLogoutClearRef.current = true`
- When user becomes null and db ready → calls `clearDatabase(db)` automatically

---

## Logging Rules

### MANDATORY: Use `logger.*` NOT `console.log`

```typescript
import { logger } from '@/utils/logger';

// ✅ Safe — auto-redacted
logger.info('Entry saved', { entryId, userId });

// ❌ NEVER — leaks data
console.log('Saved:', journalText);
```

### Auto-Redaction
- Field names: `encrypted_*`, `body`, `content`, `password`, `token`, `key`, `secret`, `iv`, `salt`
- Long strings: >100 chars → `[REDACTED_STRING_NNN_CHARS]`
- Hex keys: 32+ hex chars → `[REDACTED_HEX_NNN_CHARS]`
- Production: Only errors logged (info/warn/debug silent)

---

## Anti-Patterns Summary

| ❌ NEVER | ✅ INSTEAD | Risk |
|----------|-----------|------|
| AsyncStorage for keys | SecureStore | Key exposure |
| console.log with data | logger.* (redacted) | Data leak |
| Plaintext storage | encryptContent() first | Privacy violation |
| Reuse IV | Unique IV per call | Breaks CBC security |
| Skip MAC verification | Verify before decrypt | Tampering undetected |
| Decrypt before MAC check | MAC → decrypt order | Crash on corrupted data |
| Send key to server | Keys stay client-only | Trust compromise |
| Sync before encrypt | Encrypt → Queue → Sync | Plaintext in flight |
| Delete key without cleanup | performLogoutCleanup() | Orphaned encrypted data |

---

## Unobvious Agent Pitfalls

1. **Check `hasEncryptionKey()` before encrypt** — route to onboarding if missing
2. **Web requires `initializeWithSession()`** after auth for master key derivation
3. **Android Keystore locks after reboot** — SecureStore returns null; retry or prompt
4. **Upserts use record ID, not supabase_id** — ID must match cloud record
5. **Sync retries reset on app restart** — backoff is per-queue-process, not persistent
6. **RLS cannot decrypt shared_with arrays** — sharing logic is app-side only
7. **Logger strips stack traces in production** — dev can debug paths; prod hides them
