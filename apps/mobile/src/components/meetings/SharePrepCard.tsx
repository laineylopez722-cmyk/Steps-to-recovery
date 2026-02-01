/**
 * SharePrepCard Component
 * Quick access card to prepare for sharing at meetings
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouterCompat } from '../../utils/navigationHelper';
import { LegacyCard as Card } from '../ui';
import { useSharePrepStore } from '@recovery/shared';

interface SharePrepCardProps {
  className?: string;
  compact?: boolean;
}

export function SharePrepCard({ className = '', compact = false }: SharePrepCardProps) {
  const router = useRouterCompat();
  const { hasContent, notes } = useSharePrepStore();

  const handlePress = () => {
    router.push('/share-prep');
  };

  // Count how many sections have content
  const filledSections = [
    notes.topic,
    notes.gratitude,
    notes.struggle,
    notes.experience,
    notes.other,
  ].filter((n) => n.trim()).length;

  if (compact) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        className={`bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 flex-row items-center ${className}`}
        accessibilityRole="button"
        accessibilityLabel="Prepare to share at a meeting"
      >
        <Text className="text-lg mr-2">✍️</Text>
        <View className="flex-1">
          <Text className="font-medium text-surface-900 dark:text-surface-100">
            Prepare to Share
          </Text>
          {hasContent() && (
            <Text className="text-xs text-surface-500">
              {filledSections} section{filledSections !== 1 ? 's' : ''} ready
            </Text>
          )}
        </View>
        {hasContent() && <View className="w-2 h-2 rounded-full bg-green-500" />}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card variant="default" className={className}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 items-center justify-center mr-3">
              <Text className="text-xl">✍️</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-surface-900 dark:text-surface-100">
                Prepare to Share
              </Text>
              <Text className="text-sm text-surface-500">
                {hasContent()
                  ? `${filledSections} section${filledSections !== 1 ? 's' : ''} ready`
                  : 'Jot down notes for your share'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            {hasContent() && <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />}
            <Text className="text-primary-600">→</Text>
          </View>
        </View>

        {/* Preview of content if exists */}
        {hasContent() && notes.topic.trim() && (
          <View className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
            <Text className="text-xs text-surface-500 mb-1">Topic:</Text>
            <Text className="text-sm text-surface-700 dark:text-surface-300" numberOfLines={2}>
              {notes.topic.trim()}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}
