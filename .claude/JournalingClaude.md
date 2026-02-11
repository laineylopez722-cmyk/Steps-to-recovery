# Encrypted Journaling Feature - Claude Prompt

## Objective

Implement encrypted personal journal feature with offline-first storage and cloud sync.

## Target Files

- `apps/mobile/src/features/journal/screens/JournalListScreen.tsx`
- `apps/mobile/src/features/journal/screens/JournalEntryScreen.tsx`
- `apps/mobile/src/features/journal/components/JournalCard.tsx`
- `apps/mobile/src/utils/encryption.ts` - Encryption/decryption utilities
- `apps/mobile/src/features/journal/hooks/useJournalEntries.ts` - Journal data hooks (React Query)

## Requirements

### UI Components

1. **Journal List Screen**
   - Display all journal entries (most recent first)
   - Search and filter by date, mood, tags
   - Pull-to-refresh for sync
   - "New Entry" floating action button
   - Unsynced entry indicators

2. **Journal Entry Screen**
   - Title and content fields
   - Mood selector (happy, neutral, sad, anxious, craving)
   - Tag system for categorization
   - "Share with Sponsor" toggle
   - Auto-save drafts
   - Timestamp display

### Encryption Implementation

- Use AES-256-CBC with HMAC-SHA256 for encryption
- Symmetric key stored in SecureStore
- Encrypt content before saving to SQLite
- Decrypt only when displaying to user
- Encryption key never leaves the device unencrypted

### SQLite Storage

- Local database for offline access
- Schema:
  ```sql
  CREATE TABLE journal_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    encrypted_content TEXT NOT NULL,
    mood TEXT,
    tags TEXT, -- JSON array
    is_shared BOOLEAN DEFAULT 0,
    shared_with TEXT, -- JSON array of sponsor IDs
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    sync_status TEXT DEFAULT 'pending'
  );
  ```

### Cloud Sync

- Background sync with Supabase when online
- Conflict resolution (last-write-wins for MVP)
- Retry mechanism for failed syncs
- Sync status indicators in UI

## Privacy Considerations

- All journal content encrypted client-side
- Server only stores ciphertext
- Supabase RLS policies: only user can access their entries
- Optional sharing requires explicit user action
