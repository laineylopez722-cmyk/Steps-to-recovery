/**
 * Empty State Component
 * Friendly, encouraging empty states for various app sections
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Illustration support
 * - Multiple variants (default, encouraging, minimal)
 * - Accessibility optimized
 * - Recovery-focused messaging
 */

import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { GlassCard } from '../../design-system/components/GlassCard';
import * as Haptics from 'expo-haptics';

interface EmptyStateProps {
  /** Emoji to display (or use icon) */
  emoji?: string;
  /** Icon to display (takes precedence over emoji) */
  icon?: React.ComponentProps<typeof Feather>['name'];
  /** Icon color */
  iconColor?: string;
  /** Title text */
  title: string;
  /** Message text */
  message: string;
  /** Action button label */
  actionLabel?: string;
  /** Action button callback */
  onAction?: () => void;
  /** Visual variant */
  variant?: 'default' | 'encouraging' | 'minimal' | 'card';
  /** Delay for staggered animation */
  enteringDelay?: number;
}

export const EmptyState = memo(function EmptyState({
  emoji = '📭',
  icon,
  iconColor = '#60a5fa',
  title,
  message,
  actionLabel,
  onAction,
  variant = 'default',
  enteringDelay = 0,
}: EmptyStateProps) {
  const handleAction = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onAction?.();
  }, [onAction]);

  // Minimal variant - just text and optional button
  if (variant === 'minimal') {
    return (
      <Animated.View
        entering={FadeIn.delay(enteringDelay * 100)}
        style={styles.minimalContainer}
      >
        {icon ? (
          <View style={[styles.iconCircleSmall, { backgroundColor: `${iconColor}20` }]}>
            <Feather name={icon} size={24} color={iconColor} />
          </View>
        ) : (
          <Text style={styles.emojiLarge}>{emoji}</Text>
        )}
        <Text style={styles.messageText}>{message}</Text>
        {onAction && actionLabel && (
          <TouchableOpacity
            onPress={handleAction}
            style={styles.minimalButton}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text style={styles.minimalButtonText}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }

  // Card variant - compact card format
  if (variant === 'card') {
    return (
      <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
        <GlassCard gradient="card" style={styles.cardContainer}>
          <View style={styles.cardContent}>
            {icon ? (
              <View style={[styles.iconCircleSmall, { backgroundColor: `${iconColor}20` }]}>
                <Feather name={icon} size={20} color={iconColor} />
              </View>
            ) : (
              <Text style={styles.emojiMedium}>{emoji}</Text>
            )}
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardMessage}>{message}</Text>
            </View>
          </View>
          {onAction && actionLabel && (
            <TouchableOpacity
              onPress={handleAction}
              style={styles.cardButton}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
            >
              <Text style={styles.cardButtonText}>{actionLabel}</Text>
              <Feather name="arrow-right" size={16} color="#60a5fa" />
            </TouchableOpacity>
          )}
        </GlassCard>
      </Animated.View>
    );
  }

  // Default/Encouraging variant - full empty state
  return (
    <Animated.View
      entering={FadeInUp.delay(enteringDelay * 100)}
      style={styles.fullContainer}
    >
      {/* Icon/Emoji in a circle */}
      <View style={[styles.mainIconCircle, { backgroundColor: `${iconColor}15` }]}>
        {icon ? (
          <Feather name={icon} size={40} color={iconColor} />
        ) : (
          <Text style={styles.emojiMain}>{emoji}</Text>
        )}
      </View>

      {/* Title */}
      <Text style={styles.mainTitle} accessibilityRole="header">
        {title}
      </Text>

      {/* Message */}
      <Text style={styles.mainMessage}>{message}</Text>

      {/* Encouraging message for recovery context */}
      {variant === 'encouraging' && (
        <GlassCard gradient="card" style={styles.encouragementCard}>
          <Feather name="heart" size={16} color="#22c55e" style={styles.heartIcon} />
          <Text style={styles.encouragementText}>
            Every step forward is progress in your recovery journey.
          </Text>
        </GlassCard>
      )}

      {/* Action button */}
      {onAction && actionLabel && (
        <TouchableOpacity
          onPress={handleAction}
          style={styles.mainButton}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.mainButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
});

// Predefined empty states for common scenarios
export const EMPTY_STATES = {
  journal: {
    icon: 'book-open' as const,
    iconColor: '#8b5cf6',
    title: 'Start Your Journal',
    message: 'Writing about your recovery journey can be a powerful tool for healing and growth.',
    actionLabel: 'Write First Entry',
  },
  vault: {
    icon: 'lock' as const,
    iconColor: '#f59e0b',
    title: 'Your Motivation Vault',
    message:
      'Save photos, quotes, and reminders of why recovery matters to you. Access them when you need strength.',
    actionLabel: 'Add First Item',
  },
  meetings: {
    icon: 'map-pin' as const,
    iconColor: '#22c55e',
    title: 'Track Your Meetings',
    message: 'Log your meeting attendance and reflections. Connection is key to recovery.',
    actionLabel: 'Log First Meeting',
  },
  capsules: {
    icon: 'mail' as const,
    iconColor: '#ec4899',
    title: 'Write to Your Future Self',
    message:
      'Create time capsules with messages of hope. They unlock at milestones in your journey.',
    actionLabel: 'Create Time Capsule',
  },
  search: {
    icon: 'search' as const,
    iconColor: '#64748b',
    title: 'No Results Found',
    message: 'Try a different search term or clear filters to see all entries.',
    actionLabel: 'Clear Search',
  },
  checkins: {
    icon: 'activity' as const,
    iconColor: '#3b82f6',
    title: 'No Check-ins Yet',
    message: "Regular check-ins help you understand your patterns. Start with today's reflection.",
    actionLabel: 'Check In Now',
  },
  milestones: {
    icon: 'award' as const,
    iconColor: '#f59e0b',
    title: 'Your Milestones Await',
    message: 'Every day sober is an achievement. Your first milestone is just around the corner.',
  },
  scenarios: {
    icon: 'target' as const,
    iconColor: '#ef4444',
    title: 'Practice Scenarios',
    message:
      'Prepare for challenging situations by practicing healthy responses. Build confidence in your coping skills.',
    actionLabel: 'Start Practice',
  },
  contacts: {
    icon: 'users' as const,
    iconColor: '#22c55e',
    title: 'No Contacts Yet',
    message: 'Add your sponsor and recovery contacts for quick access to support.',
    actionLabel: 'Add Contact',
  },
} as const;

const styles = StyleSheet.create({
  // Minimal variant
  minimalContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emojiLarge: {
    fontSize: 48,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  minimalButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderRadius: 20,
  },
  minimalButtonText: {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: 14,
  },
  // Card variant
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircleSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emojiMedium: {
    fontSize: 32,
    marginRight: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  cardMessage: {
    fontSize: 14,
    color: '#64748b',
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
  },
  cardButtonText: {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
  },
  // Full/Default variant
  fullContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mainIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emojiMain: {
    fontSize: 40,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  mainMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  encouragementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 24,
    marginHorizontal: 16,
    width: '100%',
    maxWidth: 320,
  },
  heartIcon: {
    marginRight: 12,
  },
  encouragementText: {
    flex: 1,
    color: '#4ade80',
    fontSize: 14,
    lineHeight: 20,
  },
  mainButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  mainButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
