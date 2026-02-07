import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { decryptContent, encryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import { generateId } from '../../../utils/id';
import { addToSyncQueue, addDeleteToSyncQueue } from '../../../services/syncService';
import type { DailyCheckIn, CheckInType, DailyCheckInDecrypted } from '@recovery/shared';

// Extended types to include gratitude
interface DailyCheckInWithGratitude extends DailyCheckIn {
  encrypted_gratitude?: string | null;
}

interface DailyCheckInDecryptedWithGratitude extends DailyCheckInDecrypted {
  gratitude?: string | null;
}

// Type for today's check-ins query result
interface TodayCheckInsResult {
  morning: DailyCheckInDecryptedWithGratitude | null;
  evening: DailyCheckInDecryptedWithGratitude | null;
  date: string;
}

// Query keys for check-ins
const checkInKeys = {
  all: ['daily_checkins'] as const,
  byUser: (userId: string) => [...checkInKeys.all, userId] as const,
  byDate: (userId: string, date: string) => [...checkInKeys.byUser(userId), date] as const,
  today: (userId: string) => [...checkInKeys.byUser(userId), 'today'] as const,
  streak: (userId: string) => ['streak', userId] as const,
};

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
 * Hook to get today's check-ins with offline-first support
 * - Returns cached data immediately (stale-while-revalidate)
 * - Automatically refreshes when online
 * - Persists across app restarts
 */
export function useTodayCheckIns(userId: string): {
  morning: DailyCheckInDecryptedWithGratitude | null;
  evening: DailyCheckInDecryptedWithGratitude | null;
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
} {
  const { db, isReady } = useDatabase();
  const today = new Date().toISOString().split('T')[0];

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: checkInKeys.today(userId),
    queryFn: async (): Promise<TodayCheckInsResult> => {
      if (!db || !isReady) {
        // Return defaults when database not ready
        return { morning: null, evening: null, date: today };
      }
      try {
        const result = await db.getAllAsync<DailyCheckInWithGratitude>(
          'SELECT * FROM daily_checkins WHERE user_id = ? AND check_in_date = ?',
          [userId, today],
        );

        const decrypted = await Promise.all(result.map(decryptCheckIn));
        const morning = decrypted.find((c) => c.check_in_type === 'morning') || null;
        const evening = decrypted.find((c) => c.check_in_type === 'evening') || null;

        return { morning, evening, date: today };
      } catch (err) {
        logger.error('Failed to fetch today check-ins', err);
        // Return defaults on error
        return { morning: null, evening: null, date: today };
      }
    },
    enabled: isReady && !!db,
    // Stale time of 1 minute - data stays fresh for quick navigation
    staleTime: 60 * 1000,
  });

  return {
    morning: data?.morning || null,
    evening: data?.evening || null,
    isLoading,
    error: error as Error | null,
    isFetching,
  };
}

// Type for create check-in variables
interface CreateCheckInVariables {
  type: CheckInType;
  intention?: string;
  reflection?: string;
  mood?: number;
  craving?: number;
  gratitude?: string;
}

/**
 * Hook to create a check-in with optimistic updates
 * - Updates UI immediately (optimistic)
 * - Queues for sync if offline
 * - Auto-retries on failure
 */
export function useCreateCheckIn(userId: string): {
  createCheckIn: (data: CreateCheckInVariables) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const mutation = useMutation<
    void,
    Error,
    CreateCheckInVariables,
    { previousData: TodayCheckInsResult | undefined }
  >({
    mutationKey: ['createCheckIn', userId],

    mutationFn: async (data: CreateCheckInVariables): Promise<void> => {
      if (!db) throw new Error('Database not initialized');

      const id = generateId('checkin');
      const now = new Date().toISOString();

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
    },

    // Optimistically update the UI immediately
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: checkInKeys.today(userId) });

      const previousData = queryClient.getQueryData<TodayCheckInsResult>(checkInKeys.today(userId));

      const newCheckIn: DailyCheckInDecryptedWithGratitude = {
        id: 'temp-' + Date.now(),
        user_id: userId,
        check_in_type: variables.type,
        check_in_date: today,
        intention: variables.intention || null,
        reflection: variables.reflection || null,
        mood: variables.mood ?? null,
        craving: variables.craving ?? null,
        gratitude: variables.gratitude || null,
        created_at: new Date().toISOString(),
        sync_status: 'pending',
      };

      const optimisticData: TodayCheckInsResult =
        variables.type === 'morning'
          ? { morning: newCheckIn, evening: previousData?.evening ?? null, date: today }
          : { morning: previousData?.morning ?? null, evening: newCheckIn, date: today };

      queryClient.setQueryData(checkInKeys.today(userId), optimisticData);

      return { previousData };
    },

    onError: (error, _variables, context) => {
      logger.error('Failed to create check-in', error);
      if (context?.previousData) {
        queryClient.setQueryData(checkInKeys.today(userId), context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.today(userId) });
      queryClient.invalidateQueries({ queryKey: checkInKeys.streak(userId) });
    },
  });

  return {
    createCheckIn: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

// Type for update check-in variables
interface UpdateCheckInVariables {
  id: string;
  data: { intention?: string; reflection?: string; mood?: number; craving?: number };
}

/**
 * Hook to update a check-in with optimistic updates
 */
export function useUpdateCheckIn(userId: string): {
  updateCheckIn: (id: string, data: UpdateCheckInVariables['data']) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    Error,
    UpdateCheckInVariables,
    { previousData: TodayCheckInsResult | undefined }
  >({
    mutationKey: ['updateCheckIn', userId],

    mutationFn: async ({ id, data }: UpdateCheckInVariables): Promise<void> => {
      if (!db) throw new Error('Database not initialized');

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
    },

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: checkInKeys.today(userId) });

      const previousData = queryClient.getQueryData<TodayCheckInsResult>(checkInKeys.today(userId));

      if (previousData) {
        const updateCheckIn = (
          checkIn: DailyCheckInDecryptedWithGratitude | null,
        ): DailyCheckInDecryptedWithGratitude | null => {
          if (!checkIn || checkIn.id !== variables.id) return checkIn;
          return { ...checkIn, ...variables.data };
        };

        const optimisticData: TodayCheckInsResult = {
          ...previousData,
          morning: updateCheckIn(previousData.morning),
          evening: updateCheckIn(previousData.evening),
        };

        queryClient.setQueryData(checkInKeys.today(userId), optimisticData);
      }

      return { previousData };
    },

    onError: (error, _variables, context) => {
      logger.error('Failed to update check-in', error);
      if (context?.previousData) {
        queryClient.setQueryData(checkInKeys.today(userId), context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.today(userId) });
      queryClient.invalidateQueries({ queryKey: checkInKeys.streak(userId) });
    },
  });

  return {
    updateCheckIn: (id, data) => mutation.mutateAsync({ id, data }),
    isPending: mutation.isPending,
  };
}

/**
 * Hook to delete a check-in with optimistic removal
 */
export function useDeleteCheckIn(userId: string): {
  deleteCheckIn: (id: string) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    Error,
    string,
    { previousData: TodayCheckInsResult | undefined }
  >({
    mutationKey: ['deleteCheckIn', userId],

    mutationFn: async (id: string): Promise<void> => {
      if (!db) throw new Error('Database not initialized');

      // Capture supabase_id and add to sync queue BEFORE deleting
      await addDeleteToSyncQueue(db, 'daily_checkins', id, userId);

      await db.runAsync('DELETE FROM daily_checkins WHERE id = ? AND user_id = ?', [id, userId]);
      logger.info('Check-in deleted', { id });
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: checkInKeys.today(userId) });

      const previousData = queryClient.getQueryData<TodayCheckInsResult>(checkInKeys.today(userId));

      if (previousData) {
        const optimisticData: TodayCheckInsResult = {
          ...previousData,
          morning: previousData.morning?.id === id ? null : previousData.morning,
          evening: previousData.evening?.id === id ? null : previousData.evening,
        };

        queryClient.setQueryData(checkInKeys.today(userId), optimisticData);
      }

      return { previousData };
    },

    onError: (error, _id, context) => {
      logger.error('Failed to delete check-in', error);
      if (context?.previousData) {
        queryClient.setQueryData(checkInKeys.today(userId), context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.today(userId) });
      queryClient.invalidateQueries({ queryKey: checkInKeys.streak(userId) });
    },
  });

  return {
    deleteCheckIn: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

// Type for streak result
interface StreakResult {
  current_streak: number;
  longest_streak: number;
  total_check_ins: number;
}

/**
 * Hook to calculate current streak with caching
 */
export function useStreak(userId: string): {
  current_streak: number;
  longest_streak: number;
  total_check_ins: number;
  isLoading: boolean;
  isFetching: boolean;
} {
  const { db } = useDatabase();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: checkInKeys.streak(userId),
    queryFn: async (): Promise<StreakResult> => {
      if (!db) return { current_streak: 0, longest_streak: 0, total_check_ins: 0 };

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
    // Cache streak for 5 minutes - it doesn't change often
    staleTime: 5 * 60 * 1000,
  });

  return {
    current_streak: data?.current_streak || 0,
    longest_streak: data?.longest_streak || 0,
    total_check_ins: data?.total_check_ins || 0,
    isLoading,
    isFetching,
  };
}

// Re-export query keys for use in other hooks
export { checkInKeys };
