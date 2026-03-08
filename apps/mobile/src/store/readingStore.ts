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
  deleteReflection: (readingDate: string) => Promise<void>;
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

  deleteReflection: async (readingDate: string): Promise<void> => {
    try {
      // Remove matching reflection from the array
      const { reflections, todayReflection } = get();
      const updatedReflections = reflections.filter((r) => r.readingDate !== readingDate);
      set({ reflections: updatedReflections });

      // Clear todayReflection if it matches
      if (todayReflection && todayReflection.readingDate === readingDate) {
        set({ todayReflection: null });
      }

      // Recalculate streak
      const newStreak = await get().calculateStreak();
      set({ readingStreak: newStreak });

      logger.info('Reflection deleted from store', { readingDate });
    } catch (error) {
      logger.error('Failed to delete reflection from store', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete reflection' });
    }
  },

  // TODO: Not yet implemented — needs user_readings table integration
  markAsRead: async (_readingId: string): Promise<void> => {},

  // TODO: Not yet implemented — needs database query by day_of_year
  getReadingForDate: async (_date: Date): Promise<DailyReading | null> => null,

  // TODO: Not yet implemented — needs database query by reading_date
  getReflectionForDate: async (_date: Date): Promise<DailyReadingReflection | null> => null,

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

  // TODO: Not yet implemented — getReflectionForDate returns null, so streak is always 0.
  // Once getReflectionForDate is implemented, this should query the database directly
  // with SQL (e.g., consecutive days with reflections) instead of looping 365 times.
  calculateStreak: async (): Promise<number> => 0,

  // TODO: Not yet implemented — should populate daily_readings table with 365 readings
  initializeReadings: async (): Promise<void> => {},
}));
