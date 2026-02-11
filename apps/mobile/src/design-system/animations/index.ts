/**
 * Micro-Interactions and Animation System
 * Material Design 3 motion guidelines for Steps to Recovery
 *
 * @module animations
 *
 * @example
 * ```tsx
 * import {
 *   useMicroInteraction,
 *   useCelebrationAnimation,
 *   haptics,
 *   EnterAnimations,
 *   Durations,
 * } from '@/design-system/animations';
 *
 * function MyComponent() {
 *   const interactions = useMicroInteraction();
 *
 *   return (
 *     <Animated.View entering={EnterAnimations.fadeFromBottom()}>
 *       <Pressable onPressIn={interactions.press.onPressIn}>
 *         <Text>Press Me</Text>
 *       </Pressable>
 *     </Animated.View>
 *   );
 * }
 * ```
 */

// ============================================================================
// MAIN HOOKS
// ============================================================================

export {
  /** Unified micro-interaction controller */
  useMicroInteraction,
  /** Celebration-specific hook */
  useCelebrationAnimation,
  /** Press feedback hook */
  usePressFeedback,
  /** Reduced motion preference detector */
  useReducedMotionPreference,
} from './useMicroInteraction';

// ============================================================================
// CELEBRATION ANIMATIONS
// ============================================================================

export {
  /** Milestone celebration animation hook */
  useMilestoneAnimation,
  /** Achievement unlock animation hook */
  useAchievementAnimation,
  /** Check-in completion animation hook */
  useCheckInAnimation,
  /** Generate confetti particles */
  generateConfettiParticles,
  /** Predefined confetti configurations */
  confettiPresets,
  /** Material Design 3 duration constants */
  MD3_DURATIONS,
  /** Celebration color palette */
  celebrationColors,
  /** All confetti colors array */
  CONFETTI_COLORS,
  /** Default confetti configuration */
  defaultConfettiConfig,
} from './celebrations';

export type {
  /** Confetti configuration options */
  ConfettiConfig,
  /** Milestone data structure */
  MilestoneData,
  /** Achievement data structure */
  AchievementData,
  /** Confetti particle type */
  ConfettiParticle,
  /** Celebration type union */
  CelebrationType,
  /** Check-in animation configuration */
  CheckInCompletionConfig,
  /** Milestone animation state */
  MilestoneAnimationState,
} from './celebrations';

// ============================================================================
// TRANSITIONS
// ============================================================================

export {
  /** MD3 easing curves */
  MD3Easing,
  /** Animation duration constants */
  Durations,
  /** Screen transition specs */
  ScreenTransitions,
  /** Enter animation presets */
  EnterAnimations,
  /** Exit animation presets */
  ExitAnimations,
  /** Shared element transition helpers */
  SharedElementTransitions,
  /** Stagger delay calculator */
  useStaggerDelays,
  /** Predefined stagger configurations */
  staggerPresets,
  /** Layout animation presets */
  LayoutAnimations,
  /** Component-specific transitions */
  ComponentTransitions,
  /** React Navigation transition specs */
  NavigationTransitions,
  /** Custom transition creator */
  createCustomTransition,
} from './transitions';

export type {
  /** Shared element configuration */
  SharedElementConfig,
  /** Stagger animation configuration */
  StaggerConfig,
} from './transitions';

// ============================================================================
// PRESS ANIMATIONS
// ============================================================================

export {
  /** Press animation hook */
  usePressAnimation,
  /** Ripple effect hook */
  useRippleEffect,
  /** Long press animation hook */
  useLongPressAnimation,
  /** Toggle animation hook */
  useToggleAnimation,
  /** Card feedback hook */
  useCardFeedback,
  /** Press animation configurations */
  pressConfigs,
  /** Default ripple configuration */
  defaultRippleConfig,
} from './pressAnimations';

export type {
  /** Press animation configuration */
  PressAnimationConfig,
  /** Press variant options */
  PressVariant,
  /** Press animation hook options */
  UsePressAnimationOptions,
  /** Press animation result */
  PressAnimationResult,
  /** Ripple configuration */
  RippleConfig,
  /** Ripple animation state */
  RippleState,
  /** Long press configuration */
  LongPressAnimationConfig,
  /** Toggle animation configuration */
  ToggleAnimationConfig,
  /** Card feedback configuration */
  CardFeedbackConfig,
} from './pressAnimations';

// ============================================================================
// HAPTIC FEEDBACK
// ============================================================================

export {
  /** Haptic feedback namespace */
  haptics,
  /** Whether haptics are available */
  isHapticsAvailable,
  /** Haptic capability info */
  hapticCapabilities,
  // Individual haptic functions
  hapticLight,
  hapticMedium,
  hapticHeavy,
  hapticRigid,
  hapticSoft,
  hapticSuccess,
  hapticError,
  hapticWarning,
  hapticSelection,
  hapticAchievement,
  hapticDoubleTap,
  hapticTriplePulse,
  hapticHeartbeat,
  hapticAscending,
  hapticDescending,
  hapticButtonPress,
  hapticToggle,
  hapticStepper,
  hapticSlider,
  hapticBoundary,
  hapticRefresh,
  hapticCheckInComplete,
  hapticMilestone,
  hapticAnniversary,
  hapticCravingAlert,
  hapticEmergency,
  hapticSwipe,
  hapticLongPressComplete,
  hapticDragStart,
  hapticDragEnd,
  hapticDragOver,
  hapticTestAll,
  // Aliases
  hapticImpact,
  hapticTick,
  hapticCelebration,
  hapticThreshold,
} from './hapticFeedback';

// ============================================================================
// LOADING ANIMATIONS
// ============================================================================

export {
  /** Breathing circle animation hook */
  useBreathingAnimation,
  /** Pulsing dots animation hook */
  usePulsingDotsAnimation,
  /** Rotating text animation hook */
  useRotatingTextAnimation,
  /** Skeleton shimmer animation hook */
  useSkeletonAnimation,
  /** Progress ring animation hook */
  useProgressRingAnimation,
  /** Spinner animation hook */
  useSpinnerAnimation,
  /** Staggered skeleton animation hook */
  useStaggeredSkeletonAnimation,
  /** Content fade-in animation hook */
  useContentFadeAnimation,
  /** Default breathing configuration */
  defaultBreathingConfig,
  /** Default pulsing dots configuration */
  defaultPulsingDotsConfig,
  /** Default skeleton configuration */
  defaultSkeletonConfig,
  /** Default spinner configuration */
  defaultSpinnerConfig,
} from './loadingAnimations';

export type {
  /** Breathing animation configuration */
  BreathingConfig,
  /** Pulsing dots configuration */
  PulsingDotsConfig,
  /** Rotating text configuration */
  RotatingTextConfig,
  /** Skeleton animation configuration */
  SkeletonConfig,
  /** Progress ring configuration */
  ProgressRingConfig,
  /** Spinner configuration */
  SpinnerConfig,
  /** Staggered skeleton configuration */
  StaggeredSkeletonConfig,
  /** Content fade configuration */
  ContentFadeConfig,
} from './loadingAnimations';

// ============================================================================
// USE MICRO INTERACTION TYPES
// ============================================================================

export type {
  /** Main hook options */
  MicroInteractionOptions,
  /** Celebration options */
  CelebrationOptions,
  /** Press animation options */
  PressOptions,
  /** Loading animation options */
  LoadingOptions,
} from './useMicroInteraction';

// ============================================================================
// RECOVERY-SPECIFIC PRESETS
// ============================================================================

/**
 * Recovery app-specific animation presets
 */
export const RecoveryAnimations = {
  /** Daily check-in completion sequence */
  checkIn: {
    haptic: 'checkInComplete' as const,
    confetti: 'subtle' as const,
    duration: 2000,
  },

  /** Milestone celebration sequence */
  milestone: {
    haptic: 'milestone' as const,
    confetti: 'grand' as const,
    duration: 4000,
  },

  /** Step work completion sequence */
  stepWork: {
    haptic: 'achievement' as const,
    confetti: 'standard' as const,
    duration: 3000,
  },

  /** Sobriety anniversary celebration */
  anniversary: {
    haptic: 'anniversary' as const,
    confetti: 'grand' as const,
    duration: 5000,
  },

  /** Journal entry saved */
  journalSaved: {
    haptic: 'light' as const,
    confetti: 'subtle' as const,
    duration: 1000,
  },

  /** Emergency/crisis alert */
  emergency: {
    haptic: 'emergency' as const,
    confetti: null,
    duration: 0,
  },

  /** High craving warning */
  craving: {
    haptic: 'cravingAlert' as const,
    confetti: null,
    duration: 0,
  },
} as const;

/**
 * Animation intensity levels for different contexts
 */
export const AnimationIntensity = {
  /** Minimal - for low battery or accessibility */
  minimal: {
    confetti: false,
    haptics: true,
    duration: 0.5,
  },
  /** Reduced - subtle animations */
  reduced: {
    confetti: false,
    haptics: true,
    duration: 0.7,
  },
  /** Standard - balanced experience */
  standard: {
    confetti: true,
    haptics: true,
    duration: 1.0,
  },
  /** Enhanced - full celebration */
  enhanced: {
    confetti: true,
    haptics: true,
    duration: 1.5,
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get animation config based on intensity level
 */
export function getAnimationConfig(
  intensity: keyof typeof AnimationIntensity = 'standard'
) {
  return AnimationIntensity[intensity];
}

/**
 * Check if animations should run based on platform and preferences
 */
export function shouldAnimate(
  options: {
    reduceMotion?: boolean;
    lowPowerMode?: boolean;
    userPreference?: 'minimal' | 'reduced' | 'standard' | 'enhanced';
  } = {}
): boolean {
  const { reduceMotion = false, lowPowerMode = false, userPreference = 'standard' } = options;

  if (reduceMotion) return false;
  if (lowPowerMode && userPreference !== 'enhanced') return false;
  if (userPreference === 'minimal') return false;

  return true;
}

/**
 * Delay utility for animation sequencing
 */
export function animationDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a staggered animation sequence
 */
export function createStaggeredSequence(
  items: Array<() => void>,
  staggerMs: number
): (() => void) {
  return () => {
    items.forEach((item, index) => {
      setTimeout(item, index * staggerMs);
    });
  };
}

// ============================================================================
// NEW ACCESSIBLE ANIMATION HOOKS
// ============================================================================

export {
  // Motion presets
  Durations,
  MD3Durations,
  Easings,
  MD3Easings,
  Springs,
  ReducedMotionDurations,
  MotionPresets,
  ReducedMotionPresets,
  getReducedMotionDuration,
  getReducedMotionSpring,
  getMotionPreset,
  type MotionPreset,
  type DurationKey,
  type EasingKey,
  type SpringKey,
  type MotionPresetKey,
} from './presets/motion';

export {
  // Press animations
  useMotionPress,
  useButtonPress,
  useCardPress,
  useIconPress,
  useFABPress,
  type UseMotionPressOptions,
  type UseMotionPressReturn,
} from './hooks/useMotionPress';

export {
  // Fade animations
  useFadeAnimation,
  useQuickFade,
  useSlowFade,
  useSpringFade,
  type UseFadeAnimationOptions,
  type UseFadeAnimationReturn,
} from './hooks/useFadeAnimation';

export {
  // Scale animations
  useScaleAnimation,
  useCelebrationScale,
  usePulseScale,
  usePopScale,
  type UseScaleAnimationOptions,
  type UseScaleAnimationReturn,
} from './hooks/useScaleAnimation';

export {
  // Confetti
  useConfetti,
  useSubtleConfetti,
  useGrandConfetti,
  useCenterBurstConfetti,
  WARM_COLORS,
  DEFAULT_COLORS,
  type UseConfettiOptions,
  type UseConfettiReturn,
  type ConfettiParticle,
} from './hooks/useConfetti';

export {
  // Error boundary
  AccessibilityErrorBoundary,
  SafeAnimation,
  AnimationDisabledBanner,
  useAnimationError,
  type SafeAnimationProps,
} from './components/AccessibilityErrorBoundary';

// Re-export from presets for convenience
export * from './presets';
export * from './hooks';
export * from './components';
