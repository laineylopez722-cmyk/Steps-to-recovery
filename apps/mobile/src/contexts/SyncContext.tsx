import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { processSyncQueue, pullFromCloud } from '../services/syncService';
import { useAuth } from './AuthContext';
import { useDatabase } from './DatabaseContext';
import { clearDatabase } from '../utils/database';
import { logger } from '../utils/logger';

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingCount: number;
  error: Error | null;
  isOnline: boolean;
}

interface SyncContextType extends SyncState {
  triggerSync: () => Promise<void>;
  clearError: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MIN_SYNC_COOLDOWN_MS = 30 * 1000; // 30 seconds between manual syncs

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { db, isReady } = useDatabase();
  const { user } = useAuth();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef<boolean>(false);
  const isSyncingRef = useRef<boolean>(false);
  const lastSyncTimeRef = useRef<number>(0);
  const triggerSyncRef = useRef<() => Promise<void>>(async () => {});
  const userIdRef = useRef<string | null>(null);
  const pendingLogoutClearRef = useRef<boolean>(false);

  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
    error: null,
    isOnline: false,
  });

  // Keep refs in sync so background listeners always see the latest state
  useEffect(() => {
    isOnlineRef.current = state.isOnline;
  }, [state.isOnline]);
  useEffect(() => {
    isSyncingRef.current = state.isSyncing;
  }, [state.isSyncing]);
  useEffect(() => {
    const previousUser = userIdRef.current;
    const nextUserId = user?.id ?? null;

    if (previousUser && !nextUserId) {
      pendingLogoutClearRef.current = true;
    }

    userIdRef.current = nextUserId;

    if (pendingLogoutClearRef.current && !nextUserId && db && isReady) {
      pendingLogoutClearRef.current = false;
      logger.info('User logged out, clearing local database');

      clearDatabase(db).catch((error) => {
        logger.error('Failed to clear database on logout', error);
      });
    }
  }, [user?.id, db, isReady]);

  /**
   * Update pending count from sync_queue
   */
  const updatePendingCount = useCallback(async () => {
    if (!user || !db || !isReady) return;

    try {
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM sync_queue WHERE retry_count < 3',
      );
      setState((prev) => ({ ...prev, pendingCount: result?.count || 0 }));
    } catch (error) {
      logger.error('Failed to update pending count', error);
    }
  }, [db, user, isReady]);

  /**
   * Trigger sync operation
   */
  const triggerSync = useCallback(async () => {
    if (!user) {
      logger.warn('Cannot sync: no user logged in');
      return;
    }

    if (!db || !isReady) {
      logger.warn('Cannot sync: database not ready');
      return;
    }

    if (!isOnlineRef.current) {
      logger.info('Cannot sync: device is offline');
      setState((prev) => ({
        ...prev,
        error: new Error('Cannot sync while offline'),
      }));
      return;
    }

    if (isSyncingRef.current) {
      logger.info('Sync already in progress, skipping');
      return;
    }

    // Rate limit manual syncs (30 second cooldown)
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTimeRef.current;
    if (timeSinceLastSync < MIN_SYNC_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((MIN_SYNC_COOLDOWN_MS - timeSinceLastSync) / 1000);
      logger.info(`Sync cooldown: ${remainingSeconds}s remaining`);
      return;
    }

    setState((prev) => ({ ...prev, isSyncing: true, error: null }));
    isSyncingRef.current = true;

    try {
      // Phase 1: Push local changes to cloud
      logger.info('Starting sync process (push)');
      const result = await processSyncQueue(db, user.id);

      // Phase 2: Pull remote changes to device
      logger.info('Starting sync process (pull)');
      const pullResult = await pullFromCloud(db, user.id);

      logger.info('Sync complete', {
        pushed: result.synced,
        pushFailed: result.failed,
        pulled: pullResult.pulled,
        pullErrors: pullResult.errors.length,
      });

      const allErrors = [...result.errors, ...pullResult.errors];
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
        error: allErrors.length > 0 ? new Error(allErrors.join(', ')) : null,
      }));
      isSyncingRef.current = false;
      lastSyncTimeRef.current = Date.now();

      // Update pending count after sync
      await updatePendingCount();
    } catch (error) {
      logger.error('Sync failed', error);
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error : new Error('Sync failed'),
      }));
      isSyncingRef.current = false;
    }
  }, [db, user, isReady, updatePendingCount]);

  // Expose latest triggerSync to effects without re-subscribing them
  useEffect(() => {
    triggerSyncRef.current = triggerSync;
  }, [triggerSync]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Set up network listener
   * On web, use navigator.onLine API instead of NetInfo
   */
  useEffect(() => {
    // On web, NetInfo may not work properly, use browser API instead
    if (Platform.OS === 'web') {
      // Set initial state
      const initialOnline = typeof navigator !== 'undefined' && navigator.onLine;
      isOnlineRef.current = initialOnline;
      setState((prev) => ({ ...prev, isOnline: initialOnline }));

      // Listen for online/offline events
      const handleOnline = () => {
        isOnlineRef.current = true;
        setState((prev) => ({ ...prev, isOnline: true }));
        if (userIdRef.current) {
          logger.info('Device came online, triggering sync');
          void triggerSyncRef.current();
        }
      };

      const handleOffline = () => {
        isOnlineRef.current = false;
        setState((prev) => ({ ...prev, isOnline: false }));
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // Mobile: Use NetInfo
      const unsubscribe = NetInfo.addEventListener((netState) => {
        const isConnected = netState.isConnected;
        const isInternetReachable = netState.isInternetReachable;
        const nextOnline = isConnected === true && isInternetReachable === true;

        // Deduplicate noisy NetInfo events (it can emit the same state many times)
        if (nextOnline === isOnlineRef.current) {
          return;
        }

        const prevOnline = isOnlineRef.current;
        isOnlineRef.current = nextOnline;

        logger.info('Network state changed', {
          isConnected,
          isInternetReachable,
        });

        setState((prev) =>
          prev.isOnline === nextOnline ? prev : { ...prev, isOnline: nextOnline },
        );

        // Trigger sync only on offline -> online transitions
        if (nextOnline && !prevOnline && userIdRef.current) {
          logger.info('Device came online, triggering sync');
          void triggerSyncRef.current();
        }
      });

      return () => unsubscribe();
    }
  }, []);

  /**
   * Set up periodic background sync (every 5 minutes when online)
   */
  useEffect(() => {
    if (!user || !db || !isReady) return;

    // Initial pending count
    updatePendingCount();

    // Set up interval for periodic sync
    // Use refs to avoid stale closure - interval sees latest state
    syncIntervalRef.current = setInterval(() => {
      if (isOnlineRef.current && !isSyncingRef.current) {
        logger.info('Periodic sync triggered');
        void triggerSyncRef.current();
      }
    }, SYNC_INTERVAL_MS);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [user, db, isReady, updatePendingCount]);

  /**
   * Set up AppState listener to sync when app comes to foreground.
   * On web, use visibilitychange API instead.
   *
   * This also serves as retry-on-foreground: if a previous sync failed
   * (e.g. network dropped mid-sync), the next foreground event will
   * re-trigger sync and process any remaining items in the queue.
   */
  useEffect(() => {
    if (!user) return;

    if (Platform.OS === 'web') {
      // Web: Use visibilitychange API
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && state.isOnline && !state.isSyncing) {
          logger.info('App foregrounded, triggering sync');
          triggerSync();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      // Mobile: Use AppState
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active' && state.isOnline && !state.isSyncing) {
          logger.info('App foregrounded, triggering sync');
          triggerSync();
        }
      });

      return () => subscription.remove();
    }
  }, [user, state.isOnline, state.isSyncing, triggerSync]);

  const value = useMemo(
    () => ({
      ...state,
      triggerSync,
      clearError,
    }),
    [state, triggerSync, clearError],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
