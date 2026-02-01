/**
 * Custom Pull-to-Refresh Component
 * Animated refresh indicator with icon rotation and haptic feedback
 *
 * Uses react-native-reanimated for smooth 60fps animations.
 */

import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolate,
  Extrapolation,
  runOnJS,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../hooks/useTheme';
import { hapticThreshold, hapticSuccess } from '../../utils/haptics';

const PULL_THRESHOLD = 80;
const INDICATOR_SIZE = 40;

export interface PullToRefreshProps {
  /**
   * Content to wrap with pull-to-refresh
   */
  children: React.ReactNode;
  /**
   * Whether refresh is in progress
   */
  refreshing: boolean;
  /**
   * Callback when refresh is triggered
   */
  onRefresh: () => void;
  /**
   * Pull threshold to trigger refresh (px)
   * @default 80
   */
  threshold?: number;
  /**
   * Whether pull-to-refresh is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Custom indicator color
   */
  indicatorColor?: string;
  /**
   * Custom container style
   */
  style?: ViewStyle;
  /**
   * Test ID for testing
   */
  testID?: string;
}

export function PullToRefresh({
  children,
  refreshing,
  onRefresh,
  threshold = PULL_THRESHOLD,
  enabled = true,
  indicatorColor,
  style,
  testID,
}: PullToRefreshProps): React.ReactElement {
  const theme = useTheme();
  const activeColor = indicatorColor || theme.colors.primary;

  // Animation values
  const pullDistance = useSharedValue(0);
  const rotation = useSharedValue(0);
  const isRefreshing = useSharedValue(false);
  const hasTriggeredHaptic = useSharedValue(false);

  // Haptic feedback when crossing threshold
  const triggerThresholdHaptic = useCallback(() => {
    hapticThreshold();
  }, []);

  // Success haptic when refresh completes
  const triggerSuccessHaptic = useCallback(() => {
    hapticSuccess();
  }, []);

  // Handle refresh completion
  useEffect(() => {
    if (!refreshing && isRefreshing.value) {
      // Refresh completed
      cancelAnimation(rotation);
      pullDistance.value = withTiming(0, { duration: 300 });
      isRefreshing.value = false;
      triggerSuccessHaptic();
    } else if (refreshing && !isRefreshing.value) {
      // Refresh started
      isRefreshing.value = true;
      // Start spinning animation
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1, // Infinite
        false,
      );
    }
  }, [refreshing]);

  // Pan gesture for pulling
  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .onUpdate((event) => {
      if (isRefreshing.value) return;

      // Only allow pulling down
      if (event.translationY > 0) {
        // Apply resistance as pull increases
        const resistance = 1 - Math.min(event.translationY / (threshold * 3), 0.7);
        pullDistance.value = event.translationY * resistance;

        // Rotate indicator based on pull distance
        rotation.value = interpolate(
          pullDistance.value,
          [0, threshold],
          [0, 360],
          Extrapolation.CLAMP,
        );

        // Haptic when crossing threshold
        if (pullDistance.value >= threshold && !hasTriggeredHaptic.value) {
          hasTriggeredHaptic.value = true;
          runOnJS(triggerThresholdHaptic)();
        } else if (pullDistance.value < threshold) {
          hasTriggeredHaptic.value = false;
        }
      }
    })
    .onEnd(() => {
      if (isRefreshing.value) return;

      if (pullDistance.value >= threshold) {
        // Trigger refresh
        pullDistance.value = withTiming(threshold * 0.6, { duration: 200 });
        runOnJS(onRefresh)();
      } else {
        // Snap back
        pullDistance.value = withTiming(0, { duration: 200 });
        rotation.value = withTiming(0, { duration: 200 });
      }
      hasTriggeredHaptic.value = false;
    });

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pullDistance.value }],
  }));

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pullDistance.value,
      [0, threshold * 0.5, threshold],
      [0.5, 0.8, 1],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      pullDistance.value,
      [0, threshold * 0.3],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ rotate: `${rotation.value}deg` }, { scale }],
      opacity,
    };
  });

  const indicatorContainerStyle = useAnimatedStyle(() => ({
    top: pullDistance.value - INDICATOR_SIZE - 10,
  }));

  return (
    <View style={[styles.wrapper, style]} testID={testID}>
      {/* Refresh Indicator */}
      <Animated.View style={[styles.indicatorContainer, indicatorContainerStyle]}>
        <Animated.View
          style={[styles.indicator, { borderColor: activeColor }, indicatorAnimatedStyle]}
        >
          <View style={[styles.indicatorDot, { backgroundColor: activeColor }]} />
        </Animated.View>
      </Animated.View>

      {/* Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.content, containerAnimatedStyle]}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

/**
 * Refresh Indicator Spinner Component
 * Can be used standalone for loading states
 */
export function RefreshIndicator({
  size = INDICATOR_SIZE,
  color,
  spinning = false,
}: {
  size?: number;
  color?: string;
  spinning?: boolean;
}): React.ReactElement {
  const theme = useTheme();
  const activeColor = color || theme.colors.primary;
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (spinning) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  }, [spinning]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.indicator,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: activeColor,
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.indicatorDot,
          {
            width: size * 0.2,
            height: size * 0.2,
            borderRadius: size * 0.1,
            backgroundColor: activeColor,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  indicatorContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  indicator: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    borderWidth: 3,
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default PullToRefresh;
