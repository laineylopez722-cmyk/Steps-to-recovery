/**
 * Personal Inventory Hook (Tenth Step)
 *
 * React Query hooks for fetching and saving nightly inventory.
 * All answers are encrypted before storage and decrypted on read.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { encryptContent, decryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import { generateId } from '../../../utils/id';
import { addToSyncQueue } from '../../../services/syncService';
import type { InventoryAnswer, PersonalInventory } from '../types';

// Database row shape
interface PersonalInventoryRow {
  id: string;
  user_id: string;
  check_date: string;
  encrypted_answers: string;
  encrypted_notes: string | null;
  created_at: string;
  updated_at: string;
  synced: number;
  supabase_id: string | null;
}

// Query keys
const inventoryKeys = {
  all: ['personal-inventory'] as const,
  byUser: (userId: string) => [...inventoryKeys.all, userId] as const,
  byDate: (userId: string, date: string) => [...inventoryKeys.all, userId, date] as const,
};

/**
 * Decrypt a personal inventory row into a PersonalInventory object
 */
async function decryptInventory(row: PersonalInventoryRow): Promise<PersonalInventory> {
  const answersJson = await decryptContent(row.encrypted_answers);
  const answers: InventoryAnswer[] = JSON.parse(answersJson) as InventoryAnswer[];
  const notes = row.encrypted_notes ? await decryptContent(row.encrypted_notes) : undefined;

  return {
    id: row.id,
    userId: row.user_id,
    checkDate: row.check_date,
    answers,
    notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Hook to fetch today's personal inventory
 */
export function useTodayInventory(userId: string): {
  inventory: PersonalInventory | null;
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
  refetch: () => Promise<unknown>;
} {
  const { db, isReady } = useDatabase();
  const today = new Date().toISOString().split('T')[0];

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: inventoryKeys.byDate(userId, today),
    queryFn: async (): Promise<PersonalInventory | null> => {
      if (!db || !isReady) return null;

      try {
        const row = await db.getFirstAsync<PersonalInventoryRow>(
          'SELECT * FROM personal_inventory WHERE user_id = ? AND check_date = ?',
          [userId, today],
        );

        if (!row) return null;
        return await decryptInventory(row);
      } catch (err) {
        logger.error('Failed to fetch today inventory', err);
        return null;
      }
    },
    enabled: isReady && !!db,
    staleTime: 60 * 1000,
  });

  return {
    inventory: data ?? null,
    isLoading,
    error: error as Error | null,
    isFetching,
    refetch,
  };
}

// Mutation variables
interface SaveInventoryVariables {
  answers: InventoryAnswer[];
  notes?: string;
}

/**
 * Hook to save a personal inventory with optimistic updates
 */
export function useSaveInventory(userId: string): {
  saveInventory: (data: SaveInventoryVariables) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const mutation = useMutation<
    void,
    Error,
    SaveInventoryVariables,
    { previousData: PersonalInventory | null | undefined }
  >({
    mutationKey: ['saveInventory', userId],

    mutationFn: async (data: SaveInventoryVariables): Promise<void> => {
      if (!db) throw new Error('Database not initialized');

      const now = new Date().toISOString();
      const encryptedAnswers = await encryptContent(JSON.stringify(data.answers));
      const encryptedNotes = data.notes ? await encryptContent(data.notes) : null;

      // Check if inventory already exists for today
      const existing = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM personal_inventory WHERE user_id = ? AND check_date = ?',
        [userId, today],
      );

      if (existing) {
        // Update existing
        await db.runAsync(
          `UPDATE personal_inventory
           SET encrypted_answers = ?, encrypted_notes = ?, updated_at = ?, synced = 0
           WHERE id = ? AND user_id = ?`,
          [encryptedAnswers, encryptedNotes, now, existing.id, userId],
        );
        await addToSyncQueue(db, 'personal_inventory', existing.id, 'update');
        logger.info('Inventory updated', { id: existing.id });
      } else {
        // Insert new
        const id = generateId('inv');
        await db.runAsync(
          `INSERT INTO personal_inventory (id, user_id, check_date, encrypted_answers, encrypted_notes, created_at, updated_at, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
          [id, userId, today, encryptedAnswers, encryptedNotes, now, now],
        );
        await addToSyncQueue(db, 'personal_inventory', id, 'insert');
        logger.info('Inventory created', { id });
      }
    },

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: inventoryKeys.byDate(userId, today) });

      const previousData = queryClient.getQueryData<PersonalInventory | null>(
        inventoryKeys.byDate(userId, today),
      );

      const optimistic: PersonalInventory = {
        id: previousData?.id ?? 'temp-' + Date.now(),
        userId,
        checkDate: today,
        answers: variables.answers,
        notes: variables.notes,
        createdAt: previousData?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(inventoryKeys.byDate(userId, today), optimistic);

      return { previousData };
    },

    onError: (error, _variables, context) => {
      logger.error('Failed to save inventory', error);
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(inventoryKeys.byDate(userId, today), context.previousData);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.byDate(userId, today) });
    },
  });

  return {
    saveInventory: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

export { inventoryKeys };
