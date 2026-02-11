# Steps to Recovery

[![Tests](https://img.shields.io/badge/tests-200%2B%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-75%25%2B-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

A privacy-first 12-Step Recovery Companion mobile application built with React Native and Expo.

## 🎯 Mission

To provide a secure, supportive digital companion for individuals in recovery, emphasizing privacy, offline-first functionality, and meaningful connections with sponsors.

## ✨ Core Features

### Privacy-First Design

- **End-to-end encryption** for all journal entries
- **Offline-first** architecture with SQLite
- **No third-party trackers** or analytics without consent
- **Row-Level Security** on all cloud data

### Recovery Tools

- 📔 **Encrypted Personal Journal** - Daily reflections with mood tracking
- 📝 **12-Step Work Tracker** - Guided forms for each step
- 🤝 **Sponsor Connection** - Secure sharing with your sponsor
- 📍 **Meeting Finder** - Location-based meeting discovery
- 🔥 **Sobriety Tracker** - Track milestones and celebrate progress
- 🔔 **Smart Notifications** - Just-in-time support and reminders
- 🤖 **AI Companion** - Local-first AI support

### User Experience

- **Mobile-first** design for iOS and Android
- **Calming, empathetic** UI with supportive messaging
- **Gamification** for motivation (without pressure)
- **Accessibility** support (screen readers, font scaling)

## 🏗️ Tech Stack

- **Frontend**: React Native + Expo (TypeScript)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Offline Storage**: SQLite with encryption
- **State Management**: React Query + Zustand
- **Navigation**: React Navigation
- **Monorepo**: Turborepo

## 📁 Project Structure

```
apps/
  mobile/           # Expo React Native app
    src/
      features/     # Feature-based modules
      components/   # Shared UI components
      contexts/     # React contexts
      utils/        # Utilities (encryption, etc.)
      design-system/# Design tokens & components
    .maestro/       # E2E test flows
packages/
  shared/           # Shared types and utilities
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Navigate to mobile app
cd apps/mobile

# Start development server
npm start
```

See [SETUP.md](./SETUP.md) for complete setup instructions.

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
cd apps/mobile
npm test

# Run with coverage
npm run test:coverage

# Run encryption tests (critical)
npm run test:encryption
```

**Current Coverage:**

- Journal Hooks: 96% (37 tests)
- Sync Service: 75% (28 tests)
- Encryption: 94% (12 tests)
- **Overall: 75%+**

### E2E Tests

```bash
# Install Maestro
curl -fsSL "https://get.maestro.mobile.dev" | bash

# Run all E2E tests
cd apps/mobile
maestro test .maestro/flows/

# Run specific flow
maestro test .maestro/flows/onboarding.yaml
```

See [Maestro README](apps/mobile/.maestro/README.md) for details.

## 📦 Building

### Prerequisites

- Expo account
- EAS CLI: `npm install -g eas-cli`
- Apple Developer account (for iOS)
- Google Play Console account (for Android)

### Environment Setup

Create `apps/mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SENTRY_DSN=optional-sentry-dsn
```

### Development Build

```bash
cd apps/mobile
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Production Build

```bash
cd apps/mobile
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios --latest
eas submit --platform android --latest
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📋 Development Roadmap

- ✅ **Phase 0**: Project scaffolding and setup
- ✅ **Phase 1**: Core architecture & user authentication
- ✅ **Phase 2**: Journaling & step work features
- ✅ **Phase 3**: Sponsor connection & sharing
- ✅ **Phase 4**: Notifications & AI companion
- ⏳ **Phase 5**: Beta testing & polish

## 🔒 Privacy & Security

This app is built with privacy as a fundamental principle:

- All sensitive data encrypted **before** leaving the device
- Encryption keys stored in device secure storage (Keychain/Keystore)
- Zero-knowledge architecture where possible
- Supabase Row-Level Security enforced
- No collection of personal data beyond what's necessary

See [Privacy Policy](./docs/PRIVACY_POLICY.md) and [Security Policy](./SECURITY.md).

## 📖 Documentation

| Document                                                   | Description                     |
| ---------------------------------------------------------- | ------------------------------- |
| [Setup Guide](./SETUP.md)                                  | Complete setup and installation |
| [Testing Guide](./TESTING.md)                              | Testing strategy and commands   |
| [Deployment Guide](./DEPLOYMENT.md)                        | Build and release process       |
| [Beta Release Checklist](./docs/BETA_RELEASE_CHECKLIST.md) | Pre-release verification        |
| [Status Report](./docs/STATUS_REPORT.md)                   | Current project status          |
| [Privacy Policy](./docs/PRIVACY_POLICY.md)                 | User privacy information        |
| [Terms of Service](./docs/TERMS_OF_SERVICE.md)             | Legal terms                     |
| [API & Data Model](./docs/API.md)                          | Technical documentation         |
| [Troubleshooting](./TROUBLESHOOTING.md)                    | Common issues and fixes         |

## 🤝 Contributing

This is currently a solo-developed MVP. Contributions, suggestions, and feedback are welcome once the initial release is complete.

- See [CONTRIBUTING.md](./CONTRIBUTING.md)
- See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

## 📄 License

MIT. See [LICENSE](./LICENSE).

## 🆘 Support Resources

If you or someone you know is struggling with addiction:

- **SAMHSA National Helpline**: 1-800-662-4357
- **Crisis Text Line**: Text HOME to 741741
- **Alcoholics Anonymous**: https://www.aa.org
- **Narcotics Anonymous**: https://www.na.org

---

**Note**: This app is a tool to support recovery, not a replacement for professional treatment, therapy, or human connection. Always seek professional help when needed.
