/**
 * Weekly Report Screen
 * Comprehensive weekly recovery summary
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button } from '../components/ui';
import { useSobriety } from '../lib/hooks/useSobriety';
import { useMeetings } from '../lib/hooks/useMeetings';
import { useAchievements } from '../lib/hooks/useAchievements';
import { useContactStore, useStepWorkStore } from '../lib/store';
import {
  generateWeeklyReport,
  formatReportForSponsor,
  type WeeklyReport,
} from '../lib/services/weeklyReport';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

// Stat card component
function StatCard({
  icon,
  label,
  value,
  subtext,
  color = '#60a5fa',
  trend,
}: {
  icon: FeatherIconName;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
}) {
  const trendIcon: Record<string, FeatherIconName> = {
    up: 'trending-up',
    down: 'trending-down',
    stable: 'minus',
  };
  const trendColor: Record<string, string> = {
    up: '#4ade80',
    down: '#f87171',
    stable: '#94a3b8',
  };

  return (
    <View className="bg-navy-800/40 rounded-xl p-4 border border-surface-700/30 flex-1">
      <View className="flex-row items-center justify-between mb-2">
        <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Feather name={icon} size={16} color={color} />
        </View>
        {trend && (
          <Feather name={trendIcon[trend]} size={16} color={trendColor[trend]} />
        )}
      </View>
      <Text className="text-white text-2xl font-bold">{value}</Text>
      <Text className="text-surface-400 text-xs">{label}</Text>
      {subtext && <Text className="text-surface-500 text-xs mt-1">{subtext}</Text>}
    </View>
  );
}

// Section component
function Section({
  icon,
  title,
  children,
}: {
  icon: FeatherIconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6">
      <View className="flex-row items-center gap-2 mb-3">
        <Feather name={icon} size={18} color="#60a5fa" />
        <Text className="text-white font-semibold">{title}</Text>
      </View>
      {children}
    </View>
  );
}

// Highlight item component
function HighlightItem({ text, type }: { text: string; type: 'highlight' | 'growth' }) {
  const icon: FeatherIconName = type === 'highlight' ? 'star' : 'target';
  const color = type === 'highlight' ? '#4ade80' : '#fbbf24';

  return (
    <View className="flex-row items-start gap-2 mb-2">
      <Feather name={icon} size={14} color={color} style={{ marginTop: 2 }} />
      <Text className="text-surface-300 text-sm flex-1">{text}</Text>
    </View>
  );
}

export default function WeeklyReportScreen() {
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { profile, soberDays } = useSobriety();
  const { meetings: meetingLogs } = useMeetings();
  const { achievements, keytags } = useAchievements();
  const { sponsor } = useContactStore();
  const { progress: stepProgress } = useStepWorkStore();

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const generatedReport = await generateWeeklyReport(
        soberDays,
        meetingLogs.map(m => ({ date: m.attendedAt, didShare: m.didShare })),
        stepProgress.map(p => ({
          stepNumber: p.stepNumber,
          answeredQuestions: p.questionsAnswered,
          totalQuestions: p.totalQuestions,
        })),
        achievements.map(a => ({ id: a.id, title: a.title, unlockedAt: a.unlockedAt })),
        keytags.map(kt => ({
          name: kt.title,
          daysRequired: kt.days,
          isEarned: kt.isEarned,
        })),
        sponsor?.lastContactedAt
      );
      setReport(generatedReport);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareWithSponsor = async () => {
    if (!report) return;
    
    try {
      const message = formatReportForSponsor(report, profile?.displayName);
      await Share.share({
        message,
        title: 'Weekly Recovery Report',
      });
    } catch (err) {
      // User cancelled or error
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-navy-950 items-center justify-center">
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text className="text-surface-400 mt-4">Generating your report...</Text>
      </SafeAreaView>
    );
  }

  if (error || !report) {
    return (
      <SafeAreaView className="flex-1 bg-navy-950 items-center justify-center px-4">
        <Feather name="alert-circle" size={48} color="#f87171" />
        <Text className="text-white text-lg font-semibold mt-4">Unable to Generate Report</Text>
        <Text className="text-surface-400 text-center mt-2">{error}</Text>
        <Button title="Try Again" onPress={loadReport} className="mt-6" />
      </SafeAreaView>
    );
  }

  const moodTrendIcon = report.moodTrend === 'improving' ? 'up' : report.moodTrend === 'declining' ? 'down' : 'stable';
  const cravingTrendIcon = report.cravingTrend === 'improving' ? 'up' : report.cravingTrend === 'worsening' ? 'down' : 'stable';

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-surface-700/30">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Weekly Report</Text>
        <TouchableOpacity
          onPress={handleShareWithSponsor}
          className="p-2"
          accessibilityRole="button"
          accessibilityLabel="Share with sponsor"
        >
          <Feather name="share-2" size={22} color="#60a5fa" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Header card */}
        <View className="bg-primary-500/10 rounded-2xl p-5 mb-6 border border-primary-500/30">
          <View className="flex-row items-center gap-3 mb-3">
            <Feather name="calendar" size={24} color="#60a5fa" />
            <View>
              <Text className="text-white font-semibold text-lg">
                Week of {report.weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <Text className="text-surface-400 text-sm">
                {report.weekStartDate.toLocaleDateString()} - {report.weekEndDate.toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          <View className="bg-navy-900/60 rounded-xl p-4">
            <Text className="text-primary-400 text-sm uppercase tracking-wider mb-1">Clean Time</Text>
            <Text className="text-white text-4xl font-bold">{report.soberDays} days</Text>
          </View>
        </View>

        {/* Check-in Stats */}
        <Section icon="check-circle" title="Check-ins">
          <View className="flex-row gap-3 mb-3">
            <StatCard
              icon="calendar"
              label="Days Checked In"
              value={`${report.checkinCount}/7`}
              subtext={`${report.checkinRate}% rate`}
              color="#4ade80"
            />
            <StatCard
              icon="smile"
              label="Avg Mood"
              value={report.averageMood.toFixed(1)}
              subtext="/10"
              color="#fbbf24"
              trend={moodTrendIcon as 'up' | 'down' | 'stable'}
            />
          </View>
          <View className="flex-row gap-3">
            <StatCard
              icon="activity"
              label="Avg Craving"
              value={report.averageCraving.toFixed(1)}
              subtext="/10"
              color={report.averageCraving > 5 ? '#f87171' : '#4ade80'}
              trend={cravingTrendIcon as 'up' | 'down' | 'stable'}
            />
            <View className="flex-1" />
          </View>
          
          {report.highestMoodDay && report.lowestMoodDay && (
            <View className="bg-navy-800/40 rounded-xl p-3 mt-3 border border-surface-700/30">
              <Text className="text-surface-400 text-xs mb-2">Mood Range</Text>
              <View className="flex-row justify-between">
                <Text className="text-surface-300 text-sm">
                  Best: {report.highestMoodDay.day} ({report.highestMoodDay.mood}/10)
                </Text>
                <Text className="text-surface-300 text-sm">
                  Low: {report.lowestMoodDay.day} ({report.lowestMoodDay.mood}/10)
                </Text>
              </View>
            </View>
          )}
        </Section>

        {/* Meeting Stats */}
        <Section icon="users" title="Meetings">
          <View className="flex-row gap-3">
            <StatCard
              icon="map-pin"
              label="Attended"
              value={report.meetingsAttended}
              subtext={`Goal: ${report.meetingGoal}`}
              color={report.meetingGoalMet ? '#4ade80' : '#fbbf24'}
            />
            <StatCard
              icon="mic"
              label="Shared"
              value={report.sharesAtMeetings}
              subtext="times"
              color="#a78bfa"
            />
          </View>
          {report.meetingGoalMet && (
            <View className="bg-success-500/10 rounded-xl p-3 mt-3 border border-success-500/30 flex-row items-center gap-2">
              <Feather name="check-circle" size={16} color="#4ade80" />
              <Text className="text-success-400 text-sm">Meeting goal achieved!</Text>
            </View>
          )}
        </Section>

        {/* Fellowship */}
        <Section icon="phone" title="Fellowship Connection">
          <View className="flex-row gap-3">
            <StatCard
              icon="phone-call"
              label="Phone Calls"
              value={report.phoneCalls}
              color="#60a5fa"
            />
            <StatCard
              icon="user"
              label="Sponsor Contact"
              value={report.sponsorContacts > 0 ? '✓' : '—'}
              color={report.sponsorContacts > 0 ? '#4ade80' : '#94a3b8'}
            />
          </View>
        </Section>

        {/* Step Work & Reading */}
        <Section icon="book-open" title="Step Work & Reading">
          <View className="flex-row gap-3">
            <StatCard
              icon="bookmark"
              label="Current Step"
              value={report.currentStep}
              subtext={`${report.stepProgress}% complete`}
              color="#fb923c"
            />
            <StatCard
              icon="book"
              label="Reading Streak"
              value={report.readingStreak}
              subtext="days"
              color="#4ade80"
            />
          </View>
        </Section>

        {/* Achievements */}
        {(report.achievementsUnlocked.length > 0 || report.keytagEarned) && (
          <Section icon="award" title="Achievements This Week">
            <View className="bg-navy-800/40 rounded-xl p-4 border border-surface-700/30">
              {report.keytagEarned && (
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-2xl">🔑</Text>
                  <Text className="text-white font-medium">Earned {report.keytagEarned} keytag!</Text>
                </View>
              )}
              {report.achievementsUnlocked.map((achievement, i) => (
                <View key={i} className="flex-row items-center gap-2 mb-1">
                  <Feather name="star" size={14} color="#fbbf24" />
                  <Text className="text-surface-300">{achievement}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Highlights */}
        {report.highlights.length > 0 && (
          <Section icon="star" title="Highlights">
            <View className="bg-success-500/10 rounded-xl p-4 border border-success-500/30">
              {report.highlights.map((highlight, i) => (
                <HighlightItem key={i} text={highlight} type="highlight" />
              ))}
            </View>
          </Section>
        )}

        {/* Areas for Growth */}
        {report.areasForGrowth.length > 0 && (
          <Section icon="crosshair" title="Areas for Growth">
            <View className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
              {report.areasForGrowth.map((area, i) => (
                <HighlightItem key={i} text={area} type="growth" />
              ))}
            </View>
          </Section>
        )}

        {/* Encouragement */}
        <View className="bg-primary-500/10 rounded-2xl p-5 mb-8 border border-primary-500/30">
          <View className="flex-row items-center gap-2 mb-2">
            <Feather name="heart" size={18} color="#60a5fa" />
            <Text className="text-primary-400 font-semibold">Weekly Encouragement</Text>
          </View>
          <Text className="text-white leading-6">{report.encouragement}</Text>
        </View>

        {/* Share button */}
        <Button
          title="Share with Sponsor"
          onPress={handleShareWithSponsor}
          icon="share-2"
          variant="outline"
        />

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

