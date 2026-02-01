/**
 * ChapterCard Component
 * Displays a book chapter with completion status and notes indicator
 * Memoized for FlatList performance
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LegacyCard as Card } from '../ui';
import type { Chapter } from '@recovery/shared';

interface ChapterCardProps {
  chapter: Chapter;
  isCompleted: boolean;
  hasNotes: boolean;
  onPress: () => void;
}

function ChapterCardComponent({ chapter, isCompleted, hasNotes, onPress }: ChapterCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card
        variant={isCompleted ? 'elevated' : 'default'}
        className={`mb-3 ${isCompleted ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
      >
        <View className="flex-row items-center gap-3">
          <View
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isCompleted ? 'bg-green-500' : 'bg-surface-200 dark:bg-surface-700'
            }`}
          >
            {isCompleted ? (
              <Text className="text-white text-lg">✓</Text>
            ) : (
              <Text className="text-surface-500 text-sm font-medium">{chapter.number}</Text>
            )}
          </View>
          <View className="flex-1">
            <Text
              className={`text-base font-medium ${
                isCompleted
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-surface-900 dark:text-surface-100'
              }`}
            >
              Chapter {chapter.number}
            </Text>
            <Text
              className={`text-sm ${
                isCompleted ? 'text-green-700 dark:text-green-300' : 'text-surface-500'
              }`}
            >
              {chapter.title}
            </Text>
            {hasNotes && (
              <View className="flex-row items-center gap-1 mt-1">
                <Text className="text-xs">📝</Text>
                <Text className="text-xs text-surface-400">Notes saved</Text>
              </View>
            )}
          </View>
          <Text className="text-surface-400">→</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export const ChapterCard = memo(ChapterCardComponent);
