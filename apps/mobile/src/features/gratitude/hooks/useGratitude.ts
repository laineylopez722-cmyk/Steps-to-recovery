/**
 * Gratitude Journal Hook
 *
 * Provides queries and mutations for the daily gratitude feature.
 * All items are encrypted before storage and decrypted on read.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { encryptContent, decryptContent } from '../../../utils/encryption';
import { addToSyncQueue } from '../../../services/syncService';
import { generateId } from '../../../utils/id';
import { logger } from '../../../utils/logger';
import type { GratitudeEntry, GratitudeStreak } from '../types';

// Database row shape
interface GratitudeRow {
  id: string;
  user_id: string;
  entry_date: string;
  encrypted_item_1: string;
  encrypted_item_2: string;
  encrypted_item_3: string;
  created_at: string;
  updated_at: string;
  synced: number;
  supabase_id: string | null;
}

// Query keys
const gratitudeKeys = {
  all: (userId: string) => ['gratitude', userId] as const,
  today: (userId: string) => ['gratitude', userId, 'today'] as const,
  streak: (userId: string) => ['gratitude', userId, 'streak'] as const,
  history: (userId: string) => ['gratitude', userId, 'history'] as const,
};

/**
 * Decrypt a gratitude row into a GratitudeEntry
 */
async function decryptRow(row: GratitudeRow): Promise<GratitudeEntry> {
  const [item1, item2, item3] = await Promise.all([
    decryptContent(row.encrypted_item_1),
    decryptContent(row.encrypted_item_2),
    decryptContent(row.encrypted_item_3),
  ]);

  return {
    id: row.id,
    userId: row.user_id,
    entryDate: row.entry_date,
    items: [item1, item2, item3],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Hook to get today's gratitude entry
 */
export function useTodayGratitude(userId: string): {
  entry: GratitudeEntry | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { db, isReady } = useDatabase();
  const today = new Date().toISOString().split('T')[0];

  const { data, isLoading, error } = useQuery({
    queryKey: gratitudeKeys.today(userId),
    queryFn: async (): Promise<GratitudeEntry | null> => {
      if (!db) return null;

      try {
        const row = await db.getFirstAsync<GratitudeRow>(
          'SELECT * FROM gratitude_entries WHERE user_id = ? AND entry_date = ?',
          [userId, today],
        );

        if (!row) return null;
        return decryptRow(row);
      } catch (err) {
        logger.error('Failed to fetch today gratitude entry', err);
        return null;
      }
    },
    enabled: isReady && !!db && !!userId,
    staleTime: 60 * 1000,
  });

  return {
    entry: data ?? null,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Hook to get gratitude history (last 7 days)
 */
export function useGratitudeHistory(userId: string): {
  entries: GratitudeEntry[];
  isLoading: boolean;
} {
  const { db, isReady } = useDatabase();

  const { data, isLoading } = useQuery({
    queryKey: gratitudeKeys.history(userId),
    queryFn: async (): Promise<GratitudeEntry[]> => {
      if (!db) return [];

      try {
        const rows = await db.getAllAsync<GratitudeRow>(
          'SELECT * FROM gratitude_entries WHERE user_id = ? ORDER BY entry_date DESC LIMIT 7',
          [userId],
        );

        return Promise.all(rows.map(decryptRow));
      } catch (err) {
        logger.error('Failed to fetch gratitude history', err);
        return [];
      }
    },
    enabled: isReady && !!db && !!userId,
    staleTime: 2 * 60 * 1000,
  });

  return {
    entries: data ?? [],
    isLoading,
  };
}

/**
 * Hook to calculate gratitude streak
 */
export function useGratitudeStreak(userId: string): {
  streak: GratitudeStreak;
  isLoading: boolean;
} {
  const { db, isReady } = useDatabase();

  const { data, isLoading } = useQuery({
    queryKey: gratitudeKeys.streak(userId),
    queryFn: async (): Promise<GratitudeStreak> => {
      if (!db) return { currentStreak: 0, longestStreak: 0, totalEntries: 0 };

      try {
        const rows = await db.getAllAsync<{ entry_date: string }>(
          'SELECT DISTINCT entry_date FROM gratitude_entries WHERE user_id = ? ORDER BY entry_date DESC',
          [userId],
        );

        const dates = rows.map((r) => r.entry_date);
        const totalEntries = dates.length;

        if (totalEntries === 0) {
          return { currentStreak: 0, longestStreak: 0, totalEntries: 0 };
        }

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        const today = new Date().toISOString().split('T')[0];
        const expectedDate = new Date(today);

        for (const dateStr of dates) {
          const expectedStr = expectedDate.toISOString().split('T')[0];

          if (dateStr === expectedStr) {
            tempStreak++;
            if (tempStreak === 1 || dates.indexOf(dateStr) === 0) {
              currentStreak = tempStreak;
            }
            expectedDate.setDate(expectedDate.getDate() - 1);
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
            const d = new Date(dateStr);
            expectedDate.setTime(d.getTime());
            expectedDate.setDate(expectedDate.getDate() - 1);
          }
        }

        longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

        return { currentStreak, longestStreak, totalEntries };
      } catch (err) {
        logger.error('Failed to calculate gratitude streak', err);
        return { currentStreak: 0, longestStreak: 0, totalEntries: 0 };
      }
    },
    enabled: isReady && !!db && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    streak: data ?? { currentStreak: 0, longestStreak: 0, totalEntries: 0 },
    isLoading,
  };
}

// Mutation variables
interface SaveGratitudeVariables {
  items: [string, string, string];
}

/**
 * Hook to save a new gratitude entry
 */
export function useSaveGratitude(userId: string): {
  saveGratitude: (items: [string, string, string]) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, SaveGratitudeVariables>({
    mutationKey: ['saveGratitude', userId],

    mutationFn: async ({ items }: SaveGratitudeVariables): Promise<void> => {
      if (!db) throw new Error('Database not initialized');

      const id = generateId('gratitude');
      const now = new Date().toISOString();
      const today = now.split('T')[0];

      const [encrypted1, encrypted2, encrypted3] = await Promise.all([
        encryptContent(items[0]),
        encryptContent(items[1]),
        encryptContent(items[2]),
      ]);

      await db.runAsync(
        `INSERT INTO gratitude_entries (id, user_id, entry_date, encrypted_item_1, encrypted_item_2, encrypted_item_3, created_at, updated_at, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [id, userId, today, encrypted1, encrypted2, encrypted3, now, now],
      );

      await addToSyncQueue(db, 'gratitude_entries', id, 'insert');

      logger.info('Gratitude entry saved', { id, entryDate: today });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gratitudeKeys.today(userId) });
      queryClient.invalidateQueries({ queryKey: gratitudeKeys.streak(userId) });
      queryClient.invalidateQueries({ queryKey: gratitudeKeys.history(userId) });
    },
  });

  return {
    saveGratitude: (items) => mutation.mutateAsync({ items }),
    isPending: mutation.isPending,
  };
}

/**
 * Convenience hook that combines all gratitude hooks
 */
export function useGratitude(): {
  userId: string;
  todayEntry: GratitudeEntry | null;
  todayLoading: boolean;
  streak: GratitudeStreak;
  streakLoading: boolean;
  history: GratitudeEntry[];
  historyLoading: boolean;
  saveGratitude: (items: [string, string, string]) => Promise<void>;
  isSaving: boolean;
} {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const { entry, isLoading: todayLoading } = useTodayGratitude(userId);
  const { streak, isLoading: streakLoading } = useGratitudeStreak(userId);
  const { entries, isLoading: historyLoading } = useGratitudeHistory(userId);
  const { saveGratitude, isPending } = useSaveGratitude(userId);

  return {
    userId,
    todayEntry: entry,
    todayLoading,
    streak,
    streakLoading,
    history: entries,
    historyLoading,
    saveGratitude,
    isSaving: isPending,
  };
}

export { gratitudeKeys };
