# Steps to Recovery - Setup Guide

## Project Overview

A privacy-first 12-step recovery companion mobile app built with:

- **Mobile**: React Native 0.81.5 + Expo SDK ~54.0.0 (TypeScript)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Architecture**: Monorepo with Turborepo + npm workspaces
- **Offline-First**: expo-sqlite (mobile) / IndexedDB (web)
- **Encryption**: AES-256-CBC via crypto-js, keys in expo-secure-store

## Project Structure

```
Steps-to-recovery/
├── apps/
│   └── mobile/              # Expo React Native app
├── packages/
│   └── shared/              # Shared types, constants (@recovery/shared)
├── .claude/                 # Claude Code agents & prompts
├── supabase-schema.sql      # Base Supabase schema with RLS
├── turbo.json               # Turborepo task config
└── package.json             # Monorepo workspace config
```

## Mobile App Structure

```
apps/mobile/src/
├── adapters/                # Platform abstraction (storage, secureStorage)
├── components/              # Shared UI components
├── config/                  # App configuration
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

## Getting Started

### Prerequisites

- Node.js >=20.0.0
- npm (pinned: 10.9.2 via `packageManager` field)
- Supabase account (free tier works)
- Expo Go app (for physical device testing)

### Installation

1. **Clone and install dependencies**

   ```bash
   git clone https://github.com/RipKDR/Steps-to-recovery.git
   cd Steps-to-recovery
   npm install
   ```

2. **Set up Supabase**
   - Create a new project at https://supabase.com
   - Run `supabase-schema.sql` in the SQL Editor to create tables with RLS
   - Copy your project URL and anon key

3. **Create environment file**

   Create `apps/mobile/.env`:

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EXPO_PUBLIC_SENTRY_DSN=              # Optional - for error monitoring
   ```

4. **Start development server**

   ```bash
   # From root:
   npm run mobile

   # Or from mobile dir:
   cd apps/mobile && npx expo start
   ```

5. **Run on device/simulator**
   - Press `i` for iOS simulator (macOS only)
   - Press `a` for Android emulator
   - Scan QR code with Expo Go on physical device

## Common Commands

```bash
# Development
npm run mobile              # Start Expo dev server
npm run android             # Run on Android
npm run ios                 # Run on iOS

# Testing
npm test                    # Run all tests (via Turborepo)
cd apps/mobile && npm test  # Run mobile tests directly
npm run test:watch          # Watch mode (in apps/mobile)
npm run test:coverage       # Coverage report (in apps/mobile)
npm run test:encryption     # Encryption tests (in apps/mobile)

# E2E (Maestro)
cd apps/mobile
npm run e2e                 # All flows
npm run e2e:validate        # Dry-run syntax check

# Quality
npm run lint                # ESLint (via Turborepo)
npm run type-check          # TypeScript check (via Turborepo)
npm run format              # Prettier format
npm run format:check        # Check formatting
```

## Development Phases

Following a BMAD (Build-Measure-Analyze-Decide) approach:

### Phase 1: Core Architecture & Auth ✅

- [x] Monorepo setup (Turborepo + npm workspaces)
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

## Privacy & Security

- **Encryption**: AES-256-CBC with PBKDF2 key derivation (100k iterations), unique IV per encryption
- **Key Storage**: expo-secure-store only (device Keychain/Keystore) — never AsyncStorage or SQLite
- **Row-Level Security**: All Supabase tables enforce `auth.uid() = user_id`
- **Logging**: Sanitized logger (no `console.*` with sensitive data)
- **Sync**: Data remains encrypted end-to-end through sync pipeline

## Error Monitoring (Sentry)

Sentry is configured for production error tracking with automatic sanitization.

### Setup

1. Create a Sentry project (React Native platform) at https://sentry.io
2. Add DSN to `apps/mobile/.env`:
   ```bash
   EXPO_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
   ```
3. For production (EAS Build):
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN \
     --value "your-dsn" --type string
   ```

### How It Works

- Initialized early via `initSentry()` — only active in production (`__DEV__ = false`)
- User ID tracked (not email) via `setSentryUser()` in AuthContext
- `logger.error()` auto-sends to Sentry; sensitive fields are redacted
- Config files: `apps/mobile/src/lib/sentry.ts`, `apps/mobile/src/lib/sentrySanitizer.ts`

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [Sentry for React Native](https://docs.sentry.io/platforms/react-native/)
- [CLAUDE.md](./CLAUDE.md) — Full architecture, conventions, and security patterns
