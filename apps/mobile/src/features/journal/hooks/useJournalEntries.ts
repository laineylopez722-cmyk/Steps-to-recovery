import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { decryptContent, encryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import { generateId } from '../../../utils/id';
import { addToSyncQueue, addDeleteToSyncQueue } from '../../../services/syncService';
import type { JournalEntryDb as JournalEntry, JournalEntryDecrypted } from '@recovery/shared';

// Query keys for journal entries
const journalKeys = {
  all: ['journal_entries'] as const,
  byUser: (userId: string) => [...journalKeys.all, userId] as const,
  byId: (userId: string, id: string) => [...journalKeys.byUser(userId), id] as const,
};

/**
 * Decrypt a journal entry from database format to UI format
 */
async function decryptJournalEntry(entry: JournalEntry): Promise<JournalEntryDecrypted> {
  const title = entry.encrypted_title ? await decryptContent(entry.encrypted_title) : null;
  const body = await decryptContent(entry.encrypted_body);
  const mood = entry.encrypted_mood
    ? parseInt(await decryptContent(entry.encrypted_mood), 10)
    : null;
  const craving = entry.encrypted_craving
    ? parseInt(await decryptContent(entry.encrypted_craving), 10)
    : null;
  const tags = entry.encrypted_tags ? JSON.parse(await decryptContent(entry.encrypted_tags)) : [];

  return {
    id: entry.id,
    user_id: entry.user_id,
    title,
    body,
    mood,
    craving,
    tags,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
    sync_status: entry.sync_status,
    supabase_id: entry.supabase_id,
  };
}

/**
 * Hook to fetch all journal entries for the current user
 * - Returns cached data immediately (stale-while-revalidate)
 * - Persists across app restarts
 * - Auto-refreshes when app comes to foreground
 */
export function useJournalEntries(userId: string): {
  entries: JournalEntryDecrypted[];
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
    queryKey: journalKeys.byUser(userId),
    queryFn: async () => {
      if (!db || !isReady) {
        throw new Error('Database not ready');
      }
      try {
        const result = await db.getAllAsync<JournalEntry>(
          'SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC',
          [userId],
        );

        const decrypted = await Promise.all(result.map(decryptJournalEntry));
        return decrypted;
      } catch (err) {
        logger.error('Failed to fetch journal entries', err);
        throw err;
      }
    },
    enabled: isReady && !!db,
    // Cache for 5 minutes - journal entries don't change often
    staleTime: 5 * 60 * 1000,
    // Keep data for 24 hours for offline support
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

// Type for create entry variables
interface CreateEntryVariables {
  entry: Omit<
    JournalEntryDecrypted,
    'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_status' | 'supabase_id'
  >;
}

/**
 * Hook to create a new journal entry with optimistic updates
 * - Updates UI immediately before server responds
 * - Rolls back on error
 * - Queues for sync if offline
 */
export function useCreateJournalEntry(userId: string): {
  createEntry: (
    entry: Omit<
      JournalEntryDecrypted,
      'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_status' | 'supabase_id'
    >,
  ) => Promise<string>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    string,
    Error,
    CreateEntryVariables,
    { previousEntries: JournalEntryDecrypted[] | undefined }
  >({
    mutationKey: ['createJournalEntry', userId],
    mutationFn: async ({ entry }: CreateEntryVariables) => {
      if (!db) throw new Error('Database not initialized');

      const id = generateId('journal');
      const now = new Date().toISOString();

      const encrypted_title = entry.title ? await encryptContent(entry.title) : null;
      const encrypted_body = await encryptContent(entry.body);
      const encrypted_mood =
        entry.mood !== null ? await encryptContent(entry.mood.toString()) : null;
      const encrypted_craving =
        entry.craving !== null ? await encryptContent(entry.craving.toString()) : null;
      const encrypted_tags =
        entry.tags.length > 0 ? await encryptContent(JSON.stringify(entry.tags)) : null;

      await db.runAsync(
        `INSERT INTO journal_entries (id, user_id, encrypted_title, encrypted_body, encrypted_mood, encrypted_craving, encrypted_tags, created_at, updated_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          encrypted_title,
          encrypted_body,
          encrypted_mood,
          encrypted_craving,
          encrypted_tags,
          now,
          now,
          'pending',
        ],
      );

      // Add to sync queue for cloud backup
      await addToSyncQueue(db, 'journal_entries', id, 'insert');

      logger.info('Journal entry created', { id });
      return id;
    },

    // Optimistically update the UI immediately
    onMutate: async ({ entry }) => {
      await queryClient.cancelQueries({ queryKey: journalKeys.byUser(userId) });

      const previousEntries = queryClient.getQueryData<JournalEntryDecrypted[]>(
        journalKeys.byUser(userId),
      );

      const optimisticEntry: JournalEntryDecrypted = {
        ...entry,
        id: 'temp-' + Date.now(),
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
        supabase_id: null,
      };

      // Add new entry to the beginning of the list
      queryClient.setQueryData(journalKeys.byUser(userId), [
        optimisticEntry,
        ...(previousEntries || []),
      ]);

      return { previousEntries };
    },

    onError: (error, _variables, context) => {
      logger.error('Failed to create journal entry', error);
      if (context?.previousEntries) {
        queryClient.setQueryData(journalKeys.byUser(userId), context.previousEntries);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.byUser(userId) });
    },
  });

  return {
    createEntry: (entry) => mutation.mutateAsync({ entry }),
    isPending: mutation.isPending,
  };
}


// Type for update entry variables
interface UpdateEntryVariables {
  id: string;
  entry: Partial<
    Omit<
      JournalEntryDecrypted,
      'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_status' | 'supabase_id'
    >
  >;
}

/**
 * Hook to update an existing journal entry with optimistic updates
 */
export function useUpdateJournalEntry(userId: string): {
  updateEntry: (
    id: string,
    entry: Partial<
      Omit<
        JournalEntryDecrypted,
        'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_status' | 'supabase_id'
      >
    >,
  ) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    Error,
    UpdateEntryVariables,
    { previousEntries: JournalEntryDecrypted[] | undefined }
  >({
    mutationKey: ['updateJournalEntry', userId],
    mutationFn: async ({ id, entry }: UpdateEntryVariables) => {
      if (!db) throw new Error('Database not initialized');

      const now = new Date().toISOString();
      const updates: string[] = [];
      const values: (string | null)[] = [];

      if (entry.title !== undefined) {
        updates.push('encrypted_title = ?');
        values.push(entry.title ? await encryptContent(entry.title) : null);
      }
      if (entry.body !== undefined) {
        updates.push('encrypted_body = ?');
        values.push(await encryptContent(entry.body));
      }
      if (entry.mood !== undefined) {
        updates.push('encrypted_mood = ?');
        values.push(entry.mood !== null ? await encryptContent(entry.mood.toString()) : null);
      }
      if (entry.craving !== undefined) {
        updates.push('encrypted_craving = ?');
        values.push(entry.craving !== null ? await encryptContent(entry.craving.toString()) : null);
      }
      if (entry.tags !== undefined) {
        updates.push('encrypted_tags = ?');
        values.push(
          entry.tags.length > 0 ? await encryptContent(JSON.stringify(entry.tags)) : null,
        );
      }

      updates.push('updated_at = ?');
      values.push(now);
      updates.push('sync_status = ?');
      values.push('pending');

      values.push(id);
      values.push(userId);

      await db.runAsync(
        `UPDATE journal_entries SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        values,
      );

      // Add to sync queue for cloud backup
      await addToSyncQueue(db, 'journal_entries', id, 'update');

      logger.info('Journal entry updated', { id });
    },

    onMutate: async ({ id, entry }) => {
      await queryClient.cancelQueries({ queryKey: journalKeys.byUser(userId) });

      const previousEntries = queryClient.getQueryData<JournalEntryDecrypted[]>(
        journalKeys.byUser(userId),
      );

      if (previousEntries) {
        const optimisticEntries = previousEntries.map((e) =>
          e.id === id ? { ...e, ...entry, updated_at: new Date().toISOString() } : e,
        );

        queryClient.setQueryData(journalKeys.byUser(userId), optimisticEntries);
      }

      return { previousEntries };
    },

    onError: (error, _variables, context) => {
      logger.error('Failed to update journal entry', error);
      if (context?.previousEntries) {
        queryClient.setQueryData(journalKeys.byUser(userId), context.previousEntries);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.byUser(userId) });
    },
  });

  return {
    updateEntry: (id, entry) => mutation.mutateAsync({ id, entry }),
    isPending: mutation.isPending,
  };
}

/**
 * Hook to delete a journal entry with optimistic removal
 */
export function useDeleteJournalEntry(userId: string): {
  deleteEntry: (id: string) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    Error,
    string,
    { previousEntries: JournalEntryDecrypted[] | undefined }
  >({
    mutationKey: ['deleteJournalEntry', userId],
    mutationFn: async (id: string) => {
      if (!db) throw new Error('Database not initialized');

      // Capture supabase_id and add to sync queue BEFORE deleting
      await addDeleteToSyncQueue(db, 'journal_entries', id, userId);

      await db.runAsync('DELETE FROM journal_entries WHERE id = ? AND user_id = ?', [id, userId]);
      logger.info('Journal entry deleted', { id });
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: journalKeys.byUser(userId) });

      const previousEntries = queryClient.getQueryData<JournalEntryDecrypted[]>(
        journalKeys.byUser(userId),
      );

      if (previousEntries) {
        const optimisticEntries = previousEntries.filter((e) => e.id !== id);
        queryClient.setQueryData(journalKeys.byUser(userId), optimisticEntries);
      }

      return { previousEntries };
    },

    onError: (error, _id, context) => {
      logger.error('Failed to delete journal entry', error);
      if (context?.previousEntries) {
        queryClient.setQueryData(journalKeys.byUser(userId), context.previousEntries);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.byUser(userId) });
    },
  });

  return {
    deleteEntry: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

// Re-export query keys for use in other components
export { journalKeys };

// ============================================================
// Update Journal Audio
// ============================================================

/**
 * Saves encrypted audio to an existing journal entry.
 * Called after recording is finalised in JournalEditorScreen.
 */
export function useUpdateJournalAudio(userId: string): {
  saveAudio: (entryId: string, encryptedAudio: string | null) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, { entryId: string; encryptedAudio: string | null }>({
    mutationKey: ['updateJournalAudio', userId],
    mutationFn: async ({ entryId, encryptedAudio }) => {
      if (!db) throw new Error('Database not initialized');

      await db.runAsync(
        'UPDATE journal_entries SET encrypted_audio = ?, updated_at = ? WHERE id = ? AND user_id = ?',
        [encryptedAudio, new Date().toISOString(), entryId, userId],
      );

      await addToSyncQueue(db, 'journal_entries', entryId, 'update');
      logger.info('Journal audio saved', { entryId, hasAudio: encryptedAudio !== null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.byUser(userId) });
    },
    onError: (error) => {
      logger.error('Failed to save journal audio', error);
    },
  });

  return {
    saveAudio: (entryId, encryptedAudio) => mutation.mutateAsync({ entryId, encryptedAudio }),
    isPending: mutation.isPending,
  };
}
