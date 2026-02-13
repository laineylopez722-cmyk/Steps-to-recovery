/**
 * TodayWidget Component — Compact Version
 *
 * Slim daily summary: progress checklist + quote.
 * Avoids duplicating clean time (hero card handles that).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useThemedStyles, type DS } from '../design-system/hooks/useThemedStyles';
import { useDs } from '../design-system/DsProvider';
import { useWidgetData } from '../hooks/useWidgetData';
import type { WidgetTodayStatus } from '../services/widgetDataService';

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
    { label: 'Meeting', completed: status.meetingAttended, icon: 'users' },
    { label: 'Gratitude', completed: status.gratitudeCompleted, icon: 'heart' },
  ];
}

export function TodayWidget({
  userId,
}: TodayWidgetProps): React.ReactElement | null {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const { data, isLoading } = useWidgetData(userId);

  if (isLoading || !data) {
    return null;
  }

  const statusItems = getStatusItems(data.todayStatus);
  const completedCount = statusItems.filter((s) => s.completed).length;

  return (
    <Animated.View entering={FadeInUp.duration(300).delay(100)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.count}>
          {completedCount}/{statusItems.length}
        </Text>
      </View>

      {/* Compact horizontal checklist */}
      <View style={styles.checklistRow}>
        {statusItems.map((item) => (
          <View
            key={item.label}
            style={styles.checkItem}
            accessibilityLabel={`${item.label}: ${item.completed ? 'done' : 'not done'}`}
          >
            <View
              style={[
                styles.checkCircle,
                item.completed && {
                  backgroundColor: ds.colors.success,
                  borderColor: ds.colors.success,
                },
              ]}
            >
              {item.completed && (
                <Feather name="check" size={10} color={ds.semantic.text.primary} />
              )}
            </View>
            <Text
              style={[
                styles.checkLabel,
                item.completed && styles.checkLabelDone,
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Quote — single line */}
      {data.dailyQuote?.text && (
        <Text style={styles.quote} numberOfLines={2}>
          &ldquo;{data.dailyQuote.text}&rdquo;
          {data.dailyQuote.source ? ` — ${data.dailyQuote.source}` : ''}
        </Text>
      )}
    </Animated.View>
  );
}

const createStyles = (ds: DS) => ({
  container: {
    backgroundColor: ds.semantic.surface.card,
    borderRadius: ds.radius.lg,
    padding: ds.space[4],
    marginBottom: ds.space[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderDefault,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: ds.space[3],
  },
  title: {
    ...ds.typography.micro,
    color: ds.semantic.text.tertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    fontWeight: '700' as const,
  },
  count: {
    ...ds.typography.caption,
    color: ds.semantic.intent.primary.solid,
    fontWeight: '700' as const,
  },
  checklistRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: ds.space[2],
  },
  checkItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: ds.space[1],
    backgroundColor: ds.semantic.surface.interactive,
    borderRadius: ds.radius.full,
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[1],
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: ds.colors.borderDefault,
    backgroundColor: 'transparent',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  checkLabel: {
    ...ds.typography.micro,
    color: ds.semantic.text.muted,
  },
  checkLabelDone: {
    color: ds.semantic.text.secondary,
  },
  quote: {
    ...ds.typography.micro,
    color: ds.semantic.text.muted,
    fontStyle: 'italic' as const,
    marginTop: ds.space[3],
    lineHeight: 16,
  },
});
