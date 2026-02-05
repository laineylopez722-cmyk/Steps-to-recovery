# 12-Step Companion - App Breakdown

> A privacy-first Progressive Web Application (PWA) for 12-step recovery programs.

---

## Overview

**App Name:** 12-Step Recovery Companion  
**Platform:** PWA (Web) + Expo Mobile + Next.js Sponsor Portal  
**Repository:** [RipKDR/12-Step-Companion](https://github.com/RipKDR/12-Step-Companion)  
**Live Demo:** [12-step-companion.vercel.app](https://12-step-companion.vercel.app/)  
**Architecture:** Monorepo (pnpm workspaces)

### Mission Statement

> A comprehensive recovery companion with sobriety tracking, step work, journaling, worksheets, meeting finder, and AI-powered sponsor chat—all with offline-first PWA functionality.

---

## Core Principles

| Principle | Description |
|-----------|-------------|
| **Privacy-First** | Data stored locally by default |
| **Offline-First** | Full PWA with service worker caching |
| **No Sign-Up Required** | Start using immediately |
| **Optional Cloud Sync** | Supabase sync is opt-in |

---

## Tech Stack

### Web Frontend (Legacy Client)

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.0.0 | UI framework |
| Vite | 5.4.21 | Build tool |
| Wouter | Routing |
| Zustand | State management |
| TanStack Query | Server state |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |

### Web App (Next.js Sponsor Portal)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.3 | React framework |
| React | 19.0.0 | UI framework |
| tRPC | Type-safe APIs |
| NextAuth | Authentication |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |

### Mobile App (Expo)

| Technology | Purpose |
|------------|---------|
| Expo | React Native framework |
| Expo Router | File-based navigation |
| TypeScript | Type safety |
| expo-sqlite | Local database |
| expo-secure-store | Secure storage |
| tRPC | API client |

### Backend

| Technology | Purpose |
|------------|---------|
| Express.js | API server |
| PostgreSQL (Supabase) | Cloud database |
| Drizzle ORM | Database ORM |
| tRPC | Type-safe API layer |

---

## Applications

### 1. Legacy Client (`client/`)

**Status:** ⚠️ Legacy (still functional)

**Features:**
- Full PWA functionality
- Service worker caching
- Offline support
- Local storage

---

### 2. Web App (`apps/web/`)

**Status:** ✅ Active (Sponsor Portal)

**Purpose:** Sponsor/admin portal for viewing shared content from sponsees.

**Features:**
- Sponsor dashboard
- View shared journal entries
- View shared step work
- User profile management

---

### 3. Mobile App (`apps/mobile/`)

**Status:** ✅ Active

**Features:**
- Native iOS/Android experience
- Offline-first with SQLite
- Secure storage for sensitive data
- Push notifications
- Location services for meeting finder

---

## Features

### 1. Sobriety Counter

**Features:**
- Track clean time (days, hours, minutes)
- Timezone support
- DST awareness
- Milestone celebrations

---

### 2. Step Work Tracker

**Features:**
- All 12 steps with guided questions
- Support for AA and NA programs
- Progress tracking
- Completion status
- Shareable with sponsor

**Tabs:**
- Home
- Steps
- Journal
- Meetings
- Settings

---

### 3. Daily Journal

**Features:**
- Mood tracking
- Tags for categorization
- Reflection entries
- Search functionality
- Share with sponsor (opt-in)

---

### 4. Emergency Support

**Features:**
- Crisis hotlines
- Breathing exercises
- Grounding techniques
- Quick access

---

### 5. Worksheets

**Types:**
- HALT check-ins (Hungry, Angry, Lonely, Tired)
- Trigger identification
- Gratitude lists
- Daily inventory
- Step-specific worksheets

---

### 6. Meeting Tracker

**Features:**
- Log meeting attendance
- Track statistics
- Mood before/after
- Notes (encrypted)
- Location-based finder

---

### 7. Milestone Celebrations

**Features:**
- Clean time milestones
- Visual celebrations
- Achievement badges
- Shareable cards

---

### 8. Data Management

**Features:**
- JSON export
- Encrypted backup
- Import from backup
- Full data deletion
- GDPR compliant

---

### 9. AI Sponsor Chat

**Features:**
- AI-powered companion (Gemini API)
- 24/7 availability
- Non-judgmental support
- Requires API key (optional feature)

---

### 10. Action Plans

**Features:**
- Create personalized action plans
- If-Then rules
- Emergency contacts
- Reminder system
- Step-by-step guidance

---

### 11. Sponsor Dashboard (Web)

**Features:**
- View sponsees' shared content
- Journal entries (shared only)
- Step work progress
- Action plans
- Secure authentication

---

## Project Structure

```
12-Step-Companion/
├── apps/
│   ├── web/              # Next.js sponsor portal
│   │   ├── src/
│   │   │   ├── app/      # App Router pages
│   │   │   ├── components/
│   │   │   └── lib/
│   │   └── package.json
│   ├── mobile/           # Expo mobile app
│   │   ├── src/
│   │   │   ├── app/      # Expo Router
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   └── package.json
│   └── docs/             # Documentation
├── packages/
│   ├── api/              # tRPC routers
│   ├── types/            # Shared TypeScript types
│   └── ui/               # Shared UI components
├── client/               # Legacy React/Vite PWA
│   ├── src/
│   │   ├── routes/
│   │   ├── components/
│   │   ├── lib/
│   │   └── store/
│   └── public/
├── server/               # Express backend
│   ├── index.ts
│   ├── routes.ts
│   └── migrations/
└── shared/               # Shared schemas
    └── schema.ts
```

---

## Mobile App Features

### Offline-First

- Core features work without internet
- SQLite for local storage
- Sync when online

### Secure Storage

- Expo SecureStore for tokens
- Encrypted sensitive data
- Biometric protection

### Location Services

- Geofenced triggers
- Meeting finder by location
- Optional permissions

### Push Notifications

- Daily reminders
- Routine nudges
- Milestone alerts

### Sponsor Sharing

- Secure code-based pairing
- Per-item sharing granularity
- End-to-end encryption

---

## Privacy & Security

### Data Storage

| Type | Storage |
|------|---------|
| Auth tokens | SecureStore |
| Local cache | SQLite |
| Cloud sync | Supabase (opt-in) |

### Permissions

| Permission | Purpose |
|------------|---------|
| Location | Meeting finder, geofenced triggers (optional) |
| Notifications | Daily reminders (optional) |

### Data Control

- No analytics by default (PostHog opt-in)
- Full export capability
- Complete deletion option
- User owns all data

---

## Commands

### Development

```bash
# Install dependencies
pnpm install

# Mobile app (Expo)
pnpm run mobile:dev

# Web app (Next.js)
pnpm run dev:web

# Type checking
pnpm run type-check:all
```

### Production

```bash
# Web app
pnpm run build:web

# Mobile app (EAS)
cd apps/mobile
eas build --platform android
```

---

## Key Differences from Steps to Recovery

| Feature | 12-Step Companion | Steps to Recovery |
|---------|-------------------|-------------------|
| Primary Platform | PWA (Web) | Mobile (Expo) |
| AI Chat | ✅ Gemini API | ❌ Not included |
| Worksheets | ✅ HALT, Triggers, etc. | ❌ Not included |
| Sponsor Portal | ✅ Next.js web app | ❌ In-app only |
| Encryption | Optional | ✅ AES-256-CBC mandatory |
| Architecture | Legacy + Modern | Modern only |
| Backend | Express + PostgreSQL | Supabase only |

---

## Roadmap

### Short Term
- ✅ Complete Next.js app setup
- ✅ Establish tRPC API layer
- ⏳ Migrate features from legacy client to apps/web

### Medium Term
- ⏳ Deprecate client/ directory
- ⏳ Expand shared UI components
- ⏳ Improve test coverage

### Long Term
- ⏳ Unified web application
- ⏳ Full mobile app feature parity
- ⏳ Shared component library

---

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

*Last Updated: February 2026*
