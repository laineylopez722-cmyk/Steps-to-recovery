/**
 * Create Time Capsule Screen
 * Write a letter to your future self
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Card, Button } from '../../components/ui';
import { useCapsuleStore } from '../../lib/store';

const SUGGESTED_DURATIONS = [
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
];

const WRITING_PROMPTS = [
  'Dear future me, today I want you to remember...',
  'When you read this, I hope you feel...',
  'The thing I\'m most proud of right now is...',
  'My biggest hope for you is...',
  'Remember how hard you worked to...',
];

export default function NewCapsuleScreen() {
  const router = useRouter();
  const { createCapsule, isLoading } = useCapsuleStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3); // Default to 3 months
    return date;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1); // At least tomorrow

  const handleDateChange = (_: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setUnlockDate(selectedDate);
    }
  };

  const selectDuration = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setUnlockDate(date);
  };

  const applyPrompt = (prompt: string) => {
    setSelectedPrompt(prompt);
    if (!content) {
      setContent(prompt + '\n\n');
    }
  };

  const getDaysUntilUnlock = () => {
    return Math.ceil(
      (unlockDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please give your time capsule a title.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Content Required', 'Please write something to your future self.');
      return;
    }

    try {
      await createCapsule(title.trim(), content.trim(), unlockDate);

      Alert.alert(
        '💌 Time Capsule Created!',
        `Your message will be ready to open on ${unlockDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Failed to create capsule:', error);
      Alert.alert('Error', 'Failed to create time capsule. Please try again.');
    }
  };

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
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary-600">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              New Time Capsule
            </Text>
            <View className="w-16" />
          </View>

          {/* Introduction */}
          <Card variant="elevated" className="mb-6 bg-primary-50 dark:bg-primary-900/30">
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl">💌</Text>
              <View className="flex-1">
                <Text className="text-base font-medium text-primary-800 dark:text-primary-200">
                  Write to Your Future Self
                </Text>
                <Text className="text-sm text-primary-600 dark:text-primary-400">
                  This message will be locked until your chosen date.
                </Text>
              </View>
            </View>
          </Card>

          {/* Title */}
          <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
            Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Letter to 1-Year Sober Me"
            placeholderTextColor="#9ca3af"
            className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 mb-6"
          />

          {/* Unlock Date */}
          <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
            Open On
          </Text>

          {/* Quick duration buttons */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            {SUGGESTED_DURATIONS.map((duration) => (
              <TouchableOpacity
                key={duration.label}
                onPress={() => selectDuration(duration.days)}
                className={`px-4 py-2 rounded-full ${
                  Math.abs(getDaysUntilUnlock() - duration.days) < 5
                    ? 'bg-primary-500'
                    : 'bg-surface-100 dark:bg-surface-800'
                }`}
              >
                <Text
                  className={`text-sm ${
                    Math.abs(getDaysUntilUnlock() - duration.days) < 5
                      ? 'text-white font-medium'
                      : 'text-surface-700 dark:text-surface-300'
                  }`}
                >
                  {duration.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date picker button */}
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 mb-6"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-surface-900 dark:text-surface-100 font-medium">
                  {unlockDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <Text className="text-sm text-surface-500">
                  {getDaysUntilUnlock()} days from now
                </Text>
              </View>
              <Text className="text-primary-500">Change</Text>
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={unlockDate}
              mode="date"
              display="default"
              minimumDate={minDate}
              onChange={handleDateChange}
            />
          )}

          {/* Writing prompts */}
          <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
            Writing Prompts (optional)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <View className="flex-row gap-2 px-1">
              {WRITING_PROMPTS.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => applyPrompt(prompt)}
                  className={`px-3 py-2 rounded-xl max-w-[200px] ${
                    selectedPrompt === prompt
                      ? 'bg-secondary-100 dark:bg-secondary-900/30'
                      : 'bg-surface-100 dark:bg-surface-800'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      selectedPrompt === prompt
                        ? 'text-secondary-700 dark:text-secondary-300'
                        : 'text-surface-600 dark:text-surface-400'
                    }`}
                    numberOfLines={2}
                  >
                    {prompt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Content */}
          <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
            Your Message
          </Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Dear future me..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={10}
            className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-4 text-surface-900 dark:text-surface-100 min-h-[200px] mb-6"
            textAlignVertical="top"
          />

          {/* Privacy note */}
          <Card variant="outlined" className="mb-6">
            <View className="flex-row items-center gap-2">
              <Text>🔐</Text>
              <Text className="text-sm text-surface-500 flex-1">
                Your message is encrypted and stored locally. Only you can read it
                when the unlock date arrives.
              </Text>
            </View>
          </Card>

          <View className="h-8" />
        </ScrollView>

        {/* Create button */}
        <View className="px-4 py-4 border-t border-surface-200 dark:border-surface-700">
          <Button
            title={isLoading ? 'Creating...' : 'Seal Time Capsule 💌'}
            onPress={handleCreate}
            disabled={isLoading || !title.trim() || !content.trim()}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

