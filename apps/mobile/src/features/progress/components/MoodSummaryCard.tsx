/**
 * Mood Summary Card - Summary stats with streaks, weekly comparisons, and trend indicators
 */

import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, GlassCard } from '../../../design-system';
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
  const theme = useTheme();
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
      ? theme.colors.success
      : data.trend === 'declining'
        ? theme.colors.danger
        : theme.colors.textSecondary;

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
          <Text style={[styles.title, { color: theme.colors.text }]}>Weekly Summary</Text>
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
          style={[styles.streakLabel, { color: theme.colors.textSecondary }]}
          accessibilityLabel={`${data.goodDayStreak} consecutive good days with mood 3 or above`}
        >
          good day streak (mood ≥ 3)
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Mood this week */}
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Mood (this week)
          </Text>
          <View style={styles.statValueRow}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {data.weekAvgMood.toFixed(1)}
            </Text>
            {!moodDiff.isNeutral && (
              <Text
                style={[
                  styles.diffText,
                  { color: moodDiff.isPositive ? theme.colors.success : theme.colors.danger },
                ]}
              >
                {moodDiff.text}
              </Text>
            )}
          </View>
          <Text style={[styles.comparisonText, { color: theme.colors.textSecondary }]}>
            vs {data.lastWeekAvgMood.toFixed(1)} last week
          </Text>
        </View>

        {/* Craving this week */}
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Craving (this week)
          </Text>
          <View style={styles.statValueRow}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {data.weekAvgCraving.toFixed(1)}
            </Text>
            {!cravingDiff.isNeutral && (
              <Text
                style={[
                  styles.diffText,
                  { color: cravingIsPositive ? theme.colors.success : theme.colors.danger },
                ]}
              >
                {cravingDiff.text}
              </Text>
            )}
          </View>
          <Text style={[styles.comparisonText, { color: theme.colors.textSecondary }]}>
            vs {data.lastWeekAvgCraving.toFixed(1)} last week
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

const createStyles = (ds: DS) => ({
  card: {
    marginBottom: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  trendBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  streakRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  streakBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  streakLabel: {
    fontSize: 13,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  diffText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  comparisonText: {
    fontSize: 11,
    marginTop: 2,
  },
});
