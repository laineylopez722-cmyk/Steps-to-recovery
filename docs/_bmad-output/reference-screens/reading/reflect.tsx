/**
 * Reading Reflection Screen
 * Write or edit a reflection on today's reading
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useReading } from '../../lib/hooks/useReading';
import { Card, Button } from '../../components/ui';
import { LoadingState } from '../../components/common';

export default function ReflectScreen() {
  const router = useRouter();
  const {
    todayReading,
    todayReflection,
    hasReflectedToday,
    isLoading,
    submitReflection,
    decryptReflection,
    shortDate,
  } = useReading();

  const [reflection, setReflection] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingReflection, setIsLoadingReflection] = useState(false);

  // Load existing reflection if present
  useEffect(() => {
    const loadExistingReflection = async () => {
      if (todayReflection) {
        setIsLoadingReflection(true);
        try {
          const decrypted = await decryptReflection(todayReflection);
          setReflection(decrypted);
        } catch (error) {
          console.error('Failed to decrypt reflection:', error);
        } finally {
          setIsLoadingReflection(false);
        }
      }
    };

    loadExistingReflection();
  }, [todayReflection]);

  const handleSave = async () => {
    if (!reflection.trim()) {
      Alert.alert('Empty Reflection', 'Please write something before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await submitReflection(reflection.trim());
      Alert.alert(
        'Reflection Saved',
        'Your reflection has been saved securely.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Failed to save reflection:', error);
      Alert.alert('Error', 'Failed to save your reflection. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingReflection) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        <LoadingState message="Loading..." />
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
            {hasReflectedToday ? 'Edit Reflection' : 'Write Reflection'}
          </Text>
          <Text className="text-xs text-surface-500">{shortDate}</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || !reflection.trim()}
          className="px-3 py-1.5"
          accessibilityRole="button"
          accessibilityLabel="Save reflection"
        >
          <Text
            className={`font-semibold ${
              reflection.trim()
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-surface-400'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 py-4">
          {/* Reading Title Reference */}
          {todayReading && (
            <Card
              variant="outlined"
              className="mb-4 bg-surface-100 dark:bg-surface-800/50"
            >
              <View className="flex-row items-center">
                <Text className="text-lg mr-2">📖</Text>
                <View className="flex-1">
                  <Text className="text-xs text-surface-500 uppercase">
                    Today's Reading
                  </Text>
                  <Text className="text-base font-medium text-surface-900 dark:text-surface-100">
                    {todayReading.title}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Reflection Prompt */}
          {todayReading && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-2">
                Reflection Prompt
              </Text>
              <Text className="text-base text-surface-700 dark:text-surface-300 italic">
                "{todayReading.reflectionPrompt}"
              </Text>
            </View>
          )}

          {/* Text Input */}
          <View className="flex-1 mb-4">
            <Text className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-2">
              Your Reflection
            </Text>
            <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 min-h-[200px]">
              <TextInput
                value={reflection}
                onChangeText={setReflection}
                placeholder="What does this reading mean to you? How does it apply to your life today?"
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                className="flex-1 p-4 text-base text-surface-900 dark:text-surface-100 leading-6"
                style={{ minHeight: 200 }}
                accessibilityLabel="Reflection text input"
                accessibilityHint="Write your thoughts about today's reading"
              />
            </View>
            <Text className="text-xs text-surface-500 mt-2">
              Your reflection is encrypted and stored securely on your device.
            </Text>
          </View>

          {/* Save Button */}
          <Button
            title={hasReflectedToday ? 'Update Reflection' : 'Save Reflection'}
            onPress={handleSave}
            loading={isSaving}
            disabled={!reflection.trim()}
            size="lg"
          />

          {/* Word count */}
          <Text className="text-xs text-surface-500 text-center mt-3">
            {reflection.split(/\s+/).filter(Boolean).length} words
          </Text>

          {/* Bottom spacing */}
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

