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
        style={[
          styles.card,
          isAchieved && styles.achievedCard,
        ]}
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
                <Feather name="check" size={12} color="#ffffff" />
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
                <Feather name="check-circle" size={14} color="#4ade80" />
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
              <View
                style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
              />
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
    borderLeftColor: '#4ade80',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
  },
  emojiContainerAchieved: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
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
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  titleAchieved: {
    color: '#4ade80',
  },
  achievedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  achievedText: {
    fontSize: 14,
    color: '#4ade80',
    fontWeight: '500',
  },
  daysUntilText: {
    fontSize: 14,
    color: '#64748b',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'right',
  },
  message: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 10,
    lineHeight: 20,
  },
  messageAchieved: {
    color: '#64748b',
  },
});
