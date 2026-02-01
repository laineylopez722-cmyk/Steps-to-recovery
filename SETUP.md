# Steps to Recovery - Setup Guide

## Project Overview

A privacy-first 12-Step Recovery Companion app built with:

- **Mobile**: React Native + Expo (TypeScript)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Architecture**: Monorepo with Turborepo
- **Offline-First**: SQLite with encryption
- **Security**: End-to-end encryption for journals

## Project Structure

```
Steps-to-recovery/
├── apps/
│   ├── mobile/          # Expo React Native app (MVP focus)
│   └── web/             # Next.js app (future)
├── packages/
│   ├── shared/          # Shared types, constants, utils
│   ├── api/             # API client abstractions (future)
│   └── ui/              # Shared UI components (future)
├── .claude/             # Claude Code prompt files
├── plan.txt             # Comprehensive MVP plan
├── tech stack.txt       # Detailed tech stack documentation
└── package.json         # Monorepo workspace config
```

## Mobile App Structure

```
apps/mobile/src/
├── features/
│   ├── auth/            # Authentication & onboarding
│   ├── journal/         # Encrypted journaling
│   ├── steps/           # 12-step work tracking
│   ├── sponsor/         # Sponsor connection & sharing
│   ├── notifications/   # Reminders & geofencing
│   └── challenges/      # Milestones & streaks
├── components/          # Shared UI components
├── navigation/          # React Navigation setup
├── contexts/            # React contexts (Auth, DB, Sync)
├── lib/                 # Third-party integrations
└── utils/               # Utility functions
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier)

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Create a new Supabase project at https://supabase.com
   - Copy your project URL and anon key
   - Create `.env` file in root and `apps/mobile/.env`:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Navigate to mobile app**

   ```bash
   cd apps/mobile
   ```

4. **Start Expo development server**

   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - Press `i` for iOS simulator (macOS only)
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## Development Phases

Following a BMAD (Build-Measure-Analyze-Decide) approach:

### Phase 0: Setup & Scaffolding ✅ (Current)

- [x] Monorepo structure
- [x] Expo app initialization
- [x] Shared package setup
- [x] Claude prompt files
- [ ] Install core dependencies
- [ ] Basic navigation
- [ ] Supabase integration

### Phase 1: Core Architecture & User Auth

- [ ] Supabase Auth integration
- [ ] Login/SignUp screens
- [ ] Onboarding flow
- [ ] Secure token storage
- [ ] Auth context

### Phase 2: Journaling & Step Work

- [ ] Encrypted journaling
- [ ] SQLite setup with encryption
- [ ] Offline sync mechanism
- [ ] Step work UI and data models

### Phase 3: Sponsor Connection & Sharing

- [ ] Sponsor invite flow
- [ ] Sponsorship management
- [ ] Selective entry sharing
- [ ] RLS policies

### Phase 4: Notifications, Geofencing & Streaks

- [ ] Daily reminders
- [ ] Geofencing for meetings
- [ ] Sobriety streak counter
- [ ] Milestones & achievements

### Phase 5: Polish

- [ ] Accessibility improvements
- [ ] UX refinements
- [ ] Testing
- [ ] Error handling

## Claude Code Prompts

The `.claude/` directory contains feature-specific prompts:

- `AppCoreClaude.md` - Core app structure
- `OnboardingClaude.md` - Auth & onboarding
- `JournalingClaude.md` - Encrypted journaling
- `StepWorkClaude.md` - 12-step tracking
- `SponsorClaude.md` - Sponsor features
- `NotificationsClaude.md` - Notifications & geofencing
- `ChallengesClaude.md` - Streaks & challenges

Use these prompts with Claude Code to generate feature implementations.

## Key Technologies

- **React Native + Expo SDK ~50**
- **TypeScript**
- **React Navigation** - App navigation
- **Supabase** - Backend (Auth, Database, Storage)
- **SQLite** - Offline storage
- **SQLCipher** - Database encryption
- **Expo SecureStore** - Secure key storage
- **Expo Notifications** - Local notifications
- **Expo Location + TaskManager** - Geofencing
- **React Query** - State management
- **Zod** - Schema validation

## Privacy & Security

- End-to-end encryption for journals
- Client-side encryption with AES-256
- Supabase Row-Level Security
- Secure key storage (device keychain)
- No sensitive data logging
- Privacy-first analytics (PostHog)

## Error Monitoring with Sentry

Sentry is configured for production error tracking with automatic sanitization of sensitive data.

### Local Development Setup

1. **Create Sentry account** (if needed)
   - Go to https://sentry.io/signup/
   - Create organization: `steps-to-recovery` (or your preferred name)

2. **Create mobile project**
   - Organization → Projects → Create Project
   - Platform: React Native
   - Project name: `mobile`

3. **Get your DSN**
   - Project Settings → Client Keys (DSN)
   - Copy the DSN (format: `https://<key>@<org>.ingest.sentry.io/<project-id>`)

4. **Add to local `.env`**
   ```bash
   # apps/mobile/.env
   EXPO_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
   ```

### Production Setup (EAS Build)

For production builds, add the Sentry DSN to EAS Secrets:

```bash
# Set production Sentry DSN
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://your-key@your-org.ingest.sentry.io/your-project-id" --type string

# Verify it's set
eas secret:list
```

### How It Works

- **Automatic initialization**: Sentry is initialized early in `App.tsx` via `initSentry()`
- **User tracking**: User ID (not email) is tracked via `setSentryUser()` in `AuthContext`
- **Error capture**: Errors are automatically captured via `Sentry.wrap()` on the root component
- **Logger integration**: `logger.error()` automatically sends errors to Sentry in production
- **Data sanitization**: All sensitive fields (encrypted\_\*, journal, etc.) are automatically redacted
- **Privacy-first**: Only runs in production builds (`__DEV__ = false`)

### Testing Sentry

To test Sentry in a preview build:

```bash
# Create preview build with Sentry
eas build --platform android --profile preview

# Test by triggering an error in the app
# Errors should appear in Sentry dashboard within 30 seconds
```

### Sentry Configuration Files

- `apps/mobile/src/lib/sentry.ts` - Sentry initialization & sanitization
- `apps/mobile/app.json` - Sentry plugin config (`@sentry/react-native/expo`)
- `apps/mobile/App.tsx` - Early initialization & root component wrapping

## Next Steps

1. Install remaining dependencies
2. Set up Supabase database schema
3. Implement authentication (Phase 1)
4. Build encrypted journaling (Phase 2)

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [Sentry Documentation](https://docs.sentry.io/platforms/react-native/)
- [Plan Document](./plan.txt)
- [Tech Stack Details](./tech%20stack.txt)
