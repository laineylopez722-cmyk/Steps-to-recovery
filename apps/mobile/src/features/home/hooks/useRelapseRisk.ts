/**
 * useRelapseRisk Hook
 *
 * React Query hook that calculates and caches the relapse risk score.
 * Refreshes every 30 minutes and on app foreground.
 */

import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { calculateRelapseRisk } from '../../ai-companion/services/relapseRiskEngine';
import type { RelapseRiskResult } from '../../ai-companion/services/relapseRiskEngine';

const STALE_TIME = 30 * 60 * 1000; // 30 minutes

export interface UseRelapseRiskReturn {
  risk: RelapseRiskResult | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useRelapseRisk(userId: string): UseRelapseRiskReturn {
  const { db, isReady } = useDatabase();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['relapse-risk', userId],
    queryFn: async (): Promise<RelapseRiskResult> => {
      if (!db) throw new Error('Database not ready');
      return calculateRelapseRisk(db, userId);
    },
    enabled: !!db && isReady && !!userId,
    staleTime: STALE_TIME,
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: true,
  });

  return {
    risk: data ?? null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
