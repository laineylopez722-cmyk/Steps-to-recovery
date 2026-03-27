import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '@/contexts/DatabaseContext';
import { addDeleteToSyncQueue, addToSyncQueue } from '@/services/syncService';
import { encryptContent, decryptContent } from '@/utils/encryption';
import { generateId } from '@/utils/id';
import { logger } from '@/utils/logger';

export interface GratitudeEntryDb {
  id: string;
  user_id: string;
  entry_date: string;
  encrypted_item_1: string;
  encrypted_item_2: string;
  encrypted_item_3: string;
  created_at: string;
  updated_at: string;
  sync_status?: string;
  supabase_id?: string | null;
}

export interface GratitudeEntryDecrypted {
  id: string;
  user_id: string;
  entry_date: string;
  items: [string, string, string];
  created_at: string;
  updated_at: string;
  sync_status?: string;
  supabase_id?: string | null;
}

export interface GratitudeEntryInput {
  entry_date: string;
  items: [string, string, string];
}

const gratitudeKeys = {
  all: ['gratitude_entries'] as const,
  byUser: (userId: string) => [...gratitudeKeys.all, userId] as const,
  byId: (userId: string, id: string) => [...gratitudeKeys.byUser(userId), id] as const,
};

async function decryptGratitudeEntry(entry: GratitudeEntryDb): Promise<GratitudeEntryDecrypted> {
  const [item1, item2, item3] = await Promise.all([
    decryptContent(entry.encrypted_item_1),
    decryptContent(entry.encrypted_item_2),
    decryptContent(entry.encrypted_item_3),
  ]);

  return {
    id: entry.id,
    user_id: entry.user_id,
    entry_date: entry.entry_date,
    items: [item1, item2, item3],
    created_at: entry.created_at,
    updated_at: entry.updated_at,
    sync_status: entry.sync_status,
    supabase_id: entry.supabase_id ?? null,
  };
}

export function useGratitudeEntries(userId: string): {
  entries: GratitudeEntryDecrypted[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { db, isReady } = useDatabase();

  const {
    data: entries = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: gratitudeKeys.byUser(userId),
    queryFn: async (): Promise<GratitudeEntryDecrypted[]> => {
      if (!db || !isReady) {
        throw new Error('Database not ready');
      }

      try {
        const rows = await db.getAllAsync<GratitudeEntryDb>(
          'SELECT * FROM gratitude_entries WHERE user_id = ? ORDER BY entry_date DESC, created_at DESC',
          [userId],
        );

        const settled = await Promise.allSettled(rows.map(decryptGratitudeEntry));
        return settled.flatMap((result, index) => {
          if (result.status === 'fulfilled') {
            return [result.value];
          }

          logger.error('Failed to decrypt gratitude entry', {
            entryId: rows[index]?.id,
          });
          return [];
        });
      } catch (err) {
        logger.error('Failed to fetch gratitude entries', err);
        throw err;
      }
    },
    enabled: isReady && !!db,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  return {
    entries,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch: async (): Promise<void> => {
      await refetch();
    },
  };
}

interface CreateGratitudeEntryVariables {
  entry: GratitudeEntryInput;
}

export function useCreateGratitudeEntry(userId: string): {
  createEntry: (entry: GratitudeEntryInput) => Promise<string>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<string, Error, CreateGratitudeEntryVariables>({
    mutationKey: ['createGratitudeEntry', userId],
    mutationFn: async ({ entry }: CreateGratitudeEntryVariables): Promise<string> => {
      if (!db) {
        throw new Error('Database not initialized');
      }

      const id = generateId('gratitude');
      const now = new Date().toISOString();
      const [encryptedItem1, encryptedItem2, encryptedItem3] = await Promise.all([
        encryptContent(entry.items[0]),
        encryptContent(entry.items[1]),
        encryptContent(entry.items[2]),
      ]);

      await db.runAsync(
        `INSERT INTO gratitude_entries (
          id,
          user_id,
          entry_date,
          encrypted_item_1,
          encrypted_item_2,
          encrypted_item_3,
          created_at,
          updated_at,
          sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          entry.entry_date,
          encryptedItem1,
          encryptedItem2,
          encryptedItem3,
          now,
          now,
          'pending',
        ],
      );

      await addToSyncQueue(db, 'gratitude_entries', id, 'insert');
      logger.info('Gratitude entry created', { id, entryDate: entry.entry_date });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gratitudeKeys.byUser(userId) });
    },
    onError: (err) => {
      logger.error('Failed to create gratitude entry', err);
    },
  });

  return {
    createEntry: (entry: GratitudeEntryInput): Promise<string> => mutation.mutateAsync({ entry }),
    isPending: mutation.isPending,
  };
}

interface UpdateGratitudeEntryVariables {
  id: string;
  entry: Partial<GratitudeEntryInput>;
}

export function useUpdateGratitudeEntry(userId: string): {
  updateEntry: (id: string, entry: Partial<GratitudeEntryInput>) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, UpdateGratitudeEntryVariables>({
    mutationKey: ['updateGratitudeEntry', userId],
    mutationFn: async ({ id, entry }: UpdateGratitudeEntryVariables): Promise<void> => {
      if (!db) {
        throw new Error('Database not initialized');
      }

      const now = new Date().toISOString();
      const updates: string[] = [];
      const values: Array<string | null> = [];

      if (entry.entry_date !== undefined) {
        updates.push('entry_date = ?');
        values.push(entry.entry_date);
      }

      if (entry.items !== undefined) {
        const [encryptedItem1, encryptedItem2, encryptedItem3] = await Promise.all([
          encryptContent(entry.items[0]),
          encryptContent(entry.items[1]),
          encryptContent(entry.items[2]),
        ]);

        updates.push('encrypted_item_1 = ?');
        values.push(encryptedItem1);
        updates.push('encrypted_item_2 = ?');
        values.push(encryptedItem2);
        updates.push('encrypted_item_3 = ?');
        values.push(encryptedItem3);
      }

      updates.push('updated_at = ?');
      values.push(now);
      updates.push('sync_status = ?');
      values.push('pending');

      values.push(id);
      values.push(userId);

      await db.runAsync(
        `UPDATE gratitude_entries SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        values,
      );

      await addToSyncQueue(db, 'gratitude_entries', id, 'update');
      logger.info('Gratitude entry updated', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gratitudeKeys.byUser(userId) });
    },
    onError: (err) => {
      logger.error('Failed to update gratitude entry', err);
    },
  });

  return {
    updateEntry: (id: string, entry: Partial<GratitudeEntryInput>): Promise<void> =>
      mutation.mutateAsync({ id, entry }),
    isPending: mutation.isPending,
  };
}

export function useDeleteGratitudeEntry(userId: string): {
  deleteEntry: (id: string) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, string>({
    mutationKey: ['deleteGratitudeEntry', userId],
    mutationFn: async (id: string): Promise<void> => {
      if (!db) {
        throw new Error('Database not initialized');
      }

      await addDeleteToSyncQueue(db, 'gratitude_entries', id, userId);
      await db.runAsync('DELETE FROM gratitude_entries WHERE id = ? AND user_id = ?', [
        id,
        userId,
      ]);
      logger.info('Gratitude entry deleted', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gratitudeKeys.byUser(userId) });
    },
    onError: (err) => {
      logger.error('Failed to delete gratitude entry', err);
    },
  });

  return {
    deleteEntry: (id: string): Promise<void> => mutation.mutateAsync(id),
    isPending: mutation.isPending,
  };
}

export { gratitudeKeys };
