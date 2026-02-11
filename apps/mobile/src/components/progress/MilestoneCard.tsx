/**
 * Milestone Card Component
 * Display milestone achievement or upcoming milestone
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Gradient styling for achieved milestones
 * - Progress bar for upcoming milestones
 * - Achievement date display
 * - Full accessibility support
 * - Celebration animation trigger
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GlassCard } from '../../design-system/components/GlassCard';
import type { TimeMilestone } from '@recovery/shared';
import { ds } from '../../design-system/tokens/ds';

interface MilestoneCardProps {
  milestone: TimeMilestone;
  isAchieved?: boolean;
  daysUntil?: number;
  progress?: number;
  achievedAt?: Date;
  enteringDelay?: number;
}

export const MilestoneCard = memo(function MilestoneCard({
  milestone,
  isAchieved = false,
  daysUntil,
  progress = 0,
  achievedAt,
  enteringDelay = 0,
}: MilestoneCardProps) {
  // Build accessibility label
  const accessibilityLabel = isAchieved
    ? `${milestone.title}, achieved${achievedAt ? ` on ${achievedAt.toLocaleDateString()}` : ''}`
    : `${milestone.title}, ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'} to go, ${Math.round(progress)}% complete`;

  return (
    <Animated.View entering={FadeIn.delay(enteringDelay * 50)}>
      <GlassCard
        gradient={isAchieved ? 'elevated' : 'card'}
        style={[styles.card, isAchieved && styles.achievedCard]}
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="text"
      >
        <View style={styles.container}>
          {/* Emoji */}
          <View style={[styles.emojiContainer, isAchieved && styles.emojiContainerAchieved]}>
            <Text style={styles.emoji} accessibilityElementsHidden>
              {milestone.emoji}
            </Text>
            {isAchieved && (
              <View style={styles.checkBadge}>
                <Feather name="check" size={12} color={ds.semantic.text.onDark} />
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, isAchieved && styles.titleAchieved]}>
              {milestone.title}
            </Text>

            {isAchieved ? (
              <View style={styles.achievedRow}>
                <Feather name="check-circle" size={14} color={ds.colors.success} />
                <Text style={styles.achievedText}>
                  {achievedAt
                    ? `Achieved on ${achievedAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}`
                    : 'Achieved!'}
                </Text>
              </View>
            ) : daysUntil !== undefined ? (
              <Text style={styles.daysUntilText}>
                {daysUntil} {daysUntil === 1 ? 'day' : 'days'} to go
              </Text>
            ) : null}
          </View>
        </View>

        {/* Progress bar for upcoming milestones */}
        {!isAchieved && progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}% complete</Text>
          </View>
        )}

        {/* Message */}
        <Text style={[styles.message, isAchieved && styles.messageAchieved]}>
          {milestone.message}
        </Text>
      </GlassCard>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
  },
  achievedCard: {
    borderLeftWidth: 4,
    borderLeftColor: ds.colors.success,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ds.colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
  },
  emojiContainerAchieved: {
    backgroundColor: ds.colors.successMuted,
  },
  emoji: {
    fontSize: 28,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ds.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ds.colors.bgPrimary,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: ds.semantic.text.onDark,
    marginBottom: 4,
  },
  titleAchieved: {
    color: ds.colors.success,
  },
  achievedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  achievedText: {
    fontSize: 14,
    color: ds.colors.success,
    fontWeight: '500',
  },
  daysUntilText: {
    fontSize: 14,
    color: ds.colors.textSecondary,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressTrack: {
    height: 6,
    backgroundColor: ds.colors.bgSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ds.colors.info,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: ds.colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  message: {
    fontSize: 14,
    color: ds.colors.textTertiary,
    marginTop: 10,
    lineHeight: 20,
  },
  messageAchieved: {
    color: ds.colors.textSecondary,
  },
});
