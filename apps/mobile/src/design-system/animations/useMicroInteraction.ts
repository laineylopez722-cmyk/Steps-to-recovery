/**
 * Unified Micro-Interaction Hook
 * Centralized animation controller with reduced motion support
 *
 * @example
 * ```tsx
 * const interactions = useMicroInteraction();
 *
 * // Trigger celebration
 * interactions.celebrate('milestone', { days: 30, title: '30 Days' });
 *
 * // Press feedback
 * <Pressable onPressIn={interactions.press.onPressIn}>
 *   <Animated.View style={interactions.press.style}>
 *     <Text>Press Me</Text>
 *   </Animated.View>
 * </Pressable>
 * ```
 */

import { useCallback, useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { AccessibilityInfo, type GestureResponderEvent } from 'react-native';

// Import all animation modules
import {
  useMilestoneAnimation,
  useAchievementAnimation,
  useCheckInAnimation,
  generateConfettiParticles,
  confettiPresets,
  type MilestoneData,
  type AchievementData,
  type CelebrationType,
  type ConfettiConfig,
} from './celebrations';

import {
  EnterAnimations,
  ExitAnimations,
  type StaggerConfig,
  useStaggerDelays,
} from './transitions';

import {
  usePressAnimation,
  useRippleEffect,
  useCardFeedback,
  pressConfigs,
  type UsePressAnimationOptions,
} from './pressAnimations';

import { haptics, isHapticsAvailable } from './hapticFeedback';

import {
  useBreathingAnimation,
  usePulsingDotsAnimation,
  useRotatingTextAnimation,
  useSkeletonAnimation,
  useSpinnerAnimation,
  useContentFadeAnimation,
  type BreathingConfig,
  type RotatingTextConfig,
} from './loadingAnimations';

// ============================================================================
// TYPES
// ============================================================================

export interface MicroInteractionOptions {
  /** Whether to enable animations (default: true) */
  enabled?: boolean;
  /** Whether to respect reduced motion preference (default: true) */
  respectReducedMotion?: boolean;
  /** Whether to enable haptics (default: true) */
  hapticsEnabled?: boolean;
}

export interface CelebrationOptions {
  /** Type of celebration */
  type: CelebrationType;
  /** Data for the celebration */
  data?: MilestoneData | AchievementData;
  /** Whether to show confetti */
  showConfetti?: boolean;
  /** Confetti preset or custom config */
  confettiConfig?: Partial<ConfettiConfig> | 'subtle' | 'standard' | 'grand';
  /** Whether to trigger haptic feedback */
  hapticFeedback?: boolean;
  /** Callback when celebration completes */
  onComplete?: () => void;
}

export interface PressOptions extends UsePressAnimationOptions {
  /** Enable ripple effect (Android-style) */
  enableRipple?: boolean;
  /** Haptic feedback on press */
  hapticFeedback?: boolean;
  /** Haptic importance level */
  hapticImportance?: 'low' | 'medium' | 'high';
}

export interface LoadingOptions {
  /** Type of loading animation */
  type: 'breathing' | 'dots' | 'spinner' | 'skeleton' | 'text';
  /** Configuration for the animation */
  config?: BreathingConfig | Partial<{ count: number }> | RotatingTextConfig;
}

// ============================================================================
// REDUCED MOTION UTILITIES
// ============================================================================

interface ReducedMotionState {
  isReducedMotion: boolean;
  isScreenReaderEnabled: boolean;
}

/**
 * Hook to detect accessibility preferences
 */
export function useAccessibilityPreferences(): ReducedMotionState {
  const [state, setState] = useState<ReducedMotionState>({
    isReducedMotion: false,
    isScreenReaderEnabled: false,
  });

  useEffect(() => {
    // Check reduced motion
    const checkReducedMotion = async (): Promise<void> => {
      try {
        const isEnabled = await AccessibilityInfo.isReduceMotionEnabled?.();
        setState((prev) => ({ ...prev, isReducedMotion: isEnabled ?? false }));
      } catch {
        // Fallback
      }
    };

    // Check screen reader
    const checkScreenReader = async (): Promise<void> => {
      try {
        const isEnabled = await AccessibilityInfo.isScreenReaderEnabled?.();
        setState((prev) => ({ ...prev, isScreenReaderEnabled: isEnabled ?? false }));
      } catch {
        // Fallback
      }
    };

    checkReducedMotion();
    checkScreenReader();

    // Subscribe to changes
    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isEnabled) => {
        setState((prev) => ({ ...prev, isReducedMotion: isEnabled }));
      },
    );

    const screenReaderSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (isEnabled) => {
        setState((prev) => ({ ...prev, isScreenReaderEnabled: isEnabled }));
      },
    );

    return () => {
      reduceMotionSubscription?.remove?.();
      screenReaderSubscription?.remove?.();
    };
  }, []);

  return state;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Unified micro-interaction hook
 * Controls all animations with reduced motion support
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const interactions = useMicroInteraction({
 *     respectReducedMotion: true,
 *     hapticsEnabled: true,
 *   });
 *
 *   return (
 *     <View>
 *       {/* Celebration overlay }
 *       <Confetti isActive={interactions.celebration.isActive} />
 *
 *       {/* Pressable button }
 *       <Pressable
 *         onPressIn={interactions.press.onPressIn}
 *         onPressOut={interactions.press.onPressOut}
 *       >
 *         <Animated.View style={interactions.press.style}>
 *           <Text>Press Me</Text>
 *         </Animated.View>
 *       </Pressable>
 *     </View>
 *   );
 * }
 * ```
 */
export function useMicroInteraction(options: MicroInteractionOptions = {}) {
  const { enabled = true, respectReducedMotion = true, hapticsEnabled = true } = options;

  // Detect accessibility preferences
  const accessibility = useAccessibilityPreferences();
  const prefersReducedMotion = useReducedMotion();

  // Determine if animations should run
  const shouldAnimate = enabled && (!respectReducedMotion || !prefersReducedMotion);
  const shouldUseHaptics = hapticsEnabled && isHapticsAvailable;

  // Celebration state
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [celebrationType, setCelebrationType] = useState<CelebrationType | null>(null);
  const [confettiParticles, setConfettiParticles] = useState<
    ReturnType<typeof generateConfettiParticles>
  >([]);

  // ============================================================================
  // CELEBRATION ANIMATIONS
  // ============================================================================

  const milestoneAnim = useMilestoneAnimation(() => {
    setIsCelebrating(false);
    setCelebrationType(null);
  });

  const achievementAnim = useAchievementAnimation(() => {
    setIsCelebrating(false);
    setCelebrationType(null);
  });

  const checkInAnim = useCheckInAnimation({}, () => {
    setIsCelebrating(false);
    setCelebrationType(null);
  });

  /**
   * Trigger a celebration animation
   */
  const celebrate = useCallback(
    async (opts: CelebrationOptions) => {
      if (!shouldAnimate && !shouldUseHaptics) return;

      const {
        type,
        data,
        showConfetti = true,
        confettiConfig = 'standard',
        hapticFeedback = true,
        onComplete,
      } = opts;

      setIsCelebrating(true);
      setCelebrationType(type);

      // Generate confetti if enabled
      if (showConfetti && shouldAnimate) {
        const config =
          typeof confettiConfig === 'string' ? confettiPresets[confettiConfig] : confettiConfig;
        setConfettiParticles(generateConfettiParticles(config));
      }

      // Trigger haptic
      if (shouldUseHaptics && hapticFeedback) {
        switch (type) {
          case 'milestone':
            await haptics.milestone();
            break;
          case 'achievement':
            await haptics.achievement();
            break;
          case 'checkin':
            await haptics.checkInComplete();
            break;
        }
      }

      // Trigger animation
      if (shouldAnimate) {
        switch (type) {
          case 'milestone':
            if (data && 'days' in data) {
              milestoneAnim.trigger(data as MilestoneData);
            }
            break;
          case 'achievement':
            if (data && 'title' in data) {
              achievementAnim.trigger(data as AchievementData);
            }
            break;
          case 'checkin':
            checkInAnim.trigger();
            break;
        }
      }

      onComplete?.();
    },
    [shouldAnimate, shouldUseHaptics, milestoneAnim, achievementAnim, checkInAnim],
  );

  /**
   * Dismiss active celebration
   */
  const dismissCelebration = useCallback(() => {
    milestoneAnim.dismiss();
    setIsCelebrating(false);
    setCelebrationType(null);
    setConfettiParticles([]);
  }, [milestoneAnim]);

  // ============================================================================
  // PRESS ANIMATIONS
  // ============================================================================

  /**
   * Get press animation for a component
   */
  const getPressAnimation = useCallback(
    (pressOptions: PressOptions = {}) => {
      const {
        enableRipple = false,
        hapticFeedback = true,
        hapticImportance = 'medium',
        ...pressAnimOptions
      } = pressOptions;

      const pressAnim = usePressAnimation({
        ...pressAnimOptions,
        onPressIn: () => {
          if (shouldUseHaptics && hapticFeedback) {
            haptics.buttonPress(hapticImportance);
          }
          pressAnimOptions.onPressIn?.();
        },
      });

      const rippleAnim = enableRipple ? useRippleEffect() : null;

      return {
        onPressIn: (event?: GestureResponderEvent) => {
          pressAnim.onPressIn();
          rippleAnim?.onPressIn(event);
        },
        onPressOut: () => {
          pressAnim.onPressOut();
          rippleAnim?.onPressOut();
        },
        style: pressAnim.style,
        rippleStyle: rippleAnim?.style,
        reset: pressAnim.reset,
      };
    },
    [shouldUseHaptics],
  );

  // ============================================================================
  // TRANSITION HELPERS
  // ============================================================================

  /**
   * Get enter animation (respects reduced motion)
   */
  const getEnterAnimation = useCallback(
    (type: keyof typeof EnterAnimations, delay = 0) => {
      if (!shouldAnimate) {
        // Return minimal animation for reduced motion
        return EnterAnimations.fade().duration(0);
      }
      return EnterAnimations[type](delay);
    },
    [shouldAnimate],
  );

  /**
   * Get exit animation (respects reduced motion)
   */
  const getExitAnimation = useCallback(
    (type: keyof typeof ExitAnimations) => {
      if (!shouldAnimate) {
        return ExitAnimations.fade().duration(0);
      }
      return ExitAnimations[type]();
    },
    [shouldAnimate],
  );

  /**
   * Get stagger delays for list animations
   */
  const getStaggerDelays = useCallback(
    (config: StaggerConfig) => {
      if (!shouldAnimate) {
        return { getDelay: () => 0, getDuration: () => 0 };
      }
      return useStaggerDelays(config);
    },
    [shouldAnimate],
  );

  // ============================================================================
  // LOADING ANIMATIONS
  // ============================================================================

  /**
   * Get loading animation
   */
  const getLoadingAnimation = useCallback(
    (loadingOptions: LoadingOptions) => {
      if (!shouldAnimate) {
        // Return static styles for reduced motion
        return { style: {}, start: () => {}, stop: () => {} };
      }

      switch (loadingOptions.type) {
        case 'breathing':
          return useBreathingAnimation(loadingOptions.config as BreathingConfig);
        case 'dots':
          return usePulsingDotsAnimation(loadingOptions.config as { count: number });
        case 'spinner':
          return useSpinnerAnimation();
        case 'skeleton':
          return useSkeletonAnimation();
        case 'text':
          return useRotatingTextAnimation(loadingOptions.config as RotatingTextConfig);
        default:
          return useSpinnerAnimation();
      }
    },
    [shouldAnimate],
  );

  // ============================================================================
  // HAPTIC HELPERS
  // ============================================================================

  /**
   * Trigger haptic feedback
   */
  const triggerHaptic = useCallback(
    async (type: keyof typeof haptics, ...args: never[]) => {
      if (!shouldUseHaptics) return;

      const hapticFn = haptics[type];
      if (typeof hapticFn === 'function') {
        await (hapticFn as (...args: never[]) => Promise<void>)(...args);
      }
    },
    [shouldUseHaptics],
  );

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return {
    // Animation state
    isEnabled: shouldAnimate,
    isReducedMotion: prefersReducedMotion,
    isScreenReaderEnabled: accessibility.isScreenReaderEnabled,

    // Celebrations
    celebrate,
    dismissCelebration,
    celebration: {
      isActive: isCelebrating,
      type: celebrationType,
      confettiParticles,
      styles: {
        milestone: milestoneAnim.styles,
        achievement: achievementAnim.styles,
        checkIn: checkInAnim.styles,
      },
      values: {
        milestone: milestoneAnim.values,
        achievement: achievementAnim.values,
        checkIn: checkInAnim.values,
      },
    },

    // Press animations
    press: getPressAnimation,

    // Transitions
    enter: getEnterAnimation,
    exit: getExitAnimation,
    stagger: getStaggerDelays,

    // Loading
    loading: getLoadingAnimation,

    // Haptics
    haptic: triggerHaptic,
    haptics: shouldUseHaptics ? haptics : null,

    // Utilities
    EnterAnimations,
    ExitAnimations,
    pressConfigs,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook specifically for celebration animations
 *
 * @example
 * ```tsx
 * const celebration = useCelebrationAnimation();
 *
 * // Trigger milestone
 * celebration.triggerMilestone({ days: 30, title: '30 Days' });
 *
 * // Access styles
 * <Animated.View style={celebration.styles.card} />
 * ```
 */
export function useCelebrationAnimation(onComplete?: () => void) {
  const milestone = useMilestoneAnimation(onComplete);
  const achievement = useAchievementAnimation(onComplete);
  const checkIn = useCheckInAnimation({}, onComplete);

  const triggerMilestone = useCallback(
    (data: MilestoneData) => {
      milestone.trigger(data);
    },
    [milestone],
  );

  const triggerAchievement = useCallback(
    (data: AchievementData) => {
      achievement.trigger(data);
    },
    [achievement],
  );

  const triggerCheckIn = useCallback(() => {
    checkIn.trigger();
  }, [checkIn]);

  return {
    triggerMilestone,
    triggerAchievement,
    triggerCheckIn,
    styles: {
      milestone: milestone.styles,
      achievement: achievement.styles,
      checkIn: checkIn.styles,
    },
    values: {
      milestone: milestone.values,
      achievement: achievement.values,
      checkIn: checkIn.values,
    },
    dismiss: milestone.dismiss,
  };
}

/**
 * Hook specifically for press feedback
 *
 * @example
 * ```tsx
 * const press = usePressFeedback({ variant: 'button' });
 *
 * <Pressable onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
 *   <Animated.View style={press.style} />
 * </Pressable>
 * ```
 */
export function usePressFeedback(options: PressOptions = {}) {
  const interactions = useMicroInteraction();
  return interactions.press(options);
}

/**
 * Hook for reduced motion preferences
 *
 * @example
 * ```tsx
 * const { isReducedMotion, prefersReducedMotion } = useReducedMotionPreference();
 *
 * if (prefersReducedMotion) {
 *   // Skip animations
 * }
 * ```
 */
export function useReducedMotionPreference() {
  const prefersReducedMotion = useReducedMotion();
  const accessibility = useAccessibilityPreferences();

  return {
    isReducedMotion: prefersReducedMotion,
    prefersReducedMotion,
    isScreenReaderEnabled: accessibility.isScreenReaderEnabled,
    shouldAnimate: !prefersReducedMotion,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { MilestoneData, AchievementData, CelebrationType };

export {
  // Animation modules
  useMilestoneAnimation,
  useAchievementAnimation,
  useCheckInAnimation,
  generateConfettiParticles,
  confettiPresets,
  usePressAnimation,
  useRippleEffect,
  useCardFeedback,
  useBreathingAnimation,
  usePulsingDotsAnimation,
  useRotatingTextAnimation,
  useSkeletonAnimation,
  useSpinnerAnimation,
  useContentFadeAnimation,
  EnterAnimations,
  ExitAnimations,
  useStaggerDelays,
  pressConfigs,
  haptics,
  isHapticsAvailable,
};
