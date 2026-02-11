/**
 * WeeklyReportCard
 *
 * Displays a weekly recovery summary with trend arrows,
 * progress stats, and a motivational message.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { GlassCard } from '../../../design-system';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { ScreenAnimations } from '../../../design-system/tokens/screen-animations';
import { aestheticColors } from '../../../design-system/tokens/aesthetic';
import type { WeeklyReport } from '../../ai-companion/services/weeklyReport';

interface WeeklyReportCardProps {
  report: WeeklyReport | null;
  previousReport: WeeklyReport | null;
  isLoading: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}

type TrendDirection = 'up' | 'down' | 'flat';

function getTrend(current: number, previous: number | undefined): TrendDirection {
  if (previous === undefined) return 'flat';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
}

function TrendArrow({
  direction,
  invertColor,
}: {
  direction: TrendDirection;
  invertColor?: boolean;
}): React.ReactElement | null {
  const theme = useTheme();

  if (direction === 'flat') return null;

  const isPositive = invertColor ? direction === 'down' : direction === 'up';
  const color = isPositive ? theme.colors.success : theme.colors.danger;
  const icon = direction === 'up' ? 'arrow-up' : 'arrow-down';

  return (
    <MaterialCommunityIcons
      name={icon}
      size={14}
      color={color}
      accessibilityLabel={`Trend ${direction}`}
    />
  );
}

function StatItem({
  icon,
  label,
  value,
  trend,
  invertColor,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string | number;
  trend: TrendDirection;
  invertColor?: boolean;
}): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={styles.statItem}
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="text"
    >
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={aestheticColors.primary[500]}
      />
      <View style={styles.statContent}>
        <View style={styles.statValueRow}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {value}
          </Text>
          <TrendArrow direction={trend} invertColor={invertColor} />
        </View>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

export function WeeklyReportCard({
  report,
  previousReport,
  isLoading,
  isGenerating,
  onGenerate,
}: WeeklyReportCardProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  if (isLoading) {
    return (
      <GlassCard intensity="subtle" style={styles.card}>
        <ActivityIndicator color={aestheticColors.primary[500]} />
      </GlassCard>
    );
  }

  if (!report) {
    return (
      <Animated.View entering={ScreenAnimations.entrance}>
        <GlassCard intensity="subtle" style={styles.card}>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="chart-bar"
              size={32}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No weekly report yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Generate your first weekly recovery summary
            </Text>
            <Pressable
              style={[styles.generateButton, { backgroundColor: aestheticColors.primary[500] }]}
              onPress={onGenerate}
              disabled={isGenerating}
              accessibilityLabel="Generate weekly report"
              accessibilityRole="button"
              accessibilityState={{ disabled: isGenerating }}
            >
              {isGenerating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.generateButtonText}>Generate Report</Text>
              )}
            </Pressable>
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  const prev = previousReport;

  const moodTrend = getTrend(
    report.moodSummary.average,
    prev?.moodSummary.average,
  );
  const cravingTrend = getTrend(
    report.cravingSummary.average,
    prev?.cravingSummary.average,
  );
  const journalTrend = getTrend(
    report.journalSummary.entryCount,
    prev?.journalSummary.entryCount,
  );
  const checkinTrend = getTrend(
    report.checkInSummary.completedDays,
    prev?.checkInSummary.completedDays,
  );

  return (
    <Animated.View entering={ScreenAnimations.entrance}>
      <GlassCard intensity="subtle" style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons
              name="calendar-week"
              size={20}
              color={aestheticColors.primary[500]}
            />
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Weekly Summary
            </Text>
          </View>
          <Text style={[styles.dateRange, { color: theme.colors.textSecondary }]}>
            {report.weekStarting} — {report.weekEnding}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatItem
            icon="emoticon-happy-outline"
            label="Avg Mood"
            value={report.moodSummary.average.toFixed(1)}
            trend={moodTrend}
          />
          <StatItem
            icon="lightning-bolt"
            label="Avg Craving"
            value={report.cravingSummary.average.toFixed(1)}
            trend={cravingTrend}
            invertColor
          />
          <StatItem
            icon="book-open-variant"
            label="Journal Entries"
            value={report.journalSummary.entryCount}
            trend={journalTrend}
          />
          <StatItem
            icon="check-circle-outline"
            label="Check-in Days"
            value={`${report.checkInSummary.completedDays}/7`}
            trend={checkinTrend}
          />
        </View>

        {/* Step Work */}
        <View style={styles.stepWorkRow}>
          <MaterialCommunityIcons
            name="stairs"
            size={16}
            color={theme.colors.textSecondary}
          />
          <Text style={[styles.stepWorkText, { color: theme.colors.textSecondary }]}>
            Step {report.stepWorkSummary.currentStep} •{' '}
            {report.stepWorkSummary.entriesThisWeek} entries this week
          </Text>
        </View>

        {/* Highlights */}
        {report.highlights.length > 0 && (
          <View style={styles.highlights}>
            {report.highlights.map((h, i) => (
              <Text
                key={i}
                style={[styles.highlightText, { color: theme.colors.text }]}
                accessibilityLabel={h}
                accessibilityRole="text"
              >
                {h}
              </Text>
            ))}
          </View>
        )}

        {/* Encouragement */}
        <View
          style={[styles.encouragement, { backgroundColor: aestheticColors.primary[500] + '15' }]}
        >
          <MaterialCommunityIcons
            name="heart"
            size={16}
            color={aestheticColors.primary[500]}
          />
          <Text
            style={[styles.encouragementText, { color: theme.colors.text }]}
            accessibilityLabel={`Encouragement: ${report.encouragement}`}
            accessibilityRole="text"
          >
            {report.encouragement}
          </Text>
        </View>

        {/* Regenerate */}
        <Pressable
          style={styles.regenerateButton}
          onPress={onGenerate}
          disabled={isGenerating}
          accessibilityLabel="Regenerate weekly report"
          accessibilityRole="button"
          accessibilityState={{ disabled: isGenerating }}
        >
          {isGenerating ? (
            <ActivityIndicator color={aestheticColors.primary[500]} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="refresh"
                size={14}
                color={aestheticColors.primary[500]}
              />
              <Text style={[styles.regenerateText, { color: aestheticColors.primary[500] }]}>
                Refresh
              </Text>
            </>
          )}
        </Pressable>
      </GlassCard>
    </Animated.View>
  );
}

const createStyles = (ds: DS) =>
  StyleSheet.create({
    card: {
      padding: 20,
      marginBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
    },
    dateRange: {
      fontSize: 12,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      width: '46%',
      minHeight: 48,
    },
    statContent: {
      flex: 1,
    },
    statValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '700',
    },
    statLabel: {
      fontSize: 11,
      marginTop: 2,
    },
    stepWorkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ds.colors.borderSubtle,
    },
    stepWorkText: {
      fontSize: 13,
    },
    highlights: {
      gap: 4,
      marginBottom: 12,
    },
    highlightText: {
      fontSize: 13,
      lineHeight: 20,
    },
    encouragement: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
    },
    encouragementText: {
      fontSize: 13,
      lineHeight: 20,
      flex: 1,
      fontStyle: 'italic',
    },
    emptyState: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 16,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    emptySubtitle: {
      fontSize: 13,
      textAlign: 'center',
    },
    generateButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 8,
      minHeight: 48,
      minWidth: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    generateButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
    regenerateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 8,
      minHeight: 48,
    },
    regenerateText: {
      fontSize: 13,
      fontWeight: '500',
    },
  });
