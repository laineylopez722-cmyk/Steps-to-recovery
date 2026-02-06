/**
 * Circular Progress Component
 * Animated circular progress indicator with optional center content
 *
 * Uses react-native-svg and react-native-reanimated for smooth animations.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, type ViewStyle, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CircularProgressProps {
  /**
   * Progress value (0-100)
   */
  progress: number;
  /**
   * Size of the component (width and height)
   * @default 120
   */
  size?: number;
  /**
   * Stroke width of the progress arc
   * @default 10
   */
  strokeWidth?: number;
  /**
   * Color of the progress arc
   * Uses theme primary color if not provided
   */
  progressColor?: string;
  /**
   * Color of the track (background circle)
   * Uses theme border color if not provided
   */
  trackColor?: string;
  /**
   * Whether to animate changes
   * @default true
   */
  animated?: boolean;
  /**
   * Animation duration in ms
   * @default 1000
   */
  duration?: number;
  /**
   * Whether to show percentage in center
   * @default false
   */
  showPercentage?: boolean;
  /**
   * Custom center content (overrides showPercentage)
   */
  centerContent?: React.ReactNode;
  /**
   * Label to show below the value
   */
  label?: string;
  /**
   * Custom value to display (instead of percentage)
   */
  displayValue?: string | number;
  /**
   * Whether to animate the number count up
   * @default true
   */
  animateNumber?: boolean;
  /**
   * Rotation offset in degrees (0 = top)
   * @default -90
   */
  rotation?: number;
  /**
   * Stroke line cap style
   * @default 'round'
   */
  lineCap?: 'butt' | 'round' | 'square';
  /**
   * Custom container style
   */
  style?: ViewStyle;
  /**
   * Test ID for testing
   */
  testID?: string;
}

export function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 10,
  progressColor,
  trackColor,
  animated = true,
  duration = 1000,
  showPercentage = false,
  centerContent,
  label,
  displayValue,
  animateNumber = true,
  rotation = -90,
  lineCap = 'round',
  style,
  testID,
}: CircularProgressProps): React.ReactElement {
  const theme = useTheme();

  // Colors
  const activeColor = progressColor || theme.colors.primary;
  const inactiveColor = trackColor || theme.colors.border;

  // Calculate dimensions
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Clamp progress to 0-100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  // Animation values
  const animatedProgress = useSharedValue(0);
  const [displayNumber, setDisplayNumber] = useState(0);

  // Animate on progress change
  useEffect(() => {
    if (animated) {
      // Animate progress circle
      animatedProgress.value = withTiming(clampedProgress, {
        duration,
        easing: Easing.out(Easing.cubic),
      });

      // Animate number if enabled
      if (animateNumber && (showPercentage || displayValue === undefined)) {
        const startValue = displayNumber;
        const endValue = clampedProgress;
        const startTime = Date.now();

        const animateFrame = (): void => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const currentValue = startValue + (endValue - startValue) * eased;

          setDisplayNumber(Math.round(currentValue));

          if (progress < 1) {
            requestAnimationFrame(animateFrame);
          }
        };

        requestAnimationFrame(animateFrame);
      }
    } else {
      animatedProgress.value = clampedProgress;
      setDisplayNumber(clampedProgress);
    }
  }, [clampedProgress, animated, duration, animateNumber, showPercentage, displayValue]);

  // Animated props for progress circle
  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value / 100);
    return {
      strokeDashoffset,
    };
  });

  // Determine what to show in center
  const renderCenterContent = (): React.ReactNode => {
    if (centerContent) {
      return centerContent;
    }

    if (showPercentage || displayValue !== undefined) {
      const valueToShow = displayValue !== undefined ? displayValue : `${displayNumber}%`;

      return (
        <View style={styles.centerContent}>
          <Text style={[styles.value, theme.typography.h2, { color: theme.colors.text }]}>
            {typeof valueToShow === 'number' && animateNumber ? displayNumber : valueToShow}
          </Text>
          {label && (
            <Text
              style={[
                styles.label,
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
            >
              {label}
            </Text>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { width: size, height: size }, style]} testID={testID}>
      <Svg width={size} height={size}>
        <G rotation={rotation} origin={`${center}, ${center}`}>
          {/* Background Track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={inactiveColor}
            strokeWidth={strokeWidth}
          />

          {/* Progress Arc */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeLinecap={lineCap}
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animatedCircleProps}
          />
        </G>
      </Svg>

      {/* Center Content */}
      <View style={[styles.centerContainer, { width: size, height: size }]}>
        {renderCenterContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    textAlign: 'center',
    marginTop: 2,
  },
});

