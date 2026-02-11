/**
 * Day Detail Modal
 *
 * Shows which recovery activities were completed on a specific day.
 * Displays checkmarks for completed items and gray for incomplete.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useTheme } from '../../../design-system';
import { aestheticColors } from '../../../design-system/tokens/aesthetic';
import type { DayActivity } from '../types';

interface DayDetailModalProps {
  visible: boolean;
  onClose: () => void;
  day: DayActivity | null;
}

interface ActivityRowProps {
  label: string;
  completed: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

function ActivityRow({ label, completed, icon }: ActivityRowProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={styles.activityRow}
      accessibilityLabel={`${label}: ${completed ? 'completed' : 'not completed'}`}
      accessibilityRole="text"
    >
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={completed ? aestheticColors.success.DEFAULT : theme.colors.textTertiary}
      />
      <Text
        style={[
          styles.activityLabel,
          { color: completed ? theme.colors.text : theme.colors.textTertiary },
        ]}
      >
        {label}
      </Text>
      <MaterialCommunityIcons
        name={completed ? 'check-circle' : 'circle-outline'}
        size={22}
        color={completed ? aestheticColors.success.DEFAULT : theme.colors.textTertiary}
      />
    </View>
  );
}

function getEncouragingMessage(activityCount: number): string {
  if (activityCount === 0) return 'Every journey has rest days. Tomorrow is a fresh start.';
  if (activityCount === 1) return 'You showed up today. That takes courage.';
  if (activityCount === 2) return 'Great effort! Building strong habits.';
  if (activityCount <= 4) return 'Outstanding commitment to your recovery!';
  return '🌟 Perfect day! You are an inspiration!';
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DayDetailModal({ visible, onClose, day }: DayDetailModalProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  if (!day) {
    return (
      <Modal visible={visible} onClose={onClose} title="Day Details" variant="bottom">
        <Text style={[styles.noData, { color: theme.colors.textSecondary }]}>
          No data available
        </Text>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={formatDisplayDate(day.date)}
      variant="bottom"
      dismissable
    >
      <View style={styles.content}>
        {/* Activity count summary */}
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryCount, { color: theme.colors.text }]}>
            {day.activityCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            of 5 activities
          </Text>
        </View>

        {/* Activity checklist */}
        <View style={styles.activityList}>
          <ActivityRow
            label="Daily Check-in"
            completed={day.checkInCompleted}
            icon="calendar-check"
          />
          <ActivityRow
            label="Journal Entry"
            completed={day.journalWritten}
            icon="book-open-variant"
          />
          <ActivityRow
            label="Meeting Attended"
            completed={day.meetingAttended}
            icon="account-group"
          />
          <ActivityRow label="Step Work" completed={day.stepWorkDone} icon="stairs" />
          <ActivityRow
            label="Gratitude List"
            completed={day.gratitudeCompleted}
            icon="heart-outline"
          />
        </View>

        {/* Encouraging message */}
        <View style={styles.messageContainer}>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {getEncouragingMessage(day.activityCount)}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (ds: DS) => ({
  content: {
    paddingVertical: ds.space[3],
  },
  summaryRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    justifyContent: 'center' as const,
    marginBottom: ds.space[5],
    gap: ds.space[2],
  },
  summaryCount: {
    fontSize: ds.fontSize.h1,
    fontWeight: ds.fontWeight.bold,
  },
  summaryLabel: {
    fontSize: ds.fontSize.body,
    fontWeight: ds.fontWeight.regular,
  },
  activityList: {
    gap: ds.space[3],
    marginBottom: ds.space[5],
  },
  activityRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: ds.space[2],
    paddingHorizontal: ds.space[3],
    gap: ds.space[3],
    minHeight: 48,
  },
  activityLabel: {
    flex: 1,
    fontSize: ds.fontSize.body,
    fontWeight: ds.fontWeight.medium,
  },
  messageContainer: {
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[4],
    backgroundColor: ds.colors.accentSubtle,
    borderRadius: ds.radius.md,
  },
  message: {
    fontSize: ds.fontSize.bodySm,
    fontWeight: ds.fontWeight.medium,
    textAlign: 'center' as const,
    lineHeight: ds.lineHeight.bodySm,
  },
  noData: {
    fontSize: ds.fontSize.body,
    textAlign: 'center' as const,
    paddingVertical: ds.space[8],
  },
});
