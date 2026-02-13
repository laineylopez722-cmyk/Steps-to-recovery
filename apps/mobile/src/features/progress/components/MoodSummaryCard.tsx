/**
 * Mood Summary Card - Summary stats with streaks, weekly comparisons, and trend indicators
 */

import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '../../../design-system';
import { useDs } from '../../../design-system/DsProvider';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { aestheticColors } from '../../../design-system/tokens/aesthetic';
import type { MoodTrendData } from '../hooks/useMoodTrends';

interface MoodSummaryCardProps {
  data: MoodTrendData;
}

function formatDiff(
  current: number,
  previous: number,
): { text: string; isPositive: boolean; isNeutral: boolean } {
  if (previous === 0) return { text: 'N/A', isPositive: false, isNeutral: true };
  const diff = current - previous;
  const sign = diff > 0 ? '+' : '';
  return {
    text: `${sign}${diff.toFixed(1)}`,
    isPositive: diff > 0,
    isNeutral: Math.abs(diff) < 0.1,
  };
}

export function MoodSummaryCard({ data }: MoodSummaryCardProps): React.ReactElement {
  const ds = useDs();
  const styles = useThemedStyles(createStyles);

  const moodDiff = formatDiff(data.weekAvgMood, data.lastWeekAvgMood);
  // For cravings, lower is better so invert the positivity
  const cravingDiff = formatDiff(data.weekAvgCraving, data.lastWeekAvgCraving);
  const cravingIsPositive = cravingDiff.isNeutral ? false : !cravingDiff.isPositive;

  const overallTrendIcon: keyof typeof MaterialCommunityIcons.glyphMap =
    data.trend === 'improving'
      ? 'arrow-up-circle'
      : data.trend === 'declining'
        ? 'arrow-down-circle'
        : 'minus-circle';

  const overallTrendColor =
    data.trend === 'improving'
      ? ds.semantic.intent.success.solid
      : data.trend === 'declining'
        ? ds.semantic.intent.alert.solid
        : ds.semantic.text.secondary;

  const summaryLabel = `Recovery summary: ${data.goodDayStreak} good day streak, mood ${data.trend}, average mood ${data.weekAvgMood.toFixed(1)} this week`;

  return (
    <GlassCard
      intensity="card"
      style={styles.card}
      accessibilityLabel={summaryLabel}
      accessibilityRole="summary"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="chart-arc" size={20} color={aestheticColors.gold.DEFAULT} />
          <Text style={styles.title}>WEEKLY SUMMARY</Text>
        </View>
        <View style={styles.trendBadge}>
          <MaterialCommunityIcons name={overallTrendIcon} size={18} color={overallTrendColor} />
        </View>
      </View>

      {/* Good Day Streak */}
      <View style={styles.streakRow}>
        <View
          style={[styles.streakBadge, { backgroundColor: aestheticColors.gold.DEFAULT + '20' }]}
        >
          <MaterialCommunityIcons name="fire" size={18} color={aestheticColors.gold.DEFAULT} />
          <Text style={[styles.streakValue, { color: aestheticColors.gold.DEFAULT }]}>
            {data.goodDayStreak}
          </Text>
        </View>
        <Text
          style={styles.streakLabel}
          accessibilityLabel={`${data.goodDayStreak} consecutive good days with mood 3 or above`}
        >
          good day streak (mood ≥ 3)
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Mood this week */}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Mood (this week)</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statValue}>{data.weekAvgMood.toFixed(1)}</Text>
            {!moodDiff.isNeutral && (
              <Text
                style={[
                  styles.diffText,
                  {
                    color: moodDiff.isPositive
                      ? ds.semantic.intent.success.solid
                      : ds.semantic.intent.alert.solid,
                  },
                ]}
              >
                {moodDiff.text}
              </Text>
            )}
          </View>
          <Text style={styles.comparisonText}>
            vs {data.lastWeekAvgMood.toFixed(1)} last week
          </Text>
        </View>

        {/* Craving this week */}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Craving (this week)</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statValue}>{data.weekAvgCraving.toFixed(1)}</Text>
            {!cravingDiff.isNeutral && (
              <Text
                style={[
                  styles.diffText,
                  {
                    color: cravingIsPositive
                      ? ds.semantic.intent.success.solid
                      : ds.semantic.intent.alert.solid,
                  },
                ]}
              >
                {cravingDiff.text}
              </Text>
            )}
          </View>
          <Text style={styles.comparisonText}>
            vs {data.lastWeekAvgCraving.toFixed(1)} last week
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

const createStyles = (ds: DS) => ({
  card: {
    marginBottom: ds.semantic.layout.sectionGap,
    padding: ds.semantic.layout.cardPadding,
    borderRadius: ds.radius.lg,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: ds.space[4],
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: ds.space[2],
  },
  title: {
    ...ds.semantic.typography.sectionLabel,
    color: ds.semantic.text.secondary,
    letterSpacing: 1,
  },
  trendBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  streakRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: ds.space[3],
    marginBottom: ds.space[4],
    paddingBottom: ds.space[4],
    borderBottomWidth: 1,
    borderBottomColor: ds.semantic.surface.overlay,
  },
  streakBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: ds.space[2],
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[2],
    borderRadius: ds.radius.full,
  },
  streakValue: {
    ...ds.typography.h3,
  },
  streakLabel: {
    ...ds.semantic.typography.bodySmall,
    color: ds.semantic.text.secondary,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    gap: ds.space[4],
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    ...ds.semantic.typography.bodySmall,
    color: ds.semantic.text.secondary,
    marginBottom: ds.space[1],
  },
  statValueRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: ds.space[2],
  },
  statValue: {
    ...ds.typography.h2,
    color: ds.semantic.text.primary,
  },
  diffText: {
    ...ds.semantic.typography.bodySmall,
    fontWeight: '600' as const,
  },
  comparisonText: {
    ...ds.semantic.typography.meta,
    color: ds.semantic.text.secondary,
    marginTop: 2,
  },
});
