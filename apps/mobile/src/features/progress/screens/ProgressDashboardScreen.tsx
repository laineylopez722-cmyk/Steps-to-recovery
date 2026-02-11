/**
 * Progress Dashboard Screen - Organic Calming + Dark Luxury
 * 
 * Features:
 * - Glass stat cards with glow
 * - Animated chart bars
 * - Skeleton loading states
 * - Atmospheric gradients
 * - Premium milestone effects
 */

import React from 'react';
import { ScrollView, StyleSheet, View, Text, Dimensions } from 'react-native';
import type { ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useTheme, GlassCard, SkeletonCard } from '../../../design-system';
import { gradients, aestheticColors } from '../../../design-system/tokens/aesthetic';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { ScreenAnimations } from '../../../design-system/tokens/screen-animations';
import { useRecoveryAnalytics, type RecoveryInsight } from '../hooks/useRecoveryAnalytics';

interface ProgressDashboardScreenProps {
  userId: string;
}

const { width: screenWidth } = Dimensions.get('window');

// Mini bar chart with animation
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
  const styles = useThemedStyles(createStyles);
  const barWidth = Math.max(4, (screenWidth - 120) / Math.max(data.length, 1) - 2);

  return (
    <View style={[styles.chartContainer, { height }]}>
      {data.map((value, index) => {
        const barHeight = maxValue > 0 ? (value / maxValue) * height : 0;
        return (
          <Animated.View
            key={index}
            entering={ScreenAnimations.fadeDelayed(index * 30)}
            style={[
              styles.bar,
              {
                width: barWidth,
                height: Math.max(2, barHeight),
                backgroundColor: color,
                opacity: 0.3 + (value / maxValue) * 0.7,
                shadowColor: color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: value / maxValue * 0.5,
                shadowRadius: 4,
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
  const styles = useThemedStyles(createStyles);

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
    <GlassCard intensity="subtle" style={styles.insightCard}>
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
    </GlassCard>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
  glow = false,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
  glow?: boolean;
}): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <GlassCard 
      intensity="card"
      style={[styles.statCard, glow && { shadowColor: color, shadowOpacity: 0.3, shadowRadius: 16 }]}
      glow={glow}
      glowColor={color}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      {subtext && <Text style={[styles.statSubtext, { color }]}>{subtext}</Text>}
    </GlassCard>
  );
}

export function ProgressDashboardScreen({
  userId,
}: ProgressDashboardScreenProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const analytics = useRecoveryAnalytics(userId);

  // Loading state
  if (analytics.isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />
        <ScrollView contentContainerStyle={styles.loadingContent}>
          <View style={styles.statsRow}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (analytics.error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />
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

  const moodValues = analytics.moodData.map((d) => d.mood);
  const cravingValues = analytics.moodData.map((d) => d.craving);

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
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />
      
      {/* Glow Orbs */}
      <View style={styles.glowOrbTop} pointerEvents="none" />
      <View style={styles.glowOrbBottom} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Stats Row */}
          <Animated.View entering={ScreenAnimations.entrance} style={styles.statsRow}>
            <StatCard
              icon="fire"
              label="Check-in Streak"
              value={analytics.checkInStreak}
              subtext={analytics.checkInStreak > 0 ? 'days' : undefined}
              color={aestheticColors.gold.DEFAULT}
              glow={analytics.checkInStreak > 7}
            />
            <StatCard
              icon="book-open-variant"
              label="Journal Streak"
              value={analytics.journalStreak}
              subtext={analytics.journalStreak > 0 ? 'days' : undefined}
              color={aestheticColors.primary[500]}
            />
          </Animated.View>

          {/* Mood Trend Card */}
          <Animated.View entering={ScreenAnimations.item(0)}>
            <GlassCard intensity="card" style={styles.chartCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <MaterialCommunityIcons
                    name="emoticon-outline"
                    size={20}
                    color={aestheticColors.primary[500]}
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
                  <MiniBarChart data={moodValues} maxValue={5} color={aestheticColors.primary[500]} />
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
            </GlassCard>
          </Animated.View>

          {/* Craving Trend Card */}
          <Animated.View entering={ScreenAnimations.item(1)}>
            <GlassCard intensity="card" style={styles.chartCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={20}
                    color={aestheticColors.warning.DEFAULT}
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
                  <MiniBarChart data={cravingValues} maxValue={10} color={aestheticColors.warning.DEFAULT} />
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
            </GlassCard>
          </Animated.View>

          {/* Recovery Insights */}
          <Animated.View entering={ScreenAnimations.item(2)} style={styles.insightsSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={20}
                color={aestheticColors.gold.DEFAULT}
              />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Recovery Insights
              </Text>
            </View>

            {analytics.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </Animated.View>

          {/* Privacy Notice */}
          <Animated.View entering={ScreenAnimations.fadeDelayed(400)} style={styles.privacyNotice}>
            <MaterialCommunityIcons name="shield-lock" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.privacyText, { color: theme.colors.textSecondary }]}>
              All analytics are calculated on your device. Your data never leaves your phone
              unencrypted.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (ds: DS) => ({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContent: {
    padding: 20,
    gap: 16,
  },
  glowOrbTop: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: aestheticColors.gold.DEFAULT,
    opacity: 0.05,
  } as ViewStyle,
  glowOrbBottom: {
    position: 'absolute',
    bottom: 100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: aestheticColors.secondary[500],
    opacity: 0.04,
  } as ViewStyle,
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
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
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
    marginBottom: 20,
    padding: 20,
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
    borderTopColor: ds.colors.borderSubtle,
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
  insightsSection: {
    marginBottom: 20,
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
} as const);
