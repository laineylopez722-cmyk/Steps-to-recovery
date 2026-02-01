/**
 * Inventory Entry Card
 * Display card for 4th step inventory entries
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LegacyCard as Card } from '../ui';
import type { FourthStepType } from '@recovery/shared';

const TYPE_COLORS: Record<FourthStepType, { bg: string; text: string }> = {
  resentment: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
  },
  fear: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
  },
  sex_conduct: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
  },
};

const TYPE_LABELS: Record<FourthStepType, string> = {
  resentment: 'Resentment',
  fear: 'Fear',
  sex_conduct: 'Relationship',
};

interface InventoryEntryCardProps {
  type: FourthStepType;
  who: string;
  cause?: string;
  affects?: string[];
  myPart?: string;
  onPress?: () => void;
  isExpanded?: boolean;
}

export function InventoryEntryCard({
  type,
  who,
  cause,
  affects = [],
  myPart,
  onPress,
  isExpanded = false,
}: InventoryEntryCardProps) {
  const colors = TYPE_COLORS[type];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${TYPE_LABELS[type]} entry for ${who}${cause ? `, ${cause.slice(0, 50)}` : ''}`}
      accessibilityHint={isExpanded ? 'Collapses entry details' : 'Expands entry details'}
      accessibilityState={{ expanded: isExpanded }}
    >
      <Card variant="default" className={`mb-3 ${colors.bg}`}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <View className={`px-2 py-0.5 rounded ${colors.bg}`}>
                <Text className={`text-xs font-medium ${colors.text}`}>{TYPE_LABELS[type]}</Text>
              </View>
            </View>
            <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
              {who}
            </Text>
            {!isExpanded && cause && (
              <Text className="text-sm text-surface-500 mt-1" numberOfLines={2}>
                {cause}
              </Text>
            )}
          </View>
          <Text className="text-surface-400 ml-2">{isExpanded ? '▲' : '▼'}</Text>
        </View>

        {isExpanded && (
          <View className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
            {cause && (
              <View className="mb-3">
                <Text className="text-xs font-medium text-surface-500 uppercase mb-1">
                  The Cause
                </Text>
                <Text className="text-sm text-surface-700 dark:text-surface-300">{cause}</Text>
              </View>
            )}

            {affects.length > 0 && (
              <View className="mb-3">
                <Text className="text-xs font-medium text-surface-500 uppercase mb-1">
                  Affects My...
                </Text>
                <View className="flex-row flex-wrap gap-1">
                  {affects.map((affect) => (
                    <View
                      key={affect}
                      className="bg-surface-200 dark:bg-surface-700 px-2 py-1 rounded"
                    >
                      <Text className="text-xs text-surface-700 dark:text-surface-300">
                        {affect}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {myPart && (
              <View className="mb-3">
                <Text className="text-xs font-medium text-surface-500 uppercase mb-1">My Part</Text>
                <Text className="text-sm text-surface-700 dark:text-surface-300">{myPart}</Text>
              </View>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}
