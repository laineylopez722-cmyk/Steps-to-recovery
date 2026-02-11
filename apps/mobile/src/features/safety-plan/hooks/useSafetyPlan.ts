/**
 * Safety Plan Hook
 *
 * React Query hooks for fetching and saving the user's safety plan.
 * The entire plan is stored as a single encrypted JSON blob in SQLite.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { encryptContent, decryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import { generateId } from '../../../utils/id';
import { addToSyncQueue } from '../../../services/syncService';
import type { SafetyPlanData } from '../types';

interface SafetyPlanRow {
  id: string;
  user_id: string;
  encrypted_plan: string;
  created_at: string;
  updated_at: string;
  synced: number;
  supabase_id: string | null;
}

const safetyPlanKeys = {
  all: ['safety-plan'] as const,
  byUser: (userId: string) => [...safetyPlanKeys.all, userId] as const,
};

async function decryptSafetyPlan(row: SafetyPlanRow): Promise<SafetyPlanData> {
  const planJson = await decryptContent(row.encrypted_plan);
  const plan = JSON.parse(planJson) as Omit<
    SafetyPlanData,
    'id' | 'userId' | 'createdAt' | 'updatedAt'
  >;

  return {
    ...plan,
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useSafetyPlan(userId: string): {
  plan: SafetyPlanData | null;
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
  refetch: () => Promise<unknown>;
} {
  const { db, isReady } = useDatabase();

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: safetyPlanKeys.byUser(userId),
    queryFn: async (): Promise<SafetyPlanData | null> => {
      if (!db || !isReady) return null;

      try {
        const row = await db.getFirstAsync<SafetyPlanRow>(
          'SELECT * FROM safety_plans WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
          [userId],
        );

        if (!row) return null;
        return await decryptSafetyPlan(row);
      } catch (err) {
        logger.error('Failed to fetch safety plan', err);
        return null;
      }
    },
    enabled: isReady && !!db && !!userId,
    staleTime: 60 * 1000,
  });

  return {
    plan: data ?? null,
    isLoading,
    error: error as Error | null,
    isFetching,
    refetch,
  };
}

interface SaveSafetyPlanVariables {
  warningSigns: string[];
  copingStrategies: string[];
  distractionPeople: string[];
  supportContacts: SafetyPlanData['supportContacts'];
  professionalContacts: SafetyPlanData['professionalContacts'];
  safeEnvironment: string[];
  reasonsToLive: string[];
}

export function useSaveSafetyPlan(userId: string): {
  savePlan: (data: SaveSafetyPlanVariables) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    Error,
    SaveSafetyPlanVariables,
    { previousData: SafetyPlanData | null | undefined }
  >({
    mutationKey: ['saveSafetyPlan', userId],

    mutationFn: async (data: SaveSafetyPlanVariables): Promise<void> => {
      if (!db) throw new Error('Database not initialized');

      const now = new Date().toISOString();
      const planPayload = {
        warningSigns: data.warningSigns,
        copingStrategies: data.copingStrategies,
        distractionPeople: data.distractionPeople,
        supportContacts: data.supportContacts,
        professionalContacts: data.professionalContacts,
        safeEnvironment: data.safeEnvironment,
        reasonsToLive: data.reasonsToLive,
      };
      const encryptedPlan = await encryptContent(JSON.stringify(planPayload));

      const existing = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM safety_plans WHERE user_id = ?',
        [userId],
      );

      if (existing) {
        await db.runAsync(
          `UPDATE safety_plans
           SET encrypted_plan = ?, updated_at = ?, synced = 0
           WHERE id = ? AND user_id = ?`,
          [encryptedPlan, now, existing.id, userId],
        );
        await addToSyncQueue(db, 'safety_plans', existing.id, 'update');
        logger.info('Safety plan updated', { id: existing.id });
      } else {
        const id = generateId('sp');
        await db.runAsync(
          `INSERT INTO safety_plans (id, user_id, encrypted_plan, created_at, updated_at, synced)
           VALUES (?, ?, ?, ?, ?, 0)`,
          [id, userId, encryptedPlan, now, now],
        );
        await addToSyncQueue(db, 'safety_plans', id, 'insert');
        logger.info('Safety plan created', { id });
      }
    },

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: safetyPlanKeys.byUser(userId) });

      const previousData = queryClient.getQueryData<SafetyPlanData | null>(
        safetyPlanKeys.byUser(userId),
      );

      const optimistic: SafetyPlanData = {
        id: previousData?.id ?? 'temp-' + Date.now(),
        userId,
        ...variables,
        createdAt: previousData?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(safetyPlanKeys.byUser(userId), optimistic);
      return { previousData };
    },

    onError: (error, _variables, context) => {
      logger.error('Failed to save safety plan', error);
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(safetyPlanKeys.byUser(userId), context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: safetyPlanKeys.byUser(userId) });
    },
  });

  return {
    savePlan: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

export { safetyPlanKeys };
