/**
 * CloseCallInsights Component
 * 
 * Displays statistics and insights about close calls
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Card, useTheme } from '../../../design-system';
import type { CloseCallStats } from '../hooks';

interface CloseCallInsightsProps {
  stats: CloseCallStats;
  style?: StyleProp<ViewStyle>;
}

export function CloseCallInsights({ stats, style }: CloseCallInsightsProps): React.ReactElement {
  const theme = useTheme();

  const resistanceRate =
    stats.totalCloseCalls > 0
      ? Math.round((stats.timesResisted / stats.totalCloseCalls) * 100)
      : 0;

  const lastCloseCallText = stats.lastCloseCall
    ? formatLastCloseCall(stats.lastCloseCall)
    : 'Never';

  return (
    <Animated.View entering={FadeIn.duration(400)} style={style}>
      <Card variant="elevated" style={styles.card}>
        <Text
          style={[
            theme.typography.h3,
            { color: theme.colors.text, marginBottom: theme.spacing.md },
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
              style={[
                styles.statIconContainer,
                { backgroundColor: theme.colors.warning + '20' },
              ]}
            >
              <MaterialCommunityIcons
                name="alert-circle"
                size={28}
                color={theme.colors.warning}
              />
            </View>
            <Text style={[theme.typography.h1, { color: theme.colors.text, marginTop: 8 }]}>
              {stats.totalCloseCalls}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Close Calls
            </Text>
          </View>

          {/* Times Resisted */}
          <View style={styles.statBox}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: theme.colors.success + '20' },
              ]}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={28}
                color={theme.colors.success}
              />
            </View>
            <Text style={[theme.typography.h1, { color: theme.colors.success, marginTop: 8 }]}>
              {stats.timesResisted}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Times Resisted
            </Text>
          </View>
        </View>

        {/* Resistance Rate */}
        {stats.totalCloseCalls > 0 && (
          <View
            style={[
              styles.resistanceBar,
              { backgroundColor: theme.colors.background, marginTop: theme.spacing.md },
            ]}
          >
            <View style={styles.resistanceBarHeader}>
              <Text style={[theme.typography.labelLarge, { color: theme.colors.text }]}>
                Resistance Rate
              </Text>
              <Text
                style={[theme.typography.h2, { color: theme.colors.success, fontWeight: 'bold' }]}
              >
                {resistanceRate}%
              </Text>
            </View>
            <View
              style={[
                styles.progressBarContainer,
                { backgroundColor: theme.colors.border },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: theme.colors.success,
                    width: `${resistanceRate}%`,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' },
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
                color={theme.colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                Last Close Call
              </Text>
            </View>
            <Text style={[theme.typography.bodyBold, { color: theme.colors.textSecondary }]}>
              {lastCloseCallText}
            </Text>
          </View>

          {stats.longestStreakDays > 0 && (
            <View style={styles.additionalStatRow}>
              <View style={styles.additionalStatLeft}>
                <MaterialCommunityIcons
                  name="trophy"
                  size={20}
                  color={theme.colors.warning}
                  style={{ marginRight: 8 }}
                />
                <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                  Longest Streak
                </Text>
              </View>
              <Text style={[theme.typography.bodyBold, { color: theme.colors.textSecondary }]}>
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
                  color={theme.colors.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                  Times Proceeded
                </Text>
              </View>
              <Text style={[theme.typography.bodyBold, { color: theme.colors.textSecondary }]}>
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
                backgroundColor: theme.colors.success + '15',
                marginTop: theme.spacing.md,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="heart"
              size={20}
              color={theme.colors.success}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                theme.typography.bodySmall,
                { color: theme.colors.success, flex: 1, fontWeight: '500' },
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
