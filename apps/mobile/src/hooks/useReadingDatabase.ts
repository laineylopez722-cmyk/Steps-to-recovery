/**
 * Reading Store with Database Operations
 * Custom hook that provides database-connected reading functionality
 *
 * This hook bridges the Zustand store with the database context,
 * enabling full database operations for daily readings and reflections.
 */

import { useCallback, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useReadingStore } from '../store/readingStore';
import { addToSyncQueue } from '../services/syncService';
import { logger } from '../utils/logger';
import { generateId } from '../utils/id';
import { generateFullYearReadings } from '../data/dailyReadings';
import { NA_JFT_URL } from '../data/dailyReadings';
import type { DailyReading, DailyReadingReflection } from '../types';

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

export function useReadingDatabase() {
  const { db, isReady } = useDatabase();
  const store = useReadingStore();

  // Initialize readings in database
  const initializeReadings = useCallback(async () => {
    if (!db || !isReady) return;

    try {
      // Check if readings are already initialized
      const existingCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM daily_readings',
      );

      if (existingCount && existingCount.count > 0) {
        logger.info('Daily readings already initialized', { count: existingCount.count });
        return;
      }

      // Generate all readings for the year
      const allReadings = generateFullYearReadings();

      // Insert readings in batches
      const batchSize = 50;
      for (let i = 0; i < allReadings.length; i += batchSize) {
        const batch = allReadings.slice(i, i + batchSize);

        for (const reading of batch) {
          await db.runAsync(
            `INSERT OR REPLACE INTO daily_readings 
             (id, day_of_year, month, day, title, content, source, reflection_prompt, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              `reading-${reading.day_of_year}`,
              reading.day_of_year,
              reading.month,
              reading.day,
              reading.title,
              reading.content,
              reading.source,
              reading.reflection_prompt,
              new Date().toISOString(),
            ],
          );
        }
      }

      logger.info('Daily readings initialized successfully', { count: allReadings.length });
    } catch (error) {
      logger.error('Failed to initialize daily readings', error);
    }
  }, [db, isReady]);

  // Load today's reading from database
  const loadTodayReading = useCallback(async (): Promise<void> => {
    if (!db || !isReady) return;

    try {
      const today = new Date();
      const dayOfYear = getDayOfYear(today);

      const reading = await db.getFirstAsync<DailyReading>(
        `SELECT id, day_of_year as dayOfYear, month, day, title, content, source, reflection_prompt
         FROM daily_readings WHERE day_of_year = ?`,
        [dayOfYear],
      );

      if (reading) {
        // Convert database format to app format
        const formattedReading: DailyReading = {
          id: reading.id,
          date: formatDateKey(today),
          title: reading.title,
          content: reading.content,
          source: reading.source,
          reflection_prompt: reading.reflection_prompt,
          external_url: NA_JFT_URL,
        };

        useReadingStore.setState({ todayReading: formattedReading });

        // Also load today's reflection if it exists
        await loadTodayReflection();
      }
    } catch (error) {
      logger.error("Failed to load today's reading", error);
      // Error is logged, store state remains unchanged
    }
  }, [db, isReady]);

  // Load today's reflection from database
  const loadTodayReflection = useCallback(async (): Promise<void> => {
    if (!db || !isReady) return;

    try {
      const today = new Date();
      const dateKey = formatDateKey(today);

      const reflection = await db.getFirstAsync<DailyReadingReflection>(
        `SELECT * FROM reading_reflections WHERE reading_date = ? ORDER BY created_at DESC LIMIT 1`,
        [dateKey],
      );

      useReadingStore.setState({ todayReflection: reflection || null });
    } catch (error) {
      logger.error("Failed to load today's reflection", error);
    }
  }, [db, isReady]);

  // Save reflection to database
  const saveReflection = useCallback(
    async (reflectionText: string, userId: string): Promise<DailyReadingReflection | null> => {
      if (!db || !isReady || !store.todayReading) return null;

      try {
        const { todayReading } = store;
        const now = new Date();
        const dateKey = formatDateKey(now);

        // Encrypt the reflection content
        const { encryptContent } = await import('../utils/encryption');
        const encryptedReflection = await encryptContent(reflectionText);

        const reflectionId = generateId('reflection');

        const reflection: DailyReadingReflection = {
          id: reflectionId,
          reading_id: todayReading!.id,
          readingDate: dateKey,
          user_id: userId,
          encrypted_reflection: encryptedReflection,
          reflection: reflectionText, // Keep in memory for immediate use
          created_at: now.toISOString(),
        };

        // Insert into database
        await db.runAsync(
          `INSERT OR REPLACE INTO reading_reflections 
         (id, user_id, reading_id, reading_date, encrypted_reflection, word_count, created_at, updated_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            reflectionId,
            userId,
            todayReading!.id,
            dateKey,
            encryptedReflection,
            reflectionText.split(/\s+/).length, // word count
            now.toISOString(),
            now.toISOString(),
            'pending',
          ],
        );

        // Add to sync queue
        await addToSyncQueue(db, 'reading_reflections', reflectionId, 'insert');

        // Update store
        useReadingStore.setState({ todayReflection: reflection });

        // Recalculate streak
        const newStreak = await calculateStreak();
        useReadingStore.setState({ readingStreak: newStreak });

        logger.info('Reflection saved successfully', {
          reflectionId,
          wordCount: reflectionText.split(/\s+/).length,
        });

        return reflection;
      } catch (error) {
        logger.error('Failed to save reflection', error);
        // Error is logged, store state remains unchanged
        return null;
      }
    },
    [db, isReady],
  );

  // Calculate reading streak
  const calculateStreak = useCallback(async (): Promise<number> => {
    if (!db || !isReady) return 0;

    try {
      let streak = 0;
      const today = new Date();

      for (let i = 0; i < 365; i++) {
        // Check up to 365 days back
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateKey = formatDateKey(checkDate);

        const reflection = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM reading_reflections WHERE reading_date = ? LIMIT 1',
          [dateKey],
        );

        if (reflection) {
          streak++;
        } else {
          break; // Streak broken
        }
      }

      return streak;
    } catch (error) {
      logger.error('Failed to calculate reading streak', error);
      return 0;
    }
  }, [db, isReady]);

  // Get reflection for specific date
  const getReflectionForDate = useCallback(
    async (date: Date): Promise<DailyReadingReflection | null> => {
      if (!db || !isReady) return null;

      try {
        const dateKey = formatDateKey(date);

        const reflection = await db.getFirstAsync<DailyReadingReflection>(
          'SELECT * FROM reading_reflections WHERE reading_date = ? ORDER BY created_at DESC LIMIT 1',
          [dateKey],
        );

        return reflection || null;
      } catch (error) {
        logger.error('Failed to get reflection for date', error);
        return null;
      }
    },
    [db, isReady],
  );

  // Initialize on mount
  useEffect(() => {
    if (isReady) {
      initializeReadings();
    }
  }, [isReady, initializeReadings]);

  return {
    // Database operations (local versions that override store's placeholder methods)
    initializeReadings,
    loadTodayReading,
    loadTodayReflection,
    saveReflection,
    calculateStreak,
    getReflectionForDate,

    // Store state
    todayReading: store.todayReading,
    todayReflection: store.todayReflection,
    reflections: store.reflections,
    readingStreak: store.readingStreak,
    isLoading: store.isLoading,
    error: store.error,

    // Store actions (non-database dependent)
    decryptReflectionContent: store.decryptReflectionContent,
    hasReflectedToday: store.hasReflectedToday,
    markAsRead: store.markAsRead,
    getReadingForDate: store.getReadingForDate,

    // Database status
    isReady,
  };
}
