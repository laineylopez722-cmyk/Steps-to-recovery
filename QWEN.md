# Steps to Recovery — QWEN.md

**Project**: Privacy-first 12-step recovery companion mobile app  
**Tech Stack**: React Native 0.81.5 + Expo SDK 54, TypeScript strict, Supabase, SQLite, AES-256 encryption  
**Structure**: Single-app (no Turborepo)
**Node Version**: 20.19.4 (pinned in `.nvmrc`)  
**Package Manager**: npm 11.8.0

---

## Quick Start

```bash
# 1. Activate Node version
nvm use

# 2. Install dependencies
npm ci

# 3. Setup environment
cp apps/mobile/.env.example apps/mobile/.env
# Edit .env with your Supabase credentials

# 4. Run verification
bash scripts/verify-setup.sh

# 5. Start development
npm run mobile
```

---

## Project Structure

```
Steps-to-recovery/
├── apps/
│   └── mobile/                    # Expo React Native app
│       ├── src/
│       │   ├── adapters/          # Platform abstractions (storage, secureStorage)
│       │   ├── contexts/          # Auth → Database → Sync → Notification (init order)
│       │   ├── design-system/     # Tokens, primitives, themed components
│       │   ├── features/          # 20 feature modules (ai-companion, journal, steps, etc.)
│       │   ├── services/          # Business logic (sync, notifications, AI)
│       │   ├── store/             # Zustand state
│       │   └── utils/             # encryption.ts, logger.ts, database.ts
│       └── .maestro/flows/        # E2E test flows
├── supabase/
│   ├── functions/                 # Edge functions (ai-chat)
│   └── migrations/                # SQL migrations (numbered by timestamp)
└── scripts/                       # Doctor, validation, maintenance scripts
```

**Path alias**: `@/*` → `apps/mobile/src/*` (shared code lives at `apps/mobile/src/shared/`)

---

## Core Architecture Principles

### 1. Encryption-First Data Flow

**All sensitive data** (journal, step work, check-ins, gratitude, inventory) must be encrypted before storage:

```
User Input → encryptContent() → SQLite/IndexedDB → sync_queue → Supabase (encrypted blob)
              ↓                                              ↓
        SecureStore (key)                            RLS policies enforce user isolation
```

**Critical files**:

- `apps/mobile/src/utils/encryption.ts` — AES-256-CBC with PBKDF2 (100,000 iterations), HMAC-SHA256
- `apps/mobile/src/adapters/secureStorage/` — iOS Keychain / Android Keystore / web IndexedDB

**Rules**:

- ✅ Call `encryptContent()` before ANY write to SQLite or Supabase
- ✅ Store encryption keys in SecureStore ONLY
- ❌ NEVER use AsyncStorage, SQLite, or Supabase for keys
- ❌ NEVER log sensitive data (use `logger` from `utils/logger.ts`)

### 2. Offline-First with StorageAdapter

Platform abstraction allows same code to work on mobile (SQLite) and web (IndexedDB):

```typescript
// Feature code (platform-agnostic)
const { db } = useDatabase();
await db.runAsync('INSERT INTO journal_entries ...', [encryptedBody]);
```

**Implementation**:

- Mobile: `expo-sqlite` with Drizzle ORM
- Web: IndexedDB adapter

### 3. Queue-Based Background Sync

Sync invariant: **Deletes BEFORE inserts/updates** (avoids FK conflicts):

```typescript
// DELETE pattern
await addDeleteToSyncQueue(db, 'journal_entries', entryId, userId); // QUEUE FIRST
await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [entryId]);

// INSERT/UPDATE pattern
await db.runAsync('INSERT INTO journal_entries ...', [...]);
await addToSyncQueue(db, 'journal_entries', entryId, 'insert'); // THEN QUEUE
```

**Sync triggers**: Every 5 minutes (online), app foreground, network reconnection, manual

### 4. Context Initialization Order

**Fixed order** — do not reorder:

```
AuthContext → DatabaseContext → SyncContext → NotificationContext
```

Each context depends on the previous one being initialized.

---

## Development Commands

### Root (Monorepo)

| Command                           | Purpose                                                    |
| --------------------------------- | ---------------------------------------------------------- |
| `npm run mobile`                  | Start Expo dev server                                      |
| `npm run android` / `npm run ios` | Run on emulator/simulator                                  |
| `npm test`                        | Run all tests                                              |
| `npm run lint`                    | ESLint                                                     |
| `npm run type-check`              | TypeScript check (delegates to mobile)                     |
| `npm run format`                  | Prettier write                                             |
| `npm run format:check`            | Prettier check                                             |
| `npm run verify:strict`           | Full pre-release gate (doctor + lint + type-check + tests) |
| `npm run doctor:toolchain`        | Verify Node/npm/workspace setup                            |
| `npm run doctor:aliases`          | Verify tsconfig/babel/jest alias consistency               |

### apps/mobile

| Command                   | Purpose                                              |
| ------------------------- | ---------------------------------------------------- |
| `npm run start:dev`       | Start Expo metro bundler                             |
| `npm run test:encryption` | Run encryption tests (REQUIRED after crypto changes) |
| `npm run test:coverage`   | Coverage report                                      |
| `npm run type-check`      | TypeScript check (mobile only)                       |
| `npm run lint`            | ESLint mobile source                                 |
| `npm run e2e`             | Run all Maestro E2E flows                            |
| `npm run e2e:validate`    | Validate E2E flows (syntax check)                    |

### Build Commands

```bash
# Preview Android build
cd apps/mobile && eas build --profile preview --platform android

# Production builds
cd apps/mobile && eas build --profile production --platform android
cd apps/mobile && eas build --profile production --platform ios
```

---

## Coding Standards

### TypeScript Strict Mode

- ❌ **NO `any`** — use `unknown` + type guards
- ✅ Explicit return types on all functions
- ✅ Component props require TypeScript interfaces
- ✅ Handle `null`/`undefined` from database queries

```typescript
// ✅ Correct
interface JournalEntryProps {
  entryId: string;
  onSave: (content: string) => Promise<void>;
}

export function JournalEntry({ entryId, onSave }: JournalEntryProps): React.ReactElement {
  // ...
}

// ❌ Wrong
export function JournalEntry({ entryId, onSave }: any) { ... }
```

### Named Exports Only

- ❌ No default exports (breaks tree-shaking)
- ✅ Named exports only

### Async/Await Only

- ❌ No `.then()` chains
- ✅ Use `async/await`

### Logging

```typescript
// ✅ Correct
import { logger } from '@/utils/logger';
logger.info('Entry saved', { entryId });

// ❌ Wrong
console.log('Saved entry:', journalText);
```

### Styling

Use **uniwind** (Tailwind CSS for React Native) with design tokens:

```typescript
import { cn } from '@/lib/utils';
import { useDs } from '@/design-system/hooks';

const ds = useDs();

// ✅ Correct
<View style={{ backgroundColor: ds.semantic.surface.card }}>
  <Text style={{ color: ds.semantic.text.primary }}>Hello</Text>
</View>

// ❌ Wrong — no raw hex values
<View style={{ backgroundColor: '#0A0A0A' }}>
```

**Design tokens**: `ds.colors.*` (raw) → `ds.semantic.*` (context-aware: `surface.app`, `text.primary`, `intent.primary`)

---

## Security Checklist (Before Every PR)

- [ ] All sensitive data encrypted with `encryptContent()` before storage
- [ ] Keys stored in SecureStore only (never AsyncStorage/SQLite/Supabase)
- [ ] New Supabase tables have RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] No `console.*` calls with sensitive data (use `logger`)
- [ ] `npm run test:encryption` passes after any crypto change
- [ ] Sync queue calls: `addDeleteToSyncQueue()` BEFORE delete, `addToSyncQueue()` AFTER insert/update

---

## Testing Guidelines

### Framework

- **Unit/Integration**: Jest 29 + `@testing-library/react-native`
- **E2E**: Maestro (YAML flows in `.maestro/flows/`)
- **Test location**: Co-located `__tests__/` directories

### Coverage Targets

| Module           | Target |
| ---------------- | ------ |
| `encryption.ts`  | ≥90%   |
| `syncService.ts` | ≥70%   |
| Feature hooks    | ≥75%   |
| Overall          | ≥75%   |

### Run Tests

```bash
# All tests
npm test

# Encryption tests (critical)
cd apps/mobile && npm run test:encryption

# Single test file
npm test -- useJournalEntries

# Coverage
cd apps/mobile && npm run test:coverage
```

### Encryption Roundtrip Test (Required)

```typescript
it('encrypts and decrypts to original value', async () => {
  const plaintext = 'Sensitive journal content';
  const encrypted = await encryptContent(plaintext);

  expect(encrypted).not.toBe(plaintext);
  expect(encrypted).toContain(':'); // IV:ciphertext format

  const decrypted = await decryptContent(encrypted);
  expect(decrypted).toBe(plaintext);
});
```

---

## Feature Modules

| Feature          | Files | Purpose                                              |
| ---------------- | ----- | ---------------------------------------------------- |
| **ai-companion** | 65    | AI chat with memory, prompts, quick actions          |
| **steps**        | 38    | 12-step work: overview, single-question view, review |
| **meetings**     | 28    | Meeting finder with filters, map, details            |
| **progress**     | 22    | Progress dashboard, milestones, insights             |
| **home**         | 14    | Home screen, hero card, shortcuts, check-ins         |
| **emergency**    | 13    | Crisis support, close calls, risky contacts          |
| **sponsor**      | 13    | Sponsor management and sharing flows                 |
| **journal**      | 7     | Encrypted journal entries                            |
| **crisis**       | 4     | BeforeYouUse timer (harm reduction)                  |
| **craving-surf** | 8     | Guided craving surfing exercise                      |
| **safety-plan**  | 7     | Personal safety plan                                 |
| **gratitude**    | 4     | Gratitude list                                       |
| **inventory**    | 4     | Personal inventory (Step 4/10)                       |
| **settings**     | 8     | App settings                                         |
| **auth**         | 5     | Login/signup                                         |
| **onboarding**   | 2     | First-run onboarding                                 |
| **readings**     | 2     | Daily readings                                       |
| **profile**      | 1     | User profile                                         |
| **challenges**   | 6     | Recovery challenges                                  |
| **mindfulness**  | New   | Mindfulness exercises                                |

---

## Database Schema

**Tables** (all user data encrypted before storage):

| Table                              | Purpose                                      |
| ---------------------------------- | -------------------------------------------- |
| `users`                            | Profile, sobriety date, settings             |
| `journal_entries`                  | Encrypted journal with tags, mood, favorites |
| `daily_checkins`                   | Morning intentions, evening reflections      |
| `step_work_answers`                | 12-step question responses                   |
| `reading_reflections`              | Daily reading responses                      |
| `contacts`                         | Sponsor/support network                      |
| `phone_calls`                      | Call log to support contacts                 |
| `close_calls`                      | Close call incidents with outcomes           |
| `risky_contacts`                   | Contacts to avoid                            |
| `ai_conversations` / `ai_messages` | AI chat history                              |
| `ai_memory_extractions`            | Extracted memories from journal/check-ins    |
| `gratitude_entries`                | Gratitude list                               |
| `challenges`                       | Recovery challenges                          |
| `sync_queue`                       | Pending sync operations                      |

**Migrations**: Located in `supabase/migrations/`, numbered by timestamp, run on app startup.

---

## Navigation Structure

```
RootNavigator
├── AuthNavigator (unauthenticated)
│   ├── Login
│   └── Signup
└── MainNavigator (authenticated)
    └── TabNavigator
        ├── HomeStack (Home, DailyReading, Progress, Check-ins)
        ├── JournalStack (JournalList, JournalEntry)
        ├── StepsStack (StepsOverview, StepDetail, StepReview)
        ├── MeetingsStack (MeetingFinder, MeetingDetail)
        └── ProfileStack (Profile, Settings, SafetyPlan)

Modal overlays: Emergency, BeforeYouUse, CravingSurf, AICompanion
```

---

## Accessibility Requirements

All interactive components must include:

- `accessibilityLabel` — clear description
- `accessibilityRole` — semantic role (`button`, `header`, `text`)
- `accessibilityState` — dynamic state (`{ disabled: isLoading }`)
- `accessibilityHint` — additional guidance when needed
- Minimum touch target: `48x48dp`
- Color contrast: WCAG AAA (7:1)

```typescript
<TouchableOpacity
  onPress={handleSave}
  disabled={isLoading}
  accessibilityLabel="Save journal entry"
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
  style={{ minHeight: 48, minWidth: 48 }}
>
  <Text>Save</Text>
</TouchableOpacity>
```

---

## Commit Messages (Conventional Commits)

Enforced by Husky + commitlint (`@commitlint/config-conventional`):

```
feat: add gratitude list feature
fix(sync): correct step_work field mapping
chore(deps): bump @tanstack/react-query to 5.90.21
refactor: extract encryption logic to adapter
test: add coverage for useJournalEntries hook
security(auth): store encryption key in SecureStore
```

**Rules**:

- Subject line: lowercase after colon, no period at end
- Body/footer separated by blank line
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`, `security`

---

## Branch Strategy

**Single-branch strategy** — all PRs target `main`:

```bash
git checkout main
git pull
git checkout -b feat/your-feature-name
# ... make changes ...
git push -u origin feat/your-feature-name
# Open PR on GitHub targeting main
```

**Branch naming**: `feat/`, `fix/`, `refactor/`, `test/`, `docs/`, `chore/`

---

## CI/CD Pipeline

GitHub Actions workflows (`.github/workflows/`):

| Workflow              | Purpose                                 |
| --------------------- | --------------------------------------- |
| `eas-build.yml`       | Lint + type-check + tests on every push |
| `eslint.yml`          | ESLint with SARIF security scan         |
| `e2e.yml`             | Maestro E2E tests                       |
| `release.yml`         | Production releases (tagged `v*`)       |
| `bundle-analysis.yml` | Bundle size tracking                    |
| `codacy.yml`          | Code quality analysis                   |
| `stale-issues.yml`    | Auto-close stale issues                 |

**EAS Builds**: Preview builds auto-triggered on push to `main`. Production requires `v*` tag.

---

## Important Constraints

### Native Modules Required

**Do NOT use Expo Go** — this app uses native modules (`expo-sqlite`, `expo-crypto`, `expo-secure-store`):

```bash
# Use custom dev client
npm run start:dev

# Or prebuild
npx expo prebuild
npx expo run:android
```

### JDK 17 Required for Android

JDK 21/25 break the React Native Gradle plugin:

```bash
# Set JAVA_HOME
set JAVA_HOME="C:\Program Files\Microsoft\jdk-17.0.17.10-hotspot"
```

### Critical Files

| File                        | Purpose                                                  |
| --------------------------- | -------------------------------------------------------- |
| `AGENTS.md`                 | Repository guidelines (coding style, conventions)        |
| `CLAUDE.md`                 | Full architecture, security patterns, token optimization |
| `ARCHITECTURE.md`           | System architecture, navigation, database                |
| `CONTRIBUTING.md`           | Contribution guidelines, PR process                      |
| `TESTING.md`                | Testing strategy, Maestro E2E guide                      |
| `SECURITY.md`               | Security policy, environment variables                   |
| `SETUP.md`                  | First-time setup guide                                   |
| `DEPLOYMENT.md`             | Build and deploy instructions                            |
| `VERIFICATION-CHECKLIST.md` | Pre-PR verification steps                                |

---

## Troubleshooting

### "nvm: command not found"

Install nvm: https://github.com/nvm-sh/nvm#installing-and-updating

### "npm ERR! code ERESOLVE"

```bash
npm ci --legacy-peer-deps
```

### TypeScript errors after install

```bash
npm run type-check
# Fix each error before starting development
```

### Husky hooks not running

```bash
npm install && npx husky
```

### App shows blank screen / auth errors

- Verify `.env` values are real (not placeholders)
- Check Supabase project is active and schema applied
- Run `npm run validate-env`

---

## Related Documentation

| Document             | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `README.md`          | Project overview, current status, priorities |
| `QUICK-START.md`     | 5-minute setup guide                         |
| `PRD.md`             | Product requirements                         |
| `CHANGELOG.md`       | Version history                              |
| `CODE_OF_CONDUCT.md` | Community guidelines                         |
| `LICENSE`            | MIT license                                  |

**Legal docs**: `apps/mobile/legal/PRIVACY_POLICY.md`, `apps/mobile/legal/TERMS_OF_SERVICE.md`

**Deep-dive docs**: `docs/` directory (historical snapshots — trust code over docs if conflicting)

---

## Safety Note

This app supports recovery but **does not replace professional care, therapy, crisis services, or emergency services**. If someone is in immediate danger, contact local emergency services first.
