/**
 * Meeting Detail Screen
 * View and edit a logged meeting
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card } from '../../components/ui';
import { useMeetings } from '../../lib/hooks/useMeetings';
import { getTopicEmoji } from '../../lib/constants/meetingTopics';
import type { MeetingLog } from '../../lib/types';

export default function MeetingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMeetingById, deleteMeeting, getTypeLabel, formatMeetingDate } =
    useMeetings();

  const [meeting, setMeeting] = useState<MeetingLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMeeting();
  }, [id]);

  const loadMeeting = async () => {
    if (!id) return;
    setIsLoading(true);
    const data = await getMeetingById(id);
    setMeeting(data);
    setIsLoading(false);
  };

  const getMoodEmoji = (mood: number) => {
    if (mood <= 2) return '😢';
    if (mood <= 4) return '😔';
    if (mood <= 6) return '😐';
    if (mood <= 8) return '🙂';
    return '😊';
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Meeting',
      'Are you sure you want to delete this meeting log? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await deleteMeeting(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (!meeting) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900 items-center justify-center px-6">
        <Text className="text-5xl mb-4">📍</Text>
        <Text className="text-xl font-semibold text-surface-900 dark:text-surface-100 text-center">
          Meeting Not Found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary-500 px-6 py-3 rounded-xl mt-6"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const moodChange = meeting.moodAfter - meeting.moodBefore;

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary-600">← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text className="text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Meeting Title */}
        <View className="items-center mb-6">
          <Text className="text-4xl mb-2">
            {meeting.type === 'in-person' ? '📍' : '💻'}
          </Text>
          <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center">
            {meeting.name || 'Meeting'}
          </Text>
          <Text className="text-surface-500">
            {formatMeetingDate(meeting.attendedAt)}
          </Text>
          {meeting.location && (
            <Text className="text-surface-400 text-sm">{meeting.location}</Text>
          )}
        </View>

        {/* Mood Comparison */}
        <Card variant="elevated" className="mb-6">
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4 text-center">
            Mood Journey
          </Text>
          
          <View className="flex-row items-center justify-center gap-4">
            {/* Before */}
            <View className="items-center flex-1">
              <Text className="text-sm text-surface-500 mb-2">Before</Text>
              <Text className="text-4xl mb-1">{getMoodEmoji(meeting.moodBefore)}</Text>
              <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {meeting.moodBefore}/10
              </Text>
            </View>

            {/* Arrow with change */}
            <View className="items-center">
              <Text className="text-3xl mb-1">
                {moodChange > 0 ? '→' : moodChange < 0 ? '→' : '='}
              </Text>
              <View
                className={`px-3 py-1 rounded-full ${
                  moodChange > 0
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : moodChange < 0
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-surface-100 dark:bg-surface-800'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    moodChange > 0
                      ? 'text-green-700 dark:text-green-300'
                      : moodChange < 0
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-surface-600 dark:text-surface-400'
                  }`}
                >
                  {moodChange > 0 ? '+' : ''}
                  {moodChange}
                </Text>
              </View>
            </View>

            {/* After */}
            <View className="items-center flex-1">
              <Text className="text-sm text-surface-500 mb-2">After</Text>
              <Text className="text-4xl mb-1">{getMoodEmoji(meeting.moodAfter)}</Text>
              <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {meeting.moodAfter}/10
              </Text>
            </View>
          </View>

          {/* Encouragement based on change */}
          {moodChange > 0 && (
            <View className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <Text className="text-green-700 dark:text-green-300 text-center">
                📈 Your mood improved after this meeting. Keep attending!
              </Text>
            </View>
          )}
        </Card>

        {/* Key Takeaways */}
        {meeting.keyTakeaways && (
          <Card variant="default" className="mb-6">
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
              Key Takeaways
            </Text>
            <View className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4">
              <Text className="text-surface-700 dark:text-surface-300 leading-6">
                {meeting.keyTakeaways}
              </Text>
            </View>
          </Card>
        )}

        {/* Topics */}
        {meeting.topicTags.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
              Topics Discussed
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {meeting.topicTags.map((tag, index) => (
                <View
                  key={index}
                  className="bg-primary-50 dark:bg-primary-900/30 rounded-full px-4 py-2"
                >
                  <Text className="text-primary-700 dark:text-primary-300">
                    {getTopicEmoji(tag)} {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Meeting Details */}
        <Card variant="outlined" className="mb-6">
          <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-3">
            Meeting Details
          </Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-surface-500">Type</Text>
            <Text className="text-surface-900 dark:text-surface-100">
              {getTypeLabel(meeting.type)}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-surface-500">Date</Text>
            <Text className="text-surface-900 dark:text-surface-100">
              {new Date(meeting.attendedAt).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          {meeting.location && (
            <View className="flex-row justify-between">
              <Text className="text-surface-500">Location</Text>
              <Text className="text-surface-900 dark:text-surface-100">
                {meeting.location}
              </Text>
            </View>
          )}
        </Card>

        {/* Encouragement */}
        <Card variant="default" className="mb-6 bg-secondary-50 dark:bg-secondary-900/30">
          <Text className="text-center text-secondary-700 dark:text-secondary-300 italic">
            "Meeting makers make it."
          </Text>
        </Card>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

