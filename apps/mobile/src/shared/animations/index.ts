/**
 * Shared Animation Presets
 *
 * Reusable animation configurations for consistent motion design across the app.
 * Uses react-native-reanimated for performant, native animations.
 *
 * Provides:
 * - Spring configurations for different contexts
 * - Timing presets for various animation speeds
 * - Helper functions for common animation patterns
 * - Entering/exiting presets for layout animations
 *
 * @module animations
 */

import {
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

// Spring presets for different contexts
export const SPRING_CONFIGS = {
  // Quick, snappy feedback for buttons/taps
  snappy: {
    damping: 15,
    stiffness: 300,
    mass: 0.8,
  },
  // Gentle, smooth animations for cards/modals
  gentle: {
    damping: 20,
    stiffness: 180,
    mass: 1,
  },
  // Bouncy animations for celebrations/achievements
  bouncy: {
    damping: 8,
    stiffness: 200,
    mass: 0.6,
  },
  // Responsive for sliders/drags
  responsive: {
    damping: 25,
    stiffness: 400,
    mass: 0.5,
  },
} as const;

// Timing presets
export const TIMING_CONFIGS = {
  fast: {
    duration: 150,
    easing: Easing.out(Easing.cubic),
  },
  normal: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },
  slow: {
    duration: 500,
    easing: Easing.out(Easing.cubic),
  },
  // For counting animations
  countUp: {
    duration: 1500,
    easing: Easing.out(Easing.cubic),
  },
} as const;

// Animation functions

/**
 * Animate a shared value for counting up effect
 *
 * Useful for animating numbers (e.g., days clean, achievement counts).
 *
 * @param sharedValue - The shared value to animate
 * @param targetValue - Target number to count up to
 * @param duration - Animation duration in milliseconds (default: 1500ms)
 * @example
 * ```ts
 * const count = useSharedValue(0);
 * animateCountUp(count, 30); // Animates from 0 to 30
 * ```
 */
export function animateCountUp(
  sharedValue: SharedValue<number>,
  targetValue: number,
  duration: number = 1500,
): void {
  'worklet';
  sharedValue.value = withTiming(targetValue, {
    duration,
    easing: Easing.out(Easing.cubic),
  });
}

/**
 * Create a scale press animation
 */
export function animatePress(scaleValue: SharedValue<number>, pressed: boolean) {
  'worklet';
  scaleValue.value = withSpring(pressed ? 0.95 : 1, SPRING_CONFIGS.snappy);
}

/**
 * Create a pulse animation for emergency/attention elements
 */
export function animatePulse(scaleValue: SharedValue<number>, opacityValue: SharedValue<number>) {
  'worklet';
  scaleValue.value = withSequence(
    withTiming(1.05, { duration: 500, easing: Easing.inOut(Easing.ease) }),
    withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
  );
  opacityValue.value = withSequence(
    withTiming(0.7, { duration: 500 }),
    withTiming(1, { duration: 500 }),
  );
}

/**
 * Stagger delay calculator for list items
 */
export function getStaggerDelay(index: number, baseDelay: number = 50): number {
  return index * baseDelay;
}

/**
 * Create a fade in up animation
 */
export function animateFadeInUp(
  opacityValue: SharedValue<number>,
  translateYValue: SharedValue<number>,
  delay: number = 0,
) {
  'worklet';
  opacityValue.value = withDelay(
    delay,
    withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
  );
  translateYValue.value = withDelay(
    delay,
    withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
  );
}

/**
 * Create a scale bounce animation for celebrations
 */
export function animateCelebration(scaleValue: SharedValue<number>) {
  'worklet';
  scaleValue.value = withSequence(
    withSpring(1.2, SPRING_CONFIGS.bouncy),
    withSpring(0.9, SPRING_CONFIGS.bouncy),
    withSpring(1.05, SPRING_CONFIGS.bouncy),
    withSpring(1, SPRING_CONFIGS.gentle),
  );
}

// Entering/Exiting animation presets for Reanimated layout animations
export const ENTERING_PRESETS = {
  fadeIn: {
    duration: 300,
    initialValues: { opacity: 0 },
    animations: { opacity: 1 },
  },
  fadeInUp: {
    duration: 400,
    initialValues: { opacity: 0, transform: [{ translateY: 20 }] },
    animations: { opacity: 1, transform: [{ translateY: 0 }] },
  },
  scaleIn: {
    duration: 300,
    initialValues: { opacity: 0, transform: [{ scale: 0.9 }] },
    animations: { opacity: 1, transform: [{ scale: 1 }] },
  },
} as const;

export const EXITING_PRESETS = {
  fadeOut: {
    duration: 200,
    animations: { opacity: 0 },
  },
  fadeOutDown: {
    duration: 300,
    animations: { opacity: 0, transform: [{ translateY: 20 }] },
  },
  scaleOut: {
    duration: 200,
    animations: { opacity: 0, transform: [{ scale: 0.9 }] },
  },
} as const;

// Easing curves for specific use cases
export const EASINGS = {
  // Default ease out for most animations
  default: Easing.out(Easing.cubic),
  // Smooth ease in-out for looping animations
  smooth: Easing.inOut(Easing.ease),
  // Decelerate for elements coming to rest
  decelerate: Easing.out(Easing.quad),
  // Anticipation for playful animations
  anticipate: Easing.bezier(0.175, 0.885, 0.32, 1.275),
} as const;
