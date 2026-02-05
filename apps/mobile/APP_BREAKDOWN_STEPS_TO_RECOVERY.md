# Steps to Recovery - App Breakdown

> A privacy-first, offline-first 12-step recovery companion mobile app.

---

## Overview

**App Name:** Steps to Recovery  
**Platform:** React Native (Expo) - iOS, Android, Web  
**Status:** Phase 1 Complete, Phase 2 In Progress  
**Architecture:** Monorepo (Turborepo)

### Mission Statement

> A compassionate, private space for people in 12-step recovery to track their journey, process their feelings, and access support tools—with end-to-end encryption and offline-first design.

---

## Core Principles

| Principle | Description |
|-----------|-------------|
| **Privacy-First** | All sensitive data encrypted with AES-256-CBC before storage |
| **Offline-First** | SQLite (mobile) / IndexedDB (web) as source of truth |
| **Encryption-First** | Keys stored in device Keychain/Keystore, never in database |
| **Compassion-First** | No shame-based messaging or punitive mechanics |

---

## Tech Stack

### Framework & Language

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.5 | Cross-platform mobile |
| Expo | SDK 54 | Managed workflow, OTA updates |
| TypeScript | 5.9 | Type safety (strict mode) |
| expo-router | File-based navigation |

### State & Data

| Technology | Purpose |
|------------|---------|
| Zustand | Client state management |
| TanStack Query (React Query) | Server state, caching |
| expo-sqlite | Local SQLite database (mobile) |
| IndexedDB | Local storage (web) |
| expo-secure-store | Encryption key storage |
| Supabase | Cloud backup (encrypted) |

### Security

| Technology | Purpose |
|------------|---------|
| AES-256-CBC | Content encryption |
| HMAC-SHA256 | Integrity verification |
| PBKDF2 | Key derivation (100,000 iterations) |
| expo-secure-store | Hardware-backed key storage |

---

## Features

### 1. Sobriety Tracking

**Clean Time Counter**
- Real-time display (days, hours, minutes)
- Timezone-aware calculations
- DST handling
- Milestone celebrations (1, 7, 14, 30, 60, 90, 180, 365 days)

**Relapse Logging**
- Compassionate, non-judgmental flow
- Option to reset or continue tracking
- Reflection prompts
- No shame messaging

---

### 2. Daily Check-Ins

**Morning Intentions**
- Set daily intention
- Mood rating (1-5)
- Encrypted storage

**Evening Pulse**
- Day reflection
- Mood rating (1-5)
- Craving intensity (0-10)
- Gratitude entry
- Wins and challenges

**Check-In Streaks**
- Weekly streak tracking
- Gentle encouragement (not punitive)
- Restart framing, not failure framing

---

### 3. Encrypted Journaling

**Features**
- Free-form text entries
- Mood tracking
- Craving level tracking
- Emotion/feeling tags
- Search functionality

**Privacy**
- All content encrypted before storage
- Unique IV per encryption
- HMAC authentication tag
- Keys never leave secure storage

---

### 4. 12-Step Work

**Step Work Tracker**
- All 12 steps with guided questions
- Step 1 has 10-15 simplified questions
- Progress tracking per step
- Completion status

**Step-Specific Features**
- Structured prompts for each step
- Reflection areas
- Sponsor review capability (future)

---

### 5. Daily Readings

**Features**
- Daily recovery readings (one per day of year)
- Reflection prompts
- Personal reflection journaling
- Word count tracking

**Content**
- 366 unique readings
- Recovery-focused wisdom
- Reflection prompt for each

---

### 6. Meeting Finder & Logger

**Meeting Finder**
- Location-based search
- Filter by meeting type
- Distance calculations
- Cached for offline use

**Meeting Logger**
- Quick-log attendance
- Mood before/after comparison
- Key takeaways (encrypted)
- Weekly attendance streaks

---

### 7. Emergency & Crisis Tools

**Crisis Button**
- Quick access from anywhere
- Emergency contacts
- Crisis hotline numbers

**Breathing Exercises**
- Guided breathing patterns
- Box breathing
- 4-7-8 technique

**Grounding Techniques**
- 5-4-3-2-1 sensory exercise
- Body scan
- Coping strategies

---

### 8. Sponsor Connections

**Connection System**
- QR code or PIN-based pairing
- End-to-end encrypted communication
- One-to-one relationships

**Sharing Features**
- Selective journal entry sharing
- Step work sharing
- Check-in sharing
- Sponsor can view but not edit

---

### 9. Achievements & Milestones

**Milestone Types**
- Clean time milestones
- Step completion
- Journal streaks
- Meeting attendance

**Milestone Days**
- 1, 7, 14, 30, 60, 90, 180, 365 days
- Custom milestones

---

### 10. Weekly Reports

**Features**
- Automatic weekly summary
- Mood trends
- Check-in completion
- Journal activity
- Meeting attendance

---

## Data Architecture

### Local Database Tables

| Table | Purpose |
|-------|---------|
| `user_profile` | User metadata |
| `journal_entries` | Encrypted journal entries |
| `daily_checkins` | Morning/evening check-ins |
| `step_work` | 12-step work progress |
| `daily_readings` | Static reading content |
| `reading_reflections` | User reflections on readings |
| `achievements` | Milestone tracking |
| `cached_meetings` | Offline meeting cache |
| `favorite_meetings` | User's favorite meetings |
| `sponsor_connections` | Sponsor relationships |
| `sponsor_shared_entries` | Shared content |
| `sync_queue` | Pending cloud sync |
| `weekly_reports` | Generated reports |

### Encryption Flow

```
User Input
    ↓
encryptContent() [AES-256-CBC + HMAC]
    ↓
Store in SQLite (encrypted blob)
    ↓
Add to sync_queue
    ↓
Background sync to Supabase (still encrypted)
```

### Sync Architecture

```
Local Write
    ↓
Add to sync_queue
    ↓
Background Worker (every 5 min)
    ↓
Process Queue (deletes first, then upserts)
    ↓
Retry Logic (3 attempts, exponential backoff)
    ↓
Supabase (encrypted data)
```

---

## Context Architecture

### Provider Order (Critical)

```
AuthContext (Supabase auth)
    ↓
DatabaseContext (SQLite/IndexedDB)
    ↓
SyncContext (Background sync)
    ↓
NotificationContext (Push notifications)
```

### Key Contexts

| Context | Purpose |
|---------|---------|
| `AuthContext` | Supabase authentication, session management |
| `DatabaseContext` | Platform-agnostic database access |
| `SyncContext` | Network state, sync queue processing |

---

## Project Structure

```
apps/mobile/
├── src/
│   ├── adapters/           # Platform abstraction
│   │   ├── storage/        # SQLite/IndexedDB
│   │   └── secureStorage/  # Keychain/Keystore
│   ├── components/         # Shared UI components
│   ├── contexts/           # React contexts
│   ├── design-system/      # iOS-style design tokens
│   ├── features/           # Feature-based modules
│   │   ├── auth/
│   │   ├── home/
│   │   ├── journal/
│   │   ├── steps/
│   │   ├── sponsor/
│   │   └── profile/
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Third-party integrations
│   ├── navigation/         # React Navigation
│   ├── services/           # Business logic (sync, etc.)
│   └── utils/              # Utilities (encryption, logging)
├── app.json
├── app.config.js
└── package.json
```

---

## Security Features

### Encryption

- **Algorithm:** AES-256-CBC
- **Key Derivation:** PBKDF2 (100,000 iterations)
- **Integrity:** HMAC-SHA256 (encrypt-then-MAC)
- **IV:** Unique random IV per encryption
- **Key Storage:** Device Keychain (iOS) / Keystore (Android)

### Data Protection

- All journal content encrypted
- All check-in content encrypted
- All step work encrypted
- Sponsor communications encrypted
- Keys never stored in database
- Keys never transmitted to server

### Supabase Security

- Row-Level Security (RLS) on all tables
- User can only access own data
- Sponsor sharing via explicit policies
- Data stored encrypted (server sees only blobs)

---

## Offline Capabilities

- **Full offline support** for all core features
- Local SQLite/IndexedDB as source of truth
- Background sync when online
- Graceful degradation when offline
- Meeting cache for offline access

---

## Accessibility

- Full VoiceOver/TalkBack support
- accessibilityLabel on all interactive elements
- accessibilityRole on all components
- High contrast support
- Font scaling (up to 200%)
- Minimum touch targets (48x48dp)

---

## Platform Support

| Platform | Status |
|----------|--------|
| iOS | ✅ Supported |
| Android | ✅ Supported |
| Web | ✅ Supported (PWA) |

---

## Commands

```bash
# Start development
npm run mobile

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run tests
npm test

# Type check
npx tsc --noEmit
```

---

## Supabase Project

**Project Reference:** `tbiunmmvfbakwlzykpwq`

**Tables:**
- profiles
- journal_entries
- step_work
- daily_checkins
- sponsorships
- favorite_meetings
- reading_reflections

---

*Last Updated: February 2026*
