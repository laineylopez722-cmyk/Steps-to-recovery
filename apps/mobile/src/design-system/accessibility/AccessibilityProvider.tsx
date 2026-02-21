/**
 * AccessibilityProvider
 *
 * Context provider for accessibility settings.
 * Tracks and persists user accessibility preferences including
 * high contrast, reduced motion, large text, and screen reader state.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AccessibilityInfo, type AccessibilityChangeEventName } from 'react-native';
import { mmkvStorage } from '../../lib/mmkv';
import type { AccessibilitySettings } from './types';
import { DEFAULT_TEXT_SCALE } from './constants';
import { logger } from '../../utils/logger';

/** Storage key for accessibility preferences */
const STORAGE_KEY = '@accessibility_settings';

/** Default accessibility settings */
const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  reduceMotion: false,
  largeText: DEFAULT_TEXT_SCALE,
  screenReaderEnabled: false,
  boldTextEnabled: false,
  grayscaleEnabled: false,
  invertColorsEnabled: false,
};

/** Context value type */
export interface AccessibilityContextValue extends AccessibilitySettings {
  /** Update a specific setting */
  setSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K],
  ) => Promise<void>;
  /** Toggle high contrast mode */
  toggleHighContrast: () => Promise<void>;
  /** Toggle reduced motion */
  toggleReduceMotion: () => Promise<void>;
  /** Set text scale */
  setTextScale: (scale: number) => Promise<void>;
  /** Reset all settings to defaults */
  resetSettings: () => Promise<void>;
  /** Whether settings have loaded */
  isLoading: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

/** Props for AccessibilityProvider */
export interface AccessibilityProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for accessibility settings
 * Automatically detects and tracks system accessibility preferences
 */
export function AccessibilityProvider({
  children,
}: AccessibilityProviderProps): React.ReactElement {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async (): Promise<void> => {
      try {
        const saved = mmkvStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<AccessibilitySettings>;
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch (error) {
        logger.error('Failed to load accessibility settings', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Persist settings when they change
  const persistSettings = useCallback(async (newSettings: AccessibilitySettings): Promise<void> => {
    try {
      mmkvStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      logger.error('Failed to save accessibility settings', error);
    }
  }, []);

  // Listen for system screen reader changes
  useEffect(() => {
    const handleScreenReaderChange = (enabled: boolean): void => {
      setSettings((prev) => ({ ...prev, screenReaderEnabled: enabled }));
    };

    // Get initial state
    AccessibilityInfo.isScreenReaderEnabled().then(handleScreenReaderChange).catch(() => {});

    // Subscribe to changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged' as AccessibilityChangeEventName,
      handleScreenReaderChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Listen for reduce motion changes
  useEffect(() => {
    const handleReduceMotionChange = (enabled: boolean): void => {
      setSettings((prev) => ({ ...prev, reduceMotion: enabled }));
    };

    // Get initial state
    AccessibilityInfo.isReduceMotionEnabled?.().then(handleReduceMotionChange).catch(() => {});

    // Subscribe to changes if available
    if (AccessibilityInfo.addEventListener) {
      const subscription = AccessibilityInfo.addEventListener(
        'reduceMotionChanged' as AccessibilityChangeEventName,
        handleReduceMotionChange,
      );

      return () => {
        subscription.remove();
      };
    }
  }, []);

  // Listen for bold text changes (iOS only)
  useEffect(() => {
    if (AccessibilityInfo.isBoldTextEnabled) {
      const handleBoldTextChange = (enabled: boolean): void => {
        setSettings((prev) => ({ ...prev, boldTextEnabled: enabled }));
      };

      AccessibilityInfo.isBoldTextEnabled().then(handleBoldTextChange).catch(() => {});

      const subscription = AccessibilityInfo.addEventListener(
        'boldTextChanged' as AccessibilityChangeEventName,
        handleBoldTextChange,
      );

      return () => {
        subscription.remove();
      };
    }
  }, []);

  // Listen for grayscale changes (iOS only)
  useEffect(() => {
    if (AccessibilityInfo.isGrayscaleEnabled) {
      const handleGrayscaleChange = (enabled: boolean): void => {
        setSettings((prev) => ({ ...prev, grayscaleEnabled: enabled }));
      };

      AccessibilityInfo.isGrayscaleEnabled().then(handleGrayscaleChange).catch(() => {});

      const subscription = AccessibilityInfo.addEventListener(
        'grayscaleChanged' as AccessibilityChangeEventName,
        handleGrayscaleChange,
      );

      return () => {
        subscription.remove();
      };
    }
  }, []);

  // Listen for invert colors changes
  useEffect(() => {
    if (AccessibilityInfo.isInvertColorsEnabled) {
      const handleInvertColorsChange = (enabled: boolean): void => {
        setSettings((prev) => ({ ...prev, invertColorsEnabled: enabled }));
      };

      AccessibilityInfo.isInvertColorsEnabled().then(handleInvertColorsChange).catch(() => {});

      const subscription = AccessibilityInfo.addEventListener(
        'invertColorsChanged' as AccessibilityChangeEventName,
        handleInvertColorsChange,
      );

      return () => {
        subscription.remove();
      };
    }
  }, []);

  // Update setting helper
  const setSetting = useCallback(
    async <K extends keyof AccessibilitySettings>(
      key: K,
      value: AccessibilitySettings[K],
    ): Promise<void> => {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await persistSettings(newSettings);
    },
    [settings, persistSettings],
  );

  // Toggle high contrast
  const toggleHighContrast = useCallback(async (): Promise<void> => {
    await setSetting('highContrast', !settings.highContrast);
  }, [settings.highContrast, setSetting]);

  // Toggle reduce motion
  const toggleReduceMotion = useCallback(async (): Promise<void> => {
    await setSetting('reduceMotion', !settings.reduceMotion);
  }, [settings.reduceMotion, setSetting]);

  // Set text scale
  const setTextScale = useCallback(
    async (scale: number): Promise<void> => {
      const clampedScale = Math.max(1, Math.min(2, scale));
      await setSetting('largeText', clampedScale);
    },
    [setSetting],
  );

  // Reset all settings
  const resetSettings = useCallback(async (): Promise<void> => {
    setSettings(DEFAULT_SETTINGS);
    await persistSettings(DEFAULT_SETTINGS);
  }, [persistSettings]);

  const value: AccessibilityContextValue = {
    ...settings,
    setSetting,
    toggleHighContrast,
    toggleReduceMotion,
    setTextScale,
    resetSettings,
    isLoading,
  };

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

/**
 * Hook to access accessibility context
 * @throws Error if used outside AccessibilityProvider
 * @returns Accessibility context value
 */
export function useAccessibilityContext(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider');
  }
  return context;
}

export default AccessibilityProvider;
