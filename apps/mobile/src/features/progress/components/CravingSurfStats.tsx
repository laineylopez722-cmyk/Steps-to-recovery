/**
 * Craving Surf Stats - Summary statistics from craving surfing sessions
 *
 * Displays total sessions, average reduction, success rate,
 * and most effective technique.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '../../../design-system';
import { useDs } from '../../../design-system/DsProvider';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { aestheticColors } from '../../../design-system/tokens/aesthetic';
import type { CravingSurfSummary } from '../types';

interface CravingSurfStatsProps {
  summary: CravingSurfSummary;
}

export function CravingSurfStats({ summary }: CravingSurfStatsProps): React.ReactElement {
  const ds = useDs();
  const styles = useThemedStyles(createStyles);

  const reductionColor =
    summary.averageReduction > 0
      ? ds.semantic.intent.success.solid
      : ds.semantic.text.secondary;
  const successColor =
    summary.successRate >= 70
      ? ds.semantic.intent.success.solid
      : summary.successRate >= 40
        ? ds.semantic.intent.warning.solid
        : ds.semantic.text.secondary;

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
          <Text style={styles.title}>CRAVING SURF SESSIONS</Text>
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
                style={styles.statValue}
                accessibilityLabel={`${summary.totalSessions} total sessions`}
              >
                {summary.totalSessions}
              </Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: reductionColor + '15' }]}>
                <MaterialCommunityIcons name="arrow-down" size={18} color={reductionColor} />
              </View>
              <Text
                style={styles.statValue}
                accessibilityLabel={`Average reduction of ${summary.averageReduction.toFixed(1)} points`}
              >
                {summary.averageReduction > 0 ? '-' : ''}
                {summary.averageReduction.toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Avg Reduction</Text>
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
                style={styles.statValue}
                accessibilityLabel={`${summary.successRate}% success rate`}
              >
                {summary.successRate}%
              </Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
          </View>

          {/* Most Effective Technique */}
          {summary.mostEffectiveTechnique && (
            <View style={[styles.techniqueRow]}>
              <MaterialCommunityIcons name="star" size={16} color={aestheticColors.gold.DEFAULT} />
              <Text style={styles.techniqueLabel}>Most Effective:</Text>
              <Text
                style={styles.techniqueValue}
                accessibilityLabel={`Most effective technique: ${summary.mostEffectiveTechnique}`}
              >
                {summary.mostEffectiveTechnique}
              </Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Use the Craving Surf tool when cravings arise to track your progress here
          </Text>
        </View>
      )}
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
  statsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: ds.space[3],
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
    marginBottom: ds.space[2],
  },
  statValue: {
    ...ds.typography.h3,
    color: ds.semantic.text.primary,
  },
  statLabel: {
    ...ds.semantic.typography.meta,
    color: ds.semantic.text.secondary,
    marginTop: ds.space[1],
    textAlign: 'center' as const,
  },
  techniqueRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: ds.space[2],
    marginTop: ds.space[4],
    paddingTop: ds.space[4],
    borderTopWidth: 1,
    borderTopColor: ds.semantic.surface.overlay,
  },
  techniqueLabel: {
    ...ds.semantic.typography.bodySmall,
    color: ds.semantic.text.secondary,
  },
  techniqueValue: {
    ...ds.semantic.typography.bodySmall,
    color: ds.semantic.text.primary,
    fontWeight: '600' as const,
    flex: 1,
  },
  emptyState: {
    minHeight: 60,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyText: {
    ...ds.semantic.typography.bodySmall,
    color: ds.semantic.text.secondary,
    textAlign: 'center' as const,
  },
});
