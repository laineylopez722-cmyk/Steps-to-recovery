# Steps to Recovery - AI Agent Guide

This file provides essential information for AI coding agents working on the **Steps to Recovery** project.

---

## Project Overview

**Steps to Recovery** is a privacy-first 12-Step Recovery Companion mobile application built with React Native and Expo. The app emphasizes:

- **End-to-end encryption** for all journal entries and sensitive data
- **Offline-first** architecture with SQLite (mobile) and IndexedDB (web)
- **No third-party trackers** or analytics without consent
- **Row-Level Security** on all cloud data

**Core Philosophy**: Privacy-first, offline-first, security-first. All sensitive data must be encrypted before storage or transmission.

**Development Methodology**: BMAD (Build-Measure-Analyze-Decide) - Iterative development with focus on user feedback and continuous improvement.

**Current Status**: Phase 1 Complete (Auth & Core Architecture). Phase 2 in progress (Journaling & Step Work).

**Supabase Project**: `tbiunmmvfbakwlzykpwq`

---

## Technology Stack

### Core Technologies

| Category             | Technology                        | Version              |
| -------------------- | --------------------------------- | -------------------- |
| **Frontend**         | React Native + Expo               | SDK ~54.0.32         |
| **React**            | React                             | 19.1.0               |
| **Language**         | TypeScript                        | ~5.9.3 (strict mode) |
| **Backend**          | Supabase                          | ^2.89.0              |
| **Database**         | PostgreSQL (Supabase)             | -                    |
| **Offline Storage**  | SQLite (mobile) / IndexedDB (web) | expo-sqlite ~16.0.10 |
| **State Management** | React Query + Zustand             | ^5.90.15 / ^5.0.9    |
| **Navigation**       | React Navigation                  | ^7.x                 |
| **Styling**          | NativeWind (Tailwind CSS)         | ^4.2.1               |
| **Monorepo**         | Turborepo                         | ^2.8.1               |
| **Package Manager**  | npm                               | 10.9.2               |

### Security & Encryption

- **Encryption**: AES-256-CBC with crypto-js
- **Key Storage**: expo-secure-store (Keychain/Keystore)
- **PBKDF2**: 100,000 iterations for key derivation
- **HMAC-SHA256**: Authentication tags (encrypt-then-MAC)

### Key Dependencies

```json
{
  "expo": "~54.0.32",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "@supabase/supabase-js": "^2.93.3",
  "@tanstack/react-query": "^5.90.15",
  "zustand": "^5.0.9",
  "crypto-js": "^4.2.0",
  "expo-sqlite": "~16.0.10",
  "expo-secure-store": "~15.0.8"
}
```

---

## Project Structure

```
Steps-to-recovery/
├── apps/
│   ├── mobile/              # Expo React Native app (MVP focus)
│   │   ├── src/
│   │   │   ├── features/    # Feature-based organization
│   │   │   │   ├── auth/    # Authentication & onboarding
│   │   │   │   ├── home/    # Dashboard, clean time tracker, check-ins
│   │   │   │   ├── journal/ # Encrypted journaling
│   │   │   │   ├── steps/   # 12-step work tracking
│   │   │   │   ├── sponsor/ # Sponsor connections
│   │   │   │   ├── meetings/# Meeting finder & favorites
│   │   │   │   ├── progress/# Analytics & milestones
│   │   │   │   └── ...
│   │   │   ├── components/  # Shared UI components
│   │   │   ├── contexts/    # React contexts (Auth, Database, Sync)
│   │   │   ├── navigation/  # React Navigation setup
│   │   │   ├── lib/         # Third-party integrations (Supabase, Sentry)
│   │   │   ├── utils/       # Utilities (encryption, logging)
│   │   │   ├── adapters/    # Platform abstraction (storage, secureStorage)
│   │   │   ├── design-system/# iOS-style design tokens & components
│   │   │   └── hooks/       # Shared custom hooks
│   │   ├── App.tsx          # Root component
│   │   └── package.json
│   └── web/                 # Next.js app (future)
├── packages/
│   └── shared/              # Shared types, constants, utilities
│       └── src/
│           ├── types/       # TypeScript types (database.ts, models.ts)
│           ├── services/    # Shared services
│           └── index.ts     # Main exports
├── supabase/                # Supabase functions/config
├── .claude/                 # Claude Code prompt files & skills
├── .github/                 # GitHub Actions, agents, templates
├── docs/                    # Documentation (API, Privacy Policy)
└── package.json             # Monorepo workspace config
```

### Feature Organization

Each feature contains:

- `screens/` - Screen components
- `components/` - Feature-specific components
- `hooks/` - Feature-specific hooks (e.g., `useJournalEntries`)

---

## Build and Test Commands

### Root-Level Commands (Monorepo)

```bash
# Development
npm run dev          # Start all dev servers
npm run mobile       # Start Expo dev server (mobile app)
npm run web          # Start web app

# Building
npm run build        # Build all packages
npm run clean        # Clean build artifacts

# Testing
npm test             # Run all tests
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run format       # Format with Prettier
npm run format:check # Check formatting
```

### Mobile App Commands (apps/mobile)

```bash
cd apps/mobile

# Development
npm start            # Start Expo dev server
npm run android      # Run on Android emulator
npm run ios          # Run on iOS simulator (macOS only)
npm run web          # Run web version

# Testing
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage# Run tests with coverage report
npm run test:encryption # Run encryption tests (CRITICAL)

# Quality
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

### Critical Test Command

**Always run encryption tests after modifying encryption code:**

```bash
cd apps/mobile && npm run test:encryption
```

---

## Code Style Guidelines

### TypeScript Configuration

- **Strict mode enabled** - No `any` types allowed
- All functions MUST have explicit return types
- All component props MUST have TypeScript interfaces
- Use `unknown` for errors, then type guard

### Formatting (Prettier)

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Editor Configuration

- **Charset**: UTF-8
- **End of line**: LF
- **Indent**: 2 spaces
- **Trim trailing whitespace**: Yes

### Code Conventions

```typescript
// ✅ CORRECT: Explicit types, single quotes, trailing commas
interface JournalEntryProps {
  entryId: string;
  onSave: (content: string) => Promise<void>;
}

export function JournalEntry({ entryId, onSave }: JournalEntryProps): React.ReactElement {
  const [content, setContent] = useState('');
  // ...
}

// ❌ WRONG: No 'any' types, no default exports
export function JournalEntry({ entryId, onSave }: any) {
  // Never use 'any'
  // ...
}
```

### Commit Convention

Uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add journal entry sharing
fix: resolve sync queue deadlock
refactor: extract encryption logic
test: add coverage for step work hooks
docs: update API documentation
```

---

## Testing Instructions

### Test Framework Stack

- **Test Runner**: Jest 29
- **React Native Testing**: @testing-library/react-native 13.3
- **Mocking**: Jest mocks + custom setup
- **Coverage**: Istanbul (built into Jest)

### Test File Structure

Tests are **co-located** with source code in `__tests__/` directories:

```
src/
├── utils/
│   ├── encryption.ts
│   └── __tests__/
│       └── encryption.test.ts
├── services/
│   ├── syncService.ts
│   └── __tests__/
│       └── syncService.test.ts
```

### Coverage Thresholds

```javascript
// Critical security modules require higher coverage
'./src/utils/encryption.ts': {
  statements: 90,
  branches: 85,
  functions: 90,
  lines: 90,
},
'./src/services/syncService.ts': {
  statements: 70,
  branches: 60,
  functions: 70,
  lines: 70,
}
```

**Goal**: Maintain ≥75% coverage for production releases.

### What to Test

**✅ DO test**:

- **Critical security code**: Encryption, authentication, RLS
- **Business logic**: Journal creation, sync logic, milestone calculations
- **User-facing features**: Navigation, form validation, error states
- **Error handling**: Network failures, invalid data, missing keys

**❌ DON'T test**:

- **Third-party libraries**: Trust `crypto-js`, `@tanstack/react-query`
- **Expo SDK internals**: Trust `expo-sqlite`, `expo-secure-store`
- **Implementation details**: Internal state, private methods

### Testing Encryption (CRITICAL)

Always test encryption roundtrips:

```typescript
it('should encrypt and decrypt to return original text', async () => {
  const plaintext = 'Sensitive recovery journal entry';
  const encrypted = await encryptContent(plaintext);

  // Verify encrypted (not plaintext)
  expect(encrypted).not.toBe(plaintext);
  expect(encrypted).toContain(':'); // IV:ciphertext format

  // Decrypt and verify
  const decrypted = await decryptContent(encrypted);
  expect(decrypted).toBe(plaintext);
});
```

---

## Security Considerations

### Encryption-First Data Flow

**CRITICAL PATTERN**: All sensitive data follows this flow:

```
User Input → Encrypt (encryptContent) → Store in SQLite → Queue for Sync → Encrypt Again → Send to Supabase
```

**Key Rules**:

- NEVER store unencrypted sensitive data anywhere
- Encryption keys stored ONLY in SecureStore (never AsyncStorage, SQLite, or Supabase)
- Each encryption generates a unique IV (prevents pattern analysis)
- Use `encryptContent()` and `decryptContent()` from `utils/encryption.ts`

### Security Checklist (Before Every PR)

- [ ] All sensitive data encrypted with `encryptContent()`
- [ ] Keys stored in SecureStore only (never AsyncStorage)
- [ ] RLS policies verified on new tables
- [ ] No console.log with sensitive data
- [ ] Sync operations preserve encryption end-to-end

### Secure Key Storage

```typescript
// ✅ CORRECT: Use SecureStore for encryption keys and tokens
import { secureStorage } from '../adapters/secureStorage';
await secureStorage.setItemAsync('encryption_key', key);

// ❌ WRONG: Never use AsyncStorage for sensitive data
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('encryption_key', key); // NEVER DO THIS
```

### Logging Sensitive Data

```typescript
// ✅ CORRECT: Use logger (auto-sanitizes in production)
import { logger } from '../utils/logger';
logger.info('Journal entry saved', { entryId, userId });

// ❌ WRONG: Never log sensitive content
console.log('Saved entry:', journalText); // NEVER DO THIS
console.error('Encryption key:', key); // NEVER DO THIS
```

### Supabase RLS Policies

All Supabase tables MUST have Row-Level Security enabled:

```sql
-- Example RLS policy pattern
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own data"
  ON table_name FOR ALL
  USING (auth.uid() = user_id);
```

**RLS Policy Pattern**: Always filter by `auth.uid() = user_id` for user data tables.

### Important Anti-Patterns to Avoid

1. ❌ **Never** store unencrypted sensitive data in SQLite, Supabase, or AsyncStorage
2. ❌ **Never** use AsyncStorage for tokens or encryption keys (use SecureStore)
3. ❌ **Never** use default exports (breaks tree-shaking, harder to refactor)
4. ❌ **Never** log full error objects (may contain sensitive data)
5. ❌ **Never** skip accessibility props (WCAG AAA required)
6. ❌ **Never** use `.then()` chains (use async/await)
7. ❌ **Never** use bare console.log/error (use logger from `utils/logger.ts`)

---

## Deployment Process

### Build Profiles (eas.json)

| Profile         | Purpose                     | Distribution      |
| --------------- | --------------------------- | ----------------- |
| **development** | Internal testing, debugging | Internal only     |
| **preview**     | QA testing, beta releases   | Internal testing  |
| **production**  | App Store / Play Store      | Public app stores |

### Build Commands

```bash
cd apps/mobile

# Development build
eas build --profile development --platform android
eas build --profile development --platform ios

# Production build
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios --latest
eas submit --platform android --latest
```

### Environment Variables

**Required for all builds**:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn  # Optional but recommended
```

**Set in Expo Dashboard** (Secrets): https://expo.dev

### Pre-Release Checklist

#### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] Test coverage >75% (`npm run test:coverage`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint warnings (`npm run lint`)

#### Functionality

- [ ] Signup/Login works
- [ ] Journal entry encryption/decryption works
- [ ] Daily check-ins save correctly
- [ ] Sync to Supabase works
- [ ] Offline mode works (airplane mode test)

#### Security

- [ ] Sensitive data encrypted before storage
- [ ] Encryption keys stored in SecureStore
- [ ] No PII logged in console or error logs
- [ ] Supabase RLS policies tested and working

---

## Architecture Overview

### 1. Context Architecture

Three primary contexts that work together:

```
AuthContext
    ├─ Manages Supabase authentication
    ├─ Initializes SecureStore with session token
    └─ Triggers cleanup on logout

DatabaseContext
    ├─ Provides platform-specific StorageAdapter
    ├─ Initializes database schema
    └─ Waits for auth before exposing db

SyncContext
    ├─ Monitors network state
    ├─ Processes sync queue in background
    ├─ Clears database on user logout
    └─ Handles retry logic for failed syncs
```

**Initialization Order**: AuthContext → DatabaseContext → SyncContext

### 2. Background Sync Architecture

Queue-based eventual consistency with Supabase:

```
Local Write → Add to sync_queue → Background Worker → Process Queue → Upsert to Supabase
```

**Important**: Deletes are processed BEFORE inserts/updates to avoid foreign key conflicts.

**Sync Triggers**:

1. Every 5 minutes when online
2. When app returns from background
3. When device comes online
4. User-triggered sync

### 3. React Query Patterns

```typescript
// Use React Query for data fetching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useJournalEntries() {
  const { db } = useDatabase();

  return useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const entries = await db.getAllAsync<JournalEntry>(
        'SELECT * FROM journal_entries ORDER BY created_at DESC',
      );
      // Decrypt entries for display
      return Promise.all(
        entries.map(async (entry) => ({
          ...entry,
          content: await decryptContent(entry.encrypted_body),
        })),
      );
    },
    enabled: !!db,
  });
}
```

---

## Accessibility Requirements

**Target**: WCAG AAA compliance (users may be in vulnerable states)

ALL interactive components MUST include:

- `accessibilityLabel` (required)
- `accessibilityRole` (required)
- `accessibilityState` (when disabled/loading)
- `accessibilityHint` (when action is non-obvious)

```typescript
// ✅ CORRECT
<Button
  onPress={handleSave}
  accessibilityLabel="Save journal entry"
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
>
  Save
</Button>
```

**Additional Requirements**:

- Minimum touch target: 48x48dp
- Color contrast ratio: 7:1 (AAA)
- Support screen readers (TalkBack, VoiceOver)
- Support font scaling (up to 200%)

---

## Key Files Reference

### Security-Critical Files

| File                                       | Purpose                              |
| ------------------------------------------ | ------------------------------------ |
| `apps/mobile/src/utils/encryption.ts`      | AES-256-CBC encryption with PBKDF2   |
| `apps/mobile/src/adapters/secureStorage/`  | Platform-specific secure key storage |
| `apps/mobile/src/services/syncService.ts`  | Queue processing, retry logic        |
| `apps/mobile/src/contexts/SyncContext.tsx` | Manages sync lifecycle               |

### Core Configuration Files

| File                        | Purpose                                |
| --------------------------- | -------------------------------------- |
| `package.json`              | Monorepo workspace config, npm scripts |
| `turbo.json`                | Turborepo task pipeline                |
| `apps/mobile/package.json`  | Mobile app dependencies                |
| `apps/mobile/tsconfig.json` | TypeScript config (strict mode)        |
| `.prettierrc.json`          | Code formatting rules                  |
| `.editorconfig`             | Editor settings                        |

### Database & Backend

| File                       | Purpose                                |
| -------------------------- | -------------------------------------- |
| `supabase-schema.sql`      | Base database schema with RLS policies |
| `supabase-migration-*.sql` | Migration files for additional tables  |

---

## Resources & Documentation

### Project Documentation

- **Setup Guide**: `SETUP.md` - Complete setup and installation
- **Testing Guide**: `TESTING.md` - Testing strategy and commands
- **Deployment Guide**: `DEPLOYMENT.md` - Build and release process
- **Troubleshooting**: `TROUBLESHOOTING.md` - Common issues and fixes
- **Security**: `SECURITY.md` - Security practices, key rotation
- **API & Data Model**: `docs/API.md` - Local schema, sync, Supabase overview

### External Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

---

## Support & Emergency Resources

If you or someone you know is struggling with addiction:

- **SAMHSA National Helpline**: 1-800-662-4357
- **Crisis Text Line**: Text HOME to 741741
- **Alcoholics Anonymous**: https://www.aa.org
- **Narcotics Anonymous**: https://www.na.org

---

**Remember**: This is a recovery app handling sensitive personal data. Privacy and security are paramount. When in doubt, encrypt first, ask questions later.

**Support Mission**: Build with empathy. Users may be in crisis when they open this app. Every feature should be supportive, non-judgmental, and quick to access.
