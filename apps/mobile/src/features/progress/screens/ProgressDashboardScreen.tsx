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

import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, Dimensions } from 'react-native';
import type { ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { GlassCard, SkeletonCard } from '../../../design-system';
import { gradients, aestheticColors } from '../../../design-system/tokens/aesthetic';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { ScreenAnimations } from '../../../design-system/tokens/screen-animations';
import {
  useRecoveryAnalytics,
  type RecoveryInsight,
  type StepProgress,
} from '../hooks/useRecoveryAnalytics';
import { useMoodTrends, type TimeRange } from '../hooks/useMoodTrends';
import { useCravingAnalysis } from '../hooks/useCravingAnalysis';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import { MoodChart } from '../components/MoodChart';
import { CravingChart } from '../components/CravingChart';
import { MoodSummaryCard } from '../components/MoodSummaryCard';
import { CravingHeatmap } from '../components/CravingHeatmap';
import { CravingInsightsCard } from '../components/CravingInsightsCard';
import { CravingSurfStats } from '../components/CravingSurfStats';
import { CommitmentCalendar } from '../components/CommitmentCalendar';
import { RecoveryStrengthCard } from '../components/RecoveryStrengthCard';
import { WeeklyReportCard } from '../components/WeeklyReportCard';
import { WeatherMoodInsight } from '../components/WeatherMoodInsight';
import { useWeeklyReport } from '../hooks/useWeeklyReport';

interface ProgressDashboardScreenProps {
  userId: string;
}

const { width: screenWidth } = Dimensions.get('window');

function _MiniBarChart({
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
                shadowOpacity: (value / maxValue) * 0.5,
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
  const styles = useThemedStyles(createStyles);

  const iconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    positive: 'check-circle',
    warning: 'alert-circle',
    neutral: 'information',
  };

  const colorMap: Record<string, string> = {
    positive: styles.successColor.color,
    warning: styles.warningColor.color,
    neutral: styles.primaryColor.color,
  };

  return (
    <GlassCard intensity="subtle" style={styles.insightCard} accessible={true} accessibilityRole="text">
      <View style={styles.insightHeader}>
        <MaterialCommunityIcons
          name={iconMap[insight.type]}
          size={20}
          color={colorMap[insight.type]}
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
        />
        <Text style={styles.insightTitle}>{insight.title}</Text>
      </View>
      <Text style={styles.insightDescription}>{insight.description}</Text>
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
  const styles = useThemedStyles(createStyles);

  return (
    <GlassCard
      intensity="card"
      style={[
        styles.statCard,
        glow && { shadowColor: color, shadowOpacity: 0.3, shadowRadius: 16 },
      ]}
      glow={glow}
      glowColor={color}
      accessible={true}
      accessibilityLabel={`${label}: ${value}${subtext ? ` ${subtext}` : ''}`}
      accessibilityRole="text"
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtext && <Text style={[styles.statSubtext, { color }]}>{subtext}</Text>}
    </GlassCard>
  );
}

function StepProgressCard({ step }: { step: StepProgress }): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const percent =
    step.totalQuestions > 0 ? Math.round((step.answeredQuestions / step.totalQuestions) * 100) : 0;

  const barColor = step.isComplete
    ? styles.successColor.color
    : percent > 0
      ? aestheticColors.primary[500]
      : styles.textSecondary.color;

  return (
    <View
      style={styles.stepRow}
      accessible={true}
      accessibilityLabel={`Step ${step.stepNumber}: ${step.isComplete ? 'complete' : percent > 0 ? `${percent}% done` : 'not started'}`}
      accessibilityRole="text"
    >
      <View style={styles.stepLabelContainer}>
        {step.isComplete ? (
          <MaterialCommunityIcons name="check-circle" size={18} color={styles.successColor.color} />
        ) : (
          <Text style={styles.stepNumber}>{step.stepNumber}</Text>
        )}
        <Text
          style={[
            styles.stepLabel,
            { color: step.isComplete ? styles.successColor.color : styles.textPrimary.color },
          ]}
        >
          Step {step.stepNumber}
        </Text>
      </View>
      <View style={styles.stepBarContainer}>
        <View style={styles.stepBarBackground}>
          <Animated.View
            entering={ScreenAnimations.fadeDelayed(step.stepNumber * 40)}
            style={[
              styles.stepBarFill,
              {
                width: `${percent}%`,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
      </View>
      <Text style={[styles.stepPercent, { color: barColor }]}>
        {percent === 0 ? 'Not started' : `${percent}%`}
      </Text>
    </View>
  );
}

export function ProgressDashboardScreen({
  userId,
}: ProgressDashboardScreenProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const analytics = useRecoveryAnalytics(userId);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const moodTrends = useMoodTrends(timeRange);
  const cravingAnalysis = useCravingAnalysis(timeRange);
  const weeklyReport = useWeeklyReport();

  if (analytics.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
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
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={styles.alertColor.color} />
          <Text style={styles.errorText}>Unable to load analytics</Text>
          <Text style={styles.errorSubtext}>{analytics.error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />
      <View style={styles.glowOrbTop} pointerEvents="none" accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" />
      <View style={styles.glowOrbBottom} pointerEvents="none" accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
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

          <RecoveryStrengthCard userId={userId} />
          <CommitmentCalendar userId={userId} />
          <WeeklyReportCard
            report={weeklyReport.currentReport}
            previousReport={weeklyReport.pastReports[1] ?? null}
            isLoading={weeklyReport.isLoading}
            isGenerating={weeklyReport.isGenerating}
            onGenerate={weeklyReport.generate}
          />
          <WeatherMoodInsight />

          <Animated.View entering={ScreenAnimations.item(0)}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="chart-timeline-variant-shimmer"
                size={20}
                color={aestheticColors.primary[500]}
              />
              <Text style={styles.sectionTitle}>Mood Dashboard</Text>
            </View>

            <TimeRangeSelector selected={timeRange} onSelect={setTimeRange} />

            {moodTrends.isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : moodTrends.data ? (
              <>
                <MoodSummaryCard data={moodTrends.data} />
                <MoodChart
                  data={moodTrends.data.daily}
                  trend={moodTrends.data.trend}
                  average={moodTrends.data.weeklyAverage}
                />
                <CravingChart
                  data={moodTrends.data.daily}
                  trend={moodTrends.data.cravingTrend}
                  average={moodTrends.data.averageCraving}
                />
              </>
            ) : null}
          </Animated.View>

          {!cravingAnalysis.isLoading && cravingAnalysis.pattern && (
            <Animated.View entering={ScreenAnimations.item(1)}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="brain"
                  size={20}
                  color={aestheticColors.warning.DEFAULT}
                />
                <Text style={styles.sectionTitle}>Craving Patterns</Text>
              </View>

              <CravingHeatmap
                data={cravingAnalysis.heatmap}
                peakHour={cravingAnalysis.pattern.peakHour}
                peakDay={cravingAnalysis.pattern.peakDay}
              />

              {cravingAnalysis.pattern.insights.length > 0 && (
                <CravingInsightsCard
                  insights={cravingAnalysis.pattern.insights}
                  trend={cravingAnalysis.pattern.trend}
                />
              )}

              {cravingAnalysis.surfSummary && (
                <CravingSurfStats summary={cravingAnalysis.surfSummary} />
              )}
            </Animated.View>
          )}

          <Animated.View entering={ScreenAnimations.item(2)} style={styles.insightsSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="stairs"
                size={20}
                color={aestheticColors.primary[500]}
              />
              <Text style={styles.sectionTitle}>Step Work Progress</Text>
              <Text style={styles.stepSummary}>{analytics.totalStepsCompleted}/12 complete</Text>
            </View>

            <GlassCard intensity="subtle" style={styles.stepProgressCard}>
              {analytics.stepProgress.map((step) => (
                <StepProgressCard key={step.stepNumber} step={step} />
              ))}
            </GlassCard>
          </Animated.View>

          <Animated.View entering={ScreenAnimations.item(3)} style={styles.insightsSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={20}
                color={aestheticColors.gold.DEFAULT}
              />
              <Text style={styles.sectionTitle}>Recovery Insights</Text>
            </View>

            {analytics.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </Animated.View>

          <Animated.View entering={ScreenAnimations.fadeDelayed(400)} style={styles.privacyNotice}>
            <MaterialCommunityIcons name="shield-lock" size={14} color={styles.textSecondary.color} />
            <Text style={styles.privacyText}>
              All analytics are calculated on your device. Your data never leaves your phone
              unencrypted.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      flex: 1,
      backgroundColor: ds.semantic.surface.app,
    },
    safeArea: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: ds.space[5],
      paddingBottom: ds.space[10],
    },
    loadingContent: {
      padding: ds.space[5],
      gap: ds.space[4],
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
      padding: ds.space[10],
    },
    errorText: {
      ...ds.typography.body,
      fontWeight: ds.fontWeight.semibold,
      color: ds.semantic.text.primary,
      marginTop: ds.space[4],
    },
    errorSubtext: {
      ...ds.typography.bodySm,
      color: ds.semantic.text.secondary,
      marginTop: ds.space[2],
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: ds.space[5],
      gap: ds.space[3],
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      padding: ds.space[5],
    },
    statIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: ds.space[3],
    },
    statValue: {
      ...ds.typography.h1,
      color: ds.semantic.text.primary,
    },
    statLabel: {
      ...ds.typography.caption,
      color: ds.semantic.text.secondary,
      marginTop: ds.space[1],
    },
    statSubtext: {
      ...ds.typography.micro,
      marginTop: ds.space[0],
    },
    chartContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-evenly',
      paddingHorizontal: ds.space[2],
    },
    bar: {
      borderRadius: 2,
      marginHorizontal: 1,
    },
    insightsSection: {
      marginBottom: ds.space[5],
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[2],
      marginBottom: ds.space[3],
    },
    sectionTitle: {
      ...ds.typography.body,
      fontWeight: ds.fontWeight.semibold,
      color: ds.semantic.text.primary,
    },
    insightCard: {
      marginBottom: ds.space[3],
      padding: ds.space[4],
    },
    insightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[2],
      marginBottom: ds.space[2],
    },
    insightTitle: {
      ...ds.typography.bodySm,
      fontWeight: ds.fontWeight.semibold,
      color: ds.semantic.text.primary,
    },
    insightDescription: {
      ...ds.typography.bodySm,
      color: ds.semantic.text.secondary,
    },
    privacyNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[1],
      paddingHorizontal: ds.space[2],
    },
    privacyText: {
      ...ds.typography.micro,
      color: ds.semantic.text.secondary,
      flex: 1,
    },
    stepProgressCard: {
      padding: ds.space[4],
      gap: ds.space[2],
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[2],
    },
    stepLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[1],
      width: 68,
    },
    stepNumber: {
      ...ds.typography.caption,
      fontWeight: ds.fontWeight.semibold,
      color: ds.semantic.text.secondary,
      width: 18,
      textAlign: 'center',
    },
    stepLabel: {
      ...ds.typography.caption,
      fontWeight: ds.fontWeight.medium,
    },
    stepBarContainer: {
      flex: 1,
    },
    stepBarBackground: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
      backgroundColor: ds.semantic.surface.overlay,
    },
    stepBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    stepPercent: {
      ...ds.typography.micro,
      fontWeight: ds.fontWeight.semibold,
      width: 64,
      textAlign: 'right',
    },
    stepSummary: {
      ...ds.typography.caption,
      color: ds.semantic.text.secondary,
      marginLeft: 'auto',
    },
    textPrimary: { color: ds.semantic.text.primary },
    textSecondary: { color: ds.semantic.text.secondary },
    primaryColor: { color: ds.semantic.intent.primary.solid },
    successColor: { color: ds.semantic.intent.success.solid },
    warningColor: { color: ds.semantic.intent.warning.solid },
    alertColor: { color: ds.semantic.intent.alert.solid },
  }) as const;
