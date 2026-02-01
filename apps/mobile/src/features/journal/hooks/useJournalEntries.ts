import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { decryptContent, encryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import { generateId } from '../../../utils/id';
import { addToSyncQueue, addDeleteToSyncQueue } from '../../../services/syncService';
import type { JournalEntry } from '@recovery/shared/src/types/database';
import type { JournalEntryDecrypted } from '@recovery/shared/src/types/models';

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
 */
export function useJournalEntries(userId: string): {
  entries: JournalEntryDecrypted[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { db, isReady } = useDatabase();
  const {
    data: entries = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['journal_entries', userId],
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
  });

  return {
    entries,
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}

/**
 * Hook to create a new journal entry
 */
export function useCreateJournalEntry(userId: string): {
  createEntry: (
    entry: Omit<
      JournalEntryDecrypted,
      'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_status' | 'supabase_id'
    >,
  ) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (
      entry: Omit<
        JournalEntryDecrypted,
        'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_status' | 'supabase_id'
      >,
    ) => {
      try {
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

        if (!db) throw new Error('Database not initialized');

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
      } catch (err) {
        logger.error('Failed to create journal entry', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal_entries', userId] });
    },
  });

  return {
    createEntry: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

/**
 * Hook to update an existing journal entry
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

  const mutation = useMutation({
    mutationFn: async ({
      id,
      entry,
    }: {
      id: string;
      entry: Partial<
        Omit<
          JournalEntryDecrypted,
          'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_status' | 'supabase_id'
        >
      >;
    }) => {
      try {
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
          values.push(
            entry.craving !== null ? await encryptContent(entry.craving.toString()) : null,
          );
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

        if (!db) throw new Error('Database not initialized');

        await db.runAsync(
          `UPDATE journal_entries SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
          values,
        );

        // Add to sync queue for cloud backup
        await addToSyncQueue(db, 'journal_entries', id, 'update');

        logger.info('Journal entry updated', { id });
      } catch (err) {
        logger.error('Failed to update journal entry', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal_entries', userId] });
    },
  });

  return {
    updateEntry: (id, entry) => mutation.mutateAsync({ id, entry }),
    isPending: mutation.isPending,
  };
}

/**
 * Hook to delete a journal entry
 */
export function useDeleteJournalEntry(userId: string): {
  deleteEntry: (id: string) => Promise<void>;
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
        await addDeleteToSyncQueue(db, 'journal_entries', id, userId);

        await db.runAsync('DELETE FROM journal_entries WHERE id = ? AND user_id = ?', [id, userId]);
        logger.info('Journal entry deleted', { id });
      } catch (err) {
        logger.error('Failed to delete journal entry', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal_entries', userId] });
    },
  });

  return {
    deleteEntry: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
