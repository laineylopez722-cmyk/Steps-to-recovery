/**
 * Touch Feedback Animations
 * Material Design 3 press, ripple, and interaction feedback
 *
 * @example
 * ```tsx
 * const buttonPress = usePressAnimation({ variant: 'button' });
 *
 * <AnimatedPressable
 *   onPressIn={buttonPress.onPressIn}
 *   onPressOut={buttonPress.onPressOut}
 *   style={buttonPress.style}
 * >
 *   <Text>Press Me</Text>
 * </AnimatedPressable>
 * ```
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { useCallback, useRef, useEffect } from 'react';
import { Platform, type GestureResponderEvent } from 'react-native';

// ============================================================================
// PRESS ANIMATION CONFIGURATIONS
// ============================================================================

export interface PressAnimationConfig {
  /** Scale when pressed (0-1) */
  scaleTo: number;
  /** Animation duration in ms */
  duration: number;
  /** Spring damping (lower = more bounce) */
  damping: number;
  /** Spring stiffness (higher = snappier) */
  stiffness: number;
  /** Optional lift effect on press */
  lift?: number;
  /** Optional opacity change */
  opacityTo?: number;
}

export type PressVariant = 'button' | 'card' | 'icon' | 'chip' | 'listItem' | 'fab' | 'custom';

/**
 * Pre-configured press animation variants
 */
export const pressConfigs: Record<PressVariant, PressAnimationConfig> = {
  /**
   * Standard button press
   * Scale: 100% → 95%
   */
  button: {
    scaleTo: 0.95,
    duration: 100,
    damping: 15,
    stiffness: 400,
    opacityTo: 0.9,
  },

  /**
   * Card press
   * Subtle scale: 100% → 98%
   */
  card: {
    scaleTo: 0.98,
    duration: 150,
    damping: 20,
    stiffness: 300,
    lift: -2,
  },

  /**
   * Icon button press
   * Snappy: 100% → 88%
   */
  icon: {
    scaleTo: 0.88,
    duration: 80,
    damping: 12,
    stiffness: 500,
  },

  /**
   * Chip/Tag press
   * Gentle: 100% → 96%
   */
  chip: {
    scaleTo: 0.96,
    duration: 120,
    damping: 18,
    stiffness: 350,
  },

  /**
   * List item press
   * Subtle: 100% → 98% with slight lift
   */
  listItem: {
    scaleTo: 0.98,
    duration: 150,
    damping: 22,
    stiffness: 280,
    lift: -1,
    opacityTo: 0.95,
  },

  /**
   * FAB (Floating Action Button) press
   * Pronounced: 100% → 92%
   */
  fab: {
    scaleTo: 0.92,
    duration: 100,
    damping: 14,
    stiffness: 450,
    lift: -4,
  },

  /**
   * Custom - use with custom config
   */
  custom: {
    scaleTo: 0.95,
    duration: 100,
    damping: 15,
    stiffness: 400,
  },
} as const;

// ============================================================================
// USE PRESS ANIMATION HOOK
// ============================================================================

export interface UsePressAnimationOptions {
  /** Predefined variant or custom config */
  variant?: PressVariant;
  /** Custom config (overrides variant) */
  config?: Partial<PressAnimationConfig>;
  /** Callback when press starts */
  onPressIn?: () => void;
  /** Callback when press ends */
  onPressOut?: () => void;
  /** Disable animation */
  disabled?: boolean;
}

export interface PressAnimationResult {
  /** Animated style to apply */
  style: { transform: [{ scale: number }] };
  /** Call on press in */
  onPressIn: () => void;
  /** Call on press out */
  onPressOut: () => void;
  /** Reset animation manually */
  reset: () => void;
  /** Whether currently pressed */
  isPressed: boolean;
}

/**
 * Hook for press animations
 *
 * @example
 * ```tsx
 * const press = usePressAnimation({ variant: 'button' });
 *
 * <Pressable
 *   onPressIn={press.onPressIn}
 *   onPressOut={press.onPressOut}
 * >
 *   <Animated.View style={press.style}>
 *     <Text>Press Me</Text>
 *   </Animated.View>
 * </Pressable>
 * ```
 */
export function usePressAnimation(
  options: UsePressAnimationOptions = {}
): PressAnimationResult {
  const { variant = 'button', config: customConfig, onPressIn, onPressOut, disabled = false } = options;

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const isPressedRef = useRef(false);

  // Merge config
  const config = {
    ...pressConfigs[variant],
    ...customConfig,
  };

  const handlePressIn = useCallback(() => {
    if (disabled) return;

    isPressedRef.current = true;

    scale.value = withSpring(config.scaleTo, {
      damping: config.damping,
      stiffness: config.stiffness,
    });

    if (config.lift) {
      translateY.value = withSpring(config.lift, {
        damping: config.damping,
        stiffness: config.stiffness,
      });
    }

    if (config.opacityTo !== undefined) {
      opacity.value = withTiming(config.opacityTo, {
        duration: config.duration,
      });
    }

    onPressIn?.();
  }, [disabled, config, scale, translateY, opacity, onPressIn]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;

    isPressedRef.current = false;

    scale.value = withSpring(1, {
      damping: config.damping,
      stiffness: config.stiffness,
    });

    if (config.lift) {
      translateY.value = withSpring(0, {
        damping: config.damping,
        stiffness: config.stiffness,
      });
    }

    if (config.opacityTo !== undefined) {
      opacity.value = withTiming(1, {
        duration: config.duration,
      });
    }

    onPressOut?.();
  }, [disabled, config, scale, translateY, opacity, onPressOut]);

  const reset = useCallback(() => {
    isPressedRef.current = false;
    scale.value = withSpring(1);
    translateY.value = withSpring(0);
    opacity.value = withTiming(1);
  }, [scale, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return {
    style: animatedStyle as unknown as { transform: [{ scale: number }] },
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
    reset,
    isPressed: isPressedRef.current,
  };
}

// ============================================================================
// RIPPLE EFFECT
// ============================================================================

export interface RippleConfig {
  /** Ripple color (RGBA) */
  color: string;
  /** Maximum ripple size */
  maxSize: number;
  /** Animation duration (ms) */
  duration: number;
  /** Opacity of ripple */
  opacity: number;
}

export const defaultRippleConfig: RippleConfig = {
  color: 'rgba(255, 255, 255, 0.3)',
  maxSize: 200,
  duration: 400,
  opacity: 0.3,
};

export interface RippleState {
  x: SharedValue<number>;
  y: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  isActive: SharedValue<boolean>;
}

/**
 * Hook for Material Design ripple effect
 *
 * @example
 * ```tsx
 * const ripple = useRippleEffect();
 *
 * <Pressable onPressIn={ripple.onPressIn}>
 *   <View>
 *     <Animated.View style={[styles.ripple, ripple.style]} />
 *     <Text>Tap Me</Text>
 *   </View>
 * </Pressable>
 * ```
 */
export function useRippleEffect(config: Partial<RippleConfig> = {}) {
  const mergedConfig = { ...defaultRippleConfig, ...config };

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const isActive = useSharedValue(false);

  const onPressIn = useCallback(
    (event?: GestureResponderEvent) => {
      // Get touch coordinates if available
      if (event?.nativeEvent) {
        x.value = event.nativeEvent.locationX;
        y.value = event.nativeEvent.locationY;
      } else {
        x.value = 0;
        y.value = 0;
      }

      isActive.value = true;
      scale.value = 0;
      opacity.value = mergedConfig.opacity;

      scale.value = withTiming(1, {
        duration: mergedConfig.duration,
        easing: Easing.out(Easing.cubic),
      });
    },
    [x, y, scale, opacity, isActive, mergedConfig]
  );

  const onPressOut = useCallback(() => {
    opacity.value = withTiming(0, {
      duration: mergedConfig.duration * 0.5,
    }, (finished) => {
      if (finished) {
        isActive.value = false;
        scale.value = 0;
      }
    });
  }, [opacity, scale, isActive, mergedConfig.duration]);

  const rippleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x.value - mergedConfig.maxSize / 2,
    top: y.value - mergedConfig.maxSize / 2,
    width: mergedConfig.maxSize,
    height: mergedConfig.maxSize,
    borderRadius: mergedConfig.maxSize / 2,
    backgroundColor: mergedConfig.color,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    pointerEvents: 'none',
  }));

  return {
    onPressIn,
    onPressOut,
    style: rippleStyle,
    values: { x, y, scale, opacity, isActive },
  };
}

// ============================================================================
// LONG PRESS ANIMATION
// ============================================================================

export interface LongPressAnimationConfig {
  /** Scale at full press */
  maxScale: number;
  /** Duration to reach max (ms) */
  fillDuration: number;
  /** Haptic trigger at progress */
  hapticAtProgress?: number;
  /** Callback for progress updates */
  onProgress?: (progress: number) => void;
}

/**
 * Hook for long press with progress indication
 *
 * @example
 * ```tsx
 * const longPress = useLongPressAnimation({
 *   maxScale: 0.9,
 *   fillDuration: 800,
 *   onComplete: () => console.log('Long press!'),
 * });
 *
 * <Pressable
 *   onPressIn={longPress.onPressIn}
 *   onPressOut={longPress.onPressOut}
 *   delayLongPress={800}
 * >
 *   <Animated.View style={longPress.style}>
 *     <Animated.View style={longPress.progressStyle} />
 *   </Animated.View>
 * </Pressable>
 * ```
 */
export function useLongPressAnimation(
  config: LongPressAnimationConfig & { onComplete?: () => void }
) {
  const { maxScale, fillDuration, hapticAtProgress = 0.5, onProgress, onComplete } = config;

  const scale = useSharedValue(1);
  const progress = useSharedValue(0);
  const isPressed = useSharedValue(false);
  const hapticTriggered = useSharedValue(false);

  const onPressIn = useCallback(() => {
    isPressed.value = true;
    hapticTriggered.value = false;

    scale.value = withTiming(maxScale, {
      duration: fillDuration,
      easing: Easing.linear,
    });

    progress.value = withTiming(
      1,
      { duration: fillDuration, easing: Easing.linear },
      (finished) => {
        if (finished && isPressed.value && onComplete) {
          runOnJS(onComplete)();
        }
      }
    );
  }, [maxScale, fillDuration, scale, progress, isPressed, hapticTriggered, onComplete]);

  const onPressOut = useCallback(() => {
    isPressed.value = false;
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    progress.value = withTiming(0, { duration: 150 });
  }, [scale, progress, isPressed]);

  // Track progress for haptic and callbacks
  // Note: SharedValue does not support addListener in reanimated v3.
  // Progress tracking should use useAnimatedReaction if needed.
  useEffect(() => {
    // No-op cleanup
    return () => {};
  }, [progress, hapticAtProgress, onProgress, hapticTriggered]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    opacity: progress.value > 0 ? 1 : 0,
  }));

  return {
    onPressIn,
    onPressOut,
    style: animatedStyle,
    progressStyle,
    progress: progress.value,
  };
}

// ============================================================================
// TOGGLE ANIMATION
// ============================================================================

export interface ToggleAnimationConfig {
  /** Active scale */
  activeScale: number;
  /** Inactive scale */
  inactiveScale: number;
  /** Animation duration */
  duration: number;
  /** Thumb travel distance */
  travelDistance: number;
}

/**
 * Hook for toggle/switch animations
 *
 * @example
 * ```tsx
 * const toggle = useToggleAnimation({ isOn });
 *
 * <Pressable onPress={() => setIsOn(!isOn)}>
 *   <View style={styles.track}>
 *     <Animated.View style={[styles.thumb, toggle.thumbStyle]} />
 *   </View>
 * </Pressable>
 * ```
 */
export function useToggleAnimation(
  isOn: boolean,
  config: Partial<ToggleAnimationConfig> = {}
) {
  const mergedConfig: ToggleAnimationConfig = {
    activeScale: 1.1,
    inactiveScale: 1,
    duration: 200,
    travelDistance: 22,
    ...config,
  };

  const translateX = useSharedValue(isOn ? mergedConfig.travelDistance : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withSpring(
      isOn ? mergedConfig.travelDistance : 0,
      { damping: 20, stiffness: 300 }
    );
  }, [isOn, translateX, mergedConfig.travelDistance]);

  const onPress = useCallback(() => {
    scale.value = withSequence(
      withTiming(mergedConfig.activeScale, { duration: 100 }),
      withTiming(mergedConfig.inactiveScale, { duration: 100 })
    );
  }, [scale, mergedConfig]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: isOn ? '#6B7B5E' : '#C7C7CC',
  }));

  return {
    thumbStyle,
    trackStyle,
    onPress,
  };
}

// ============================================================================
// CARD FEEDBACK
// ============================================================================

export interface CardFeedbackConfig {
  /** Elevation change on press */
  elevationDelta: number;
  /** Shadow opacity change */
  shadowDelta: number;
  /** Scale amount */
  scale: number;
}

/**
 * Hook for card press feedback with shadow/elevation
 *
 * @example
 * ```tsx
 * const card = useCardFeedback();
 *
 * <Pressable onPressIn={card.onPressIn} onPressOut={card.onPressOut}>
 *   <Animated.View style={[styles.card, card.style]}>
 *     <Text>Card Content</Text>
 *   </Animated.View>
 * </Pressable>
 * ```
 */
export function useCardFeedback(config: Partial<CardFeedbackConfig> = {}) {
  const mergedConfig: CardFeedbackConfig = {
    elevationDelta: 2,
    shadowDelta: 0.1,
    scale: 0.98,
    ...config,
  };

  const scale = useSharedValue(1);
  const elevation = useSharedValue(4);
  const shadowOpacity = useSharedValue(0.15);

  const onPressIn = useCallback(() => {
    scale.value = withSpring(mergedConfig.scale, { damping: 20, stiffness: 300 });
    elevation.value = withTiming(mergedConfig.elevationDelta);
    shadowOpacity.value = withTiming(0.05);
  }, [scale, elevation, shadowOpacity, mergedConfig]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    elevation.value = withTiming(4);
    shadowOpacity.value = withTiming(0.15);
  }, [scale, elevation, shadowOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    elevation: elevation.value,
    shadowOpacity: shadowOpacity.value,
  }));

  return {
    onPressIn,
    onPressOut,
    style: animatedStyle,
    values: { scale, elevation, shadowOpacity },
  };
}

// ============================================================================
// COMBINED PRESS + RIPPLE
// ============================================================================

/**
 * Hook combining press scale and ripple effects
 *
 * @example
 * ```tsx
 * const feedback = usePressFeedback({ variant: 'button' });
 *
 * <Pressable
 *   onPressIn={feedback.onPressIn}
 *   onPressOut={feedback.onPressOut}
 * >
 *   <View>
 *     <Animated.View style={feedback.rippleStyle} />
 *     <Animated.View style={feedback.pressStyle}>
 *       <Text>Button</Text>
 *     </Animated.View>
 *   </View>
 * </Pressable>
 * ```
 */
export function usePressFeedback(
  pressOptions: UsePressAnimationOptions = {},
  rippleConfig: Partial<RippleConfig> = {}
) {
  const press = usePressAnimation(pressOptions);
  const ripple = useRippleEffect(rippleConfig);

  const onPressIn = useCallback(
    (event?: GestureResponderEvent) => {
      press.onPressIn();
      ripple.onPressIn(event);
    },
    [press, ripple]
  );

  const onPressOut = useCallback(() => {
    press.onPressOut();
    ripple.onPressOut();
  }, [press, ripple]);

  return {
    onPressIn,
    onPressOut,
    pressStyle: press.style,
    rippleStyle: ripple.style,
    reset: press.reset,
  };
}
