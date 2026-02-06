import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { logger } from '../utils/logger';

/**
 * App State Hook
 * 
 * Tracks and manages app state changes:
 * - Foreground/Background transitions
 * - Inactive state (iOS)
 * - App launch and termination
 * - Provides time tracking for session duration
 * 
 * Features:
 * - Detect when app comes to foreground
 * - Detect when app goes to background
 * - Calculate time spent in background
 * - Track total session time
 * 
 * @example
 * ```tsx
 * const { 
 *   appState, 
 *   isActive, 
 *   timeInBackground,
 *   onForeground 
 * } = useAppState();
 * 
 * // Refresh data when app comes to foreground
 * useEffect(() => {
 *   if (isActive) {
 *     refetchData();
 *   }
 * }, [isActive]);
 * ```
 */

export interface AppStateInfo {
  /** Current app state */
  appState: AppStateStatus;
  /** Whether app is currently active/foreground */
  isActive: boolean;
  /** Whether app is in background */
  isBackground: boolean;
  /** Whether app is inactive (iOS only) */
  isInactive: boolean;
  /** Time spent in background (ms) */
  timeInBackground: number;
  /** Total time app has been active in this session (ms) */
  totalActiveTime: number;
  /** Timestamp when app became active */
  lastActiveAt: Date | null;
  /** Timestamp when app went to background */
  lastBackgroundedAt: Date | null;
}

export interface UseAppStateOptions {
  /** Callback when app becomes active */
  onForeground?: () => void;
  /** Callback when app goes to background */
  onBackground?: () => void;
  /** Whether to log state changes */
  enableLogging?: boolean;
}

export function useAppState(options: UseAppStateOptions = {}): AppStateInfo {
  const { onForeground, onBackground, enableLogging = false } = options;

  // State
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [timeInBackground, setTimeInBackground] = useState(0);
  const [totalActiveTime, setTotalActiveTime] = useState(0);
  const [lastActiveAt, setLastActiveAt] = useState<Date | null>(null);
  const [lastBackgroundedAt, setLastBackgroundedAt] = useState<Date | null>(null);

  // Refs for tracking
  const backgroundStartTime = useRef<number | null>(null);
  const activeStartTime = useRef<number>(Date.now());
  const previousState = useRef<AppStateStatus>(AppState.currentState);
  const totalActiveTimeRef = useRef(0);

  // Handle state changes
  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      const prevState = previousState.current;
      
      if (enableLogging) {
        logger.debug('App state change', { from: prevState, to: nextAppState });
      }

      // Update state
      setAppState(nextAppState);
      previousState.current = nextAppState;

      // App is becoming active
      if (prevState.match(/inactive|background/) && nextAppState === 'active') {
        const now = Date.now();
        setLastActiveAt(new Date(now));
        activeStartTime.current = now;

        // Calculate time spent in background
        if (backgroundStartTime.current) {
          const backgroundDuration = now - backgroundStartTime.current;
          setTimeInBackground(backgroundDuration);
          setLastBackgroundedAt(null);
          backgroundStartTime.current = null;

          if (enableLogging) {
            logger.info('App returned from background', { 
              duration: `${(backgroundDuration / 1000).toFixed(1)}s` 
            });
          }
        }

        onForeground?.();
      }

      // App is going to background
      if (prevState === 'active' && nextAppState.match(/inactive|background/)) {
        const now = Date.now();
        setLastBackgroundedAt(new Date(now));
        backgroundStartTime.current = now;

        // Calculate active time before backgrounding
        if (activeStartTime.current) {
          const activeDuration = now - activeStartTime.current;
          totalActiveTimeRef.current += activeDuration;
          setTotalActiveTime(totalActiveTimeRef.current);
        }

        if (enableLogging) {
          logger.info('App went to background', {
            totalActiveTime: `${(totalActiveTimeRef.current / 1000).toFixed(1)}s`,
          });
        }

        onBackground?.();
      }
    },
    [onForeground, onBackground, enableLogging]
  );

  // Subscribe to app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  // Calculate derived state
  const isActive = appState === 'active';
  const isBackground = appState === 'background';
  const isInactive = appState === 'inactive';

  return {
    appState,
    isActive,
    isBackground,
    isInactive,
    timeInBackground,
    totalActiveTime,
    lastActiveAt,
    lastBackgroundedAt,
  };
}

/**
 * Hook to execute a callback when app comes to foreground
 * Useful for refreshing data or syncing
 */
export function useOnForeground(callback: () => void, deps: React.DependencyList = []): void {
  const callbackRef = useRef(callback);
  
  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let isSubscribed = true;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isSubscribed) {
        callbackRef.current();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isSubscribed = false;
      subscription.remove();
    };
  }, deps);
}

/**
 * Hook to execute a callback when app goes to background
 * Useful for cleanup or saving state
 */
export function useOnBackground(callback: () => void, deps: React.DependencyList = []): void {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let isSubscribed = true;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && isSubscribed) {
        callbackRef.current();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isSubscribed = false;
      subscription.remove();
    };
  }, deps);
}

/**
 * Hook to track if app has been in background for a certain duration
 * Useful for requiring re-authentication
 */
export function useBackgroundTimeout(timeoutMs: number): {
  hasTimedOut: boolean;
  resetTimeout: () => void;
} {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const backgroundTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimeout = useCallback(() => {
    setHasTimedOut(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // App went to background
      if (nextAppState === 'background') {
        backgroundTimeRef.current = Date.now();
        
        // Set timeout
        timeoutRef.current = setTimeout(() => {
          setHasTimedOut(true);
        }, timeoutMs);
      }
      
      // App came to foreground
      if (nextAppState === 'active') {
        // Check if timeout was reached while in background
        if (backgroundTimeRef.current) {
          const timeInBackground = Date.now() - backgroundTimeRef.current;
          if (timeInBackground >= timeoutMs) {
            setHasTimedOut(true);
          }
        }
        
        // Clear the timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        backgroundTimeRef.current = null;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeoutMs]);

  return { hasTimedOut, resetTimeout };
}

/**
 * Hook to refresh data when app returns from background after a delay
 * Useful for keeping data fresh
 */
export function useRefreshOnForeground<T>(
  fetchFn: () => Promise<T>,
  minBackgroundTime: number = 5000,
  deps: React.DependencyList = []
): { data: T | null; isRefreshing: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        backgroundTimeRef.current = Date.now();
      }
      
      if (nextAppState === 'active' && backgroundTimeRef.current) {
        const timeInBackground = Date.now() - backgroundTimeRef.current;
        backgroundTimeRef.current = null;
        
        // Only refresh if app was in background for minimum time
        if (timeInBackground >= minBackgroundTime) {
          setIsRefreshing(true);
          setError(null);
          
          try {
            const newData = await fetchFn();
            setData(newData);
          } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to refresh'));
          } finally {
            setIsRefreshing(false);
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [fetchFn, minBackgroundTime, ...deps]);

  // Initial fetch
  useEffect(() => {
    const fetchInitial = async () => {
      setIsRefreshing(true);
      try {
        const newData = await fetchFn();
        setData(newData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch'));
      } finally {
        setIsRefreshing(false);
      }
    };
    
    fetchInitial();
  }, deps);

  return { data, isRefreshing, error };
}

