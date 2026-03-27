import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { decryptContent, encryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import { generateId } from '../../../utils/id';
import { addDeleteToSyncQueue, addToSyncQueue } from '../../../services/syncService';

export type PersonalInventoryCategory = 'resentment' | 'fear' | 'sex_conduct';
export type PersonalInventorySyncStatus = 'pending' | 'synced' | 'error';

interface PersonalInventoryRow {
  id: string;
  user_id: string;
  encrypted_person_name: string | null;
  encrypted_resentment: string | null;
  encrypted_my_part: string | null;
  encrypted_impact: string | null;
  category: PersonalInventoryCategory;
  created_at: string;
  updated_at: string;
  sync_status: PersonalInventorySyncStatus;
  supabase_id: string | null;
}

export interface PersonalInventoryEntry {
  id: string;
  user_id: string;
  person_name: string | null;
  resentment: string | null;
  my_part: string | null;
  impact: string | null;
  category: PersonalInventoryCategory;
  created_at: string;
  updated_at: string;
  sync_status: PersonalInventorySyncStatus;
  supabase_id: string | null;
}

export interface PersonalInventoryCreateInput {
  person_name: string | null;
  resentment: string | null;
  my_part: string | null;
  impact: string | null;
  category: PersonalInventoryCategory;
}

export type PersonalInventoryUpdateInput = Partial<PersonalInventoryCreateInput>;

const personalInventoryKeys = {
  all: ['personal_inventory'] as const,
  byUser: (userId: string) => [...personalInventoryKeys.all, userId] as const,
  byId: (userId: string, id: string) => [...personalInventoryKeys.byUser(userId), id] as const,
};

async function decryptPersonalInventory(row: PersonalInventoryRow): Promise<PersonalInventoryEntry> {
  const personName = row.encrypted_person_name
    ? await decryptContent(row.encrypted_person_name)
    : null;
  const resentment = row.encrypted_resentment ? await decryptContent(row.encrypted_resentment) : null;
  const myPart = row.encrypted_my_part ? await decryptContent(row.encrypted_my_part) : null;
  const impact = row.encrypted_impact ? await decryptContent(row.encrypted_impact) : null;

  return {
    id: row.id,
    user_id: row.user_id,
    person_name: personName,
    resentment,
    my_part: myPart,
    impact,
    category: row.category,
    created_at: row.created_at,
    updated_at: row.updated_at,
    sync_status: row.sync_status,
    supabase_id: row.supabase_id,
  };
}

async function encryptOptionalContent(value: string | null | undefined): Promise<string | null> {
  if (value === null || value === undefined) {
    return null;
  }

  return await encryptContent(value);
}

export function usePersonalInventory(userId: string): {
  entries: PersonalInventoryEntry[];
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
    queryKey: personalInventoryKeys.byUser(userId),
    queryFn: async (): Promise<PersonalInventoryEntry[]> => {
      if (!db || !isReady) {
        throw new Error('Database not ready');
      }

      try {
        const rows = await db.getAllAsync<PersonalInventoryRow>(
          'SELECT * FROM personal_inventory WHERE user_id = ? ORDER BY created_at DESC',
          [userId],
        );

        const settled = await Promise.allSettled(rows.map(decryptPersonalInventory));
        return settled.flatMap((result, index) => {
          if (result.status === 'fulfilled') {
            return [result.value];
          }

          logger.error('Failed to decrypt personal inventory entry', {
            entryId: rows[index]?.id,
          });
          return [];
        });
      } catch (err) {
        logger.error('Failed to fetch personal inventory entries', err);
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
    refetch: async () => {
      await refetch();
    },
  };
}

interface CreatePersonalInventoryVariables {
  entry: PersonalInventoryCreateInput;
}

export function useCreatePersonalInventory(userId: string): {
  createEntry: (entry: PersonalInventoryCreateInput) => Promise<string>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    string,
    Error,
    CreatePersonalInventoryVariables,
    { previousEntries: PersonalInventoryEntry[] | undefined }
  >({
    mutationKey: ['createPersonalInventory', userId],
    mutationFn: async ({ entry }: CreatePersonalInventoryVariables) => {
      if (!db) throw new Error('Database not initialized');

      const id = generateId('inventory');
      const now = new Date().toISOString();

      const encryptedPersonName = await encryptOptionalContent(entry.person_name);
      const encryptedResentment = await encryptOptionalContent(entry.resentment);
      const encryptedMyPart = await encryptOptionalContent(entry.my_part);
      const encryptedImpact = await encryptOptionalContent(entry.impact);

      await db.runAsync(
        `INSERT INTO personal_inventory (
          id,
          user_id,
          encrypted_person_name,
          encrypted_resentment,
          encrypted_my_part,
          encrypted_impact,
          category,
          created_at,
          updated_at,
          sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          encryptedPersonName,
          encryptedResentment,
          encryptedMyPart,
          encryptedImpact,
          entry.category,
          now,
          now,
          'pending',
        ],
      );

      await addToSyncQueue(db, 'personal_inventory', id, 'insert');

      logger.info('Personal inventory entry created', { id });
      return id;
    },
    onMutate: async ({ entry }) => {
      await queryClient.cancelQueries({ queryKey: personalInventoryKeys.byUser(userId) });

      const previousEntries = queryClient.getQueryData<PersonalInventoryEntry[]>(
        personalInventoryKeys.byUser(userId),
      );

      const optimisticEntry: PersonalInventoryEntry = {
        id: 'temp-' + Date.now(),
        user_id: userId,
        person_name: entry.person_name,
        resentment: entry.resentment,
        my_part: entry.my_part,
        impact: entry.impact,
        category: entry.category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
        supabase_id: null,
      };

      queryClient.setQueryData(personalInventoryKeys.byUser(userId), [
        optimisticEntry,
        ...(previousEntries || []),
      ]);

      return { previousEntries };
    },
    onError: (error, _variables, context) => {
      logger.error('Failed to create personal inventory entry', error);
      if (context?.previousEntries) {
        queryClient.setQueryData(personalInventoryKeys.byUser(userId), context.previousEntries);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalInventoryKeys.byUser(userId) });
    },
  });

  return {
    createEntry: (entry: PersonalInventoryCreateInput) => mutation.mutateAsync({ entry }),
    isPending: mutation.isPending,
  };
}

interface UpdatePersonalInventoryVariables {
  id: string;
  entry: PersonalInventoryUpdateInput;
}

export function useUpdatePersonalInventory(userId: string): {
  updateEntry: (id: string, entry: PersonalInventoryUpdateInput) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    Error,
    UpdatePersonalInventoryVariables,
    { previousEntries: PersonalInventoryEntry[] | undefined }
  >({
    mutationKey: ['updatePersonalInventory', userId],
    mutationFn: async ({ id, entry }: UpdatePersonalInventoryVariables) => {
      if (!db) throw new Error('Database not initialized');

      const now = new Date().toISOString();
      const updates: string[] = [];
      const values: (string | null)[] = [];

      if (entry.person_name !== undefined) {
        updates.push('encrypted_person_name = ?');
        values.push(await encryptOptionalContent(entry.person_name));
      }

      if (entry.resentment !== undefined) {
        updates.push('encrypted_resentment = ?');
        values.push(await encryptOptionalContent(entry.resentment));
      }

      if (entry.my_part !== undefined) {
        updates.push('encrypted_my_part = ?');
        values.push(await encryptOptionalContent(entry.my_part));
      }

      if (entry.impact !== undefined) {
        updates.push('encrypted_impact = ?');
        values.push(await encryptOptionalContent(entry.impact));
      }

      if (entry.category !== undefined) {
        updates.push('category = ?');
        values.push(entry.category);
      }

      updates.push('updated_at = ?');
      values.push(now);
      updates.push('sync_status = ?');
      values.push('pending');
      values.push(id);
      values.push(userId);

      await db.runAsync(
        `UPDATE personal_inventory SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        values,
      );

      await addToSyncQueue(db, 'personal_inventory', id, 'update');

      logger.info('Personal inventory entry updated', { id });
    },
    onMutate: async ({ id, entry }) => {
      await queryClient.cancelQueries({ queryKey: personalInventoryKeys.byUser(userId) });

      const previousEntries = queryClient.getQueryData<PersonalInventoryEntry[]>(
        personalInventoryKeys.byUser(userId),
      );

      if (previousEntries) {
        const optimisticEntries = previousEntries.map((existing) =>
          existing.id === id
            ? {
                ...existing,
                ...entry,
                updated_at: new Date().toISOString(),
                sync_status: 'pending' as const,
              }
            : existing,
        );

        queryClient.setQueryData(personalInventoryKeys.byUser(userId), optimisticEntries);
      }

      return { previousEntries };
    },
    onError: (error, _variables, context) => {
      logger.error('Failed to update personal inventory entry', error);
      if (context?.previousEntries) {
        queryClient.setQueryData(personalInventoryKeys.byUser(userId), context.previousEntries);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalInventoryKeys.byUser(userId) });
    },
  });

  return {
    updateEntry: (id: string, entry: PersonalInventoryUpdateInput) =>
      mutation.mutateAsync({ id, entry }),
    isPending: mutation.isPending,
  };
}

export function useDeletePersonalInventory(userId: string): {
  deleteEntry: (id: string) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    Error,
    string,
    { previousEntries: PersonalInventoryEntry[] | undefined }
  >({
    mutationKey: ['deletePersonalInventory', userId],
    mutationFn: async (id: string) => {
      if (!db) throw new Error('Database not initialized');

      await addDeleteToSyncQueue(db, 'personal_inventory', id, userId);

      await db.runAsync('DELETE FROM personal_inventory WHERE id = ? AND user_id = ?', [
        id,
        userId,
      ]);

      logger.info('Personal inventory entry deleted', { id });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: personalInventoryKeys.byUser(userId) });

      const previousEntries = queryClient.getQueryData<PersonalInventoryEntry[]>(
        personalInventoryKeys.byUser(userId),
      );

      if (previousEntries) {
        queryClient.setQueryData(
          personalInventoryKeys.byUser(userId),
          previousEntries.filter((entry) => entry.id !== id),
        );
      }

      return { previousEntries };
    },
    onError: (error, _id, context) => {
      logger.error('Failed to delete personal inventory entry', error);
      if (context?.previousEntries) {
        queryClient.setQueryData(personalInventoryKeys.byUser(userId), context.previousEntries);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalInventoryKeys.byUser(userId) });
    },
  });

  return {
    deleteEntry: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

export { personalInventoryKeys };
