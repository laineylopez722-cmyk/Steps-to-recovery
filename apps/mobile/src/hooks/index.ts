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
