/**
 * useFadeAnimation Hook
 *
 * Fade in/out animation with reduced motion support.
 *
 * @example
 * ```tsx
 * // Fade in on mount
 * const { animatedStyle, fadeIn } = useFadeAnimation({
 *   duration: 300,
 *   autoPlay: true,
 * });
 *
 * // Manual control
 * <Button onPress={fadeIn}>Fade In</Button>
 * <Button onPress={fadeOut}>Fade Out</Button>
 * <Animated.View style={[{ opacity: 0 }, animatedStyle]} />
 * ```
 */

import { useCallback, useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  type WithTimingConfig,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { useReducedMotion, Durations, getReducedMotionDuration, Springs } from '../presets/motion';

// ============================================================================
// TYPES
// ============================================================================

/** Fade animation options */
export interface UseFadeAnimationOptions {
  /** Initial opacity value */
  initialOpacity?: number;
  /** Target opacity when visible */
  targetOpacity?: number;
  /** Animation duration in ms */
  duration?: number;
  /** Use spring instead of timing */
  useSpring?: boolean;
  /** Spring configuration (if useSpring is true) */
  springConfig?: WithSpringConfig;
  /** Timing configuration (if useSpring is false) */
  timingConfig?: WithTimingConfig;
  /** Auto-play animation on mount */
  autoPlay?: boolean;
  /** Delay before auto-playing */
  autoPlayDelay?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Callback when fade in completes */
  onFadeIn?: () => void;
  /** Callback when fade out completes */
  onFadeOut?: () => void;
}

/** Fade animation result */
export interface UseFadeAnimationReturn {
  /** Animated style with opacity */
  animatedStyle: { opacity: number };
  /** Fade in animation */
  fadeIn: (callback?: () => void) => void;
  /** Fade out animation */
  fadeOut: (callback?: () => void) => void;
  /** Toggle between fade in/out */
  toggle: () => void;
  /** Set opacity directly */
  setOpacity: (value: number) => void;
  /** Current opacity value */
  opacity: number;
  /** Whether currently visible (target opacity reached) */
  isVisible: boolean;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_OPTIONS: Required<UseFadeAnimationOptions> = {
  initialOpacity: 0,
  targetOpacity: 1,
  duration: Durations.STANDARD,
  useSpring: false,
  springConfig: Springs.gentle,
  timingConfig: { duration: Durations.STANDARD },
  autoPlay: false,
  autoPlayDelay: 0,
  onComplete: () => {},
  onFadeIn: () => {},
  onFadeOut: () => {},
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for fade animations
 * @param options - Animation configuration
 * @returns Animation controls and styles
 */
export function useFadeAnimation(
  options: UseFadeAnimationOptions = {}
): UseFadeAnimationReturn {
  const {
    initialOpacity,
    targetOpacity,
    duration,
    useSpring,
    springConfig,
    timingConfig,
    autoPlay,
    autoPlayDelay,
    onComplete,
    onFadeIn,
    onFadeOut,
  } = { ...DEFAULT_OPTIONS, ...options };

  const isReducedMotion = useReducedMotion();
  const opacity = useSharedValue(initialOpacity);

  // Get effective duration based on reduced motion
  const effectiveDuration = getReducedMotionDuration(
    duration,
    isReducedMotion ? 'instant' : 'subtle'
  );

  // Auto-play on mount
  useEffect(() => {
    if (autoPlay) {
      const timer = setTimeout(() => {
        fadeIn();
      }, autoPlayDelay);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, autoPlayDelay]);

  // Fade in animation
  const fadeIn = useCallback(
    (callback?: () => void) => {
      const completionCallback = (finished: boolean | undefined) => {
        if (finished) {
          onFadeIn();
          onComplete();
          callback?.();
        }
      };

      if (isReducedMotion) {
        opacity.value = withTiming(targetOpacity, { duration: effectiveDuration }, (finished) => {
          runOnJS(completionCallback)(finished);
        });
      } else if (useSpring) {
        opacity.value = withSpring(targetOpacity, springConfig, (finished) => {
          runOnJS(completionCallback)(finished);
        });
      } else {
        opacity.value = withTiming(
          targetOpacity,
          { ...timingConfig, duration: effectiveDuration || duration },
          (finished) => {
            runOnJS(completionCallback)(finished);
          }
        );
      }
    },
    [targetOpacity, effectiveDuration, useSpring, springConfig, timingConfig, duration, isReducedMotion, opacity, onFadeIn, onComplete]
  );

  // Fade out animation
  const fadeOut = useCallback(
    (callback?: () => void) => {
      const completionCallback = (finished: boolean | undefined) => {
        if (finished) {
          onFadeOut();
          onComplete();
          callback?.();
        }
      };

      if (isReducedMotion) {
        opacity.value = withTiming(0, { duration: effectiveDuration }, (finished) => {
          runOnJS(completionCallback)(finished);
        });
      } else if (useSpring) {
        opacity.value = withSpring(0, springConfig, (finished) => {
          runOnJS(completionCallback)(finished);
        });
      } else {
        opacity.value = withTiming(
          0,
          { ...timingConfig, duration: effectiveDuration || duration },
          (finished) => {
            runOnJS(completionCallback)(finished);
          }
        );
      }
    },
    [effectiveDuration, useSpring, springConfig, timingConfig, duration, isReducedMotion, opacity, onFadeOut, onComplete]
  );

  // Toggle animation
  const toggle = useCallback(() => {
    const currentOpacity = opacity.value;
    const midPoint = (initialOpacity + targetOpacity) / 2;

    if (currentOpacity < midPoint) {
      fadeIn();
    } else {
      fadeOut();
    }
  }, [fadeIn, fadeOut, initialOpacity, targetOpacity, opacity]);

  // Set opacity directly
  const setOpacity = useCallback(
    (value: number) => {
      if (isReducedMotion) {
        opacity.value = value;
      } else {
        opacity.value = withTiming(value, { duration: effectiveDuration || 100 });
      }
    },
    [isReducedMotion, effectiveDuration, opacity]
  );

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return {
    animatedStyle,
    fadeIn,
    fadeOut,
    toggle,
    setOpacity,
    opacity: opacity.value,
    isVisible: opacity.value >= targetOpacity * 0.9,
  };
}

// ============================================================================
// VARIANT HOOKS
// ============================================================================

/**
 * Quick fade for micro-interactions
 */
export function useQuickFade(options: Omit<UseFadeAnimationOptions, 'duration'> = {}): UseFadeAnimationReturn {
  return useFadeAnimation({
    duration: Durations.QUICK,
    ...options,
  });
}

/**
 * Slow fade for emphasis
 */
export function useSlowFade(options: Omit<UseFadeAnimationOptions, 'duration'> = {}): UseFadeAnimationReturn {
  return useFadeAnimation({
    duration: Durations.SLOW,
    ...options,
  });
}

/**
 * Spring fade for bouncy feel
 */
export function useSpringFade(options: Omit<UseFadeAnimationOptions, 'useSpring'> = {}): UseFadeAnimationReturn {
  return useFadeAnimation({
    useSpring: true,
    springConfig: Springs.gentle,
    ...options,
  });
}

export default useFadeAnimation;
