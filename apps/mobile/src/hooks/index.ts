/**
 * Custom Hooks Exports
 *
 * Central export point for all custom React hooks used throughout the app.
 *
 * **Available Hooks**:
 * - Authentication: `useAuth`
 * - Sobriety tracking: `useSobriety`
 * - Journal: `useJournal`
 * - Check-ins: `useCheckin`
 * - Meetings: `useMeetings`, `useRegularMeetings`
 * - Contacts: `useContacts`, `usePhoneCalls`
 * - Notifications: `useNotifications`
 * - Achievements: `useAchievements`
 * - Reading: `useReading`
 * - JITAI: `useJitai`
 * - Audio: `useVoiceRecorder`
 * - PIN Entry: `usePinEntry`
 * - Performance: `usePerformanceMonitor`
 *
 * @module hooks
 */

export { useAuth } from './useAuth';
export { useSobriety } from './useSobriety';
export { useJournal } from './useJournal';
export { useCheckin } from './useCheckin';
export { useNotifications } from './useNotifications';
export { useMeetings } from './useMeetings';
export { useVoiceRecorder } from './useAudioRecorder';
export { usePinEntry } from './usePinEntry';

// V2 Hooks
export { useContacts } from './useContacts';
export { usePhoneCalls } from './usePhoneCalls';
export { useReading } from './useReading';
export { useRegularMeetings } from './useRegularMeetings';

// Phase 4 Hooks
export { useAchievements } from './useAchievements';

// JITAI Hook
export { useJitai } from './useJitai';

// Offline-first hooks
export {
  useOfflineMutation,
  usePendingMutationCount,
  useHasPendingMutations,
  useSyncPendingMutations,
} from './useOfflineMutation';

// App state hooks
export {
  useAppState,
  useOnForeground,
  useOnBackground,
  useBackgroundTimeout,
  useRefreshOnForeground,
} from './useAppState';

// Keyboard hooks
export {
  useKeyboard,
  useKeyboardHeight,
  useIsKeyboardVisible,
  useDismissKeyboardOnTap,
  useFocusedInput,
  useKeyboardAwareScroll,
  useKeyboardAnimation,
  useAvoidKeyboard,
  useInputFocusNavigation,
} from './useKeyboard';

// Performance monitoring hooks
export {
  usePerformanceMonitor,
  useInteractionTiming,
  useLongTaskDetection,
  useListPerformance,
} from './usePerformanceMonitor';
