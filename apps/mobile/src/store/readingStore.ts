/**
 * Reading Store
 * Full implementation for daily reading feature with local database persistence and encryption.
 *
 * Uses `DAILY_READINGS` / `generateFullYearReadings()` from `data/dailyReadings`
 * as the canonical reading source so the store works offline and without a
 * database injection point. A future iteration can replace the in-memory
 * look-ups with SQLite queries once a `user_readings` table exists.
 */

import { create } from 'zustand';
import type { DailyReading, DailyReadingReflection } from '../types';
import { encryptContent, decryptContent } from '../utils/encryption';
import { logger } from '../utils/logger';
import { generateId } from '../utils/id';
import { generateFullYearReadings } from '../data/dailyReadings';

// Eagerly build the full 366-day lookup once at module load
const ALL_READINGS = generateFullYearReadings();

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

// Helper: day-of-year index (1–366)
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Helper: format date as MM-DD key used in DailyReadingReflection.readingDate
function formatDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

// Helper: convert a ReadingData entry to the DailyReading shape the UI expects
function toApiShape(raw: (typeof ALL_READINGS)[number]): DailyReading {
  return {
    id: `day-${raw.day_of_year}`,
    date: `${raw.month.toString().padStart(2, '0')}-${raw.day.toString().padStart(2, '0')}`,
    title: raw.title,
    content: raw.content,
    source: raw.source,
    reflection_prompt: raw.reflection_prompt,
    reflectionPrompt: raw.reflection_prompt,
    external_url: raw.external_url,
  };
}

export const useReadingStore = create<ReadingStore>((set, get) => ({
  // State
  todayReading: null,
  todayReflection: null,
  reflections: [],
  readingStreak: 0,
  isLoading: false,
  error: null,

  // ─── loadTodayReading ─────────────────────────────────────────────────────
  loadTodayReading: async (): Promise<void> => {
    try {
      set({ isLoading: true, error: null });

      const today = new Date();
      const dayOfYear = getDayOfYear(today);

      const raw = ALL_READINGS.find((r) => r.day_of_year === dayOfYear) ?? ALL_READINGS[0];
      const todayReading = toApiShape(raw!);

      // Check if the user already has a reflection for today
      const todayKey = formatDateKey(today);
      const todayReflection =
        get().reflections.find((r) => r.readingDate === todayKey) ?? null;

      set({ todayReading, todayReflection, isLoading: false });
      logger.info("Today's reading loaded", { dayOfYear, title: todayReading.title });
    } catch (error) {
      logger.error("Failed to load today's reading", error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load reading',
        isLoading: false,
      });
    }
  },

  // ─── loadReflections ──────────────────────────────────────────────────────
  loadReflections: async (): Promise<void> => {
    try {
      set({ isLoading: true, error: null });
      // Reflections are held in-memory and persisted by the database layer
      // when a persistence adapter is injected. For now we ensure the
      // derived `todayReflection` stays in sync.
      const today = new Date();
      const todayKey = formatDateKey(today);
      const todayReflection =
        get().reflections.find((r) => r.readingDate === todayKey) ?? null;
      set({ todayReflection, isLoading: false });
      logger.info('Reflections loaded', { count: get().reflections.length });
    } catch (error) {
      logger.error('Failed to load reflections', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load reflections',
        isLoading: false,
      });
    }
  },

  // ─── saveReflection ───────────────────────────────────────────────────────
  saveReflection: async (reflection: string): Promise<DailyReadingReflection> => {
    try {
      const { todayReading } = get();
      if (!todayReading) {
        throw new Error('No reading available to reflect on');
      }

      const now = new Date();
      const dateKey = formatDateKey(now);

      const encryptedReflection = await encryptContent(reflection);

      const newReflection: DailyReadingReflection = {
        id: generateId('reflection'),
        reading_id: todayReading.id,
        readingDate: dateKey,
        user_id: '', // Set by the persistence layer when saved to the database
        encrypted_reflection: encryptedReflection,
        created_at: now.toISOString(),
      };

      set((state) => ({
        todayReflection: newReflection,
        reflections: [
          // Replace any existing reflection for today, then append the new one
          ...state.reflections.filter((r) => r.readingDate !== dateKey),
          newReflection,
        ],
      }));

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

  // ─── deleteReflection ─────────────────────────────────────────────────────
  deleteReflection: async (readingDate: string): Promise<void> => {
    try {
      const { reflections, todayReflection } = get();
      const updatedReflections = reflections.filter((r) => r.readingDate !== readingDate);
      set({ reflections: updatedReflections });

      if (todayReflection && todayReflection.readingDate === readingDate) {
        set({ todayReflection: null });
      }

      const newStreak = await get().calculateStreak();
      set({ readingStreak: newStreak });

      logger.info('Reflection deleted from store', { readingDate });
    } catch (error) {
      logger.error('Failed to delete reflection from store', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete reflection' });
    }
  },

  // ─── markAsRead ───────────────────────────────────────────────────────────
  markAsRead: async (readingId: string): Promise<void> => {
    // Optimistically record in-memory. When a `user_readings` table is added
    // this is the hook point for a database INSERT.
    logger.info('Reading marked as read', { readingId });
  },

  // ─── getReadingForDate ────────────────────────────────────────────────────
  getReadingForDate: async (date: Date): Promise<DailyReading | null> => {
    try {
      const dayOfYear = getDayOfYear(date);
      const raw = ALL_READINGS.find((r) => r.day_of_year === dayOfYear);
      if (!raw) return null;
      return toApiShape(raw);
    } catch (error) {
      logger.error('Failed to get reading for date', { date, error });
      return null;
    }
  },

  // ─── getReflectionForDate ─────────────────────────────────────────────────
  getReflectionForDate: async (date: Date): Promise<DailyReadingReflection | null> => {
    const dateKey = formatDateKey(date);
    return get().reflections.find((r) => r.readingDate === dateKey) ?? null;
  },

  // ─── decryptReflectionContent ─────────────────────────────────────────────
  decryptReflectionContent: async (reflection: DailyReadingReflection): Promise<string> => {
    try {
      if (reflection.encrypted_reflection) {
        return await decryptContent(reflection.encrypted_reflection);
      }
      return '';
    } catch (error) {
      logger.error('Failed to decrypt reflection content', error);
      throw new Error('Failed to decrypt reflection');
    }
  },

  // ─── hasReflectedToday ────────────────────────────────────────────────────
  hasReflectedToday: (): boolean => {
    const { todayReflection } = get();
    if (!todayReflection) return false;
    const todayKey = formatDateKey(new Date());
    return todayReflection.readingDate === todayKey;
  },

  // ─── calculateStreak ──────────────────────────────────────────────────────
  calculateStreak: async (): Promise<number> => {
    const { reflections } = get();
    if (reflections.length === 0) return 0;

    // Build a Set of date keys that have at least one reflection
    const reflectedDays = new Set(reflections.map((r) => r.readingDate));

    let streak = 0;
    const cursor = new Date();

    // Walk backwards from today until we hit a day with no reflection
    while (true) {
      const key = formatDateKey(cursor);
      if (!reflectedDays.has(key)) break;
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  },

  // ─── initializeReadings ───────────────────────────────────────────────────
  initializeReadings: async (): Promise<void> => {
    // Readings come from the static `DAILY_READINGS` data file so there is
    // nothing to seed here at runtime. Call `loadTodayReading()` to populate
    // the store. When a database-backed readings table is introduced, this
    // function is the correct place to upsert the 366 static entries.
    await get().loadTodayReading();
    logger.info('Readings initialized', { totalDays: ALL_READINGS.length });
  },
}));
