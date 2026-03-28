# Steps to Recovery - Setup Guide

## Project Overview

A privacy-first 12-step recovery companion mobile app built with:

- **Mobile**: React Native 0.81.5 + Expo SDK ~54.0.0 (TypeScript)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Architecture**: Single-app structure (npm workspaces)
- **Offline-First**: expo-sqlite (mobile) / IndexedDB (web)
- **Encryption**: AES-256-CBC via crypto-js, keys in expo-secure-store

## Project Structure

```
Steps-to-recovery/
├── apps/
│   └── mobile/              # Expo React Native app
├── .claude/                 # Claude Code agents & prompts
├── .github/                 # CI/CD workflows, docs, secrets reference
├── scripts/                 # Doctor scripts, toolchain utilities
├── supabase/
│   ├── config.toml          # Supabase local/dev configuration
│   └── migrations/          # Ordered SQL migrations for schema + RLS
└── package.json             # Workspace config
```

## Mobile App Structure

```
apps/mobile/src/
├── adapters/                # Platform abstraction (storage, secureStorage)
├── components/              # Shared UI components
├── config/                  # App configuration & import alias contract
├── constants/               # App constants
├── contexts/                # React contexts (Auth, Database, Sync)
├── data/                    # Static data
├── db/                      # Database utilities
├── design-system/           # iOS-style design tokens & components
├── features/                # Feature modules (see below)
├── hooks/                   # Shared hooks
├── lib/                     # Third-party integrations (Supabase, Sentry)
├── navigation/              # React Navigation setup
├── providers/               # Provider wrappers
├── services/                # Background services (sync)
├── store/                   # Zustand stores
├── test-utils/              # Test helpers
├── types/                   # Shared TypeScript types
└── utils/                   # Utilities (encryption, logger, validation)
```

### Feature Modules (18)

```
apps/mobile/src/features/
├── ai-companion/    # AI-powered companion
├── auth/            # Authentication
├── craving-surf/    # Craving management
├── crisis/          # Crisis support
├── emergency/       # Emergency toolkit
├── gratitude/       # Gratitude lists
├── home/            # Dashboard, clean time, check-ins
├── inventory/       # Personal inventory
├── journal/         # Encrypted journaling
├── meetings/        # Meeting finder & tracking
├── onboarding/      # Onboarding flow
├── profile/         # User profile & settings
├── progress/        # Progress tracking
├── readings/        # Daily readings
├── safety-plan/     # Safety planning
├── settings/        # App settings
├── sponsor/         # Sponsor connections & sharing
└── steps/           # 12-step work tracking
```

---

## Getting Started

### Prerequisites

| Requirement      | Version               | Notes                                               |
| ---------------- | --------------------- | --------------------------------------------------- |
| Node.js          | 20.x (exact: 20.19.4) | See `.nvmrc` — must match EAS build environment     |
| npm              | 11.x                  | Pinned via `packageManager` field in `package.json` |
| Git              | Any recent            | For cloning and commits                             |
| Expo Go          | Latest                | For scanning QR codes on a physical device          |
| Supabase account | —                     | Free tier works; https://supabase.com               |

The Node.js version in `.nvmrc` is intentionally pinned to the exact version used by EAS builds. Using a different major version will cause `npm run doctor:toolchain` to fail.

### Step 1: Clone and Install

```bash
git clone https://github.com/RipKDR/Steps-to-recovery.git
cd Steps-to-recovery

# If you use nvm, activate the exact pinned version first:
nvm use

# Install all workspace dependencies (runs postinstall scripts automatically):
npm install
```

`npm install` installs dependencies for the workspace and runs the `postinstall` script that patches datetime-picker imports for Expo compatibility.

### Step 2: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com) (the free tier is sufficient).
2. In the Supabase **SQL Editor**, run files from `supabase/migrations/` in chronological filename order.
3. After running migrations, verify your key tables (e.g., `profiles`, `journal_entries`, `daily_checkins`) exist before starting the app.
4. Navigate to **Settings → API** and copy:
   - **Project URL** — looks like `https://abcdef.supabase.co`
   - **anon / public key** — a long JWT string

### Step 3: Create the Environment File

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Then open `apps/mobile/.env` and fill in the required values:

```bash
# =============================================================================
# REQUIRED — Supabase Configuration
# =============================================================================
# Get from: Supabase dashboard → Settings → API
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# =============================================================================
# OPTIONAL — Sentry Error Tracking
# =============================================================================
# Sign up at https://sentry.io, create a React Native project, copy the DSN.
# Leave blank to disable error tracking during local development.
EXPO_PUBLIC_SENTRY_DSN=

# =============================================================================
# OPTIONAL — Environment Mode
# =============================================================================
# Options: development | staging | production  (default: development)
EXPO_PUBLIC_ENV=development
```

**Security notes:**

- `.env` is already listed in `.gitignore`. Never commit it.
- The Supabase anon key is safe to include in the app because all data access is enforced by Row-Level Security (RLS) policies.
- Encryption keys are never stored in `.env`. They are derived from the user's session token and stored in device Keychain/Keystore via `expo-secure-store`.

### Step 4: Validate the Environment

```bash
npm run validate-env
```

This runs `scripts/validate-env.js` and confirms all required variables are present and correctly formatted before you attempt to start the app.

### Step 5: Run the Doctor Scripts

```bash
npm run doctor:toolchain   # Verify Node version, npm version, and workspace script invariants
npm run doctor:aliases     # Verify TypeScript / Babel / Jest path aliases are consistent
```

These scripts catch common configuration drift before it turns into a hard-to-debug runtime error. See [Doctor Scripts](#doctor-scripts) below for details on what each script checks and what its output looks like.

### Step 6: Start the Development Server

```bash
# From the repo root:
npm run mobile

# Or from the mobile app directory:
cd apps/mobile && npx expo start
```

### Step 7: Run on a Device or Simulator

| Target                           | How                                   |
| -------------------------------- | ------------------------------------- |
| iOS Simulator (macOS only)       | Press `i` in the Expo terminal        |
| Android Emulator                 | Press `a` in the Expo terminal        |
| Physical device (iOS or Android) | Scan the QR code with the Expo Go app |

---

## Common Commands

```bash
# Development
npm run mobile              # Start Expo dev server
npm run android             # Run on Android emulator
npm run ios                 # Run on iOS simulator

# Testing
npm test                    # Run all tests
cd apps/mobile && npm test  # Run mobile tests directly
npm run test:watch          # Watch mode (run from apps/mobile)
npm run test:coverage       # Coverage report (run from apps/mobile)
npm run test:encryption     # Encryption-specific tests (CRITICAL — run from apps/mobile)

# E2E (Maestro) — see .github/E2E-TESTING.md for full setup
cd apps/mobile
npm run e2e                 # Run all flows
npm run e2e:validate        # Dry-run syntax check on all flows

# Quality and Verification
npm run lint                # ESLint
npm run type-check          # TypeScript check
npm run doctor:toolchain    # Verify Node/npm/workspace script invariants
npm run doctor:aliases      # Verify alias maps are in sync
npm run verify:strict       # Full strict gate: doctor + lint + type-check + tests
npm run format              # Prettier format (all files)
npm run format:check        # Check formatting without writing
```

---

## Post-Install Verification

Run this sequence after cloning to confirm the workspace is healthy before writing any code:

```bash
# 1. Verify Node and npm versions, workspace script invariants
npm run doctor:toolchain

# Expected output:
# Toolchain doctor passed.

# 2. Verify TypeScript / Babel / Jest path aliases are consistent
npm run doctor:aliases

# Expected output:
# Alias consistency doctor passed.

# 3. Run all tests
npm test

# 4. Run the full strict gate (combines all checks above)
npm run verify:strict
```

If any step fails, see [Troubleshooting](#troubleshooting) below.

---

## Doctor Scripts

The project includes two automated scripts that catch configuration drift early. They run in CI on every push to `main` and on every release.

### `npm run doctor:toolchain`

**File**: `scripts/doctor/check-toolchain.mjs`

**What it checks**:

| Check                             | Expected                                                             |
| --------------------------------- | -------------------------------------------------------------------- |
| Node.js major version             | >= 20 (warns if not exactly 20.x)                                    |
| npm major version                 | Must match `packageManager` field in `package.json` (currently 11.x) |
| `.nvmrc` content                  | Must be `"20"`                                                       |
| `apps/mobile` `type-check` script | Must be `"npm exec -- tsc --noEmit"`                                 |
| Workspace script invariants       | Must match expected values                                           |

**Success output:**

```
Toolchain doctor passed.
```

**Failure output** (example):

```
Toolchain doctor found issues:
- npm major must be 11. Found 10.2.4.
```

**When to run**: After cloning, after upgrading Node.js or npm, before submitting a PR, before triggering a release build.

### `npm run doctor:aliases`

**File**: `scripts/doctor/check-alias-consistency.mjs`

**What it checks**: The project uses a single **alias contract** at `apps/mobile/config/import-aliases.json` as the authoritative source for path aliases. This script verifies that four files stay in sync with that contract:

| File                          | What is checked                    |
| ----------------------------- | ---------------------------------- |
| `apps/mobile/tsconfig.json`   | `compilerOptions.paths`            |
| `apps/mobile/components.json` | `aliases` block                    |
| `apps/mobile/babel.config.js` | `module-resolver` plugin alias map |
| `apps/mobile/jest.config.js`  | `moduleNameMapper` entries         |

It also asserts that the root `tsconfig.json` does NOT define `baseUrl` or `paths` (those belong in the mobile-specific config only).

**Success output:**

```
Alias consistency doctor passed.
```

**Failure output** (example):

```
Alias consistency doctor found issues:
- apps/mobile/tsconfig.json compilerOptions.paths mismatch.
  Expected: { "@/*": ["./src/*"] }
  Actual:   { "@/*": ["src/*"] }
```

**When to run**: After adding a new import alias, after editing `tsconfig.json`, `babel.config.js`, or `jest.config.js`.

---

## E2E Testing Setup

End-to-end tests use [Maestro](https://maestro.mobile.dev/) and run against a real Android APK and a real Supabase backend.

For the full local setup guide, see [`.github/E2E-TESTING.md`](.github/E2E-TESTING.md).

Quick-start summary:

```bash
# 1. Install Maestro (requires Java 11+)
curl -fsSL "https://get.maestro.mobile.dev" | bash

# 2. Set up the Maestro environment file
cp apps/mobile/.maestro/.env.example apps/mobile/.maestro/.env
# Edit apps/mobile/.maestro/.env with your test account credentials

# 3. Create a dedicated test user in Supabase
#    Dashboard → Authentication → Users → Invite user
#    Use a non-production email (e.g. e2e-test@yourdomain.com)

# 4. Build the debug APK
cd apps/mobile
npx expo prebuild --platform android
cd android && ./gradlew assembleDebug

# 5. Install and run
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
maestro test .maestro/flows/login.yaml
```

---

## Error Monitoring (Sentry)

Sentry is configured for production error tracking with automatic sanitization of sensitive fields.

### Setup

1. Create a Sentry project (React Native platform) at [sentry.io](https://sentry.io).
2. Add the DSN to `apps/mobile/.env`:
   ```bash
   EXPO_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
   ```
3. For EAS/production builds, store the DSN as an EAS secret instead of hard-coding it:
   ```bash
   cd apps/mobile
   eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN \
     --value "your-dsn" --type string
   ```

### How It Works

- Initialized early via `initSentry()` — only active when `__DEV__ === false` (production builds).
- User ID (not email) is tracked via `setSentryUser()` in `AuthContext`.
- `logger.error()` forwards to Sentry automatically; sensitive fields are redacted by `sentrySanitizer.ts`.
- Config files: `apps/mobile/src/lib/sentry.ts`, `apps/mobile/src/lib/sentrySanitizer.ts`.

---

## Development Phases

Following a BMAD (Build-Measure-Analyze-Decide) approach:

### Phase 1: Core Architecture & Auth ✅

- [x] Project setup (npm workspaces)
- [x] Supabase Auth integration
- [x] Login/SignUp/Onboarding screens
- [x] Secure token storage (expo-secure-store)
- [x] Auth, Database, Sync contexts

### Phase 2: Journaling & Step Work ✅

- [x] AES-256-CBC encryption (crypto-js)
- [x] expo-sqlite offline storage
- [x] Queue-based background sync
- [x] Encrypted journaling with mood/craving tracking
- [x] Step work UI with guided questions

### Phase 3: Sponsor Connection & Sharing ✅

- [x] Sponsor invite flow
- [x] Sponsorship management
- [x] Selective entry sharing
- [x] Supabase RLS policies

### Phase 4: Notifications, Geofencing & Streaks ✅

- [x] Daily reminders (expo-notifications)
- [x] Geofencing for meetings (expo-location + expo-task-manager)
- [x] Clean time tracker with milestones
- [x] Achievements & streak tracking

### Phase 5: Polish & Expansion (In Progress)

- [x] WCAG AAA accessibility
- [x] iOS-style design system with tokens
- [x] Sentry error monitoring
- [ ] Performance optimization (sub-2s cold start)
- [ ] Additional feature modules (AI companion, crisis tools, etc.)

---

## Key Technologies

| Category         | Technology                | Version          |
| ---------------- | ------------------------- | ---------------- |
| Framework        | React Native + Expo       | 0.81.5 / ~54.0.0 |
| Language         | TypeScript (strict)       | ~5.9.3           |
| React            | React                     | 19.1.0           |
| Backend          | Supabase                  | ^2.93.3          |
| Offline Storage  | expo-sqlite               | ~16.0.10         |
| Key Storage      | expo-secure-store         | ~15.0.8          |
| Encryption       | crypto-js (AES-256-CBC)   | ^4.2.0           |
| Server State     | @tanstack/react-query     | ^5.90.15         |
| Client State     | Zustand                   | ^5.0.9           |
| Navigation       | React Navigation          | ^7.x             |
| Validation       | Zod                       | ^4.3.6           |
| Styling          | NativeWind / Tailwind CSS | ~4.1.18          |
| Error Monitoring | @sentry/react-native      | ~7.2.0           |

---

## Privacy & Security

- **Encryption**: AES-256-CBC with PBKDF2 key derivation (100k iterations), unique IV per encryption
- **Key Storage**: expo-secure-store only (device Keychain/Keystore) — never AsyncStorage or SQLite
- **Row-Level Security**: All Supabase tables enforce `auth.uid() = user_id`
- **Logging**: Sanitized logger (no `console.*` with sensitive data)
- **Sync**: Data remains encrypted end-to-end through the sync pipeline

---

## Troubleshooting

### "npm run doctor:toolchain" fails with a Node version error

```
Node major must be >= 20. Found 18.x.
```

Install Node 20 and switch to it:

```bash
# With nvm:
nvm install 20
nvm use 20
node -v   # should print v20.x.x
```

### "npm run doctor:aliases" fails with a mismatch error

The alias contract at `apps/mobile/config/import-aliases.json` diverged from one of `tsconfig.json`, `babel.config.js`, `jest.config.js`, or `components.json`. Update the out-of-sync file to match the contract, then re-run the doctor.

### App starts but crashes immediately on the device

1. Confirm `apps/mobile/.env` exists and contains real (non-placeholder) Supabase credentials.
2. Run `npm run validate-env` to check for missing or malformed variables.
3. Check if the Supabase schema was applied: go to your Supabase dashboard → Table Editor and confirm `journal_entries`, `daily_checkins`, and `sync_queue` tables exist.

### "Encryption key missing" — app redirects to onboarding for a logged-in user

The encryption key was removed from secure storage (can happen after a clean app reinstall). The user must complete onboarding again to generate a new key. This is by design — no key means no ability to decrypt existing data.

### Sync queue growing indefinitely

```bash
# In Supabase SQL Editor — check for permanently failing queue items:
SELECT * FROM sync_queue WHERE retry_count >= 3;
```

Common causes: network never reconnecting during the session, invalid Supabase credentials in the build, or RLS policies blocking writes.

### Web database not persisting on page reload

Verify that `secureStorage.initializeWithSession()` is called in `AuthContext` before any database operations. Check that the browser has IndexedDB enabled (private/incognito mode may disable it).

### TypeScript build fails with strict mode errors

- Never use `any`. Use `unknown` and add type guards.
- Add explicit return types to all functions.
- All database query results can be `null` or `undefined` — always check before using.

### Geofencing notifications not triggering

- iOS requires "Always" location permission, not just "While Using".
- Android requires `ACCESS_BACKGROUND_LOCATION`.
- Check TaskManager logs for geofence events during development.

---

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [Sentry for React Native](https://docs.sentry.io/platforms/react-native/)
- [CLAUDE.md](./CLAUDE.md) — Full architecture, conventions, and security patterns
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Git workflow, code standards, testing expectations
- [.github/CI-CD.md](.github/CI-CD.md) — CI/CD workflow documentation
- [.github/SECRETS.md](.github/SECRETS.md) — GitHub Actions secrets reference
- [.github/E2E-TESTING.md](.github/E2E-TESTING.md) — Maestro E2E test setup
