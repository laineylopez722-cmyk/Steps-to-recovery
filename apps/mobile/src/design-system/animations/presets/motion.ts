/**
 * Motion Presets
 *
 * Duration constants and easing functions for consistent animations.
 * Includes reduced motion variants for accessibility.
 *
 * @example
 * ```tsx
 * import { Durations, Easings, useReducedMotionVariant } from './motion';
 *
 * // Use duration constant
 * const duration = Durations.NORMAL;
 *
 * // Use easing function
 * const easing = Easings.easeOut;
 *
 * // Get reduced-motion-aware variant
 * const variant = useReducedMotionVariant();
 * ```
 */

import { Easing, type EasingFunctionFactory } from 'react-native-reanimated';
export { useReducedMotion } from 'react-native-reanimated';

// ============================================================================
// DURATION CONSTANTS
// ============================================================================

/** Duration presets in milliseconds */
export const Durations = {
  /** Instant - no animation (0ms) */
  INSTANT: 0,

  /** Fast - quick feedback (50ms) */
  FAST: 50,

  /** Quick - micro-interactions (100ms) */
  QUICK: 100,

  /** Normal - standard micro-interactions (150ms) */
  NORMAL: 150,

  /** Standard - most transitions (200ms) */
  STANDARD: 200,

  /** Emphasized - prominent animations (300ms) */
  EMPHASIZED: 300,

  /** Slow - dramatic emphasis (500ms) */
  SLOW: 500,

  /** Celebration - milestone animations (800ms) */
  CELEBRATION: 800,

  /** Extended - long animations (1000ms+) */
  EXTENDED: 1000,
} as const;

/** MD3 Material Design duration scale */
export const MD3Durations = {
  // Short - micro-interactions
  short1: 50,
  short2: 100,
  short3: 150,
  short4: 200,

  // Medium - standard transitions
  medium1: 250,
  medium2: 300,
  medium3: 350,
  medium4: 400,

  // Long - emphasized transitions
  long1: 450,
  long2: 500,
  long3: 550,
  long4: 600,

  // Extra long - complex animations
  extraLong1: 700,
  extraLong2: 800,
  extraLong3: 900,
  extraLong4: 1000,
} as const;

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

/** Easing function presets */
export const Easings = {
  /** Linear - constant speed */
  linear: Easing.linear,

  /** Ease in - accelerate from zero */
  easeIn: Easing.in(Easing.cubic),

  /** Ease out - decelerate to zero */
  easeOut: Easing.out(Easing.cubic),

  /** Ease in out - accelerate then decelerate */
  easeInOut: Easing.inOut(Easing.cubic),

  /** Spring - physics-based bounce */
  spring: Easing.out(Easing.elastic(1)),

  /** Bounce - exaggerated bounce */
  bounce: Easing.out(Easing.bounce),

  /** Emphasized - MD3 emphasized decelerate */
  emphasized: Easing.bezier(0.05, 0.7, 0.1, 1.0),

  /** Emphasized accelerate - MD3 emphasized accelerate */
  emphasizedAccelerate: Easing.bezier(0.3, 0.0, 0.8, 0.15),

  /** Standard - MD3 standard */
  standard: Easing.bezier(0.2, 0.0, 0.0, 1.0),

  /** Standard accelerate - quick exit */
  standardAccelerate: Easing.bezier(0.3, 0.0, 1.0, 1.0),

  /** Standard decelerate - smooth entrance */
  standardDecelerate: Easing.bezier(0.0, 0.0, 0.0, 1.0),
} as const;

/** MD3 Material Design easing curves */
export const MD3Easings = {
  // Standard
  standard: Easing.bezier(0.2, 0.0, 0.0, 1.0),
  standardAccelerate: Easing.bezier(0.3, 0.0, 1.0, 1.0),
  standardDecelerate: Easing.bezier(0.0, 0.0, 0.0, 1.0),

  // Emphasized
  emphasized: Easing.bezier(0.2, 0.0, 0.0, 1.0),
  emphasizedAccelerate: Easing.bezier(0.3, 0.0, 0.8, 0.15),
  emphasizedDecelerate: Easing.bezier(0.05, 0.7, 0.1, 1.0),
} as const;

// ============================================================================
// SPRING CONFIGURATIONS
// ============================================================================

/** Spring animation configurations */
export const Springs = {
  /** Gentle - calm, subtle motion */
  gentle: {
    damping: 20,
    stiffness: 180,
    mass: 1,
  },

  /** Standard - balanced spring */
  standard: {
    damping: 24,
    stiffness: 250,
    mass: 1,
  },

  /** Snappy - quick response */
  snappy: {
    damping: 28,
    stiffness: 350,
    mass: 0.8,
  },

  /** Bouncy - playful, prominent */
  bouncy: {
    damping: 12,
    stiffness: 200,
    mass: 1,
  },

  /** Press - button press feedback */
  press: {
    damping: 24,
    stiffness: 360,
    mass: 0.7,
  },

  /** Celebration - milestone bounce */
  celebration: {
    damping: 10,
    stiffness: 200,
    mass: 1,
  },

  /** No wobble - precise, critical */
  noWobble: {
    damping: 30,
    stiffness: 300,
    mass: 1,
  },

  /** Instant - for reduced motion */
  instant: {
    damping: 1000,
    stiffness: 1000,
    mass: 0.1,
  },
} as const;

// ============================================================================
// REDUCED MOTION VARIANTS
// ============================================================================

/** Reduced motion duration alternatives */
export const ReducedMotionDurations = {
  /** All durations become instant */
  INSTANT: 0,

  /** Minimal indication (50ms) */
  MINIMAL: 50,

  /** Subtle fade (100ms) */
  SUBTLE: 100,
} as const;

/**
 * Get reduced motion variant of a duration
 * @param normalDuration - Normal animation duration
 * @param strategy - How to handle reduced motion ('instant' | 'subtle')
 * @returns Adjusted duration
 */
export function getReducedMotionDuration(
  normalDuration: number,
  strategy: 'instant' | 'subtle' = 'instant'
): number {
  if (strategy === 'instant') {
    return ReducedMotionDurations.INSTANT;
  }

  // For subtle strategy, use minimal duration or original if already short
  return Math.min(normalDuration, ReducedMotionDurations.SUBTLE);
}

/**
 * Get reduced motion variant of spring config
 * @param normalSpring - Normal spring configuration
 * @returns Spring config for reduced motion (instant)
 */
export function getReducedMotionSpring<T extends { damping?: number; stiffness?: number }>(
  normalSpring: T
): T {
  return {
    ...normalSpring,
    damping: 1000, // Very high damping = no oscillation
    stiffness: 1000, // Very high stiffness = instant
  };
}

// ============================================================================
// COMBINED MOTION PRESETS
// ============================================================================

/** Complete motion preset */
export interface MotionPreset {
  duration: number;
  easing: ((value: number) => number) | EasingFunctionFactory;
  spring?: { damping: number; stiffness: number; mass?: number };
}

/** Predefined motion combinations */
export const MotionPresets = {
  /** Fade in - standard entrance */
  fadeIn: {
    duration: Durations.STANDARD,
    easing: Easings.easeOut,
  },

  /** Fade out - standard exit */
  fadeOut: {
    duration: Durations.QUICK,
    easing: Easings.easeIn,
  },

  /** Scale up - prominent entrance */
  scaleUp: {
    duration: Durations.EMPHASIZED,
    easing: Easings.emphasized,
    spring: Springs.bouncy,
  },

  /** Scale down - prominent exit */
  scaleDown: {
    duration: Durations.QUICK,
    easing: Easings.easeIn,
  },

  /** Slide in - from bottom */
  slideIn: {
    duration: Durations.STANDARD,
    easing: Easings.standardDecelerate,
  },

  /** Slide out - to bottom */
  slideOut: {
    duration: Durations.QUICK,
    easing: Easings.standardAccelerate,
  },

  /** Press - button feedback */
  press: {
    duration: Durations.QUICK,
    easing: Easings.easeOut,
    spring: Springs.press,
  },

  /** Release - button feedback */
  release: {
    duration: Durations.NORMAL,
    easing: Easings.easeOut,
    spring: Springs.snappy,
  },

  /** Celebrate - milestone animation */
  celebrate: {
    duration: Durations.CELEBRATION,
    easing: Easings.spring,
    spring: Springs.celebration,
  },

  /** Bounce - playful emphasis */
  bounce: {
    duration: Durations.EMPHASIZED,
    easing: Easings.bounce,
    spring: Springs.bouncy,
  },

  /** Error - shake/warning */
  error: {
    duration: Durations.NORMAL,
    easing: Easings.easeInOut,
  },

  /** Success - checkmark/done */
  success: {
    duration: Durations.EMPHASIZED,
    easing: Easings.emphasized,
    spring: Springs.gentle,
  },
} as const;

/** Reduced motion variants of presets */
export const ReducedMotionPresets = {
  fadeIn: { duration: Durations.INSTANT, easing: Easings.linear },
  fadeOut: { duration: Durations.INSTANT, easing: Easings.linear },
  scaleUp: { duration: Durations.FAST, easing: Easings.easeOut },
  scaleDown: { duration: Durations.INSTANT, easing: Easings.linear },
  slideIn: { duration: Durations.FAST, easing: Easings.easeOut },
  slideOut: { duration: Durations.INSTANT, easing: Easings.linear },
  press: { duration: Durations.INSTANT, easing: Easings.linear },
  release: { duration: Durations.INSTANT, easing: Easings.linear },
  celebrate: { duration: Durations.FAST, easing: Easings.easeOut },
  bounce: { duration: Durations.FAST, easing: Easings.easeOut },
  error: { duration: Durations.FAST, easing: Easings.easeInOut },
  success: { duration: Durations.FAST, easing: Easings.easeOut },
} as const;

/**
 * Get motion preset based on reduced motion preference
 * @param presetName - Name of the preset
 * @param isReducedMotion - Whether reduced motion is enabled
 * @returns Appropriate motion preset
 */
export function getMotionPreset(
  presetName: keyof typeof MotionPresets,
  isReducedMotion: boolean
): MotionPreset {
  if (isReducedMotion) {
    return ReducedMotionPresets[presetName];
  }
  return MotionPresets[presetName];
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Duration key type */
export type DurationKey = keyof typeof Durations;

/** Easing key type */
export type EasingKey = keyof typeof Easings;

/** Spring key type */
export type SpringKey = keyof typeof Springs;

/** Motion preset key type */
export type MotionPresetKey = keyof typeof MotionPresets;

export default {
  Durations,
  MD3Durations,
  Easings,
  MD3Easings,
  Springs,
  MotionPresets,
  ReducedMotionPresets,
  ReducedMotionDurations,
  getReducedMotionDuration,
  getReducedMotionSpring,
  getMotionPreset,
};
