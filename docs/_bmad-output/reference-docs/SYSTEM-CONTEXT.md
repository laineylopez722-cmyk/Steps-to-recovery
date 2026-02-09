# Recovery Companion - System Context
## Claude Projects Knowledge Base

---

## Project Overview

**Name:** 12-Step Recovery Companion  
**Type:** Privacy-first mobile app for addiction recovery  
**Platform:** Android (primary), iOS-ready architecture  
**Status:** Phase 4 Complete - Production Ready

### Mission Statement

> A compassionate, private space for people in 12-step recovery to track their
> journey, process their feelings, and access support tools—all without ever
> sending their data to a server.

### Core Principles

1. **Privacy First**: All data stays on-device, encrypted at rest
2. **Compassion Over Metrics**: Progress, not perfection
3. **Offline Always**: No network dependency for any feature
4. **User Ownership**: Full data export and deletion capabilities
5. **Accessibility**: Screen reader support for all interactions

---

## Tech Stack Reference

### Framework & Language

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.76+ | Cross-platform mobile |
| Expo | SDK 52+ | Managed workflow, OTA updates |
| TypeScript | 5.x | Type safety (strict mode) |
| expo-router | v4 | File-based navigation |

### State & Data

| Technology | Version | Purpose |
|------------|---------|---------|
| Zustand | 5.x | Client state management |
| TanStack Query | v5 | Async state, caching |
| expo-sqlite | Latest | Local SQLite database |
| expo-secure-store | Latest | Biometric-protected key storage |
| expo-crypto | Latest | Encryption operations |

### UI & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| NativeWind | v4 | Tailwind CSS for React Native |
| lucide-react-native | Latest | Icon library |
| expo-audio | Latest | Audio recording/playback |

### Security & Auth

| Technology | Purpose |
|------------|---------|
| expo-local-authentication | Biometric (Face ID, fingerprint) |
| expo-secure-store | Hardware-backed key storage |
| AES-256 encryption | Content encryption at rest |

### Build & Deploy

| Technology | Purpose |
|------------|---------|
| EAS Build | Cloud builds for Android/iOS |
| EAS Submit | App store submission |

---

## Data Model Summary

### Core Entities

```
┌─────────────────────────────────────────────────────────────┐
│                     DATA RELATIONSHIPS                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SobrietyProfile (1)                                        │
│       │                                                     │
│       ├── JournalEntry (N)         ← Encrypted content      │
│       │       └── EmotionTags (N)                          │
│       │                                                     │
│       ├── DailyCheckin (N)         ← One per day           │
│       │                                                     │
│       ├── Milestone (N)            ← Auto + custom         │
│       │                                                     │
│       ├── MeetingLog (N)           ← Encrypted notes       │
│       │                                                     │
│       ├── MotivationVault (N)      ← Extra biometric       │
│       │                                                     │
│       ├── TimeCapsule (N)          ← Future-dated          │
│       │                                                     │
│       └── RelapseRecord (N)        ← Compassionate logging │
│                                                             │
│  AppSettings (1)                   ← User preferences      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Types

```typescript
// Journal entry types
type JournalType = 
  | 'freeform'           // Free-form text
  | 'step-work'          // 12-step work (has stepNumber)
  | 'meeting-reflection' // Post-meeting reflection
  | 'daily-checkin';     // Quick daily entry

// Recovery program types
type ProgramType = 
  | '12-step-aa'   // Alcoholics Anonymous
  | '12-step-na'   // Narcotics Anonymous
  | 'smart'        // SMART Recovery
  | 'custom';      // User-defined

// Milestone types
type MilestoneType = 
  | 'time-based'       // 24hrs, 30 days, 1 year, etc.
  | 'step-completion'  // Completed a step
  | 'personal'         // User-defined achievement
  | 'meeting';         // Meeting-related

// Mood scale: 1-10 (1 = very low, 10 = excellent)
// Craving scale: 0-10 (0 = none, 10 = severe)
```

### Encrypted Fields

These fields contain sensitive user content and are encrypted at rest:

| Table | Encrypted Fields |
|-------|------------------|
| `journal_entries` | `content` |
| `daily_checkins` | `gratitude` |
| `meeting_logs` | `key_takeaways` |
| `motivation_vault` | `content` |
| `time_capsules` | `content` |
| `milestones` | `reflection` |
| `relapse_records` | `triggers`, `reflection`, `lessons_learned` |

---

## Privacy Boundaries

### Absolute Rules

```
┌─────────────────────────────────────────────────────────────┐
│                    PRIVACY BOUNDARIES                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓  LOCAL DEVICE ONLY - NEVER TRANSMITTED                ▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓                                                       ▓  │
│  ▓  • All journal content                                ▓  │
│  ▓  • Mood and craving scores                            ▓  │
│  ▓  • Sobriety date and streaks                          ▓  │
│  ▓  • Meeting notes and reflections                      ▓  │
│  ▓  • Voice recordings                                   ▓  │
│  ▓  • Motivation vault items                             ▓  │
│  ▓  • Time capsule content                               ▓  │
│  ▓  • Personal milestones                                ▓  │
│  ▓  • Relapse records                                    ▓  │
│  ▓  • App settings and preferences                       ▓  │
│  ▓                                                       ▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                                                             │
│  ╔═══════════════════════════════════════════════════════╗  │
│  ║  NEVER COLLECTED OR TRANSMITTED                       ║  │
│  ╠═══════════════════════════════════════════════════════╣  │
│  ║  • Analytics or tracking data                         ║  │
│  ║  • Usage patterns or behavior                         ║  │
│  ║  • Location data                                      ║  │
│  ║  • Device identifiers                                 ║  │
│  ║  • Crash reports with user context                    ║  │
│  ║  • Any personally identifiable information            ║  │
│  ╚═══════════════════════════════════════════════════════╝  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Encryption Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  ENCRYPTION FLOW                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. App First Launch                                        │
│     └── Generate 256-bit encryption key                     │
│         └── Store in SecureStore (biometric-protected)      │
│                                                             │
│  2. Writing Sensitive Data                                  │
│     └── Plaintext content                                   │
│         └── Encrypt with AES-256                            │
│             └── Store encrypted blob in SQLite              │
│                                                             │
│  3. Reading Sensitive Data                                  │
│     └── Biometric authentication                            │
│         └── Retrieve key from SecureStore                   │
│             └── Decrypt AES-256                             │
│                 └── Display plaintext to user               │
│                                                             │
│  4. App Locked                                              │
│     └── Key inaccessible without biometric                  │
│         └── Data remains encrypted in SQLite                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
twelve-step-companion/
├── app/                          # expo-router screens
│   ├── _layout.tsx              # Root layout (providers)
│   ├── (auth)/                  # Auth gate
│   │   └── lock.tsx             # Biometric lock screen
│   ├── (tabs)/                  # Main tab navigation
│   │   ├── index.tsx            # Dashboard/Home
│   │   ├── journal.tsx          # Journal list
│   │   ├── progress.tsx         # Milestones & stats
│   │   └── tools.tsx            # Recovery tools
│   ├── journal/                 # Journal screens
│   │   ├── [id].tsx            # View/edit entry
│   │   ├── new.tsx             # New entry
│   │   └── voice.tsx           # Voice recording
│   ├── onboarding/             # First-time setup
│   ├── settings/               # App configuration
│   ├── step-work/              # 12-step modules
│   │   └── [step].tsx          # Dynamic step pages
│   └── vault/                  # Motivation vault
├── components/
│   ├── common/                 # Shared components
│   │   ├── CrisisButton.tsx    # Global emergency FAB
│   │   ├── ErrorBoundary.tsx   # Error handling
│   │   └── EmptyState.tsx      # Empty list states
│   ├── journal/                # Journal components
│   ├── progress/               # Progress components
│   │   ├── SobrietyCounter.tsx # Main counter
│   │   └── SimpleTrendChart.tsx # Mood trend
│   └── ui/                     # Design system
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Slider.tsx
├── lib/
│   ├── constants/              # Static data
│   │   ├── emotions.ts         # Emotion tags
│   │   ├── milestones.ts       # Time-based milestones
│   │   ├── stepPrompts.ts      # 12-step prompts
│   │   └── crisisResources.ts  # Emergency contacts
│   ├── db/                     # Database layer
│   │   ├── client.ts           # SQLite client
│   │   └── models/             # Model classes
│   ├── encryption/             # Crypto utilities
│   │   └── index.ts            # encrypt/decrypt functions
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.ts          # Biometric auth
│   │   ├── useSobriety.ts      # Sobriety calculations
│   │   └── useJournal.ts       # Journal operations
│   ├── store/                  # Zustand stores
│   │   ├── authStore.ts        # Auth state
│   │   ├── profileStore.ts     # User profile
│   │   ├── journalStore.ts     # Journal entries
│   │   ├── checkinStore.ts     # Daily check-ins
│   │   └── settingsStore.ts    # App settings
│   └── export/                 # Data export
│       └── index.ts            # Export utilities
├── md/                         # Documentation
│   ├── 12-step-companion-cursor-prompt.md
│   ├── BMAD-ARCHITECTURE.md
│   ├── BMAD-DEVELOPMENT-PLAN.md
│   ├── PHASE-0-ASSESSMENT.md
│   └── claude/                 # Claude-specific prompts
└── assets/                     # Static assets
    ├── fonts/
    └── images/
```

---

## Current Development Status

### Completed Phases

| Phase | Status | Completion Date |
|-------|--------|-----------------|
| Phase 0: Discovery | ✅ Complete | Nov 25, 2025 |
| Phase 1: Foundation | ✅ Complete | Nov 25, 2025 |
| Phase 2: Core UX | ✅ Complete | Nov 25, 2025 |
| Phase 3: Simplification | ✅ Complete | Nov 25, 2025 |
| Phase 4: Polish | ✅ Complete | Nov 25, 2025 |

### Feature Checklist

#### P0 (MVP) - All Complete ✅
- [x] Biometric lock screen with PIN fallback
- [x] Onboarding flow (sobriety date, program type)
- [x] Dashboard with sobriety counter
- [x] Basic journaling (freeform, emotions, mood)
- [x] Daily check-in (mood, craving, gratitude)
- [x] Progress tracking with milestones
- [x] Relapse logging with compassionate flow
- [x] Settings and data management

#### P1 (Enhanced) - All Complete ✅
- [x] Step work journals (all 12 steps)
- [x] Voice journal recording
- [x] Meeting tracker with mood comparison
- [x] Time capsules (letters to future self)
- [x] Weekly recovery report
- [x] Journal search
- [x] Simple mood trend chart
- [x] Crisis quick access (global FAB)

#### P2 (Advanced) - All Complete ✅
- [x] Motivation vault with extra biometric
- [x] Trigger scenario simulator
- [x] Tools screen reorganization
- [x] Data export/import
- [x] Data deletion with confirmation
- [x] Accessibility labels

### Pending Items
- [ ] EAS production build
- [ ] Google Play Store submission
- [ ] App Store submission (iOS)

---

## Key Files Reference

### Entry Points
- `app/_layout.tsx` - Root layout with providers
- `app/(auth)/lock.tsx` - Biometric gate
- `app/(tabs)/index.tsx` - Dashboard

### Core Logic
- `lib/db/client.ts` - Database initialization
- `lib/encryption/index.ts` - Encryption utilities
- `lib/store/*.ts` - Zustand stores

### Constants
- `lib/constants/stepPrompts.ts` - 12-step prompts
- `lib/constants/milestones.ts` - Time milestones
- `lib/constants/crisisResources.ts` - Emergency contacts

### Components
- `components/progress/SobrietyCounter.tsx` - Main counter
- `components/common/CrisisButton.tsx` - Emergency FAB
- `components/common/ErrorBoundary.tsx` - Error handling

---

## Quick Reference

### Running the App
```bash
cd twelve-step-companion
npx expo start
```

### Building for Production
```bash
eas build --platform android --profile production
```

### Key Commands
```bash
# Install dependencies
npm install

# Run on Android emulator
npx expo run:android

# Run on iOS simulator
npx expo run:ios

# Generate database migrations
npx drizzle-kit generate
```

---

*Last Updated: December 2025*
*Document Version: 1.0*

