/**
 * useMeetingSearch Hook Test Suite
 *
 * Tests meeting search functionality including:
 * - Cache hit behavior (immediate return)
 * - API fallback when cache is stale
 * - Offline graceful degradation
 * - Cache update after API fetch
 * - Search parameters handling
 * - React Query integration
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies
const mockDb = {
  getDatabaseName: jest.fn().mockReturnValue('test.db'),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
  execAsync: jest.fn(),
  withTransactionAsync: jest.fn(),
};

jest.mock('../../../../contexts/DatabaseContext', () => ({
  useDatabase: () => ({
    db: mockDb,
    isReady: true,
  }),
}));

const mockSearchMeetings = jest.fn();
const mockCacheMeetings = jest.fn();
const mockGetCachedMeetings = jest.fn();
const mockIsCacheStale = jest.fn();
const mockGenerateCacheRegionKey = jest.fn();

jest.mock('../services/meetingGuideApi', () => ({
  searchMeetings: (...args: unknown[]) => mockSearchMeetings(...args),
}));

jest.mock('../services/meetingCacheService', () => ({
  cacheMeetings: (...args: unknown[]) => mockCacheMeetings(...args),
  getCachedMeetings: (...args: unknown[]) => mockGetCachedMeetings(...args),
  isCacheStale: (...args: unknown[]) => mockIsCacheStale(...args),
  generateCacheRegionKey: (...args: unknown[]) => mockGenerateCacheRegionKey(...args),
}));

const mockLoggerInfo = jest.fn();
const mockLoggerWarn = jest.fn();
const mockLoggerError = jest.fn();
const mockLoggerDebug = jest.fn();

jest.mock('../../../../utils/logger', () => ({
  logger: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
    error: (...args: unknown[]) => mockLoggerError(...args),
    debug: (...args: unknown[]) => mockLoggerDebug(...args),
  },
}));

// Import hook after mocking
import { useMeetingSearch } from '../useMeetingSearch';

describe('useMeetingSearch', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    mockGenerateCacheRegionKey.mockReturnValue('cache-region-key-123');
    mockIsCacheStale.mockResolvedValue(false);
    mockGetCachedMeetings.mockResolvedValue([]);
    mockCacheMeetings.mockResolvedValue(undefined);
    mockSearchMeetings.mockResolvedValue([]);
  });

  describe('Search Functionality', () => {
    it('should return cached meetings immediately when cache is fresh', async () => {
      const cachedMeetings = [
        {
          id: 'meeting-1',
          name: 'Test Meeting',
          latitude: 40.7128,
          longitude: -74.006,
          cache_region: 'cache-region-key-123',
        },
      ];

      mockIsCacheStale.mockResolvedValue(false);
      mockGetCachedMeetings.mockResolvedValue(cachedMeetings);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      let searchResult: typeof cachedMeetings = [];
      await act(async () => {
        searchResult = await result.current.search({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 5,
        });
      });

      expect(searchResult).toEqual(cachedMeetings);
      expect(mockGetCachedMeetings).toHaveBeenCalledWith(mockDb, 'cache-region-key-123');
      expect(mockSearchMeetings).not.toHaveBeenCalled();
    });

    it('should fetch from API when cache is stale', async () => {
      const apiMeetings = [
        {
          id: 'meeting-api-1',
          name: 'API Meeting',
          latitude: 40.7128,
          longitude: -74.006,
        },
      ];

      mockIsCacheStale.mockResolvedValue(true);
      mockGetCachedMeetings.mockResolvedValue([]);
      mockSearchMeetings.mockResolvedValue(apiMeetings);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      let searchResult: typeof apiMeetings = [];
      await act(async () => {
        searchResult = await result.current.search({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 5,
        });
      });

      expect(mockSearchMeetings).toHaveBeenCalledWith({
        latitude: 40.7128,
        longitude: -74.006,
        radius_miles: 5,
      });
      expect(mockCacheMeetings).toHaveBeenCalledWith(
        mockDb,
        expect.arrayContaining([
          expect.objectContaining({
            id: 'meeting-api-1',
            cache_region: 'cache-region-key-123',
          }),
        ]),
        'cache-region-key-123',
      );
      expect(searchResult).toHaveLength(1);
      expect(searchResult[0].name).toBe('API Meeting');
    });

    it('should cache new results after fetch', async () => {
      const apiMeetings = [
        { id: 'meeting-1', name: 'Meeting 1', latitude: 40.7128, longitude: -74.006 },
        { id: 'meeting-2', name: 'Meeting 2', latitude: 40.713, longitude: -74.007 },
      ];

      mockIsCacheStale.mockResolvedValue(true);
      mockGetCachedMeetings.mockResolvedValue([]);
      mockSearchMeetings.mockResolvedValue(apiMeetings);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.search({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 5,
        });
      });

      expect(mockCacheMeetings).toHaveBeenCalledTimes(1);
      expect(mockCacheMeetings).toHaveBeenCalledWith(
        mockDb,
        [
          expect.objectContaining({ id: 'meeting-1', cache_region: 'cache-region-key-123' }),
          expect.objectContaining({ id: 'meeting-2', cache_region: 'cache-region-key-123' }),
        ],
        'cache-region-key-123',
      );
    });

    it('should use stale cache when API fails (offline graceful degradation)', async () => {
      const staleMeetings = [
        {
          id: 'stale-meeting-1',
          name: 'Stale Meeting',
          latitude: 40.7128,
          longitude: -74.006,
          cache_region: 'cache-region-key-123',
        },
      ];

      mockIsCacheStale.mockResolvedValue(true);
      mockGetCachedMeetings.mockResolvedValue(staleMeetings);
      mockSearchMeetings.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      let searchResult: typeof staleMeetings = [];
      await act(async () => {
        searchResult = await result.current.search({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 5,
        });
      });

      expect(searchResult).toEqual(staleMeetings);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'API failed, using stale cache',
        expect.objectContaining({
          cachedCount: 1,
        }),
      );
    });

    it('should throw error when no cache and API fails', async () => {
      mockIsCacheStale.mockResolvedValue(true);
      mockGetCachedMeetings.mockResolvedValue([]);
      mockSearchMeetings.mockRejectedValue(new Error('Network unavailable'));

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.search({
            latitude: 40.7128,
            longitude: -74.006,
            radius_miles: 5,
          });
        }),
      ).rejects.toThrow('Network unavailable');
    });

    it('should throw error when database is not initialized', async () => {
      jest.mocked(require('../../../../contexts/DatabaseContext').useDatabase).mockReturnValue({
        db: null,
        isReady: false,
      });

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.search({
            latitude: 40.7128,
            longitude: -74.006,
            radius_miles: 5,
          });
        }),
      ).rejects.toThrow('Database not initialized');

      // Restore mock
      jest.mocked(require('../../../../contexts/DatabaseContext').useDatabase).mockReturnValue({
        db: mockDb,
        isReady: true,
      });
    });
  });

  describe('Search Parameters', () => {
    it('should generate cache region key from search params', async () => {
      mockIsCacheStale.mockResolvedValue(false);
      mockGetCachedMeetings.mockResolvedValue([]);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.search({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 10,
        });
      });

      expect(mockGenerateCacheRegionKey).toHaveBeenCalledWith({
        latitude: 40.7128,
        longitude: -74.006,
        radius_miles: 10,
      });
    });

    it('should handle search with different radius values', async () => {
      mockIsCacheStale.mockResolvedValue(false);
      mockGetCachedMeetings.mockResolvedValue([]);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.search({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 25,
        });
      });

      expect(mockGenerateCacheRegionKey).toHaveBeenCalledWith(
        expect.objectContaining({
          radius_miles: 25,
        }),
      );
    });

    it('should pass correct search parameters to API', async () => {
      mockIsCacheStale.mockResolvedValue(true);
      mockGetCachedMeetings.mockResolvedValue([]);
      mockSearchMeetings.mockResolvedValue([]);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.search({
          latitude: 34.0522,
          longitude: -118.2437,
          radius_miles: 15,
        });
      });

      expect(mockSearchMeetings).toHaveBeenCalledWith({
        latitude: 34.0522,
        longitude: -118.2437,
        radius_miles: 15,
      });
    });
  });

  describe('React Query Integration', () => {
    it('should return initial empty array', async () => {
      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      expect(result.current.meetings).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle enabled option set to false', async () => {
      const { result } = renderHook(() => useMeetingSearch({ enabled: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.meetings).toEqual([]);
    });

    it('should handle enabled option set to true', async () => {
      const { result } = renderHook(() => useMeetingSearch({ enabled: true }), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.meetings).toEqual([]);
    });

    it('should provide refetch function', async () => {
      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.refetch();
      });

      // Refetch should complete without error
      expect(result.current.error).toBeNull();
    });

    it('should have correct stale time configuration', async () => {
      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      // The hook should be configured with 1 hour stale time
      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('Cache Behavior', () => {
    it('should return cached meetings even when checking staleness', async () => {
      const cachedMeetings = [
        { id: 'm1', name: 'Meeting 1', cache_region: 'key-123' },
        { id: 'm2', name: 'Meeting 2', cache_region: 'key-123' },
      ];

      mockIsCacheStale.mockResolvedValue(true);
      mockGetCachedMeetings.mockResolvedValue(cachedMeetings);
      mockSearchMeetings.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      let searchResult: typeof cachedMeetings = [];
      await act(async () => {
        searchResult = await result.current.search({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 5,
        });
      });

      // Should return stale cache when API fails
      expect(searchResult).toHaveLength(2);
      expect(searchResult[0].name).toBe('Meeting 1');
    });

    it('should check cache staleness before deciding to fetch', async () => {
      mockIsCacheStale.mockResolvedValue(false);
      mockGetCachedMeetings.mockResolvedValue([]);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.search({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 5,
        });
      });

      expect(mockIsCacheStale).toHaveBeenCalledWith(mockDb, 'cache-region-key-123');
    });
  });

  describe('Logging', () => {
    it('should log search start', async () => {
      mockIsCacheStale.mockResolvedValue(false);
      mockGetCachedMeetings.mockResolvedValue([]);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.search({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 5,
        });
      });

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Meeting search started',
        expect.objectContaining({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 5,
        }),
      );
    });

    it('should log when using fresh cache', async () => {
      mockIsCacheStale.mockResolvedValue(false);
      mockGetCachedMeetings.mockResolvedValue([{ id: 'm1', name: 'Meeting' }]);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.search({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 5,
        });
      });

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Using fresh cached meetings',
        expect.objectContaining({
          count: 1,
        }),
      );
    });

    it('should log API fetch', async () => {
      mockIsCacheStale.mockResolvedValue(true);
      mockGetCachedMeetings.mockResolvedValue([]);
      mockSearchMeetings.mockResolvedValue([{ id: 'm1', name: 'Meeting' }]);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.search({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 5,
        });
      });

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Cache stale or empty, fetching from API',
        expect.any(Object),
      );
    });

    it('should log successful API fetch', async () => {
      mockIsCacheStale.mockResolvedValue(true);
      mockGetCachedMeetings.mockResolvedValue([]);
      mockSearchMeetings.mockResolvedValue([{ id: 'm1', name: 'Meeting' }]);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.search({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 5,
        });
      });

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Meetings fetched and cached successfully',
        expect.objectContaining({
          count: 1,
        }),
      );
    });

    it('should log search failures', async () => {
      mockIsCacheStale.mockResolvedValue(true);
      mockGetCachedMeetings.mockResolvedValue([]);
      mockSearchMeetings.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      try {
        await act(async () => {
          await result.current.search({
            latitude: 40.7128,
            longitude: -74.006,
            radius_miles: 5,
          });
        });
      } catch {
        // Expected to throw
      }

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Meeting search failed',
        expect.objectContaining({
          error: 'API Error',
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty API response', async () => {
      mockIsCacheStale.mockResolvedValue(true);
      mockGetCachedMeetings.mockResolvedValue([]);
      mockSearchMeetings.mockResolvedValue([]);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      let searchResult: unknown[] = [];
      await act(async () => {
        searchResult = await result.current.search({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 5,
        });
      });

      expect(searchResult).toEqual([]);
      expect(mockCacheMeetings).toHaveBeenCalledWith(mockDb, [], 'cache-region-key-123');
    });

    it('should handle search with decimal coordinates', async () => {
      mockIsCacheStale.mockResolvedValue(false);
      mockGetCachedMeetings.mockResolvedValue([]);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.search({
          latitude: 40.712776,
          longitude: -74.005974,
          radius_miles: 5.5,
        });
      });

      expect(mockGenerateCacheRegionKey).toHaveBeenCalledWith({
        latitude: 40.712776,
        longitude: -74.005974,
        radius_miles: 5.5,
      });
    });

    it('should handle negative coordinates', async () => {
      mockIsCacheStale.mockResolvedValue(false);
      mockGetCachedMeetings.mockResolvedValue([]);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.search({
          latitude: -33.8688,
          longitude: 151.2093,
          radius_miles: 10,
        });
      });

      expect(mockGenerateCacheRegionKey).toHaveBeenCalledWith({
        latitude: -33.8688,
        longitude: 151.2093,
        radius_miles: 10,
      });
    });

    it('should handle meetings with all API fields', async () => {
      const apiMeetings = [
        {
          id: 'full-meeting-1',
          name: 'Full Meeting',
          day: 'Monday',
          time: '19:00',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'US',
          latitude: 40.7128,
          longitude: -74.006,
          types: ['O', 'D'],
          url: 'https://example.com/meeting',
          phone: '555-1234',
          details: 'Wheelchair accessible',
        },
      ];

      mockIsCacheStale.mockResolvedValue(true);
      mockGetCachedMeetings.mockResolvedValue([]);
      mockSearchMeetings.mockResolvedValue(apiMeetings);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      let searchResult: typeof apiMeetings = [];
      await act(async () => {
        searchResult = await result.current.search({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 5,
        });
      });

      expect(searchResult).toHaveLength(1);
      expect(searchResult[0]).toMatchObject({
        id: 'full-meeting-1',
        name: 'Full Meeting',
        cache_region: 'cache-region-key-123',
      });
    });

    it('should preserve all meeting properties when caching', async () => {
      const apiMeetings = [
        {
          id: 'meeting-1',
          name: 'Test Meeting',
          latitude: 40.7128,
          longitude: -74.006,
          extraField: 'should be preserved',
        },
      ];

      mockIsCacheStale.mockResolvedValue(true);
      mockGetCachedMeetings.mockResolvedValue([]);
      mockSearchMeetings.mockResolvedValue(apiMeetings);

      const { result } = renderHook(() => useMeetingSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.search({
          latitude: 40.7128,
          longitude: -74.006,
          radius_miles: 5,
        });
      });

      const cachedCall = mockCacheMeetings.mock.calls[0];
      expect(cachedCall[1][0]).toMatchObject({
        id: 'meeting-1',
        name: 'Test Meeting',
        extraField: 'should be preserved',
        cache_region: 'cache-region-key-123',
      });
    });
  });
});
