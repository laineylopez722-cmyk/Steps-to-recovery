/**
 * Step Work Detail Screen
 * Guided prompts and journaling for a specific step
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Button, Slider } from '../../components/ui';
import { getStepPrompts, STEP_PROMPTS, StepPrompt } from '../../lib/constants/stepPrompts';
import { useJournalStore } from '../../lib/store';
import { DEFAULT_EMOTIONS } from '../../lib/constants/emotions';

export default function StepDetailScreen() {
  const router = useRouter();
  const { step: stepParam } = useLocalSearchParams<{ step: string }>();
  const stepNumber = parseInt(stepParam || '1', 10);
  const stepData = getStepPrompts(stepNumber);

  const { createEntry, entries, isLoading } = useJournalStore();

  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [mood, setMood] = useState(5);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);

  // Animation
  // Keep a stable animated value across renders for smooth fades
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  // Get previous step entries
  const previousEntries = entries.filter(
    (e) => e.type === 'step-work' && e.stepNumber === stepNumber
  );

  if (!stepData) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900 items-center justify-center px-6">
        <Text className="text-5xl mb-4">📖</Text>
        <Text className="text-xl font-semibold text-surface-900 dark:text-surface-100 text-center">
          Step Not Found
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

  const currentPrompt = stepData.prompts[currentPromptIndex];
  const totalPrompts = stepData.prompts.length;
  const currentResponse = responses[currentPromptIndex] || '';

  const handleResponseChange = (text: string) => {
    setResponses((prev) => ({
      ...prev,
      [currentPromptIndex]: text,
    }));
  };

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(callback, 150);
  };

  const handleNext = () => {
    if (currentPromptIndex < totalPrompts - 1) {
      animateTransition(() => setCurrentPromptIndex(currentPromptIndex + 1));
    } else {
      setShowCompletion(true);
    }
  };

  const handlePrevious = () => {
    if (currentPromptIndex > 0) {
      animateTransition(() => setCurrentPromptIndex(currentPromptIndex - 1));
    }
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleSaveEntry = async () => {
    // Combine all responses into one entry
    const combinedContent = stepData.prompts
      .map((prompt, index) => {
        const response = responses[index];
        if (response?.trim()) {
          return `**${prompt}**\n\n${response}`;
        }
        return null;
      })
      .filter(Boolean)
      .join('\n\n---\n\n');

    if (!combinedContent.trim()) {
      Alert.alert('No Responses', 'Please answer at least one prompt before saving.');
      return;
    }

    try {
      await createEntry('step-work', combinedContent, {
        moodAfter: mood,
        emotionTags: selectedEmotions,
        stepNumber,
      });

      Alert.alert(
        '🎉 Step Work Saved!',
        `Your reflections on Step ${stepNumber} have been saved to your journal.`,
        [
          {
            text: 'Continue to Next Step',
            onPress: () => {
              if (stepNumber < 12) {
                router.replace(`/step-work/${stepNumber + 1}`);
              } else {
                router.replace('/step-work');
              }
            },
          },
          {
            text: 'Return to Steps',
            onPress: () => router.replace('/step-work'),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save step work:', error);
      Alert.alert('Error', 'Failed to save your step work. Please try again.');
    }
  };

  const handleSkipPrompt = () => {
    if (currentPromptIndex < totalPrompts - 1) {
      handleNext();
    }
  };

  // Navigate between steps
  const canGoPrevStep = stepNumber > 1;
  const canGoNextStep = stepNumber < 12;

  if (showCompletion) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView className="flex-1 px-4 py-6" keyboardShouldPersistTaps="handled">
            {/* Header */}
            <TouchableOpacity
              onPress={() => setShowCompletion(false)}
              className="mb-6"
            >
              <Text className="text-primary-600">← Back to Prompts</Text>
            </TouchableOpacity>

            {/* Completion Card */}
            <View className="items-center mb-8">
              <Text className="text-6xl mb-4">🎊</Text>
              <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center">
                Step {stepNumber} Complete!
              </Text>
              <Text className="text-surface-500 text-center mt-2">
                You've worked through all the prompts for this step.
              </Text>
            </View>

            {/* Summary */}
            <Card variant="default" className="mb-6">
              <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                Your Reflections Summary
              </Text>
              <Text className="text-surface-500 text-sm">
                {Object.values(responses).filter(Boolean).length} of {totalPrompts} prompts answered
              </Text>
            </Card>

            {/* Mood Check */}
            <Card variant="default" className="mb-6">
              <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-3">
                How do you feel after this step work?
              </Text>
              <Slider
                value={mood}
                onValueChange={setMood}
                min={1}
                max={10}
                step={1}
              />
              <View className="flex-row justify-between mt-2">
                <Text className="text-xs text-surface-400">Struggling</Text>
                <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                  {mood}/10
                </Text>
                <Text className="text-xs text-surface-400">Hopeful</Text>
              </View>
            </Card>

            {/* Emotion Tags */}
            <View className="mb-6">
              <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-3">
                What emotions came up?
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

            {/* Save Button */}
            <Button
              title={isLoading ? 'Saving...' : 'Save to Journal'}
              onPress={handleSaveEntry}
              disabled={isLoading}
              size="lg"
            />

            {/* Encouragement */}
            <Card variant="outlined" className="mt-6 mb-8">
              <Text className="text-surface-600 dark:text-surface-400 text-center italic">
                "{stepData.principle}" — The principle of Step {stepNumber}
              </Text>
            </Card>

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-4 border-b border-surface-200 dark:border-surface-700">
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary-600">← Steps</Text>
            </TouchableOpacity>
            <View className="flex-row items-center gap-2">
              {canGoPrevStep && (
                <TouchableOpacity
                  onPress={() => router.replace(`/step-work/${stepNumber - 1}`)}
                  className="px-3 py-1 rounded-lg bg-surface-100 dark:bg-surface-800"
                >
                  <Text className="text-surface-600 dark:text-surface-400">←</Text>
                </TouchableOpacity>
              )}
              <Text className="text-lg font-bold text-surface-900 dark:text-surface-100">
                Step {stepNumber}
              </Text>
              {canGoNextStep && (
                <TouchableOpacity
                  onPress={() => router.replace(`/step-work/${stepNumber + 1}`)}
                  className="px-3 py-1 rounded-lg bg-surface-100 dark:bg-surface-800"
                >
                  <Text className="text-surface-600 dark:text-surface-400">→</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text className="text-surface-500">
              {currentPromptIndex + 1}/{totalPrompts}
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="h-1 bg-surface-200 dark:bg-surface-700 rounded-full">
            <View
              className="h-1 bg-primary-500 rounded-full"
              style={{ width: `${((currentPromptIndex + 1) / totalPrompts) * 100}%` }}
            />
          </View>
        </View>

        <ScrollView
          className="flex-1 px-4"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="py-6"
        >
          {/* Step Info */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="bg-primary-500 rounded-full px-3 py-1">
                <Text className="text-white font-semibold">{stepData.title}</Text>
              </View>
              <View className="bg-secondary-100 dark:bg-secondary-900/30 rounded-full px-3 py-1">
                <Text className="text-secondary-700 dark:text-secondary-300 text-sm">
                  {stepData.principle}
                </Text>
              </View>
            </View>
            <Text className="text-surface-600 dark:text-surface-400 italic">
              "{stepData.description}"
            </Text>
          </View>

          {/* Current Prompt */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <Card variant="elevated" className="mb-4">
              <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 leading-relaxed">
                {currentPrompt}
              </Text>
            </Card>

            {/* Response Input */}
            <TextInput
              value={currentResponse}
              onChangeText={handleResponseChange}
              placeholder="Take your time. There's no wrong answer..."
              placeholderTextColor="#9ca3af"
              multiline
              className="bg-surface-100 dark:bg-surface-800 rounded-2xl px-4 py-4 text-surface-900 dark:text-surface-100 text-base min-h-[200px] mb-4"
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Previous Entries Hint */}
          {previousEntries.length > 0 && (
            <Card variant="outlined" className="mb-4">
              <Text className="text-sm text-surface-500">
                💡 You have {previousEntries.length} previous journal{' '}
                {previousEntries.length === 1 ? 'entry' : 'entries'} for this step.
              </Text>
            </Card>
          )}
        </ScrollView>

        {/* Navigation */}
        <View className="px-4 py-4 border-t border-surface-200 dark:border-surface-700">
          <View className="flex-row gap-3">
            {currentPromptIndex > 0 && (
              <TouchableOpacity
                onPress={handlePrevious}
                className="flex-1 py-3 rounded-xl bg-surface-100 dark:bg-surface-800"
              >
                <Text className="text-center text-surface-700 dark:text-surface-300 font-medium">
                  Previous
                </Text>
              </TouchableOpacity>
            )}
            
            {!currentResponse.trim() && currentPromptIndex < totalPrompts - 1 && (
              <TouchableOpacity
                onPress={handleSkipPrompt}
                className="py-3 px-4 rounded-xl"
              >
                <Text className="text-surface-400 text-sm">Skip</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleNext}
              className="flex-1 py-3 rounded-xl bg-primary-500"
            >
              <Text className="text-center text-white font-semibold">
                {currentPromptIndex < totalPrompts - 1 ? 'Next' : 'Finish'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

