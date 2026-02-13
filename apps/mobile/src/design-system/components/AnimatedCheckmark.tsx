/**
 * Animated Checkmark Component
 * SVG path animation drawing a checkmark with scale bounce on complete
 *
 * Uses react-native-reanimated and react-native-svg for smooth 60fps animations.
 */

import React, { useEffect } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { hapticSuccess } from '../../utils/haptics';
import { useDs } from '../DsProvider';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface AnimatedCheckmarkProps {
  /**
   * Size of the checkmark (width and height)
   * @default 80
   */
  size?: number;
  /**
   * Color of the checkmark stroke
   * If not provided, uses theme success color
   */
  color?: string;
  /**
   * Color of the background circle
   * If not provided, uses semi-transparent version of color
   */
  backgroundColor?: string;
  /**
   * Stroke width of the checkmark
   * @default 4
   */
  strokeWidth?: number;
  /**
   * Whether to animate on mount
   * @default true
   */
  animate?: boolean;
  /**
   * Delay before animation starts (ms)
   * @default 0
   */
  delay?: number;
  /**
   * Callback when animation completes
   */
  onAnimationComplete?: () => void;
  /**
   * Whether to show background circle
   * @default true
   */
  showBackground?: boolean;
  /**
   * Whether to trigger haptic feedback on complete
   * @default true
   */
  hapticFeedback?: boolean;
  /**
   * Custom container style
   */
  style?: ViewStyle;
}

export function AnimatedCheckmark({
  size = 80,
  color,
  backgroundColor,
  strokeWidth = 4,
  animate = true,
  delay = 0,
  onAnimationComplete,
  showBackground = true,
  hapticFeedback = true,
  style,
}: AnimatedCheckmarkProps): React.ReactElement {
  const ds = useDs();

  // Use theme success color if not provided
  const checkColor = color || ds.semantic.intent.success.solid;
  const bgColor = backgroundColor || `${checkColor}20`;

  // Animation values
  const pathProgress = useSharedValue(0);
  const circleProgress = useSharedValue(0);
  const scale = useSharedValue(animate ? 0.8 : 1);

  // Calculate SVG dimensions
  const padding = strokeWidth * 2;
  const viewBoxSize = 100;
  const center = viewBoxSize / 2;
  const radius = (viewBoxSize - padding * 2) / 2;

  // Checkmark path coordinates (relative to 100x100 viewBox)
  const checkmarkPath = `M ${center - 20} ${center} L ${center - 5} ${center + 15} L ${center + 25} ${center - 20}`;

  // Calculate path length for stroke animation
  const checkmarkLength = 60; // Approximate length of the checkmark path

  // Trigger haptic feedback
  const triggerHaptic = (): void => {
    if (hapticFeedback) {
      hapticSuccess();
    }
  };

  // Trigger completion callback
  const handleComplete = (): void => {
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  };

  useEffect(() => {
    if (animate) {
      // Reset values
      pathProgress.value = 0;
      circleProgress.value = 0;
      scale.value = 0.8;

      // Animate circle first, then checkmark, then scale bounce
      circleProgress.value = withDelay(
        delay,
        withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.ease),
        }),
      );

      pathProgress.value = withDelay(
        delay + 200,
        withTiming(
          1,
          {
            duration: 400,
            easing: Easing.out(Easing.ease),
          },
          (finished) => {
            if (finished) {
              runOnJS(triggerHaptic)();
            }
          },
        ),
      );

      scale.value = withDelay(
        delay + 500,
        withSequence(
          withSpring(1.15, { damping: 8, stiffness: 200 }),
          withSpring(1, { damping: 12, stiffness: 150 }, (finished) => {
            if (finished) {
              runOnJS(handleComplete)();
            }
          }),
        ),
      );
    } else {
      // No animation - set to final state
      pathProgress.value = 1;
      circleProgress.value = 1;
      scale.value = 1;
    }
  }, [animate, delay]);

  // Animated props for circle
  const animatedCircleProps = useAnimatedProps(() => {
    const circumference = 2 * Math.PI * radius;
    return {
      strokeDasharray: `${circumference} ${circumference}`,
      strokeDashoffset: circumference * (1 - circleProgress.value),
    };
  });

  // Animated props for checkmark path
  const animatedPathProps = useAnimatedProps(() => {
    return {
      strokeDasharray: `${checkmarkLength} ${checkmarkLength}`,
      strokeDashoffset: checkmarkLength * (1 - pathProgress.value),
    };
  });

  // Animated style for scale
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View
      style={[styles.container, { width: size, height: size }, animatedContainerStyle, style]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
        {/* Background circle */}
        {showBackground && (
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            fill={bgColor}
            stroke={checkColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            animatedProps={animatedCircleProps}
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}

        {/* Checkmark path */}
        <AnimatedPath
          d={checkmarkPath}
          fill="none"
          stroke={checkColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          animatedProps={animatedPathProps}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
