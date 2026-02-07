/**
 * Empty State Component
 * Friendly, encouraging empty states for various app sections
 * Phase 4: Production polish
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LegacyCard as Card } from '../ui';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'encouraging' | 'minimal';
  className?: string;
}

export const EmptyState = memo(function EmptyState({
  emoji = '📭',
  title,
  message,
  actionLabel,
  onAction,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  if (variant === 'minimal') {
    return (
      <View className={`items-center py-8 ${className}`}>
        <Text className="text-3xl mb-2">{emoji}</Text>
        <Text className="text-base text-surface-500 text-center px-6">{message}</Text>
        {onAction && actionLabel && (
          <TouchableOpacity
            onPress={onAction}
            className="mt-4 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg"
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text className="text-primary-700 dark:text-primary-300 font-medium">
              {actionLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View className={`flex-1 items-center justify-center px-6 ${className}`}>
      {/* Emoji in a circle */}
      <View className="w-20 h-20 rounded-full bg-surface-100 dark:bg-surface-800 items-center justify-center mb-6">
        <Text className="text-4xl">{emoji}</Text>
      </View>

      {/* Title */}
      <Text
        className="text-xl font-semibold text-surface-900 dark:text-surface-100 text-center mb-2"
        accessibilityRole="header"
      >
        {title}
      </Text>

      {/* Message */}
      <Text className="text-surface-500 text-center mb-6 px-4 leading-relaxed">{message}</Text>

      {/* Encouraging message for recovery context */}
      {variant === 'encouraging' && (
        <Card variant="default" className="bg-primary-50 dark:bg-primary-900/20 mb-6 w-full">
          <Text className="text-primary-700 dark:text-primary-300 text-center text-sm">
            💚 Every step forward is progress in your recovery journey.
          </Text>
        </Card>
      )}

      {/* Action button */}
      {onAction && actionLabel && (
        <TouchableOpacity
          onPress={onAction}
          className="bg-primary-600 rounded-xl px-6 py-3"
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text className="text-white font-semibold text-base">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// Predefined empty states for common scenarios
export const EMPTY_STATES = {
  journal: {
    emoji: '📝',
    title: 'Start Your Journal',
    message: 'Writing about your recovery journey can be a powerful tool for healing and growth.',
    actionLabel: 'Write First Entry',
  },
  vault: {
    emoji: '🔐',
    title: 'Your Motivation Vault',
    message:
      'Save photos, quotes, and reminders of why recovery matters to you. Access them when you need strength.',
    actionLabel: 'Add First Item',
  },
  meetings: {
    emoji: '📍',
    title: 'Track Your Meetings',
    message: 'Log your meeting attendance and reflections. Connection is key to recovery.',
    actionLabel: 'Log First Meeting',
  },
  capsules: {
    emoji: '💌',
    title: 'Write to Your Future Self',
    message:
      'Create time capsules with messages of hope. They unlock at milestones in your journey.',
    actionLabel: 'Create Time Capsule',
  },
  search: {
    emoji: '🔍',
    title: 'No Results Found',
    message: 'Try a different search term or clear filters to see all entries.',
    actionLabel: 'Clear Search',
  },
  checkins: {
    emoji: '✨',
    title: 'No Check-ins Yet',
    message: "Regular check-ins help you understand your patterns. Start with today's reflection.",
    actionLabel: 'Check In Now',
  },
  milestones: {
    emoji: '🏆',
    title: 'Your Milestones Await',
    message: 'Every day sober is an achievement. Your first milestone is just around the corner.',
  },
  scenarios: {
    emoji: '🎯',
    title: 'Practice Scenarios',
    message:
      'Prepare for challenging situations by practicing healthy responses. Build confidence in your coping skills.',
    actionLabel: 'Start Practice',
  },
} as const;
