/**
 * useMotionPress Hook
 *
 * Reanimated worklet for press animations with:
 * - Scale animation: 1 → 0.95 → 1
 * - Haptic feedback integration
 * - Reduced motion fallback
 *
 * @example
 * ```tsx
 * const { animatedStyle, onPressIn, onPressOut } = useMotionPress({
 *   scaleTo: 0.95,
 *   haptic: true,
 * });
 *
 * <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
 *   <Animated.View style={animatedStyle}>
 *     <Text>Press Me</Text>
 *   </Animated.View>
 * </Pressable>
 * ```
 */

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { useReducedMotion } from '../presets/motion';
import { haptics } from '../hapticFeedback';

// ============================================================================
// TYPES
// ============================================================================

/** Press animation configuration */
export interface UseMotionPressOptions {
  /** Target scale when pressed (0-1) */
  scaleTo?: number;
  /** Spring configuration */
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
  /** Duration for reduced motion (ms) */
  reducedMotionDuration?: number;
  /** Enable haptic feedback on press */
  haptic?: boolean | 'light' | 'medium' | 'heavy';
  /** Callback when press animation starts */
  onPressStart?: () => void;
  /** Callback when press animation ends */
  onPressEnd?: () => void;
  /** Whether animation is disabled */
  disabled?: boolean;
}

/** Press animation result */
export interface UseMotionPressReturn {
  /** Animated style to apply to component */
  animatedStyle: { transform: { scale: number }[] };
  /** Call on press in */
  onPressIn: () => void;
  /** Call on press out */
  onPressOut: () => void;
  /** Current scale value (for external use) */
  scale: SharedValue<number>;
  /** Reset animation to initial state */
  reset: () => void;
}

// ============================================================================
// DEFAULTS
// ============================================================================

/** Default scale target */
const DEFAULT_SCALE_TO = 0.95;

/** Default spring configuration */
const DEFAULT_SPRING = {
  damping: 24,
  stiffness: 360,
  mass: 0.7,
};

/** Default reduced motion duration */
const DEFAULT_REDUCED_MOTION_DURATION = 0;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for press animations with haptic feedback
 * @param options - Animation configuration
 * @returns Animation controls and styles
 */
export function useMotionPress(options: UseMotionPressOptions = {}): UseMotionPressReturn {
  const {
    scaleTo = DEFAULT_SCALE_TO,
    springConfig = DEFAULT_SPRING,
    reducedMotionDuration = DEFAULT_REDUCED_MOTION_DURATION,
    haptic = false,
    onPressStart,
    onPressEnd,
    disabled = false,
  } = options;

  const scale = useSharedValue(1);
  const isReducedMotion = useReducedMotion();

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (haptic === true || haptic === 'medium') {
      haptics.medium();
    } else if (haptic === 'light') {
      haptics.light();
    } else if (haptic === 'heavy') {
      haptics.heavy();
    }
  }, [haptic]);

  // Handle press in
  const onPressIn = useCallback(() => {
    if (disabled) return;

    // Trigger haptic
    if (haptic) {
      triggerHaptic();
    }

    // Animate
    if (isReducedMotion) {
      scale.value = withTiming(scaleTo, { duration: reducedMotionDuration });
    } else {
      scale.value = withSpring(scaleTo, springConfig);
    }

    // Callback
    if (onPressStart) {
      runOnJS(onPressStart)();
    }
  }, [
    disabled,
    haptic,
    scaleTo,
    springConfig,
    reducedMotionDuration,
    isReducedMotion,
    onPressStart,
    scale,
    triggerHaptic,
  ]);

  // Handle press out
  const onPressOut = useCallback(() => {
    if (disabled) return;

    // Animate back
    if (isReducedMotion) {
      scale.value = withTiming(1, { duration: reducedMotionDuration });
    } else {
      scale.value = withSpring(1, { ...springConfig, damping: (springConfig.damping ?? 24) * 0.8 });
    }

    // Callback
    if (onPressEnd) {
      runOnJS(onPressEnd)();
    }
  }, [disabled, springConfig, reducedMotionDuration, isReducedMotion, onPressEnd, scale]);

  // Reset animation
  const reset = useCallback(() => {
    scale.value = isReducedMotion ? 1 : withSpring(1, springConfig);
  }, [isReducedMotion, springConfig, scale]);

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    animatedStyle,
    onPressIn,
    onPressOut,
    scale,
    reset,
  };
}

// ============================================================================
// VARIANT HOOKS
// ============================================================================

/**
 * Button press animation hook
 * Pre-configured for button feedback
 */
export function useButtonPress(
  options: Omit<UseMotionPressOptions, 'scaleTo'> = {},
): UseMotionPressReturn {
  return useMotionPress({
    scaleTo: 0.965,
    haptic: options.haptic ?? 'light',
    ...options,
  });
}

/**
 * Card press animation hook
 * Subtle feedback for card interactions
 */
export function useCardPress(
  options: Omit<UseMotionPressOptions, 'scaleTo'> = {},
): UseMotionPressReturn {
  return useMotionPress({
    scaleTo: 0.985,
    haptic: options.haptic ?? false,
    springConfig: {
      damping: 20,
      stiffness: 300,
      mass: 0.9,
    },
    ...options,
  });
}

/**
 * Icon press animation hook
 * Snappy feedback for icon buttons
 */
export function useIconPress(
  options: Omit<UseMotionPressOptions, 'scaleTo'> = {},
): UseMotionPressReturn {
  return useMotionPress({
    scaleTo: 0.88,
    haptic: options.haptic ?? 'light',
    springConfig: {
      damping: 12,
      stiffness: 500,
      mass: 0.6,
    },
    ...options,
  });
}

/**
 * FAB press animation hook
 * Pronounced feedback for floating action buttons
 */
export function useFABPress(
  options: Omit<UseMotionPressOptions, 'scaleTo'> = {},
): UseMotionPressReturn {
  return useMotionPress({
    scaleTo: 0.92,
    haptic: options.haptic ?? 'medium',
    springConfig: {
      damping: 14,
      stiffness: 450,
      mass: 0.8,
    },
    ...options,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useMotionPress;
