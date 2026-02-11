/**
 * Animation Hooks
 *
 * Reanimated hooks for accessible animations.
 *
 * @example
 * ```tsx
 * import { useMotionPress, useFadeAnimation, useConfetti } from '@/design-system/animations/hooks';
 *
 * const press = useMotionPress({ haptic: true });
 * const fade = useFadeAnimation({ autoPlay: true });
 * const confetti = useConfetti();
 * ```
 */

// Press animations
export {
  useMotionPress,
  useButtonPress,
  useCardPress,
  useIconPress,
  useFABPress,
  type UseMotionPressOptions,
  type UseMotionPressReturn,
} from './useMotionPress';

// Fade animations
export {
  useFadeAnimation,
  useQuickFade,
  useSlowFade,
  useSpringFade,
  type UseFadeAnimationOptions,
  type UseFadeAnimationReturn,
} from './useFadeAnimation';

// Scale animations
export {
  useScaleAnimation,
  useCelebrationScale,
  usePulseScale,
  usePopScale,
  type UseScaleAnimationOptions,
  type UseScaleAnimationReturn,
} from './useScaleAnimation';

// Confetti
export {
  useConfetti,
  useSubtleConfetti,
  useGrandConfetti,
  useCenterBurstConfetti,
  WARM_COLORS,
  DEFAULT_COLORS,
  type UseConfettiOptions,
  type UseConfettiReturn,
  type ConfettiParticle,
} from './useConfetti';

// Legacy re-exports from animations directory
export {
  // Press animations
  usePressAnimation,
  useRippleEffect,
  useLongPressAnimation,
  useToggleAnimation,
  useCardFeedback,
  usePressFeedback,
  pressConfigs,
  defaultRippleConfig,
  type PressAnimationConfig,
  type PressVariant,
  type UsePressAnimationOptions,
  type PressAnimationResult,
  type RippleConfig,
  type RippleState,
  type LongPressAnimationConfig,
  type ToggleAnimationConfig,
  type CardFeedbackConfig,
} from '../pressAnimations';

export {
  // Celebrations
  useMilestoneAnimation,
  useAchievementAnimation,
  useCheckInAnimation,
  generateConfettiParticles,
  confettiPresets,
  celebrationColors,
  CONFETTI_COLORS,
  defaultConfettiConfig,
  MD3_DURATIONS,
  type MilestoneData,
  type AchievementData,
  type CheckInCompletionConfig,
  type ConfettiConfig,
  type ConfettiParticle as ConfettiParticleLegacy,
  type CelebrationType,
  type MilestoneAnimationState,
} from '../celebrations';

export {
  // Loading
  useBreathingAnimation,
  usePulsingDotsAnimation,
  useRotatingTextAnimation,
  useSkeletonAnimation,
  useProgressRingAnimation,
  useSpinnerAnimation,
  useStaggeredSkeletonAnimation,
  useContentFadeAnimation,
  defaultBreathingConfig,
  defaultPulsingDotsConfig,
  defaultSkeletonConfig,
  defaultSpinnerConfig,
  type BreathingConfig,
  type PulsingDotsConfig,
  type RotatingTextConfig,
  type SkeletonConfig,
  type ProgressRingConfig,
  type SpinnerConfig,
  type StaggeredSkeletonConfig,
  type ContentFadeConfig,
} from '../loadingAnimations';

export {
  // Micro-interactions
  useMicroInteraction,
  useCelebrationAnimation,
  useReducedMotionPreference,
  useAccessibilityPreferences,
  type MicroInteractionOptions,
  type CelebrationOptions,
  type PressOptions,
  type LoadingOptions,
} from '../useMicroInteraction';

export {
  // Legacy hook
  useMotionPress as useMotionPressLegacy,
} from '../../hooks/useMotionPress';
