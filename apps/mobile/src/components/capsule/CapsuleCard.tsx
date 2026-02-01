/**
 * CapsuleCard Component
 * Displays a time capsule with status (locked, ready, opened)
 * Memoized for SectionList performance
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LegacyCard as Card } from '../ui';
import type { TimeCapsule } from '@recovery/shared';

interface CapsuleCardProps {
  capsule: TimeCapsule;
  onPress: () => void;
}

function CapsuleCardComponent({ capsule, onPress }: CapsuleCardProps) {
  const now = new Date();
  const isReady = capsule.unlockDate <= now;
  const daysUntilUnlock = Math.ceil(
    (capsule.unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card
        variant={capsule.isUnlocked ? 'default' : 'outlined'}
        className={`mb-3 ${
          isReady && !capsule.isUnlocked ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : ''
        }`}
      >
        <View className="flex-row items-start gap-3">
          {/* Icon */}
          <View
            className={`w-12 h-12 rounded-full items-center justify-center ${
              capsule.isUnlocked
                ? 'bg-green-100 dark:bg-green-900/30'
                : isReady
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-surface-100 dark:bg-surface-800'
            }`}
          >
            <Text className="text-2xl">{capsule.isUnlocked ? '📖' : isReady ? '✨' : '🔐'}</Text>
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
              {capsule.title}
            </Text>

            {capsule.isUnlocked ? (
              <Text className="text-sm text-green-600 dark:text-green-400">
                Opened{' '}
                {capsule.unlockedAt?.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            ) : isReady ? (
              <Text className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                Ready to open! ✨
              </Text>
            ) : (
              <Text className="text-sm text-surface-500">
                Unlocks in {daysUntilUnlock} day{daysUntilUnlock !== 1 ? 's' : ''}
              </Text>
            )}

            <Text className="text-xs text-surface-400 mt-1">
              Created{' '}
              {capsule.createdAt.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>

          {/* Status indicator */}
          <View className="items-end">
            {!capsule.isUnlocked && !isReady && (
              <Text className="text-xs text-surface-400">
                {capsule.unlockDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export const CapsuleCard = memo(CapsuleCardComponent);
