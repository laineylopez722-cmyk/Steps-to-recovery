/**
 * New Journal Entry Screen
 * Create freeform, step work, or meeting reflection entries
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Slider } from '../../components/ui';
import { useJournalStore } from '../../lib/store';
import { DEFAULT_EMOTIONS } from '../../lib/constants/emotions';
import type { JournalType } from '../../lib/types';

const JOURNAL_TYPES: { id: JournalType; label: string; icon: string }[] = [
  { id: 'freeform', label: 'Free Write', icon: '✏️' },
  { id: 'step-work', label: 'Step Work', icon: '📖' },
  { id: 'meeting-reflection', label: 'Meeting', icon: '👥' },
  { id: 'daily-checkin', label: 'Check-In', icon: '📋' },
];

export default function NewJournalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: JournalType }>();
  const { createEntry, isLoading } = useJournalStore();

  const [type, setType] = useState<JournalType>(params.type || 'freeform');
  const [content, setContent] = useState('');
  const [moodBefore, setMoodBefore] = useState<number | undefined>(undefined);
  const [moodAfter, setMoodAfter] = useState<number | undefined>(undefined);
  const [cravingLevel, setCravingLevel] = useState<number | undefined>(undefined);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [stepNumber, setStepNumber] = useState<number | undefined>(undefined);

  const getPrompt = () => {
    switch (type) {
      case 'freeform':
        return 'What\'s on your mind today?';
      case 'step-work':
        return `Step ${stepNumber || '?'}: Reflect on this step and what it means for your recovery...`;
      case 'meeting-reflection':
        return 'What stood out to you from the meeting? Any insights or takeaways?';
      case 'daily-checkin':
        return 'How was your day? Any wins, challenges, or things you\'re grateful for?';
      default:
        return 'Start writing...';
    }
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }

    try {
      await createEntry(type, content, {
        moodBefore,
        moodAfter,
        cravingLevel,
        emotionTags: selectedEmotions,
        stepNumber: type === 'step-work' ? stepNumber : undefined,
      });

      router.back();
    } catch (error) {
      console.error('Failed to save entry:', error);
      Alert.alert('Error', 'Failed to save your entry. Please try again.');
    }
  };

  const handleDiscard = () => {
    if (content.trim()) {
      Alert.alert(
        'Discard Entry?',
        'Your entry will not be saved.',
        [
          { text: 'Keep Writing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700">
          <TouchableOpacity onPress={handleDiscard}>
            <Text className="text-surface-500 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            New Entry
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            <Text
              className={`text-base font-semibold ${
                isLoading ? 'text-surface-400' : 'text-primary-600'
              }`}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4"
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Selector */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-surface-500 mb-2">
              Entry Type
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-4 px-4"
            >
              <View className="flex-row gap-2">
                {JOURNAL_TYPES.map((jt) => (
                  <TouchableOpacity
                    key={jt.id}
                    onPress={() => setType(jt.id)}
                    className={`px-4 py-2 rounded-full border ${
                      type === jt.id
                        ? 'bg-primary-500 border-primary-500'
                        : 'bg-surface-100 dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                    }`}
                  >
                    <Text
                      className={`${
                        type === jt.id
                          ? 'text-white'
                          : 'text-surface-700 dark:text-surface-300'
                      }`}
                    >
                      {jt.icon} {jt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Step Number Selector (for step work) */}
          {type === 'step-work' && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-surface-500 mb-2">
                Which Step?
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-4 px-4"
              >
                <View className="flex-row gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setStepNumber(n)}
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        stepNumber === n
                          ? 'bg-primary-500'
                          : 'bg-surface-100 dark:bg-surface-800'
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          stepNumber === n
                            ? 'text-white'
                            : 'text-surface-700 dark:text-surface-300'
                        }`}
                      >
                        {n}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Content Input */}
          <View className="mb-4">
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder={getPrompt()}
              placeholderTextColor="#9ca3af"
              multiline
              className="bg-surface-100 dark:bg-surface-800 rounded-2xl px-4 py-4 text-surface-900 dark:text-surface-100 text-base min-h-[200px]"
              textAlignVertical="top"
              autoFocus
            />
          </View>

          {/* Emotion Tags */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-surface-500 mb-2">
              How do you feel?
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DEFAULT_EMOTIONS.map((emotion) => (
                <TouchableOpacity
                  key={emotion.name}
                  onPress={() => toggleEmotion(emotion.name)}
                  style={{
                    backgroundColor: selectedEmotions.includes(emotion.name)
                      ? emotion.color
                      : undefined,
                  }}
                  className={`px-3 py-1.5 rounded-full ${
                    selectedEmotions.includes(emotion.name)
                      ? ''
                      : 'bg-surface-100 dark:bg-surface-800'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      selectedEmotions.includes(emotion.name)
                        ? 'text-white'
                        : 'text-surface-700 dark:text-surface-300'
                    }`}
                  >
                    {emotion.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mood Sliders */}
          <Card variant="default" className="mb-4">
            <Text className="text-sm font-medium text-surface-500 mb-3">
              Mood Before Writing
            </Text>
            <Slider
              value={moodBefore ?? 5}
              onValueChange={(v) => setMoodBefore(v)}
              min={1}
              max={10}
              step={1}
            />
            <View className="flex-row justify-between mt-1 mb-4">
              <Text className="text-xs text-surface-400">Low</Text>
              <Text className="text-xs text-surface-400">{moodBefore ?? '-'}/10</Text>
              <Text className="text-xs text-surface-400">High</Text>
            </View>

            <Text className="text-sm font-medium text-surface-500 mb-3">
              Mood After Writing
            </Text>
            <Slider
              value={moodAfter ?? 5}
              onValueChange={(v) => setMoodAfter(v)}
              min={1}
              max={10}
              step={1}
            />
            <View className="flex-row justify-between mt-1">
              <Text className="text-xs text-surface-400">Low</Text>
              <Text className="text-xs text-surface-400">{moodAfter ?? '-'}/10</Text>
              <Text className="text-xs text-surface-400">High</Text>
            </View>
          </Card>

          {/* Craving Level */}
          <Card variant="default" className="mb-4">
            <Text className="text-sm font-medium text-surface-500 mb-3">
              Craving Level (optional)
            </Text>
            <Slider
              value={cravingLevel ?? 0}
              onValueChange={(v) => setCravingLevel(v)}
              min={0}
              max={10}
              step={1}
            />
            <View className="flex-row justify-between mt-1">
              <Text className="text-xs text-surface-400">None</Text>
              <Text className="text-xs text-surface-400">{cravingLevel ?? '-'}/10</Text>
              <Text className="text-xs text-surface-400">Intense</Text>
            </View>
          </Card>

          {/* Bottom padding */}
          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

