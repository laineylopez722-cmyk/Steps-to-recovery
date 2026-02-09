/**
 * Achievement Detail Screen
 * Shows full details of a single achievement
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Button } from '../../components/ui';
import { useAchievements } from '../../lib/hooks/useAchievements';
import type { Achievement } from '../../lib/types';

export default function AchievementDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    achievements,
    selfCheckAchievement,
    saveReflection,
    getReflection,
  } = useAchievements();

  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [reflection, setReflection] = useState('');
  const [existingReflection, setExistingReflection] = useState<string | null>(null);
  const [isEditingReflection, setIsEditingReflection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Find achievement from loaded list
  useEffect(() => {
    if (id && achievements.length > 0) {
      const found = achievements.find((a) => a.id === id);
      setAchievement(found || null);
    }
  }, [id, achievements]);

  // Load existing reflection
  useEffect(() => {
    async function loadReflection() {
      if (id) {
        const saved = await getReflection(id);
        setExistingReflection(saved);
        if (saved) setReflection(saved);
      }
    }
    loadReflection();
  }, [id, getReflection]);

  const handleSelfCheck = useCallback(async () => {
    if (!achievement) return;

    Alert.alert(
      'Confirm Achievement',
      `Have you completed "${achievement.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I did it!',
          onPress: async () => {
            setIsLoading(true);
            const updated = await selfCheckAchievement(achievement.id);
            if (updated) {
              setAchievement(updated);
            }
            setIsLoading(false);
          },
        },
      ]
    );
  }, [achievement, selfCheckAchievement]);

  const handleSaveReflection = useCallback(async () => {
    if (!achievement || !reflection.trim()) return;

    setIsLoading(true);
    await saveReflection(achievement.id, reflection.trim());
    setExistingReflection(reflection.trim());
    setIsEditingReflection(false);
    setIsLoading(false);
  }, [achievement, reflection, saveReflection]);

  if (!achievement) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900 items-center justify-center">
        <Text className="text-surface-500">Achievement not found</Text>
        <Button
          title="Go Back"
          variant="ghost"
          onPress={() => router.back()}
          className="mt-4"
        />
      </SafeAreaView>
    );
  }

  const { title, description, icon, status, current, target, unlockedAt, unlockType, category } = achievement;
  const isUnlocked = status === 'unlocked';
  const isInProgress = status === 'in_progress';
  const isSelfCheck = unlockType === 'self_check';
  const progress = target && current ? Math.round((current / target) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-surface-200 dark:border-surface-700">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary-600 text-lg">←</Text>
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-semibold text-surface-900 dark:text-surface-100 text-center mr-6">
            Achievement
          </Text>
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          {/* Achievement Header */}
          <View className="items-center mb-8">
            <View
              className={`w-24 h-24 rounded-full items-center justify-center mb-4 ${
                isUnlocked
                  ? 'bg-secondary-100 dark:bg-secondary-900'
                  : 'bg-surface-200 dark:bg-surface-700'
              }`}
            >
              <Text className="text-5xl">{icon}</Text>
            </View>

            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center">
              {title}
            </Text>

            <Text className="text-base text-surface-500 text-center mt-2">
              {description}
            </Text>

            {/* Category badge */}
            <View className="mt-3 px-3 py-1 bg-surface-200 dark:bg-surface-700 rounded-full">
              <Text className="text-xs text-surface-600 dark:text-surface-400 capitalize">
                {category.replace('_', ' ')}
              </Text>
            </View>
          </View>

          {/* Status Card */}
          <Card variant="elevated" className="mb-6">
            {isUnlocked ? (
              <View className="items-center">
                <Text className="text-secondary-500 text-2xl mb-2">✓ Unlocked</Text>
                {unlockedAt && (
                  <Text className="text-surface-500">
                    Achieved on {formatDate(unlockedAt)}
                  </Text>
                )}
              </View>
            ) : isInProgress ? (
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-surface-700 dark:text-surface-300">Progress</Text>
                  <Text className="text-primary-600 font-semibold">
                    {current || 0} / {target}
                  </Text>
                </View>
                <View className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </View>
                <Text className="text-xs text-surface-500 text-right mt-1">
                  {progress}% complete
                </Text>
              </View>
            ) : (
              <View className="items-center">
                <Text className="text-surface-400 text-lg mb-2">🔒 Locked</Text>
                <Text className="text-surface-500 text-center">
                  {getUnlockHint(achievement)}
                </Text>
              </View>
            )}
          </Card>

          {/* Self-check button */}
          {isSelfCheck && !isUnlocked && (
            <Card variant="outlined" className="mb-6">
              <Text className="text-surface-700 dark:text-surface-300 mb-3 text-center">
                This achievement is self-reported. If you've completed it, claim it!
              </Text>
              <Button
                title="I Did This!"
                variant="primary"
                onPress={handleSelfCheck}
                loading={isLoading}
                className="w-full"
              />
            </Card>
          )}

          {/* Reflection Section */}
          {isUnlocked && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
                Your Reflection
              </Text>

              {existingReflection && !isEditingReflection ? (
                <Card variant="default">
                  <Text className="text-surface-700 dark:text-surface-300 leading-relaxed">
                    {existingReflection}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsEditingReflection(true)}
                    className="mt-3"
                  >
                    <Text className="text-primary-600 text-sm">Edit reflection</Text>
                  </TouchableOpacity>
                </Card>
              ) : (
                <View>
                  <Text className="text-sm text-surface-500 mb-2">
                    What does this achievement mean to you?
                  </Text>
                  <TextInput
                    value={reflection}
                    onChangeText={setReflection}
                    placeholder="Write your reflection..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    className="bg-surface-100 dark:bg-surface-800 rounded-xl p-4 text-surface-900 dark:text-surface-100 min-h-[120px] mb-3"
                    textAlignVertical="top"
                  />
                  <View className="flex-row gap-3">
                    {isEditingReflection && (
                      <Button
                        title="Cancel"
                        variant="ghost"
                        onPress={() => {
                          setIsEditingReflection(false);
                          setReflection(existingReflection || '');
                        }}
                        className="flex-1"
                      />
                    )}
                    <Button
                      title="Save Reflection"
                      variant="primary"
                      onPress={handleSaveReflection}
                      loading={isLoading}
                      disabled={!reflection.trim()}
                      className="flex-1"
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Tips section */}
          {!isUnlocked && (
            <Card variant="default" className="mb-6">
              <View className="flex-row items-start gap-3">
                <Text className="text-xl">💡</Text>
                <View className="flex-1">
                  <Text className="text-surface-900 dark:text-surface-100 font-medium mb-1">
                    How to unlock
                  </Text>
                  <Text className="text-surface-600 dark:text-surface-400 text-sm">
                    {getUnlockInstructions(achievement)}
                  </Text>
                </View>
              </View>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getUnlockHint(achievement: Achievement): string {
  const { unlockType, target, requiresDaysClean } = achievement;

  if (requiresDaysClean) {
    return `Requires ${requiresDaysClean} days clean`;
  }

  switch (unlockType) {
    case 'count':
      return `Complete ${target} to unlock`;
    case 'streak':
      return `Maintain a ${target}-day streak`;
    case 'progressive':
      return `Complete ${target}% to unlock`;
    case 'self_check':
      return 'Self-reported achievement';
    case 'automatic':
      return 'Unlocks automatically when conditions are met';
    default:
      return 'Keep working your program!';
  }
}

function getUnlockInstructions(achievement: Achievement): string {
  const { id, unlockType, target } = achievement;

  // Specific instructions based on achievement ID
  const instructions: Record<string, string> = {
    'fellowship-newcomer': 'Start your recovery journey by setting your sobriety date.',
    'fellowship-first-contact': 'Add your first recovery contact in the Contacts section.',
    'fellowship-building-network': 'Add 3 recovery contacts to build your support network.',
    'fellowship-connected': 'Add 10 recovery contacts. Your network is your lifeline!',
    'fellowship-home-group': 'Set a home group meeting in My Meetings.',
    'fellowship-sponsor': 'Add someone with the "Sponsor" role to your contacts.',
    'fellowship-voice': 'Share at a meeting - even just your name counts! Then come back and claim this.',
    'fellowship-service': 'Give back through service work, then claim this achievement.',
    'fellowship-90-in-90': 'Attend 90 meetings in your first 90 days of recovery.',
    'service-first-meeting': 'Log your first meeting attendance.',
    'practice-reader-7': 'Read the daily reading for 7 consecutive days.',
    'practice-checkin-7': 'Complete your daily check-in for 7 consecutive days.',
  };

  if (instructions[id]) {
    return instructions[id];
  }

  // Generic instructions based on type
  switch (unlockType) {
    case 'count':
      return `Keep going! You need to reach ${target} to unlock this achievement.`;
    case 'streak':
      return `Maintain your streak for ${target} consecutive days.`;
    case 'progressive':
      return `Make progress by answering step work questions.`;
    case 'self_check':
      return 'Complete this milestone in your recovery, then come back and claim it!';
    default:
      return 'Keep working your program and this will unlock automatically.';
  }
}

