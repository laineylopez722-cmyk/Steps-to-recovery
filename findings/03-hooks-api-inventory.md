# Hooks, API, and Runtime Inventory

## Global Hooks (`apps/mobile/src/hooks`)

- `useAchievements.ts`
- `useAppLifecycle.ts`
- `useAppState.ts`
- `useAudioRecorder.ts`
- `useAuth.ts`
- `useAutoSave.ts`
- `useBreathingExercise.ts`
- `useCheckin.ts`
- `useContacts.ts`
- `useCravingTracker.ts`
- `useDebouncedValue.ts`
- `useEmergencyAccess.ts`
- `useFormValidation.ts`
- `useHaptics.ts`
- `useJitai.ts`
- `useJournal.ts`
- `useKeyboard.ts`
- `useKeyboardOffset.ts`
- `useMeetingReminder.ts`
- `useMeetings.ts`
- `useNotifications.ts`
- `useOfflineMutation.ts`
- `usePhoneCalls.ts`
- `usePinEntry.ts`
- `useReading.ts`
- `useReadingDatabase.ts`
- `useRegularMeetings.ts`
- `useRiskDetection.ts`
- `useSecureValue.ts`
- `useSobriety.ts`
- `useSponsorInfo.ts`

## Feature Hooks (`apps/mobile/src/features/**/hooks`)

- `features/emergency/hooks/useSafeDialProtection.ts`
- `features/home/hooks/useCheckIns.ts`
- `features/home/hooks/useCleanTime.ts`
- `features/journal/hooks/useJournalEntries.ts`
- `features/meetings/hooks/use90In90Progress.ts`
- `features/meetings/hooks/useAchievements.ts`
- `features/meetings/hooks/useFavoriteMeetings.ts`
- `features/meetings/hooks/useMeetingCheckIns.ts`
- `features/meetings/hooks/useMeetingSearch.ts`
- `features/meetings/hooks/useNearbyMeetings.ts`
- `features/meetings/hooks/useUserLocation.ts`
- `features/progress/hooks/useRecoveryAnalytics.ts`
- `features/sponsor/hooks/useSponsorConnections.ts`
- `features/sponsor/hooks/useSponsorSharedEntries.ts`
- `features/sponsor/hooks/useSponsorships.ts`
- `features/steps/hooks/useStepWork.ts`

## Core Contexts

- `apps/mobile/src/contexts/AuthContext.tsx`
- `apps/mobile/src/contexts/DatabaseContext.tsx`
- `apps/mobile/src/contexts/NotificationContext.tsx`
- `apps/mobile/src/contexts/SyncContext.tsx`

## Core Services

- `apps/mobile/src/services/backgroundSync.ts`
- `apps/mobile/src/services/crisisCheckpointService.ts`
- `apps/mobile/src/services/meetingCheckInService.ts`
- `apps/mobile/src/services/meetingReflectionService.ts`
- `apps/mobile/src/services/notificationService.ts`
- `apps/mobile/src/services/riskDetectionService.ts`
- `apps/mobile/src/services/safeDialService.ts`
- `apps/mobile/src/services/sponsorShareService.ts`
- `apps/mobile/src/services/syncService.ts`

## Supabase Tables Referenced in App Code

- `achievements`
- `close_calls`
- `crisis_checkpoints`
- `daily_checkins`
- `favorite_meetings`
- `journal_entries`
- `meeting_checkins`
- `meeting_reflections`
- `profiles`
- `reading_reflections`
- `risky_contacts`
- `sponsor_connections`
- `sponsor_notifications`
- `sponsor_shared_entries`
- `sponsorships`
- `step_work`
- `weekly_reports`

## RPC Functions Referenced

- `get_90_in_90_progress`
- `get_close_call_stats`
- `get_user_meeting_streak`
- `get_user_total_meetings`

## Local Offline Tables (SQLite/IndexedDB schema)

From `apps/mobile/src/utils/database.ts`:

- `user_profile`
- `journal_entries`
- `daily_checkins`
- `step_work`
- `achievements`
- `sync_queue`
- `daily_readings`
- `reading_reflections`
- `schema_migrations`
- `cached_meetings`
- `favorite_meetings`
- `meeting_search_cache`
- `sponsor_connections`
- `sponsor_shared_entries`
- `weekly_reports`

## Code-vs-Schema Mismatch Summary

Resolved table mismatches from prior pass:

- `daily_check_ins` -> fixed
- `shared_journal_entries` -> fixed
- `sponsor_relationships` -> fixed

Remaining model gap:

- Sponsor quick-call/text UX expects `phone`, but current sponsor lookup path does not have a guaranteed Supabase phone source (`profiles` currently queried with `id, email` only).
