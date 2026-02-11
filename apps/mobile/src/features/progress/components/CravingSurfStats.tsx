/**
 * Craving Surf Stats - Summary statistics from craving surfing sessions
 *
 * Displays total sessions, average reduction, success rate,
 * and most effective technique.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, GlassCard } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { aestheticColors } from '../../../design-system/tokens/aesthetic';
import type { CravingSurfSummary } from '../types';

interface CravingSurfStatsProps {
  summary: CravingSurfSummary;
}

export function CravingSurfStats({ summary }: CravingSurfStatsProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  const reductionColor =
    summary.averageReduction > 0 ? theme.colors.success : theme.colors.textSecondary;
  const successColor =
    summary.successRate >= 70
      ? theme.colors.success
      : summary.successRate >= 40
        ? theme.colors.warning
        : theme.colors.textSecondary;

  const accessibilityDescription =
    summary.totalSessions > 0
      ? `Craving surf stats: ${summary.totalSessions} sessions, ${summary.averageReduction.toFixed(1)} average reduction, ${summary.successRate}% success rate`
      : 'No craving surf sessions recorded yet';

  return (
    <GlassCard
      intensity="card"
      style={styles.card}
      accessibilityLabel={accessibilityDescription}
      accessibilityRole="summary"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="waves" size={20} color={aestheticColors.primary[500]} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Craving Surf Sessions</Text>
        </View>
      </View>

      {summary.totalSessions > 0 ? (
        <>
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View
                style={[styles.statIcon, { backgroundColor: aestheticColors.primary[500] + '15' }]}
              >
                <MaterialCommunityIcons
                  name="counter"
                  size={18}
                  color={aestheticColors.primary[500]}
                />
              </View>
              <Text
                style={[styles.statValue, { color: theme.colors.text }]}
                accessibilityLabel={`${summary.totalSessions} total sessions`}
              >
                {summary.totalSessions}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Sessions
              </Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: reductionColor + '15' }]}>
                <MaterialCommunityIcons name="arrow-down" size={18} color={reductionColor} />
              </View>
              <Text
                style={[styles.statValue, { color: theme.colors.text }]}
                accessibilityLabel={`Average reduction of ${summary.averageReduction.toFixed(1)} points`}
              >
                {summary.averageReduction > 0 ? '-' : ''}
                {summary.averageReduction.toFixed(1)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Avg Reduction
              </Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: successColor + '15' }]}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={18}
                  color={successColor}
                />
              </View>
              <Text
                style={[styles.statValue, { color: theme.colors.text }]}
                accessibilityLabel={`${summary.successRate}% success rate`}
              >
                {summary.successRate}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Success Rate
              </Text>
            </View>
          </View>

          {/* Most Effective Technique */}
          {summary.mostEffectiveTechnique && (
            <View style={[styles.techniqueRow]}>
              <MaterialCommunityIcons name="star" size={16} color={aestheticColors.gold.DEFAULT} />
              <Text style={[styles.techniqueLabel, { color: theme.colors.textSecondary }]}>
                Most Effective:
              </Text>
              <Text
                style={[styles.techniqueValue, { color: theme.colors.text }]}
                accessibilityLabel={`Most effective technique: ${summary.mostEffectiveTechnique}`}
              >
                {summary.mostEffectiveTechnique}
              </Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Use the Craving Surf tool when cravings arise to track your progress here
          </Text>
        </View>
      )}
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
  statsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center' as const,
  },
  techniqueRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
  },
  techniqueLabel: {
    fontSize: 13,
  },
  techniqueValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    flex: 1,
  },
  emptyState: {
    height: 60,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center' as const,
  },
});
