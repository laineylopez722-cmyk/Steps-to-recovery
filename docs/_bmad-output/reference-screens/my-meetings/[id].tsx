/**
 * Meeting Detail Screen
 * View, edit, and delete a regular meeting
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Button } from '../../components/ui';
import { useRegularMeetings } from '../../lib/hooks/useRegularMeetings';
import type { RegularMeeting } from '../../lib/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function getMeetingTypeLabel(type: string): string {
  switch (type) {
    case 'in-person':
      return 'In Person';
    case 'online':
      return 'Online';
    case 'hybrid':
      return 'Hybrid';
    default:
      return type;
  }
}

function getMeetingTypeIcon(type: string): string {
  switch (type) {
    case 'in-person':
      return '📍';
    case 'online':
      return '💻';
    case 'hybrid':
      return '🔄';
    default:
      return '📍';
  }
}

export default function MeetingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getMeetingById,
    removeMeeting,
    setAsHomeGroup,
    toggleReminder,
    decryptNotes,
    getDaysUntil,
    getNextOccurrence,
  } = useRegularMeetings();

  const [meeting, setMeeting] = useState<RegularMeeting | null>(null);
  const [decryptedNotes, setDecryptedNotes] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMeeting();
  }, [id]);

  const loadMeeting = async () => {
    if (!id) return;
    
    const loadedMeeting = await getMeetingById(id);
    setMeeting(loadedMeeting);
    
    if (loadedMeeting?.notes) {
      const notes = await decryptNotes(loadedMeeting);
      setDecryptedNotes(notes);
    }
    
    setIsLoading(false);
  };

  const handleToggleReminder = async (enabled: boolean) => {
    if (!meeting) return;
    try {
      await toggleReminder(meeting.id, enabled);
      setMeeting({ ...meeting, reminderEnabled: enabled });
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
    }
  };

  const handleSetHomeGroup = async () => {
    if (!meeting) return;
    
    Alert.alert(
      'Set as Home Group',
      `Make "${meeting.name}" your home group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await setAsHomeGroup(meeting.id);
              setMeeting({ ...meeting, isHomeGroup: true });
            } catch (error) {
              console.error('Failed to set home group:', error);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/my-meetings/add?editId=${id}`);
  };

  const handleDelete = () => {
    if (!meeting) return;
    
    Alert.alert(
      'Delete Meeting',
      `Are you sure you want to delete "${meeting.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMeeting(meeting.id);
              router.back();
            } catch (error) {
              console.error('Failed to delete meeting:', error);
              Alert.alert('Error', 'Failed to delete meeting.');
            }
          },
        },
      ]
    );
  };

  const handleLogAttendance = () => {
    // Navigate to meeting log with this meeting pre-filled
    router.push('/meetings/new');
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900 items-center justify-center">
        <Text className="text-surface-500">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!meeting) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900 items-center justify-center">
        <Text className="text-surface-500">Meeting not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary-600">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const daysUntil = getDaysUntil(meeting);
  const nextOccurrence = getNextOccurrence(meeting);

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text className="text-primary-600 text-lg">← Back</Text>
          </TouchableOpacity>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleEdit}
              className="px-4 py-2 bg-surface-100 dark:bg-surface-800 rounded-lg"
            >
              <Text className="text-primary-600">Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Meeting Header */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center mb-4">
            <Text className="text-4xl">{getMeetingTypeIcon(meeting.type)}</Text>
          </View>
          <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center">
            {meeting.name}
          </Text>
          {meeting.isHomeGroup && (
            <View className="flex-row items-center mt-2 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">
              <Text className="text-amber-700 dark:text-amber-300 font-medium">
                🏠 Home Group
              </Text>
            </View>
          )}
        </View>

        {/* Next Occurrence */}
        <Card
          variant="default"
          className={`mb-4 ${
            daysUntil === 0
              ? 'bg-green-50 dark:bg-green-900/20'
              : 'bg-primary-50 dark:bg-primary-900/20'
          }`}
        >
          <View className="items-center">
            <Text className="text-sm text-surface-600 dark:text-surface-400 mb-1">
              {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : 'Next Meeting'}
            </Text>
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {DAY_NAMES[meeting.dayOfWeek]} at {formatTime(meeting.time)}
            </Text>
            {daysUntil > 1 && (
              <Text className="text-sm text-surface-500 mt-1">
                In {daysUntil} days
              </Text>
            )}
          </View>
        </Card>

        {/* Meeting Details */}
        <Card variant="outlined" className="mb-4">
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
            Details
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-surface-500">Type</Text>
              <Text className="text-surface-900 dark:text-surface-100 font-medium">
                {getMeetingTypeIcon(meeting.type)} {getMeetingTypeLabel(meeting.type)}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-surface-500">Day</Text>
              <Text className="text-surface-900 dark:text-surface-100">
                Every {DAY_NAMES[meeting.dayOfWeek]}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-surface-500">Time</Text>
              <Text className="text-surface-900 dark:text-surface-100">
                {formatTime(meeting.time)}
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
          </View>
        </Card>

        {/* Notes */}
        {decryptedNotes && (
          <Card variant="outlined" className="mb-4">
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
              Notes
            </Text>
            <Text className="text-surface-700 dark:text-surface-300">
              {decryptedNotes}
            </Text>
          </Card>
        )}

        {/* Reminder Toggle */}
        <Card variant="default" className="mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-3">🔔</Text>
              <View className="flex-1">
                <Text className="text-surface-900 dark:text-surface-100 font-medium">
                  Reminder
                </Text>
                <Text className="text-sm text-surface-500">
                  {meeting.reminderMinutesBefore} min before
                </Text>
              </View>
            </View>
            <Switch
              value={meeting.reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={meeting.reminderEnabled ? '#3b82f6' : '#f4f4f5'}
            />
          </View>
        </Card>

        {/* Set as Home Group */}
        {!meeting.isHomeGroup && (
          <TouchableOpacity
            onPress={handleSetHomeGroup}
            className="bg-amber-100 dark:bg-amber-900/30 rounded-xl p-4 mb-4"
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-amber-700 dark:text-amber-300 font-medium">
                🏠 Set as Home Group
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Actions */}
        <View className="space-y-3 mb-6">
          <Button
            title="Log Attendance"
            onPress={handleLogAttendance}
            variant="primary"
            size="lg"
          />
          
          <TouchableOpacity
            onPress={handleDelete}
            className="py-3 items-center"
          >
            <Text className="text-red-600 dark:text-red-400 font-medium">
              Delete Meeting
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

