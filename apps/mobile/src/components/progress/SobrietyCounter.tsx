/**
 * Sobriety Counter Component
 * Circular progress ring with stats - matches reference site design
 */

import React, { memo, useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

interface SobrietyCounterProps {
  days: number;
  hours?: number;
  minutes?: number;
  showDetailed?: boolean;
  className?: string;
}

// Circular progress ring component
function CircularProgress({
  progress,
  size = 180,
  strokeWidth = 12,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - Math.min(progress, 1) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#14b8a6" />
            <Stop offset="100%" stopColor="#22c55e" />
          </LinearGradient>
        </Defs>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(51, 65, 85, 0.4)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}

// Stat item component
function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  value: string | number;
  label: string;
}) {
  return (
    <View className="items-center flex-1">
      <View className="flex-row items-center gap-1 mb-1">
        <Feather name={icon} size={14} color="#64748b" />
      </View>
      <Text className="text-white text-xl font-bold">{value}</Text>
      <Text className="text-surface-500 text-xs">{label}</Text>
    </View>
  );
}

export const SobrietyCounter = memo(function SobrietyCounter({
  days,
  hours: _hours = 0,
  minutes: _minutes = 0,
  showDetailed: _showDetailed = false,
  className = '',
}: SobrietyCounterProps) {
  // Suppress unused variable warnings (props kept for API compatibility)
  void _hours;
  void _minutes;
  void _showDetailed;

  // Calculate time units
  const { weeks, months } = useMemo(() => {
    const w = Math.floor(days / 7);
    const m = Math.floor(days / 30);
    return { weeks: w, months: m };
  }, [days]);

  // Calculate progress for circular indicator (based on current milestone progress)
  const progress = useMemo(() => {
    // Progress towards next milestone
    const milestones = [1, 7, 14, 30, 60, 90, 180, 365, 730, 1095];
    const nextMilestone = milestones.find((m) => m > days) || days + 30;
    const prevMilestone = [...milestones].reverse().find((m) => m <= days) || 0;
    return (days - prevMilestone) / (nextMilestone - prevMilestone);
  }, [days]);

  // Accessibility label
  const accessibilityLabel = useMemo(() => {
    let label = `${days} ${days === 1 ? 'day' : 'days'} clean`;
    if (weeks > 0) label += `, ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    if (months > 0) label += `, approximately ${months} ${months === 1 ? 'month' : 'months'}`;
    return label;
  }, [days, weeks, months]);

  const circleSize = Math.min(screenWidth - 80, 200);

  return (
    <View
      className={`bg-navy-800/40 rounded-2xl p-4 border border-surface-700/30 ${className}`}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <Feather name="clock" size={18} color="#60a5fa" />
          <View>
            <Text className="text-white font-semibold">Clean Time Streak</Text>
            <Text className="text-surface-500 text-xs">Continuous, from your last reset</Text>
          </View>
        </View>

        {/* Streak Badge */}
        <View className="flex-row items-center gap-1 bg-success-500/20 px-3 py-1.5 rounded-full">
          <Feather name="zap" size={14} color="#4ade80" />
          <Text className="text-success-400 text-xs font-medium">Streak Intact</Text>
        </View>
      </View>

      {/* Circular Progress with Days */}
      <View className="items-center py-4">
        <View className="relative items-center justify-center">
          <CircularProgress progress={progress} size={circleSize} strokeWidth={12} />
          <View className="absolute items-center">
            <Feather name="award" size={24} color="#14b8a6" style={{ marginBottom: 4 }} />
            <Text className="text-white text-5xl font-bold">{days}</Text>
            <Text className="text-secondary-400 text-sm font-medium uppercase tracking-wider">
              Days Clean
            </Text>
          </View>
        </View>

        {/* Encouraging message */}
        <Text className="text-surface-400 text-sm text-center mt-4 px-4">
          Every day clean is a victory worth celebrating.
        </Text>
      </View>

      {/* Stats Row */}
      <View className="flex-row bg-navy-900/40 rounded-xl p-3 mt-2">
        <StatItem icon="heart" value={weeks} label="Weeks" />
        <View className="w-px bg-surface-700/30" />
        <StatItem icon="crosshair" value={`${months}`} label="Months est." />
        <View className="w-px bg-surface-700/30" />
        <StatItem icon="zap" value={days} label="Day streak" />
      </View>
    </View>
  );
});
