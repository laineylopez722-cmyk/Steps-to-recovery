/**
 * useMeetingSearch Hook
 * Coordinates Meeting Guide API calls with local caching
 * Implements offline-first pattern: cache hits return immediately,
 * online searches update cache in background
 */

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { logger } from '../../../utils/logger';
import { searchMeetings } from '../services/meetingGuideApi';
import {
  cacheMeetings,
  getCachedMeetings,
  isCacheStale,
  generateCacheRegionKey,
} from '../services/meetingCacheService';
import type { CachedMeeting, MeetingSearchParams, CacheRegion } from '../types/meeting';

export interface UseMeetingSearchOptions {
  enabled?: boolean; // Whether to auto-fetch (default: false)
}

export interface UseMeetingSearchReturn {
  meetings: CachedMeeting[];
  isLoading: boolean;
  isFetching: boolean; // Background refresh
  error: string | null;
  search: (params: MeetingSearchParams) => Promise<CachedMeeting[]>;
  refetch: () => Promise<void>;
}

/**
 * Hook to search for meetings with caching
 * @param options Configuration options
 * @returns Meeting search state and control functions
 */
export function useMeetingSearch(options: UseMeetingSearchOptions = {}): UseMeetingSearchReturn {
  const { db } = useDatabase();

  /**
   * Search for meetings (API call + cache update)
   * @param params Search parameters
   * @returns Array of cached meetings
   */
  const search = useCallback(
    async (params: MeetingSearchParams): Promise<CachedMeeting[]> => {
      if (!db) {
        throw new Error('Database not initialized');
      }

      const { latitude, longitude, radius_miles } = params;

      // Generate cache region key
      const cacheRegion: CacheRegion = {
        latitude,
        longitude,
        radius_miles,
      };
      const cacheRegionKey = generateCacheRegionKey(cacheRegion);

      logger.info('Meeting search started', {
        latitude,
        longitude,
        radius_miles,
        cacheRegionKey,
      });

      try {
        // Check if cache exists and is fresh
        const isStale = await isCacheStale(db, cacheRegionKey);

        // Get cached meetings (even if stale - for immediate display)
        const cachedMeetings = await getCachedMeetings(db, cacheRegionKey);

        if (cachedMeetings.length > 0 && !isStale) {
          logger.info('Using fresh cached meetings', {
            count: cachedMeetings.length,
            cacheRegionKey,
          });
          return cachedMeetings;
        }

        // Cache is stale or empty - fetch from API
        logger.info('Cache stale or empty, fetching from API', {
          isStale,
          cachedCount: cachedMeetings.length,
        });

        try {
          // Fetch from Meeting Guide API
          const apiFetchedMeetings = await searchMeetings(params);

          // Update meetings with cache_region
          const meetingsToCache = apiFetchedMeetings.map((meeting) => ({
            ...meeting,
            cache_region: cacheRegionKey,
          }));

          // Cache the results
          await cacheMeetings(db, meetingsToCache, cacheRegionKey);

          logger.info('Meetings fetched and cached successfully', {
            count: meetingsToCache.length,
            cacheRegionKey,
          });

          return meetingsToCache;
        } catch (apiError) {
          // API call failed - use stale cache if available (offline graceful degradation)
          if (cachedMeetings.length > 0) {
            logger.warn('API failed, using stale cache', {
              error: apiError instanceof Error ? apiError.message : 'Unknown error',
              cachedCount: cachedMeetings.length,
            });
            return cachedMeetings;
          }

          // No cache available - throw error
          throw apiError;
        }
      } catch (error) {
        logger.error('Meeting search failed', error);
        throw error;
      }
    },
    [db],
  );

  /**
   * React Query wrapper for search
   * Allows integration with React Query caching and refetching
   */
  const {
    data: meetings = [],
    isLoading,
    isFetching,
    error,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ['meeting-search'],
    queryFn: async () => {
      // This query is manually triggered, not auto-fetched
      // Return empty array by default
      return [];
    },
    enabled: options.enabled ?? false,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (formerly cacheTime)
  });

  /**
   * Refetch meetings (force refresh)
   */
  const refetch = useCallback(async (): Promise<void> => {
    await refetchQuery();
  }, [refetchQuery]);

  return {
    meetings,
    isLoading,
    isFetching,
    error: error instanceof Error ? error.message : null,
    search,
    refetch,
  };
}
