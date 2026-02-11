/**
 * Screen and Component Transitions
 * Material Design 3 motion guidelines implementation
 *
 * @example
 * ```tsx
 * import { ScreenTransitions, ComponentTransitions } from './transitions';
 *
 * // Screen transition
 * <Stack.Screen
 *   options={{
 *     animation: 'slide_from_bottom',
 *     transitionSpec: ScreenTransitions.slideFromBottom,
 *   }}
 * />
 *
 * // Component fade
 * <Animated.View entering={FadeIn.duration(200)} />
 * ```
 */

import {
  FadeIn,
  FadeInUp,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  FadeOutUp,
  FadeOutDown,
  SlideInUp,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
  ZoomOut,
  Layout,
  Easing,
  interpolate,
} from 'react-native-reanimated';

// ============================================================================
// MATERIAL DESIGN 3 EASING CURVES
// ============================================================================

export const MD3Easing = {
  /**
   * Standard easing - most transitions
   * Acceleration curve for exiting, deceleration for entering
   */
  standard: Easing.out(Easing.cubic),

  /**
   * Emphasized easing - prominent transitions
   * Longer acceleration, quick deceleration
   */
  emphasized: Easing.bezier(0.2, 0, 0, 1),

  /**
   * Accelerated easing - quick exit
   * Elements leaving the screen
   */
  accelerated: Easing.in(Easing.cubic),

  /**
   * Decelerated easing - entrance
   * Elements entering the screen
   */
  decelerated: Easing.out(Easing.cubic),

  /**
   * Linear - continuous animations
   */
  linear: Easing.linear,

  /**
   * Bounce - playful emphasis
   */
  bounce: Easing.out(Easing.bounce),
} as const;

// ============================================================================
// DURATION CONSTANTS (MD3)
// ============================================================================

export const Durations = {
  /** Instant - no animation */
  instant: 0,
  /** Accelerated - quick feedback (100ms) */
  accelerated: 100,
  /** Decelerated - quick entrance (150ms) */
  decelerated: 150,
  /** Standard - most transitions (200ms) */
  standard: 200,
  /** Emphasized - prominent transitions (500ms) */
  emphasized: 500,
  /** Long - dramatic transitions (700ms) */
  long: 700,
} as const;

// ============================================================================
// SCREEN TRANSITIONS
// ============================================================================

export const ScreenTransitions = {
  /**
   * Standard fade transition (200ms)
   * Use for: Modal presentations, subtle screen changes
   *
   * @example
   * ```tsx
   * <Stack.Screen options={{ animation: 'fade', transitionSpec: ScreenTransitions.fade }} />
   * ```
   */
  fade: {
    open: {
      animation: 'timing',
      config: {
        duration: Durations.standard,
        easing: MD3Easing.standard,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: Durations.standard,
        easing: MD3Easing.standard,
      },
    },
  } as const,

  /**
   * Slide from bottom transition (250ms ease-out)
   * Use for: Modal sheets, bottom sheets, new screens
   *
   * @example
   * ```tsx
   * <Stack.Screen options={{ animation: 'slide_from_bottom' }} />
   * ```
   */
  slideFromBottom: {
    open: {
      animation: 'spring',
      config: {
        damping: 25,
        stiffness: 300,
        mass: 0.8,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: Durations.standard,
        easing: MD3Easing.accelerated,
      },
    },
  } as const,

  /**
   * Slide from right transition
   * Use for: Navigation push (iOS style)
   */
  slideFromRight: {
    open: {
      animation: 'spring',
      config: {
        damping: 30,
        stiffness: 350,
        mass: 0.8,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: Durations.decelerated,
        easing: MD3Easing.accelerated,
      },
    },
  } as const,

  /**
   * Scale and fade for modals (300ms)
   * Use for: Dialogs, alerts, centered modals
   */
  scaleAndFade: {
    open: {
      animation: 'spring',
      config: {
        damping: 20,
        stiffness: 300,
        mass: 0.8,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: Durations.accelerated,
        easing: MD3Easing.standard,
      },
    },
  } as const,

  /**
   * No animation
   */
  none: {
    open: {
      animation: 'timing',
      config: { duration: 0 },
    },
    close: {
      animation: 'timing',
      config: { duration: 0 },
    },
  } as const,
} as const;

// ============================================================================
// REANIMATED ENTER/EXIT ANIMATIONS
// ============================================================================

/**
 * Pre-configured entering animations following MD3
 */
export const EnterAnimations = {
  /**
   * Standard fade in (200ms)
   * Most common entrance animation
   */
  fade: () => FadeIn.duration(Durations.standard).easing(MD3Easing.standard),

  /**
   * Fade in from bottom (250ms)
   * For content appearing from below
   */
  fadeFromBottom: (delay = 0) =>
    FadeInDown.duration(Durations.standard + 50)
      .easing(MD3Easing.decelerated)
      .delay(delay),

  /**
   * Fade in from top
   * For dropdowns, notifications
   */
  fadeFromTop: (delay = 0) =>
    FadeInUp.duration(Durations.standard)
      .easing(MD3Easing.decelerated)
      .delay(delay),

  /**
   * Fade in from left
   * For slide-in navigation
   */
  fadeFromLeft: (delay = 0) =>
    FadeInLeft.duration(Durations.standard)
      .easing(MD3Easing.decelerated)
      .delay(delay),

  /**
   * Fade in from right
   * For slide-in navigation
   */
  fadeFromRight: (delay = 0) =>
    FadeInRight.duration(Durations.standard)
      .easing(MD3Easing.decelerated)
      .delay(delay),

  /**
   * Slide in from bottom (spring)
   * For modals, sheets
   */
  slideFromBottom: (delay = 0) =>
    SlideInUp.springify().damping(25).stiffness(300).delay(delay),

  /**
   * Slide in from top
   * For dropdown menus
   */
  slideFromTop: (delay = 0) =>
    SlideInDown.springify().damping(25).stiffness(300).delay(delay),

  /**
   * Scale up with fade (300ms)
   * For dialogs, popovers
   */
  scaleUp: (delay = 0) =>
    ZoomIn.duration(Durations.emphasized)
      .easing(MD3Easing.emphasized)
      .delay(delay),

  /**
   * Spring bounce in
   * For playful entrances
   */
  bounce: (delay = 0) =>
    FadeIn.springify().damping(12).stiffness(200).delay(delay),
} as const;

/**
 * Pre-configured exiting animations following MD3
 */
export const ExitAnimations = {
  /**
   * Standard fade out (200ms)
   */
  fade: () => FadeOut.duration(Durations.standard).easing(MD3Easing.standard),

  /**
   * Fade out to bottom
   * For content leaving downward
   */
  fadeToBottom: () =>
    FadeOutDown.duration(Durations.accelerated).easing(MD3Easing.accelerated),

  /**
   * Fade out to top
   * For content leaving upward
   */
  fadeToTop: () =>
    FadeOutUp.duration(Durations.accelerated).easing(MD3Easing.accelerated),

  /**
   * Slide out to bottom
   * For dismissible modals
   */
  slideToBottom: () =>
    SlideOutDown.duration(Durations.standard).easing(MD3Easing.accelerated),

  /**
   * Scale down with fade
   * For closing dialogs
   */
  scaleDown: () =>
    ZoomOut.duration(Durations.accelerated).easing(MD3Easing.accelerated),
} as const;

// ============================================================================
// SHARED ELEMENT TRANSITION HELPERS
// ============================================================================

export interface SharedElementConfig {
  /** Unique identifier for the shared element */
  id: string;
  /** Animation duration */
  duration?: number;
  /** Animation delay */
  delay?: number;
}

/**
 * Configuration for shared element transitions
 * Note: Full implementation requires react-navigation-shared-element
 */
export const SharedElementTransitions = {
  /**
   * Standard shared element transition
   */
  standard: (config: SharedElementConfig) => ({
    id: config.id,
    animation: 'move',
    resize: 'clip',
    align: 'center',
    duration: config.duration ?? Durations.emphasized,
    delay: config.delay ?? 0,
  }),

  /**
   * Fade-through transition
   * Cross-fade between elements
   */
  fadeThrough: (config: SharedElementConfig) => ({
    id: config.id,
    animation: 'fade',
    duration: config.duration ?? Durations.standard,
    delay: config.delay ?? 0,
  }),

  /**
   * Hero transition with scale
   * For image transitions
   */
  hero: (config: SharedElementConfig) => ({
    id: config.id,
    animation: 'move',
    resize: 'stretch',
    align: 'auto',
    duration: config.duration ?? Durations.emphasized,
    delay: config.delay ?? 0,
  }),
} as const;

// ============================================================================
// STAGGER ANIMATIONS
// ============================================================================

export interface StaggerConfig {
  /** Number of items to animate */
  itemCount: number;
  /** Delay between each item (ms) */
  staggerDelay: number;
  /** Maximum total delay (ms) */
  maxDelay?: number;
  /** Base delay before first item */
  baseDelay?: number;
}

/**
 * Calculate stagger delays for list items
 *
 * @example
 * ```tsx
 * const stagger = useStaggerDelays({ itemCount: 10, staggerDelay: 50 });
 *
 * {items.map((item, index) => (
 *   <Animated.View
 *     entering={FadeIn.delay(stagger.getDelay(index))}
 *   />
 * ))}
 * ```
 */
export function useStaggerDelays(config: StaggerConfig): {
  getDelay: (index: number) => number;
  getDuration: (index: number) => number;
} {
  const { itemCount, staggerDelay, maxDelay = 500, baseDelay = 0 } = config;

  const getDelay = (index: number): number => {
    const calculatedDelay = baseDelay + index * staggerDelay;
    return Math.min(calculatedDelay, baseDelay + maxDelay);
  };

  const getDuration = (index: number): number => {
    // Earlier items animate slightly faster
    const delayFactor = Math.min(index * 0.05, 0.2);
    return Durations.standard * (1 + delayFactor);
  };

  return { getDelay, getDuration };
}

/**
 * Predefined stagger configurations
 */
export const staggerPresets = {
  /** Fast stagger for small lists */
  fast: { staggerDelay: 30, maxDelay: 300 },
  /** Standard stagger for medium lists */
  standard: { staggerDelay: 50, maxDelay: 500 },
  /** Slow stagger for emphasis */
  slow: { staggerDelay: 80, maxDelay: 800 },
  /** Wave pattern for cards */
  wave: { staggerDelay: 60, maxDelay: 600 },
} as const;

// ============================================================================
// LAYOUT ANIMATIONS
// ============================================================================

/**
 * Layout animation configurations for list reordering
 */
export const LayoutAnimations = {
  /**
   * Standard layout animation
   * For list reordering, expanding items
   */
  standard: Layout.duration(Durations.standard).easing(MD3Easing.standard),

  /**
   * Spring layout animation
   * For bouncy list interactions
   */
  spring: Layout.springify().damping(20).stiffness(300),

  /**
   * Quick layout animation
   * For fast reordering
   */
  quick: Layout.duration(Durations.accelerated).easing(MD3Easing.standard),
} as const;

// ============================================================================
// COMPONENT-SPECIFIC TRANSITIONS
// ============================================================================

export const ComponentTransitions = {
  /**
   * Card entrance animation
   */
  cardEnter: (index = 0) =>
    FadeInDown.duration(Durations.standard)
      .delay(Math.min(index * 40, 280))
      .springify()
      .damping(20),

  /**
   * List item entrance
   */
  listItemEnter: (index = 0) =>
    FadeInRight.duration(Durations.standard)
      .delay(Math.min(index * 28, 220))
      .springify()
      .damping(20),

  /**
   * Modal entrance
   */
  modalEnter: () =>
    FadeInUp.duration(Durations.standard).springify().damping(18),

  /**
   * Button press feedback
   */
  buttonPress: {
    scale: 0.95,
    duration: Durations.accelerated,
  },

  /**
   * Chip/Tag entrance
   */
  chipEnter: (index = 0) =>
    FadeIn.duration(Durations.decelerated)
      .delay(index * 30),

  /**
   * Skeleton loading entrance
   */
  skeletonEnter: (index = 0) =>
    FadeIn.duration(Durations.accelerated).delay(Math.min(index * 70, 280)),
} as const;

// ============================================================================
// NAVIGATION TRANSITION SPEC
// ============================================================================

/**
 * React Navigation transition spec presets
 */
export const NavigationTransitions = {
  /**
   * iOS-style slide from right
   */
  iosSlide: {
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
    cardStyleInterpolator: ({ current, layouts }: { current: { progress: number }; layouts: { screen: { width: number } } }) => ({
      cardStyle: {
        transform: [
          {
            translateX: interpolate(
              current.progress,
              [0, 1],
              [layouts.screen.width, 0],
            ),
          },
        ],
      },
    }),
    transitionSpec: {
      open: ScreenTransitions.slideFromRight.open,
      close: ScreenTransitions.slideFromRight.close,
    },
  },

  /**
   * Android-style fade with slight scale
   */
  androidFade: {
    cardStyleInterpolator: ({ current }: { current: { progress: number } }) => ({
      cardStyle: {
        opacity: current.progress,
        transform: [
          {
            scale: interpolate(
              current.progress,
              [0, 1],
              [0.95, 1],
            ),
          },
        ],
      },
    }),
    transitionSpec: {
      open: ScreenTransitions.fade.open,
      close: ScreenTransitions.fade.close,
    },
  },

  /**
   * Modal presentation from bottom
   */
  modalPresentation: {
    gestureEnabled: true,
    gestureDirection: 'vertical' as const,
    cardStyleInterpolator: ({ current }: { current: { progress: number } }) => ({
      cardStyle: {
        transform: [
          {
            translateY: interpolate(
              current.progress,
              [0, 1],
              [300, 0],
            ),
          },
        ],
      },
    }),
    transitionSpec: {
      open: ScreenTransitions.slideFromBottom.open,
      close: ScreenTransitions.slideFromBottom.close,
    },
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create custom transition with MD3 timing
 */
export function createCustomTransition(
  duration: number,
  easing: (value: number) => number = MD3Easing.standard
): { duration: number; easing: (value: number) => number } {
  return { duration, easing };
}

/**
 * Delay animation helper
 */
export function withDelay<T extends { delay: (ms: number) => T }>(
  animation: T,
  delayMs: number
): T {
  return animation.delay(delayMs);
}

/**
 * Combine multiple transition specs
 */
export function combineTransitions(
  ...transitions: Array<Record<string, unknown>>
): Record<string, unknown> {
  return transitions.reduce(
    (acc, curr) => ({
      ...acc,
      ...curr,
    }),
    {}
  );
}
