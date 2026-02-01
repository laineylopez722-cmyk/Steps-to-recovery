/**
 * Milestone Card Component
 * Display milestone achievement or upcoming milestone
 * Phase 4: Optimized with React.memo
 */

import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { LegacyCard as Card } from '../ui';
import type { TimeMilestone } from '@recovery/shared';

interface MilestoneCardProps {
  milestone: TimeMilestone;
  isAchieved?: boolean;
  daysUntil?: number;
  progress?: number;
  className?: string;
}

export const MilestoneCard = memo(function MilestoneCard({
  milestone,
  isAchieved = false,
  daysUntil,
  progress = 0,
  className = '',
}: MilestoneCardProps) {
  return (
    <Card
      variant={isAchieved ? 'elevated' : 'outlined'}
      className={`${className} ${isAchieved ? 'border-l-4 border-l-secondary-500' : ''}`}
    >
      <View className="flex-row items-center gap-3">
        {/* Emoji */}
        <View className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-700 items-center justify-center">
          <Text className="text-2xl">{milestone.emoji}</Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            {milestone.title}
          </Text>

          {isAchieved ? (
            <Text className="text-sm text-secondary-600 dark:text-secondary-400">✓ Achieved!</Text>
          ) : daysUntil !== undefined ? (
            <Text className="text-sm text-surface-500">
              {daysUntil} {daysUntil === 1 ? 'day' : 'days'} to go
            </Text>
          ) : null}
        </View>
      </View>

      {/* Progress bar for upcoming milestones */}
      {!isAchieved && progress > 0 && (
        <View className="mt-3">
          <View className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </View>
          <Text className="text-xs text-surface-500 mt-1 text-right">{progress}% complete</Text>
        </View>
      )}

      {/* Message */}
      <Text className="text-sm text-surface-600 dark:text-surface-400 mt-2">
        {milestone.message}
      </Text>
    </Card>
  );
});
