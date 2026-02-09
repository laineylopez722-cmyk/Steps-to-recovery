/**
 * Add/Edit Regular Meeting Screen
 * Form for creating or editing a recurring meeting
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Button } from '../../components/ui';
import { useRegularMeetings } from '../../lib/hooks/useRegularMeetings';
import type { RegularMeetingType } from '../../lib/types';

const DAY_OPTIONS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const MEETING_TYPES: { value: RegularMeetingType; label: string; icon: string }[] = [
  { value: 'in-person', label: 'In Person', icon: '📍' },
  { value: 'online', label: 'Online', icon: '💻' },
  { value: 'hybrid', label: 'Hybrid', icon: '🔄' },
];

const REMINDER_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
];

export default function AddMeetingScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { addMeeting, updateMeeting, getMeetingById, decryptNotes } = useRegularMeetings();

  // Form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday default
  const [time, setTime] = useState('19:00'); // 7 PM default
  const [type, setType] = useState<RegularMeetingType>('in-person');
  const [isHomeGroup, setIsHomeGroup] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(60);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);

  // Load existing meeting if editing
  useEffect(() => {
    if (editId) {
      loadMeeting(editId);
    }
  }, [editId]);

  const loadMeeting = async (id: string) => {
    const meeting = await getMeetingById(id);
    if (meeting) {
      setName(meeting.name);
      setLocation(meeting.location || '');
      setDayOfWeek(meeting.dayOfWeek);
      setTime(meeting.time);
      setType(meeting.type);
      setIsHomeGroup(meeting.isHomeGroup);
      setReminderEnabled(meeting.reminderEnabled);
      setReminderMinutesBefore(meeting.reminderMinutesBefore);
      
      // Decrypt notes if present
      if (meeting.notes) {
        const decryptedNotes = await decryptNotes(meeting);
        setNotes(decryptedNotes || '');
      }
    }
    setIsLoading(false);
  };

  const handleTimeChange = (value: string) => {
    // Format as HH:mm
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length <= 2) {
      setTime(cleaned);
    } else if (cleaned.length <= 4) {
      setTime(`${cleaned.slice(0, 2)}:${cleaned.slice(2)}`);
    }
  };

  const validateTime = (timeStr: string): boolean => {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return false;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter a meeting name.');
      return;
    }

    if (!validateTime(time)) {
      Alert.alert('Invalid Time', 'Please enter a valid time in HH:mm format.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedTime = time.padStart(5, '0'); // Ensure HH:mm format

      if (editId) {
        await updateMeeting(editId, {
          name: name.trim(),
          location: location.trim() || undefined,
          dayOfWeek,
          time: formattedTime,
          type,
          isHomeGroup,
          reminderEnabled,
          reminderMinutesBefore,
          notes: notes.trim() || undefined,
        });
        Alert.alert('Meeting Updated', 'Your meeting has been updated.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await addMeeting(name.trim(), dayOfWeek, formattedTime, type, {
          location: location.trim() || undefined,
          isHomeGroup,
          reminderEnabled,
          reminderMinutesBefore,
          notes: notes.trim() || undefined,
        });
        Alert.alert('Meeting Added', 'Your regular meeting has been saved.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error('Failed to save meeting:', error);
      Alert.alert('Error', 'Failed to save meeting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900 items-center justify-center">
        <Text className="text-surface-500">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 py-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3"
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text className="text-primary-600 text-lg">← Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-6">
            {editId ? 'Edit Meeting' : 'Add Regular Meeting'}
          </Text>

          {/* Meeting Name */}
          <View className="mb-6">
            <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
              Meeting Name *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Friday Night NA"
              placeholderTextColor="#9ca3af"
              className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100"
            />
          </View>

          {/* Meeting Type */}
          <View className="mb-6">
            <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
              Meeting Type
            </Text>
            <View className="flex-row gap-2">
              {MEETING_TYPES.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setType(option.value)}
                  className={`flex-1 p-3 rounded-xl border-2 items-center ${
                    type === option.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-surface-200 dark:border-surface-700'
                  }`}
                >
                  <Text className="text-2xl mb-1">{option.icon}</Text>
                  <Text
                    className={`text-sm font-medium ${
                      type === option.value
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-surface-600 dark:text-surface-400'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Day of Week */}
          <View className="mb-6">
            <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
              Day
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {DAY_OPTIONS.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    onPress={() => setDayOfWeek(day.value)}
                    className={`px-4 py-3 rounded-xl border-2 ${
                      dayOfWeek === day.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-surface-200 dark:border-surface-700'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        dayOfWeek === day.value
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-surface-600 dark:text-surface-400'
                      }`}
                    >
                      {day.short}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Time */}
          <View className="mb-6">
            <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
              Time (24h format)
            </Text>
            <TextInput
              value={time}
              onChangeText={handleTimeChange}
              placeholder="19:00"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              maxLength={5}
              className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100"
            />
            <Text className="text-xs text-surface-500 mt-1">
              Enter time in 24-hour format (e.g., 19:00 for 7:00 PM)
            </Text>
          </View>

          {/* Location */}
          <View className="mb-6">
            <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
              Location (optional)
            </Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder={type === 'online' ? 'e.g., Zoom, Google Meet' : 'e.g., Community Center'}
              placeholderTextColor="#9ca3af"
              className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100"
            />
          </View>

          {/* Home Group Toggle */}
          <Card variant="default" className="mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Text className="text-2xl mr-3">🏠</Text>
                <View className="flex-1">
                  <Text className="text-surface-900 dark:text-surface-100 font-medium">
                    This is my Home Group
                  </Text>
                  <Text className="text-sm text-surface-500">
                    Mark as your primary meeting
                  </Text>
                </View>
              </View>
              <Switch
                value={isHomeGroup}
                onValueChange={setIsHomeGroup}
                trackColor={{ false: '#cbd5e1', true: '#fcd34d' }}
                thumbColor={isHomeGroup ? '#f59e0b' : '#f4f4f5'}
              />
            </View>
          </Card>

          {/* Reminder Settings */}
          <Card variant="default" className="mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1">
                <Text className="text-2xl mr-3">🔔</Text>
                <View className="flex-1">
                  <Text className="text-surface-900 dark:text-surface-100 font-medium">
                    Reminder Notification
                  </Text>
                  <Text className="text-sm text-surface-500">
                    Get notified before this meeting
                  </Text>
                </View>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
                thumbColor={reminderEnabled ? '#3b82f6' : '#f4f4f5'}
              />
            </View>

            {reminderEnabled && (
              <View>
                <Text className="text-sm text-surface-600 dark:text-surface-400 mb-2">
                  Remind me:
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {REMINDER_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setReminderMinutesBefore(option.value)}
                      className={`px-3 py-2 rounded-lg ${
                        reminderMinutesBefore === option.value
                          ? 'bg-primary-100 dark:bg-primary-900/30'
                          : 'bg-surface-100 dark:bg-surface-700'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          reminderMinutesBefore === option.value
                            ? 'text-primary-700 dark:text-primary-300 font-medium'
                            : 'text-surface-600 dark:text-surface-400'
                        }`}
                      >
                        {option.label} before
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </Card>

          {/* Notes */}
          <View className="mb-6">
            <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
              Notes (optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any notes about this meeting..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 min-h-[80px]"
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <Button
            title={isSubmitting ? 'Saving...' : editId ? 'Update Meeting' : 'Add Meeting'}
            onPress={handleSubmit}
            disabled={isSubmitting}
            size="lg"
          />

          {/* Bottom spacing */}
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

