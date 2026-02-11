/**
 * useWidgetData Hook
 *
 * React Query wrapper around getWidgetData() that provides
 * widget-ready data with automatic refresh every 5 minutes.
 *
 * @module hooks/useWidgetData
 */

import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '../contexts/DatabaseContext';
import { getWidgetData, type WidgetData } from '../services/widgetDataService';

/**
 * Provides aggregated widget data with auto-refresh.
 *
 * @param userId - The authenticated user's ID
 * @returns Widget data, loading state, and refetch function
 */
export function useWidgetData(userId: string): {
  data: WidgetData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
} {
  const { db, isReady } = useDatabase();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['widget-data', userId],
    queryFn: async (): Promise<WidgetData> => {
      if (!db) {
        throw new Error('Database not initialized');
      }
      return getWidgetData(db, userId);
    },
    enabled: isReady && !!db && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes stale time
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  return {
    data: data ?? null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
