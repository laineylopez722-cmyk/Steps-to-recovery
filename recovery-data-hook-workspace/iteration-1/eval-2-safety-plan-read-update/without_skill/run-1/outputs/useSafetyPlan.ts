import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { decryptContent, encryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import { addToSyncQueue } from '../../../services/syncService';

type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

interface SafetyPlanRow {
  id: string;
  user_id: string;
  encrypted_warning_signs: string | null;
  encrypted_coping_strategies: string | null;
  encrypted_reasons_to_live: string | null;
  encrypted_emergency_contacts: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  supabase_id: string | null;
}

export interface SafetyPlanData {
  id: string;
  user_id: string;
  warning_signs: string[];
  coping_strategies: string[];
  reasons_to_live: string[];
  emergency_contacts: JsonValue;
  created_at: string;
  updated_at: string;
  sync_status: string;
  supabase_id: string | null;
}

export interface SafetyPlanUpdateInput {
  warning_signs: string[];
  coping_strategies: string[];
  reasons_to_live: string[];
  emergency_contacts: JsonValue;
}

const safetyPlanKeys = {
  all: ['safety-plan'] as const,
  byUser: (userId: string) => [...safetyPlanKeys.all, userId] as const,
};

async function decryptSafetyPlan(row: SafetyPlanRow): Promise<SafetyPlanData> {
  const warningSigns = row.encrypted_warning_signs
    ? ((JSON.parse(await decryptContent(row.encrypted_warning_signs)) as string[]) ?? [])
    : [];
  const copingStrategies = row.encrypted_coping_strategies
    ? ((JSON.parse(await decryptContent(row.encrypted_coping_strategies)) as string[]) ?? [])
    : [];
  const reasonsToLive = row.encrypted_reasons_to_live
    ? ((JSON.parse(await decryptContent(row.encrypted_reasons_to_live)) as string[]) ?? [])
    : [];
  const emergencyContacts = row.encrypted_emergency_contacts
    ? (JSON.parse(await decryptContent(row.encrypted_emergency_contacts)) as JsonValue)
    : {};

  return {
    id: row.id,
    user_id: row.user_id,
    warning_signs: warningSigns,
    coping_strategies: copingStrategies,
    reasons_to_live: reasonsToLive,
    emergency_contacts: emergencyContacts,
    created_at: row.created_at,
    updated_at: row.updated_at,
    sync_status: row.sync_status,
    supabase_id: row.supabase_id,
  };
}

export function useSafetyPlan(userId: string): {
  plan: SafetyPlanData | null;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { db, isReady } = useDatabase();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: safetyPlanKeys.byUser(userId),
    queryFn: async (): Promise<SafetyPlanData | null> => {
      if (!db || !isReady) {
        throw new Error('Database not ready');
      }

      try {
        const row = await db.getFirstAsync<SafetyPlanRow>(
          'SELECT * FROM safety_plans WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
          [userId],
        );

        if (!row) {
          return null;
        }

        return await decryptSafetyPlan(row);
      } catch (err) {
        logger.error('Failed to fetch safety plan', err);
        throw err;
      }
    },
    enabled: isReady && !!db && !!userId,
    staleTime: 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  return {
    plan: data ?? null,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}

interface SafetyPlanUpdateVariables extends SafetyPlanUpdateInput {}

export function useUpdateSafetyPlan(userId: string): {
  updatePlan: (plan: SafetyPlanUpdateInput) => Promise<void>;
  isPending: boolean;
} {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    Error,
    SafetyPlanUpdateVariables,
    { previousPlan: SafetyPlanData | null | undefined }
  >({
    mutationKey: ['updateSafetyPlan', userId],
    mutationFn: async (plan: SafetyPlanUpdateVariables): Promise<void> => {
      if (!db) {
        throw new Error('Database not initialized');
      }

      const existing = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM safety_plans WHERE user_id = ?',
        [userId],
      );

      if (!existing) {
        throw new Error('Safety plan not found');
      }

      const now = new Date().toISOString();
      const encryptedWarningSigns = await encryptContent(JSON.stringify(plan.warning_signs));
      const encryptedCopingStrategies = await encryptContent(
        JSON.stringify(plan.coping_strategies),
      );
      const encryptedReasonsToLive = await encryptContent(JSON.stringify(plan.reasons_to_live));
      const encryptedEmergencyContacts = await encryptContent(
        JSON.stringify(plan.emergency_contacts),
      );

      await db.runAsync(
        `UPDATE safety_plans
         SET encrypted_warning_signs = ?,
             encrypted_coping_strategies = ?,
             encrypted_reasons_to_live = ?,
             encrypted_emergency_contacts = ?,
             updated_at = ?,
             sync_status = ?
         WHERE id = ? AND user_id = ?`,
        [
          encryptedWarningSigns,
          encryptedCopingStrategies,
          encryptedReasonsToLive,
          encryptedEmergencyContacts,
          now,
          'pending',
          existing.id,
          userId,
        ],
      );

      await addToSyncQueue(db, 'safety_plans', existing.id, 'update');

      logger.info('Safety plan updated', { id: existing.id });
    },
    onMutate: async (plan) => {
      await queryClient.cancelQueries({ queryKey: safetyPlanKeys.byUser(userId) });

      const previousPlan = queryClient.getQueryData<SafetyPlanData | null>(
        safetyPlanKeys.byUser(userId),
      );

      if (previousPlan) {
        queryClient.setQueryData<SafetyPlanData>(safetyPlanKeys.byUser(userId), {
          ...previousPlan,
          ...plan,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousPlan };
    },
    onError: (error, _variables, context) => {
      logger.error('Failed to update safety plan', error);
      if (context?.previousPlan !== undefined) {
        queryClient.setQueryData(safetyPlanKeys.byUser(userId), context.previousPlan);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: safetyPlanKeys.byUser(userId) });
    },
  });

  return {
    updatePlan: (plan) => mutation.mutateAsync(plan),
    isPending: mutation.isPending,
  };
}

export { safetyPlanKeys };
