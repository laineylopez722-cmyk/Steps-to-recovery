/**
 * Loading State Component
 * Consistent loading indicators across the app
 * BMAD Upgrade: Shimmer animations, staggered appearance, smooth transitions
 */

import React, { memo, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MotionTransitions, motionDuration, motionShimmer } from '@/design-system/tokens/motion';

// Constants
const PRIMARY_COLOR = '#3B82F6';
const STAGGER_DELAY = 100;

// Types
interface LoadingStateProps {
  message?: string;
  variant?: 'default' | 'fullscreen' | 'inline';
  size?: 'small' | 'large';
  className?: string;
}

interface SkeletonCardProps {
  lines?: number;
  className?: string;
  delay?: number;
}

interface SkeletonListProps {
  count?: number;
  lines?: number;
}

// Shimmer animation hook
function useShimmerAnimation(delay: number = 0) {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    // Start animation after delay
    const timer = setTimeout(() => {
      translateX.value = withRepeat(
        withTiming(1, {
          duration: motionShimmer.duration,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateXValue = interpolate(
      translateX.value,
      [-1, 1],
      [motionShimmer.initialX, motionShimmer.travelX],
      'clamp',
    );

    return {
      transform: [{ translateX: translateXValue }],
    };
  });

  return animatedStyle;
}

// Shimmer skeleton bar component
const ShimmerBar = memo(function ShimmerBar({
  width,
  height,
  className = '',
  delay = 0,
}: {
  width: string | number;
  height: number;
  className?: string;
  delay?: number;
}) {
  const shimmerStyle = useShimmerAnimation(delay);
  const widthClassName = typeof width === 'string' ? width : '';
  const widthStyle = typeof width === 'number' ? { width } : {};

  return (
    <Animated.View
      entering={MotionTransitions.skeletonEnter(Math.floor(delay / STAGGER_DELAY))}
      className={`bg-surface-200 dark:bg-surface-700 rounded overflow-hidden ${widthClassName} ${className}`}
      style={[{ height }, widthStyle]}
    >
      <Animated.View
        style={[
          shimmerStyle,
          {
            position: 'absolute',
            width: '100%',
            height: '100%',
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
    </Animated.View>
  );
});

// Main LoadingState component
export const LoadingState = memo(function LoadingState({
  message,
  variant = 'default',
  size = 'large',
  className = '',
}: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <Animated.View
        entering={MotionTransitions.fade()}
        className={`flex-row items-center justify-center py-4 ${className}`}
      >
        <ActivityIndicator size={size} color={PRIMARY_COLOR} />
        {message && <Text className="text-surface-500 ml-3 text-sm">{message}</Text>}
      </Animated.View>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <Animated.View
        entering={MotionTransitions.fade()}
        className={`flex-1 items-center justify-center bg-surface-50 dark:bg-surface-900 ${className}`}
      >
        <Animated.View
          entering={MotionTransitions.cardEnter()}
          className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center mb-4"
        >
          <ActivityIndicator size={size} color={PRIMARY_COLOR} />
        </Animated.View>
        {message && (
          <Animated.Text
            entering={MotionTransitions.fadeDelayed(motionDuration.fast)}
            className="text-surface-600 dark:text-surface-400 text-base"
          >
            {message}
          </Animated.Text>
        )}
      </Animated.View>
    );
  }

  // Default variant
  return (
    <Animated.View
      entering={MotionTransitions.fade()}
      className={`items-center justify-center py-12 ${className}`}
    >
      <ActivityIndicator size={size} color={PRIMARY_COLOR} />
      {message && (
        <Animated.Text
          entering={MotionTransitions.fadeDelayed(motionDuration.fast)}
          className="text-surface-500 mt-4 text-center px-6"
        >
          {message}
        </Animated.Text>
      )}
    </Animated.View>
  );
});

// Skeleton loading component for list items
export const SkeletonCard = memo(function SkeletonCard({
  lines = 3,
  className = '',
  delay = 0,
}: SkeletonCardProps) {
  return (
    <Animated.View
      entering={MotionTransitions.skeletonEnter(Math.floor(delay / STAGGER_DELAY))}
      className={`bg-white dark:bg-surface-800 rounded-xl p-4 mb-3 ${className}`}
      accessibilityLabel="Loading"
    >
      {/* Header skeleton */}
      <View className="flex-row items-center mb-3">
        <ShimmerBar width={40} height={40} className="rounded-full" delay={delay} />
        <View className="flex-1 ml-3">
          <ShimmerBar width="w-24" height={16} className="mb-1" delay={delay + STAGGER_DELAY} />
          <ShimmerBar width="w-16" height={12} delay={delay + STAGGER_DELAY * 2} />
        </View>
      </View>

      {/* Content skeleton lines */}
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerBar
          key={i}
          width={i === lines - 1 ? 'w-3/4' : 'w-full'}
          height={12}
          className="mb-2"
          delay={delay + STAGGER_DELAY * (3 + i)}
        />
      ))}
    </Animated.View>
  );
});

// Multiple skeleton cards with staggered appearance
export const SkeletonList = memo(function SkeletonList({
  count = 3,
  lines = 3,
}: SkeletonListProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} delay={i * STAGGER_DELAY} />
      ))}
    </View>
  );
});
