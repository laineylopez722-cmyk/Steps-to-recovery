/**
 * WeeklyReportCard
 *
 * Displays a weekly recovery summary with trend arrows,
 * progress stats, and a motivational message.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { GlassCard, SkeletonCard } from '../../../design-system';
import { useDs } from '../../../design-system/DsProvider';
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
  const ds = useDs();

  if (direction === 'flat') return null;

  const isPositive = invertColor ? direction === 'down' : direction === 'up';
  const color = isPositive
    ? ds.semantic.intent.success.solid
    : ds.semantic.intent.alert.solid;
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
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={styles.statItem}
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="text"
    >
      <MaterialCommunityIcons name={icon} size={18} color={aestheticColors.primary[500]} />
      <View style={styles.statContent}>
        <View style={styles.statValueRow}>
          <Text style={styles.statValue}>{value}</Text>
          <TrendArrow direction={trend} invertColor={invertColor} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
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
  const ds = useDs();
  const styles = useThemedStyles(createStyles);

  if (isLoading) {
    return (
      <GlassCard intensity="subtle" style={styles.card}>
        <SkeletonCard />
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
              color={ds.semantic.text.secondary}
            />
            <Text style={styles.emptyTitle}>No weekly report yet</Text>
            <Text style={styles.emptySubtitle}>
              Generate your first weekly recovery summary
            </Text>
            <Pressable
              style={styles.generateButton}
              onPress={onGenerate}
              disabled={isGenerating}
              accessibilityLabel="Generate weekly report"
              accessibilityRole="button"
              accessibilityState={{ disabled: isGenerating }}
            >
              {isGenerating ? (
                <SkeletonCard lines={1} />
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

  const moodTrend = getTrend(report.moodSummary.average, prev?.moodSummary.average);
  const cravingTrend = getTrend(report.cravingSummary.average, prev?.cravingSummary.average);
  const journalTrend = getTrend(report.journalSummary.entryCount, prev?.journalSummary.entryCount);
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
            <Text style={styles.title}>WEEKLY SUMMARY</Text>
          </View>
          <Text style={styles.dateRange}>
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
          <MaterialCommunityIcons name="stairs" size={16} color={ds.semantic.text.secondary} />
          <Text style={styles.stepWorkText}>
            Step {report.stepWorkSummary.currentStep} • {report.stepWorkSummary.entriesThisWeek}{' '}
            entries this week
          </Text>
        </View>

        {/* Highlights */}
        {report.highlights.length > 0 && (
          <View style={styles.highlights}>
            {report.highlights.map((h, i) => (
              <Text
                key={i}
                style={styles.highlightText}
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
          <MaterialCommunityIcons name="heart" size={16} color={aestheticColors.primary[500]} />
          <Text
            style={styles.encouragementText}
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
            <SkeletonCard lines={1} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="refresh"
                size={14}
                color={aestheticColors.primary[500]}
              />
              <Text style={styles.regenerateText}>Refresh</Text>
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
      padding: ds.semantic.layout.cardPadding,
      marginBottom: ds.semantic.layout.sectionGap,
      borderRadius: ds.radius.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: ds.space[4],
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[2],
    },
    title: {
      ...ds.semantic.typography.sectionLabel,
      color: ds.semantic.text.secondary,
      letterSpacing: 1,
    },
    dateRange: {
      ...ds.semantic.typography.meta,
      color: ds.semantic.text.secondary,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ds.space[3],
      marginBottom: ds.space[4],
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[2],
      width: '46%',
      minHeight: ds.semantic.layout.touchTarget,
    },
    statContent: {
      flex: 1,
    },
    statValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[1],
    },
    statValue: {
      ...ds.typography.h3,
      color: ds.semantic.text.primary,
    },
    statLabel: {
      ...ds.semantic.typography.meta,
      color: ds.semantic.text.secondary,
      marginTop: 2,
    },
    stepWorkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[2],
      marginBottom: ds.space[3],
      paddingTop: ds.space[3],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ds.semantic.surface.overlay,
    },
    stepWorkText: {
      ...ds.semantic.typography.bodySmall,
      color: ds.semantic.text.secondary,
    },
    highlights: {
      gap: ds.space[1],
      marginBottom: ds.space[3],
    },
    highlightText: {
      ...ds.semantic.typography.bodySmall,
      color: ds.semantic.text.primary,
      lineHeight: 20,
    },
    encouragement: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: ds.space[2],
      padding: ds.space[3],
      borderRadius: ds.radius.md,
      marginBottom: ds.space[3],
    },
    encouragementText: {
      ...ds.semantic.typography.bodySmall,
      color: ds.semantic.text.primary,
      lineHeight: 20,
      flex: 1,
      fontStyle: 'italic',
    },
    emptyState: {
      alignItems: 'center',
      gap: ds.space[2],
      paddingVertical: ds.space[4],
    },
    emptyTitle: {
      ...ds.typography.h3,
      color: ds.semantic.text.primary,
    },
    emptySubtitle: {
      ...ds.semantic.typography.bodySmall,
      color: ds.semantic.text.secondary,
      textAlign: 'center',
    },
    generateButton: {
      backgroundColor: ds.semantic.intent.primary.solid,
      paddingHorizontal: ds.space[5],
      paddingVertical: ds.space[3],
      borderRadius: ds.radius.md,
      marginTop: ds.space[2],
      minHeight: ds.semantic.layout.touchTarget,
      minWidth: ds.semantic.layout.touchTarget,
      justifyContent: 'center',
      alignItems: 'center',
    },
    generateButtonText: {
      ...ds.semantic.typography.bodySmall,
      color: ds.semantic.text.inverse,
      fontWeight: '600',
    },
    regenerateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ds.space[1],
      paddingVertical: ds.space[2],
      minHeight: ds.semantic.layout.touchTarget,
    },
    regenerateText: {
      ...ds.semantic.typography.bodySmall,
      color: ds.semantic.intent.primary.solid,
      fontWeight: '500',
    },
  });
