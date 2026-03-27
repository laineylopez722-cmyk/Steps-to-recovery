import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { addDeleteToSyncQueue, addToSyncQueue } from '../../../services/syncService';
import { decryptContent, encryptContent } from '../../../utils/encryption';
import { generateId } from '../../../utils/id';
import { logger } from '../../../utils/logger';

export type PersonalInventoryCategory = 'resentment' | 'fear' | 'sex_conduct';

export interface PersonalInventoryDb {
  id: string;
  user_id: string;
  encrypted_person_name: string | null;
  encrypted_resentment: string | null;
  encrypted_my_part: string | null;
  encrypted_impact: string | null;
  category: PersonalInventoryCategory;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced' | 'error';
  supabase_id: string | null;
}

export interface PersonalInventoryDecrypted {
  id: string;
  user_id: string;
  person_name: string | null;
  resentment: string | null;
  my_part: string | null;
  impact: string | null;
  category: PersonalInventoryCategory;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced' | 'error';
  supabase_id: string | null;
}

const personalInventoryKeys = {
  all: ['personal_inventory'] as const,
  byUser: (userId: string) => [...personalInventoryKeys.all, userId] as const,
  byId: (userId: string, id: string) => [...personalInventoryKeys.byUser(userId), id] as const,
  byCategory: (userId: string, category: PersonalInventoryCategory) =>
    [...personalInventoryKeys.byUser(userId), category] as const,
};

async function decryptPersonalInventory(
  entry: PersonalInventoryDb,
): Promise<PersonalInventoryDecrypted> {
  const personName = entry.encrypted_person_name
    ? await decryptContent(entry.encrypted_person_name)
    : null;
  const resentment = entry.encrypted_resentment
    ? await decryptContent(entry.encrypted_resentment)
    : null;
  const myPart = entry.encrypted_my_part ? await decryptContent(entry.encrypted_my_part) : null;
  const impact = entry.encrypted_impact ? await decryptContent(entry.encrypted_impact) : null;

  return {
    id: entry.id,
    user_id: entry.user_id,
    person_name: personName,
    resentment,
    my_part: myPart,
    impact,
    category: entry.category,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
    sync_status: entry.sync_status,
    supabase_id: entry.supabase_id,
  };
}

export function usePersonalInventory(userId: string): {
  entries: PersonalInventoryDecrypted[];
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
    queryFn: async (): Promise<PersonalInventoryDecrypted[]> => {
      if (!db || !isReady) {
        throw new Error('Database not ready');
      }

      try {
        const rows = await db.getAllAsync<PersonalInventoryDb>(
          'SELECT * FROM personal_inventory WHERE user_id = ? ORDER BY created_at DESC',
          [userId],
        );

        const settled = await Promise.allSettled(rows.map(decryptPersonalInventory));
        const decrypted = settled.flatMap((result, index) => {
          if (result.status === 'fulfilled') {
            return [result.value];
          }

          logger.error('Failed to decrypt personal inventory entry', {
            entryId: rows[index]?.id,
          });
          return [];
        });

        return decrypted;
      } catch (err) {
        logger.error('Failed to fetch personal inventory', err);
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
  entry: Omit<
    PersonalInventoryDecrypted,
    'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_status' | 'supabase_id'
  >;
}

export function useCreatePersonalInventory(userId: string): {
  createInventory: (
    entry: Omit<
      PersonalInventoryDecrypted,
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
    CreatePersonalInventoryVariables,
    { previousEntries: PersonalInventoryDecrypted[] | undefined }
  >({
    mutationKey: ['createPersonalInventory', userId],
    mutationFn: async ({ entry }: CreatePersonalInventoryVariables): Promise<string> => {
      if (!db) {
        throw new Error('Database not initialized');
      }

      const id = generateId('inventory');
      const now = new Date().toISOString();

      const encryptedPersonName = entry.person_name ? await encryptContent(entry.person_name) : null;
      const encryptedResentment = entry.resentment ? await encryptContent(entry.resentment) : null;
      const encryptedMyPart = entry.my_part ? await encryptContent(entry.my_part) : null;
      const encryptedImpact = entry.impact ? await encryptContent(entry.impact) : null;

      await db.runAsync(
        `INSERT INTO personal_inventory (
          id, user_id, encrypted_person_name, encrypted_resentment, encrypted_my_part,
          encrypted_impact, category, created_at, updated_at, sync_status
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
      logger.info('Personal inventory entry created', { id, category: entry.category });

      return id;
    },
    onMutate: async ({ entry }) => {
      await queryClient.cancelQueries({ queryKey: personalInventoryKeys.byUser(userId) });

      const previousEntries = queryClient.getQueryData<PersonalInventoryDecrypted[]>(
        personalInventoryKeys.byUser(userId),
      );

      const optimisticEntry: PersonalInventoryDecrypted = {
        ...entry,
        id: 'temp-' + Date.now(),
        user_id: userId,
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
    createInventory: (entry) => mutation.mutateAsync({ entry }),
    isPending: mutation.isPending,
  };
}

interface UpdatePersonalInventoryVariables {
  id: string;
  entry: Partial<
    Omit<
      PersonalInventoryDecrypted,
      'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_status' | 'supabase_id'
    >
  >;
}

export function useUpdatePersonalInventory(userId: string): {
  updateInventory: (
    id: string,
    entry: Partial<
      Omit<
        PersonalInventoryDecrypted,
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
    UpdatePersonalInventoryVariables,
    { previousEntries: PersonalInventoryDecrypted[] | undefined }
  >({
    mutationKey: ['updatePersonalInventory', userId],
    mutationFn: async ({ id, entry }: UpdatePersonalInventoryVariables): Promise<void> => {
      if (!db) {
        throw new Error('Database not initialized');
      }

      const now = new Date().toISOString();
      const updates: string[] = [];
      const values: (string | null)[] = [];

      if (entry.person_name !== undefined) {
        updates.push('encrypted_person_name = ?');
        values.push(entry.person_name ? await encryptContent(entry.person_name) : null);
      }

      if (entry.resentment !== undefined) {
        updates.push('encrypted_resentment = ?');
        values.push(entry.resentment ? await encryptContent(entry.resentment) : null);
      }

      if (entry.my_part !== undefined) {
        updates.push('encrypted_my_part = ?');
        values.push(entry.my_part ? await encryptContent(entry.my_part) : null);
      }

      if (entry.impact !== undefined) {
        updates.push('encrypted_impact = ?');
        values.push(entry.impact ? await encryptContent(entry.impact) : null);
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

      const previousEntries = queryClient.getQueryData<PersonalInventoryDecrypted[]>(
        personalInventoryKeys.byUser(userId),
      );

      if (previousEntries) {
        const optimisticEntries = previousEntries.map((current) =>
          current.id === id
            ? {
                ...current,
                ...entry,
                updated_at: new Date().toISOString(),
              }
            : current,
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
    updateInventory: (id, entry) => mutation.mutateAsync({ id, entry }),
    isPending: mutation.isPending,
  };
}

export function useDeletePersonalInventory(userId: string): {
  deleteInventory: (id: string) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    Error,
    string,
    { previousEntries: PersonalInventoryDecrypted[] | undefined }
  >({
    mutationKey: ['deletePersonalInventory', userId],
    mutationFn: async (id: string): Promise<void> => {
      if (!db) {
        throw new Error('Database not initialized');
      }

      await addDeleteToSyncQueue(db, 'personal_inventory', id, userId);
      await db.runAsync('DELETE FROM personal_inventory WHERE id = ? AND user_id = ?', [
        id,
        userId,
      ]);
      logger.info('Personal inventory entry deleted', { id });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: personalInventoryKeys.byUser(userId) });

      const previousEntries = queryClient.getQueryData<PersonalInventoryDecrypted[]>(
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
    deleteInventory: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

export { personalInventoryKeys };
