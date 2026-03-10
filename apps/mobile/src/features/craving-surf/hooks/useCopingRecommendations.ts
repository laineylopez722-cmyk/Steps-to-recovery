/**
 * useCopingRecommendations Hook
 *
 * Wraps the coping recommender service with React Query caching.
 * Stale time: 15 minutes (context changes slowly).
 */

import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { getCopingRecommendations } from '../../ai-companion/services/copingRecommender';
import type { CopingRecommendationResult } from '../../ai-companion/services/copingRecommender';

const COPING_KEY = (userId: string) => ['copingRecommendations', userId];

export interface UseCopingRecommendationsReturn {
  recommendations: CopingRecommendationResult | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCopingRecommendations(userId: string): UseCopingRecommendationsReturn {
  const { db } = useDatabase();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: COPING_KEY(userId),
    queryFn: async () => {
      if (!db) throw new Error('Database not ready');
      return getCopingRecommendations(db, userId);
    },
    enabled: !!db && !!userId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });

  return {
    recommendations: data ?? null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
