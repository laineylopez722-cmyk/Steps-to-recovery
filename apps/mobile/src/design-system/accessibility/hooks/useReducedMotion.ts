/**
 * useReducedMotion Hook
 *
 * Detects system reduced motion preference with detailed settings.
 * Persists user overrides in AsyncStorage and listens to system setting changes.
 *
 * @example
 * ```tsx
 * const { isReducedMotion, settings, toggleOverride } = useReducedMotion();
 *
 * // Conditionally render animations
 * {isReducedMotion ? <StaticView /> : <AnimatedView />}
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { AccessibilityInfo, type AccessibilityChangeEventName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Storage key for user override */
const STORAGE_KEY = '@reduced_motion_override';

/** Detailed reduced motion settings */
export interface ReducedMotionSettings {
  /** System reduced motion is enabled */
  systemPreference: boolean;
  /** User has overridden the setting */
  userOverride: boolean | null;
  /** Final effective value (user override takes precedence) */
  isReducedMotion: boolean;
  /** Whether to animate at all (true if reduced motion) */
  shouldAnimate: boolean;
  /** Animation scale factor (0 for reduced motion, 1 for normal) */
  animationScale: number;
}

/** Hook return type */
export interface UseReducedMotionReturn extends ReducedMotionSettings {
  /** Set user override (true = always reduce, false = never reduce, null = follow system) */
  setOverride: (value: boolean | null) => Promise<void>;
  /** Toggle between override states */
  toggleOverride: () => Promise<void>;
  /** Get animation duration adjusted for reduced motion */
  getDuration: (baseDuration: number) => number;
  /** Get spring config adjusted for reduced motion */
  getSpringConfig: <T extends { damping?: number; stiffness?: number }>(config: T) => T;
  /** Whether settings are still loading */
  isLoading: boolean;
}

/**
 * Detects system reduced motion preference with user override support
 * @returns Reduced motion state and control functions
 */
export function useReducedMotion(): UseReducedMotionReturn {
  const [systemPreference, setSystemPreference] = useState<boolean>(false);
  const [userOverride, setUserOverrideState] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  // Load saved override on mount
  useEffect(() => {
    const loadOverride = async (): Promise<void> => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved !== null && mountedRef.current) {
          setUserOverrideState(saved === 'true' ? true : saved === 'false' ? false : null);
        }
      } catch (error) {
        // Silently fail - use system preference
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadOverride();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Listen for system reduced motion changes
  useEffect(() => {
    const checkSystemPreference = async (): Promise<void> => {
      try {
        const isEnabled = await AccessibilityInfo.isReduceMotionEnabled?.();
        if (mountedRef.current && isEnabled !== null) {
          setSystemPreference(isEnabled);
        }
      } catch {
        // Fallback to false
      }
    };

    checkSystemPreference();

    // Subscribe to changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged' as AccessibilityChangeEventName,
      (isEnabled: boolean) => {
        if (mountedRef.current) {
          setSystemPreference(isEnabled);
        }
      }
    );

    return () => {
      subscription?.remove?.();
    };
  }, []);

  // Calculate effective value
  const isReducedMotion = userOverride ?? systemPreference;
  const shouldAnimate = !isReducedMotion;
  const animationScale = isReducedMotion ? 0 : 1;

  /**
   * Set user override
   * @param value - true to force reduced motion, false to force animations, null to follow system
   */
  const setOverride = useCallback(async (value: boolean | null): Promise<void> => {
    try {
      if (value === null) {
        await AsyncStorage.removeItem(STORAGE_KEY);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, String(value));
      }
      if (mountedRef.current) {
        setUserOverrideState(value);
      }
    } catch (error) {
      // Silently fail
    }
  }, []);

  /**
   * Toggle through override states: null → true → false → null
   */
  const toggleOverride = useCallback(async (): Promise<void> => {
    if (userOverride === null) {
      await setOverride(true);
    } else if (userOverride === true) {
      await setOverride(false);
    } else {
      await setOverride(null);
    }
  }, [userOverride, setOverride]);

  /**
   * Get animation duration adjusted for reduced motion
   * Returns 0 for reduced motion (instant), original duration otherwise
   */
  const getDuration = useCallback(
    (baseDuration: number): number => {
      if (isReducedMotion) {
        return 0;
      }
      return baseDuration;
    },
    [isReducedMotion]
  );

  /**
   * Get spring config adjusted for reduced motion
   * Returns instant spring for reduced motion
   */
  const getSpringConfig = useCallback(
    <T extends { damping?: number; stiffness?: number }>(config: T): T => {
      if (isReducedMotion) {
        return {
          ...config,
          damping: 1000, // Very high damping = no oscillation
          stiffness: 1000, // Very high stiffness = instant
        } as T;
      }
      return config;
    },
    [isReducedMotion]
  );

  return {
    // Settings
    systemPreference,
    userOverride,
    isReducedMotion,
    shouldAnimate,
    animationScale,
    // Actions
    setOverride,
    toggleOverride,
    getDuration,
    getSpringConfig,
    isLoading,
  };
}

export default useReducedMotion;
