/**
 * Material Design 3 Linear Progress Indicator
 *
 * A horizontal progress bar following MD3 specifications:
 * - 4dp height (h-1)
 * - Animated fill with smooth transitions
 * - Support for determinate and indeterminate states
 * - Track and indicator colors from theme
 * - Full accessibility support
 *
 * @example
 * ```tsx
 * // Determinate progress
 * <LinearProgress value={75} />
 *
 * // Indeterminate (loading)
 * <LinearProgress indeterminate />
 *
 * // Custom colors
 * <LinearProgress
 *   value={50}
 *   color="bg-primary"
 *   trackColor="bg-surfaceVariant"
 * />
 *
 * // With label
 * <LinearProgress value={progress} showLabel />
 * ```
 */

import React, { useEffect, useMemo, type ReactElement } from 'react';
import { View, type ViewProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../../hooks/useTheme';
import { cn } from '../../../../lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface LinearProgressProps extends Omit<ViewProps, 'style'> {
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
   * Height of the progress bar
   * @default 4
   */
  height?: number;
  /**
   * Color class for the progress indicator
   * @default 'bg-primary'
   */
  color?: string;
  /**
   * Color class for the track background
   * @default 'bg-surfaceVariant'
   */
  trackColor?: string;
  /**
   * Whether to show the percentage label
   * @default false
   */
  showLabel?: boolean;
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

const INDETERMINATE_DURATION = 1500;
const INDETERMINATE_DELAY = 500;

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Material Design 3 Linear Progress Indicator
 *
 * Features:
 * - Determinate and indeterminate modes
 * - Smooth animated transitions
 * - Customizable colors
 * - Accessibility support
 */
export function LinearProgress({
  value,
  indeterminate = false,
  height = 4,
  color = 'bg-primary',
  trackColor = 'bg-surfaceVariant',
  showLabel = false,
  animationDuration = 300,
  style,
  accessibilityLabel,
  testID,
  ...viewProps
}: LinearProgressProps): ReactElement {
  const theme = useTheme();

  // Clamp value between 0-100
  const clampedValue = useMemo(() => {
    if (value === undefined) return 0;
    return Math.max(0, Math.min(100, value));
  }, [value]);

  // Animation values
  const progress = useSharedValue(0);
  const indeterminateTranslateX = useSharedValue(-1);
  const indeterminateScaleX = useSharedValue(0.3);

  // Animate progress changes
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
      // Create infinite looping animation
      indeterminateTranslateX.value = withRepeat(
        withSequence(
          // Start from left
          withTiming(-1, { duration: 0 }),
          // Move to right with slight delay
          withTiming(1, {
            duration: INDETERMINATE_DURATION,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1, // Infinite
        false,
      );

      // Scale animation for the indicator
      indeterminateScaleX.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 0 }),
          withTiming(0.7, {
            duration: INDETERMINATE_DURATION / 2,
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(0.3, {
            duration: INDETERMINATE_DURATION / 2,
            easing: Easing.in(Easing.cubic),
          }),
        ),
        -1,
        false,
      );
    }
  }, [indeterminate, indeterminateTranslateX, indeterminateScaleX]);

  // Animated style for determinate progress
  const determinateStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  // Animated style for indeterminate progress
  const indeterminateStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(indeterminateTranslateX.value, [-1, 1], [-100, 100]) },
        { scaleX: indeterminateScaleX.value },
      ],
    };
  });

  // Container classes
  const containerClasses = cn('w-full rounded-full overflow-hidden', trackColor);

  // Indicator classes
  const indicatorClasses = cn('h-full rounded-full', color);

  // Accessibility
  const computedAccessibilityLabel =
    accessibilityLabel ||
    (indeterminate ? 'Loading' : `Progress: ${Math.round(clampedValue)} percent`);

  return (
    <View style={style} {...viewProps}>
      <View
        className={containerClasses}
        style={{ height }}
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
      >
        <Animated.View
          className={indicatorClasses}
          style={[{ height }, indeterminate ? indeterminateStyle : determinateStyle]}
        />
      </View>

      {/* Optional label */}
      {showLabel && !indeterminate && (
        <View className="flex-row justify-end mt-1">
          <Animated.Text className="text-xs text-onSurfaceVariant">
            {Math.round(clampedValue)}%
          </Animated.Text>
        </View>
      )}
    </View>
  );
}

LinearProgress.displayName = 'LinearProgress';

export default LinearProgress;
