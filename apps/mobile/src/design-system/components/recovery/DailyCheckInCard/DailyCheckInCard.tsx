/**
 * DailyCheckInCard Component
 * Two-section layout for morning and evening check-ins
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, AccessibilityInfo, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from '@/platform/haptics';
import { Sun, Moon, Check, Circle } from 'lucide-react-native';
import { COLORS, ANIMATION, DIMENSIONS, TYPOGRAPHY, SHADOWS, SPACING } from '../constants';
import type { CheckInData, CheckInStatus } from '../types';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface DailyCheckInCardProps {
  date: Date;
  checkInData: CheckInData;
  onMorningPress?: () => void;
  onEveningPress?: () => void;
  onCompletePress?: () => void;
  reducedMotion?: boolean;
  testID?: string;
}

export function DailyCheckInCard({
  date,
  checkInData,
  onMorningPress,
  onEveningPress,
  onCompletePress,
  reducedMotion = false,
  testID,
}: DailyCheckInCardProps): React.ReactElement {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation values
  const scale = useSharedValue(1);
  const checkmarkScale = useSharedValue(0);
  const completionAnimation = useSharedValue(0);

  // Determine overall status
  const status: CheckInStatus = useMemo(() => {
    const morningDone = checkInData.morning?.completed ?? false;
    const eveningDone = checkInData.evening?.completed ?? false;

    if (morningDone && eveningDone) return 'complete';
    if (morningDone) return 'morning-only';
    if (eveningDone) return 'evening-only';
    return 'incomplete';
  }, [checkInData]);

  const isComplete = status === 'complete';
  const _hasAnyCompleted = status !== 'incomplete';

  // Celebration animation when completed
  React.useEffect(() => {
    if (isComplete && !reducedMotion) {
      completionAnimation.value = withSequence(
        withTiming(1, { duration: 250 }),
        withTiming(0, { duration: 200 }),
      );
      checkmarkScale.value = withSpring(1, { damping: 12, stiffness: 100 });

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Announce completion
      AccessibilityInfo.announceForAccessibility(
        'Daily check-in complete! Great job taking care of yourself today.',
      );
    }
  }, [isComplete, reducedMotion]);

  // Animated styles
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
    opacity: checkmarkScale.value,
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    backgroundColor: `${COLORS.success}20`,
    opacity: interpolate(completionAnimation.value, [0, 1], [0, 1], Extrapolate.CLAMP),
  }));

  // Format date
  const formattedDate = useMemo(() => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [date]);

  // Get section colors based on status
  const getSectionStyle = (isCompleted: boolean, isMorning: boolean) => {
    const baseBg = isDark ? COLORS.darkSurfaceVariant : COLORS.surface;
    const completedBg = isMorning ? `${COLORS.primary}15` : `${COLORS.secondary}15`;
    const borderColor = isDark ? COLORS.gray700 : COLORS.surfaceVariant;

    return {
      backgroundColor: isCompleted ? completedBg : baseBg,
      borderColor: isCompleted ? (isMorning ? COLORS.primary : COLORS.secondary) : borderColor,
    };
  };

  const handlePress = useCallback(
    (type: 'morning' | 'evening') => {
      if (!reducedMotion) {
        scale.value = withSequence(
          withTiming(0.98, { duration: ANIMATION.accelerated }),
          withTiming(1, { duration: ANIMATION.standard }),
        );
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (type === 'morning') {
        onMorningPress?.();
      } else {
        onEveningPress?.();
      }
    },
    [onMorningPress, onEveningPress, reducedMotion, scale],
  );

  // Accessibility label
  const accessibilityLabel = useMemo(() => {
    const morningStatus = checkInData.morning?.completed ? 'complete' : 'not started';
    const eveningStatus = checkInData.evening?.completed ? 'complete' : 'not started';
    return `Daily check-in for ${formattedDate}. Morning: ${morningStatus}. Evening: ${eveningStatus}.`;
  }, [checkInData, formattedDate]);

  return (
    <AnimatedView
      style={[
        {
          backgroundColor: isDark ? COLORS.darkSurface : COLORS.surface,
          borderRadius: DIMENSIONS.cornerRadius.large,
          height: DIMENSIONS.dailyCheckInHeight,
          ...SHADOWS.level1,
          overflow: 'hidden',
        },
        cardStyle,
      ]}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="Tap to complete your check-in"
      testID={testID}
    >
      {/* Completion highlight overlay */}
      <AnimatedView
        style={[
          {
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          },
          highlightStyle,
        ]}
        pointerEvents="none"
      />

      {/* Header */}
      <View
        className="flex-row justify-between items-center px-4 py-3"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: isDark ? COLORS.gray700 : COLORS.surfaceVariant,
        }}
      >
        <Text
          style={{
            fontSize: TYPOGRAPHY.labelLarge.fontSize,
            fontWeight: TYPOGRAPHY.labelLarge.fontWeight,
            color: isDark ? COLORS.white : COLORS.gray900,
          }}
        >
          {formattedDate}
        </Text>

        {/* Status badge */}
        {isComplete ? (
          <AnimatedView
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: `${COLORS.success}20`,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.xs,
                borderRadius: 16,
              },
              checkmarkStyle,
            ]}
          >
            <Check size={14} color={COLORS.success} />
            <Text
              style={{
                fontSize: TYPOGRAPHY.labelSmall.fontSize,
                fontWeight: TYPOGRAPHY.labelSmall.fontWeight,
                color: COLORS.success,
                marginLeft: SPACING.xs,
              }}
            >
              Complete
            </Text>
          </AnimatedView>
        ) : (
          <TouchableOpacity
            onPress={onCompletePress}
            style={{
              backgroundColor: `${COLORS.primary}15`,
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.xs,
              borderRadius: 16,
            }}
          >
            <Text
              style={{
                fontSize: TYPOGRAPHY.labelSmall.fontSize,
                fontWeight: TYPOGRAPHY.labelSmall.fontWeight,
                color: COLORS.primary,
              }}
            >
              Complete today
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Two-section layout */}
      <View className="flex-1 flex-row">
        {/* Morning Section */}
        <TouchableOpacity
          onPress={() => handlePress('morning')}
          className="flex-1 p-3"
          style={{
            ...getSectionStyle(checkInData.morning?.completed ?? false, true),
            borderRightWidth: 1,
            borderRightColor: isDark ? COLORS.gray700 : COLORS.surfaceVariant,
          }}
          accessibilityLabel="Morning check-in"
          accessibilityRole="button"
          accessibilityState={{ checked: checkInData.morning?.completed }}
        >
          <View className="flex-row items-center mb-2">
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-2"
              style={{
                backgroundColor: checkInData.morning?.completed
                  ? COLORS.primary
                  : isDark
                    ? COLORS.gray700
                    : COLORS.surfaceVariant,
              }}
            >
              <Sun
                size={16}
                color={
                  checkInData.morning?.completed
                    ? COLORS.white
                    : isDark
                      ? COLORS.gray400
                      : COLORS.gray500
                }
              />
            </View>
            <Text
              style={{
                fontSize: TYPOGRAPHY.labelLarge.fontSize,
                fontWeight: TYPOGRAPHY.labelLarge.fontWeight,
                color: isDark ? COLORS.white : COLORS.gray900,
              }}
            >
              Morning
            </Text>
          </View>

          {/* Morning content */}
          <View className="flex-1">
            {checkInData.morning?.completed ? (
              <>
                <Text
                  style={{
                    fontSize: TYPOGRAPHY.bodyMedium.fontSize,
                    color: isDark ? COLORS.gray300 : COLORS.gray700,
                    marginBottom: SPACING.xs,
                  }}
                  numberOfLines={1}
                >
                  {checkInData.morning.intention || 'Intention set ✓'}
                </Text>
                <Text
                  style={{
                    fontSize: TYPOGRAPHY.labelSmall.fontSize,
                    color: isDark ? COLORS.gray400 : COLORS.gray500,
                  }}
                >
                  {checkInData.morning.time}
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: TYPOGRAPHY.bodyMedium.fontSize,
                    color: isDark ? COLORS.gray400 : COLORS.gray500,
                    marginBottom: SPACING.xs,
                  }}
                >
                  Set your intention
                </Text>
                <View className="flex-row items-center">
                  <Circle size={8} color={isDark ? COLORS.gray600 : COLORS.gray300} />
                  <Text
                    style={{
                      fontSize: TYPOGRAPHY.labelSmall.fontSize,
                      color: isDark ? COLORS.gray400 : COLORS.gray500,
                      marginLeft: SPACING.xs,
                    }}
                  >
                    Tap to start
                  </Text>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Evening Section */}
        <TouchableOpacity
          onPress={() => handlePress('evening')}
          className="flex-1 p-3"
          style={getSectionStyle(checkInData.evening?.completed ?? false, false)}
          accessibilityLabel="Evening check-in"
          accessibilityRole="button"
          accessibilityState={{ checked: checkInData.evening?.completed }}
        >
          <View className="flex-row items-center mb-2">
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-2"
              style={{
                backgroundColor: checkInData.evening?.completed
                  ? COLORS.secondary
                  : isDark
                    ? COLORS.gray700
                    : COLORS.surfaceVariant,
              }}
            >
              <Moon
                size={16}
                color={
                  checkInData.evening?.completed
                    ? COLORS.white
                    : isDark
                      ? COLORS.gray400
                      : COLORS.gray500
                }
              />
            </View>
            <Text
              style={{
                fontSize: TYPOGRAPHY.labelLarge.fontSize,
                fontWeight: TYPOGRAPHY.labelLarge.fontWeight,
                color: isDark ? COLORS.white : COLORS.gray900,
              }}
            >
              Evening
            </Text>
          </View>

          {/* Evening content */}
          <View className="flex-1">
            {checkInData.evening?.completed ? (
              <>
                <Text
                  style={{
                    fontSize: TYPOGRAPHY.bodyMedium.fontSize,
                    color: isDark ? COLORS.gray300 : COLORS.gray700,
                    marginBottom: SPACING.xs,
                  }}
                  numberOfLines={1}
                >
                  {checkInData.evening.reflection || 'Day reflected ✓'}
                </Text>
                <Text
                  style={{
                    fontSize: TYPOGRAPHY.labelSmall.fontSize,
                    color: isDark ? COLORS.gray400 : COLORS.gray500,
                  }}
                >
                  {checkInData.evening.time}
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: TYPOGRAPHY.bodyMedium.fontSize,
                    color: isDark ? COLORS.gray400 : COLORS.gray500,
                    marginBottom: SPACING.xs,
                  }}
                >
                  Reflect on today
                </Text>
                {/* Craving intensity preview */}
                {checkInData.evening?.cravingIntensity !== undefined && (
                  <View className="mt-1">
                    <View className="flex-row items-center mb-1">
                      <Text
                        style={{
                          fontSize: TYPOGRAPHY.labelSmall.fontSize,
                          color: isDark ? COLORS.gray400 : COLORS.gray500,
                        }}
                      >
                        Craving: {checkInData.evening.cravingIntensity}/10
                      </Text>
                    </View>
                    <View
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{
                        backgroundColor: isDark ? COLORS.gray700 : COLORS.surfaceVariant,
                      }}
                    >
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${(checkInData.evening.cravingIntensity / 10) * 100}%`,
                          backgroundColor:
                            checkInData.evening.cravingIntensity > 7
                              ? COLORS.error
                              : checkInData.evening.cravingIntensity > 4
                                ? COLORS.warning
                                : COLORS.success,
                        }}
                      />
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </AnimatedView>
  );
}

export default DailyCheckInCard;

