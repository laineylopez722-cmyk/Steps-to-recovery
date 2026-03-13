# Steps to Recovery

Privacy-first recovery companion built with React Native, Expo, Supabase, and an offline-first local data model.

## What this repo is

This is a monorepo for the **Steps to Recovery** mobile app and shared code.

The project already has a lot of real functionality in place — journaling, check-ins, step work, crisis support, sponsor flows, meetings, progress tracking, and an AI companion — but the repo is currently in a **beta hardening / release-confidence** phase, not a clean “ready for public beta” state.

## Current reality

### In good shape
- Core mobile app exists and is substantial
- Root TypeScript check passes
- Mobile type-check passes
- Mobile lint passes
- Mobile test suite passes
- Production `npm audit` is clean
- Privacy / terms docs exist
- Maestro flows exist for key user journeys

### Still needs work before real beta confidence
- Sync correctness and local ↔ cloud schema drift need hardening
- Android preview EAS build confidence is not back yet
- Real device validation is still the biggest gap
- `verify:strict` now passes after a clean install
- `expo-doctor` still needs network access for remote schema and React Native Directory checks in restricted/offline environments
- Some paths look more complete than they really are:
  - daily reading persistence/behavior
  - router compatibility fallbacks
  - widget integration

## Current priorities

1. Harden sync correctness
2. Clean up build / config drift
3. Get green preview builds again
4. Validate critical flows on a real device
5. Finish or intentionally hide incomplete feature paths

## Feature areas in the app

- Encrypted journal
- Daily check-ins
- 12-step work
- Sponsor support and sharing flows
- Meeting tools
- Sobriety / milestone tracking
- Crisis and emergency support
- Safety plan
- Gratitude and inventory workflows
- Daily readings
- AI companion

## Tech stack

- **Mobile:** React Native 0.81.5 + Expo SDK 54
- **Language:** TypeScript (strict)
- **State:** React Query + Zustand
- **Backend:** Supabase (Auth, Postgres, RLS, Edge Functions)
- **Local data:** SQLite on mobile, IndexedDB adapter on web
- **Security:** encrypted sensitive fields + secure local storage
- **UI:** custom design system + Uniwind
- **Monorepo:** npm workspaces + Turborepo

## Repo structure

```text
apps/
  mobile/                Expo mobile app
    src/
      adapters/          Platform storage / secure storage adapters
      components/        Shared UI components
      contexts/          Auth / DB / sync contexts
      design-system/     Tokens, primitives, accessibility, animations
      features/          Domain features (journal, steps, crisis, sponsor, etc.)
      hooks/             Shared hooks
      navigation/        React Navigation setup
      services/          Sync, notifications, meetings, widgets, risk detection
      store/             Zustand stores
      types/             App types, including DB types
      utils/             Encryption, database init, logger, helpers
packages/
  shared/                Shared types, utilities, and services
supabase/
  functions/             Edge functions
  migrations/            Database migrations
reference/               Repo-side reference docs map and guides
scripts/                 Doctor / validation / maintenance scripts
docs/                    Historical + deep-dive product/engineering docs
```

## Development notes

### Requirements
- Node.js 20+
- npm 11.x
- JDK 17 for Android builds
- Expo / EAS account for remote builds

### Important constraint
This app uses native modules and a custom dev client setup.

**Do not assume Expo Go is enough.** Use the configured development / preview build flows instead.

## Quick start

```bash
npm install
cd apps/mobile
npm run start:dev
```

## Useful commands

### From repo root

```bash
# Root type-check across the repo
npm run type-check

# Toolchain validation
npm run doctor:toolchain

# Strict verification
npm run verify:strict
```

### Configuration note

`react-native-gesture-handler` and `react-native-svg` are managed by the workspace dependency graph, so they are excluded from Expo's install-version check in `apps/mobile/package.json`. This prevents Expo doctor from reporting false-positive version drift when the workspace hoists compatible native module versions for the Android app.

### From `apps/mobile`

```bash
# Start dev client metro server
npm run start:dev

# Type-check mobile app
npm run type-check

# Lint mobile app
npm run lint

# Run tests
npm run test

# Coverage
npm run test:coverage

# Validate Maestro flows without fully running them
npm run e2e:validate
```

## Build commands

### Preview Android build

```bash
cd apps/mobile
eas build --profile preview --platform android
```

### Production builds

```bash
cd apps/mobile
eas build --profile production --platform android
eas build --profile production --platform ios
```

## Documentation

### Start here
- [Setup Guide](./SETUP.md)
- [Testing Guide](./TESTING.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Reference Docs Map](./reference/README.md)
- [Security Policy](./SECURITY.md)

### App/legal docs
- [Privacy Policy](./apps/mobile/legal/PRIVACY_POLICY.md)
- [Terms of Service](./apps/mobile/legal/TERMS_OF_SERVICE.md)

### Architecture / feature docs
- [AI Companion Architecture](./docs/AI-COMPANION-ARCHITECTURE.md)
- [Risk Detection Feature](./docs/RISK-DETECTION-FEATURE.md)

## Notes on older docs

Some files under `docs/` are historical snapshots or deep-dive references rather than live status tracking.

If a repo doc sounds more optimistic than reality, trust the code, tests, current build state, and recent commits over old status writeups.

## Safety note

This app is meant to support recovery, not replace professional care, therapy, crisis services, or emergency services.

If someone is in immediate danger, contact local emergency services first.
