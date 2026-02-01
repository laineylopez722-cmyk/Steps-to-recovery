# Steps to Recovery

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
- 📍 **Meeting Geofencing** - Location-based reminders
- 🔥 **Sobriety Streaks** - Track milestones and celebrate progress
- 🔔 **Smart Notifications** - Just-in-time support and reminders

### User Experience

- **Mobile-first** design for iOS and Android
- **Calming, empathetic** UI with supportive messaging
- **Gamification** for motivation (without pressure)
- **Accessibility** support (screen readers, font scaling)

## 🏗️ Tech Stack

- **Frontend**: React Native + Expo (TypeScript)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Offline Storage**: SQLite with SQLCipher encryption
- **State Management**: React Query + Zustand
- **Navigation**: React Navigation
- **Monorepo**: Turborepo

## 📁 Project Structure

See [SETUP.md](./SETUP.md) for detailed structure and setup instructions.

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

## 📋 Development Roadmap

- ✅ **Phase 0**: Project scaffolding and setup
- ⏳ **Phase 1**: Core architecture & user authentication
- ⏳ **Phase 2**: Journaling & step work features
- ⏳ **Phase 3**: Sponsor connection & sharing
- ⏳ **Phase 4**: Notifications, geofencing & streaks
- ⏳ **Phase 5**: Polish, accessibility, testing

## 🔒 Privacy & Security

This app is built with privacy as a fundamental principle:

- All sensitive data encrypted **before** leaving the device
- Encryption keys stored in device secure storage (Keychain/Keystore)
- Zero-knowledge architecture where possible
- Supabase Row-Level Security enforced
- No collection of personal data beyond what's necessary
- Optional anonymous usage mode

## 📖 Documentation

- [Setup Guide](./SETUP.md) - Complete setup and installation
- [Development Plan](./plan.txt) - Detailed MVP implementation plan
- [Tech Stack Guide](./tech%20stack.txt) - In-depth technology decisions
- [Claude Prompts](./.claude/) - Feature-specific implementation guides
- [API & Data Model](./docs/API.md) - Local schema, sync, and Supabase overview
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and fixes
- [Privacy Policy (Draft)](./docs/PRIVACY_POLICY.md) - Review before release
- [Terms of Service (Draft)](./docs/TERMS_OF_SERVICE.md) - Review before release

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
