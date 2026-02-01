/**
 * Animation configurations for React Native Animated API
 * Provides consistent spring and timing values throughout the app
 */

import { Easing } from 'react-native';

/**
 * Spring animation configurations
 */
export const springConfigs = {
  // Default spring - smooth, natural feel
  default: {
    tension: 40,
    friction: 8,
    useNativeDriver: true,
  },

  // Bouncy spring - energetic, playful
  bouncy: {
    tension: 50,
    friction: 3,
    useNativeDriver: true,
  },

  // Gentle spring - subtle, calming
  gentle: {
    tension: 30,
    friction: 10,
    useNativeDriver: true,
  },

  // Stiff spring - quick, responsive
  stiff: {
    tension: 100,
    friction: 10,
    useNativeDriver: true,
  },
} as const;

/**
 * Timing animation durations (milliseconds)
 */
export const timingDurations = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 350,
  verySlow: 500,
} as const;

// Alias for backward compatibility
export const durations = timingDurations;

/**
 * Common easing curves for timing animations
 */
export const easingCurves = {
  linear: Easing.linear,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),

  // Specialized curves
  bounceOut: Easing.bounce,
  elasticOut: Easing.elastic(1),
} as const;

/**
 * Scale values for interactive elements
 */
export const scales = {
  // Press feedback (slightly smaller)
  press: 0.98,

  // Active state
  active: 0.95,

  // Bounce effect (slightly larger)
  bounce: 1.15,

  // Emphasis
  emphasis: 1.05,
} as const;

/**
 * Opacity values for fade animations
 */
export const opacities = {
  hidden: 0,
  visible: 1,
  disabled: 0.5,
  pressed: 0.7,
  overlay: 0.5,
  overlayDark: 0.7,
} as const;

/**
 * Helper to create standard timing config
 */
export function createTimingConfig(
  duration: keyof typeof timingDurations = 'normal',
  easing: keyof typeof easingCurves = 'easeOut',
) {
  return {
    duration: timingDurations[duration],
    easing: easingCurves[easing],
    useNativeDriver: true,
  };
}

/**
 * Pre-configured animation configs for common use cases
 */
export const animationPresets = {
  // Fade in animation
  fadeIn: {
    duration: timingDurations.normal,
    easing: easingCurves.easeOut,
    useNativeDriver: true,
  },

  // Slide in animation
  slideIn: {
    duration: timingDurations.normal,
    easing: easingCurves.easeOut,
    useNativeDriver: true,
  },

  // Scale animation (bounce effect)
  scaleBounce: springConfigs.bouncy,

  // Press animation
  press: {
    duration: timingDurations.fast,
    easing: easingCurves.easeInOut,
    useNativeDriver: true,
  },
} as const;

export type SpringConfigKey = keyof typeof springConfigs;
export type TimingDurationKey = keyof typeof timingDurations;
export type EasingCurveKey = keyof typeof easingCurves;

/**
 * Reanimated-compatible spring configurations
 * Uses damping and stiffness instead of tension and friction
 */
export const reanimatedSprings = {
  // Default spring - smooth, natural feel
  default: {
    damping: 15,
    stiffness: 150,
  },

  // Bouncy spring - energetic, playful
  bouncy: {
    damping: 8,
    stiffness: 200,
  },

  // Gentle spring - subtle, calming
  gentle: {
    damping: 20,
    stiffness: 100,
  },

  // Stiff spring - quick, responsive
  stiff: {
    damping: 20,
    stiffness: 300,
  },

  // Snappy spring - for quick interactions
  snappy: {
    damping: 25,
    stiffness: 400,
  },

  // Soft spring - for subtle movements
  soft: {
    damping: 30,
    stiffness: 80,
  },
} as const;

export type ReanimatedSpringKey = keyof typeof reanimatedSprings;
