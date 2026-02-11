/**
 * Design Tokens - Motion
 *
 * Animation specifications following Material Design 3 motion guidelines.
 * Includes durations, easings, and reduced motion variants for accessibility.
 *
 * @see https://m3.material.io/styles/motion/overview
 */

import { Easing, FadeIn, FadeInDown, FadeOut, FadeOutUp, Layout } from 'react-native-reanimated';

// =============================================================================
// DURATION SCALE
// =============================================================================

/**
 * Material Design 3 duration tokens
 * Time values in milliseconds
 */
export const duration = {
  // Instant feedback (0ms)
  instant: 0,

  // Quick transitions (50-200ms) - Micro-interactions
  fast1: 50,
  fast2: 100,
  fast3: 150,
  fast4: 200,

  // Normal transitions (200-400ms) - Standard UI changes
  normal1: 200,
  normal2: 250,
  normal3: 300,
  normal4: 350,

  // Emphasized transitions (400-600ms) - Prominent elements
  emphasized1: 400,
  emphasized2: 450,
  emphasized3: 500,
  emphasized4: 550,

  // Slow transitions (600-1000ms) - Complex animations
  slow1: 600,
  slow2: 700,
  slow3: 800,
  slow4: 1000,
} as const;

/**
 * Semantic duration aliases
 * Use these for consistent timing across the app
 */
export const durations = {
  /** Instant state changes (0ms) */
  instant: duration.instant,

  /** Quick feedback like hover/press states (100ms) */
  fast: duration.fast2,

  /** Standard UI transitions (200ms) */
  normal: duration.normal1,

  /** Emphasized transitions for prominent elements (400ms) */
  emphasized: duration.emphasized1,

  /** Slow transitions for complex animations (600ms) */
  slow: duration.slow1,
} as const;

// =============================================================================
// EASING FUNCTIONS
// =============================================================================

/**
 * Material Design 3 easing curves
 * Standardized easing for motion consistency
 */
export const easing = {
  // Linear - Constant speed
  linear: Easing.linear,

  // Standard easing - Subtle acceleration/deceleration
  standard: Easing.bezier(0.2, 0.0, 0.0, 1.0),
  standardAccelerate: Easing.bezier(0.3, 0.0, 1.0, 1.0),
  standardDecelerate: Easing.bezier(0.0, 0.0, 0.0, 1.0),

  // Emphasized easing - More pronounced for prominent elements
  emphasized: Easing.bezier(0.2, 0.0, 0.0, 1.0),
  emphasizedAccelerate: Easing.bezier(0.3, 0.0, 0.8, 0.15),
  emphasizedDecelerate: Easing.bezier(0.05, 0.7, 0.1, 1.0),

  // Legacy compatibility
  easeInOut: Easing.inOut(Easing.cubic),
  easeOut: Easing.out(Easing.cubic),
  easeIn: Easing.in(Easing.cubic),

  // Specialized curves
  bounceOut: Easing.bounce,
  elasticOut: Easing.elastic(1),
} as const;

/**
 * Semantic easing aliases
 */
export const easings = {
  /** Default standard easing */
  standard: easing.standard,

  /** Decelerate for elements entering the screen */
  decelerate: easing.standardDecelerate,

  /** Accelerate for elements leaving the screen */
  accelerate: easing.standardAccelerate,

  /** Emphasized for prominent elements */
  emphasized: easing.emphasizedDecelerate,
} as const;

// =============================================================================
// SPRING CONFIGURATIONS
// =============================================================================

/**
 * Spring configurations for physics-based animations
 */
export const spring = {
  /** Gentle - Subtle, calm motion */
  gentle: {
    damping: 20,
    stiffness: 180,
    mass: 1,
  },

  /** Standard - Balanced spring feel */
  standard: {
    damping: 24,
    stiffness: 250,
    mass: 1,
  },

  /** Snappy - Quick response for interactions */
  snappy: {
    damping: 28,
    stiffness: 350,
    mass: 0.8,
  },

  /** Bouncy - Playful, prominent motion */
  bouncy: {
    damping: 12,
    stiffness: 200,
    mass: 1,
  },

  /** No wobble - Critical for precision animations */
  noWobble: {
    damping: 30,
    stiffness: 300,
    mass: 1,
  },

  /** Soft - For subtle background movements */
  soft: {
    damping: 30,
    stiffness: 80,
    mass: 1,
  },
} as const;

// =============================================================================
// MOTION PATTERNS
// =============================================================================

/**
 * Predefined motion patterns combining duration and easing
 */
export const motion = {
  /** Standard motion - Most UI transitions */
  standard: {
    duration: durations.normal,
    easing: easings.standard,
  },

  /** Emphasized motion - Prominent elements (FAB, dialogs) */
  emphasized: {
    duration: durations.emphasized,
    easing: easings.emphasized,
  },

  /** Quick motion - Micro-interactions */
  quick: {
    duration: durations.fast,
    easing: easings.standard,
  },

  /** Expressive motion - Celebrations, important changes */
  expressive: {
    duration: durations.slow,
    easing: easing.emphasizedDecelerate,
  },

  /** Exit motion - Elements leaving the screen */
  exit: {
    duration: duration.fast3,
    easing: easings.accelerate,
  },

  /** Enter motion - Elements entering the screen */
  enter: {
    duration: durations.normal,
    easing: easings.decelerate,
  },
} as const;

// =============================================================================
// TRANSITION PATTERNS
// =============================================================================

/**
 * Layout transition patterns
 */
export const transitions = {
  /** Fade transition */
  fade: {
    duration: durations.normal,
    easing: easings.standard,
  },

  /** Scale transition */
  scale: {
    duration: durations.normal,
    easing: easings.emphasized,
  },

  /** Slide from bottom */
  slideUp: {
    duration: duration.normal3,
    easing: easings.decelerate,
  },

  /** Slide from right */
  slideRight: {
    duration: duration.normal3,
    easing: easings.decelerate,
  },

  /** Slide from left */
  slideLeft: {
    duration: duration.normal3,
    easing: easings.decelerate,
  },

  /** Shared element transition */
  sharedElement: {
    duration: durations.emphasized,
    easing: easings.emphasized,
  },

  /** Container transform */
  containerTransform: {
    duration: duration.emphasized1,
    easing: easings.emphasized,
  },
} as const;

// =============================================================================
// SCALE VALUES
// =============================================================================

/**
 * Scale values for interactive elements
 */
export const scale = {
  /** Press feedback (slightly smaller) */
  press: 0.98,

  /** Active state */
  active: 0.95,

  /** Bounce effect (slightly larger) */
  bounce: 1.15,

  /** Emphasis scale */
  emphasis: 1.05,

  /** Resting state */
  resting: 1,
} as const;

/**
 * Opacity values for fade animations
 */
export const opacity = {
  hidden: 0,
  visible: 1,
  disabled: 0.5,
  pressed: 0.7,
  overlay: 0.5,
  overlayDark: 0.7,
  subtle: 0.6,
} as const;

// =============================================================================
// REDUCED MOTION VARIANTS
// =============================================================================

/**
 * Reduced motion settings for accessibility
 * Respects user preference for less motion
 */
export const reducedMotion = {
  /** Reduced durations - 50ms or instant */
  duration: {
    instant: 0,
    fast: 50,
    normal: 50,
    emphasized: 100,
    slow: 150,
  },

  /** Simplified easings */
  easing: {
    standard: Easing.linear,
    emphasized: Easing.linear,
    decelerate: Easing.linear,
    accelerate: Easing.linear,
  },

  /** Reduced motion patterns */
  motion: {
    standard: {
      duration: 50,
      easing: Easing.linear,
    },
    emphasized: {
      duration: 100,
      easing: Easing.linear,
    },
    quick: {
      duration: 50,
      easing: Easing.linear,
    },
    expressive: {
      duration: 150,
      easing: Easing.linear,
    },
  },

  /** Disable bouncy springs */
  spring: {
    standard: {
      damping: 30,
      stiffness: 400,
      mass: 1,
    },
  },

  /** Opacity-only transitions (no movement) */
  transitions: {
    fade: {
      duration: 100,
      easing: Easing.linear,
    },
    scale: {
      duration: 50,
      easing: Easing.linear,
    },
  },
} as const;

// =============================================================================
// MICRO-INTERACTIONS
// =============================================================================

/**
 * Specific micro-interaction timings
 */
export const microInteraction = {
  /** Button press feedback */
  buttonPress: {
    duration: duration.fast2,
    scale: scale.press,
    easing: easings.standard,
  },

  /** Card press feedback */
  cardPress: {
    duration: duration.fast2,
    scale: 0.985,
    easing: easings.standard,
  },

  /** Checkbox/Radio selection */
  selection: {
    duration: duration.fast3,
    easing: easings.emphasized,
  },

  /** Switch toggle */
  toggle: {
    duration: duration.normal1,
    easing: easings.standard,
  },

  /** Input focus state */
  inputFocus: {
    duration: duration.normal1,
    easing: easings.standard,
  },

  /** Toast/notification */
  toast: {
    duration: duration.normal2,
    easing: easings.decelerate,
  },

  /** Ripple effect */
  ripple: {
    duration: duration.emphasized1,
    easing: easings.standard,
  },
} as const;

// =============================================================================
// CELEBRATION ANIMATIONS
// =============================================================================

/**
 * Timings for celebration/delight animations
 */
export const celebration = {
  /** Confetti burst duration */
  confetti: {
    duration: 1200,
    easing: easings.decelerate,
  },

  /** Badge unlock sequence */
  badgeUnlock: {
    scale: { duration: 250, easing: easings.emphasized },
    rotation: { duration: 500, easing: easings.emphasized },
    confetti: { duration: 2000, easing: easings.decelerate },
  },

  /** Streak milestone celebration */
  milestone: {
    pulse: { duration: 2000, count: 3 },
    scale: { duration: 500, easing: easing.emphasizedDecelerate },
  },

  /** Achievement unlock */
  achievement: {
    total: 3500,
    badgeScale: 250,
    badgeRotation: 500,
    confettiFall: 2000,
    textReveal: 300,
  },
} as const;

// =============================================================================
// LOADING ANIMATIONS
// =============================================================================

/**
 * Loading/shimmer animation timings
 */
export const loading = {
  /** Shimmer travel duration */
  shimmer: {
    duration: 1400,
    travelX: 220,
    initialX: -220,
  },

  /** Breathing animation for loading states */
  breathing: {
    duration: 1500,
    minScale: 1.0,
    maxScale: 1.15,
  },

  /** Spinner rotation */
  spinner: {
    duration: 1000,
  },

  /** Skeleton pulse */
  skeleton: {
    duration: 1500,
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type DurationKey = keyof typeof duration;
export type DurationsKey = keyof typeof durations;
export type EasingKey = keyof typeof easing;
export type EasingsKey = keyof typeof easings;
export type SpringKey = keyof typeof spring;
export type MotionKey = keyof typeof motion;
export type TransitionKey = keyof typeof transitions;
export type ScaleKey = keyof typeof scale;
export type OpacityKey = keyof typeof opacity;
export type MicroInteractionKey = keyof typeof microInteraction;
export type CelebrationKey = keyof typeof celebration;

export interface MotionConfig {
  duration: number;
  easing: (t: number) => number;
}

export interface SpringConfig {
  damping: number;
  stiffness: number;
  mass: number;
}

// =============================================================================
// MOTION SYSTEM COLLECTION
// =============================================================================

export const motionSystem = {
  duration,
  durations,
  easing,
  easings,
  spring,
  motion,
  transitions,
  scale,
  opacity,
  reducedMotion,
  microInteraction,
  celebration,
  loading,
} as const;

export type MotionSystem = typeof motionSystem;

// =============================================================================
// LEGACY ALIASES (backward compatibility)
// Consumers still import the old prefixed names after the token refactor.
// TODO: Migrate consumers to the canonical names above, then remove these.
// =============================================================================

/** @deprecated Use `duration` instead */
export const motionDuration = {
  ...duration,
  fast: duration.fast2,
  standard: duration.normal1,
} as const;
/** @deprecated Use `spring` instead */
export const motionSpring = spring;
/** @deprecated Use `scale` instead */
export const motionScale = {
  ...scale,
  pressCard: scale.press,
  pressButton: scale.press,
} as const;
/** @deprecated Use `durations` instead */
export const motionTiming = durations;
/** @deprecated Use `loading.shimmer` instead */
export const motionShimmer = loading.shimmer;
/** @deprecated Use `transitions` instead */
export const MotionTransitions = {
  ...transitions,
  fade: () => FadeIn.duration(durations.normal),
  cardEnter: (index: number = 0) =>
    FadeInDown.delay(index * 50)
      .duration(duration.normal3)
      .springify(),
  screenEnter: () => FadeIn.duration(durations.normal),
  fadeDelayed: (delayMs: number) => FadeIn.delay(delayMs).duration(durations.normal),
  skeletonEnter: (index: number = 0) => FadeIn.delay(index * 80).duration(duration.fast4),
  accordionLayout: () => Layout.duration(duration.normal1),
};

/** @deprecated Use `duration` instead */
export const md3Duration = duration;
/** @deprecated Use `easing` instead */
export const md3Easing = easing;
/** @deprecated Use `motion` instead */
export const md3Motion = motion;
/** @deprecated Use `spring` instead */
export const md3Spring = spring;
/** @deprecated Use `transitions` instead */
export const md3Transitions = transitions;

/** @deprecated Use `DurationKey` instead */
export type MD3DurationKey = DurationKey;
/** @deprecated Use `EasingKey` instead */
export type MD3EasingKey = EasingKey;
/** @deprecated Use `MotionKey` instead */
export type MD3MotionKey = MotionKey;
/** @deprecated Use `SpringKey` instead */
export type MD3SpringKey = SpringKey;
/** @deprecated Use `TransitionKey` instead */
export type MD3TransitionKey = TransitionKey;
/** @deprecated Use `DurationKey` instead */
export type MotionDurationKey = DurationKey;
/** @deprecated Use `SpringKey` instead */
export type MotionSpringKey = SpringKey;
