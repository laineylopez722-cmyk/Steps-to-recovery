/**
 * StatsRow Component
 * Horizontal row of quick stats for the home page
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouterCompat } from '../../utils/navigationHelper';
import { LegacyCard as Card } from '../ui';

interface StatItemProps {
  value: string | number;
  label: string;
  icon?: string;
  color?: string;
  onPress?: () => void;
}

function StatItem({ value, label, icon, color = 'primary', onPress }: StatItemProps) {
  const colorClasses: Record<string, string> = {
    primary: 'text-primary-600 dark:text-primary-400',
    secondary: 'text-secondary-600 dark:text-secondary-400',
    amber: 'text-amber-600 dark:text-amber-400',
    green: 'text-green-600 dark:text-green-400',
  };

  const content = (
    <Card variant="default" className="flex-1 items-center py-3">
      {icon && <Text className="text-lg mb-1">{icon}</Text>}
      <Text className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</Text>
      <Text className="text-xs text-surface-500 mt-0.5">{label}</Text>
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        className="flex-1"
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View className="flex-1">{content}</View>;
}

interface StatsRowProps {
  meetingCount: number;
  checkinStreak: number;
  averageMood: number;
  className?: string;
}

export function StatsRow({
  meetingCount,
  checkinStreak,
  averageMood,
  className = '',
}: StatsRowProps) {
  const router = useRouterCompat();

  return (
    <View className={`flex-row gap-3 ${className}`}>
      <StatItem
        value={meetingCount}
        label="meetings"
        color="primary"
        onPress={() => router.push('/meetings')}
      />
      <StatItem
        value={checkinStreak}
        label="day streak"
        color="amber"
        onPress={() => router.push('/checkin')}
      />
      <StatItem
        value={averageMood.toFixed(1)}
        label="avg mood"
        color="secondary"
        onPress={() => router.push('/report')}
      />
    </View>
  );
}
