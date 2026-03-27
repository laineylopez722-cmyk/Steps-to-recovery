import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { decryptContent, encryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import { generateId } from '../../../utils/id';
import { addDeleteToSyncQueue, addToSyncQueue } from '../../../services/syncService';

type GratitudeItems = [string, string, string];

interface GratitudeEntryDb {
  id: string;
  user_id: string;
  entry_date: string;
  encrypted_item_1: string;
  encrypted_item_2: string;
  encrypted_item_3: string;
  created_at: string;
  updated_at: string;
  sync_status: string;
  supabase_id: string | null;
}

interface GratitudeEntry {
  id: string;
  user_id: string;
  entry_date: string;
  items: GratitudeItems;
  created_at: string;
  updated_at: string;
  sync_status: string;
  supabase_id: string | null;
}

interface CreateGratitudeEntryVariables {
  entry_date: string;
  items: GratitudeItems;
}

interface UpdateGratitudeEntryVariables {
  entry_date?: string;
  items?: GratitudeItems;
}

const gratitudeEntryKeys = {
  all: ['gratitude_entries'] as const,
  byUser: (userId: string) => [...gratitudeEntryKeys.all, userId] as const,
  byId: (userId: string, id: string) => [...gratitudeEntryKeys.byUser(userId), id] as const,
};

async function decryptGratitudeEntry(entry: GratitudeEntryDb): Promise<GratitudeEntry> {
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
    supabase_id: entry.supabase_id,
  };
}

export function useGratitudeEntries(userId: string): {
  entries: GratitudeEntry[];
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
    queryKey: gratitudeEntryKeys.byUser(userId),
    queryFn: async () => {
      if (!db || !isReady) {
        throw new Error('Database not ready');
      }

      try {
        const rows = await db.getAllAsync<GratitudeEntryDb>(
          'SELECT * FROM gratitude_entries WHERE user_id = ? ORDER BY entry_date DESC',
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
      } catch (error_) {
        logger.error('Failed to fetch gratitude entries', error_);
        throw error_;
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
    refetch: async () => {
      await refetch();
    },
  };
}

interface CreateGratitudeEntryInput {
  entry_date: string;
  items: GratitudeItems;
}

export function useCreateGratitudeEntry(userId: string): {
  createEntry: (entry: CreateGratitudeEntryInput) => Promise<string>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    string,
    Error,
    CreateGratitudeEntryInput,
    { previousEntries: GratitudeEntry[] | undefined }
  >({
    mutationKey: ['createGratitudeEntry', userId],
    mutationFn: async (entry) => {
      if (!db) {
        throw new Error('Database not initialized');
      }

      const id = generateId('gratitude');
      const now = new Date().toISOString();
      const [encryptedItem1, encryptedItem2, encryptedItem3] = await Promise.all(
        entry.items.map((item) => encryptContent(item)),
      );

      await db.runAsync(
        `INSERT INTO gratitude_entries (
          id, user_id, entry_date, encrypted_item_1, encrypted_item_2, encrypted_item_3,
          created_at, updated_at, sync_status
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

      logger.info('Gratitude entry created', { id });
      return id;
    },
    onMutate: async (entry) => {
      await queryClient.cancelQueries({ queryKey: gratitudeEntryKeys.byUser(userId) });

      const previousEntries = queryClient.getQueryData<GratitudeEntry[]>(
        gratitudeEntryKeys.byUser(userId),
      );

      const optimisticEntry: GratitudeEntry = {
        id: `temp-${Date.now()}`,
        user_id: userId,
        entry_date: entry.entry_date,
        items: entry.items,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
        supabase_id: null,
      };

      queryClient.setQueryData(gratitudeEntryKeys.byUser(userId), [
        optimisticEntry,
        ...(previousEntries || []),
      ]);

      return { previousEntries };
    },
    onError: (error, _entry, context) => {
      logger.error('Failed to create gratitude entry', error);
      queryClient.setQueryData(
        gratitudeEntryKeys.byUser(userId),
        context?.previousEntries ?? [],
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gratitudeEntryKeys.byUser(userId) });
    },
  });

  return {
    createEntry: (entry) => mutation.mutateAsync(entry),
    isPending: mutation.isPending,
  };
}

interface UpdateGratitudeEntryInput {
  entry_date?: string;
  items?: GratitudeItems;
}

export function useUpdateGratitudeEntry(userId: string): {
  updateEntry: (id: string, entry: UpdateGratitudeEntryInput) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    Error,
    { id: string; entry: UpdateGratitudeEntryInput },
    { previousEntries: GratitudeEntry[] | undefined }
  >({
    mutationKey: ['updateGratitudeEntry', userId],
    mutationFn: async ({ id, entry }) => {
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
        const [encryptedItem1, encryptedItem2, encryptedItem3] = await Promise.all(
          entry.items.map((item) => encryptContent(item)),
        );
        updates.push('encrypted_item_1 = ?', 'encrypted_item_2 = ?', 'encrypted_item_3 = ?');
        values.push(encryptedItem1, encryptedItem2, encryptedItem3);
      }

      updates.push('updated_at = ?');
      values.push(now);
      updates.push('sync_status = ?');
      values.push('pending');

      values.push(id, userId);

      await db.runAsync(
        `UPDATE gratitude_entries SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        values,
      );

      await addToSyncQueue(db, 'gratitude_entries', id, 'update');

      logger.info('Gratitude entry updated', { id });
    },
    onMutate: async ({ id, entry }) => {
      await queryClient.cancelQueries({ queryKey: gratitudeEntryKeys.byUser(userId) });

      const previousEntries = queryClient.getQueryData<GratitudeEntry[]>(
        gratitudeEntryKeys.byUser(userId),
      );

      const optimisticEntries = (previousEntries || []).map((existingEntry) =>
        existingEntry.id === id
          ? {
              ...existingEntry,
              ...entry,
              updated_at: new Date().toISOString(),
            }
          : existingEntry,
      );

      queryClient.setQueryData(gratitudeEntryKeys.byUser(userId), optimisticEntries);

      return { previousEntries };
    },
    onError: (error, _variables, context) => {
      logger.error('Failed to update gratitude entry', error);
      queryClient.setQueryData(
        gratitudeEntryKeys.byUser(userId),
        context?.previousEntries ?? [],
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gratitudeEntryKeys.byUser(userId) });
    },
  });

  return {
    updateEntry: (id, entry) => mutation.mutateAsync({ id, entry }),
    isPending: mutation.isPending,
  };
}

export function useDeleteGratitudeEntry(userId: string): {
  deleteEntry: (id: string) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    Error,
    string,
    { previousEntries: GratitudeEntry[] | undefined }
  >({
    mutationKey: ['deleteGratitudeEntry', userId],
    mutationFn: async (id: string) => {
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: gratitudeEntryKeys.byUser(userId) });

      const previousEntries = queryClient.getQueryData<GratitudeEntry[]>(
        gratitudeEntryKeys.byUser(userId),
      );

      const optimisticEntries = (previousEntries || []).filter((entry) => entry.id !== id);
      queryClient.setQueryData(gratitudeEntryKeys.byUser(userId), optimisticEntries);

      return { previousEntries };
    },
    onError: (error, _id, context) => {
      logger.error('Failed to delete gratitude entry', error);
      queryClient.setQueryData(
        gratitudeEntryKeys.byUser(userId),
        context?.previousEntries ?? [],
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gratitudeEntryKeys.byUser(userId) });
    },
  });

  return {
    deleteEntry: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

export { gratitudeEntryKeys };
export { gratitudeEntryKeys as gratitudeKeys };
