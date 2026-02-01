/**
 * DailyReadingCard Component
 * Home page widget showing today's JFT reading preview
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouterCompat } from '../../utils/navigationHelper';
import { LegacyCard as Card } from '../ui';
import { useReading } from '../../hooks/useReading';

interface DailyReadingCardProps {
  className?: string;
}

export function DailyReadingCard({ className = '' }: DailyReadingCardProps) {
  const router = useRouterCompat();
  const { todayReading, hasReflectedToday, readingStreak, shortDate, readingPreview, isLoading } =
    useReading();

  if (isLoading || !todayReading) {
    return (
      <Card variant="default" className={className}>
        <View className="animate-pulse">
          <View className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/3 mb-3" />
          <View className="h-6 bg-surface-200 dark:bg-surface-700 rounded w-2/3 mb-3" />
          <View className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-full mb-2" />
          <View className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-4/5" />
        </View>
      </Card>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => router.push('/reading')}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Today's reading: ${todayReading.title}. Tap to read more.`}
    >
      <Card variant="default" className={className}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Text className="text-lg mr-2">📖</Text>
            <Text className="text-sm font-medium text-surface-500">Today's Reading</Text>
          </View>
          <Text className="text-sm text-surface-400">{shortDate}</Text>
        </View>

        {/* Title */}
        <Text className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
          "{todayReading.title}"
        </Text>

        {/* Preview */}
        <Text
          className="text-base text-surface-600 dark:text-surface-400 leading-6 mb-4"
          numberOfLines={3}
        >
          {readingPreview}
        </Text>

        {/* Divider */}
        <View className="h-px bg-surface-200 dark:bg-surface-700 mb-3" />

        {/* Footer */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            {hasReflectedToday ? (
              <View className="flex-row items-center">
                <Text className="text-green-600 dark:text-green-400 mr-1">✓</Text>
                <Text className="text-sm text-green-600 dark:text-green-400">Reflected</Text>
              </View>
            ) : (
              <Text className="text-sm text-surface-500">Tap to read & reflect</Text>
            )}
          </View>
          <View className="flex-row items-center">
            {readingStreak > 0 && (
              <View className="flex-row items-center bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                <Text className="text-amber-600 dark:text-amber-400 text-xs mr-1">🔥</Text>
                <Text className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  {readingStreak} day{readingStreak !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
            <Text className="text-primary-600 dark:text-primary-400 ml-2">→</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
