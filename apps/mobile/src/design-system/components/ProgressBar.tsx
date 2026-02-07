/**
 * iOS-style ProgressBar Component
 * Animated progress indicator with smooth transitions
 */

import { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle, type AccessibilityRole } from 'react-native';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

export interface ProgressBarProps {
  /**
   * Progress value between 0 and 1 (0% to 100%)
   */
  progress: number;
  /**
   * Height of the progress bar
   * @default 8
   */
  height?: number;
  /**
   * Color of the filled portion
   * If not provided, uses theme.colors.primary
   */
  color?: string;
  /**
   * Color of the unfilled portion
   * If not provided, uses theme.colors.border
   */
  backgroundColor?: string;
  /**
   * Whether to animate progress changes
   * @default true
   */
  animated?: boolean;
  /**
   * Custom container style
   */
  style?: ViewStyle;
  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;
  /**
   * Accessibility role
   */
  accessibilityRole?: AccessibilityRole;
  /**
   * Accessibility hint
   */
  accessibilityHint?: string;
}

export function ProgressBar({
  progress,
  height = 8,
  color,
  backgroundColor,
  animated = true,
  style,
  accessibilityLabel,
  accessibilityRole,
  accessibilityHint,
}: ProgressBarProps) {
  const theme = useTheme();
  const progressWidth = useSharedValue(0);
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    if (animated) {
      progressWidth.value = withSpring(clampedProgress, {
        damping: 15,
        stiffness: 300,
      });
    } else {
      progressWidth.value = clampedProgress;
    }
  }, [clampedProgress, animated, progressWidth]);

  const fillColor = color || theme.colors.primary;
  const bgColor = backgroundColor || theme.colors.border;

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: bgColor,
          borderRadius: height / 2,
        },
        style,
      ]}
      accessibilityRole={accessibilityRole || 'progressbar'}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(clampedProgress * 100),
      }}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            width: progressWidth,
            backgroundColor: fillColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
