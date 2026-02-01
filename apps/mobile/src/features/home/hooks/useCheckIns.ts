import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { decryptContent, encryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import { generateId } from '../../../utils/id';
import { addToSyncQueue, addDeleteToSyncQueue } from '../../../services/syncService';
import type { DailyCheckIn, CheckInType } from '@recovery/shared/src/types/database';
import type { DailyCheckInDecrypted } from '@recovery/shared/src/types/models';

// Extended types to include gratitude
interface DailyCheckInWithGratitude extends DailyCheckIn {
  encrypted_gratitude?: string | null;
}

interface DailyCheckInDecryptedWithGratitude extends DailyCheckInDecrypted {
  gratitude?: string | null;
}

/**
 * Decrypt a daily check-in from database format to UI format
 */
async function decryptCheckIn(
  checkIn: DailyCheckInWithGratitude,
): Promise<DailyCheckInDecryptedWithGratitude> {
  const intention = checkIn.encrypted_intention
    ? await decryptContent(checkIn.encrypted_intention)
    : null;
  const reflection = checkIn.encrypted_reflection
    ? await decryptContent(checkIn.encrypted_reflection)
    : null;
  const mood = checkIn.encrypted_mood
    ? parseInt(await decryptContent(checkIn.encrypted_mood), 10)
    : null;
  const craving = checkIn.encrypted_craving
    ? parseInt(await decryptContent(checkIn.encrypted_craving), 10)
    : null;
  const gratitude = checkIn.encrypted_gratitude
    ? await decryptContent(checkIn.encrypted_gratitude)
    : null;

  return {
    id: checkIn.id,
    user_id: checkIn.user_id,
    check_in_type: checkIn.check_in_type,
    check_in_date: checkIn.check_in_date,
    intention,
    reflection,
    mood,
    craving,
    gratitude,
    created_at: checkIn.created_at,
    sync_status: checkIn.sync_status,
  };
}

/**
 * Hook to get today's check-ins
 */
export function useTodayCheckIns(userId: string): {
  morning: DailyCheckInDecryptedWithGratitude | null;
  evening: DailyCheckInDecryptedWithGratitude | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { db, isReady } = useDatabase();
  const today = new Date().toISOString().split('T')[0];

  const { data, isLoading, error } = useQuery({
    queryKey: ['daily_checkins', userId, today],
    queryFn: async () => {
      if (!db || !isReady) {
        throw new Error('Database not ready');
      }
      try {
        const result = await db.getAllAsync<DailyCheckInWithGratitude>(
          'SELECT * FROM daily_checkins WHERE user_id = ? AND check_in_date = ?',
          [userId, today],
        );

        const decrypted = await Promise.all(result.map(decryptCheckIn));
        const morning = decrypted.find((c) => c.check_in_type === 'morning') || null;
        const evening = decrypted.find((c) => c.check_in_type === 'evening') || null;

        return { morning, evening };
      } catch (err) {
        logger.error('Failed to fetch today check-ins', err);
        throw err;
      }
    },
    enabled: isReady && !!db,
  });

  return {
    morning: data?.morning || null,
    evening: data?.evening || null,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Hook to create a check-in
 */
export function useCreateCheckIn(userId: string): {
  createCheckIn: (data: {
    type: CheckInType;
    intention?: string;
    reflection?: string;
    mood?: number;
    craving?: number;
    gratitude?: string;
  }) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: {
      type: CheckInType;
      intention?: string;
      reflection?: string;
      mood?: number;
      craving?: number;
      gratitude?: string;
    }) => {
      if (!db) throw new Error('Database not initialized');

      try {
        const id = generateId('checkin');
        const now = new Date().toISOString();
        const today = now.split('T')[0];

        const encrypted_intention = data.intention ? await encryptContent(data.intention) : null;
        const encrypted_reflection = data.reflection ? await encryptContent(data.reflection) : null;
        const encrypted_mood =
          data.mood !== undefined ? await encryptContent(data.mood.toString()) : null;
        const encrypted_craving =
          data.craving !== undefined ? await encryptContent(data.craving.toString()) : null;
        const encrypted_gratitude = data.gratitude ? await encryptContent(data.gratitude) : null;

        await db.runAsync(
          `INSERT INTO daily_checkins (id, user_id, check_in_type, check_in_date, encrypted_intention, encrypted_reflection, encrypted_mood, encrypted_craving, encrypted_gratitude, created_at, sync_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            userId,
            data.type,
            today,
            encrypted_intention,
            encrypted_reflection,
            encrypted_mood,
            encrypted_craving,
            encrypted_gratitude,
            now,
            'pending',
          ],
        );

        // Add to sync queue for cloud backup
        await addToSyncQueue(db, 'daily_checkins', id, 'insert');

        logger.info('Check-in created', { id, type: data.type });
      } catch (err) {
        logger.error('Failed to create check-in', err);
        throw err;
      }
    },
    onSuccess: () => {
      const today = new Date().toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: ['daily_checkins', userId, today] });
    },
  });

  return {
    createCheckIn: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

/**
 * Hook to update an existing check-in
 */
export function useUpdateCheckIn(userId: string): {
  updateCheckIn: (
    id: string,
    data: { intention?: string; reflection?: string; mood?: number; craving?: number },
  ) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { intention?: string; reflection?: string; mood?: number; craving?: number };
    }) => {
      if (!db) throw new Error('Database not initialized');

      try {
        const now = new Date().toISOString();
        const updates: string[] = [];
        const values: (string | null)[] = [];

        if (data.intention !== undefined) {
          updates.push('encrypted_intention = ?');
          values.push(data.intention ? await encryptContent(data.intention) : null);
        }
        if (data.reflection !== undefined) {
          updates.push('encrypted_reflection = ?');
          values.push(data.reflection ? await encryptContent(data.reflection) : null);
        }
        if (data.mood !== undefined) {
          updates.push('encrypted_mood = ?');
          values.push(await encryptContent(data.mood.toString()));
        }
        if (data.craving !== undefined) {
          updates.push('encrypted_craving = ?');
          values.push(await encryptContent(data.craving.toString()));
        }

        updates.push('updated_at = ?');
        values.push(now);
        updates.push('sync_status = ?');
        values.push('pending');

        values.push(id);
        values.push(userId);

        await db.runAsync(
          `UPDATE daily_checkins SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
          values,
        );

        // Add to sync queue for cloud backup
        await addToSyncQueue(db, 'daily_checkins', id, 'update');

        logger.info('Check-in updated', { id });
      } catch (err) {
        logger.error('Failed to update check-in', err);
        throw err;
      }
    },
    onSuccess: () => {
      const today = new Date().toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: ['daily_checkins', userId, today] });
      queryClient.invalidateQueries({ queryKey: ['streak', userId] });
    },
  });

  return {
    updateCheckIn: (id, data) => mutation.mutateAsync({ id, data }),
    isPending: mutation.isPending,
  };
}

/**
 * Hook to delete a check-in
 */
export function useDeleteCheckIn(userId: string): {
  deleteCheckIn: (id: string) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      if (!db) throw new Error('Database not initialized');

      try {
        // Capture supabase_id and add to sync queue BEFORE deleting
        // This ensures we can delete from Supabase even after local deletion
        await addDeleteToSyncQueue(db, 'daily_checkins', id, userId);

        await db.runAsync('DELETE FROM daily_checkins WHERE id = ? AND user_id = ?', [id, userId]);
        logger.info('Check-in deleted', { id });
      } catch (err) {
        logger.error('Failed to delete check-in', err);
        throw err;
      }
    },
    onSuccess: () => {
      const today = new Date().toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: ['daily_checkins', userId, today] });
      queryClient.invalidateQueries({ queryKey: ['streak', userId] });
    },
  });

  return {
    deleteCheckIn: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

/**
 * Hook to calculate current streak
 */
export function useStreak(userId: string): {
  current_streak: number;
  longest_streak: number;
  total_check_ins: number;
  isLoading: boolean;
} {
  const { db } = useDatabase();

  const { data, isLoading } = useQuery({
    queryKey: ['streak', userId],
    queryFn: async () => {
      if (!db) return { currentStreak: 0, longestStreak: 0 };

      try {
        const result = await db.getAllAsync<{ check_in_date: string }>(
          'SELECT DISTINCT check_in_date FROM daily_checkins WHERE user_id = ? ORDER BY check_in_date DESC',
          [userId],
        );

        const dates = result.map((r) => r.check_in_date);
        let current_streak = 0;
        let longest_streak = 0;
        let temp_streak = 0;

        const today = new Date().toISOString().split('T')[0];
        let expectedDate = new Date(today);

        for (const dateStr of dates) {
          const _checkDate = new Date(dateStr);
          const expectedStr = expectedDate.toISOString().split('T')[0];

          if (dateStr === expectedStr) {
            temp_streak++;
            if ((temp_streak === 1 && dateStr === today) || dates.indexOf(dateStr) === 0) {
              current_streak = temp_streak;
            }
            expectedDate.setDate(expectedDate.getDate() - 1);
          } else {
            longest_streak = Math.max(longest_streak, temp_streak);
            temp_streak = 1;
            expectedDate = new Date(dateStr);
            expectedDate.setDate(expectedDate.getDate() - 1);
          }
        }

        longest_streak = Math.max(longest_streak, temp_streak, current_streak);

        return {
          current_streak,
          longest_streak,
          total_check_ins: dates.length,
        };
      } catch (err) {
        logger.error('Failed to calculate streak', err);
        return { current_streak: 0, longest_streak: 0, total_check_ins: 0 };
      }
    },
  });

  return {
    current_streak: data?.current_streak || 0,
    longest_streak: data?.longest_streak || 0,
    total_check_ins: data?.total_check_ins || 0,
    isLoading,
  };
}
