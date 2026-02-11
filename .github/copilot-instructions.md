# Copilot Instructions — Steps to Recovery

A privacy-first 12-step recovery companion mobile app built with React Native/Expo. **Core philosophy**: Encrypt-first, offline-first, security-first.

## Build & Test Commands

```bash
# Development
npm run mobile              # Start Expo dev server (from root)
npm run android            # Run Android emulator
npm run ios                # Run iOS simulator
cd apps/mobile && npm start # Start from mobile dir

# Testing
npm test                   # Run all tests (from root)
cd apps/mobile && npm test # Run mobile tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
npm run test:encryption    # Encryption tests only (CRITICAL after crypto changes)

# Run specific test file
npm test -- useJournalEntries
npm test -- --findRelatedTests src/features/journal/hooks/useJournalEntries.ts

# E2E tests (Maestro)
cd apps/mobile
npm run e2e               # All flows
npm run e2e:onboarding    # Specific flow
npm run e2e:validate      # Dry run syntax check

# Quality checks
npm run lint              # ESLint (from root)
npm run type-check        # TypeScript check (from root)
cd apps/mobile && npx tsc --noEmit  # Type check mobile only
npm run format            # Prettier format
npm run format:check      # Check formatting
```

## Architecture: Privacy-First Data Flow

**Critical Pattern**: All sensitive data (journal entries, step work, check-ins) follows this flow:

```
User Input → encryptContent() → SQLite/IndexedDB → Sync Queue → Supabase (encrypted blob)
           ↓
User Display ← decryptContent() ← Local DB ← Fetch from Supabase
```

### Key Architectural Patterns

1. **Encryption-First**: Use `encryptContent()` / `decryptContent()` from `apps/mobile/src/utils/encryption.ts`
   - Keys stored ONLY in SecureStore (never AsyncStorage, SQLite, or Supabase)
   - AES-256-CBC with PBKDF2 (100k iterations)
   - Each encryption generates unique IV

2. **Offline-First Storage**:
   - SQLite (mobile) / IndexedDB (web) is source of truth
   - Supabase is backup/sync only
   - Platform abstraction via `StorageAdapter` pattern (`apps/mobile/src/adapters/storage/`)

3. **Background Sync**:
   - Queue-based eventual consistency
   - After any write, call `addToSyncQueue()` or `addDeleteToSyncQueue()`
   - Deletes processed BEFORE inserts/updates (avoid FK conflicts)
   - See `apps/mobile/src/services/syncService.ts`

4. **Context Initialization Order** (CRITICAL):
   ```
   AuthContext → DatabaseContext → SyncContext → NotificationContext
   ```
   - Each context depends on previous one being ready
   - See `apps/mobile/src/contexts/`

5. **Feature-Based Organization**:
   ```
   apps/mobile/src/features/
   ├── auth/          # Login, signup, onboarding
   ├── home/          # Dashboard, clean time tracker, check-ins
   ├── journal/       # Encrypted journaling
   │   ├── screens/
   │   ├── components/
   │   └── hooks/     # useJournalEntries, useCreateJournalEntry
   ├── steps/         # 12-step work tracking
   └── sponsor/       # Sponsor connections
   ```

## Code Conventions (Repo-Specific)

### TypeScript Strictness
- **NO `any` types allowed** - use `unknown` and type guard
- **Explicit return types required** on all functions
- **Component props** must have TypeScript interfaces
- Use `import type` for type-only imports

### Security Patterns
```typescript
// ✅ CORRECT: Encrypt before storage
const encrypted = await encryptContent(journalText);
await db.runAsync('INSERT INTO journal_entries (id, encrypted_body, ...) VALUES (?, ?, ...)', 
  [id, encrypted, ...]);
await addToSyncQueue(db, 'journal_entries', id, 'insert');

// ❌ WRONG: Never store plaintext sensitive data
await db.runAsync('INSERT INTO journal_entries (id, body, ...) VALUES (?, ?, ...)',
  [id, journalText, ...]);

// ✅ CORRECT: Use SecureStore for keys
import { secureStorage } from '@/adapters/secureStorage';
await secureStorage.setItemAsync('encryption_key', key);

// ❌ WRONG: Never use AsyncStorage for keys
await AsyncStorage.setItem('encryption_key', key);

// ✅ CORRECT: Use logger (sanitizes in production)
import { logger } from '@/utils/logger';
logger.info('Entry saved', { entryId, userId });

// ❌ WRONG: Never log sensitive data
console.log('Saved entry:', journalText);
```

### State Management Patterns
- **React Query** for server/async state: `useQuery`, `useMutation`
- **Zustand** for client UI state: `apps/mobile/src/store/`
- **Context** for cross-cutting concerns: Auth, Database, Sync

### UI/Styling Conventions
- **NativeWind** (Tailwind CSS) for styling
- **Design tokens** from `apps/mobile/src/design-system/tokens/` (colors, typography, spacing)
- **DO NOT** hardcode hex colors or arbitrary spacing values
- Use `cn()` helper from `apps/mobile/src/lib/utils.ts` for conditional classes

### Accessibility Requirements (WCAG AAA)
```typescript
// ✅ REQUIRED on ALL interactive elements
<Button
  onPress={handleSave}
  accessibilityLabel="Save journal entry"
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
  accessibilityHint="Saves your entry and syncs to cloud"
>
  Save
</Button>
```
- Minimum touch target: 48x48dp
- Color contrast: 7:1 (AAA level)
- Support screen readers (TalkBack, VoiceOver)

## Database Migrations

### Local Schema Changes
```typescript
// apps/mobile/src/utils/database.ts
const CURRENT_SCHEMA_VERSION = 5; // Increment this

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Add migration with columnExists() check
  if (version < 5) {
    const hasColumn = await columnExists(db, 'journal_entries', 'new_column');
    if (!hasColumn) {
      await db.execAsync('ALTER TABLE journal_entries ADD COLUMN new_column TEXT');
    }
  }
}
```

### Cloud Schema Changes
1. Update `supabase-schema.sql` (base schema)
2. Create migration file: `supabase-migration-{feature}.sql`
3. **ALWAYS add RLS policies**: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
4. Filter by user: `CREATE POLICY "policy_name" ON table_name USING (auth.uid() = user_id);`

## Sync Queue Pattern

**After any syncable write**, enqueue for background sync:

```typescript
import { addToSyncQueue, addDeleteToSyncQueue } from '@/services/syncService';

// After INSERT
await db.runAsync('INSERT INTO journal_entries (...) VALUES (...)', [...]);
await addToSyncQueue(db, 'journal_entries', entryId, 'insert');

// After UPDATE
await db.runAsync('UPDATE journal_entries SET ... WHERE id = ?', [...]);
await addToSyncQueue(db, 'journal_entries', entryId, 'update');

// BEFORE DELETE (captures supabase_id for cloud deletion)
await addDeleteToSyncQueue(db, 'journal_entries', entryId, userId);
await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [entryId]);
```

## Testing Conventions

### Test File Location
Tests are **co-located** with source code in `__tests__/` directories:
```
src/utils/
├── encryption.ts
└── __tests__/
    └── encryption.test.ts

src/features/journal/hooks/
├── useJournalEntries.ts
└── __tests__/
    └── useJournalEntries.test.ts
```

### Critical Test Coverage Thresholds
- `encryption.ts`: 90% (security-critical)
- `syncService.ts`: 70%
- `AuthContext.tsx`: 70%
- **Overall goal**: 75%+ for production

### Encryption Testing (CRITICAL)
**ALWAYS test encrypt → decrypt roundtrip**:
```typescript
it('should encrypt and decrypt to return original text', async () => {
  const plaintext = 'Sensitive journal entry';
  const encrypted = await encryptContent(plaintext);
  
  expect(encrypted).not.toBe(plaintext);
  expect(encrypted).toContain(':'); // IV:ciphertext format
  
  const decrypted = await decryptContent(encrypted);
  expect(decrypted).toBe(plaintext);
});
```

## Monorepo Structure

- **Turborepo** with npm workspaces
- **Path alias**: `@/` → `apps/mobile/src` (use absolute imports)
- **Shared package**: `@recovery/shared` for types/constants
- **Package manager**: npm 10.9.2 (pinned via `packageManager` field)
- **Node version**: >=20.0.0 required

## Environment Setup

```bash
# Required: Create apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://tbiunmmvfbakwlzykpwq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SENTRY_DSN=optional-sentry-dsn  # Optional
```

**Supabase Project**: `tbiunmmvfbakwlzykpwq`

## Security Checklist (Before Every PR)

- [ ] All sensitive data encrypted with `encryptContent()`
- [ ] Keys stored in SecureStore only (never AsyncStorage)
- [ ] RLS policies enabled on new Supabase tables
- [ ] No `console.log` with sensitive data (use `logger`)
- [ ] Sync operations preserve encryption end-to-end
- [ ] Run `npm run test:encryption` after crypto changes

## Common Pitfalls to Avoid

1. ❌ **Never** store unencrypted sensitive data anywhere
2. ❌ **Never** use AsyncStorage for tokens/keys (use SecureStore)
3. ❌ **Never** use default exports (breaks tree-shaking)
4. ❌ **Never** skip accessibility props (WCAG AAA required)
5. ❌ **Never** use `.then()` chains (use async/await)
6. ❌ **Never** use bare `console.*` (use logger)
7. ❌ **Never** hardcode design values (use design tokens)

## Reference Documentation

- **Deep Architecture**: [CLAUDE.md](../CLAUDE.md) - Comprehensive agent guide
- **AI Agent Rules**: [AGENTS.md](../AGENTS.md) - Quick reference
- **Testing Details**: [TESTING.md](../TESTING.md) - Test strategy
- **Deployment**: [DEPLOYMENT.md](../DEPLOYMENT.md) - Build & release
- **Setup Guide**: [SETUP.md](../SETUP.md) - Installation
- **Troubleshooting**: [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) - Common issues
