/**
 * StreakHistoryGraph Component
 * 30-day bar chart showing daily check-in activity
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import type { DailyActivity } from '../types';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface StreakHistoryGraphProps {
  history: DailyActivity[];
  onDayPress?: (day: DailyActivity) => void;
  reducedMotion?: boolean;
  testID?: string;
}

export function StreakHistoryGraph({
  history,
  onDayPress,
  reducedMotion = false,
  testID,
}: StreakHistoryGraphProps): React.ReactElement {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation values
  const barAnimations = React.useRef(
    Array.from({ length: 30 }, () => useSharedValue(0))
  ).current;

  // Animate bars on mount
  React.useEffect(() => {
    if (!reducedMotion) {
      barAnimations.forEach((anim, index) => {
        anim.value = withTiming(1, {
          duration: 300,
        }, () => {
          // Delay for staggered effect
        });
      });
    } else {
      barAnimations.forEach((anim) => {
        anim.value = 1;
      });
    }
  }, [reducedMotion]);

  // Get last 30 days
  const last30Days = useMemo(() => {
    const days: DailyActivity[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const existingDay = history.find(
        (h) => h.date.toDateString() === date.toDateString()
      );

      days.push(
        existingDay || {
          date,
          morningCompleted: false,
          eveningCompleted: false,
        }
      );
    }

    return days;
  }, [history]);

  // Calculate trend
  const trend = useMemo(() => {
    const streak = last30Days.reduce((count, day, index) => {
      if (day.morningCompleted || day.eveningCompleted) {
        return index === 0 || count > 0 ? count + 1 : 1;
      }
      return 0;
    }, 0);

    if (streak >= 7) return { icon: '📈', text: `${streak} days strong!` };
    if (streak >= 3) return { icon: '💪', text: `${streak} day streak` };

    const missed = last30Days.filter((d) => !d.morningCompleted && !d.eveningCompleted).length;
    if (missed > 5) return { icon: '🌱', text: 'Every day is a new start' };

    return { icon: '✨', text: 'Building consistency' };
  }, [last30Days]);

  const getBarColor = (day: DailyActivity, isToday: boolean) => {
    if (isToday && !day.morningCompleted && !day.eveningCompleted) {
      return COLORS.tertiary; // Today incomplete - coral outline
    }
    if (day.morningCompleted && day.eveningCompleted) {
      return COLORS.primary; // Both done - sage green
    }
    if (day.morningCompleted || day.eveningCompleted) {
      return COLORS.secondary; // One done - amber
    }
    return isDark ? COLORS.gray700 : COLORS.surfaceVariant; // None - light gray
  };

  const handleDayPress = (day: DailyActivity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDayPress?.(day);
  };

  return (
    <View
      className="p-4 rounded-2xl"
      style={{
        backgroundColor: isDark ? COLORS.darkSurface : COLORS.surface,
      }}
      testID={testID}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text
          style={{
            fontSize: TYPOGRAPHY.headingMedium.fontSize,
            fontWeight: TYPOGRAPHY.headingMedium.fontWeight,
            color: isDark ? COLORS.white : COLORS.gray900,
          }}
        >
          30-Day Activity
        </Text>
        <View className="flex-row items-center">
          <Text className="text-lg mr-1">{trend.icon}</Text>
          <Text
            style={{
              fontSize: TYPOGRAPHY.bodyMedium.fontSize,
              color: isDark ? COLORS.gray300 : COLORS.gray600,
            }}
          >
            {trend.text}
          </Text>
        </View>
      </View>

      {/* Bar Chart */}
      <View className="flex-row justify-between items-end h-24">
        {last30Days.map((day, index) => {
          const isToday = index === 29;
          const height = day.morningCompleted && day.eveningCompleted
            ? 100
            : day.morningCompleted || day.eveningCompleted
            ? 60
            : 20;
          const barColor = getBarColor(day, isToday);

          const animatedStyle = useAnimatedStyle(() => ({
            height: `${height * barAnimations[index].value}%`,
            opacity: barAnimations[index].value,
          }));

          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleDayPress(day)}
              accessible
              accessibilityLabel={`${day.date.toLocaleDateString()}: ${
                day.morningCompleted && day.eveningCompleted
                  ? 'Both check-ins complete'
                  : day.morningCompleted
                  ? 'Morning check-in complete'
                  : day.eveningCompleted
                  ? 'Evening check-in complete'
                  : 'No check-ins'
              }`}
              accessibilityRole="button"
              style={{
                minWidth: 48,
                minHeight: 48,
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              <AnimatedView
                style={[
                  {
                    width: 4,
                    borderRadius: 2,
                    backgroundColor: barColor,
                  },
                  animatedStyle,
                ]}
              />
              {isToday && (
                <View
                  className="absolute -bottom-1 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: COLORS.tertiary }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View className="flex-row justify-center mt-4 gap-6">
        <LegendItem color={COLORS.primary} label="Both check-ins" />
        <LegendItem color={COLORS.secondary} label="One check-in" />
        <LegendItem color={isDark ? COLORS.gray700 : COLORS.surfaceVariant} label="None" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="flex-row items-center">
      <View
        className="w-3 h-3 rounded-sm mr-2"
        style={{ backgroundColor: color }}
      />
      <Text
        style={{
          fontSize: TYPOGRAPHY.labelSmall.fontSize,
          color: isDark ? COLORS.gray400 : COLORS.gray500,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default StreakHistoryGraph;
