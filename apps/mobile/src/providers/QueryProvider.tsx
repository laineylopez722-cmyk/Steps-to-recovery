import React, { useEffect, useState } from 'react';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { mmkvStorage } from '../lib/mmkv';
import NetInfo from '@react-native-community/netinfo';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { logger } from '../utils/logger';

// React Query dev plugin — visible in Expo DevTools (dev only, tree-shaken in production)
// Note: @dev-plugins/react-query may not be installed in all environments
if (__DEV__) {
  // Use require to avoid TypeScript static import resolution
  try {
    require('@dev-plugins/react-query');
  } catch {
    // Plugin not installed, continue without it
  }
}

// Global query client configuration
const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache persists for 24 hours (for offline support)
      gcTime: 24 * 60 * 60 * 1000,
      // Retry failed queries 3 times
      retry: 3,
      // Wait 1s between retries
      retryDelay: 1000,
      // Enable offline-first mode - use cached data while revalidating
      networkMode: 'offlineFirst' as const,
      // Refetch on window focus (web) / app foreground (native)
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Mutations also work offline and queue automatically
      networkMode: 'offlineFirst' as const,
      retry: 3,
    },
  },
};

// Create sync persister using MMKV for ~30x faster storage
const mmkvPersister = createSyncStoragePersister({
  storage: mmkvStorage,
  key: 'RECOVERY_APP_QUERY_CACHE',
  // Throttle persistence to avoid excessive writes
  throttleTime: 1000,
  // Serialize to handle complex types
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),
});

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * QueryProvider - React Query with offline persistence
 *
 * Features:
 * - Automatic cache persistence across app restarts
 * - Offline-first data fetching (shows stale data while loading)
 * - Automatic mutation queueing when offline
 * - Network state synchronization
 * - Optimistic updates support
 */
export function QueryProvider({ children }: QueryProviderProps): React.ReactElement {
  const [queryClient] = useState(() => new QueryClient(queryClientConfig));
  const [isRestoring, setIsRestoring] = useState(true);

  // Set up network state synchronization
  useEffect(() => {
    // Update React Query's online status based on NetInfo
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected === true && state.isInternetReachable !== false;

      // Only log when status changes
      if (onlineManager.isOnline() !== isOnline) {
        logger.info('Network status changed', { isOnline });
      }

      onlineManager.setOnline(isOnline);
    });

    return () => unsubscribe();
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Resume any paused mutations when app comes to foreground
        queryClient.resumePausedMutations();

        // Invalidate stale queries to refresh data
        queryClient.invalidateQueries({
          predicate: (query) => {
            // Get staleTime from query options (may be undefined)
            const staleTime = (query.options as { staleTime?: number }).staleTime ?? 0;
            const lastUpdated = query.state.dataUpdatedAt;
            return Date.now() - lastUpdated > staleTime;
          },
        });
      }
    });

    return () => subscription.remove();
  }, [queryClient]);

  // Handle cache restoration completion
  const onCacheRestore = () => {
    setIsRestoring(false);
    logger.info('Query cache restored from storage');
  };

  // Show loading state while cache is restoring
  if (isRestoring && Platform.OS !== 'web') {
    // On web, we don't block - MMKV is fast enough
    // On native, briefly wait for restoration to prevent UI flash
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: mmkvPersister,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        }}
        onSuccess={onCacheRestore}
      >
        {children}
      </PersistQueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: mmkvPersister,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      }}
      onSuccess={onCacheRestore}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

/**
 * Hook to check if the query client is currently online
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline());

  useEffect(() => {
    const unsubscribe = onlineManager.subscribe((online) => {
      setIsOnline(online);
    });
    return unsubscribe;
  }, []);

  return isOnline;
}

/**
 * Helper to manually trigger a sync of paused mutations
 * Useful for "Pull to refresh" or manual sync buttons
 */
export async function syncPendingMutations(queryClient: QueryClient): Promise<void> {
  const mutationCache = queryClient.getMutationCache();
  const pendingMutations = mutationCache
    .getAll()
    .filter((mutation) => mutation.state.status === 'pending');

  if (pendingMutations.length === 0) {
    logger.info('No pending mutations to sync');
    return;
  }

  logger.info(`Syncing ${pendingMutations.length} pending mutations`);
  await queryClient.resumePausedMutations();
}
