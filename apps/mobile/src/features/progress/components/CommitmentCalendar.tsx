/**
 * Commitment Calendar
 *
 * A GitHub-style contribution heat-map adapted for recovery activities.
 * Shows a traditional monthly calendar grid with color-coded day cells.
 *
 * Color levels:
 *  - none      = subtle background
 *  - low       = muted sage green
 *  - medium    = medium green
 *  - high      = bright green
 *  - excellent = gold accent (all activities completed)
 *
 * Shape indicators supplement color for accessibility.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { GlassCard } from '../../../design-system';
import { useTheme } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { aestheticColors } from '../../../design-system/tokens/aesthetic';
import { ds } from '../../../design-system/tokens/ds';
import { ScreenAnimations } from '../../../design-system/tokens/screen-animations';
import { useCommitmentCalendar, formatDate } from '../hooks/useCommitmentCalendar';
import { DayDetailModal } from './DayDetailModal';
import type { DayActivity, ActivityLevel } from '../types';

interface CommitmentCalendarProps {
  userId: string;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getActivityColor(level: ActivityLevel): string {
  switch (level) {
    case 'none':
      return ds.colors.borderSubtle;
    case 'low':
      return 'rgba(50, 215, 75, 0.25)';
    case 'medium':
      return 'rgba(50, 215, 75, 0.50)';
    case 'high':
      return 'rgba(50, 215, 75, 0.80)';
    case 'excellent':
      return aestheticColors.gold.DEFAULT;
  }
}

function getShapeIndicator(level: ActivityLevel): number {
  // Border radius varies by activity level — provides non-color differentiation
  switch (level) {
    case 'none':
      return 4;
    case 'low':
      return 4;
    case 'medium':
      return 6;
    case 'high':
      return 8;
    case 'excellent':
      return 10;
  }
}

export function CommitmentCalendar({ userId }: CommitmentCalendarProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const today = formatDate(new Date());

  // Current month for navigation
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // Day detail modal
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { calendarMonth, isLoading } = useCommitmentCalendar(viewYear, viewMonth);

  const handlePreviousMonth = useCallback((): void => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback((): void => {
    const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
    if (isCurrentMonth) return; // Don't navigate past current month

    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, [viewYear, viewMonth, now]);

  const handleDayPress = useCallback((day: DayActivity): void => {
    setSelectedDay(day);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback((): void => {
    setModalVisible(false);
    setSelectedDay(null);
  }, []);

  // Build the calendar grid
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysMap = new Map<string, DayActivity>();
  if (calendarMonth) {
    for (const day of calendarMonth.days) {
      daysMap.set(day.date, day);
    }
  }

  const totalDays = calendarMonth?.days.length ?? new Date(viewYear, viewMonth + 1, 0).getDate();
  const totalCells = firstDayOfWeek + totalDays;
  const rows = Math.ceil(totalCells / 7);

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  return (
    <Animated.View entering={ScreenAnimations.item(2)}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons
          name="calendar-heart"
          size={20}
          color={aestheticColors.primary[500]}
        />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Commitment Calendar</Text>
      </View>

      <GlassCard intensity="card" style={styles.card}>
        {/* Month navigation header */}
        <View style={styles.header}>
          <Pressable
            onPress={handlePreviousMonth}
            style={styles.navButton}
            accessibilityLabel="Previous month"
            accessibilityRole="button"
            hitSlop={8}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.text} />
          </Pressable>

          <Text
            style={[styles.monthTitle, { color: theme.colors.text }]}
            accessibilityRole="header"
          >
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>

          <Pressable
            onPress={handleNextMonth}
            style={[styles.navButton, isCurrentMonth && styles.navButtonDisabled]}
            accessibilityLabel="Next month"
            accessibilityRole="button"
            accessibilityState={{ disabled: isCurrentMonth }}
            disabled={isCurrentMonth}
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={28}
              color={isCurrentMonth ? theme.colors.textTertiary : theme.colors.text}
            />
          </Pressable>
        </View>

        {/* Weekday labels */}
        <View style={styles.weekdayRow} accessibilityRole="none">
          {WEEKDAY_LABELS.map((label) => (
            <View key={label} style={styles.weekdayCell}>
              <Text style={[styles.weekdayText, { color: theme.colors.textTertiary }]}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading…
            </Text>
          </View>
        ) : (
          <View accessibilityRole="summary" accessibilityLabel="Commitment calendar">
            {Array.from({ length: rows }, (_, rowIndex) => (
              <View key={rowIndex} style={styles.weekRow}>
                {Array.from({ length: 7 }, (_, colIndex) => {
                  const cellIndex = rowIndex * 7 + colIndex;
                  const dayNumber = cellIndex - firstDayOfWeek + 1;

                  if (dayNumber < 1 || dayNumber > totalDays) {
                    return <View key={colIndex} style={styles.dayCell} />;
                  }

                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                  const dayData = daysMap.get(dateStr);
                  const isToday = dateStr === today;
                  const isFuture = dateStr > today;
                  const level = dayData?.activityLevel ?? 'none';
                  const count = dayData?.activityCount ?? 0;

                  return (
                    <Pressable
                      key={colIndex}
                      style={[
                        styles.dayCell,
                        {
                          backgroundColor: isFuture ? 'transparent' : getActivityColor(level),
                          borderRadius: getShapeIndicator(level),
                        },
                        isToday && styles.todayBorder,
                      ]}
                      onPress={!isFuture && dayData ? () => handleDayPress(dayData) : undefined}
                      disabled={isFuture || !dayData}
                      accessibilityLabel={`${dateStr}, ${count} of 5 activities completed`}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isFuture }}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          {
                            color: isFuture
                              ? theme.colors.textTertiary
                              : level === 'excellent'
                                ? aestheticColors.dark.background
                                : theme.colors.text,
                          },
                        ]}
                      >
                        {dayNumber}
                      </Text>
                      {/* Dot indicator for non-color accessibility */}
                      {!isFuture && count > 0 && (
                        <View
                          style={[
                            styles.activityDot,
                            {
                              backgroundColor:
                                level === 'excellent'
                                  ? aestheticColors.dark.background
                                  : aestheticColors.success.DEFAULT,
                            },
                          ]}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend} accessibilityLabel="Calendar legend">
          <Text style={[styles.legendLabel, { color: theme.colors.textTertiary }]}>Less</Text>
          {(['none', 'low', 'medium', 'high', 'excellent'] as ActivityLevel[]).map((level) => (
            <View
              key={level}
              style={[
                styles.legendSwatch,
                {
                  backgroundColor: getActivityColor(level),
                  borderRadius: getShapeIndicator(level),
                },
              ]}
              accessibilityLabel={`${level} activity`}
            />
          ))}
          <Text style={[styles.legendLabel, { color: theme.colors.textTertiary }]}>More</Text>
        </View>
      </GlassCard>

      <DayDetailModal visible={modalVisible} onClose={handleCloseModal} day={selectedDay} />
    </Animated.View>
  );
}

const createStyles = (ds: DS) => ({
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: ds.space[2],
    marginBottom: ds.space[3],
  },
  sectionTitle: {
    fontSize: ds.fontSize.h3,
    fontWeight: ds.fontWeight.semibold,
  },
  card: {
    padding: ds.space[4],
    marginBottom: ds.space[5],
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: ds.space[4],
  },
  navButton: {
    width: 44,
    height: 44,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  monthTitle: {
    fontSize: ds.fontSize.h3,
    fontWeight: ds.fontWeight.semibold,
  },
  weekdayRow: {
    flexDirection: 'row' as const,
    marginBottom: ds.space[2],
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: ds.space[1],
  },
  weekdayText: {
    fontSize: ds.fontSize.micro,
    fontWeight: ds.fontWeight.semibold,
    textTransform: 'uppercase' as const,
  },
  weekRow: {
    flexDirection: 'row' as const,
    marginBottom: ds.space[1],
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    minHeight: 36,
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: ds.colors.accent,
  },
  dayNumber: {
    fontSize: ds.fontSize.caption,
    fontWeight: ds.fontWeight.medium,
  },
  activityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: ds.fontSize.body,
  },
  legend: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: ds.space[2],
    marginTop: ds.space[4],
    paddingTop: ds.space[3],
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
  },
  legendSwatch: {
    width: 14,
    height: 14,
  },
  legendLabel: {
    fontSize: ds.fontSize.micro,
    fontWeight: ds.fontWeight.medium,
  },
});
