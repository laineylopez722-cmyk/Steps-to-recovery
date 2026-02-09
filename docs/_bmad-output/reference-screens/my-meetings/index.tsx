/**
 * My Regular Meetings Screen
 * List and manage recurring meeting schedule
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, Button } from '../../components/ui';
import { EmptyState } from '../../components/common';
import { MeetingCard } from '../../components/meetings';
import { useRegularMeetings } from '../../lib/hooks/useRegularMeetings';
import type { RegularMeeting } from '../../lib/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MyMeetingsScreen() {
  const router = useRouter();
  const {
    meetings,
    homeGroup,
    isLoading,
    loadMeetings,
    toggleReminder,
    getDaysUntil,
  } = useRegularMeetings();

  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'week'>('list');

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeetings();
    setRefreshing(false);
  };

  // Group meetings by day for week view
  const meetingsByDay = DAY_NAMES.map((dayName, index) => ({
    day: dayName,
    dayIndex: index,
    meetings: meetings.filter((m) => m.dayOfWeek === index),
  }));

  const handleToggleReminder = async (id: string, enabled: boolean) => {
    try {
      await toggleReminder(id, enabled);
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
    }
  };

  const renderListView = () => (
    <View className="space-y-3">
      {meetings.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          meeting={meeting}
          onToggleReminder={handleToggleReminder}
          showDaysUntil
          daysUntil={getDaysUntil(meeting)}
        />
      ))}
    </View>
  );

  const renderWeekView = () => (
    <View className="space-y-4">
      {meetingsByDay.map(({ day, dayIndex, meetings: dayMeetings }) => (
        <View key={day}>
          <View className="flex-row items-center mb-2">
            <Text className="text-sm font-semibold text-surface-600 dark:text-surface-400 uppercase">
              {day}
            </Text>
            <View className="flex-1 h-px bg-surface-200 dark:bg-surface-700 ml-3" />
          </View>
          {dayMeetings.length > 0 ? (
            <View className="space-y-2">
              {dayMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  compact
                  showDaysUntil
                  daysUntil={getDaysUntil(meeting)}
                />
              ))}
            </View>
          ) : (
            <Text className="text-sm text-surface-400 italic py-2">
              No meetings scheduled
            </Text>
          )}
        </View>
      ))}
    </View>
  );


  const renderHeader = () => (
    <View>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text className="text-primary-600 text-lg">←</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              My Meetings
            </Text>
            <Text className="text-surface-500">
              {meetings.length} regular meeting{meetings.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/my-meetings/add')}
          className="w-10 h-10 bg-primary-600 rounded-full items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Add new meeting"
        >
          <Text className="text-white text-xl">+</Text>
        </TouchableOpacity>
      </View>

      {/* Home Group Card */}
      {homeGroup && (
        <Card
          variant="outlined"
          className="mb-6 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10"
        >
          <View className="flex-row items-center">
            <Text className="text-2xl mr-3">🏠</Text>
            <View className="flex-1">
              <Text className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                Your Home Group
              </Text>
              <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {homeGroup.name}
              </Text>
              <Text className="text-sm text-surface-500">
                {DAY_NAMES[homeGroup.dayOfWeek]}s at{' '}
                {formatTime(homeGroup.time)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push(`/my-meetings/${homeGroup.id}`)}
              className="px-3 py-1.5"
            >
              <Text className="text-primary-600">View →</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* View Toggle */}
      {meetings.length > 0 && (
        <View className="flex-row bg-surface-100 dark:bg-surface-800 rounded-xl p-1 mb-4">
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            className={`flex-1 py-2 rounded-lg ${viewMode === 'list'
              ? 'bg-white dark:bg-surface-700'
              : ''
              }`}
          >
            <Text
              className={`text-center font-medium ${viewMode === 'list'
                ? 'text-surface-900 dark:text-surface-100'
                : 'text-surface-500'
                }`}
            >
              📋 List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('week')}
            className={`flex-1 py-2 rounded-lg ${viewMode === 'week'
              ? 'bg-white dark:bg-surface-700'
              : ''
              }`}
          >
            <Text
              className={`text-center font-medium ${viewMode === 'week'
                ? 'text-surface-900 dark:text-surface-100'
                : 'text-surface-500'
                }`}
            >
              📅 Week
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFooter = () => (
    <View>
      {/* Quick Log Meeting Button */}
      {meetings.length > 0 && (
        <Card variant="outlined" className="mt-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-surface-900 dark:text-surface-100 font-medium">
                Just attended a meeting?
              </Text>
              <Text className="text-sm text-surface-500">
                Log it to track your progress
              </Text>
            </View>
            <Button
              title="Log Meeting"
              onPress={() => router.push('/meetings/new')}
              variant="secondary"
              size="sm"
            />
          </View>
        </Card>
      )}
      {/* Bottom spacing */}
      <View className="h-8" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      {meetings.length === 0 ? (
        <ScrollView
          className="flex-1 px-4 py-6"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderHeader()}
          <EmptyState
            emoji="📅"
            title="No Regular Meetings"
            message="Add your regular meetings to get reminders and track your attendance."
            actionLabel="Add Your First Meeting"
            onAction={() => router.push('/my-meetings/add')}
          />
        </ScrollView>
      ) : viewMode === 'list' ? (
        <FlatList
          data={meetings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MeetingCard
              meeting={item}
              onToggleReminder={handleToggleReminder}
              showDaysUntil
              daysUntil={getDaysUntil(item)}
              className="mb-3"
            />
          )}
          ListHeaderComponent={renderHeader()}
          ListFooterComponent={renderFooter()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      ) : (
        <ScrollView
          className="flex-1 px-4 py-6"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderHeader()}
          {renderWeekView()}
          {renderFooter()}
        </ScrollView>
      )}
    </SafeAreaView>
  );

}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

