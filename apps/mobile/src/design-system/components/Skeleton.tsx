/**
 * Skeleton Component
 * Animated placeholder for loading states with shimmer effect
 *
 * Uses react-native-reanimated for smooth shimmer animation.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

export interface SkeletonProps {
  /**
   * Width of the skeleton
   * @default '100%'
   */
  width?: number | string;
  /**
   * Height of the skeleton
   * @default 16
   */
  height?: number;
  /**
   * Border radius
   * @default 4
   */
  borderRadius?: number;
  /**
   * Preset variant for common shapes
   */
  variant?: 'text' | 'avatar' | 'card' | 'custom';
  /**
   * Size preset for avatar variant
   * @default 48
   */
  avatarSize?: number;
  /**
   * Whether to animate the shimmer
   * @default true
   */
  animated?: boolean;
  /**
   * Animation duration in ms
   * @default 1500
   */
  duration?: number;
  /**
   * Custom container style
   */
  style?: ViewStyle;
  /**
   * Test ID for testing
   */
  testID?: string;
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 4,
  variant = 'custom',
  avatarSize = 48,
  animated = true,
  duration = 1500,
  style,
  testID,
  accessibilityLabel = 'Loading content',
}: SkeletonProps): React.ReactElement {
  const theme = useTheme();

  // Animation value
  const shimmerPosition = useSharedValue(-1);

  // Start shimmer animation
  useEffect(() => {
    if (animated) {
      shimmerPosition.value = withRepeat(
        withTiming(1, {
          duration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // Infinite repeat
        false, // Don't reverse
      );
    }
  }, [animated, duration, shimmerPosition]);

  // Calculate dimensions based on variant
  const getDimensions = (): { width: number | string; height: number; borderRadius: number } => {
    switch (variant) {
      case 'avatar':
        return {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        };
      case 'text':
        return {
          width,
          height: 14,
          borderRadius: 4,
        };
      case 'card':
        return {
          width,
          height: height || 120,
          borderRadius: 12,
        };
      default:
        return {
          width,
          height,
          borderRadius,
        };
    }
  };

  const dimensions = getDimensions();

  // Theme-aware colors
  const baseColor = theme.colors.surfaceVariant;
  const highlightColor = theme.colors.surface;

  // Animated style for shimmer effect
  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmerPosition.value, [-1, 1], [-200, 200]);

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.width as ViewStyle['width'],
          height: dimensions.height,
          borderRadius: dimensions.borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
    >
      {animated && (
        <AnimatedLinearGradient
          colors={['transparent', highlightColor, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.shimmer, { width: 200, height: '100%' }, shimmerStyle]}
        />
      )}
    </View>
  );
}

/**
 * Skeleton Group - Helper component for common skeleton patterns
 */
export interface SkeletonGroupProps {
  /**
   * Number of skeleton lines to show
   * @default 3
   */
  lines?: number;
  /**
   * Gap between lines
   * @default 12
   */
  gap?: number;
  /**
   * Whether last line should be shorter
   * @default true
   */
  lastLineShort?: boolean;
  /**
   * Custom container style
   */
  style?: ViewStyle;
}

export function SkeletonGroup({
  lines = 3,
  gap = 12,
  lastLineShort = true,
  style,
}: SkeletonGroupProps): React.ReactElement {
  return (
    <View style={[styles.group, { gap }, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={lastLineShort && index === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </View>
  );
}

/**
 * Profile Skeleton - Preset for profile loading state
 */
export function ProfileSkeleton(): React.ReactElement {
  const theme = useTheme();

  return (
    <View style={[styles.profileSkeleton, { gap: theme.spacing.md }]}>
      <View style={styles.profileCenter}>
        <Skeleton variant="avatar" avatarSize={80} />
      </View>
      <Skeleton variant="text" width="70%" height={16} style={styles.centerSkeleton} />
      <Skeleton variant="text" width="50%" height={14} style={styles.centerSkeleton} />
    </View>
  );
}

/**
 * Card Skeleton - Preset for card loading state
 */
export function CardSkeleton(): React.ReactElement {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.cardSkeleton,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
        },
      ]}
    >
      <Skeleton variant="text" width="40%" height={12} />
      <Skeleton variant="text" width="100%" height={16} />
      <Skeleton variant="text" width="80%" height={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  group: {
    flexDirection: 'column',
  },
  profileSkeleton: {
    alignItems: 'center',
  },
  profileCenter: {
    alignItems: 'center',
  },
  centerSkeleton: {
    alignSelf: 'center',
  },
  cardSkeleton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default Skeleton;
