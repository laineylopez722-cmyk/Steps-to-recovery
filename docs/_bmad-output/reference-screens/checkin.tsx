/**
 * Daily Check-In Screen
 * Quick mood, craving, and gratitude capture
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Slider, Card } from '../components/ui';
import { useCheckin } from '../lib/hooks/useCheckin';

const MOOD_LABELS = [
  { value: 1, emoji: '😢', label: 'Struggling' },
  { value: 3, emoji: '😔', label: 'Low' },
  { value: 5, emoji: '😐', label: 'Okay' },
  { value: 7, emoji: '🙂', label: 'Good' },
  { value: 10, emoji: '😊', label: 'Great' },
];

const CRAVING_LABELS = [
  { value: 0, label: 'None' },
  { value: 3, label: 'Mild' },
  { value: 5, label: 'Moderate' },
  { value: 7, label: 'Strong' },
  { value: 10, label: 'Intense' },
];

export default function CheckinScreen() {
  const router = useRouter();
  const { submitCheckin, hasCheckedInToday, todayCheckin } = useCheckin();

  const [mood, setMood] = useState(todayCheckin?.mood ?? 5);
  const [craving, setCraving] = useState(todayCheckin?.cravingLevel ?? 0);
  const [gratitude, setGratitude] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  const getMoodEmoji = () => {
    if (mood <= 2) return '😢';
    if (mood <= 4) return '😔';
    if (mood <= 6) return '😐';
    if (mood <= 8) return '🙂';
    return '😊';
  };

  const getCravingColor = () => {
    if (craving <= 2) return 'bg-green-500';
    if (craving <= 4) return 'bg-yellow-500';
    if (craving <= 6) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleNext = () => {
    fadeIn.setValue(0);
    slideUp.setValue(30);
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      fadeIn.setValue(0);
      slideUp.setValue(30);
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitCheckin(mood, craving, gratitude || undefined);
      router.back();
    } catch (error) {
      console.error('Failed to submit check-in:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-4"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text
              onPress={handleBack}
              className="text-primary-600 text-base"
            >
              {step > 1 ? '← Back' : '← Cancel'}
            </Text>
            <Text className="text-surface-500">
              Step {step} of 3
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full mb-8">
            <View
              className="h-2 bg-primary-500 rounded-full"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </View>

          {/* Step 1: Mood */}
          {step === 1 && (
            <Animated.View
              style={{
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              }}
            >
              <Text className="text-3xl font-bold text-surface-900 dark:text-surface-100 text-center mb-2">
                How are you feeling?
              </Text>
              <Text className="text-surface-500 text-center mb-8">
                Rate your overall mood right now
              </Text>

              {/* Mood Display */}
              <View className="items-center mb-8">
                <Text className="text-8xl mb-4">{getMoodEmoji()}</Text>
                <Text className="text-4xl font-bold text-surface-900 dark:text-surface-100">
                  {mood}/10
                </Text>
              </View>

              {/* Mood Slider */}
              <Slider
                value={mood}
                onValueChange={setMood}
                min={1}
                max={10}
                step={1}
              />

              {/* Mood Labels */}
              <View className="flex-row justify-between mt-4">
                {MOOD_LABELS.map((item) => (
                  <View key={item.value} className="items-center">
                    <Text className="text-xl">{item.emoji}</Text>
                    <Text className="text-xs text-surface-500">{item.label}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Step 2: Craving */}
          {step === 2 && (
            <Animated.View
              style={{
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              }}
            >
              <Text className="text-3xl font-bold text-surface-900 dark:text-surface-100 text-center mb-2">
                Any cravings today?
              </Text>
              <Text className="text-surface-500 text-center mb-8">
                It's okay to have them — acknowledging is powerful
              </Text>

              {/* Craving Display */}
              <View className="items-center mb-8">
                <View
                  className={`w-32 h-32 rounded-full items-center justify-center ${getCravingColor()}`}
                >
                  <Text className="text-4xl font-bold text-white">
                    {craving}
                  </Text>
                </View>
                <Text className="text-lg text-surface-600 dark:text-surface-400 mt-4">
                  {craving === 0
                    ? 'No cravings'
                    : craving <= 3
                    ? 'Mild cravings'
                    : craving <= 5
                    ? 'Moderate cravings'
                    : craving <= 7
                    ? 'Strong cravings'
                    : 'Intense cravings'}
                </Text>
              </View>

              {/* Craving Slider */}
              <Slider
                value={craving}
                onValueChange={setCraving}
                min={0}
                max={10}
                step={1}
              />

              {/* Craving Labels */}
              <View className="flex-row justify-between mt-4">
                {CRAVING_LABELS.map((item) => (
                  <Text key={item.value} className="text-xs text-surface-500">
                    {item.label}
                  </Text>
                ))}
              </View>

              {/* Encouragement and Vault Link */}
              {craving > 5 && (
                <Card variant="outlined" className="mt-6 border-primary-300">
                  <Text className="text-primary-700 dark:text-primary-300 text-center mb-3">
                    💪 Cravings are temporary. You're stronger than they are.
                  </Text>
                  <Text
                    onPress={() => router.push('/vault')}
                    className="text-primary-600 dark:text-primary-400 text-center font-medium"
                  >
                    🔐 Open Motivation Vault →
                  </Text>
                  <Text className="text-surface-400 text-xs text-center mt-1">
                    Remind yourself why you're doing this
                  </Text>
                </Card>
              )}
            </Animated.View>
          )}

          {/* Step 3: Gratitude */}
          {step === 3 && (
            <Animated.View
              style={{
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              }}
            >
              <Text className="text-3xl font-bold text-surface-900 dark:text-surface-100 text-center mb-2">
                Gratitude moment
              </Text>
              <Text className="text-surface-500 text-center mb-8">
                What's one thing you're grateful for today?
              </Text>

              <TextInput
                value={gratitude}
                onChangeText={setGratitude}
                placeholder="I'm grateful for..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                className="bg-surface-100 dark:bg-surface-800 rounded-2xl px-4 py-4 text-surface-900 dark:text-surface-100 text-base min-h-[120px]"
                textAlignVertical="top"
              />

              <Text className="text-surface-400 text-sm text-center mt-4">
                Optional, but helpful for perspective
              </Text>

              {/* Summary */}
              <Card variant="default" className="mt-8">
                <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
                  Today's Check-In
                </Text>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-surface-500">Mood</Text>
                  <Text className="text-surface-900 dark:text-surface-100">
                    {getMoodEmoji()} {mood}/10
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-surface-500">Craving</Text>
                  <Text className="text-surface-900 dark:text-surface-100">
                    {craving}/10
                  </Text>
                </View>
              </Card>
            </Animated.View>
          )}
        </ScrollView>

        {/* Actions */}
        <View className="px-6 pb-6">
          {step < 3 ? (
            <Button title="Continue" onPress={handleNext} size="lg" />
          ) : (
            <Button
              title={isSubmitting ? 'Saving...' : 'Complete Check-In'}
              onPress={handleSubmit}
              disabled={isSubmitting}
              size="lg"
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

