/**
 * StreakCounter Component
 * Displays clean time with circular progress and milestone celebrations
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  AccessibilityInfo,
  useColorScheme,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Extrapolate,
  useAnimatedProps,
  withDelay,
} from 'react-native-reanimated';
import { Svg, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { COLORS, ANIMATION, DIMENSIONS, TYPOGRAPHY, SHADOWS, SPACING, MILESTONE_MESSAGES } from '../constants';
import type { StreakData, DailyActivity } from '../types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface StreakCounterProps {
  data: StreakData;
  history?: DailyActivity[];
  onPress?: () => void;
  onShowHistory?: () => void;
  reducedMotion?: boolean;
  testID?: string;
}

export function StreakCounter({
  data,
  history = [],
  onPress,
  onShowHistory,
  reducedMotion = false,
  testID,
}: StreakCounterProps): React.ReactElement {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation values
  const scale = useSharedValue(1);
  const ringProgress = useSharedValue(0);
  const pulseAnimation = useSharedValue(0);

  // Check if current days is a milestone
  const isMilestone = useMemo(() => {
    const milestones = [1, 7, 30, 60, 90, 180, 365];
    return milestones.includes(data.days);
  }, [data.days]);

  // Get milestone message if applicable
  const milestoneMessage = useMemo(() => {
    return MILESTONE_MESSAGES[data.days] || null;
  }, [data.days]);

  // Calculate progress to next milestone
  const progressToNext = useMemo(() => {
    const daysInCurrentPeriod = data.days % 30 || 30;
    return daysInCurrentPeriod / 30;
  }, [data.days]);

  // Ring animation
  React.useEffect(() => {
    if (!reducedMotion) {
      ringProgress.value = withTiming(1, { duration: ANIMATION.emphasized });

      if (isMilestone) {
        // Celebration animation sequence
        scale.value = withSequence(
          withSpring(1.1, { damping: 10, stiffness: 100 }),
          withSpring(1.0, { damping: 10, stiffness: 100 })
        );

        // Pulse animation
        pulseAnimation.value = withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 500 }),
          withDelay(200, withTiming(1, { duration: 500 })),
          withTiming(0, { duration: 500 }),
          withDelay(200, withTiming(1, { duration: 500 })),
          withTiming(0, { duration: 500 })
        );

        // Haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Announce milestone
        if (milestoneMessage) {
          AccessibilityInfo.announceForAccessibility(
            `Milestone reached! ${data.days} days clean. ${milestoneMessage}`
          );
        }
      }
    } else {
      ringProgress.value = 1;
    }
  }, [data.days, isMilestone, milestoneMessage, reducedMotion]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      pulseAnimation.value,
      [0, 1],
      [0, 0.3],
      Extrapolate.CLAMP
    ),
    transform: [
      {
        scale: interpolate(
          pulseAnimation.value,
          [0, 1],
          [1, 1.2],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  // Ring circumference
  const size = DIMENSIONS.streakCounterSize;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const ringAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - ringProgress.value * progressToNext),
  }));

  // Format last reset date
  const formattedResetDate = useMemo(() => {
    return data.lastResetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [data.lastResetDate]);

  // Accessibility label
  const accessibilityLabel = useMemo(() => {
    return `Your clean time: ${data.days} days, ${data.hours} hours, ${data.minutes} minutes. Next milestone: ${data.nextMilestone} days.`;
  }, [data]);

  const handlePress = useCallback(() => {
    if (!reducedMotion) {
      scale.value = withSequence(
        withTiming(0.95, { duration: ANIMATION.accelerated }),
        withTiming(1, { duration: ANIMATION.standard })
      );
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
    onShowHistory?.();
  }, [onPress, onShowHistory, reducedMotion, scale]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="Tap to view 30-day streak history"
      testID={testID}
    >
      <Animated.View
        style={[
          {
            backgroundColor: isDark ? COLORS.darkSurface : COLORS.surface,
            borderRadius: DIMENSIONS.cornerRadius.extraLarge,
            padding: SPACING.lg,
            ...SHADOWS.level2,
          },
          containerStyle,
        ]}
      >
        {/* Circular Counter */}
        <View className="items-center">
          <View style={{ width: size, height: size }}>
            {/* Pulse effect for milestones */}
            {isMilestone && (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: COLORS.primary,
                  },
                  pulseStyle,
                ]}
              />
            )}

            <Svg width={size} height={size}>
              {/* Background ring */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={isDark ? COLORS.gray700 : COLORS.surfaceVariant}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress ring */}
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={COLORS.primary}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animatedProps={ringAnimatedProps}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>

            {/* Center content */}
            <View
              className="absolute inset-0 items-center justify-center"
              pointerEvents="none"
            >
              <Text
                style={{
                  fontSize: TYPOGRAPHY.headingLarge.fontSize,
                  fontWeight: TYPOGRAPHY.headingLarge.fontWeight,
                  color: isDark ? COLORS.white : COLORS.gray900,
                }}
                accessibilityLabel={`${data.days} days`}
              >
                {data.days}
              </Text>
              <Text
                style={{
                  fontSize: TYPOGRAPHY.bodyMedium.fontSize,
                  color: isDark ? COLORS.gray400 : COLORS.gray500,
                }}
              >
                Days
              </Text>
            </View>
          </View>

          {/* Hours and Minutes */}
          <View className="flex-row mt-2 gap-4">
            <View className="items-center">
              <Text
                style={{
                  fontSize: TYPOGRAPHY.labelLarge.fontSize,
                  fontWeight: TYPOGRAPHY.labelLarge.fontWeight,
                  color: isDark ? COLORS.gray200 : COLORS.gray700,
                }}
              >
                {data.hours.toString().padStart(2, '0')}
              </Text>
              <Text
                style={{
                  fontSize: TYPOGRAPHY.labelSmall.fontSize,
                  color: isDark ? COLORS.gray400 : COLORS.gray500,
                }}
              >
                Hours
              </Text>
            </View>
            <View className="items-center">
              <Text
                style={{
                  fontSize: TYPOGRAPHY.labelLarge.fontSize,
                  fontWeight: TYPOGRAPHY.labelLarge.fontWeight,
                  color: isDark ? COLORS.gray200 : COLORS.gray700,
                }}
              >
                {data.minutes.toString().padStart(2, '0')}
              </Text>
              <Text
                style={{
                  fontSize: TYPOGRAPHY.labelSmall.fontSize,
                  color: isDark ? COLORS.gray400 : COLORS.gray500,
                }}
              >
                Minutes
              </Text>
            </View>
          </View>
        </View>

        {/* Context Card */}
        <View
          className="mt-4 pt-4"
          style={{
            borderTopWidth: 1,
            borderTopColor: isDark ? COLORS.gray700 : COLORS.surfaceVariant,
          }}
        >
          <View className="flex-row justify-between">
            <View>
              <Text
                style={{
                  fontSize: TYPOGRAPHY.labelSmall.fontSize,
                  color: isDark ? COLORS.gray400 : COLORS.gray500,
                }}
              >
                Last reset
              </Text>
              <Text
                style={{
                  fontSize: TYPOGRAPHY.bodyMedium.fontSize,
                  color: isDark ? COLORS.gray200 : COLORS.gray700,
                  marginTop: SPACING.xs,
                }}
              >
                {formattedResetDate}
              </Text>
            </View>
            <View className="items-end">
              <Text
                style={{
                  fontSize: TYPOGRAPHY.labelSmall.fontSize,
                  color: isDark ? COLORS.gray400 : COLORS.gray500,
                }}
              >
                Next milestone
              </Text>
              <Text
                style={{
                  fontSize: TYPOGRAPHY.bodyMedium.fontSize,
                  fontWeight: '600',
                  color: COLORS.primary,
                  marginTop: SPACING.xs,
                }}
              >
                {data.nextMilestone} days
              </Text>
            </View>
          </View>

          {/* Milestone message */}
          {milestoneMessage && (
            <View
              className="mt-3 p-3 rounded-lg"
              style={{ backgroundColor: `${COLORS.primary}15` }}
            >
              <Text
                style={{
                  fontSize: TYPOGRAPHY.bodyMedium.fontSize,
                  color: COLORS.primary,
                  textAlign: 'center',
                }}
              >
                {milestoneMessage}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default StreakCounter;
