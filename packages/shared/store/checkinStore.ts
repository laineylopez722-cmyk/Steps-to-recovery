/**
 * Check-in Store
 * Manages daily check-ins and mood/craving tracking
 */

import { create } from 'zustand';
import type { DailyCheckin } from '../types';
import { createDailyCheckin, getTodayCheckin, getCheckinHistory } from '../db/models';

interface CheckinStore {
  todayCheckin: DailyCheckin | null;
  history: DailyCheckin[];
  isLoading: boolean;
  error: string | null;

  // Computed values
  checkinStreak: number;
  averageMood: number;
  averageCraving: number;

  // Actions
  loadTodayCheckin: () => Promise<void>;
  loadHistory: (days?: number) => Promise<void>;
  submitCheckin: (mood: number, cravingLevel: number, gratitude?: string) => Promise<void>;
  calculateStats: () => void;
}

export const useCheckinStore = create<CheckinStore>((set, get) => ({
  todayCheckin: null,
  history: [],
  isLoading: false,
  error: null,
  checkinStreak: 0,
  averageMood: 0,
  averageCraving: 0,

  loadTodayCheckin: async () => {
    set({ isLoading: true, error: null });
    try {
      const checkin = await getTodayCheckin();
      set({ todayCheckin: checkin, isLoading: false });
    } catch (error) {
      set({ error: "Failed to load today's check-in", isLoading: false });
    }
  },

  loadHistory: async (days = 30) => {
    set({ isLoading: true, error: null });
    try {
      const history = await getCheckinHistory(days);
      set({ history, isLoading: false });
      get().calculateStats();
    } catch (error) {
      set({ error: 'Failed to load check-in history', isLoading: false });
    }
  },

  submitCheckin: async (mood: number, cravingLevel: number, gratitude?: string) => {
    set({ isLoading: true, error: null });
    try {
      const checkin = await createDailyCheckin(mood, cravingLevel, gratitude);
      set({ todayCheckin: checkin, isLoading: false });

      // Refresh history to update stats
      await get().loadHistory();
    } catch (error) {
      set({ error: 'Failed to submit check-in', isLoading: false });
    }
  },

  calculateStats: () => {
    const { history } = get();

    if (history.length === 0) {
      set({ checkinStreak: 0, averageMood: 0, averageCraving: 0 });
      return;
    }

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < history.length; i++) {
      const checkinDate = new Date(history[i].date);
      checkinDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (checkinDate.getTime() === expectedDate.getTime() && history[i].isCheckedIn) {
        streak++;
      } else {
        break;
      }
    }

    // Calculate averages
    const checkedInDays = history.filter((c) => c.isCheckedIn);
    const avgMood =
      checkedInDays.length > 0
        ? checkedInDays.reduce((sum, c) => sum + c.mood, 0) / checkedInDays.length
        : 0;
    const avgCraving =
      checkedInDays.length > 0
        ? checkedInDays.reduce((sum, c) => sum + c.cravingLevel, 0) / checkedInDays.length
        : 0;

    set({
      checkinStreak: streak,
      averageMood: Math.round(avgMood * 10) / 10,
      averageCraving: Math.round(avgCraving * 10) / 10,
    });
  },
}));
