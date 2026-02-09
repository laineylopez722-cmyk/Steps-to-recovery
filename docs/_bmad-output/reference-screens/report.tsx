/**
 * Weekly Recovery Report Screen
 * Auto-generated summary of the user's recovery journey
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, Button } from '../components/ui';
import { useSobriety } from '../lib/hooks/useSobriety';
import { useCheckin } from '../lib/hooks/useCheckin';
import { useJournalStore } from '../lib/store';

interface WeeklyStats {
  soberDays: number;
  weekStart: Date;
  weekEnd: Date;
  checkinCount: number;
  checkinRate: number;
  avgMood: number;
  avgCraving: number;
  moodTrend: 'up' | 'down' | 'stable';
  cravingTrend: 'up' | 'down' | 'stable';
  journalEntries: number;
  topEmotions: string[];
  highlights: string[];
  challenges: string[];
}

export default function ReportScreen() {
  const router = useRouter();
  const { soberDays, nextMilestone, daysUntilNextMilestone, profile } = useSobriety();
  const { history, averageMood, averageCraving, checkinStreak } = useCheckin();
  const { entries } = useJournalStore();

  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = () => {
    setIsLoading(true);

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    // Get this week's check-ins
    const weekCheckins = history.filter((c) => {
      const checkinDate = new Date(c.date);
      return checkinDate >= weekStart && checkinDate <= now;
    });

    // Get this week's journal entries
    const weekEntries = entries.filter((e) => {
      const entryDate = new Date(e.createdAt);
      return entryDate >= weekStart && entryDate <= now;
    });

    // Calculate mood and craving averages for this week
    const weekMoods = weekCheckins.map((c) => c.mood).filter(Boolean);
    const weekCravings = weekCheckins.map((c) => c.cravingLevel).filter((c) => c !== undefined);
    
    const avgWeekMood = weekMoods.length > 0
      ? weekMoods.reduce((a, b) => a + b, 0) / weekMoods.length
      : 0;
    const avgWeekCraving = weekCravings.length > 0
      ? weekCravings.reduce((a, b) => a + b, 0) / weekCravings.length
      : 0;

    // Determine trends (comparing first half to second half of week)
    const midPoint = Math.floor(weekCheckins.length / 2);
    const firstHalf = weekCheckins.slice(0, midPoint);
    const secondHalf = weekCheckins.slice(midPoint);

    const firstHalfMood = firstHalf.length > 0
      ? firstHalf.reduce((a, c) => a + c.mood, 0) / firstHalf.length
      : 0;
    const secondHalfMood = secondHalf.length > 0
      ? secondHalf.reduce((a, c) => a + c.mood, 0) / secondHalf.length
      : 0;

    const moodTrend: 'up' | 'down' | 'stable' = 
      secondHalfMood > firstHalfMood + 0.5 ? 'up' :
      secondHalfMood < firstHalfMood - 0.5 ? 'down' : 'stable';

    const firstHalfCraving = firstHalf.length > 0
      ? firstHalf.reduce((a, c) => a + c.cravingLevel, 0) / firstHalf.length
      : 0;
    const secondHalfCraving = secondHalf.length > 0
      ? secondHalf.reduce((a, c) => a + c.cravingLevel, 0) / secondHalf.length
      : 0;

    const cravingTrend: 'up' | 'down' | 'stable' = 
      secondHalfCraving > firstHalfCraving + 0.5 ? 'up' :
      secondHalfCraving < firstHalfCraving - 0.5 ? 'down' : 'stable';

    // Get top emotions from journal entries
    const allEmotions: string[] = weekEntries.flatMap((e) => e.emotionTags);
    const emotionCounts = allEmotions.reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion]) => emotion);

    // Generate highlights and challenges
    const highlights: string[] = [];
    const challenges: string[] = [];

    if (soberDays >= 7) {
      highlights.push(`${soberDays} days of sobriety`);
    }
    if (checkinStreak >= 3) {
      highlights.push(`${checkinStreak}-day check-in streak`);
    }
    if (weekEntries.length >= 3) {
      highlights.push(`${weekEntries.length} journal entries this week`);
    }
    if (avgWeekMood >= 7) {
      highlights.push('Consistently positive mood');
    }
    if (avgWeekCraving <= 3 && weekCravings.length > 0) {
      highlights.push('Low craving levels');
    }

    if (avgWeekCraving >= 6) {
      challenges.push('Higher craving levels this week');
    }
    if (avgWeekMood <= 4 && weekMoods.length > 0) {
      challenges.push('Mood has been challenging');
    }
    if (weekCheckins.length < 4) {
      challenges.push('Fewer check-ins than usual');
    }

    setStats({
      soberDays,
      weekStart,
      weekEnd: now,
      checkinCount: weekCheckins.length,
      checkinRate: Math.round((weekCheckins.length / 7) * 100),
      avgMood: avgWeekMood,
      avgCraving: avgWeekCraving,
      moodTrend,
      cravingTrend,
      journalEntries: weekEntries.length,
      topEmotions,
      highlights,
      challenges,
    });

    setIsLoading(false);
  };

  const handleShare = async () => {
    if (!stats) return;

    const message = `🌱 My Weekly Recovery Report

📅 Week of ${stats.weekStart.toLocaleDateString()} - ${stats.weekEnd.toLocaleDateString()}

💪 ${stats.soberDays} days sober
✅ ${stats.checkinCount}/7 check-ins completed
😊 Average mood: ${stats.avgMood.toFixed(1)}/10
📝 ${stats.journalEntries} journal entries

Progress, not perfection. One day at a time.

— Recovery Companion 🌱`;

    try {
      await Share.share({ message });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', inverted = false) => {
    if (trend === 'up') return inverted ? '📉' : '📈';
    if (trend === 'down') return inverted ? '📈' : '📉';
    return '➡️';
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable', inverted = false) => {
    if (trend === 'up') return inverted ? 'text-red-500' : 'text-green-500';
    if (trend === 'down') return inverted ? 'text-green-500' : 'text-red-500';
    return 'text-surface-500';
  };

  if (isLoading || !stats) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-surface-500 mt-4">Generating your report...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary-600 text-base">← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View className="items-center mb-6">
          <Text className="text-3xl mb-2">📊</Text>
          <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Weekly Report
          </Text>
          <Text className="text-surface-500 text-center">
            {stats.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
            {stats.weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>

        {/* Sobriety Highlight */}
        <Card variant="elevated" className="mb-6 bg-primary-50 dark:bg-primary-900/20">
          <View className="items-center">
            <Text className="text-6xl font-bold text-primary-600 dark:text-primary-400">
              {stats.soberDays}
            </Text>
            <Text className="text-lg text-primary-800 dark:text-primary-200">
              Days Sober
            </Text>
            {nextMilestone && daysUntilNextMilestone && (
              <Text className="text-sm text-primary-600 dark:text-primary-400 mt-2">
                🎯 {daysUntilNextMilestone} days to "{nextMilestone.title}"
              </Text>
            )}
          </View>
        </Card>

        {/* Stats Grid */}
        <View className="flex-row gap-3 mb-6">
          <Card variant="default" className="flex-1">
            <View className="items-center">
              <Text className="text-3xl font-bold text-primary-600">
                {stats.checkinCount}/7
              </Text>
              <Text className="text-sm text-surface-500">Check-ins</Text>
              <Text className="text-xs text-surface-400 mt-1">
                {stats.checkinRate}% rate
              </Text>
            </View>
          </Card>
          <Card variant="default" className="flex-1">
            <View className="items-center">
              <Text className="text-3xl font-bold text-secondary-600">
                {stats.journalEntries}
              </Text>
              <Text className="text-sm text-surface-500">Journal Entries</Text>
            </View>
          </Card>
        </View>

        {/* Mood & Craving */}
        <Card variant="default" className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-1">
              <Text className="text-sm text-surface-500">Average Mood</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {stats.avgMood.toFixed(1)}/10
                </Text>
                <Text>{getTrendIcon(stats.moodTrend)}</Text>
              </View>
              <Text className={`text-xs ${getTrendColor(stats.moodTrend)}`}>
                {stats.moodTrend === 'up' ? 'Improving' : 
                 stats.moodTrend === 'down' ? 'Declining' : 'Stable'}
              </Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-sm text-surface-500">Average Craving</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {stats.avgCraving.toFixed(1)}/10
                </Text>
                <Text>{getTrendIcon(stats.cravingTrend, true)}</Text>
              </View>
              <Text className={`text-xs ${getTrendColor(stats.cravingTrend, true)}`}>
                {stats.cravingTrend === 'up' ? 'Increasing' : 
                 stats.cravingTrend === 'down' ? 'Decreasing' : 'Stable'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Top Emotions */}
        {stats.topEmotions.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
              Top Emotions This Week
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {stats.topEmotions.map((emotion, index) => (
                <View
                  key={emotion}
                  className={`px-4 py-2 rounded-full ${
                    index === 0
                      ? 'bg-primary-100 dark:bg-primary-900/30'
                      : 'bg-surface-100 dark:bg-surface-800'
                  }`}
                >
                  <Text
                    className={`${
                      index === 0
                        ? 'text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-surface-600 dark:text-surface-400'
                    }`}
                  >
                    {index === 0 && '⭐ '}
                    {emotion}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Highlights */}
        {stats.highlights.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
              🌟 Week Highlights
            </Text>
            <Card variant="default" className="bg-green-50 dark:bg-green-900/20">
              {stats.highlights.map((highlight, index) => (
                <View
                  key={index}
                  className={`flex-row items-center gap-2 py-2 ${
                    index < stats.highlights.length - 1
                      ? 'border-b border-green-100 dark:border-green-800'
                      : ''
                  }`}
                >
                  <Text className="text-green-600">✓</Text>
                  <Text className="text-green-800 dark:text-green-200">
                    {highlight}
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Challenges */}
        {stats.challenges.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
              💪 Areas to Focus On
            </Text>
            <Card variant="outlined">
              {stats.challenges.map((challenge, index) => (
                <View
                  key={index}
                  className={`flex-row items-center gap-2 py-2 ${
                    index < stats.challenges.length - 1
                      ? 'border-b border-surface-200 dark:border-surface-700'
                      : ''
                  }`}
                >
                  <Text className="text-amber-500">!</Text>
                  <Text className="text-surface-700 dark:text-surface-300">
                    {challenge}
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Encouragement */}
        <Card variant="default" className="mb-6 bg-primary-50 dark:bg-primary-900/20">
          <Text className="text-center text-primary-800 dark:text-primary-200 italic">
            "Every week of sobriety is a victory. Keep going — you're doing amazing work."
          </Text>
        </Card>

        {/* Share Button */}
        <Button
          title="Share Report"
          onPress={handleShare}
          variant="secondary"
        />

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

