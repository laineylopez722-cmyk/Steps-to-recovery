/**
 * Review Card
 * Display card for 10th step nightly reviews
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LegacyCard as Card } from '../ui';

interface ReviewCardProps {
  date: Date;
  hasResentful?: boolean;
  hasSelfish?: boolean;
  hasDishonest?: boolean;
  hasAfraid?: boolean;
  hasApology?: boolean;
  hasBetter?: boolean;
  hasGratitude?: boolean;
  onPress?: () => void;
}

export function ReviewCard({
  date,
  hasResentful,
  hasSelfish,
  hasDishonest,
  hasAfraid,
  hasApology,
  hasBetter,
  hasGratitude,
  onPress,
}: ReviewCardProps) {
  const answeredCount = [
    hasResentful,
    hasSelfish,
    hasDishonest,
    hasAfraid,
    hasApology,
    hasBetter,
    hasGratitude,
  ].filter(Boolean).length;

  const isToday = date.toDateString() === new Date().toDateString();
  const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();

  const getDateLabel = () => {
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Nightly review for ${getDateLabel()}, ${answeredCount} of 7 questions answered`}
      accessibilityHint="Opens review details"
    >
      <Card
        variant="default"
        className={`mb-3 ${isToday ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View
              className={`w-10 h-10 rounded-full ${
                isToday ? 'bg-green-500' : 'bg-surface-200 dark:bg-surface-700'
              } items-center justify-center`}
            >
              {isToday ? (
                <Text className="text-white">✓</Text>
              ) : (
                <Text className="text-surface-500 text-sm">{date.getDate()}</Text>
              )}
            </View>
            <View>
              <Text className="text-base font-medium text-surface-900 dark:text-surface-100">
                {getDateLabel()}
              </Text>
              <Text className="text-sm text-surface-500">{answeredCount}/7 questions answered</Text>
            </View>
          </View>
          <Text className="text-surface-400">→</Text>
        </View>

        {/* Quick indicators */}
        <View className="flex-row gap-1 mt-3">
          <View
            className={`w-2 h-2 rounded-full ${hasResentful ? 'bg-red-400' : 'bg-surface-200 dark:bg-surface-700'}`}
          />
          <View
            className={`w-2 h-2 rounded-full ${hasSelfish ? 'bg-amber-400' : 'bg-surface-200 dark:bg-surface-700'}`}
          />
          <View
            className={`w-2 h-2 rounded-full ${hasDishonest ? 'bg-orange-400' : 'bg-surface-200 dark:bg-surface-700'}`}
          />
          <View
            className={`w-2 h-2 rounded-full ${hasAfraid ? 'bg-purple-400' : 'bg-surface-200 dark:bg-surface-700'}`}
          />
          <View
            className={`w-2 h-2 rounded-full ${hasApology ? 'bg-blue-400' : 'bg-surface-200 dark:bg-surface-700'}`}
          />
          <View
            className={`w-2 h-2 rounded-full ${hasBetter ? 'bg-indigo-400' : 'bg-surface-200 dark:bg-surface-700'}`}
          />
          <View
            className={`w-2 h-2 rounded-full ${hasGratitude ? 'bg-green-400' : 'bg-surface-200 dark:bg-surface-700'}`}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
}
