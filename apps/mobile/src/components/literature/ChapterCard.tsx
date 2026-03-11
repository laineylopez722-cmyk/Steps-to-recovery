/**
 * ChapterCard Component
 * Displays a book chapter with completion status and notes indicator
 * Memoized for FlatList performance
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Completion status with checkmark
 * - Notes indicator
 * - Full accessibility support
 */

import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GlassCard } from '../../design-system/components/GlassCard';
import type { Chapter } from '@recovery/shared';
import { impactAsync, ImpactFeedbackStyle } from '@/platform/haptics';
import { ds } from '../../design-system/tokens/ds';

interface ChapterCardProps {
  chapter: Chapter;
  isCompleted: boolean;
  hasNotes: boolean;
  onPress: () => void;
  enteringDelay?: number;
}

function ChapterCardComponent({
  chapter,
  isCompleted,
  hasNotes,
  onPress,
  enteringDelay = 0,
}: ChapterCardProps) {
  const handlePress = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  }, [onPress]);

  const accessibilityLabel = `Chapter ${chapter.number}: ${chapter.title}${isCompleted ? ', completed' : ''}${hasNotes ? ', notes saved' : ''}`;

  return (
    <Animated.View entering={FadeIn.delay(enteringDelay * 30)}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Opens chapter content"
      >
        <GlassCard
          gradient={isCompleted ? 'elevated' : 'card'}
          style={[styles.card, isCompleted && styles.completedCard]}
        >
          <View style={styles.container}>
            {/* Chapter Number/Check */}
            <View
              style={[
                styles.numberContainer,
                isCompleted ? styles.numberContainerCompleted : styles.numberContainerDefault,
              ]}
            >
              {isCompleted ? (
                <Feather name="check" size={20} color={ds.semantic.text.onDark} />
              ) : (
                <Text style={styles.numberText}>{chapter.number}</Text>
              )}
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={[styles.chapterLabel, isCompleted && styles.chapterLabelCompleted]}>
                Chapter {chapter.number}
              </Text>
              <Text style={[styles.title, isCompleted && styles.titleCompleted]} numberOfLines={2}>
                {chapter.title}
              </Text>
              {hasNotes && (
                <View style={styles.notesRow}>
                  <Feather name="edit-3" size={12} color={ds.colors.textSecondary} />
                  <Text style={styles.notesText}>Notes saved</Text>
                </View>
              )}
            </View>

            {/* Arrow */}
            <Feather name="chevron-right" size={20} color={ds.colors.textSecondary} />
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

export const ChapterCard = memo(ChapterCardComponent);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
  },
  completedCard: {
    borderLeftWidth: 4,
    borderLeftColor: ds.colors.success,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  numberContainerDefault: {
    backgroundColor: ds.colors.bgTertiary,
  },
  numberContainerCompleted: {
    backgroundColor: ds.colors.success,
  },
  numberText: {
    fontSize: 16,
    fontWeight: '600',
    color: ds.colors.textTertiary,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  chapterLabel: {
    fontSize: 13,
    color: ds.colors.textSecondary,
    marginBottom: 2,
  },
  chapterLabelCompleted: {
    color: ds.colors.success,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: ds.semantic.text.onDark,
  },
  titleCompleted: {
    color: ds.colors.success,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  notesText: {
    fontSize: 12,
    color: ds.colors.textSecondary,
  },
});

