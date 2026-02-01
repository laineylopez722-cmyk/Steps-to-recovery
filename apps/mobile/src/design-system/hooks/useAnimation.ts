/**
 * Animation helper hooks
 * Provides reusable animation patterns using React Native Animated API
 * with additional Reanimated-based hooks for premium interactions
 */

import { useRef, useEffect, useCallback } from 'react';
import { Animated } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  runOnJS,
  Easing as ReanimatedEasing,
} from 'react-native-reanimated';
import { springConfigs, easingCurves } from '../tokens/animations';
import { hapticError } from '../../utils/haptics';

/**
 * Type definitions for animation hooks
 */
interface PressAnimationReturn {
  scaleAnim: Animated.Value;
  animatePress: (isPressed: boolean) => void;
}

interface BounceAnimationReturn {
  scaleAnim: Animated.Value;
  bounce: () => void;
}

interface FadeAndScaleReturn {
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

interface ShakeAnimationReturn {
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  shake: (withHaptic?: boolean) => void;
}

/**
 * Fade-in animation hook
 * Animates opacity from 0 to 1 on mount
 *
 * @param delay - Delay before animation starts (ms)
 * @returns Animated value for opacity
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const fadeAnim = useFadeIn(0);
 *
 *   return (
 *     <Animated.View style={{ opacity: fadeAnim }}>
 *       <Text>I fade in!</Text>
 *     </Animated.View>
 *   );
 * }
 * ```
 */
export function useFadeIn(delay: number = 0): Animated.Value {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    const timer = setTimeout(() => {
      animation = Animated.spring(fadeAnim, {
        toValue: 1,
        ...springConfigs.default,
      });
      animation.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      animation?.stop();
    };
  }, [delay]);

  return fadeAnim;
}

/**
 * Scale animation hook
 * Animates scale from initial value to 1 on mount
 *
 * @param initialScale - Starting scale value (default: 0.95)
 * @param delay - Delay before animation starts (ms)
 * @returns Animated value for scale transform
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const scaleAnim = useScaleIn(0.9, 100);
 *
 *   return (
 *     <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
 *       <Text>I scale in!</Text>
 *     </Animated.View>
 *   );
 * }
 * ```
 */
export function useScaleIn(initialScale: number = 0.95, delay: number = 0): Animated.Value {
  const scaleAnim = useRef(new Animated.Value(initialScale)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    const timer = setTimeout(() => {
      animation = Animated.spring(scaleAnim, {
        toValue: 1,
        ...springConfigs.default,
      });
      animation.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      animation?.stop();
    };
  }, [delay]);

  return scaleAnim;
}

/**
 * Press animation hook
 * Provides scale animation for press interactions
 *
 * @param pressScale - Scale value when pressed (default: 0.98)
 * @returns Object with scaleAnim value and animatePress function
 *
 * @example
 * ```tsx
 * function MyButton() {
 *   const { scaleAnim, animatePress } = usePressAnimation();
 *
 *   return (
 *     <Pressable
 *       onPressIn={() => animatePress(true)}
 *       onPressOut={() => animatePress(false)}
 *     >
 *       <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
 *         <Text>Press me!</Text>
 *       </Animated.View>
 *     </Pressable>
 *   );
 * }
 * ```
 */
export function usePressAnimation(pressScale: number = 0.98): PressAnimationReturn {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePress = useCallback(
    (isPressed: boolean) => {
      Animated.spring(scaleAnim, {
        toValue: isPressed ? pressScale : 1,
        ...springConfigs.gentle,
      }).start();
    },
    [scaleAnim, pressScale],
  );

  return { scaleAnim, animatePress };
}

/**
 * Bounce animation hook
 * Provides a bounce effect that can be triggered
 *
 * @param bounceScale - Scale value for bounce effect (default: 1.15)
 * @returns Object with scaleAnim value and bounce function
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { scaleAnim, bounce } = useBounceAnimation();
 *
 *   const handlePress = () => {
 *     bounce();
 *     // Other press logic...
 *   };
 *
 *   return (
 *     <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
 *       <Button onPress={handlePress} title="Bounce!" />
 *     </Animated.View>
 *   );
 * }
 * ```
 */
export function useBounceAnimation(bounceScale: number = 1.15): BounceAnimationReturn {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const bounce = useCallback(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: bounceScale,
        ...springConfigs.bouncy,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...springConfigs.bouncy,
      }),
    ]).start();
  }, [scaleAnim, bounceScale]);

  return { scaleAnim, bounce };
}

/**
 * Slide-in animation hook
 * Animates translateY from offset to 0
 *
 * @param offset - Initial Y offset (default: 50)
 * @param delay - Delay before animation starts (ms)
 * @returns Animated value for translateY transform
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const slideAnim = useSlideIn(100, 200);
 *
 *   return (
 *     <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
 *       <Text>I slide up!</Text>
 *     </Animated.View>
 *   );
 * }
 * ```
 */
export function useSlideIn(offset: number = 50, delay: number = 0): Animated.Value {
  const slideAnim = useRef(new Animated.Value(offset)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    const timer = setTimeout(() => {
      animation = Animated.spring(slideAnim, {
        toValue: 0,
        ...springConfigs.default,
      });
      animation.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      animation?.stop();
    };
  }, [delay]);

  return slideAnim;
}

/**
 * Combined fade + scale animation hook
 * Animates both opacity and scale for a premium entrance effect
 *
 * @param delay - Delay before animation starts (ms)
 * @returns Object with fadeAnim and scaleAnim values
 *
 * @example
 * ```tsx
 * function MyCard() {
 *   const { fadeAnim, scaleAnim } = useFadeAndScaleIn(0);
 *
 *   return (
 *     <Animated.View style={{
 *       opacity: fadeAnim,
 *       transform: [{ scale: scaleAnim }]
 *     }}>
 *       <Text>I fade and scale in!</Text>
 *     </Animated.View>
 *   );
 * }
 * ```
 */
export function useFadeAndScaleIn(delay: number = 0): FadeAndScaleReturn {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    const timer = setTimeout(() => {
      animation = Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 1,
          ...springConfigs.default,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          ...springConfigs.default,
        }),
      ]);
      animation.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      animation?.stop();
    };
  }, [delay]);

  return { fadeAnim, scaleAnim };
}

/**
 * Number counter animation hook
 * Animates a number from start to end value
 *
 * @param start - Starting number
 * @param end - Ending number
 * @param duration - Animation duration in ms
 * @returns Animated value that goes from 0 to 1, use interpolate for custom ranges
 *
 * @example
 * ```tsx
 * function Counter({ value }: { value: number }) {
 *   const animatedValue = useNumberAnimation(0, value, 500);
 *
 *   return (
 *     <Animated.Text>
 *       {animatedValue.interpolate({
 *         inputRange: [0, 1],
 *         outputRange: ['0', value.toString()],
 *       })}
 *     </Animated.Text>
 *   );
 * }
 * ```
 */
export function useNumberAnimation(
  start: number,
  end: number,
  duration: number = 500,
): Animated.Value {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    // Reset to 0 and animate to 1
    animValue.setValue(0);
    animation = Animated.timing(animValue, {
      toValue: 1,
      duration,
      easing: easingCurves.easeOut,
      useNativeDriver: true,
    });
    animation.start();

    return () => {
      animation?.stop();
    };
  }, [end, duration]); // Only re-run when end or duration changes

  return animValue;
}

/**
 * Shake animation hook (Reanimated)
 * Provides horizontal shake animation for error feedback
 *
 * @param amplitude - Maximum horizontal offset in pixels (default: 10)
 * @param oscillations - Number of shake oscillations (default: 3)
 * @returns Object with animatedStyle and shake function
 *
 * @example
 * ```tsx
 * import Animated from 'react-native-reanimated';
 *
 * function MyInput() {
 *   const { animatedStyle, shake } = useShakeAnimation();
 *
 *   const handleError = () => {
 *     shake(true); // with haptic feedback
 *   };
 *
 *   return (
 *     <Animated.View style={animatedStyle}>
 *       <TextInput />
 *     </Animated.View>
 *   );
 * }
 * ```
 */
export function useShakeAnimation(
  amplitude: number = 10,
  oscillations: number = 3,
): ShakeAnimationReturn {
  const translateX = useSharedValue(0);

  const shake = useCallback(
    (withHaptic: boolean = true) => {
      'worklet';
      // Generate shake sequence: right, left, right, left... back to center
      const shakeSequence: number[] = [];
      for (let i = 0; i < oscillations; i++) {
        // Decreasing amplitude for natural feel
        const currentAmplitude = amplitude * (1 - i / oscillations);
        shakeSequence.push(
          withTiming(currentAmplitude, { duration: 50, easing: ReanimatedEasing.linear }),
          withTiming(-currentAmplitude, { duration: 50, easing: ReanimatedEasing.linear }),
        );
      }
      // Return to center
      shakeSequence.push(withSpring(0, { damping: 10, stiffness: 200 }));

      translateX.value = withSequence(...shakeSequence);

      // Trigger haptic on the JS thread
      if (withHaptic) {
        runOnJS(hapticError)();
      }
    },
    [amplitude, oscillations, translateX],
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return { animatedStyle, shake };
}

/**
 * Count up animation hook (Reanimated)
 * Animates a number from 0 to target value
 *
 * @param targetValue - The final number to count to
 * @param duration - Animation duration in ms (default: 1000)
 * @returns Object with current interpolated value and animatedStyle for opacity
 *
 * @example
 * ```tsx
 * function DaysCounter({ days }: { days: number }) {
 *   const { value } = useCountUp(days, 1500);
 *
 *   return <Text>{Math.floor(value)}</Text>;
 * }
 * ```
 */
export function useCountUp(targetValue: number, duration: number = 1000): { value: number } {
  const progress = useSharedValue(0);
  const displayValue = useRef(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration,
      easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
    });

    // Update display value using JS listener
    const interval = setInterval(() => {
      displayValue.current = progress.value * targetValue;
    }, 16); // ~60fps

    const timeout = setTimeout(() => {
      displayValue.current = targetValue;
      clearInterval(interval);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [targetValue, duration]);

  return { value: displayValue.current };
}

/**
 * Stagger animation delay calculator
 * Returns the delay for an item based on its index
 *
 * @param index - Item index in the list
 * @param baseDelay - Base delay per item (default: 50ms)
 * @param maxDelay - Maximum total delay (default: 500ms)
 * @returns Delay in milliseconds
 *
 * @example
 * ```tsx
 * {items.map((item, index) => (
 *   <FadeInView delay={getStaggerDelay(index)}>
 *     <ItemComponent item={item} />
 *   </FadeInView>
 * ))}
 * ```
 */
export function getStaggerDelay(
  index: number,
  baseDelay: number = 50,
  maxDelay: number = 500,
): number {
  return Math.min(index * baseDelay, maxDelay);
}
