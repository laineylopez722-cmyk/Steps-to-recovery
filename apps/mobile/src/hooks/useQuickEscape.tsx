/**
 * Quick Escape Hook
 *
 * Safety feature that allows users to quickly exit the app
 * via a triple-tap gesture. When triggered, shows the biometric
 * lock screen requiring re-authentication to re-enter.
 *
 * Since expo-sensors is not installed, this uses a gesture-based
 * approach (triple-tap within 1 second) as the escape trigger.
 *
 * Settings are stored in SecureStore (never AsyncStorage).
 *
 * @example
 * ```ts
 * const { isEnabled, setEnabled } = useQuickEscape();
 * // Wrap app with QuickEscapeProvider for gesture detection
 * ```
 */

import { useState, useEffect, useCallback, useRef, type ReactElement } from 'react';
import { AppState, Pressable, StyleSheet, type GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { secureStorage } from '../adapters/secureStorage';
import { logger } from '../utils/logger';

const QUICK_ESCAPE_KEY = 'quick_escape_enabled';
const TAP_THRESHOLD = 3;
const TAP_WINDOW_MS = 1000;

interface UseQuickEscapeReturn {
  /** Whether quick escape is enabled */
  isEnabled: boolean;
  /** Enable or disable quick escape */
  setEnabled: (enabled: boolean) => Promise<void>;
  /** Whether the escape has been triggered (app should lock) */
  isEscapeTriggered: boolean;
  /** Register a tap event (call from the gesture detector) */
  registerTap: () => void;
  /** Reset escape state (after re-authentication) */
  resetEscape: () => void;
}

export function useQuickEscape(): UseQuickEscapeReturn {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isEscapeTriggered, setIsEscapeTriggered] = useState(false);
  const tapTimestampsRef = useRef<number[]>([]);
  const initializedRef = useRef(false);

  // Load setting from SecureStore on mount
  useEffect(() => {
    const loadSetting = async (): Promise<void> => {
      try {
        const stored = await secureStorage.getItemAsync(QUICK_ESCAPE_KEY);
        if (stored === 'true') {
          setIsEnabled(true);
        }
        initializedRef.current = true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to load quick escape setting', { error: message });
      }
    };

    void loadSetting();
  }, []);

  const setEnabled = useCallback(async (enabled: boolean): Promise<void> => {
    try {
      await secureStorage.setItemAsync(QUICK_ESCAPE_KEY, enabled ? 'true' : 'false');
      setIsEnabled(enabled);
      logger.info('Quick escape setting updated', { enabled });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to save quick escape setting', { error: message });
    }
  }, []);

  const triggerEscape = useCallback(async (): Promise<void> => {
    try {
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {
      // Haptics not available
    }

    logger.info('Quick escape triggered');
    setIsEscapeTriggered(true);
    tapTimestampsRef.current = [];
  }, []);

  const registerTap = useCallback((): void => {
    if (!isEnabled) return;

    const now = Date.now();
    const recentTaps = tapTimestampsRef.current.filter(
      (t) => now - t < TAP_WINDOW_MS,
    );
    recentTaps.push(now);
    tapTimestampsRef.current = recentTaps;

    if (recentTaps.length >= TAP_THRESHOLD) {
      tapTimestampsRef.current = [];
      void triggerEscape();
    }
  }, [isEnabled, triggerEscape]);

  const resetEscape = useCallback((): void => {
    setIsEscapeTriggered(false);
    tapTimestampsRef.current = [];
  }, []);

  return {
    isEnabled,
    setEnabled,
    isEscapeTriggered,
    registerTap,
    resetEscape,
  };
}

// ========================================
// Quick Escape Tap Zone Component
// ========================================

interface QuickEscapeTapZoneProps {
  /** Children to render inside the tap zone */
  children: React.ReactNode;
  /** Register tap callback from useQuickEscape */
  onTripleTap: () => void;
  /** Whether the feature is enabled */
  enabled: boolean;
}

/**
 * Invisible tap zone at the top of the screen.
 * Triple-tapping this area triggers the quick escape.
 */
export function QuickEscapeTapZone({
  children,
  onTripleTap,
  enabled,
}: QuickEscapeTapZoneProps): ReactElement {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <Pressable
        onPress={onTripleTap}
        style={tapZoneStyles.zone}
        accessibilityLabel="Quick escape zone"
        accessibilityRole="button"
        accessibilityHint="Triple-tap quickly to lock the app"
      />
    </>
  );
}

const tapZoneStyles = StyleSheet.create({
  zone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    zIndex: 9999,
  },
});
