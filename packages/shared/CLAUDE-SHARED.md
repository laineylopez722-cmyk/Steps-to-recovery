# CLAUDE-SHARED.md

Documentation for the shared package - constants, stores, types, and services used across platforms.

## Package Overview

**Location**: `packages/shared/`
**Import**: `import { ... } from '@recovery/shared'`

The shared package contains code reused between the mobile app and future web app, ensuring consistency in business logic, constants, and state management.

---

## Directory Structure

```
packages/shared/
├── constants/         # App constants (achievements, emotions, slogans, etc.)
├── store/            # Zustand stores for state management
├── types/            # TypeScript type definitions
├── services/         # Business logic services
├── jitai/            # Just-In-Time Adaptive Intervention engine
├── notifications/    # Notification patterns
├── encryption/       # Encryption utilities
├── db/               # Database client and models
├── utils/            # Utility functions
└── src/              # Additional source files
    └── types/        # Database and model types
```

---

## Constants

**Location**: `packages/shared/constants/`

### Available Constants

| File                  | Purpose                   | Example                |
| --------------------- | ------------------------- | ---------------------- |
| `achievements.ts`     | Achievement definitions   | Milestone badges       |
| `emotions.ts`         | Emotion options           | Mood tracking          |
| `milestones.ts`       | Sobriety milestones       | 1, 7, 30, 90, 365 days |
| `slogans.ts`          | Recovery slogans          | "One day at a time"    |
| `stepPrompts.ts`      | 12-step guided questions  | Step 1-12 prompts      |
| `prayers.ts`          | Recovery prayers          | Serenity Prayer        |
| `readings.ts`         | Daily readings            | Meditation content     |
| `keytags.ts`          | NA/AA keytag definitions  | Color, meaning         |
| `promises.ts`         | 12 Promises               | Promise list           |
| `crisisResources.ts`  | Emergency contacts        | Hotlines, resources    |
| `triggerScenarios.ts` | Common trigger scenarios  | For JITAI              |
| `meetingTopics.ts`    | Meeting topic suggestions | Discussion starters    |
| `dailyReadings.ts`    | Daily reading content     | By date                |
| `designTokens.ts`     | Design system tokens      | Colors, spacing        |

### Usage

```typescript
import { MILESTONES, EMOTIONS, SLOGANS, STEP_PROMPTS } from '@recovery/shared/constants';

// Milestones
const nextMilestone = MILESTONES.find((m) => m.days > currentDays);

// Emotions for mood tracking
const moodOptions = EMOTIONS.map((e) => e.label);

// Step prompts
const step1Questions = STEP_PROMPTS[1];
```

### Milestone Definitions

```typescript
export const MILESTONES = [
  { days: 1, label: '1 Day', badge: 'day-1' },
  { days: 7, label: '1 Week', badge: 'week-1' },
  { days: 14, label: '2 Weeks', badge: 'week-2' },
  { days: 30, label: '1 Month', badge: 'month-1' },
  { days: 60, label: '2 Months', badge: 'month-2' },
  { days: 90, label: '3 Months', badge: 'month-3' },
  { days: 180, label: '6 Months', badge: 'month-6' },
  { days: 365, label: '1 Year', badge: 'year-1' },
];
```

---

## Zustand Stores

**Location**: `packages/shared/store/`

### Available Stores

| Store                    | Purpose                 | Key State                         |
| ------------------------ | ----------------------- | --------------------------------- |
| `journalStore.ts`        | Journal entry state     | entries, createEntry, updateEntry |
| `checkinStore.ts`        | Daily check-in state    | morningCheckin, eveningCheckin    |
| `meetingStore.ts`        | Meeting finder state    | meetings, favorites               |
| `stepWorkStore.ts`       | 12-step work state      | stepProgress, responses           |
| `achievementStore.ts`    | Achievement tracking    | earnedBadges, milestones          |
| `profileStore.ts`        | User profile state      | sobrietyDate, settings            |
| `settingsStore.ts`       | App settings            | darkMode, notifications           |
| `contactStore.ts`        | Support contacts        | sponsor, emergencyContacts        |
| `authStore.ts`           | Auth state              | user, session                     |
| `readingStore.ts`        | Daily readings          | todaysReading, history            |
| `regularMeetingStore.ts` | Regular meetings        | weeklyMeetings                    |
| `vaultStore.ts`          | Secure vault            | encryptedNotes                    |
| `rhythmStore.ts`         | Recovery rhythm         | streaks, habits                   |
| `scenarioStore.ts`       | Trigger scenarios       | userScenarios                     |
| `amendsStore.ts`         | Steps 8-9 amends        | amendsList                        |
| `fourthStepStore.ts`     | Step 4 inventory        | resentments, fears                |
| `tenthStepStore.ts`      | Step 10 daily inventory | dailyReview                       |
| `capsuleStore.ts`        | Time capsule            | letters, unlockDates              |
| `sharePrepStore.ts`      | Meeting share prep      | shareNotes                        |
| `literatureStore.ts`     | Recovery literature     | bookmarks                         |
| `phoneStore.ts`          | Phone list              | numbers, callHistory              |

### Store Pattern

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface JournalState {
  entries: JournalEntry[];
  isLoading: boolean;
  addEntry: (entry: JournalEntry) => void;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteEntry: (id: string) => void;
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],
      isLoading: false,
      addEntry: (entry) =>
        set((state) => ({
          entries: [entry, ...state.entries],
        })),
      updateEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
    }),
    {
      name: 'journal-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
```

### Usage

```typescript
import { useJournalStore } from '@recovery/shared/store';

function JournalScreen() {
  const { entries, addEntry, isLoading } = useJournalStore();

  const handleSave = () => {
    addEntry({
      id: generateId(),
      content: encryptedContent,
      createdAt: new Date().toISOString(),
    });
  };
}
```

---

## Type Definitions

**Location**: `packages/shared/types/` and `packages/shared/src/types/`

### Key Types

```typescript
// packages/shared/src/types/models.ts

export interface JournalEntry {
  id: string;
  userId: string;
  title: string; // Encrypted
  content: string; // Encrypted
  mood?: number; // 1-5
  tags?: string[];
  isShared: boolean;
  sharedWith?: string[]; // Sponsor IDs
  createdAt: string;
  updatedAt: string;
}

export interface DailyCheckIn {
  id: string;
  userId: string;
  checkInType: 'morning' | 'evening';
  checkInDate: string; // YYYY-MM-DD
  encryptedIntention?: string;
  encryptedReflection?: string;
  encryptedMood?: string;
  encryptedCraving?: string;
  createdAt: string;
}

export interface StepWork {
  id: string;
  userId: string;
  stepNumber: number; // 1-12
  content: string; // Encrypted
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  type: 'clean_time' | 'journal_streak' | 'meeting_attendance' | 'step_completion';
  milestone: number;
  earnedAt: string;
}
```

### Database Types

```typescript
// packages/shared/src/types/database.ts

export interface Database {
  profiles: ProfileRow;
  journal_entries: JournalEntryRow;
  step_work: StepWorkRow;
  sponsorships: SponsorshipRow;
  daily_checkins: DailyCheckInRow;
}
```

---

## Services

**Location**: `packages/shared/services/`

### Achievement Triggers

**File**: `achievementTriggers.ts`

```typescript
import { checkAchievements } from '@recovery/shared/services/achievementTriggers';

// Check and award achievements based on user progress
const newAchievements = await checkAchievements({
  cleanDays: 30,
  journalStreak: 7,
  meetingsThisWeek: 3,
  stepsCompleted: [1, 2, 3],
});
```

### Error Tracking

**File**: `errorTracking.ts`

```typescript
import { trackError } from '@recovery/shared/services/errorTracking';

try {
  // operation
} catch (error) {
  trackError(error, { context: 'sync', userId });
}
```

### Sponsor Connection

**File**: `sponsorConnection.ts`

```typescript
import {
  sendSponsorRequest,
  acceptSponsorRequest,
  shareEntryWithSponsor,
} from '@recovery/shared/services/sponsorConnection';
```

### Weekly Report

**File**: `weeklyReport.ts`

```typescript
import { generateWeeklyReport } from '@recovery/shared/services/weeklyReport';

const report = await generateWeeklyReport(userId, startDate, endDate);
// { journalCount, checkInStreak, moodAverage, ... }
```

---

## JITAI Engine

**Location**: `packages/shared/jitai/`

Just-In-Time Adaptive Intervention - proactive support based on user patterns.

### Components

| File               | Purpose                    |
| ------------------ | -------------------------- |
| `engine.ts`        | Core JITAI decision engine |
| `types.ts`         | Intervention types         |
| `notifications.ts` | Notification templates     |

### How It Works

```typescript
import { JITAIEngine } from '@recovery/shared/jitai';

const engine = new JITAIEngine();

// Analyze user state and context
const intervention = engine.evaluate({
  timeOfDay: 'evening',
  daysSober: 15,
  lastCheckIn: '2024-01-10',
  recentMood: 3,
  triggerRisk: 'medium',
});

// Returns appropriate intervention
// { type: 'reminder', message: 'Time for your evening reflection', action: 'open_checkin' }
```

### Intervention Types

| Type            | Trigger               | Example                               |
| --------------- | --------------------- | ------------------------------------- |
| `reminder`      | Missed check-in       | "Don't forget your morning intention" |
| `encouragement` | Approaching milestone | "You're 2 days from 30!"              |
| `support`       | High craving reported | "Try a breathing exercise"            |
| `celebration`   | Milestone reached     | "Congratulations on 90 days!"         |

---

## Encryption Utils

**Location**: `packages/shared/encryption/`

```typescript
import { encryptContent, decryptContent, generateKey } from '@recovery/shared/encryption';

// Encrypt sensitive data
const encrypted = await encryptContent(plaintext, key);

// Decrypt data
const decrypted = await decryptContent(encrypted, key);
```

**Note**: Encryption keys are stored in platform-specific secure storage (Keychain on iOS, Keystore on Android, encrypted IndexedDB on web).

---

## Notification Patterns

**Location**: `packages/shared/notifications/`

### Meeting Reminders

**File**: `meetingReminders.ts`

```typescript
import { scheduleMeetingReminder } from '@recovery/shared/notifications/meetingReminders';

await scheduleMeetingReminder({
  meetingId: 'abc123',
  meetingName: 'Monday Night Group',
  time: new Date('2024-01-15T19:00:00'),
  reminderMinutes: 30, // Remind 30 min before
});
```

---

## Database Client

**Location**: `packages/shared/db/`

### Models

**File**: `db/models/`

```typescript
import { RegularMeeting } from '@recovery/shared/db/models';

// Regular meeting model for weekly meetings
interface RegularMeeting {
  id: string;
  name: string;
  dayOfWeek: number; // 0-6
  time: string; // HH:mm
  location: string;
  reminderEnabled: boolean;
}
```

---

## Utils

**Location**: `packages/shared/utils/`

| File             | Purpose                |
| ---------------- | ---------------------- |
| `performance.ts` | Performance monitoring |
| `sms.ts`         | SMS deep linking       |
| `index.ts`       | Utility exports        |

### Performance Monitoring

```typescript
import { measureAsync } from '@recovery/shared/utils/performance';

const result = await measureAsync('encryptContent', async () => {
  return await encryptContent(data);
});
// Logs: "encryptContent took 45ms"
```

---

## Import Patterns

### From Mobile App

```typescript
// Constants
import { MILESTONES, EMOTIONS } from '@recovery/shared/constants';

// Stores
import { useJournalStore, useCheckinStore } from '@recovery/shared/store';

// Types
import type { JournalEntry, DailyCheckIn } from '@recovery/shared/types';

// Services
import { checkAchievements } from '@recovery/shared/services/achievementTriggers';

// JITAI
import { JITAIEngine } from '@recovery/shared/jitai';
```

### Re-exporting

```typescript
// packages/shared/index.ts
export * from './constants';
export * from './store';
export * from './types';
export * from './services';
export * from './jitai';
```

---

## Adding New Shared Code

### New Constant

1. Create file in `packages/shared/constants/`
2. Export from `constants/index.ts`
3. Use in mobile/web apps

### New Store

1. Create file in `packages/shared/store/[feature]Store.ts`
2. Follow Zustand pattern with persist middleware
3. Export from `store/index.ts`

### New Type

1. Add to `packages/shared/src/types/models.ts`
2. Export from `types/index.ts`

### New Service

1. Create file in `packages/shared/services/`
2. Keep business logic platform-agnostic
3. Export from `services/index.ts`

---

## Testing

```bash
# From package directory
cd packages/shared
npm test
```

### Test Pattern

```typescript
import { useJournalStore } from './store/journalStore';

describe('journalStore', () => {
  beforeEach(() => {
    useJournalStore.setState({ entries: [] });
  });

  it('adds entry', () => {
    const { addEntry, entries } = useJournalStore.getState();
    addEntry({ id: '1', content: 'test' });
    expect(entries).toHaveLength(1);
  });
});
```

---

## Best Practices

1. **Platform-agnostic**: Shared code must work on both mobile and web
2. **No direct storage**: Use adapters, don't import `expo-sqlite` directly
3. **Type safety**: All exports must be fully typed
4. **Encryption ready**: Sensitive data handlers should accept encrypted input
5. **Testable**: All logic should be unit testable without platform dependencies
