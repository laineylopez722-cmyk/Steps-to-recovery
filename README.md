# Steps to Recovery

Privacy-first 12-step recovery companion built with React Native + Expo.

## Mission

Support people in recovery with practical daily tools, strong privacy defaults, and a calm, non-judgmental experience.

## Current Status

- ✅ Core mobile app shipped and actively iterating
- ✅ AI Companion, journaling, step work, and check-ins are live
- ✅ Crisis and safety features are implemented
- 🚧 Beta polish and release hardening in progress

See `docs/STATUS_REPORT.md` for latest release readiness detail.

## Feature Highlights

### Privacy + Security

- Local-first architecture with encrypted on-device storage
- Secure cloud sync with Supabase + Row Level Security
- Sensitive user data encrypted before persistence/sync paths
- No ad-tech or third-party tracking stack in core flows

### Recovery Toolkit

- Encrypted personal journal
- Guided 12-step work tracking
- Daily check-ins and progress tracking
- Sponsor support flows
- Meeting tools and reflections
- Sobriety streak and milestone tracking
- Gratitude and inventory workflows
- Daily readings

### Immediate Support

- AI Companion with recovery-focused context
- Crisis detection + support surfaces
- Safety plan and emergency support flows
- Local/push reminders and nudges

## Tech Stack

- **Mobile:** React Native 0.81 + Expo SDK 54
- **Language:** TypeScript (strict)
- **Backend:** Supabase (Auth, Postgres, RLS, Edge Functions)
- **Local Data:** SQLite + secure storage
- **State:** React Query + Zustand
- **Styling/UI:** Uniwind + custom design system
- **Monorepo:** npm workspaces + Turborepo

## Project Structure

```text
apps/
  mobile/               # Expo app
    src/
      features/         # Domain features (ai-companion, crisis, journal, steps, etc.)
      design-system/    # Shared design tokens/components
      db/               # Local database + repositories
      services/         # Sync, notifications, integrations
packages/
  shared/               # Shared types/utilities
supabase/
  functions/            # Edge functions (including ai-chat)
  migrations/           # SQL migrations
docs/                   # Product + engineering documentation
```

## Quick Start

```bash
npm install
cd apps/mobile
npm start
```

## Common Commands

```bash
# Type check
npm run type-check --workspace=apps/mobile

# Test suite
npm test --workspace=apps/mobile

# Coverage
npm run test:coverage --workspace=apps/mobile

# E2E (Maestro)
npm run e2e --workspace=apps/mobile
```

## Build

```bash
cd apps/mobile
eas build --profile preview --platform android
eas build --profile production --platform all
```

See `SETUP.md` and `DEPLOYMENT.md` for full environment and release setup.

## Documentation Index

- [Setup Guide](./SETUP.md)
- [Testing Guide](./TESTING.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Status Report](./docs/STATUS_REPORT.md)
- [AI Companion Architecture](./docs/AI-COMPANION-ARCHITECTURE.md)
- [Risk Detection Feature](./docs/RISK-DETECTION-FEATURE.md)
- [Privacy Policy](./docs/PRIVACY_POLICY.md)
- [Terms of Service](./docs/TERMS_OF_SERVICE.md)
- [Security Policy](./SECURITY.md)

## Support Resources

If you or someone you know is in immediate danger, call local emergency services first.

- SAMHSA National Helpline (US): 1-800-662-4357
- Crisis Text Line (US/CA/UK/IE): Text HOME to 741741 (US/CA), 85258 (UK), 50808 (IE)
- Alcoholics Anonymous: https://www.aa.org
- Narcotics Anonymous: https://www.na.org

---

This app supports recovery. It is not a replacement for professional medical care, therapy, or emergency services.
