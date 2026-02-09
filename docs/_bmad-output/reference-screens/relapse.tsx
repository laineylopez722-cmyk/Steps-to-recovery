/**
 * Relapse Logging Screen
 * Compassionate UI for logging a relapse with growth-focused reflection
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, Button, Slider } from '../components/ui';
import { useSobriety } from '../lib/hooks/useSobriety';
import { useProfileStore } from '../lib/store';
import { getDatabase } from '../lib/db/client';
import { encryptContent } from '../lib/encryption';

type RelapseStep = 'intro' | 'what-happened' | 'what-learned' | 'plan' | 'complete';

export default function RelapseScreen() {
  const router = useRouter();
  const { profile, soberDays } = useSobriety();
  const { loadProfile } = useProfileStore();
  
  const [step, setStep] = useState<RelapseStep>('intro');
  const [whatHappened, setWhatHappened] = useState('');
  const [whatLearned, setWhatLearned] = useState('');
  const [plan, setPlan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const nextStep = () => {
    const steps: RelapseStep[] = ['intro', 'what-happened', 'what-learned', 'plan', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      animateTransition(() => setStep(steps[currentIndex + 1]));
    }
  };

  const prevStep = () => {
    const steps: RelapseStep[] = ['intro', 'what-happened', 'what-learned', 'plan', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      animateTransition(() => setStep(steps[currentIndex - 1]));
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const db = await getDatabase();
      const now = new Date().toISOString();
      const id = `relapse_${Date.now()}`;

      // Encrypt sensitive fields before storage
      const encryptedWhatHappened = whatHappened 
        ? await encryptContent(whatHappened) 
        : null;
      const encryptedWhatLearned = whatLearned 
        ? await encryptContent(whatLearned) 
        : null;
      const encryptedPlan = plan 
        ? await encryptContent(plan) 
        : null;

      // Log the relapse record with plan
      await db.runAsync(
        `INSERT INTO relapse_records (id, date, what_happened, what_learned, plan, previous_sober_days, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, now, encryptedWhatHappened, encryptedWhatLearned, encryptedPlan, soberDays, now]
      );

      // Reset sobriety date to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await db.runAsync(
        `UPDATE sobriety_profile SET sobriety_date = ?, updated_at = ?`,
        [today.toISOString(), now]
      );

      // Reload profile to recalculate sobriety
      await loadProfile();

      // Move to complete step
      animateTransition(() => setStep('complete'));
    } catch (error) {
      console.error('Failed to log relapse:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <View className="flex-1 justify-center px-4">
            <View className="items-center mb-8">
              <Text className="text-6xl mb-4">💚</Text>
              <Text className="text-3xl font-bold text-surface-900 dark:text-surface-100 text-center">
                You're Still Here
              </Text>
              <Text className="text-lg text-surface-500 text-center mt-2">
                That takes courage. Let's take this one step at a time.
              </Text>
            </View>

            <Card variant="default" className="mb-6">
              <Text className="text-surface-700 dark:text-surface-300 text-center leading-relaxed">
                A relapse doesn't erase your progress. The days you were sober still count. 
                The growth you've made is still real. Recovery isn't a straight line — 
                it's about getting back up.
              </Text>
            </Card>

            <Card variant="outlined" className="mb-8">
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">📊</Text>
                <View>
                  <Text className="text-surface-500 text-sm">Your journey so far</Text>
                  <Text className="text-xl font-bold text-surface-900 dark:text-surface-100">
                    {soberDays} days of sobriety
                  </Text>
                  <Text className="text-sm text-surface-500">
                    This will be saved to your history
                  </Text>
                </View>
              </View>
            </Card>

            <Text className="text-surface-400 text-center text-sm mb-4">
              Would you like to log this and start fresh?
            </Text>
          </View>
        );

      case 'what-happened':
        return (
          <View className="flex-1 px-4 py-6">
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
              What happened?
            </Text>
            <Text className="text-surface-500 mb-6">
              This is optional, but reflecting can help identify patterns.
            </Text>

            <TextInput
              value={whatHappened}
              onChangeText={setWhatHappened}
              placeholder="I don't have to explain, but if it helps to write it out..."
              placeholderTextColor="#9ca3af"
              multiline
              className="bg-surface-100 dark:bg-surface-800 rounded-2xl px-4 py-4 text-surface-900 dark:text-surface-100 text-base min-h-[180px] mb-4"
              textAlignVertical="top"
            />

            <Card variant="outlined">
              <Text className="text-surface-500 text-sm">
                💡 <Text className="font-medium">Tip:</Text> Consider if you were 
                Hungry, Angry, Lonely, or Tired (HALT) before the relapse.
              </Text>
            </Card>
          </View>
        );

      case 'what-learned':
        return (
          <View className="flex-1 px-4 py-6">
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
              What did you learn?
            </Text>
            <Text className="text-surface-500 mb-6">
              Every experience teaches us something. There's no wrong answer.
            </Text>

            <TextInput
              value={whatLearned}
              onChangeText={setWhatLearned}
              placeholder="Looking back, I can see that..."
              placeholderTextColor="#9ca3af"
              multiline
              className="bg-surface-100 dark:bg-surface-800 rounded-2xl px-4 py-4 text-surface-900 dark:text-surface-100 text-base min-h-[180px] mb-4"
              textAlignVertical="top"
            />

            <View className="flex-row flex-wrap gap-2">
              {[
                'I ignored warning signs',
                'I isolated myself',
                'I was in a triggering environment',
                'I stopped doing what works',
                'I was overwhelmed',
              ].map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  onPress={() => setWhatLearned((prev) => 
                    prev ? `${prev}\n• ${suggestion}` : `• ${suggestion}`
                  )}
                  className="bg-surface-100 dark:bg-surface-800 rounded-full px-3 py-1"
                >
                  <Text className="text-sm text-surface-600 dark:text-surface-400">
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'plan':
        return (
          <View className="flex-1 px-4 py-6">
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
              What's your plan for today?
            </Text>
            <Text className="text-surface-500 mb-6">
              Just for today — one day at a time.
            </Text>

            <TextInput
              value={plan}
              onChangeText={setPlan}
              placeholder="Today, I will..."
              placeholderTextColor="#9ca3af"
              multiline
              className="bg-surface-100 dark:bg-surface-800 rounded-2xl px-4 py-4 text-surface-900 dark:text-surface-100 text-base min-h-[150px] mb-4"
              textAlignVertical="top"
            />

            <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Quick add:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                'Call my sponsor',
                'Go to a meeting',
                'Reach out to support',
                'Practice self-care',
                'Stay busy',
                'Avoid triggers',
                'Journal my feelings',
                'Get rest',
              ].map((action) => (
                <TouchableOpacity
                  key={action}
                  onPress={() => setPlan((prev) => 
                    prev ? `${prev}\n✓ ${action}` : `✓ ${action}`
                  )}
                  className="bg-primary-100 dark:bg-primary-900/30 rounded-full px-3 py-1"
                >
                  <Text className="text-sm text-primary-700 dark:text-primary-300">
                    + {action}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'complete':
        return (
          <View className="flex-1 justify-center px-4">
            <View className="items-center mb-8">
              <Text className="text-6xl mb-4">🌅</Text>
              <Text className="text-3xl font-bold text-surface-900 dark:text-surface-100 text-center">
                A New Beginning
              </Text>
              <Text className="text-lg text-surface-500 text-center mt-2">
                Your journey continues. You've got this.
              </Text>
            </View>

            <Card variant="elevated" className="bg-primary-50 dark:bg-primary-900/20 mb-6">
              <View className="items-center">
                <Text className="text-sm text-primary-600 dark:text-primary-400 mb-1">
                  Day 1 starts now
                </Text>
                <Text className="text-4xl font-bold text-primary-700 dark:text-primary-300">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </Card>

            <Card variant="default" className="mb-6">
              <Text className="text-surface-700 dark:text-surface-300 text-center leading-relaxed">
                Your {soberDays} previous days are recorded in your history. 
                They represent real growth that can never be taken away.
              </Text>
            </Card>

            <Card variant="outlined" className="mb-6">
              <Text className="text-surface-600 dark:text-surface-400 text-center italic">
                "Progress, not perfection. You're not starting from scratch — 
                you're starting from experience."
              </Text>
            </Card>
          </View>
        );
    }
  };

  const getStepNumber = () => {
    const steps: RelapseStep[] = ['intro', 'what-happened', 'what-learned', 'plan', 'complete'];
    return steps.indexOf(step);
  };

  const isComplete = step === 'complete';

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        {!isComplete && (
          <View className="px-4 py-4 border-b border-surface-200 dark:border-surface-700">
            <View className="flex-row items-center justify-between mb-3">
              <TouchableOpacity onPress={prevStep}>
                <Text className="text-primary-600">
                  {step === 'intro' ? '← Cancel' : '← Back'}
                </Text>
              </TouchableOpacity>
              <Text className="text-surface-500">
                {step !== 'intro' && `Step ${getStepNumber()} of 4`}
              </Text>
              <View className="w-16" />
            </View>

            {/* Progress */}
            {step !== 'intro' && (
              <View className="h-1 bg-surface-200 dark:bg-surface-700 rounded-full">
                <View
                  className="h-1 bg-primary-500 rounded-full"
                  style={{ width: `${(getStepNumber() / 4) * 100}%` }}
                />
              </View>
            )}
          </View>
        )}

        {/* Content */}
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
            className="flex-1"
          >
            {renderStep()}
          </Animated.View>
        </ScrollView>

        {/* Actions */}
        <View className="px-4 py-4 border-t border-surface-200 dark:border-surface-700">
          {step === 'intro' && (
            <Button
              title="Yes, Let's Start Fresh"
              onPress={nextStep}
              size="lg"
            />
          )}

          {step === 'what-happened' && (
            <View className="flex-row gap-3">
              <Button
                title="Skip"
                onPress={nextStep}
                variant="secondary"
                className="flex-1"
              />
              <Button
                title="Continue"
                onPress={nextStep}
                className="flex-1"
              />
            </View>
          )}

          {step === 'what-learned' && (
            <View className="flex-row gap-3">
              <Button
                title="Skip"
                onPress={nextStep}
                variant="secondary"
                className="flex-1"
              />
              <Button
                title="Continue"
                onPress={nextStep}
                className="flex-1"
              />
            </View>
          )}

          {step === 'plan' && (
            <Button
              title={isSubmitting ? 'Saving...' : 'Reset My Counter'}
              onPress={handleSubmit}
              disabled={isSubmitting}
              size="lg"
            />
          )}

          {step === 'complete' && (
            <Button
              title="Return Home"
              onPress={() => router.replace('/(tabs)')}
              size="lg"
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

