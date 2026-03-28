/**
 * Store Index
 * Central export for all Zustand stores
 */

export { useReadingStore } from './readingStore';
export { useRegularMeetingStore } from './regularMeetingStore';

// Sobriety tracking store — local UI cache only.
// Sync handled by profile update in AuthContext — store is local cache only.
// The sobriety_start_date is persisted to Supabase via the `profiles` table
// (see supabase/migrations/) and to local SQLite via the `user_profile` table.
// This store holds the in-memory copy for fast UI access; it is NOT persisted
// to AsyncStorage/MMKV. On app launch, the value should be hydrated from the
// local database by the component or hook that consumes it.
import { create } from 'zustand';

interface SobrietyStore {
  sobrietyDate: Date | null;
  currentDays: number;
  setSobrietyDate: (date: Date) => void;
  resetSobriety: () => void;
}

export const useSobrietyStore = create<SobrietyStore>((set) => ({
  sobrietyDate: null,
  currentDays: 0,
  setSobrietyDate: (date: Date): void => {
    set({ sobrietyDate: date });
  },
  resetSobriety: (): void => {
    set({ sobrietyDate: null, currentDays: 0 });
  },
}));
