/**
 * Material Design 3 Circular Progress Indicator
 * 
 * A circular progress indicator following MD3 specifications:
 * - 48dp default size (adjustable)
 * - Smooth rotation animation
 * - Support for determinate and indeterminate states
 * - Center content support (percentage, icon, or custom)
 * - Full accessibility support
 * 
 * @example
 * ```tsx
 * // Determinate progress
 * <CircularProgress value={75} />
 * 
 * // Indeterminate loading
 * <CircularProgress indeterminate />
 * 
 * // With percentage label
 * <CircularProgress value={50} showLabel size={64} />
 * 
 * // Custom center content
 * <CircularProgress value={100}>
 *   <CheckIcon />
 * </CircularProgress>
 * ```
 */

import React, { useEffect, useMemo, type ReactElement, type ReactNode } from 'react';
import { View, type ViewProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../../../hooks/useTheme';
import { cn } from '../../../../lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface CircularProgressProps extends Omit<ViewProps, 'style'> {
  /**
   * Progress value (0-100)
   * Required for determinate mode
   */
  value?: number;
  /**
   * Indeterminate mode for unknown progress
   * @default false
   */
  indeterminate?: boolean;
  /**
   * Size of the progress indicator (width and height)
   * @default 48
   */
  size?: number;
  /**
   * Stroke width of the progress arc
   * @default 4
   */
  strokeWidth?: number;
  /**
   * Color of the progress arc
   * @default theme.colors.primary
   */
  color?: string;
  /**
   * Color of the track (background circle)
   * @default theme.colors.surfaceVariant
   */
  trackColor?: string;
  /**
   * Whether to show percentage in center
   * @default false
   */
  showLabel?: boolean;
  /**
   * Custom center content (overrides showLabel)
   */
  children?: ReactNode;
  /**
   * Label text shown below percentage
   */
  label?: string;
  /**
   * Animation duration in ms
   * @default 300
   */
  animationDuration?: number;
  /**
   * Custom container style
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
  /**
   * Test ID for testing
   */
  testID?: string;
}

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

const INDETERMINATE_ROTATION_DURATION = 2000;
const STROKE_LINE_CAP = 'round';

// ============================================================================
// COMPONENT
// ============================================================================

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Material Design 3 Circular Progress Indicator
 * 
 * Features:
 * - Determinate and indeterminate modes
 * - Smooth animated transitions
 * - Center content support
 * - Customizable size and colors
 * - Accessibility support
 */
export function CircularProgress({
  value,
  indeterminate = false,
  size = 48,
  strokeWidth = 4,
  color,
  trackColor,
  showLabel = false,
  children,
  label,
  animationDuration = 300,
  style,
  accessibilityLabel,
  testID,
  ...viewProps
}: CircularProgressProps): ReactElement {
  const theme = useTheme();

  // Clamp value between 0-100
  const clampedValue = useMemo(() => {
    if (value === undefined) return 0;
    return Math.max(0, Math.min(100, value));
  }, [value]);

  // Colors
  const progressColor = color || theme.colors.primary;
  const backgroundColor = trackColor || theme.colors.surfaceVariant;

  // Calculate dimensions
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animation values
  const progress = useSharedValue(0);
  const rotation = useSharedValue(0);
  const indeterminateStart = useSharedValue(0);
  const indeterminateEnd = useSharedValue(0);

  // Animate progress changes (determinate)
  useEffect(() => {
    if (!indeterminate) {
      progress.value = withTiming(clampedValue / 100, {
        duration: animationDuration,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [clampedValue, indeterminate, progress, animationDuration]);

  // Indeterminate animation
  useEffect(() => {
    if (indeterminate) {
      // Continuous rotation
      rotation.value = withRepeat(
        withTiming(1, {
          duration: INDETERMINATE_ROTATION_DURATION,
          easing: Easing.linear,
        }),
        -1,
        false,
      );

      // Arc animation (sweeping effect)
      const animateArc = () => {
        indeterminateEnd.value = withSequence(
          withTiming(0.75, {
            duration: INDETERMINATE_ROTATION_DURATION / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.25, {
            duration: INDETERMINATE_ROTATION_DURATION / 2,
            easing: Easing.inOut(Easing.ease),
          }),
        );
      };

      animateArc();
      
      // Restart arc animation periodically
      const interval = setInterval(animateArc, INDETERMINATE_ROTATION_DURATION);
      return () => clearInterval(interval);
    }
  }, [indeterminate, rotation, indeterminateEnd]);

  // Animated props for progress arc
  const animatedCircleProps = useAnimatedProps(() => {
    if (indeterminate) {
      // Indeterminate: animate strokeDasharray to create sweeping effect
      const startOffset = indeterminateStart.value * circumference;
      const endOffset = indeterminateEnd.value * circumference;
      const dashArray = endOffset - startOffset;
      return {
        strokeDashoffset: -startOffset,
        strokeDasharray: `${Math.max(0, dashArray)} ${circumference}`,
      };
    } else {
      // Determinate: standard progress
      const strokeDashoffset = circumference * (1 - progress.value);
      return {
        strokeDashoffset,
        strokeDasharray: `${circumference} ${circumference}`,
      };
    }
  });

  // Animated rotation style
  const rotationStyle = useAnimatedStyle(() => {
    if (indeterminate) {
      return {
        transform: [{ rotate: `${rotation.value * 360}deg` }],
      };
    }
    return {};
  });

  // Determine what to show in center
  const renderCenterContent = (): ReactNode => {
    if (children) {
      return children;
    }

    if (showLabel && !indeterminate) {
      return (
        <View className="items-center justify-center">
          <Animated.Text
            className="font-semibold text-onSurface"
            style={{ fontSize: size * 0.25 }}
          >
            {Math.round(clampedValue)}%
          </Animated.Text>
          {label && (
            <Animated.Text
              className="text-onSurfaceVariant"
              style={{ fontSize: size * 0.15 }}
            >
              {label}
            </Animated.Text>
          )}
        </View>
      );
    }

    return null;
  };

  // Accessibility
  const computedAccessibilityLabel =
    accessibilityLabel ||
    (indeterminate
      ? 'Loading'
      : `Progress: ${Math.round(clampedValue)} percent`);

  return (
    <View
      className={cn('items-center justify-center', viewProps.className)}
      style={[{ width: size, height: size }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={computedAccessibilityLabel}
      accessibilityValue={
        indeterminate
          ? undefined
          : {
              min: 0,
              max: 100,
              now: Math.round(clampedValue),
            }
      }
      testID={testID}
      {...viewProps}
    >
      <Animated.View style={rotationStyle}>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${center}, ${center}`}>
            {/* Background Track */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={backgroundColor}
              strokeWidth={strokeWidth}
            />

            {/* Progress Arc */}
            <AnimatedCircle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={progressColor}
              strokeWidth={strokeWidth}
              strokeLinecap={STROKE_LINE_CAP as 'round' | 'butt' | 'square'}
              animatedProps={animatedCircleProps}
            />
          </G>
        </Svg>
      </Animated.View>

      {/* Center Content */}
      <View
        className="absolute items-center justify-center"
        style={{ width: size, height: size }}
        pointerEvents="none"
      >
        {renderCenterContent()}
      </View>
    </View>
  );
}

CircularProgress.displayName = 'CircularProgress';

export default CircularProgress;
