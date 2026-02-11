/**
 * TodayWidget Component
 *
 * An in-app widget-style component that displays a compact "Today" summary:
 * - Clean time counter
 * - Daily recovery quote
 * - Today's activity checklist
 * - Quick action buttons
 * - Current streaks
 *
 * Uses GlassCard for container and design system tokens for theming.
 * Fully accessible (WCAG AAA).
 *
 * @module components/TodayWidget
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { GlassCard } from '../design-system/components/GlassCard';
import { Action } from '../design-system/primitives';
import { useThemedStyles, type DS } from '../design-system/hooks/useThemedStyles';
import { useDs } from '../design-system/DsProvider';
import { useWidgetData } from '../hooks/useWidgetData';
import type { WidgetTodayStatus, WidgetStreaks } from '../services/widgetDataService';

interface TodayWidgetProps {
  userId: string;
  onCheckIn?: () => void;
  onJournal?: () => void;
  onMeeting?: () => void;
}

interface StatusItemData {
  label: string;
  completed: boolean;
  icon: keyof typeof Feather.glyphMap;
}

function getStatusItems(status: WidgetTodayStatus): StatusItemData[] {
  return [
    { label: 'Morning check-in', completed: status.morningCheckIn, icon: 'sunrise' },
    { label: 'Evening check-in', completed: status.eveningCheckIn, icon: 'moon' },
    { label: 'Journal entry', completed: status.journalWritten, icon: 'edit-3' },
    { label: 'Meeting attended', completed: status.meetingAttended, icon: 'users' },
    { label: 'Gratitude', completed: status.gratitudeCompleted, icon: 'heart' },
  ];
}

function StatusItem({
  item,
  ds,
  styles,
}: {
  item: StatusItemData;
  ds: DS;
  styles: ReturnType<typeof createStyles>;
}): React.ReactElement {
  return (
    <View
      style={styles.statusItem}
      accessibilityLabel={`${item.label}: ${item.completed ? 'completed' : 'not completed'}`}
      accessibilityRole="text"
    >
      <View
        style={[
          styles.statusCheck,
          item.completed && {
            backgroundColor: ds.colors.success,
            borderColor: ds.colors.success,
          },
        ]}
      >
        {item.completed && <Feather name="check" size={10} color={ds.semantic.text.primary} />}
      </View>
      <Feather
        name={item.icon}
        size={14}
        color={item.completed ? ds.semantic.text.secondary : ds.semantic.text.muted}
      />
      <Text style={[styles.statusLabel, item.completed && styles.statusLabelCompleted]}>
        {item.label}
      </Text>
    </View>
  );
}

interface StreakBadgeData {
  label: string;
  value: number;
  icon: keyof typeof Feather.glyphMap;
}

function getStreakBadges(streaks: WidgetStreaks): StreakBadgeData[] {
  return [
    { label: 'Check-in', value: streaks.checkIn, icon: 'check-circle' },
    { label: 'Journal', value: streaks.journal, icon: 'edit-3' },
    { label: 'Meeting', value: streaks.meeting, icon: 'users' },
    { label: 'Gratitude', value: streaks.gratitude, icon: 'heart' },
  ];
}

export function TodayWidget({
  userId,
  onCheckIn,
  onJournal,
  onMeeting,
}: TodayWidgetProps): React.ReactElement | null {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const { data, isLoading } = useWidgetData(userId);

  if (isLoading || !data) {
    return null;
  }

  const statusItems = getStatusItems(data.todayStatus);
  const completedCount = statusItems.filter((s) => s.completed).length;
  const streakBadges = getStreakBadges(data.streaks);
  const hasAnyStreak = streakBadges.some((b) => b.value > 0);

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(100)}>
      <GlassCard
        gradient="elevated"
        accessibilityLabel={`Today summary. ${data.cleanTime.days} days clean. ${completedCount} of ${statusItems.length} activities completed.`}
        accessibilityRole="summary"
      >
        {/* Clean Time */}
        <View style={styles.cleanTimeRow}>
          <View style={styles.cleanTimeMain}>
            <Text
              style={styles.cleanTimeDays}
              accessibilityLabel={`${data.cleanTime.days} days clean`}
            >
              {data.cleanTime.days}
            </Text>
            <Text style={styles.cleanTimeUnit}>{data.cleanTime.days === 1 ? 'day' : 'days'}</Text>
          </View>
          <View style={styles.cleanTimeSub}>
            <Text style={styles.cleanTimeHM}>
              {String(data.cleanTime.hours).padStart(2, '0')}h{' '}
              {String(data.cleanTime.minutes).padStart(2, '0')}m
            </Text>
            {data.cleanTime.daysToMilestone > 0 && (
              <Text
                style={styles.milestoneHint}
                accessibilityLabel={`${data.cleanTime.daysToMilestone} days to next milestone`}
              >
                {data.cleanTime.daysToMilestone}d to milestone
              </Text>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Daily Quote */}
        <View
          style={styles.quoteSection}
          accessibilityLabel={`Quote of the day: ${data.dailyQuote.text}. Source: ${data.dailyQuote.source}`}
          accessibilityRole="text"
        >
          <Feather
            name="bookmark"
            size={14}
            color={ds.semantic.intent.primary.solid}
            style={styles.quoteIcon}
          />
          <View style={styles.quoteContent}>
            <Text style={styles.quoteText} numberOfLines={3}>
              &ldquo;{data.dailyQuote.text}&rdquo;
            </Text>
            <Text style={styles.quoteSource}>— {data.dailyQuote.source}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Today Activity Checklist */}
        <View style={styles.statusSection}>
          <View style={styles.statusHeader}>
            <Text style={styles.sectionLabel}>Today</Text>
            <Text style={styles.statusCount}>
              {completedCount}/{statusItems.length}
            </Text>
          </View>
          {statusItems.map((item) => (
            <StatusItem key={item.label} item={item} ds={ds} styles={styles} />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          {onCheckIn && (
            <Action.Root
              onPress={onCheckIn}
              contentStyle={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Quick check-in"
              accessibilityHint="Open the check-in screen"
            >
              <Feather name="check-square" size={16} color={ds.semantic.intent.primary.solid} />
              <Text style={styles.actionLabel}>Check-in</Text>
            </Action.Root>
          )}
          {onJournal && (
            <Action.Root
              onPress={onJournal}
              contentStyle={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Write a journal entry"
              accessibilityHint="Open the journal screen"
            >
              <Feather name="edit-3" size={16} color={ds.semantic.intent.primary.solid} />
              <Text style={styles.actionLabel}>Journal</Text>
            </Action.Root>
          )}
          {onMeeting && (
            <Action.Root
              onPress={onMeeting}
              contentStyle={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Log a meeting"
              accessibilityHint="Open the meeting check-in screen"
            >
              <Feather name="users" size={16} color={ds.semantic.intent.primary.solid} />
              <Text style={styles.actionLabel}>Meeting</Text>
            </Action.Root>
          )}
        </View>

        {/* Streaks */}
        {hasAnyStreak && (
          <>
            <View style={styles.divider} />
            <View style={styles.streaksSection}>
              <Text style={styles.sectionLabel}>Streaks</Text>
              <View style={styles.streaksRow}>
                {streakBadges
                  .filter((b) => b.value > 0)
                  .map((badge) => (
                    <View
                      key={badge.label}
                      style={styles.streakBadge}
                      accessibilityLabel={`${badge.label} streak: ${badge.value} days`}
                      accessibilityRole="text"
                    >
                      <Feather
                        name={badge.icon}
                        size={12}
                        color={ds.semantic.intent.primary.solid}
                      />
                      <Text style={styles.streakValue}>{badge.value}</Text>
                      <Text style={styles.streakLabel}>{badge.label}</Text>
                    </View>
                  ))}
              </View>
            </View>
          </>
        )}
      </GlassCard>
    </Animated.View>
  );
}

const createStyles = (ds: DS) => ({
  // Clean time
  cleanTimeRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    justifyContent: 'space-between' as const,
  },
  cleanTimeMain: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: ds.space[2],
  },
  cleanTimeDays: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: ds.semantic.text.primary,
    letterSpacing: -1,
  },
  cleanTimeUnit: {
    ...ds.typography.body,
    color: ds.semantic.text.tertiary,
    fontWeight: '500' as const,
  },
  cleanTimeSub: {
    alignItems: 'flex-end' as const,
  },
  cleanTimeHM: {
    ...ds.typography.caption,
    color: ds.semantic.text.secondary,
    fontWeight: '600' as const,
  },
  milestoneHint: {
    ...ds.typography.micro,
    color: ds.semantic.intent.primary.solid,
    marginTop: ds.space[1],
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ds.colors.borderDefault,
    marginVertical: ds.space[3],
  },

  // Quote
  quoteSection: {
    flexDirection: 'row' as const,
    gap: ds.space[2],
  },
  quoteIcon: {
    marginTop: 2,
  },
  quoteContent: {
    flex: 1,
  },
  quoteText: {
    ...ds.typography.caption,
    color: ds.semantic.text.secondary,
    fontStyle: 'italic' as const,
    lineHeight: 20,
  },
  quoteSource: {
    ...ds.typography.micro,
    color: ds.semantic.text.muted,
    marginTop: ds.space[1],
  },

  // Status checklist
  statusSection: {
    gap: ds.space[2],
  },
  statusHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: ds.space[1],
  },
  sectionLabel: {
    ...ds.typography.micro,
    color: ds.semantic.text.tertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    fontWeight: '700' as const,
  },
  statusCount: {
    ...ds.typography.caption,
    color: ds.semantic.intent.primary.solid,
    fontWeight: '700' as const,
  },
  statusItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: ds.space[2],
    minHeight: ds.space[8],
  },
  statusCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: ds.colors.borderDefault,
    backgroundColor: 'transparent',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  statusLabel: {
    ...ds.typography.caption,
    color: ds.semantic.text.muted,
    flex: 1,
  },
  statusLabelCompleted: {
    color: ds.semantic.text.secondary,
  },

  // Quick actions
  actionsRow: {
    flexDirection: 'row' as const,
    gap: ds.space[2],
    marginTop: ds.space[3],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: ds.space[2],
    backgroundColor: ds.semantic.surface.interactive,
    borderRadius: ds.radius.lg,
    paddingVertical: ds.space[2],
    paddingHorizontal: ds.space[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.semantic.intent.primary.muted,
    minHeight: ds.sizes.touchMin,
  },
  actionLabel: {
    ...ds.typography.caption,
    color: ds.semantic.intent.primary.solid,
    fontWeight: '600' as const,
  },

  // Streaks
  streaksSection: {
    gap: ds.space[2],
  },
  streaksRow: {
    flexDirection: 'row' as const,
    gap: ds.space[3],
  },
  streakBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: ds.space[1],
    backgroundColor: ds.semantic.intent.primary.muted,
    borderRadius: ds.radius.full,
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[1],
  },
  streakValue: {
    ...ds.typography.caption,
    color: ds.semantic.intent.primary.solid,
    fontWeight: '700' as const,
  },
  streakLabel: {
    ...ds.typography.micro,
    color: ds.semantic.text.tertiary,
  },
});
