/**
 * useScaleAnimation Hook
 *
 * Scale animation for celebrations with spring physics.
 * Reduced motion: simple fade instead of bounce.
 *
 * @example
 * ```tsx
 * // Scale celebration for milestone
 * const { animatedStyle, trigger, reset } = useScaleAnimation({
 *   from: 0.5,
 *   to: 1.2,
 *   spring: { damping: 10, stiffness: 200 },
 * });
 *
 * trigger(); // Animates from 0.5 → 1.2 → 1.0
 *
 * <Animated.View style={animatedStyle}>
 *   <TrophyIcon />
 * </Animated.View>
 * ```
 */

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { useReducedMotion, Durations, Springs } from '../presets/motion';

// ============================================================================
// TYPES
// ============================================================================

/** Scale animation options */
export interface UseScaleAnimationOptions {
  /** Initial scale value */
  from?: number;
  /** Target scale value (peak) */
  to?: number;
  /** Final scale value (rest) */
  final?: number;
  /** Spring configuration for bounce */
  spring?: WithSpringConfig;
  /** Duration for reduced motion fallback */
  reducedMotionDuration?: number;
  /** Delay before animation starts (ms) */
  delay?: number;
  /** Auto-play on mount */
  autoPlay?: boolean;
  /** Whether to bounce (overshoot final) */
  bounce?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Callback when animation starts */
  onStart?: () => void;
}

/** Scale animation result */
export interface UseScaleAnimationReturn {
  /** Animated style with transform */
  animatedStyle: { transform: [{ scale: number }] };
  /** Trigger the scale animation */
  trigger: (callback?: () => void) => void;
  /** Reset to initial state */
  reset: () => void;
  /** Set scale directly */
  setScale: (value: number) => void;
  /** Current scale value */
  scale: number;
  /** Whether animation is in progress */
  isAnimating: boolean;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_OPTIONS: Required<UseScaleAnimationOptions> = {
  from: 0.5,
  to: 1.2,
  final: 1,
  spring: Springs.celebration,
  reducedMotionDuration: Durations.FAST,
  delay: 0,
  autoPlay: false,
  bounce: true,
  onComplete: () => {},
  onStart: () => {},
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for scale animations with spring physics
 * @param options - Animation configuration
 * @returns Animation controls and styles
 */
export function useScaleAnimation(
  options: UseScaleAnimationOptions = {}
): UseScaleAnimationReturn {
  const {
    from,
    to,
    final,
    spring,
    reducedMotionDuration,
    delay,
    autoPlay,
    bounce,
    onComplete,
    onStart,
  } = { ...DEFAULT_OPTIONS, ...options };

  const isReducedMotion = useReducedMotion();
  const scale = useSharedValue(from);
  const isAnimating = useSharedValue(false);

  // Trigger animation
  const trigger = useCallback(
    (callback?: () => void) => {
      const startAnimation = () => {
        isAnimating.value = true;
        runOnJS(onStart)();

        const completionCallback = (finished: boolean | undefined) => {
          isAnimating.value = false;
          if (finished) {
            runOnJS(onComplete)();
            callback?.();
          }
        };

        if (isReducedMotion) {
          // Reduced motion: simple fade to final
          scale.value = withTiming(
            final,
            { duration: reducedMotionDuration },
            (finished) => {
              runOnJS(completionCallback)(finished);
            }
          );
        } else if (bounce) {
          // Full animation: from → to → final with spring
          scale.value = withSequence(
            withTiming(from, { duration: 0 }),
            withSpring(to, spring),
            withSpring(final, { ...spring, damping: spring.damping * 1.2 })
          );

          // Manual completion tracking for sequence
          const totalDuration = 800; // Approximate
          setTimeout(() => {
            runOnJS(completionCallback)(true);
          }, totalDuration);
        } else {
          // No bounce: direct spring to final
          scale.value = withSpring(final, spring, (finished) => {
            runOnJS(completionCallback)(finished);
          });
        }
      };

      if (delay > 0) {
        setTimeout(startAnimation, delay);
      } else {
        startAnimation();
      }
    },
    [from, to, final, spring, reducedMotionDuration, delay, bounce, isReducedMotion, scale, isAnimating, onComplete, onStart]
  );

  // Reset to initial state
  const reset = useCallback(() => {
    isAnimating.value = false;
    if (isReducedMotion) {
      scale.value = from;
    } else {
      scale.value = withTiming(from, { duration: 100 });
    }
  }, [from, isReducedMotion, scale, isAnimating]);

  // Set scale directly
  const setScale = useCallback(
    (value: number) => {
      scale.value = value;
    },
    [scale]
  );

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    animatedStyle,
    trigger,
    reset,
    setScale,
    scale: scale.value,
    isAnimating: isAnimating.value,
  };
}

// ============================================================================
// VARIANT HOOKS
// ============================================================================

/**
 * Celebration scale animation (milestone, achievement)
 */
export function useCelebrationScale(
  options: Omit<UseScaleAnimationOptions, 'to' | 'bounce'> = {}
): UseScaleAnimationReturn {
  return useScaleAnimation({
    from: 0,
    to: 1.3,
    final: 1,
    spring: Springs.celebration,
    bounce: true,
    ...options,
  });
}

/**
 * Pulse scale animation (attention, emphasis)
 */
export function usePulseScale(
  options: Omit<UseScaleAnimationOptions, 'from' | 'to' | 'final'> = {}
): UseScaleAnimationReturn {
  return useScaleAnimation({
    from: 1,
    to: 1.1,
    final: 1,
    spring: Springs.gentle,
    bounce: false,
    ...options,
  });
}

/**
 * Pop scale animation (buttons, icons)
 */
export function usePopScale(
  options: Omit<UseScaleAnimationOptions, 'from' | 'to' | 'final'> = {}
): UseScaleAnimationReturn {
  return useScaleAnimation({
    from: 0.8,
    to: 1.05,
    final: 1,
    spring: Springs.snappy,
    bounce: true,
    ...options,
  });
}

export default useScaleAnimation;
