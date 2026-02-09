/**
 * Insights Tab Screen
 * Mood analytics and patterns - matches reference site design
 */

import React from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Card, Button } from '../../components/ui';
import { useCheckin } from '../../lib/hooks/useCheckin';
import { useJournalStore } from '../../lib/store';
import { DailyCheckin } from '@/lib/types';

const { width: screenWidth } = Dimensions.get('window');

// Simple mood trend visualization
function MoodTrendChart({ data }: { data: { date: string; mood: number }[] }) {
  if (data.length === 0) return null;

  const maxMood = 10;
  const chartHeight = 120;
  const chartWidth = screenWidth - 64;
  const barWidth = Math.min(20, (chartWidth - data.length * 4) / data.length);

  return (
    <View className="mt-4">
      <View className="flex-row items-end justify-center" style={{ height: chartHeight }}>
        {data.slice(-14).map((item, index) => {
          const height = (item.mood / maxMood) * chartHeight;
          const isRecent = index >= data.length - 3;

          return (
            <View key={index} className="items-center mx-1">
              <View
                className={`rounded-t-lg ${isRecent ? 'bg-primary-500' : 'bg-primary-500/40'}`}
                style={{ width: barWidth, height: Math.max(4, height) }}
              />
            </View>
          );
        })}
      </View>
      <View className="flex-row justify-between mt-2 px-2">
        <Text className="text-surface-500 text-xs">14 days ago</Text>
        <Text className="text-surface-500 text-xs">Today</Text>
      </View>
    </View>
  );
}

// Stats card component
function StatCard({
  icon,
  label,
  value,
  color = 'primary'
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string | number;
  color?: 'primary' | 'success' | 'warning';
}) {
  const colorClasses = {
    primary: 'bg-primary-500/20 text-primary-400',
    success: 'bg-success-500/20 text-success-400',
    warning: 'bg-accent-500/20 text-accent-400',
  };

  return (
    <View className="bg-navy-800/40 rounded-2xl p-4 flex-1 border border-surface-700/30">
      <View className={`w-10 h-10 rounded-xl items-center justify-center mb-3 ${colorClasses[color].split(' ')[0]}`}>
        <Feather name={icon} size={20} color={color === 'primary' ? '#60a5fa' : color === 'success' ? '#4ade80' : '#fb923c'} />
      </View>
      <Text className="text-white text-2xl font-bold">{value}</Text>
      <Text className="text-surface-400 text-sm mt-1">{label}</Text>
    </View>
  );
}

export default function InsightsScreen() {
  const router = useRouter();
  const {
    checkinStreak,
    averageMood,
    history: recentCheckins
  } = useCheckin();
  const { entries } = useJournalStore();

  // Prepare mood trend data
  const moodData = recentCheckins
    .filter((c): c is DailyCheckin => {
      return c.mood !== undefined;
    })
    .map(c => ({
      date: typeof c.date === 'string' ? c.date : c.date.toISOString(),
      mood: c.mood || 5,
    }))
    .reverse();

  // Calculate stats
  const totalEntries = entries.length;
  const thisWeekEntries = entries.filter(e => {
    const entryDate = new Date(e.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  }).length;

  const averageCraving = recentCheckins.length > 0
    ? (recentCheckins.reduce((sum, c) => sum + (c.cravingLevel || 0), 0) / recentCheckins.length).toFixed(1)
    : '0';

  const hasData = moodData.length > 0 || totalEntries > 0;

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-6">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-2xl font-bold text-white">Mood Analytics</Text>
            <TouchableOpacity
              onPress={() => router.push('/weekly-report')}
              className="flex-row items-center bg-primary-500/20 px-3 py-2 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="View weekly report"
              accessibilityHint="Opens your comprehensive weekly recovery summary"
            >
              <Feather name="file-text" size={16} color="#60a5fa" />
              <Text className="text-primary-400 text-sm font-medium ml-2">Weekly Report</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-surface-400">
            Track your mood patterns and journal activity
          </Text>
        </View>

        {hasData ? (
          <>
            {/* Mood Trend Chart */}
            {moodData.length > 0 && (
              <View className="px-4 mb-6">
                <View className="bg-navy-800/40 rounded-2xl p-4 border border-surface-700/30">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Feather name="trending-up" size={18} color="#60a5fa" />
                    <Text className="text-white font-semibold">Mood Trend</Text>
                  </View>
                  <Text className="text-surface-400 text-sm mb-2">
                    Your mood over the last 14 days
                  </Text>
                  <MoodTrendChart data={moodData} />
                </View>
              </View>
            )}

            {/* Stats Grid */}
            <View className="px-4 mb-6">
              <Text className="text-white font-semibold mb-4">Quick Stats</Text>
              <View className="flex-row gap-3 mb-3">
                <StatCard
                  icon="check-circle"
                  label="Check-in Streak"
                  value={`${checkinStreak} days`}
                  color="success"
                />
                <StatCard
                  icon="smile"
                  label="Avg Mood"
                  value={averageMood.toFixed(1)}
                  color="primary"
                />
              </View>
              <View className="flex-row gap-3">
                <StatCard
                  icon="edit-3"
                  label="Journal Entries"
                  value={totalEntries}
                  color="primary"
                />
                <StatCard
                  icon="activity"
                  label="Avg Craving"
                  value={averageCraving}
                  color="warning"
                />
              </View>
            </View>

            {/* Activity Summary */}
            <View className="px-4 pb-8">
              <View className="bg-navy-800/40 rounded-2xl p-4 border border-surface-700/30">
                <View className="flex-row items-center gap-2 mb-3">
                  <Feather name="calendar" size={18} color="#60a5fa" />
                  <Text className="text-white font-semibold">This Week</Text>
                </View>
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-white text-3xl font-bold">{thisWeekEntries}</Text>
                    <Text className="text-surface-400 text-sm">Journal entries</Text>
                  </View>
                  <View>
                    <Text className="text-white text-3xl font-bold">
                      {recentCheckins.filter(c => {
                        const d = new Date(c.date);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return d >= weekAgo;
                      }).length}
                    </Text>
                    <Text className="text-surface-400 text-sm">Check-ins</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          /* Empty State */
          <View className="flex-1 items-center justify-center px-8 py-16">
            <View className="bg-navy-800/40 p-6 rounded-full mb-6">
              <Feather name="bar-chart-2" size={48} color="#64748b" />
            </View>
            <Text className="text-white text-xl font-semibold text-center mb-2">
              No Journal Entries Yet
            </Text>
            <Text className="text-surface-400 text-center">
              Start journaling to track your mood and see insights about your recovery journey
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

