# Technical Architecture Document - Steps to Recovery
## Phase 2: Journaling & Step Work Features

**Author:** Claude (Opus 4.5)
**Date:** 2025-12-31
**Version:** 1.0
**Status:** Complete

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architectural Overview](#2-architectural-overview)
3. [Component Architecture](#3-component-architecture)
4. [Data Flow Architecture](#4-data-flow-architecture)
5. [State Management Architecture](#5-state-management-architecture)
6. [Security Architecture](#6-security-architecture)
7. [Database Design](#7-database-design)
8. [API Design](#8-api-design)
9. [Navigation Architecture](#9-navigation-architecture)
10. [Error Handling Strategy](#10-error-handling-strategy)
11. [Performance Optimization](#11-performance-optimization)
12. [Cross-Cutting Concerns](#12-cross-cutting-concerns)
13. [Implementation Sequence](#13-implementation-sequence)
14. [Architectural Decision Records](#14-architectural-decision-records)
15. [Quality Gates](#15-quality-gates)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the technical architecture for Phase 2 of Steps to Recovery, a privacy-first, offline-first 12-step recovery companion mobile app. The architecture prioritizes:

1. **Privacy**: Zero-knowledge encryption where Supabase sees only encrypted blobs
2. **Offline-First**: SQLite as primary storage, Supabase as optional backup
3. **Accessibility**: WCAG AAA compliance for users in vulnerable states
4. **Performance**: Sub-2-second cold start for emergency access during cravings
5. **Maintainability**: Clear separation of concerns to prevent agent conflicts during 8-week implementation

### 1.2 Scope

Phase 2 implements 9 functional requirement categories:
- FR-1: Onboarding & Setup (30-second tutorial, encryption key generation)
- FR-2: Clean Time Tracker (real-time counter, milestone celebrations)
- FR-3: Daily Check-Ins (morning intention, evening pulse check, streaks)
- FR-4: Emergency Support (crisis toolkit, breathing exercises, safety plan)
- FR-5: Encrypted Journaling (mood/craving tracking, search, tags)
- FR-6: Step Work (Step 1 only - 10-15 simplified questions)
- FR-7: Achievements (basic milestone badges)
- FR-8: Push Notifications (user-controlled reminders)
- FR-9: Offline-First Sync (optional cloud backup)

### 1.3 Existing Codebase Analysis

Phase 0/1 established foundational patterns at `apps/mobile/src/`:

| File | Lines | Purpose | Pattern to Reuse |
|------|-------|---------|------------------|
| `utils/encryption.ts` | 55 | AES-256-CBC encryption | **REUSE**: `encryptContent()`, `decryptContent()` |
| `utils/database.ts` | 65 | SQLite initialization | **EXTEND**: Add new tables for Phase 2 |
| `utils/logger.ts` | 33 | Privacy-preserving logs | **REUSE**: Logger utility as-is |
| `utils/theme.ts` | 175 | Design system tokens | **REUSE**: Colors, spacing, typography |
| `contexts/AuthContext.tsx` | 138 | Supabase auth state | **REUSE**: Auth pattern with useCallback |
| `contexts/DatabaseContext.tsx` | 75 | SQLite context wrapper | **REUSE**: Context pattern |
| `contexts/SyncContext.tsx` | 68 | Sync state management | **EXTEND**: Implement actual sync logic |
| `navigation/types.ts` | 49 | Type-safe navigation | **EXTEND**: Add new screen params |
| `components/Button.tsx` | 139 | Accessible button | **REUSE**: Accessibility pattern |
| `lib/supabase.ts` | 36 | Supabase client with SecureStore | **REUSE**: Client configuration |

**Key Finding**: Phase 1 established solid patterns for encryption, contexts, and accessibility. Phase 2 should extend (not replace) these patterns.

---

## 2. Architectural Overview

### 2.1 High-Level Architecture Diagram

```
+----------------------------------------------------------+
|                    PRESENTATION LAYER                     |
|  +------------+  +------------+  +------------+          |
|  |   Screens  |  | Components |  | Navigation |          |
|  | (features/)|  | (shared)   |  | (bottom-tabs)|        |
|  +-----+------+  +-----+------+  +-----+------+          |
|        |               |               |                  |
+--------|---------------|---------------|------------------+
         v               v               v
+----------------------------------------------------------+
|                    APPLICATION LAYER                      |
|  +------------+  +------------+  +------------+          |
|  |  Contexts  |  |   Hooks    |  |  Services  |          |
|  | (Auth,DB,  |  | (useJournal|  | (Encryption|          |
|  |  Sync)     |  |  useSteps) |  |  Sync)     |          |
|  +-----+------+  +-----+------+  +-----+------+          |
|        |               |               |                  |
+--------|---------------|---------------|------------------+
         v               v               v
+----------------------------------------------------------+
|                      DATA LAYER                           |
|  +------------------+     +------------------+            |
|  |     SQLite       |     |     Supabase     |            |
|  | (Primary/Offline)|     | (Backup/Sync)    |            |
|  | expo-sqlite      |     | REST API + RLS   |            |
|  +--------+---------+     +--------+---------+            |
|           |                        |                      |
|           v                        v                      |
|  +------------------+     +------------------+            |
|  |   SecureStore    |     |   Encrypted      |            |
|  | (Keys & Tokens)  |     |   Blobs Only     |            |
|  +------------------+     +------------------+            |
+----------------------------------------------------------+
```

### 2.2 Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | Expo SDK | 54.0.30 | React Native managed workflow |
| UI | React | 19.1.0 | Component rendering |
| Language | TypeScript | 5.3.0+ | Type safety (strict mode) |
| State (Server) | React Query | 5.90.15 | Cache, sync, offline |
| State (Client) | Zustand | 5.0.9 | Global UI state |
| State (Auth) | Context API | - | Auth, Database, Sync contexts |
| Storage (Local) | expo-sqlite | 16.0.10 | Primary encrypted storage |
| Storage (Secure) | expo-secure-store | 15.0.8 | Encryption keys only |
| Storage (Cloud) | Supabase | 2.89.0+ | Optional encrypted backup |
| Encryption | crypto-js | 4.2.0 | AES-256-CBC |
| Navigation | React Navigation | 7.x | Bottom tabs + stacks |
| UI Kit | react-native-paper | 5.14.5 | Material Design components |

### 2.3 Architectural Principles

1. **Privacy-First**: Data encrypted BEFORE leaving application layer
2. **Offline-First**: All features work without network; sync is optional
3. **Feature-Based Organization**: Code grouped by domain, not technical layer
4. **Accessibility-First**: Every component includes a11y props from creation
5. **Type-Safe**: No `any` types; explicit return types on all functions
6. **Named Exports Only**: Improves tree-shaking and refactoring

---

## 3. Component Architecture

### 3.1 Folder Structure (Phase 2 Complete)

```
apps/mobile/src/
+-- features/                      # Feature-based modules
|   +-- auth/                      # [EXISTING] Authentication
|   |   +-- screens/
|   |   |   +-- LoginScreen.tsx
|   |   |   +-- SignUpScreen.tsx
|   |   |   +-- OnboardingScreen.tsx  # EXTEND for tutorial
|   |   +-- components/
|   |   +-- hooks/
|   |
|   +-- home/                      # [NEW] Dashboard feature
|   |   +-- screens/
|   |   |   +-- HomeScreen.tsx         # Clean time + quick actions
|   |   +-- components/
|   |   |   +-- CleanTimeTracker.tsx   # Days/hours/minutes display
|   |   |   +-- DailyCheckInCard.tsx   # AM/PM check-in buttons
|   |   |   +-- IntentionSummary.tsx   # Today's intention display
|   |   |   +-- QuickActions.tsx       # Journal, Steps, Emergency
|   |   |   +-- SyncStatusIndicator.tsx
|   |   +-- hooks/
|   |       +-- useCleanTime.ts        # Calculate clean time
|   |       +-- useMilestones.ts       # Milestone detection
|   |
|   +-- checkin/                   # [NEW] Daily check-ins
|   |   +-- screens/
|   |   |   +-- MorningIntentionScreen.tsx
|   |   |   +-- EveningPulseScreen.tsx
|   |   +-- components/
|   |   |   +-- MoodSlider.tsx         # 1-5 mood selector
|   |   |   +-- CravingSlider.tsx      # 0-10 craving intensity
|   |   |   +-- IntentionPicker.tsx    # Quick-select intentions
|   |   +-- hooks/
|   |       +-- useCheckIn.ts
|   |       +-- useStreak.ts
|   |
|   +-- journal/                   # [NEW] Encrypted journaling
|   |   +-- screens/
|   |   |   +-- JournalListScreen.tsx
|   |   |   +-- JournalEntryScreen.tsx
|   |   |   +-- JournalEditorScreen.tsx
|   |   +-- components/
|   |   |   +-- JournalCard.tsx
|   |   |   +-- JournalSearchBar.tsx
|   |   |   +-- MoodBadge.tsx
|   |   |   +-- TagSelector.tsx
|   |   |   +-- EncryptionIndicator.tsx
|   |   +-- hooks/
|   |       +-- useJournalEntries.ts   # React Query hooks
|   |       +-- useJournalSearch.ts
|   |
|   +-- steps/                     # [NEW] Step work
|   |   +-- screens/
|   |   |   +-- StepsOverviewScreen.tsx
|   |   |   +-- StepDetailScreen.tsx
|   |   |   +-- StepQuestionScreen.tsx
|   |   +-- components/
|   |   |   +-- StepCard.tsx
|   |   |   +-- StepProgress.tsx
|   |   |   +-- QuestionNavigator.tsx
|   |   +-- hooks/
|   |   |   +-- useStepWork.ts
|   |   +-- data/
|   |       +-- step1Questions.ts      # 10-15 simplified questions
|   |
|   +-- emergency/                 # [NEW] Emergency support
|   |   +-- screens/
|   |   |   +-- EmergencyScreen.tsx
|   |   |   +-- BreathingExerciseScreen.tsx
|   |   |   +-- SafetyPlanScreen.tsx
|   |   +-- components/
|   |   |   +-- CrisisLineCard.tsx
|   |   |   +-- BreathingGuide.tsx     # Visual breathing animation
|   |   |   +-- SafetyPlanEditor.tsx
|   |   +-- data/
|   |       +-- crisisResources.ts     # Static crisis line data
|   |
|   +-- achievements/              # [NEW] Gamification
|   |   +-- screens/
|   |   |   +-- AchievementsScreen.tsx
|   |   +-- components/
|   |   |   +-- AchievementBadge.tsx
|   |   |   +-- MilestoneCelebration.tsx  # Full-screen modal
|   |   |   +-- ConfettiAnimation.tsx
|   |   +-- hooks/
|   |   |   +-- useAchievements.ts
|   |   +-- data/
|   |       +-- achievementDefinitions.ts
|   |
|   +-- settings/                  # [NEW] User settings
|       +-- screens/
|       |   +-- SettingsScreen.tsx
|       |   +-- NotificationSettingsScreen.tsx
|       |   +-- CloudBackupScreen.tsx
|       |   +-- PrivacyScreen.tsx
|       +-- components/
|       |   +-- SettingsRow.tsx
|       |   +-- TimePickerRow.tsx
|       +-- hooks/
|           +-- useNotificationSettings.ts
|
+-- components/                    # Shared components
|   +-- Button.tsx                 # [EXISTING]
|   +-- Input.tsx                  # [EXISTING]
|   +-- LoadingSpinner.tsx         # [EXISTING]
|   +-- EmergencyFAB.tsx           # [NEW] Floating emergency button
|   +-- Card.tsx                   # [NEW] Base card component
|   +-- Modal.tsx                  # [NEW] Accessible modal
|   +-- Slider.tsx                 # [NEW] Accessible slider
|   +-- Toast.tsx                  # [NEW] Feedback toasts
|   +-- ErrorBoundary.tsx          # [NEW] Error boundary
|
+-- contexts/                      # React contexts
|   +-- AuthContext.tsx            # [EXISTING]
|   +-- DatabaseContext.tsx        # [EXISTING]
|   +-- SyncContext.tsx            # [EXISTING - EXTEND]
|   +-- EncryptionContext.tsx      # [NEW] Encryption state
|   +-- NotificationContext.tsx    # [NEW] Push notification state
|
+-- hooks/                         # Shared hooks
|   +-- useEncryption.ts           # [NEW] Encryption operations
|   +-- useOfflineStatus.ts        # [NEW] Network state
|
+-- lib/                           # Third-party integrations
|   +-- supabase.ts                # [EXISTING]
|   +-- notifications.ts           # [NEW] expo-notifications setup
|
+-- navigation/                    # Navigation setup
|   +-- AuthNavigator.tsx          # [EXISTING]
|   +-- MainNavigator.tsx          # [EXISTING - EXTEND]
|   +-- RootNavigator.tsx          # [EXISTING - EXTEND]
|   +-- types.ts                   # [EXISTING - EXTEND]
|   +-- EmergencyOverlay.tsx       # [NEW] Global emergency access
|
+-- services/                      # Business logic services
|   +-- syncService.ts             # [NEW] Sync queue management
|   +-- encryptionService.ts       # [NEW] Batch encryption
|   +-- notificationService.ts     # [NEW] Notification scheduling
|   +-- achievementService.ts      # [NEW] Achievement detection
|
+-- utils/                         # Utility functions
|   +-- database.ts                # [EXISTING - EXTEND]
|   +-- encryption.ts              # [EXISTING]
|   +-- logger.ts                  # [EXISTING]
|   +-- theme.ts                   # [EXISTING]
|   +-- validation.ts              # [EXISTING - EXTEND]
|   +-- dateUtils.ts               # [NEW] Day.js wrapper
|   +-- accessibilityUtils.ts      # [NEW] A11y helpers
|
+-- types/                         # TypeScript types
    +-- index.ts                   # [NEW] Centralized types
    +-- navigation.ts              # [NEW] Navigation types
    +-- database.ts                # [NEW] SQLite row types
```

### 3.2 Component Hierarchy

```
App
+-- ErrorBoundary
    +-- Providers (Auth > Database > Sync > Encryption > Notification)
        +-- RootNavigator
            +-- AuthNavigator (unauthenticated)
            |   +-- LoginScreen
            |   +-- SignUpScreen
            |
            +-- OnboardingScreen (authenticated, no profile)
            |
            +-- MainNavigator (authenticated, has profile)
                +-- EmergencyOverlay (persistent FAB)
                +-- BottomTabNavigator
                    +-- HomeTab
                    |   +-- HomeScreen
                    |   +-- MorningIntentionScreen (modal)
                    |   +-- EveningPulseScreen (modal)
                    |
                    +-- JournalTab
                    |   +-- JournalListScreen
                    |   +-- JournalEditorScreen
                    |   +-- JournalEntryScreen
                    |
                    +-- StepsTab
                    |   +-- StepsOverviewScreen
                    |   +-- StepDetailScreen
                    |   +-- StepQuestionScreen
                    |
                    +-- MoreTab
                        +-- SettingsScreen
                        +-- AchievementsScreen
                        +-- NotificationSettingsScreen
                        +-- CloudBackupScreen
                        +-- PrivacyScreen
                        +-- EmergencyScreen
                        +-- BreathingExerciseScreen
                        +-- SafetyPlanScreen
```

### 3.3 Component Design Patterns

#### Pattern 1: Feature Screen with Hooks

```typescript
// features/journal/screens/JournalListScreen.tsx
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { JournalCard } from '../components/JournalCard';
import { JournalSearchBar } from '../components/JournalSearchBar';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { theme } from '../../../utils/theme';
import type { JournalEntry } from '../../../types';

export function JournalListScreen(): React.ReactElement {
  const { entries, isLoading, error, refetch } = useJournalEntries();

  if (isLoading) {
    return <LoadingSpinner message="Loading journal..." />;
  }

  const renderItem = ({ item }: { item: JournalEntry }) => (
    <JournalCard entry={item} />
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <JournalSearchBar />
      <FlatList
        data={entries}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        accessibilityRole="list"
        accessibilityLabel="Journal entries"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: theme.spacing.md,
  },
});
```

#### Pattern 2: Accessible Component with Props Interface

```typescript
// components/Slider.tsx
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import RNSlider from '@react-native-community/slider';
import { theme } from '../utils/theme';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  label: string;
  accessibilityLabel: string;
  leftLabel?: string;
  rightLabel?: string;
  disabled?: boolean;
}

export function Slider({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step = 1,
  label,
  accessibilityLabel,
  leftLabel,
  rightLabel,
  disabled = false,
}: SliderProps): React.ReactElement {
  const handleValueChange = useCallback(
    (newValue: number) => {
      onValueChange(newValue);
      // Announce value change for screen readers
      AccessibilityInfo.announceForAccessibility(
        `${label}: ${newValue} of ${maximumValue}`
      );
    },
    [onValueChange, label, maximumValue]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.sliderRow}>
        {leftLabel && <Text style={styles.endLabel}>{leftLabel}</Text>}
        <RNSlider
          style={styles.slider}
          value={value}
          onValueChange={handleValueChange}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          step={step}
          disabled={disabled}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.primary}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="adjustable"
          accessibilityValue={{
            min: minimumValue,
            max: maximumValue,
            now: value,
          }}
        />
        {rightLabel && <Text style={styles.endLabel}>{rightLabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 44, // Minimum touch target
  },
  endLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    minWidth: 50,
    textAlign: 'center',
  },
});
```

---

## 4. Data Flow Architecture

### 4.1 Offline-First Data Flow

```
+-------------------+
|    User Action    |
+--------+----------+
         |
         v
+-------------------+
|   Encrypt Data    | <-- encryptContent() from utils/encryption.ts
+--------+----------+
         |
         v
+-------------------+
|  Write to SQLite  | <-- Primary storage (expo-sqlite)
+--------+----------+
         |
         v
+-------------------+
| Add to Sync Queue | <-- sync_queue table with pending status
+--------+----------+
         |
         | (if cloud backup enabled AND network available)
         v
+-------------------+
| Upload to Supabase| <-- Encrypted blob via REST API
+--------+----------+
         |
         v
+-------------------+
| Update sync_status| <-- 'synced' in SQLite
+-------------------+
```

### 4.2 Read Path (Decryption Flow)

```
+-------------------+
|   Read Request    |
+--------+----------+
         |
         v
+-------------------+
| Query SQLite      | <-- Local-first, always available
+--------+----------+
         |
         v
+-------------------+
| Decrypt Content   | <-- decryptContent() with key from SecureStore
+--------+----------+
         |
         v
+-------------------+
| Display in UI     |
+-------------------+
```

### 4.3 Sync Flow (Manual Trigger)

```
User taps "Sync Now"
         |
         v
+-------------------+
| Query sync_queue  | <-- WHERE sync_status = 'pending'
+--------+----------+
         |
         v
+-------------------+
| Batch encrypt     | <-- Already encrypted, just package
+--------+----------+
         |
         v
+-------------------+
| Upload to Supabase| <-- POST /rest/v1/{table}
+--------+----------+
         |
    +----+----+
    |         |
 Success    Error
    |         |
    v         v
+-------+ +-------+
|synced | |error  |
+-------+ +-------+
    |         |
    v         v
+-------------------+
| Update sync_status|
+-------------------+
```

### 4.4 Conflict Resolution (Last-Write-Wins)

```typescript
// services/syncService.ts
interface ConflictResolution {
  strategy: 'last-write-wins';
  resolution: (local: DataRecord, remote: DataRecord) => DataRecord;
}

const resolveConflict: ConflictResolution = {
  strategy: 'last-write-wins',
  resolution: (local, remote) => {
    const localTimestamp = new Date(local.updated_at).getTime();
    const remoteTimestamp = new Date(remote.updated_at).getTime();

    if (localTimestamp >= remoteTimestamp) {
      return local; // Keep local version
    } else {
      // Remote is newer - update local SQLite
      return remote;
    }
  },
};
```

---

## 5. State Management Architecture

### 5.1 State Layer Separation

| State Type | Technology | Purpose | Examples |
|------------|------------|---------|----------|
| **Server State** | React Query | Data from SQLite/Supabase | Journal entries, step work |
| **Client State** | Zustand | UI state, preferences | Theme mode, filter selections |
| **Auth State** | Context API | Session, user info | User object, loading state |
| **Database State** | Context API | SQLite connection | Database instance, ready state |
| **Sync State** | Context API | Sync status | Pending count, last sync time |
| **Encryption State** | Context API | Key availability | hasKey, keyLoading |

### 5.2 React Query Configuration

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Offline-first: don't refetch on mount if we have cached data
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours

      // Retry logic for network errors
      retry: (failureCount, error) => {
        // Don't retry encryption errors (not recoverable)
        if (error instanceof Error && error.message.includes('Encryption')) {
          return false;
        }
        return failureCount < 3;
      },

      // Network mode: always query SQLite first
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Optimistic updates for better UX
      onMutate: async (variables) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries();
      },
    },
  },
});
```

### 5.3 Zustand Store Structure

```typescript
// stores/appStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  // UI State
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Journal Filters
  journalMoodFilter: number | null;
  setJournalMoodFilter: (mood: number | null) => void;

  // Onboarding
  hasSeenTutorial: boolean;
  setHasSeenTutorial: (seen: boolean) => void;

  // Notification Preferences (non-sensitive)
  morningCheckInTime: string; // HH:mm format
  eveningCheckInTime: string;
  setCheckInTime: (type: 'morning' | 'evening', time: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      isDarkMode: false,
      journalMoodFilter: null,
      hasSeenTutorial: false,
      morningCheckInTime: '08:00',
      eveningCheckInTime: '20:00',

      // Actions
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setJournalMoodFilter: (mood) => set({ journalMoodFilter: mood }),
      setHasSeenTutorial: (seen) => set({ hasSeenTutorial: seen }),
      setCheckInTime: (type, time) =>
        set(type === 'morning'
          ? { morningCheckInTime: time }
          : { eveningCheckInTime: time }
        ),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist non-sensitive preferences
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        hasSeenTutorial: state.hasSeenTutorial,
        morningCheckInTime: state.morningCheckInTime,
        eveningCheckInTime: state.eveningCheckInTime,
      }),
    }
  )
);
```

### 5.4 Context Provider Hierarchy

```typescript
// App.tsx
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './contexts/AuthContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { SyncProvider } from './contexts/SyncContext';
import { EncryptionProvider } from './contexts/EncryptionContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RootNavigator } from './navigation/RootNavigator';
import { queryClient } from './lib/queryClient';

export function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <PaperProvider>
            <AuthProvider>
              <DatabaseProvider>
                <EncryptionProvider>
                  <SyncProvider>
                    <NotificationProvider>
                      <RootNavigator />
                    </NotificationProvider>
                  </SyncProvider>
                </EncryptionProvider>
              </DatabaseProvider>
            </AuthProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

---

## 6. Security Architecture

### 6.1 Threat Model

| Threat | Likelihood | Impact | Mitigation | Status |
|--------|-----------|--------|------------|--------|
| Supabase breach | Medium | High | Client-side encryption (zero-knowledge) | Implemented |
| Device theft (unlocked) | Medium | High | Biometric/PIN lock (Phase 3) | Deferred |
| Device theft (locked) | Medium | Low | OS-level encryption + SecureStore | Implemented |
| Man-in-the-middle | Low | High | TLS 1.3 for Supabase API | Implemented |
| SQL injection | Low | Critical | Parameterized queries (expo-sqlite) | Implemented |
| Key extraction from backup | Low | Critical | SecureStore excluded from backups | Implemented |
| Logging sensitive data | Medium | Medium | Logger utility sanitizes logs | Implemented |
| Memory dump attack | Low | Medium | Keys cleared on app background | Phase 2 |

### 6.2 Encryption Flow

```
                    USER INPUT
                         |
                         v
+------------------------------------------------+
|              APPLICATION LAYER                  |
|                                                |
|  1. User enters journal text                   |
|  2. App calls encryptContent(plaintext)        |
|                                                |
|     +------------------------------------+     |
|     |     utils/encryption.ts            |     |
|     |                                    |     |
|     |  a. Get key from SecureStore       |     |
|     |  b. Generate random 16-byte IV     |     |
|     |  c. AES-256-CBC encrypt            |     |
|     |  d. Return "iv:ciphertext"         |     |
|     +------------------------------------+     |
|                                                |
|  3. Encrypted string saved to SQLite           |
+------------------------------------------------+
                         |
                         v
+------------------------------------------------+
|                SQLITE (Local)                   |
|  +------------------------------------------+  |
|  | id: "abc123"                             |  |
|  | encrypted_body: "a1b2c3...:xyz789..."    |  |
|  | sync_status: "pending"                   |  |
|  +------------------------------------------+  |
+------------------------------------------------+
                         |
           (if sync enabled)
                         v
+------------------------------------------------+
|              SUPABASE (Cloud)                   |
|  +------------------------------------------+  |
|  | Same encrypted blob                      |  |
|  | Supabase CANNOT decrypt                  |  |
|  | RLS ensures user isolation               |  |
|  +------------------------------------------+  |
+------------------------------------------------+
```

### 6.3 Key Management

```
+-------------------+
|   First Launch    |
+--------+----------+
         |
         v
+-------------------+
| Generate 32 random| <-- expo-crypto.getRandomBytesAsync(32)
| bytes             |
+--------+----------+
         |
         v
+-------------------+
| Generate salt     | <-- expo-crypto.randomUUID()
+--------+----------+
         |
         v
+-------------------+
| PBKDF2 derivation | <-- 100,000 iterations
+--------+----------+
         |
         v
+-------------------+
| Store in          | <-- expo-secure-store
| SecureStore:      |     iOS: Keychain
|  - derived_key    |     Android: EncryptedSharedPreferences
|  - salt           |
+-------------------+
```

### 6.4 RLS Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | `auth.uid() = id` | `auth.uid() = id` | `auth.uid() = id` | - |
| `journal_entries` | `auth.uid() = user_id OR (is_shared AND uid IN shared_with)` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `daily_checkins` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `step_work` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `achievements` | `auth.uid() = user_id` | `auth.uid() = user_id` | - | - |
| `sync_queue` | N/A (local only) | N/A | N/A | N/A |

### 6.5 Security Checklist

- [x] AES-256-CBC with unique IV per record
- [x] PBKDF2 key derivation (100,000 iterations)
- [x] Keys stored ONLY in SecureStore
- [x] RLS policies on all Supabase tables
- [x] TLS 1.3 for network traffic
- [x] No third-party analytics in Phase 2
- [x] Parameterized SQL queries
- [x] Logger sanitizes production logs
- [ ] Biometric app lock (Phase 3)
- [ ] Key rotation mechanism (Phase 3)

---

## 7. Database Design

### 7.1 SQLite Schema (Phase 2 Complete)

```sql
-- utils/database.ts - Extended schema

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ====================
-- USER PROFILE (Local)
-- ====================
CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY,
  nickname TEXT,
  email TEXT,
  clean_date TEXT NOT NULL, -- ISO 8601
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ====================
-- JOURNAL ENTRIES
-- ====================
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  encrypted_title TEXT,           -- AES-256-CBC: "iv:ciphertext"
  encrypted_body TEXT NOT NULL,   -- AES-256-CBC: "iv:ciphertext"
  encrypted_mood TEXT,            -- Encrypted 1-5 integer
  encrypted_craving TEXT,         -- Encrypted 0-10 integer
  encrypted_tags TEXT,            -- Encrypted JSON array
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT DEFAULT 'pending' CHECK(sync_status IN ('pending','synced','error')),
  supabase_id TEXT,
  FOREIGN KEY (user_id) REFERENCES user_profile(id)
);

CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_sync ON journal_entries(sync_status);

-- ====================
-- DAILY CHECK-INS
-- ====================
CREATE TABLE IF NOT EXISTS daily_checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  check_in_type TEXT NOT NULL CHECK(check_in_type IN ('morning','evening')),
  check_in_date TEXT NOT NULL,    -- YYYY-MM-DD for streak calculation
  encrypted_intention TEXT,       -- Morning only
  encrypted_reflection TEXT,      -- Evening only
  encrypted_mood TEXT,            -- Encrypted 1-5
  encrypted_craving TEXT,         -- Encrypted 0-10
  created_at TEXT NOT NULL,
  sync_status TEXT DEFAULT 'pending',
  supabase_id TEXT,
  FOREIGN KEY (user_id) REFERENCES user_profile(id),
  UNIQUE(user_id, check_in_type, check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_checkin_user ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkin_date ON daily_checkins(check_in_date DESC);

-- ====================
-- STEP WORK
-- ====================
CREATE TABLE IF NOT EXISTS step_work (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  step_number INTEGER NOT NULL CHECK(step_number >= 1 AND step_number <= 12),
  question_number INTEGER NOT NULL,
  encrypted_answer TEXT,
  is_complete INTEGER DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT DEFAULT 'pending',
  supabase_id TEXT,
  FOREIGN KEY (user_id) REFERENCES user_profile(id),
  UNIQUE(user_id, step_number, question_number)
);

CREATE INDEX IF NOT EXISTS idx_step_user ON step_work(user_id);
CREATE INDEX IF NOT EXISTS idx_step_number ON step_work(step_number);

-- ====================
-- ACHIEVEMENTS
-- ====================
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_key TEXT NOT NULL,  -- 'first_24_hours', 'one_week', etc.
  achievement_type TEXT NOT NULL CHECK(achievement_type IN ('milestone','engagement','step_work')),
  earned_at TEXT NOT NULL,
  is_viewed INTEGER DEFAULT 0,    -- For "new badge" indicator
  FOREIGN KEY (user_id) REFERENCES user_profile(id),
  UNIQUE(user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_achievement_user ON achievements(user_id);

-- ====================
-- SAFETY PLAN (Emergency)
-- ====================
CREATE TABLE IF NOT EXISTS safety_plan (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  encrypted_triggers TEXT,         -- JSON array
  encrypted_contacts TEXT,         -- JSON array
  encrypted_safe_places TEXT,      -- JSON array
  encrypted_coping_strategies TEXT,-- JSON array
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user_profile(id)
);

-- ====================
-- SYNC QUEUE
-- ====================
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('insert','update','delete')),
  created_at TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  UNIQUE(table_name, record_id, operation)
);

CREATE INDEX IF NOT EXISTS idx_sync_created ON sync_queue(created_at);

-- ====================
-- APP SETTINGS (Non-sensitive)
-- ====================
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### 7.2 Supabase Schema Additions (Phase 2)

```sql
-- Add to existing supabase-schema.sql

-- ====================
-- DAILY CHECK-INS
-- ====================
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  check_in_type TEXT NOT NULL CHECK(check_in_type IN ('morning','evening')),
  check_in_date DATE NOT NULL,
  encrypted_intention TEXT,
  encrypted_reflection TEXT,
  encrypted_mood TEXT,
  encrypted_craving TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_id TEXT UNIQUE,
  UNIQUE(user_id, check_in_type, check_in_date)
);

ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own check-ins"
  ON daily_checkins FOR ALL
  USING (auth.uid() = user_id);

-- ====================
-- ACHIEVEMENTS
-- ====================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_key TEXT NOT NULL,
  achievement_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  client_id TEXT UNIQUE,
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own achievements"
  ON achievements FOR ALL
  USING (auth.uid() = user_id);

-- ====================
-- SAFETY PLAN
-- ====================
CREATE TABLE IF NOT EXISTS safety_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  encrypted_triggers TEXT,
  encrypted_contacts TEXT,
  encrypted_safe_places TEXT,
  encrypted_coping_strategies TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  client_id TEXT UNIQUE
);

ALTER TABLE safety_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own safety plan"
  ON safety_plans FOR ALL
  USING (auth.uid() = user_id);

-- ====================
-- INDEXES
-- ====================
CREATE INDEX IF NOT EXISTS idx_checkins_user ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON daily_checkins(check_in_date DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
```

### 7.3 Data Type Mapping

| TypeScript | SQLite | Supabase | Notes |
|------------|--------|----------|-------|
| `string` | TEXT | TEXT | Standard string |
| `number` | INTEGER | INTEGER | Integers only |
| `Date` | TEXT (ISO 8601) | TIMESTAMPTZ | Store as ISO string |
| `boolean` | INTEGER (0/1) | BOOLEAN | SQLite lacks boolean |
| `array` | TEXT (JSON) | TEXT[] or JSONB | Encrypted as JSON string |
| `encrypted` | TEXT (iv:cipher) | TEXT | Same format in both |
| `SyncStatus` | TEXT CHECK | TEXT CHECK | 'pending', 'synced', 'error' |

---

## 8. API Design

### 8.1 Supabase REST API Integration

```typescript
// services/syncService.ts
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type JournalRow = Database['public']['Tables']['journal_entries']['Row'];
type JournalInsert = Database['public']['Tables']['journal_entries']['Insert'];

export async function syncJournalEntry(
  localEntry: LocalJournalEntry
): Promise<SyncResult> {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .upsert({
        client_id: localEntry.id,
        user_id: localEntry.user_id,
        encrypted_title: localEntry.encrypted_title,
        encrypted_body: localEntry.encrypted_body,
        encrypted_mood: localEntry.encrypted_mood,
        encrypted_craving: localEntry.encrypted_craving,
        encrypted_tags: localEntry.encrypted_tags,
        created_at: localEntry.created_at,
        updated_at: localEntry.updated_at,
      }, {
        onConflict: 'client_id',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      supabaseId: data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### 8.2 API Error Handling

```typescript
// types/api.ts
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

// services/apiUtils.ts
export function handleSupabaseError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as { code: string; message: string };

    switch (pgError.code) {
      case '42501': // RLS violation
        return {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to access this resource',
        };
      case '23505': // Unique violation
        return {
          code: 'DUPLICATE_ENTRY',
          message: 'This entry already exists',
        };
      case 'PGRST116': // No rows returned
        return {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        };
      default:
        return {
          code: 'DATABASE_ERROR',
          message: 'A database error occurred',
          details: pgError.message,
        };
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
  };
}
```

### 8.3 Offline Queue API

```typescript
// services/syncQueue.ts
import { useDatabase } from '../contexts/DatabaseContext';

interface QueueItem {
  id: string;
  tableName: string;
  recordId: string;
  operation: 'insert' | 'update' | 'delete';
  createdAt: string;
  retryCount: number;
}

export async function addToSyncQueue(
  db: SQLiteDatabase,
  tableName: string,
  recordId: string,
  operation: 'insert' | 'update' | 'delete'
): Promise<void> {
  const id = crypto.randomUUID();

  await db.runAsync(
    `INSERT OR REPLACE INTO sync_queue
     (id, table_name, record_id, operation, created_at, retry_count)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [id, tableName, recordId, operation, new Date().toISOString()]
  );
}

export async function getPendingSync(db: SQLiteDatabase): Promise<QueueItem[]> {
  const result = await db.getAllAsync<QueueItem>(
    `SELECT * FROM sync_queue
     WHERE retry_count < 3
     ORDER BY created_at ASC
     LIMIT 50`
  );
  return result;
}

export async function markSyncComplete(
  db: SQLiteDatabase,
  queueId: string
): Promise<void> {
  await db.runAsync(
    `DELETE FROM sync_queue WHERE id = ?`,
    [queueId]
  );
}

export async function markSyncFailed(
  db: SQLiteDatabase,
  queueId: string,
  errorMessage: string
): Promise<void> {
  await db.runAsync(
    `UPDATE sync_queue
     SET retry_count = retry_count + 1, last_error = ?
     WHERE id = ?`,
    [errorMessage, queueId]
  );
}
```

---

## 9. Navigation Architecture

### 9.1 Navigation Type Definitions

```typescript
// navigation/types.ts - Extended for Phase 2
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// ====================
// ROOT STACK
// ====================
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: undefined;
  Tutorial: undefined;
  MainApp: NavigatorScreenParams<MainTabParamList>;
};

// ====================
// AUTH STACK
// ====================
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

// ====================
// MAIN TABS
// ====================
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  JournalTab: NavigatorScreenParams<JournalStackParamList>;
  StepsTab: NavigatorScreenParams<StepsStackParamList>;
  MoreTab: NavigatorScreenParams<MoreStackParamList>;
};

// ====================
// HOME STACK
// ====================
export type HomeStackParamList = {
  Home: undefined;
  MorningIntention: undefined;
  EveningPulse: undefined;
};

// ====================
// JOURNAL STACK
// ====================
export type JournalStackParamList = {
  JournalList: undefined;
  JournalEditor: { entryId?: string }; // undefined = new entry
  JournalEntry: { entryId: string };
};

// ====================
// STEPS STACK
// ====================
export type StepsStackParamList = {
  StepsOverview: undefined;
  StepDetail: { stepNumber: number };
  StepQuestion: { stepNumber: number; questionNumber: number };
};

// ====================
// MORE/SETTINGS STACK
// ====================
export type MoreStackParamList = {
  Settings: undefined;
  Achievements: undefined;
  NotificationSettings: undefined;
  CloudBackup: undefined;
  Privacy: undefined;
  Emergency: undefined;
  BreathingExercise: { exerciseType: 'box' | '4-7-8' };
  SafetyPlan: undefined;
};

// ====================
// SCREEN PROPS
// ====================
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type JournalStackScreenProps<T extends keyof JournalStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<JournalStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

// ... similar for other stacks

// ====================
// GLOBAL NAVIGATION
// ====================
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

### 9.2 Navigation Structure Diagram

```
RootNavigator (Stack)
|
+-- AuthNavigator (Stack) [!user]
|   +-- LoginScreen
|   +-- SignUpScreen
|   +-- ForgotPasswordScreen
|
+-- OnboardingScreen [user && !profile]
|
+-- TutorialScreen [user && profile && !hasSeenTutorial]
|
+-- MainNavigator (BottomTabs) [user && profile && hasSeenTutorial]
    |
    +-- EmergencyOverlay (Floating Action Button - persistent)
    |
    +-- HomeTab (Stack)
    |   +-- HomeScreen
    |   +-- MorningIntentionScreen (presentation: modal)
    |   +-- EveningPulseScreen (presentation: modal)
    |
    +-- JournalTab (Stack)
    |   +-- JournalListScreen
    |   +-- JournalEditorScreen (presentation: fullScreenModal)
    |   +-- JournalEntryScreen
    |
    +-- StepsTab (Stack)
    |   +-- StepsOverviewScreen
    |   +-- StepDetailScreen
    |   +-- StepQuestionScreen (presentation: fullScreenModal)
    |
    +-- MoreTab (Stack)
        +-- SettingsScreen
        +-- AchievementsScreen
        +-- NotificationSettingsScreen
        +-- CloudBackupScreen
        +-- PrivacyScreen
        +-- EmergencyScreen
        +-- BreathingExerciseScreen (presentation: fullScreenModal)
        +-- SafetyPlanScreen
```

### 9.3 Emergency Button Implementation

```typescript
// navigation/EmergencyOverlay.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';

export function EmergencyOverlay(): React.ReactElement {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    // @ts-expect-error - navigating to nested screen
    navigation.navigate('MoreTab', { screen: 'Emergency' });
  };

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        { bottom: insets.bottom + 70 }, // Above tab bar
      ]}
      onPress={handlePress}
      accessibilityLabel="Emergency support"
      accessibilityRole="button"
      accessibilityHint="Tap for crisis resources, breathing exercises, and safety plan"
    >
      <Text style={styles.fabText}>SOS</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
    zIndex: 999,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
```

---

## 10. Error Handling Strategy

### 10.1 Error Handling Layers

```
+--------------------------------------------+
|             PRESENTATION LAYER              |
|  - ErrorBoundary catches render errors      |
|  - Toast/Snackbar for transient errors     |
|  - Modal for critical errors (data loss)   |
+--------------------------------------------+
                    |
                    v
+--------------------------------------------+
|             APPLICATION LAYER               |
|  - try/catch in hooks and services         |
|  - Error typing with unknown + type guards |
|  - Logger for privacy-safe logging         |
+--------------------------------------------+
                    |
                    v
+--------------------------------------------+
|                DATA LAYER                   |
|  - SQLite transaction rollback             |
|  - Supabase error code mapping             |
|  - Encryption failure handling             |
+--------------------------------------------+
```

### 10.2 Error Boundary Component

```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { theme } from '../utils/theme';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error without sensitive data
    logger.error('Uncaught error in component tree', {
      name: error.name,
      message: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app encountered an unexpected error. Your data is safe.
          </Text>
          <Button
            title="Try Again"
            onPress={this.handleRetry}
            variant="primary"
            accessibilityLabel="Retry after error"
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
});
```

### 10.3 Error Handling Patterns

```typescript
// hooks/useJournalEntries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../contexts/DatabaseContext';
import { useToast } from '../hooks/useToast';
import { encryptContent, decryptContent } from '../utils/encryption';
import { logger } from '../utils/logger';

interface JournalEntry {
  id: string;
  title: string;
  body: string;
  mood: number;
  createdAt: Date;
}

export function useJournalEntries() {
  const { db, isReady } = useDatabase();
  const { showToast } = useToast();

  return useQuery({
    queryKey: ['journal-entries'],
    queryFn: async (): Promise<JournalEntry[]> => {
      if (!db || !isReady) {
        throw new Error('Database not ready');
      }

      try {
        const rows = await db.getAllAsync<EncryptedJournalRow>(
          `SELECT * FROM journal_entries ORDER BY created_at DESC`
        );

        // Decrypt each entry
        const entries = await Promise.all(
          rows.map(async (row) => {
            try {
              return {
                id: row.id,
                title: row.encrypted_title
                  ? await decryptContent(row.encrypted_title)
                  : '',
                body: await decryptContent(row.encrypted_body),
                mood: row.encrypted_mood
                  ? parseInt(await decryptContent(row.encrypted_mood), 10)
                  : null,
                createdAt: new Date(row.created_at),
              };
            } catch (decryptError) {
              // Log without exposing content
              logger.error('Failed to decrypt journal entry', {
                entryId: row.id,
                errorType: decryptError instanceof Error
                  ? decryptError.name
                  : 'Unknown',
              });

              // Return placeholder instead of crashing
              return {
                id: row.id,
                title: '[Unable to decrypt]',
                body: '[This entry could not be decrypted. Your encryption key may have changed.]',
                mood: null,
                createdAt: new Date(row.created_at),
              };
            }
          })
        );

        return entries;
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'Unknown database error';

        logger.error('Failed to fetch journal entries', { message });
        showToast({
          type: 'error',
          message: 'Could not load journal entries'
        });

        throw error; // Re-throw for React Query to handle
      }
    },
    enabled: isReady,
    staleTime: Infinity, // Offline-first: don't auto-refetch
  });
}
```

### 10.4 Encryption Error Recovery

```typescript
// utils/encryption.ts - Error handling additions

export class EncryptionError extends Error {
  constructor(
    message: string,
    public readonly code: 'KEY_NOT_FOUND' | 'DECRYPTION_FAILED' | 'INVALID_FORMAT'
  ) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export async function decryptContent(encrypted: string): Promise<string> {
  const key = await getEncryptionKey();

  if (!key) {
    throw new EncryptionError(
      'Encryption key not found. Please complete onboarding.',
      'KEY_NOT_FOUND'
    );
  }

  const parts = encrypted.split(':');
  if (parts.length !== 2) {
    throw new EncryptionError(
      'Invalid encrypted format',
      'INVALID_FORMAT'
    );
  }

  const [iv, ciphertext] = parts;

  try {
    const ivWordArray = CryptoJS.enc.Hex.parse(iv);
    const keyWordArray = CryptoJS.enc.Hex.parse(key);
    const decrypted = CryptoJS.AES.decrypt(
      ciphertext,
      keyWordArray,
      { iv: ivWordArray, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );

    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

    if (!plaintext) {
      throw new EncryptionError(
        'Decryption produced empty result',
        'DECRYPTION_FAILED'
      );
    }

    return plaintext;
  } catch (error) {
    if (error instanceof EncryptionError) {
      throw error;
    }

    throw new EncryptionError(
      'Failed to decrypt content',
      'DECRYPTION_FAILED'
    );
  }
}
```

---

## 11. Performance Optimization

### 11.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Cold start | < 2 seconds | Time to interactive |
| Journal entry open | < 500ms | Decrypt + render |
| List 100 entries | < 1 second | Query + decrypt loop |
| Encrypt 10KB | < 200ms | encryptContent() |
| Check-in save | < 300ms | Encrypt + SQLite write |
| Tab switch | < 100ms | Navigation transition |

### 11.2 Optimization Strategies

#### Strategy 1: Lazy Loading with React.lazy

```typescript
// navigation/MainNavigator.tsx
import React, { Suspense, lazy } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Lazy load heavy screens
const JournalEditorScreen = lazy(() =>
  import('../features/journal/screens/JournalEditorScreen')
    .then(module => ({ default: module.JournalEditorScreen }))
);

const BreathingExerciseScreen = lazy(() =>
  import('../features/emergency/screens/BreathingExerciseScreen')
    .then(module => ({ default: module.BreathingExerciseScreen }))
);

// Wrap in Suspense
function LazyJournalEditor(props: JournalStackScreenProps<'JournalEditor'>) {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading editor..." />}>
      <JournalEditorScreen {...props} />
    </Suspense>
  );
}
```

#### Strategy 2: FlatList Optimization

```typescript
// features/journal/screens/JournalListScreen.tsx
import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';

export function JournalListScreen(): React.ReactElement {
  const { entries } = useJournalEntries();

  // Memoize key extractor
  const keyExtractor = useCallback((item: JournalEntry) => item.id, []);

  // Memoize render item
  const renderItem = useCallback(
    ({ item }: { item: JournalEntry }) => (
      <JournalCard entry={item} />
    ),
    []
  );

  // Optimize FlatList performance
  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: 100, // Estimated item height
      offset: 100 * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      data={entries}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      // Accessibility
      accessibilityRole="list"
      accessibilityLabel="Journal entries"
    />
  );
}
```

#### Strategy 3: Batch SQLite Operations

```typescript
// services/syncService.ts
export async function batchSyncEntries(
  db: SQLiteDatabase,
  entries: LocalJournalEntry[]
): Promise<void> {
  // Use transaction for atomicity and performance
  await db.execAsync('BEGIN TRANSACTION');

  try {
    for (const entry of entries) {
      await db.runAsync(
        `UPDATE journal_entries SET sync_status = 'syncing' WHERE id = ?`,
        [entry.id]
      );
    }

    // Upload all entries
    const results = await Promise.allSettled(
      entries.map(entry => syncJournalEntry(entry))
    );

    // Update statuses based on results
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const entry = entries[i];

      if (result.status === 'fulfilled' && result.value.success) {
        await db.runAsync(
          `UPDATE journal_entries
           SET sync_status = 'synced', supabase_id = ?
           WHERE id = ?`,
          [result.value.supabaseId, entry.id]
        );
      } else {
        await db.runAsync(
          `UPDATE journal_entries SET sync_status = 'error' WHERE id = ?`,
          [entry.id]
        );
      }
    }

    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}
```

#### Strategy 4: Memoization for Expensive Computations

```typescript
// hooks/useCleanTime.ts
import { useMemo } from 'react';
import dayjs from 'dayjs';

interface CleanTime {
  days: number;
  hours: number;
  minutes: number;
  totalDays: number;
  formattedString: string;
}

export function useCleanTime(cleanDate: Date): CleanTime {
  return useMemo(() => {
    const now = dayjs();
    const start = dayjs(cleanDate);

    const totalMinutes = now.diff(start, 'minute');
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    const formattedString = days > 0
      ? `${days} day${days !== 1 ? 's' : ''}`
      : hours > 0
        ? `${hours} hour${hours !== 1 ? 's' : ''}`
        : `${minutes} minute${minutes !== 1 ? 's' : ''}`;

    return {
      days,
      hours,
      minutes,
      totalDays: days,
      formattedString,
    };
  }, [cleanDate]);
}
```

### 11.3 Bundle Size Optimization

```typescript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Tree-shake react-native-paper
      [
        'babel-plugin-optional-require',
        {
          patterns: ['react-native-paper'],
        },
      ],
      // Only import used lodash functions
      'babel-plugin-lodash',
    ],
  };
};
```

---

## 12. Cross-Cutting Concerns

### 12.1 Encryption Middleware

```typescript
// contexts/EncryptionContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  hasEncryptionKey,
  generateEncryptionKey,
  encryptContent,
  decryptContent
} from '../utils/encryption';

interface EncryptionState {
  hasKey: boolean;
  isLoading: boolean;
  error: Error | null;
}

interface EncryptionContextType extends EncryptionState {
  initializeKey: () => Promise<void>;
  encrypt: (content: string) => Promise<string>;
  decrypt: (encrypted: string) => Promise<string>;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

export function EncryptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EncryptionState>({
    hasKey: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    try {
      const exists = await hasEncryptionKey();
      setState({ hasKey: exists, isLoading: false, error: null });
    } catch (error) {
      setState({
        hasKey: false,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Key check failed'),
      });
    }
  };

  const initializeKey = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await generateEncryptionKey();
      setState({ hasKey: true, isLoading: false, error: null });
    } catch (error) {
      setState({
        hasKey: false,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Key generation failed'),
      });
      throw error;
    }
  }, []);

  const encrypt = useCallback(async (content: string): Promise<string> => {
    if (!state.hasKey) {
      throw new Error('Encryption key not initialized');
    }
    return encryptContent(content);
  }, [state.hasKey]);

  const decrypt = useCallback(async (encrypted: string): Promise<string> => {
    if (!state.hasKey) {
      throw new Error('Encryption key not initialized');
    }
    return decryptContent(encrypted);
  }, [state.hasKey]);

  const value: EncryptionContextType = {
    ...state,
    initializeKey,
    encrypt,
    decrypt,
  };

  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (context === undefined) {
    throw new Error('useEncryption must be used within EncryptionProvider');
  }
  return context;
}
```

### 12.2 Authentication Context (Extended)

```typescript
// contexts/AuthContext.tsx - Phase 2 additions
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

interface UserProfile {
  id: string;
  nickname: string | null;
  cleanDate: Date;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

// ... implementation continues
```

### 12.3 Sync Queue Management

```typescript
// services/syncService.ts
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

interface SyncManager {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  syncNow: () => Promise<SyncResult>;
  addToQueue: (item: SyncQueueItem) => Promise<void>;
}

export function createSyncManager(db: SQLiteDatabase): SyncManager {
  let isOnline = true;

  // Monitor network state
  NetInfo.addEventListener(state => {
    isOnline = state.isConnected ?? false;
  });

  return {
    get isOnline() {
      return isOnline;
    },

    get pendingCount() {
      // Query sync_queue table
      return 0; // Placeholder
    },

    get lastSyncTime() {
      return null; // Placeholder
    },

    async syncNow(): Promise<SyncResult> {
      if (!isOnline) {
        return { success: false, error: 'No network connection' };
      }

      const queue = await getPendingSync(db);

      if (queue.length === 0) {
        return { success: true, syncedCount: 0 };
      }

      let syncedCount = 0;

      for (const item of queue) {
        try {
          await syncItem(item);
          await markSyncComplete(db, item.id);
          syncedCount++;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          await markSyncFailed(db, item.id, message);
          logger.error('Sync item failed', { itemId: item.id, error: message });
        }
      }

      return { success: true, syncedCount };
    },

    async addToQueue(item: SyncQueueItem): Promise<void> {
      await addToSyncQueue(db, item.tableName, item.recordId, item.operation);
    },
  };
}
```

### 12.4 Privacy-Preserving Logger

```typescript
// utils/logger.ts - Extended for Phase 2

const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /key/i,
  /secret/i,
  /authorization/i,
  /encrypted/i,
  /journal/i,
  /content/i,
  /body/i,
  /intention/i,
  /reflection/i,
  /answer/i,
];

function sanitizeObject(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[Max depth reached]';

  if (typeof obj === 'string') {
    // Truncate long strings
    return obj.length > 100 ? `${obj.substring(0, 100)}...` : obj;
  }

  if (Array.isArray(obj)) {
    return obj.slice(0, 5).map(item => sanitizeObject(item, depth + 1));
  }

  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Redact sensitive keys
      if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
    }

    return sanitized;
  }

  return obj;
}

export const logger = {
  error: (message: string, data?: unknown): void => {
    const sanitized = data ? sanitizeObject(data) : undefined;

    if (__DEV__) {
      console.error(`[ERROR] ${message}`, sanitized);
    } else {
      // Production: Send to privacy-respecting error service
      // TODO: Integrate Sentry with PII scrubbing
    }
  },

  warn: (message: string, data?: unknown): void => {
    if (__DEV__) {
      console.warn(`[WARN] ${message}`, data ? sanitizeObject(data) : '');
    }
  },

  info: (message: string, data?: unknown): void => {
    if (__DEV__) {
      console.log(`[INFO] ${message}`, data ? sanitizeObject(data) : '');
    }
  },

  debug: (message: string, data?: unknown): void => {
    if (__DEV__) {
      console.log(`[DEBUG] ${message}`, data ? sanitizeObject(data) : '');
    }
  },
};
```

### 12.5 Error Boundaries (Feature-Level)

```typescript
// components/FeatureErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { theme } from '../utils/theme';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  featureName: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    logger.error(`Error in ${this.props.featureName}`, {
      name: error.name,
      message: error.message,
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.message}>
            {this.props.featureName} is temporarily unavailable
          </Text>
          <Button
            title="Try Again"
            onPress={this.handleRetry}
            variant="outline"
            size="small"
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
});
```

---

## 13. Implementation Sequence

### 13.1 8-Week Roadmap

```
WEEK 1: Core Infrastructure & Database
+-----------------------------------------------+
| Days 1-2: SQLite Schema Extension             |
| - Extend utils/database.ts with new tables    |
| - Create migration strategy                    |
| - Add sync_queue, achievements, safety_plan   |
|                                               |
| Days 3-4: Supabase Schema & RLS               |
| - Add new tables to Supabase                  |
| - Create RLS policies for all tables          |
| - Test policies with different user contexts  |
|                                               |
| Days 5-7: Context Providers                   |
| - EncryptionContext (key state management)    |
| - NotificationContext (push notifications)    |
| - Extend SyncContext (actual sync logic)      |
| - Integration testing                         |
+-----------------------------------------------+

WEEK 2: Home Screen & Clean Time
+-----------------------------------------------+
| Days 1-3: Home Screen Feature                 |
| - features/home/screens/HomeScreen.tsx        |
| - CleanTimeTracker component                  |
| - DailyCheckInCard component                  |
| - SyncStatusIndicator component               |
|                                               |
| Days 4-5: Clean Time Logic                    |
| - useCleanTime hook                           |
| - Real-time countdown (per-minute updates)    |
| - Milestone detection logic                   |
|                                               |
| Days 6-7: Emergency FAB                       |
| - EmergencyOverlay component                  |
| - Global navigation integration               |
| - Accessibility testing (voice activation)   |
+-----------------------------------------------+

WEEK 3: Daily Check-Ins
+-----------------------------------------------+
| Days 1-2: Morning Intention Screen            |
| - MorningIntentionScreen.tsx                  |
| - IntentionPicker component                   |
| - Quick-select + custom input                 |
|                                               |
| Days 3-4: Evening Pulse Check Screen          |
| - EveningPulseScreen.tsx                      |
| - MoodSlider component (1-5)                  |
| - CravingSlider component (0-10)              |
|                                               |
| Days 5-7: Check-In Persistence & Streaks      |
| - useCheckIn hook with encryption             |
| - useStreak hook (streak calculation)         |
| - Streak display on HomeScreen                |
| - SQLite storage with sync_queue              |
+-----------------------------------------------+

WEEK 4: Encrypted Journaling
+-----------------------------------------------+
| Days 1-2: Journal List Screen                 |
| - JournalListScreen.tsx                       |
| - JournalCard component                       |
| - FlatList optimization                       |
|                                               |
| Days 3-4: Journal Editor Screen               |
| - JournalEditorScreen.tsx                     |
| - Rich text input (basic)                     |
| - Auto-save drafts (encrypted)                |
|                                               |
| Days 5-6: Journal Features                    |
| - TagSelector component                       |
| - Mood/craving sliders in editor              |
| - EncryptionIndicator (lock icon)             |
|                                               |
| Day 7: Search & Filter                        |
| - JournalSearchBar component                  |
| - Local decrypted search                      |
| - Filter by mood/date/tags                    |
+-----------------------------------------------+

WEEK 5: Emergency Support & Step Work
+-----------------------------------------------+
| Days 1-2: Emergency Support Screen            |
| - EmergencyScreen.tsx                         |
| - CrisisLineCard (tap-to-call)                |
| - Static crisis resources                     |
|                                               |
| Days 3-4: Breathing Exercises                 |
| - BreathingExerciseScreen.tsx                 |
| - BreathingGuide animation (box, 4-7-8)       |
| - Haptic feedback integration                 |
|                                               |
| Days 5-6: Safety Plan                         |
| - SafetyPlanScreen.tsx                        |
| - SafetyPlanEditor (encrypted storage)        |
| - Offline-accessible                          |
|                                               |
| Day 7: Step 1 Overview                        |
| - StepsOverviewScreen.tsx                     |
| - StepCard component                          |
| - Steps 2-12 locked UI                        |
+-----------------------------------------------+

WEEK 6: Step Work & Notifications
+-----------------------------------------------+
| Days 1-3: Step 1 Questionnaire                |
| - StepDetailScreen.tsx                        |
| - StepQuestionScreen.tsx                      |
| - QuestionNavigator (prev/next/save)          |
| - 10-15 questions from step1Questions.ts      |
|                                               |
| Days 4-5: Push Notifications                  |
| - expo-notifications setup                    |
| - NotificationSettingsScreen.tsx              |
| - Morning/evening reminders                   |
| - Milestone notifications                     |
|                                               |
| Days 6-7: Notification Logic                  |
| - notificationService.ts                      |
| - Schedule check-in reminders                 |
| - Streak protection alerts                    |
| - Test on real devices                        |
+-----------------------------------------------+

WEEK 7: Achievements & Sync
+-----------------------------------------------+
| Days 1-2: Achievements System                 |
| - achievementDefinitions.ts                   |
| - achievementService.ts (detection)           |
| - AchievementsScreen.tsx                      |
|                                               |
| Days 3-4: Milestone Celebrations              |
| - MilestoneCelebration modal                  |
| - ConfettiAnimation component                 |
| - Achievement badges UI                       |
|                                               |
| Days 5-7: Cloud Sync Implementation           |
| - CloudBackupScreen.tsx                       |
| - syncService.ts (full implementation)        |
| - Sync queue processing                       |
| - Conflict resolution (last-write-wins)       |
| - Sync status UI                              |
+-----------------------------------------------+

WEEK 8: Testing & Polish
+-----------------------------------------------+
| Days 1-2: Unit Tests                          |
| - Encryption/decryption tests                 |
| - Hook tests (useCleanTime, useStreak)        |
| - Service tests (sync, achievements)          |
|                                               |
| Days 3-4: Integration Tests                   |
| - Full sync flow test                         |
| - RLS policy verification                     |
| - Offline mode testing                        |
|                                               |
| Days 5-6: Accessibility Audit                 |
| - Screen reader testing (TalkBack/VoiceOver) |
| - Touch target verification (44x44)           |
| - Color contrast check (7:1 ratio)            |
|                                               |
| Day 7: Performance & Bug Fixes                |
| - Cold start optimization                     |
| - Memory profiling                            |
| - Critical bug fixes                          |
+-----------------------------------------------+
```

### 13.2 Dependency Graph

```
Week 1 (Infrastructure)
|
+-- Week 2 (Home/Clean Time)
|   |
|   +-- Week 3 (Check-Ins)
|       |
|       +-- Week 5-6 (Emergency + Notifications)
|
+-- Week 4 (Journaling) -----> Week 7 (Achievements + Sync)
|
+-- Week 5 (Step Work) -------> Week 7 (Achievements + Sync)
                                |
                                +-- Week 8 (Testing)
```

### 13.3 Critical Path Dependencies

| Task | Depends On | Blocks |
|------|-----------|--------|
| EncryptionContext | utils/encryption.ts | All features using encryption |
| SyncContext (extended) | SQLite schema, EncryptionContext | Cloud backup feature |
| useCleanTime hook | user_profile table | HomeScreen, Achievements |
| useCheckIn hook | EncryptionContext, daily_checkins table | Streaks, Notifications |
| useJournalEntries hook | EncryptionContext, journal_entries table | Journal list/editor |
| useStepWork hook | EncryptionContext, step_work table | Step screens |
| NotificationContext | expo-notifications | All reminder features |
| achievementService | All data hooks | Achievement triggers |
| syncService | All tables, RLS policies | Cloud backup |

---

## 14. Architectural Decision Records

### ADR-001: React 19.1 Despite Bleeding Edge Status

**Status:** Accepted

**Context:**
- Expo SDK 54 supports React 19.1
- React 19 is the first major release in 3 years
- Some community packages may have compatibility issues

**Decision:**
Use React 19.1 as bundled with Expo SDK 54.

**Rationale:**
1. **Expo Compatibility**: Expo SDK 54 is tested with React 19.1
2. **Concurrent Features**: React 19 concurrent rendering improves perceived performance
3. **Server Components Ready**: Future-proofs for potential web companion
4. **Hooks Improvements**: useId, useTransition improve UX

**Consequences:**
- Monitor crash rates during beta testing
- Have rollback plan: pin to React 18 if crash rate > 2%
- Avoid experimental features not yet stable

**Mitigation:**
- Comprehensive error boundaries at feature level
- EAS Update for rapid hotfixes
- Beta testing with real devices before production

---

### ADR-002: Client-Side Encryption vs SQLCipher

**Status:** Accepted

**Context:**
- SQLCipher encrypts entire database at rest
- Our current approach encrypts content before storage
- Both protect data, but at different layers

**Decision:**
Continue with client-side AES-256-CBC encryption; defer SQLCipher to Phase 3.

**Rationale:**

| Factor | Client-Side Encryption | SQLCipher |
|--------|----------------------|-----------|
| Complexity | Lower (pure JS) | Higher (native module) |
| Bundle size | No change | +500KB binary |
| Flexibility | Encrypt specific fields | All-or-nothing |
| Cloud sync | Encrypted blobs transfer easily | Must re-encrypt for cloud |
| Key management | SecureStore | Also SecureStore |
| Performance | Per-field overhead | Single DB overhead |

1. **Zero-Knowledge Cloud**: Client-side encryption ensures Supabase sees only encrypted blobs
2. **Selective Encryption**: Only sensitive fields encrypted (not IDs, timestamps)
3. **Simpler Build**: No native module complexity
4. **Proven Implementation**: encryption.ts already working in Phase 1

**Consequences:**
- Metadata (timestamps, IDs) visible in SQLite file if device compromised
- Slightly higher encryption overhead per field
- Phase 3 can add SQLCipher as defense-in-depth layer

---

### ADR-003: React Navigation vs Expo Router

**Status:** Accepted

**Context:**
- Expo Router is file-based routing (like Next.js)
- React Navigation is established library with 7.x major version
- Both are production-ready

**Decision:**
Continue with React Navigation (already in Phase 1).

**Rationale:**

| Factor | React Navigation | Expo Router |
|--------|-----------------|-------------|
| Maturity | 7+ years, v7.x | 1+ year, v3.x |
| Team familiarity | Already in codebase | Would require rewrite |
| Deep linking | Explicit configuration | File-based automatic |
| Type safety | Full TypeScript support | Also TypeScript |
| Documentation | Extensive | Growing |
| Migration cost | None | Significant |

1. **No Migration Cost**: React Navigation already implemented in Phase 1
2. **Explicit Routing**: Team prefers explicit route definitions over file conventions
3. **Stable API**: v7.x is mature with predictable behavior
4. **Bottom Tabs**: `@react-navigation/bottom-tabs` is battle-tested

**Consequences:**
- Manual deep link configuration if needed in Phase 3
- No automatic route generation from file structure
- Must maintain navigation/types.ts manually

---

### ADR-004: Last-Write-Wins Conflict Resolution

**Status:** Accepted

**Context:**
- Users may have multiple devices (phone + tablet)
- Edits could happen offline on both devices
- Conflict resolution needed when syncing

**Decision:**
Implement last-write-wins (LWW) for Phase 2; defer CRDTs to Phase 3.

**Rationale:**

| Strategy | Complexity | UX | Data Safety |
|----------|-----------|-----|-------------|
| Last-Write-Wins | Low | Simple | May lose older edits |
| Manual Resolution | Medium | Disruptive | User decides |
| CRDTs | High | Seamless | No data loss |

1. **Simplicity**: LWW is simplest to implement correctly
2. **Low Multi-Device Usage**: Most users have one primary device
3. **Research Phase**: Can analyze conflict frequency before Phase 3
4. **User Control**: Manual sync means user initiates potential conflicts

**Consequences:**
- Rare edge case: Offline edit on device A, then offline edit on device B, sync device B first, sync device A = device A "wins", device B changes lost
- Mitigation: Log conflicts for Phase 3 analysis
- Future: Implement CRDTs if conflict rate > 1%

---

### ADR-005: No Biometric Authentication in Phase 2

**Status:** Accepted

**Context:**
- Biometric (Face ID/Touch ID) adds security for app access
- Emergency support features need fast access during cravings
- Some users may not have biometric hardware

**Decision:**
Defer biometric authentication to Phase 3.

**Rationale:**

1. **Emergency Access Priority**: Users in crisis need <2 second access
2. **Device Security Sufficient**: Modern iOS/Android require unlock to open any app
3. **SecureStore Protection**: Encryption keys already protected by OS-level biometrics
4. **User Research Needed**: Unknown if target users want additional friction

**Consequences:**
- If device unlocked and unattended, app data accessible
- Mitigation: Phase 3 adds optional biometric lock
- Future: Quick escape feature (shake to exit) provides alternative privacy

---

### ADR-006: Zustand for Client State vs Additional Contexts

**Status:** Accepted

**Context:**
- React Context API already used for Auth, Database, Sync
- Growing list of UI state (filters, preferences, dark mode)
- Contexts cause re-renders on any state change

**Decision:**
Use Zustand for client-only UI state; keep Contexts for async/service state.

**Rationale:**

| State Type | Solution | Why |
|------------|----------|-----|
| Auth session | Context | Async, affects navigation |
| DB connection | Context | Async initialization |
| Sync status | Context | Async operations |
| UI preferences | Zustand | Sync, local-only, granular updates |
| Filter selections | Zustand | Component-local, no async |

1. **Selective Re-renders**: Zustand subscribers only re-render on their slice
2. **Persistence Built-in**: zustand/middleware handles AsyncStorage
3. **Simpler API**: No Provider wrapper needed for Zustand stores
4. **Clear Separation**: Contexts = async/services, Zustand = sync UI state

**Consequences:**
- Two state management patterns in codebase
- Clear documentation needed on when to use which
- Migration path: Could move more to Zustand in Phase 3 if beneficial

---

## 15. Quality Gates

### 15.1 Pre-Implementation Checklist

Before starting each feature:

- [ ] Types defined in `types/` directory
- [ ] SQLite schema migration ready
- [ ] Supabase RLS policy tested
- [ ] Accessibility requirements documented
- [ ] Error handling approach planned

### 15.2 Code Review Checklist

Every PR must verify:

**Security:**
- [ ] No sensitive data logged (use logger utility)
- [ ] Encryption used for all sensitive fields
- [ ] No keys/tokens in code (only SecureStore)
- [ ] Parameterized SQL queries

**TypeScript:**
- [ ] No `any` types
- [ ] Explicit return types on functions
- [ ] Props interfaces for components
- [ ] Named exports only

**Accessibility:**
- [ ] `accessibilityLabel` on interactive elements
- [ ] `accessibilityRole` defined
- [ ] Touch targets >= 44x44 dp
- [ ] Screen reader tested

**Performance:**
- [ ] useCallback for function props
- [ ] useMemo for expensive computations
- [ ] FlatList for long lists
- [ ] No unnecessary re-renders

**Error Handling:**
- [ ] try/catch with proper typing
- [ ] Loading states in UI
- [ ] Error states with recovery actions
- [ ] Graceful degradation

### 15.3 Feature Completion Checklist

Before marking feature complete:

- [ ] All acceptance criteria met (from PRD)
- [ ] Unit tests passing
- [ ] Manual testing on iOS and Android
- [ ] Accessibility audit passed
- [ ] Offline mode verified
- [ ] Encryption verified (check encrypted values in SQLite)
- [ ] Sync verified (if applicable)
- [ ] Performance targets met

### 15.4 Release Readiness Checklist

Before alpha/beta release:

- [ ] All Phase 2 features implemented
- [ ] Crash rate < 1% in testing
- [ ] Cold start < 2 seconds
- [ ] All critical bugs fixed
- [ ] Accessibility audit complete
- [ ] Privacy policy updated
- [ ] EAS Update configured
- [ ] TestFlight/Internal Testing configured

---

## Appendix A: File Reference Quick Lookup

| Purpose | File Path |
|---------|-----------|
| Encryption utilities | `apps/mobile/src/utils/encryption.ts` |
| Database initialization | `apps/mobile/src/utils/database.ts` |
| Logger utility | `apps/mobile/src/utils/logger.ts` |
| Theme tokens | `apps/mobile/src/utils/theme.ts` |
| Validation helpers | `apps/mobile/src/utils/validation.ts` |
| Supabase client | `apps/mobile/src/lib/supabase.ts` |
| Auth context | `apps/mobile/src/contexts/AuthContext.tsx` |
| Database context | `apps/mobile/src/contexts/DatabaseContext.tsx` |
| Sync context | `apps/mobile/src/contexts/SyncContext.tsx` |
| Navigation types | `apps/mobile/src/navigation/types.ts` |
| Root navigator | `apps/mobile/src/navigation/RootNavigator.tsx` |
| Main navigator | `apps/mobile/src/navigation/MainNavigator.tsx` |
| Shared types | `packages/shared/src/types/index.ts` |
| Supabase schema | `supabase-schema.sql` |
| Project context | `.bmad/project-context.md` |
| PRD | `_bmad-output/planning-artifacts/prd.md` |

---

## Appendix B: Critical Rules Summary

**NEVER:**
- Store unencrypted sensitive data in SQLite/Supabase
- Use AsyncStorage for tokens/keys (use SecureStore)
- Use default exports (named exports only)
- Log sensitive data (use logger utility)
- Skip accessibility props (WCAG AAA required)
- Use .then() chains (use async/await)
- Commit with failing TypeScript checks
- Deploy with `any` types in code

**ALWAYS:**
- Encrypt before storage: `encryptContent(data)`
- Use logger: `logger.error(message, error)`
- Include a11y props: `accessibilityLabel`, `accessibilityRole`
- Handle errors: try/catch with proper typing
- Use FlatList for lists (not ScrollView with map)
- Test offline mode for every feature
- Verify RLS policies before deploying Supabase changes

---

**Document Complete**

*Last Updated: 2025-12-31*
*Architecture Version: 1.0*
*Phase: 2 (Journaling & Step Work Features)*
