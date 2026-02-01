/**
 * Keytag Wall Component
 * Displays NA keytags in a visual grid
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LegacyCard as Card } from '../ui';
import type { KeytagWithStatus } from '@recovery/shared';

interface KeytagWallProps {
  keytags: KeytagWithStatus[];
  onKeytagPress?: (keytag: KeytagWithStatus) => void;
  className?: string;
}

export const KeytagWall = memo(function KeytagWall({
  keytags,
  onKeytagPress,
  className = '',
}: KeytagWallProps) {
  const earnedCount = keytags.filter((k) => k.isEarned).length;

  return (
    <Card variant="default" className={className}>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
          Keytags
        </Text>
        <Text className="text-sm text-surface-500">
          {earnedCount} of {keytags.length}
        </Text>
      </View>

      <View className="flex-row flex-wrap justify-center gap-3">
        {keytags.map((keytag) => (
          <KeytagItem key={keytag.id} keytag={keytag} onPress={() => onKeytagPress?.(keytag)} />
        ))}
      </View>
    </Card>
  );
});

interface KeytagItemProps {
  keytag: KeytagWithStatus;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const KeytagItem = memo(function KeytagItem({
  keytag,
  onPress,
  size = 'medium',
}: KeytagItemProps) {
  const { hexColor, title, days, isEarned, progress } = keytag;

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-20 h-20',
  };

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  // Special handling for white keytag visibility
  const isWhite = keytag.color === 'white';
  const borderStyle = isWhite && isEarned ? { borderWidth: 2, borderColor: '#E5E7EB' } : undefined;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="items-center">
      {/* Keytag circle */}
      <View
        className={`${sizeClasses[size]} rounded-full items-center justify-center ${
          !isEarned ? 'opacity-30' : ''
        }`}
        style={[{ backgroundColor: isEarned ? hexColor : '#9CA3AF' }, borderStyle]}
      >
        {/* Keytag hole */}
        <View className="absolute top-1 w-2 h-2 rounded-full bg-surface-100 dark:bg-surface-800" />

        {/* Days text */}
        <Text
          className={`font-bold ${textSizes[size]} ${
            isWhite || keytag.color === 'yellow' ? 'text-surface-800' : 'text-white'
          }`}
        >
          {days === 0 ? 'JFT' : formatDays(days)}
        </Text>
      </View>

      {/* Label */}
      <Text
        className={`mt-1 text-center ${textSizes[size]} ${
          isEarned
            ? 'text-surface-700 dark:text-surface-300'
            : 'text-surface-400 dark:text-surface-500'
        }`}
        numberOfLines={1}
      >
        {title}
      </Text>

      {/* Progress indicator for next keytag */}
      {!isEarned && progress !== undefined && progress > 0 && size !== 'small' && (
        <View className="w-full mt-1">
          <View className="h-1 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
});

/**
 * Featured keytag display for home screen
 */
export const FeaturedKeytag = memo(function FeaturedKeytag({
  current,
  next,
  onPress,
}: {
  current: KeytagWithStatus | null;
  next: KeytagWithStatus | null;
  onPress?: () => void;
}) {
  if (!current) return null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="elevated" className="items-center py-4">
        <Text className="text-sm text-surface-500 mb-2">Current Keytag</Text>

        <KeytagItem keytag={current} size="large" />

        {next && (
          <View className="mt-4 items-center">
            <Text className="text-xs text-surface-400">
              Next: {next.title} in {next.daysUntil} days
            </Text>
            <View className="w-32 h-1 bg-surface-200 dark:bg-surface-700 rounded-full mt-2 overflow-hidden">
              <View
                className="h-full bg-secondary-500 rounded-full"
                style={{ width: next.progress ? `${next.progress}%` : 0 }}
              />
            </View>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
});

function formatDays(days: number): string {
  if (days >= 730) return `${Math.floor(days / 365)}Y`;
  if (days >= 365) return '1Y';
  if (days >= 30) return `${Math.floor(days / 30)}M`;
  return `${days}`;
}
