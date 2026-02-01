/**
 * Reading Store
 * Manages daily readings and reflections
 */

import { create } from 'zustand';
import type { DailyReading, DailyReadingReflection } from '../types';
import { getTodayReading, getReadingByDate } from '../constants/dailyReadings';
import {
  createDailyReadingReflection,
  getDailyReadingReflection,
  getTodayReadingReflection,
  getReadingReflections,
  getReadingStreak,
  decryptReflection,
} from '../db/models';

interface ReadingState {
  todayReading: DailyReading | null;
  todayReflection: DailyReadingReflection | null;
  reflections: DailyReadingReflection[];
  readingStreak: number;
  isLoading: boolean;
  error: string | null;
}

interface ReadingActions {
  loadTodayReading: () => Promise<void>;
  loadReflections: (limit?: number) => Promise<void>;
  saveReflection: (reflection: string) => Promise<DailyReadingReflection>;
  getReadingForDate: (date: Date) => DailyReading | null;
  getReflectionForDate: (date: Date) => Promise<DailyReadingReflection | null>;
  decryptReflectionContent: (reflection: DailyReadingReflection) => Promise<string>;
  hasReflectedToday: () => boolean;
}

export const useReadingStore = create<ReadingState & ReadingActions>((set, get) => ({
  todayReading: null,
  todayReflection: null,
  reflections: [],
  readingStreak: 0,
  isLoading: false,
  error: null,

  loadTodayReading: async () => {
    set({ isLoading: true, error: null });
    try {
      // Get today's reading from constants
      const todayReading = getTodayReading();

      // Get today's reflection if exists
      const todayReflection = await getTodayReadingReflection();

      // Get reading streak
      const readingStreak = await getReadingStreak();

      set({
        todayReading,
        todayReflection,
        readingStreak,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to load today's reading:", error);
      set({ error: 'Failed to load reading', isLoading: false });
    }
  },

  loadReflections: async (limit = 30) => {
    set({ isLoading: true, error: null });
    try {
      const reflections = await getReadingReflections(limit);
      const readingStreak = await getReadingStreak();

      set({ reflections, readingStreak, isLoading: false });
    } catch (error) {
      console.error('Failed to load reflections:', error);
      set({ error: 'Failed to load reflections', isLoading: false });
    }
  },

  saveReflection: async (reflection) => {
    const { todayReading } = get();

    if (!todayReading) {
      throw new Error('No reading loaded for today');
    }

    try {
      const savedReflection = await createDailyReadingReflection(todayReading.date, reflection);

      // Update streak
      const readingStreak = await getReadingStreak();

      set((state) => ({
        todayReflection: savedReflection,
        reflections: [
          savedReflection,
          ...state.reflections.filter((r) => r.readingDate !== savedReflection.readingDate),
        ],
        readingStreak,
      }));

      return savedReflection;
    } catch (error) {
      console.error('Failed to save reflection:', error);
      throw error;
    }
  },

  getReadingForDate: (date) => {
    return getReadingByDate(date);
  },

  getReflectionForDate: async (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${month}-${day}`;

    try {
      return await getDailyReadingReflection(dateKey);
    } catch (error) {
      console.error('Failed to get reflection for date:', error);
      return null;
    }
  },

  decryptReflectionContent: async (reflection) => {
    try {
      return await decryptReflection(reflection);
    } catch (error) {
      console.error('Failed to decrypt reflection:', error);
      return '';
    }
  },

  hasReflectedToday: () => {
    const { todayReflection } = get();
    return todayReflection !== null;
  },
}));
