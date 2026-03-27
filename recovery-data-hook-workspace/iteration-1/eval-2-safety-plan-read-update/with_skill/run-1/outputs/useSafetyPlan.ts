import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../../../../apps/mobile/src/contexts/DatabaseContext';
import { decryptContent, encryptContent } from '../../../../../../apps/mobile/src/utils/encryption';
import { logger } from '../../../../../../apps/mobile/src/utils/logger';
import { addToSyncQueue } from '../../../../../../apps/mobile/src/services/syncService';

export interface EmergencyContact {
  name: string;
  phone?: string;
  relationship?: string;
  [key: string]: unknown;
}

export interface SafetyPlan {
  id: string;
  user_id: string;
  warning_signs: string[];
  coping_strategies: string[];
  reasons_to_live: string[];
  emergency_contacts: EmergencyContact[];
  created_at: string;
  updated_at: string;
  sync_status: string | null;
  supabase_id: string | null;
}

type SafetyPlanRow = {
  id: string;
  user_id: string;
  encrypted_warning_signs: string | null;
  encrypted_coping_strategies: string | null;
  encrypted_reasons_to_live: string | null;
  encrypted_emergency_contacts: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string | null;
  supabase_id: string | null;
};

type SafetyPlanUpdateInput = {
  warning_signs?: string[];
  coping_strategies?: string[];
  reasons_to_live?: string[];
  emergency_contacts?: EmergencyContact[];
};

const safetyPlanKeys = { all: ['safety_plans'] as const, byUser: (u: string) => [...safetyPlanKeys.all, u] as const };

async function decArr(v: string | null): Promise<string[]> {
  if (!v) return [];
  const p = JSON.parse(await decryptContent(v)) as unknown;
  if (!Array.isArray(p) || p.some((x) => typeof x !== 'string')) throw new Error('Invalid safety plan string array');
  return p;
}

async function decContacts(v: string | null): Promise<EmergencyContact[]> {
  if (!v) return [];
  const p = JSON.parse(await decryptContent(v)) as unknown;
  if (!Array.isArray(p)) throw new Error('Invalid safety plan emergency contacts');
  return p as EmergencyContact[];
}

async function decRow(row: SafetyPlanRow): Promise<SafetyPlan> {
  return {
    id: row.id,
    user_id: row.user_id,
    warning_signs: await decArr(row.encrypted_warning_signs),
    coping_strategies: await decArr(row.encrypted_coping_strategies),
    reasons_to_live: await decArr(row.encrypted_reasons_to_live),
    emergency_contacts: await decContacts(row.encrypted_emergency_contacts),
    created_at: row.created_at,
    updated_at: row.updated_at,
    sync_status: row.sync_status,
    supabase_id: row.supabase_id,
  };
}

export function useSafetyPlan(userId: string): { plan: SafetyPlan | null; isLoading: boolean; isFetching: boolean; error: Error | null; refetch: () => Promise<void> } {
  const { db, isReady } = useDatabase();
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: safetyPlanKeys.byUser(userId),
    queryFn: async (): Promise<SafetyPlan | null> => {
      if (!db || !isReady) throw new Error('Database not ready');
      try {
        const rows = await db.getAllAsync<SafetyPlanRow>('SELECT * FROM safety_plans WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
        const settled = await Promise.allSettled(rows.map(decRow));
        for (let i = 0; i < settled.length; i += 1) {
          const r = settled[i];
          if (r.status === 'fulfilled') return r.value;
          logger.error('Failed to decrypt safety plan', { userId, planId: rows[i]?.id });
        }
        return null;
      } catch (err) {
        logger.error('Failed to fetch safety plan', err);
        throw err;
      }
    },
    enabled: isReady && !!db && !!userId,
    staleTime: 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
  return { plan: data ?? null, isLoading, isFetching, error: error as Error | null, refetch: async () => { await refetch(); } };
}

export function useUpdateSafetyPlan(userId: string): { updateSafetyPlan: (plan: SafetyPlanUpdateInput) => Promise<void>; isPending: boolean } {
  const { db } = useDatabase();
  const queryClient = useQueryClient();
  const mutation = useMutation<void, Error, { plan: SafetyPlanUpdateInput }, { previousPlan: SafetyPlan | null | undefined }>({
    mutationKey: ['updateSafetyPlan', userId],
    mutationFn: async ({ plan }) => {
      if (!db) throw new Error('Database not initialized');
      const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM safety_plans WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1', [userId]);
      if (!existing) throw new Error('Safety plan not found');
      const updates: string[] = [];
      const values: (string | null)[] = [];
      if (plan.warning_signs !== undefined) { updates.push('encrypted_warning_signs = ?'); values.push(await encryptContent(JSON.stringify(plan.warning_signs))); }
      if (plan.coping_strategies !== undefined) { updates.push('encrypted_coping_strategies = ?'); values.push(await encryptContent(JSON.stringify(plan.coping_strategies))); }
      if (plan.reasons_to_live !== undefined) { updates.push('encrypted_reasons_to_live = ?'); values.push(await encryptContent(JSON.stringify(plan.reasons_to_live))); }
      if (plan.emergency_contacts !== undefined) { updates.push('encrypted_emergency_contacts = ?'); values.push(await encryptContent(JSON.stringify(plan.emergency_contacts))); }
      if (!updates.length) throw new Error('No safety plan fields provided');
      updates.push('updated_at = ?', 'sync_status = ?');
      values.push(new Date().toISOString(), 'pending', existing.id, userId);
      await db.runAsync(`UPDATE safety_plans SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, values);
      await addToSyncQueue(db, 'safety_plans', existing.id, 'update');
      logger.info('Safety plan updated', { id: existing.id });
    },
    onMutate: async ({ plan }) => {
      await queryClient.cancelQueries({ queryKey: safetyPlanKeys.byUser(userId) });
      const previousPlan = queryClient.getQueryData<SafetyPlan | null>(safetyPlanKeys.byUser(userId));
      if (previousPlan) queryClient.setQueryData<SafetyPlan>(safetyPlanKeys.byUser(userId), { ...previousPlan, ...plan, updated_at: new Date().toISOString(), sync_status: 'pending' });
      return { previousPlan };
    },
    onError: (error, _vars, context) => {
      logger.error('Failed to update safety plan', error);
      if (context?.previousPlan !== undefined) queryClient.setQueryData(safetyPlanKeys.byUser(userId), context.previousPlan);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: safetyPlanKeys.byUser(userId) }); },
  });
  return { updateSafetyPlan: (plan) => mutation.mutateAsync({ plan }), isPending: mutation.isPending };
}

export { safetyPlanKeys };
