/**
 * CloseCallInsights Component
 *
 * Displays statistics and insights about close calls
 */

import { type ReactElement } from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Card, useTheme } from '../../../design-system';
import { useDs } from '../../../design-system/DsProvider';
import type { CloseCallStats } from '../hooks';

interface CloseCallInsightsProps {
  stats: CloseCallStats;
  style?: StyleProp<ViewStyle>;
}

export function CloseCallInsights({ stats, style }: CloseCallInsightsProps): ReactElement {
  const theme = useTheme();
  const ds = useDs();

  const resistanceRate =
    stats.totalCloseCalls > 0 ? Math.round((stats.timesResisted / stats.totalCloseCalls) * 100) : 0;

  const lastCloseCallText = stats.lastCloseCall
    ? formatLastCloseCall(stats.lastCloseCall)
    : 'Never';

  return (
    <Animated.View entering={FadeIn.duration(400)} style={style}>
      <Card variant="elevated" style={styles.card}>
        <Text
          style={[
            ds.typography.h3,
            { color: ds.semantic.text.primary, marginBottom: theme.spacing.md },
          ]}
          accessibilityRole="header"
        >
          Your Protection Stats
        </Text>

        {/* Main Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Total Close Calls */}
          <View style={styles.statBox}>
            <View
              style={[styles.statIconContainer, { backgroundColor: ds.semantic.intent.warning.solid + '20' }]}
            >
              <MaterialCommunityIcons name="alert-circle" size={28} color={ds.semantic.intent.warning.solid} />
            </View>
            <Text style={[ds.semantic.typography.screenTitle, { color: ds.semantic.text.primary, marginTop: 8 }]}>
              {stats.totalCloseCalls}
            </Text>
            <Text style={[ds.semantic.typography.sectionLabel, { color: ds.semantic.text.secondary }]}>
              Close Calls
            </Text>
          </View>

          {/* Times Resisted */}
          <View style={styles.statBox}>
            <View
              style={[styles.statIconContainer, { backgroundColor: ds.semantic.intent.success.solid + '20' }]}
            >
              <MaterialCommunityIcons name="shield-check" size={28} color={ds.semantic.intent.success.solid} />
            </View>
            <Text style={[ds.semantic.typography.screenTitle, { color: ds.semantic.intent.success.solid, marginTop: 8 }]}>
              {stats.timesResisted}
            </Text>
            <Text style={[ds.semantic.typography.sectionLabel, { color: ds.semantic.text.secondary }]}>
              Times Resisted
            </Text>
          </View>
        </View>

        {/* Resistance Rate */}
        {stats.totalCloseCalls > 0 && (
          <View
            style={[
              styles.resistanceBar,
              {
                backgroundColor: ds.semantic.surface.card,
                marginTop: theme.spacing.md,
              },
            ]}
          >
            <View style={styles.resistanceBarHeader}>
              <Text style={[ds.typography.h3, { color: ds.semantic.text.primary }]}>
                Resistance Rate
              </Text>
              <Text
                style={[ds.typography.h2, { color: ds.semantic.intent.success.solid, fontWeight: 'bold' }]}
              >
                {resistanceRate}%
              </Text>
            </View>
            <View style={[styles.progressBarContainer, { backgroundColor: ds.colors.borderDefault }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: ds.semantic.intent.success.solid,
                    width: `${resistanceRate}%`,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                ds.semantic.typography.sectionLabel,
                {
                  color: ds.semantic.text.secondary,
                  marginTop: 4,
                  textAlign: 'center',
                },
              ]}
            >
              You chose recovery {stats.timesResisted} out of {stats.totalCloseCalls} times
            </Text>
          </View>
        )}

        {/* Additional Stats */}
        <View style={[styles.additionalStats, { marginTop: theme.spacing.md }]}>
          <View style={styles.additionalStatRow}>
            <View style={styles.additionalStatLeft}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={20}
                color={ds.semantic.intent.primary.solid}
                style={{ marginRight: 8 }}
              />
              <Text style={[ds.semantic.typography.body, { color: ds.semantic.text.primary }]}>
                Last Close Call
              </Text>
            </View>
            <Text style={[{ ...ds.semantic.typography.body, fontWeight: '700' as const }, { color: ds.semantic.text.secondary }]}>
              {lastCloseCallText}
            </Text>
          </View>

          {stats.longestStreakDays > 0 && (
            <View style={styles.additionalStatRow}>
              <View style={styles.additionalStatLeft}>
                <MaterialCommunityIcons
                  name="trophy"
                  size={20}
                  color={ds.semantic.intent.warning.solid}
                  style={{ marginRight: 8 }}
                />
                <Text style={[ds.semantic.typography.body, { color: ds.semantic.text.primary }]}>
                  Longest Streak
                </Text>
              </View>
              <Text style={[{ ...ds.semantic.typography.body, fontWeight: '700' as const }, { color: ds.semantic.text.secondary }]}>
                {stats.longestStreakDays} {stats.longestStreakDays === 1 ? 'day' : 'days'}
              </Text>
            </View>
          )}

          {stats.timesProceeded > 0 && (
            <View style={styles.additionalStatRow}>
              <View style={styles.additionalStatLeft}>
                <MaterialCommunityIcons
                  name="information"
                  size={20}
                  color={ds.semantic.text.secondary}
                  style={{ marginRight: 8 }}
                />
                <Text style={[ds.semantic.typography.body, { color: ds.semantic.text.primary }]}>
                  Times Proceeded
                </Text>
              </View>
              <Text style={[{ ...ds.semantic.typography.body, fontWeight: '700' as const }, { color: ds.semantic.text.secondary }]}>
                {stats.timesProceeded}
              </Text>
            </View>
          )}
        </View>

        {/* Encouragement Message */}
        {stats.timesResisted > 0 && (
          <View
            style={[
              styles.encouragementBox,
              {
                backgroundColor: ds.semantic.intent.success.solid + '15',
                marginTop: theme.spacing.md,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="heart"
              size={20}
              color={ds.semantic.intent.success.solid}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                ds.semantic.typography.bodySmall,
                {
                  color: ds.semantic.intent.success.solid,
                  flex: 1,
                  fontWeight: '500',
                },
              ]}
            >
              {getEncouragementMessage(stats)}
            </Text>
          </View>
        )}
      </Card>
    </Animated.View>
  );
}

// ========================================
// Helper Functions
// ========================================

function formatLastCloseCall(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function getEncouragementMessage(stats: CloseCallStats): string {
  if (stats.totalCloseCalls === 0) {
    return "Every choice to resist is progress. You're still fighting, and that matters.";
  }
  const rate = stats.timesResisted / stats.totalCloseCalls;

  if (rate === 1) {
    return "Perfect! You've resisted every single time. That's incredible strength.";
  }
  if (rate >= 0.9) {
    return "Outstanding! You're making powerful choices for your recovery.";
  }
  if (rate >= 0.75) {
    return "Great work! Most of the time, you're choosing recovery. Keep it up!";
  }
  if (rate >= 0.5) {
    return "You're building strength. Every time you resist counts.";
  }
  return "Every choice to resist is progress. You're still fighting, and that matters.";
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resistanceBar: {
    padding: 16,
    borderRadius: 12,
  },
  resistanceBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  additionalStats: {
    gap: 12,
  },
  additionalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  encouragementBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
});
