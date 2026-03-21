---
project_name: 'Steps to Recovery'
user_name: 'H'
date: '2025-12-31'
sections_completed:
  [
    'technology_stack',
    'language_rules',
    'framework_rules',
    'security_rules',
    'code_quality',
    'critical_rules',
  ]
existing_patterns_found: 15
---

# Project Context for AI Agents

_Privacy-first 12-step recovery companion app. ALL sensitive data MUST be encrypted. This file contains critical rules AI agents must follow._

---

## Technology Stack & Versions

**Core Framework:**

- Expo SDK **54.0.30** (new architecture enabled)
- React **19.1.0** (keep as-is, Expo 54 supports it)
- React Native **0.81.5**
- TypeScript **5.3.0+** with `strict: true` ENFORCED
- Node.js **>=20.0.0** REQUIRED

**State Management:**

- @tanstack/react-query **5.90.15** (server state)
- Zustand **5.0.9** (client state)
- React Context API (Auth, Database, Sync)

**Backend & Storage:**

- @supabase/supabase-js **2.89.0+**
- expo-sqlite **16.0.10**
- expo-secure-store **15.0.8** (encryption keys & tokens ONLY)
- @react-native-async-storage/async-storage **2.2.0** (non-sensitive only)

**Security & Encryption:**

- expo-crypto **15.0.8** + crypto-js **4.2.0** (AES-256-CBC)
- buffer **5.7.1**

**Navigation:**

- @react-navigation/native **7.1.26**
- @react-navigation/bottom-tabs **7.9.0**
- @react-navigation/native-stack **7.9.0**

**UI:**

- react-native-paper **5.14.5** (Material Design)

**Project Structure:**

- Single-app layout (no Turborepo)
- Shared code lives at `apps/mobile/src/shared/`

---

## Critical Implementation Rules

### Security & Encryption (HIGHEST PRIORITY)

**ENCRYPTION RULES - NEVER VIOLATE:**

- ✅ ALL sensitive data (journal entries, step work) MUST be encrypted with AES-256-CBC before storage
- ✅ Use `encryptContent()` from `utils/encryption.ts` - NEVER store plaintext
- ✅ Encryption keys stored ONLY in SecureStore (NEVER in AsyncStorage, SQLite, or Supabase)
- ✅ Each encryption generates unique IV - prevents pattern analysis
- ✅ PBKDF2 key derivation with 100,000 iterations

**PRIVACY RULES:**

- ❌ NEVER log sensitive data to console (journal content, step work, encryption keys, tokens)
- ❌ NEVER send sensitive data to third-party services (analytics, crash reporting)
- ✅ Use `logger` from `utils/logger.ts` (sanitizes production logs)
- ✅ Supabase RLS policies MUST protect all user data tables
- ✅ Offline-first: SQLite is primary, Supabase is backup/sync

**DATA STORAGE:**

- SecureStore: Encryption keys, auth tokens ONLY
- AsyncStorage: Non-sensitive preferences, settings
- SQLite: Encrypted journal entries, step work (local-first)
- Supabase: Encrypted backups with RLS protection

---

### TypeScript Rules

**STRICT MODE - ENFORCED:**

- ❌ NO `any` types allowed
- ✅ All functions MUST have explicit return types
- ✅ All component props MUST have TypeScript interfaces
- ✅ Use `unknown` for errors, then type guard

**IMPORT/EXPORT:**

- ✅ Use named exports (NO default exports)
- ✅ Import order: React → third-party → local absolute → relative
- ✅ Shared types in `apps/mobile/src/shared/types`

---

### React Native & React Rules

**HOOKS USAGE:**

- ✅ useCallback for functions passed as props
- ✅ useMemo for expensive computations
- ✅ useState for component state
- ✅ React Query for server state
- ✅ Zustand for global client state

**COMPONENT RULES:**

- ✅ ALL components MUST have accessibility props:
  - `accessibilityLabel` (required)
  - `accessibilityRole` (required)
  - `accessibilityState` (when disabled/loading)
- ✅ PascalCase for component files (Button.tsx)
- ✅ camelCase for utility files (encryption.ts)
- ✅ Feature-based organization (NOT technical layers)

**ASYNC/AWAIT:**

- ✅ Use async/await (NO .then() chaining)
- ✅ Always wrap in try/catch
- ✅ Update state in finally blocks (loading states)

---

### Code Organization

**FOLDER STRUCTURE:**

```
apps/mobile/src/
├── features/{auth,journal,steps}/  # Feature-based
│   ├── screens/
│   ├── components/
│   └── hooks/
├── components/                     # Shared components
├── contexts/                       # React contexts
├── lib/                           # Third-party integrations
├── utils/                         # Utility functions
└── navigation/                    # Navigation setup
```

**FILE NAMING:**

- Components: PascalCase (JournalCard.tsx)
- Utilities: camelCase (encryption.ts)
- Contexts: PascalCase with Context suffix (AuthContext.tsx)
- Hooks: camelCase with use prefix (useAuth.ts)

---

### Supabase Integration

**RLS POLICIES REQUIRED:**

- ALL user data tables MUST have Row-Level Security
- Policy pattern: `user_id = auth.uid()`
- NEVER allow SELECT without user_id filter
- Shared entries: Additional policy for sponsor access

**CLIENT-SIDE ENCRYPTION:**

- Encrypt before INSERT/UPDATE to Supabase
- Decrypt after SELECT from Supabase
- Supabase sees encrypted blobs ONLY

**OFFLINE SYNC:**

- SQLite is source of truth
- Supabase is backup (secondary)
- sync_status column: 'pending' | 'synced' | 'error'
- Background sync when network available

---

### Error Handling

**ERROR BOUNDARIES:**

- Wrap app in ErrorBoundary component
- Graceful degradation (show UI, don't crash)
- Log errors safely (no sensitive data)

**TRY/CATCH PATTERN:**

```typescript
try {
  // operation
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Operation failed', error);
  // Update UI state
} finally {
  setLoading(false);
}
```

**NEVER:**

- ❌ Bare console.log/error (use logger)
- ❌ Alert() for errors (use Toast/Modal)
- ❌ Ignore errors silently

---

### Critical Don't-Miss Rules

**ANTI-PATTERNS TO AVOID:**

1. ❌ Storing unencrypted sensitive data in SQLite/Supabase
2. ❌ Using AsyncStorage for tokens or keys (use SecureStore)
3. ❌ Default exports (breaks tree-shaking, harder to refactor)
4. ❌ Logging full error objects (may contain sensitive data)
5. ❌ Skipping accessibility props (WCAG AAA required)
6. ❌ .then() chains (use async/await)
7. ❌ Missing loading/error states in UI

**EDGE CASES TO HANDLE:**

- Offline mode: All features must work offline
- Encryption key missing: Redirect to onboarding
- Supabase RLS denies: Graceful error (don't expose DB structure)
- Date handling: Use dayjs (not raw Date - timezone issues)
- Background sync conflicts: Last-write-wins for MVP

**PERFORMANCE:**

- Use FlatList for long lists (NOT ScrollView)
- Optimize re-renders with React.memo + useCallback
- Batch SQLite operations (transactions)
- Lazy load screens with React.lazy

---

## Development Workflow

**GIT COMMITS:**

- Conventional commits format
- Sign commits (GPG)
- Co-authored-by: Claude Sonnet 4.5

**TESTING (Phase 3+):**

- Jest for unit tests
- React Native Testing Library for components
- Test encryption/decryption functions
- Test RLS policies

**DEPLOYMENT:**

- Expo EAS Build
- TestFlight (iOS) / Internal Testing (Android)
- User testing with recovery community members

---

## Stack Optimization (Future - Phase 3+)

**Documented for Later:**

- Consider Tamagui for universal UI (web + mobile)
- Enable SQLCipher for encrypted database at rest
- Add Sentry for crash reporting (with PII scrubbing)
- Comprehensive test suite
- Self-hosted Supabase option for data sovereignty

---

_Last Updated: 2025-12-31 | Privacy-first, offline-first, security-first_
