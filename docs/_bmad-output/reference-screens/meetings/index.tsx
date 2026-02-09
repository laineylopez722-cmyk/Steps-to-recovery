/**
 * Meetings List Screen
 * View all meetings with insights and stats
 */

import React, { useState, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, Button } from '../../components/ui';
import { useMeetings } from '../../lib/hooks/useMeetings';
import { getTopicEmoji } from '../../lib/constants/meetingTopics';
import type { MeetingLog, MeetingType } from '../../lib/types';

// Meeting card component
const MeetingCard = memo(function MeetingCard({
  meeting,
  onPress,
  getTypeLabel,
  formatMeetingDate,
}: {
  meeting: MeetingLog;
  onPress: () => void;
  getTypeLabel: (type: MeetingType) => string;
  formatMeetingDate: (date: Date) => string;
}) {
  const moodChange = meeting.moodAfter - meeting.moodBefore;
  const moodChangeColor =
    moodChange > 0
      ? 'text-green-600 dark:text-green-400'
      : moodChange < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-surface-500';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="default" className="mb-3">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
              {meeting.name || 'Meeting'}
            </Text>
            <Text className="text-sm text-surface-500">
              {formatMeetingDate(meeting.attendedAt)}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="bg-surface-100 dark:bg-surface-800 rounded-full px-2 py-1">
              <Text className="text-xs text-surface-600 dark:text-surface-400">
                {meeting.type === 'in-person' ? '📍' : '💻'} {getTypeLabel(meeting.type)}
              </Text>
            </View>
          </View>
        </View>

        {/* Mood change */}
        <View className="flex-row items-center gap-4 mb-2">
          <View className="flex-row items-center gap-1">
            <Text className="text-sm text-surface-500">Mood:</Text>
            <Text className="text-sm text-surface-700 dark:text-surface-300">
              {meeting.moodBefore} → {meeting.moodAfter}
            </Text>
            <Text className={`text-sm font-medium ${moodChangeColor}`}>
              ({moodChange > 0 ? '+' : ''}
              {moodChange})
            </Text>
          </View>
        </View>

        {/* Topic tags */}
        {meeting.topicTags.length > 0 && (
          <View className="flex-row flex-wrap gap-1">
            {meeting.topicTags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                className="bg-primary-50 dark:bg-primary-900/30 rounded-full px-2 py-0.5"
              >
                <Text className="text-xs text-primary-700 dark:text-primary-300">
                  {getTopicEmoji(tag)} {tag}
                </Text>
              </View>
            ))}
            {meeting.topicTags.length > 3 && (
              <Text className="text-xs text-surface-400 self-center">
                +{meeting.topicTags.length - 3}
              </Text>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
});

// Insights card component
function InsightsCard({
  insights,
  meetingStreak,
  moodImprovementPercentage,
}: {
  insights: {
    totalMeetings: number;
    meetingsThisWeek: number;
    meetingsThisMonth: number;
    averageMoodImprovement: number;
    daysSinceLastMeeting: number | null;
    mostCommonTopic: string | null;
  };
  meetingStreak: number;
  moodImprovementPercentage: number;
}) {
  return (
    <Card variant="elevated" className="mb-6 bg-secondary-50 dark:bg-secondary-900/30">
      <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
        Meeting Insights
      </Text>

      <View className="flex-row flex-wrap gap-4">
        {/* Total meetings */}
        <View className="min-w-[80px]">
          <Text className="text-3xl font-bold text-secondary-600">
            {insights.totalMeetings}
          </Text>
          <Text className="text-xs text-surface-500">Total Meetings</Text>
        </View>

        {/* This week */}
        <View className="min-w-[80px]">
          <Text className="text-3xl font-bold text-primary-600">
            {insights.meetingsThisWeek}
          </Text>
          <Text className="text-xs text-surface-500">This Week</Text>
        </View>

        {/* Mood improvement */}
        <View className="min-w-[80px]">
          <Text className="text-3xl font-bold text-green-600">
            {moodImprovementPercentage}%
          </Text>
          <Text className="text-xs text-surface-500">Mood Improved</Text>
        </View>
      </View>

      {/* Additional insights */}
      <View className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
        {insights.averageMoodImprovement > 0 && (
          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-green-600">📈</Text>
            <Text className="text-sm text-surface-700 dark:text-surface-300">
              Your mood improves by an average of{' '}
              <Text className="font-semibold">
                +{insights.averageMoodImprovement.toFixed(1)}
              </Text>{' '}
              after meetings
            </Text>
          </View>
        )}

        {meetingStreak > 0 && (
          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-amber-500">🔥</Text>
            <Text className="text-sm text-surface-700 dark:text-surface-300">
              <Text className="font-semibold">{meetingStreak} week</Text> meeting streak
            </Text>
          </View>
        )}

        {insights.mostCommonTopic && (
          <View className="flex-row items-center gap-2 mb-2">
            <Text>{getTopicEmoji(insights.mostCommonTopic)}</Text>
            <Text className="text-sm text-surface-700 dark:text-surface-300">
              Most discussed topic:{' '}
              <Text className="font-semibold">{insights.mostCommonTopic}</Text>
            </Text>
          </View>
        )}

        {insights.daysSinceLastMeeting !== null && insights.daysSinceLastMeeting > 7 && (
          <View className="flex-row items-center gap-2 mt-2 p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
            <Text>💭</Text>
            <Text className="text-sm text-amber-700 dark:text-amber-300">
              It's been {insights.daysSinceLastMeeting} days since your last meeting.
              Consider attending one soon!
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

export default function MeetingsScreen() {
  const router = useRouter();
  const {
    meetings,
    isLoading,
    insights,
    meetingStreak,
    moodImprovementPercentage,
    loadMeetings,
    getTypeLabel,
    formatMeetingDate,
  } = useMeetings();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeetings();
    setRefreshing(false);
  };

  // Empty state
  if (!isLoading && meetings.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        <View className="flex-1 px-4 py-6">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary-600">← Back</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-1 items-center justify-center">
            <Text className="text-6xl mb-4">📍</Text>
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center">
              Track Your Meetings
            </Text>
            <Text className="text-surface-500 text-center mt-2 mb-6 px-8">
              Log your meeting attendance to see how they impact your recovery journey.
            </Text>
            <Button
              title="Log Your First Meeting"
              onPress={() => router.push('/meetings/new')}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <View className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Text className="text-primary-600">← Back</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              Meetings
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/meetings/new')}
            className="bg-primary-600 rounded-full w-10 h-10 items-center justify-center"
          >
            <Text className="text-white text-2xl">+</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={meetings}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <InsightsCard
              insights={insights}
              meetingStreak={meetingStreak}
              moodImprovementPercentage={moodImprovementPercentage}
            />
          }
          renderItem={({ item }) => (
            <MeetingCard
              meeting={item}
              onPress={() => router.push(`/meetings/${item.id}`)}
              getTypeLabel={getTypeLabel}
              formatMeetingDate={formatMeetingDate}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      </View>
    </SafeAreaView>
  );
}

