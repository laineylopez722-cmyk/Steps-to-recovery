/**
 * App Lifecycle Hook
 *
 * Provides app foreground/background state tracking with callbacks.
 * Works cross-platform (mobile uses AppState, web uses visibilitychange).
 *
 * **Use Cases**:
 * - Auto-lock app when backgrounded
 * - Pause/resume timers (meditation, breathing)
 * - Track session duration
 * - Trigger sync on foreground
 *
 * @example
 * ```ts
 * const { isActive, isBackground, sessionDuration } = useAppLifecycle({
 *   onForeground: () => console.log('App returned to foreground'),
 *   onBackground: () => console.log('App went to background'),
 * });
 * ```
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { logger } from '../utils/logger';

interface AppLifecycleOptions {
  /** Called when app comes to foreground */
  onForeground?: () => void;
  /** Called when app goes to background */
  onBackground?: () => void;
  /** Called when app becomes inactive (iOS only - e.g., notification panel) */
  onInactive?: () => void;
  /** Track session duration in seconds */
  trackSessionDuration?: boolean;
}

interface AppLifecycleState {
  /** App is in active foreground state */
  isActive: boolean;
  /** App is in background state */
  isBackground: boolean;
  /** App is inactive (iOS notification panel, etc.) */
  isInactive: boolean;
  /** Current app state string */
  appState: 'active' | 'background' | 'inactive' | 'unknown';
  /** Time spent in current session (seconds), updates every second when trackSessionDuration is true */
  sessionDuration: number;
  /** Timestamp when app was last foregrounded */
  lastForegroundTime: Date | null;
  /** Timestamp when app was last backgrounded */
  lastBackgroundTime: Date | null;
}

export function useAppLifecycle(options: AppLifecycleOptions = {}): AppLifecycleState {
  const { onForeground, onBackground, onInactive, trackSessionDuration = false } = options;

  const [state, setState] = useState<AppLifecycleState>({
    isActive: true,
    isBackground: false,
    isInactive: false,
    appState: 'active',
    sessionDuration: 0,
    lastForegroundTime: new Date(),
    lastBackgroundTime: null,
  });

  const previousStateRef = useRef<string>('active');
  const sessionStartRef = useRef<Date>(new Date());
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track session duration
  useEffect(() => {
    if (!trackSessionDuration || !state.isActive) {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      return;
    }

    durationIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000);
      setState((prev) => ({ ...prev, sessionDuration: elapsed }));
    }, 1000);

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, [trackSessionDuration, state.isActive]);

  const handleStateChange = useCallback(
    (nextState: 'active' | 'background' | 'inactive') => {
      const prevState = previousStateRef.current;

      // Avoid duplicate callbacks
      if (prevState === nextState) return;

      logger.info('App lifecycle state changed', { from: prevState, to: nextState });

      previousStateRef.current = nextState;

      const now = new Date();

      if (nextState === 'active') {
        // Reset session timer when returning to foreground
        sessionStartRef.current = now;

        setState((prev) => ({
          ...prev,
          isActive: true,
          isBackground: false,
          isInactive: false,
          appState: 'active',
          sessionDuration: 0,
          lastForegroundTime: now,
        }));

        onForeground?.();
      } else if (nextState === 'background') {
        setState((prev) => ({
          ...prev,
          isActive: false,
          isBackground: true,
          isInactive: false,
          appState: 'background',
          lastBackgroundTime: now,
        }));

        onBackground?.();
      } else if (nextState === 'inactive') {
        setState((prev) => ({
          ...prev,
          isActive: false,
          isBackground: false,
          isInactive: true,
          appState: 'inactive',
        }));

        onInactive?.();
      }
    },
    [onForeground, onBackground, onInactive],
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web: Use visibilitychange API
      const handleVisibilityChange = (): void => {
        const nextState = document.visibilityState === 'visible' ? 'active' : 'background';
        handleStateChange(nextState);
      };

      // Check initial state
      if (document.visibilityState === 'hidden') {
        handleStateChange('background');
      }

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      // Mobile: Use AppState
      const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        // Map React Native states to our simplified states
        if (nextAppState === 'active') {
          handleStateChange('active');
        } else if (nextAppState === 'background') {
          handleStateChange('background');
        } else if (nextAppState === 'inactive') {
          handleStateChange('inactive');
        }
      });

      return () => subscription.remove();
    }
  }, [handleStateChange]);

  return state;
}
