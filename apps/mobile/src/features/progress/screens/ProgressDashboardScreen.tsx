/**
 * Progress Dashboard Screen
 * Visualizes recovery progress with mood trends, craving patterns, and insights
 *
 * Features:
 * - Mood trend visualization (last 30 days)
 * - Craving pattern chart
 * - Step work progress overview
 * - Check-in and journal streaks
 * - Personalized recovery insights
 *
 * All data is decrypted client-side for privacy.
 */

import React from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, Card, Badge, ProgressBar } from '../../../design-system';
import { useRecoveryAnalytics, type RecoveryInsight } from '../hooks/useRecoveryAnalytics';

interface ProgressDashboardScreenProps {
  userId: string;
}

const { width: screenWidth } = Dimensions.get('window');

// Simple bar chart component (no external dependency needed)
function MiniBarChart({
  data,
  maxValue,
  color,
  height = 60,
}: {
  data: number[];
  maxValue: number;
  color: string;
  height?: number;
}): React.ReactElement {
  const _theme = useTheme();
  const barWidth = Math.max(4, (screenWidth - 100) / Math.max(data.length, 1) - 2);

  return (
    <View style={[styles.chartContainer, { height }]}>
      {data.map((value, index) => {
        const barHeight = maxValue > 0 ? (value / maxValue) * height : 0;
        return (
          <View
            key={index}
            style={[
              styles.bar,
              {
                width: barWidth,
                height: Math.max(2, barHeight),
                backgroundColor: color,
                opacity: 0.3 + (value / maxValue) * 0.7,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function InsightCard({ insight }: { insight: RecoveryInsight }): React.ReactElement {
  const theme = useTheme();

  const iconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    positive: 'check-circle',
    warning: 'alert-circle',
    neutral: 'information',
  };

  const colorMap: Record<string, string> = {
    positive: theme.colors.success,
    warning: theme.colors.warning,
    neutral: theme.colors.primary,
  };

  return (
    <Card variant="outlined" style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <MaterialCommunityIcons
          name={iconMap[insight.type]}
          size={20}
          color={colorMap[insight.type]}
        />
        <Text style={[styles.insightTitle, { color: theme.colors.text }]}>{insight.title}</Text>
      </View>
      <Text style={[styles.insightDescription, { color: theme.colors.textSecondary }]}>
        {insight.description}
      </Text>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
}): React.ReactElement {
  const theme = useTheme();

  return (
    <Card variant="elevated" style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      {subtext && <Text style={[styles.statSubtext, { color }]}>{subtext}</Text>}
    </Card>
  );
}

export function ProgressDashboardScreen({
  userId,
}: ProgressDashboardScreenProps): React.ReactElement {
  const theme = useTheme();
  const analytics = useRecoveryAnalytics(userId);

  if (analytics.isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Analyzing your recovery data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (analytics.error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.danger} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Unable to load analytics
          </Text>
          <Text style={[styles.errorSubtext, { color: theme.colors.textSecondary }]}>
            {analytics.error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Prepare chart data
  const moodValues = analytics.moodData.map((d) => d.mood);
  const cravingValues = analytics.moodData.map((d) => d.craving);

  // Get trend icons
  const moodTrendIcon: keyof typeof MaterialCommunityIcons.glyphMap =
    analytics.moodTrend === 'improving'
      ? 'trending-up'
      : analytics.moodTrend === 'declining'
        ? 'trending-down'
        : 'minus';

  const cravingTrendIcon: keyof typeof MaterialCommunityIcons.glyphMap =
    analytics.cravingTrend === 'improving'
      ? 'trending-down'
      : analytics.cravingTrend === 'worsening'
        ? 'trending-up'
        : 'minus';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        accessibilityRole="scrollbar"
        accessibilityLabel="Progress dashboard content"
      >
        {/* Header Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="fire"
            label="Check-in Streak"
            value={analytics.checkInStreak}
            subtext={analytics.checkInStreak > 0 ? 'days' : undefined}
            color={theme.colors.warning}
          />
          <StatCard
            icon="book-open-variant"
            label="Journal Streak"
            value={analytics.journalStreak}
            subtext={analytics.journalStreak > 0 ? 'days' : undefined}
            color={theme.colors.primary}
          />
        </View>

        {/* Mood Trend Card */}
        <Card variant="elevated" style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons
                name="emoticon-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Mood Trend</Text>
            </View>
            <View style={styles.trendBadge}>
              <MaterialCommunityIcons
                name={moodTrendIcon}
                size={16}
                color={
                  analytics.moodTrend === 'improving'
                    ? theme.colors.success
                    : analytics.moodTrend === 'declining'
                      ? theme.colors.danger
                      : theme.colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.trendText,
                  {
                    color:
                      analytics.moodTrend === 'improving'
                        ? theme.colors.success
                        : analytics.moodTrend === 'declining'
                          ? theme.colors.danger
                          : theme.colors.textSecondary,
                  },
                ]}
              >
                {analytics.moodTrend}
              </Text>
            </View>
          </View>

          {moodValues.length > 0 ? (
            <>
              <MiniBarChart data={moodValues} maxValue={5} color={theme.colors.primary} />
              <View style={styles.chartLegend}>
                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
                  Last {moodValues.length} days
                </Text>
                <Text style={[styles.averageText, { color: theme.colors.text }]}>
                  Avg: {analytics.averageMood.toFixed(1)}/5
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={[styles.emptyChartText, { color: theme.colors.textSecondary }]}>
                Complete check-ins to see your mood trend
              </Text>
            </View>
          )}
        </Card>

        {/* Craving Trend Card */}
        <Card variant="elevated" style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={20}
                color={theme.colors.warning}
              />
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Craving Levels</Text>
            </View>
            <View style={styles.trendBadge}>
              <MaterialCommunityIcons
                name={cravingTrendIcon}
                size={16}
                color={
                  analytics.cravingTrend === 'improving'
                    ? theme.colors.success
                    : analytics.cravingTrend === 'worsening'
                      ? theme.colors.danger
                      : theme.colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.trendText,
                  {
                    color:
                      analytics.cravingTrend === 'improving'
                        ? theme.colors.success
                        : analytics.cravingTrend === 'worsening'
                          ? theme.colors.danger
                          : theme.colors.textSecondary,
                  },
                ]}
              >
                {analytics.cravingTrend}
              </Text>
            </View>
          </View>

          {cravingValues.length > 0 ? (
            <>
              <MiniBarChart data={cravingValues} maxValue={10} color={theme.colors.warning} />
              <View style={styles.chartLegend}>
                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
                  Last {cravingValues.length} days
                </Text>
                <Text style={[styles.averageText, { color: theme.colors.text }]}>
                  Avg: {analytics.averageCraving.toFixed(1)}/10
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={[styles.emptyChartText, { color: theme.colors.textSecondary }]}>
                Log cravings in evening check-ins to track patterns
              </Text>
            </View>
          )}
        </Card>

        {/* Step Work Progress */}
        <Card variant="elevated" style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons name="stairs" size={20} color={theme.colors.secondary} />
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Step Work Progress
              </Text>
            </View>
            <Badge variant={analytics.totalStepsCompleted > 0 ? 'success' : 'muted'}>
              {analytics.totalStepsCompleted}/12 Complete
            </Badge>
          </View>

          <View style={styles.stepsGrid}>
            {analytics.stepProgress.slice(0, 4).map((step) => {
              const progress =
                step.totalQuestions > 0 ? step.answeredQuestions / step.totalQuestions : 0;

              return (
                <View key={step.stepNumber} style={styles.stepItem}>
                  <View style={styles.stepHeader}>
                    <Text style={[styles.stepNumber, { color: theme.colors.text }]}>
                      Step {step.stepNumber}
                    </Text>
                    {step.isComplete && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={16}
                        color={theme.colors.success}
                      />
                    )}
                  </View>
                  <ProgressBar
                    progress={progress}
                    color={step.isComplete ? theme.colors.success : theme.colors.primary}
                    style={styles.stepProgress}
                  />
                  <Text style={[styles.stepProgressText, { color: theme.colors.textSecondary }]}>
                    {step.answeredQuestions}/{step.totalQuestions}
                  </Text>
                </View>
              );
            })}
          </View>

          {analytics.totalStepsStarted === 0 && (
            <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
              Start your step work to track progress here
            </Text>
          )}
        </Card>

        {/* Recovery Insights */}
        <View style={styles.insightsSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={20}
              color={theme.colors.warning}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Recovery Insights
            </Text>
          </View>

          {analytics.insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}
        </View>

        {/* Summary Stats */}
        <Card variant="outlined" style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
            Your Recovery Summary
          </Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                {analytics.totalCheckIns}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Total Check-ins
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                {analytics.journalEntryCount}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Journal Entries
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                {analytics.totalStepsStarted}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Steps Started
              </Text>
            </View>
          </View>
        </Card>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <MaterialCommunityIcons name="shield-lock" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.privacyText, { color: theme.colors.textSecondary }]}>
            All analytics are calculated on your device. Your data never leaves your phone
            unencrypted.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  chartCard: {
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
  },
  bar: {
    borderRadius: 2,
    marginHorizontal: 1,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  legendText: {
    fontSize: 12,
  },
  averageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyChart: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    textAlign: 'center',
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stepItem: {
    width: '48%',
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  stepProgress: {
    height: 6,
    borderRadius: 3,
  },
  stepProgressText: {
    fontSize: 11,
    marginTop: 4,
  },
  helpText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  insightsSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  insightCard: {
    marginBottom: 12,
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  summaryCard: {
    marginBottom: 16,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  privacyText: {
    fontSize: 11,
    flex: 1,
  },
});
