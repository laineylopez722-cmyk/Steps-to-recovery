---
project_name: 'Steps-to-Recovery'
user_name: 'h'
date: '2026-02-11'
sections_completed:
  - technology_stack
  - security_rules
  - architecture_rules
  - performance_rules
  - organization_rules
  - testing_rules
  - platform_rules
  - anti_patterns
status: complete
rule_count: 50
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns for implementing code in Steps-to-Recovery. Focus on unobvious details that agents might miss._

---

## Technology Stack & Versions

| Category | Technology | Version |
|----------|-----------|---------|
| React Native | Expo SDK | ~54.0.33 |
| React | React 19 | 19.1.0 |
| React Native | RN | 0.81.5 |
| Language | TypeScript | ~5.9.3 (strict) |
| Backend | Supabase JS | ^2.93.3 |
| Mobile DB | expo-sqlite | ~16.0.10 |
| Web DB | idb (IndexedDB) | ^8.0.3 |
| Key Storage | expo-secure-store | ~15.0.8 |
| Server State | React Query | ^5.90.15 |
| Client State | Zustand | ^5.0.9 |
| Navigation | React Navigation | ^7.x |
| Styling | Tailwind CSS | ~4.1.18 |
| Encryption | crypto-js | ^4.2.0 |
| Monorepo | Turborepo | ^2.8.1 |
| Testing | Jest + RNTL | ^29.7.0 / ^13.3.3 |

**Key Constraints:**
- `packageManager: npm@10.9.2` (pinned)
- Node >=20.0.0
- React 19 override applied to react, react-dom, react-test-renderer
- New Architecture enabled (`newArchEnabled: true`)
- Hermes JS engine
- Path alias: `@/` → `apps/mobile/src/`
- Monorepo shared package: `@recovery/shared`

---

## Critical Implementation Rules

### Security & Encryption

- **AES-256-CBC** with unique IV per encryption, HMAC-SHA256 (encrypt-then-MAC), PBKDF2 100k iterations
- Encrypted format: `{iv_hex}:{ciphertext_base64}:{mac_hex}` (3 colon-separated parts)
- Legacy 2-part format `{iv}:{ciphertext}` accepted on read, auto-migrated on write
- **Keys stored ONLY in SecureStore** — NEVER AsyncStorage, SQLite, or Supabase
- Web: Master key derived from per-user seed + salt via PBKDF2 → AES-GCM-256 (never persisted directly)
- Always call `hasEncryptionKey()` before encrypting — route to onboarding if missing
- MAC verification happens BEFORE decryption (fail fast on corruption)
- `constantTimeEqual()` for MAC comparison (prevents timing attacks)
- Use `encryptContent()` before ANY local storage write of sensitive data
- Use `decryptContent()` when reading for display
- Encrypted blob sent directly to Supabase (no re-encryption needed)
- `performLogoutCleanup()` must be called BEFORE `supabase.auth.signOut()` — deletes encryption key, clears web session, clears local DB

### Sync Queue

- **Delete-before-insert** order: All DELETE operations processed before INSERT/UPDATE
- Queue functions: `addToSyncQueue(db, table, recordId, 'insert'|'update')`, `addDeleteToSyncQueue(db, table, recordId, userId)` — call BEFORE delete
- Max retries: 3 with exponential backoff (1s base, 30s cap)
- Mutex prevents concurrent syncs
- Sync triggers: 5min periodic, offline→online, app foregrounded, manual
- Queue uses `INSERT OR REPLACE` (idempotent re-queuing)
- Upserts use `onConflict: 'id'` on Supabase side

### Context Initialization Order

**AuthContext → DatabaseContext → SyncContext → NotificationContext** (strict order)
- Auth first: All downstream depends on user session
- Database second: Sync needs DB access
- Sync third: Depends on both auth + db
- Notifications last: UI-level, depends on nav readiness

### Architecture Patterns

- **Offline-first**: SQLite/IndexedDB is source of truth; Supabase is backup/sync only
- **StorageAdapter**: Platform abstraction — `createStorageAdapter()` returns SQLiteAdapter or IndexedDBAdapter
- **Feature-based organization**: Each feature has `screens/`, `components/`, `hooks/` subdirectories
- **Named exports only** — no default exports (tree-shaking, IDE support)
- **React Query** for server/async state, **Zustand** for client UI state, **Context** for cross-cutting concerns
- **Design System**: `useDs()` for theme tokens, `useThemedStyles(createStylesFactory)` for themed StyleSheets
- Define `createStyles` at MODULE level (not inside components)
- `DsProvider` wraps app, `createDs(isDark)` factory generates themed DS object

### Database Migrations

- `CURRENT_SCHEMA_VERSION = 9` — increment on any schema change
- Guard with `columnExists(db, tableName, columnName)` before ALTER TABLE
- `CREATE TABLE IF NOT EXISTS` for base tables
- `initPromises` Map prevents duplicate concurrent init
- Record migration: `INSERT INTO schema_migrations (version, applied_at)`

### Performance

- **Cold start target**: <2000ms (warn >2000ms, error >3000ms)
- **Screen load**: <300ms target
- **Render budget**: 16ms per frame (60fps)
- FlatList ONLY for lists >10 items (never ScrollView)
- Batch SQLite operations in transactions
- `React.memo` + `useCallback` for heavy list items
- `runAfterInteractions()` for non-critical deferred work

### Accessibility (WCAG AAA)

- ALL interactive elements: `accessibilityLabel` + `accessibilityRole` (REQUIRED)
- `accessibilityState` when disabled/loading, `accessibilityHint` when non-obvious
- Minimum touch target: 48×48dp
- Color contrast: 7:1 (AAA standard)
- Font scaling: Support up to 200%
- Tab bar: `tabBarAccessibilityLabel` on all tabs

### Testing

- Co-located `__tests__/` directories alongside source
- Coverage: encryption.ts 90%, syncService 70%, AuthContext 70%, SyncContext 70%
- ALWAYS test encrypt→decrypt roundtrip, verify `{iv}:{ciphertext}:{mac}` format
- React 19 timer pattern: Call function FIRST, THEN `jest.advanceTimersByTime()` inside `act()`
- Use `async () => { throw new Error() }` NOT `mockRejectedValue()` (React 19 compat)
- Run: `cd apps/mobile && npx jest --runInBand`
- Babel exclude: `expo(-[^/]*)?` pattern (transforms expo-* packages)

### Platform Rules

- Mobile: expo-sqlite, expo-secure-store (Keychain/Keystore), NetInfo, AppState
- Web: IndexedDB, localStorage + Web Crypto API, navigator.onLine, visibilitychange
- `secureStorage.initializeWithSession(userId, token)` required on web after auth
- Android Keystore may return null after device reboot (prompt unlock)

---

## Critical Anti-Patterns

| ❌ NEVER | ✅ INSTEAD |
|----------|-----------|
| `AsyncStorage.setItem('key', encryptionKey)` | `secureStorage.setItemAsync('key', value)` |
| `console.log(sensitiveData)` | `logger.info('msg', { id })` |
| Store plaintext sensitive data | `encryptContent()` before storage |
| Reuse IV across encryptions | Generate unique IV per call |
| Skip MAC verification | Verify MAC before decrypt |
| Use `any` type | Use `unknown` + type guard |
| Use default exports | Use named exports only |
| Use `.then()` chains | Use `async/await` |
| Hardcode hex colors | Use `ds.semantic.*` or `ds.colors.*` |
| Hardcode spacing values | Use `ds.space[n]` (4px grid) |
| Use ScrollView for lists | Use FlatList + React.memo |
| Skip accessibility props | Add label + role + state + hint |
| Sync before encryption | Encrypt → Queue → Sync |
| Skip delete-before-insert | Always process deletes first |

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive/secure option
- Update this file if new patterns emerge

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-02-11
