/**
 * Daily Reading Screen
 * Full view of today's JFT reading
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useReading } from '../../lib/hooks/useReading';
import { Card, Button } from '../../components/ui';
import { LoadingState, EmptyState } from '../../components/common';

export default function ReadingScreen() {
  const router = useRouter();
  const {
    todayReading,
    readingStreak,
    hasReflectedToday,
    isLoading,
    formattedDate,
    streakMessage,
    formatSource,
  } = useReading();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        <LoadingState message="Loading today's reading..." />
      </SafeAreaView>
    );
  }

  if (!todayReading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState
            emoji="📖"
            title="No Reading Available"
            message="We couldn't find a reading for today."
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200 dark:border-surface-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            Daily Reading
          </Text>
          <Text className="text-xs text-surface-500">{formattedDate}</Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Streak Badge */}
        {readingStreak > 0 && (
          <View className="flex-row items-center justify-center mb-4">
            <View className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full flex-row items-center">
              <Text className="text-amber-600 dark:text-amber-400 mr-1">🔥</Text>
              <Text className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {streakMessage}
              </Text>
            </View>
          </View>
        )}

        {/* Reading Card */}
        <Card variant="default" className="mb-6">
          {/* Source Tag */}
          <View className="flex-row items-center mb-3">
            <View className="bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded">
              <Text className="text-xs font-medium text-primary-700 dark:text-primary-300">
                {formatSource(todayReading.source)}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-4">
            {todayReading.title}
          </Text>

          {/* Content */}
          <Text className="text-base text-surface-700 dark:text-surface-300 leading-7">
            {todayReading.content}
          </Text>
        </Card>

        {/* Reflection Prompt */}
        <Card
          variant="outlined"
          className="mb-6 border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-900/20"
        >
          <View className="flex-row items-start">
            <Text className="text-2xl mr-3">💭</Text>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
                Reflection Prompt
              </Text>
              <Text className="text-base text-secondary-600 dark:text-secondary-400 leading-6">
                {todayReading.reflectionPrompt}
              </Text>
            </View>
          </View>
        </Card>

        {/* Reflection Button */}
        {hasReflectedToday ? (
          <Card
            variant="default"
            className="mb-6 bg-green-50 dark:bg-green-900/20"
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">✅</Text>
              <View className="flex-1">
                <Text className="text-green-800 dark:text-green-200 font-medium">
                  You've reflected on today's reading
                </Text>
                <TouchableOpacity onPress={() => router.push('/reading/reflect')}>
                  <Text className="text-sm text-green-600 dark:text-green-400 mt-1">
                    View or edit your reflection →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ) : (
          <Button
            title="Write Reflection"
            onPress={() => router.push('/reading/reflect')}
            variant="primary"
            size="lg"
            accessibilityLabel="Write a reflection on today's reading"
          />
        )}

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

