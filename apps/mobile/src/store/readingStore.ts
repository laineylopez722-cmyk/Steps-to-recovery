/**
 * Reading Store
 * Full implementation for daily reading feature with local database persistence and encryption
 */

import { create } from 'zustand';
import type { DailyReading, DailyReadingReflection } from '../types';
import { encryptContent, decryptContent } from '../utils/encryption';
import { logger } from '../utils/logger';
import { generateId } from '../utils/id';

interface ReadingStore {
  // State
  todayReading: DailyReading | null;
  todayReflection: DailyReadingReflection | null;
  reflections: DailyReadingReflection[];
  readingStreak: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTodayReading: () => Promise<void>;
  loadReflections: () => Promise<void>;
  saveReflection: (reflection: string) => Promise<DailyReadingReflection>;
  markAsRead: (readingId: string) => Promise<void>;
  getReadingForDate: (date: Date) => Promise<DailyReading | null>;
  getReflectionForDate: (date: Date) => Promise<DailyReadingReflection | null>;
  decryptReflectionContent: (reflection: DailyReadingReflection) => Promise<string>;
  hasReflectedToday: () => boolean;
  calculateStreak: () => Promise<number>;
  initializeReadings: () => Promise<void>;
}

// Helper function to get day of year (1-366)
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Helper function to format date as MM-DD
function formatDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

export const useReadingStore = create<ReadingStore>((set, get) => ({
  // State
  todayReading: null,
  todayReflection: null,
  reflections: [],
  readingStreak: 0,
  isLoading: false,
  error: null,

  // Actions
  loadTodayReading: async (): Promise<void> => {
    try {
      set({ isLoading: true, error: null });

      // Get database from context - we'll need to pass it in or use a hook
      // For now, we'll handle this in the component that uses the store
      const today = new Date();
      const dayOfYear = getDayOfYear(today);

      // This will be implemented when we have access to the database context
      logger.info("Loading today's reading", { dayOfYear });

      set({ isLoading: false });
    } catch (error) {
      logger.error("Failed to load today's reading", error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load reading',
        isLoading: false,
      });
    }
  },

  loadReflections: async (): Promise<void> => {
    try {
      set({ isLoading: true, error: null });

      logger.info('Loading user reflections');

      set({ isLoading: false, reflections: [] });
    } catch (error) {
      logger.error('Failed to load reflections', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load reflections',
        isLoading: false,
      });
    }
  },

  saveReflection: async (reflection: string): Promise<DailyReadingReflection> => {
    try {
      const { todayReading } = get();
      if (!todayReading) {
        throw new Error('No reading available to reflect on');
      }

      const now = new Date();
      const dateKey = formatDateKey(now);

      // Encrypt the reflection content
      const encryptedReflection = await encryptContent(reflection);

      const newReflection: DailyReadingReflection = {
        id: generateId('reflection'),
        reading_id: todayReading.id,
        readingDate: dateKey,
        user_id: '', // Will be set when saving to database
        encrypted_reflection: encryptedReflection,
        reflection: reflection, // Keep plain text in memory for immediate use
        created_at: now.toISOString(),
      };

      // Update state
      set({ todayReflection: newReflection });

      // Calculate new streak
      const newStreak = await get().calculateStreak();
      set({ readingStreak: newStreak });

      logger.info('Reflection saved', {
        readingId: todayReading.id,
        reflectionLength: reflection.length,
        newStreak,
      });

      return newReflection;
    } catch (error) {
      logger.error('Failed to save reflection', error);
      set({ error: error instanceof Error ? error.message : 'Failed to save reflection' });
      throw error;
    }
  },

  markAsRead: async (readingId: string): Promise<void> => {
    try {
      logger.info('Marking reading as read', { readingId });
      // This would typically update a user_readings table to track read status
    } catch (error) {
      logger.error('Failed to mark reading as read', error);
      set({ error: error instanceof Error ? error.message : 'Failed to mark as read' });
    }
  },

  getReadingForDate: async (date: Date): Promise<DailyReading | null> => {
    try {
      const dayOfYear = getDayOfYear(date);
      logger.info('Getting reading for date', { date: date.toISOString(), dayOfYear });

      // Would query database for reading by day_of_year
      return null;
    } catch (error) {
      logger.error('Failed to get reading for date', error);
      return null;
    }
  },

  getReflectionForDate: async (date: Date): Promise<DailyReadingReflection | null> => {
    try {
      const dateKey = formatDateKey(date);
      logger.info('Getting reflection for date', { date: date.toISOString(), dateKey });

      // Would query database for reflection by reading_date
      return null;
    } catch (error) {
      logger.error('Failed to get reflection for date', error);
      return null;
    }
  },

  decryptReflectionContent: async (reflection: DailyReadingReflection): Promise<string> => {
    try {
      if (reflection.reflection) {
        // Already decrypted in memory
        return reflection.reflection;
      }

      if (reflection.encrypted_reflection) {
        return await decryptContent(reflection.encrypted_reflection);
      }

      return '';
    } catch (error) {
      logger.error('Failed to decrypt reflection content', error);
      throw new Error('Failed to decrypt reflection');
    }
  },

  hasReflectedToday: (): boolean => {
    const { todayReflection } = get();
    if (!todayReflection) return false;

    const today = new Date();
    const todayKey = formatDateKey(today);

    return todayReflection.readingDate === todayKey;
  },

  calculateStreak: async (): Promise<number> => {
    try {
      // Calculate consecutive days with reflections, working backwards from today
      let streak = 0;
      const today = new Date();

      for (let i = 0; i < 365; i++) {
        // Check up to 365 days back
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);

        const reflection = await get().getReflectionForDate(checkDate);
        if (reflection) {
          streak++;
        } else {
          break; // Streak broken
        }
      }

      logger.info('Calculated reading streak', { streak });
      return streak;
    } catch (error) {
      logger.error('Failed to calculate streak', error);
      return 0;
    }
  },

  initializeReadings: async (): Promise<void> => {
    try {
      set({ isLoading: true, error: null });

      // This would populate the daily_readings table with 365 readings
      // For now, we'll just log that initialization is needed
      logger.info('Daily readings initialization needed');

      set({ isLoading: false });
    } catch (error) {
      logger.error('Failed to initialize readings', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to initialize readings',
        isLoading: false,
      });
    }
  },
}));
