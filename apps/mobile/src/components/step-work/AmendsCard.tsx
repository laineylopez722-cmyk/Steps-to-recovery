/**
 * Amends Card
 * Display card for 8th/9th step amends entries
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LegacyCard as Card } from '../ui';
import type { AmendsStatus, AmendsType } from '@recovery/shared';

const STATUS_CONFIG: Record<
  AmendsStatus,
  {
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  not_willing: {
    label: 'Not Yet Willing',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  willing: {
    label: 'Willing',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  planned: {
    label: 'Planned',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  made: {
    label: 'Made',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
};

const TYPE_LABELS: Record<AmendsType, string> = {
  direct: 'Direct',
  indirect: 'Indirect',
  living: 'Living',
};

interface AmendsCardProps {
  person: string;
  harm?: string;
  amendsType: AmendsType;
  status: AmendsStatus;
  notes?: string;
  madeAt?: Date;
  onPress?: () => void;
  isExpanded?: boolean;
}

export function AmendsCard({
  person,
  harm,
  amendsType,
  status,
  notes,
  madeAt,
  onPress,
  isExpanded = false,
}: AmendsCardProps) {
  const statusConfig = STATUS_CONFIG[status];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Amends entry for ${person}, status: ${statusConfig.label}, type: ${TYPE_LABELS[amendsType]}`}
      accessibilityHint={isExpanded ? 'Collapses entry details' : 'Expands entry details'}
      accessibilityState={{ expanded: isExpanded }}
    >
      <Card variant="default" className={`mb-3 ${statusConfig.bgColor}`}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
                {person}
              </Text>
              <View className="bg-surface-200 dark:bg-surface-700 px-2 py-0.5 rounded">
                <Text className={`text-xs font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>
            {!isExpanded && harm && (
              <Text className="text-sm text-surface-500 mt-1" numberOfLines={2}>
                {harm}
              </Text>
            )}
          </View>
          <Text className="text-surface-400 ml-2">{isExpanded ? '▲' : '▼'}</Text>
        </View>

        {isExpanded && (
          <View className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
            {harm && (
              <View className="mb-3">
                <Text className="text-xs font-medium text-surface-500 uppercase mb-1">
                  The Harm
                </Text>
                <Text className="text-sm text-surface-700 dark:text-surface-300">{harm}</Text>
              </View>
            )}

            <View className="mb-3">
              <Text className="text-xs font-medium text-surface-500 uppercase mb-1">
                Type of Amends
              </Text>
              <Text className="text-sm text-surface-700 dark:text-surface-300 capitalize">
                {TYPE_LABELS[amendsType]}
              </Text>
            </View>

            {notes && (
              <View className="mb-3">
                <Text className="text-xs font-medium text-surface-500 uppercase mb-1">Notes</Text>
                <Text className="text-sm text-surface-700 dark:text-surface-300">{notes}</Text>
              </View>
            )}

            {madeAt && (
              <View className="mb-3">
                <Text className="text-xs font-medium text-surface-500 uppercase mb-1">Made On</Text>
                <Text className="text-sm text-green-600">{madeAt.toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}
