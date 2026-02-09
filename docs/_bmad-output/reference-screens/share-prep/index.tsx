/**
 * Share Preparation Screen
 * Prepare notes before sharing at a meeting
 */

import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Card, Button } from '../../components/ui';
import { useSharePrepStore } from '../../lib/store/sharePrepStore';
import { useReading } from '../../lib/hooks/useReading';
import { useRegularMeetings } from '../../lib/hooks/useRegularMeetings';

const PROMPTS = [
  {
    key: 'topic' as const,
    title: "Today's Topic",
    placeholder: "What's on your mind related to recovery?",
    icon: '💭',
  },
  {
    key: 'gratitude' as const,
    title: 'Gratitude',
    placeholder: "What are you grateful for today?",
    icon: '🙏',
  },
  {
    key: 'struggle' as const,
    title: 'Current Struggle',
    placeholder: "What are you working through right now?",
    icon: '💪',
  },
  {
    key: 'experience' as const,
    title: 'Experience to Share',
    placeholder: "Something from your journey that might help others...",
    icon: '🌟',
  },
  {
    key: 'other' as const,
    title: 'Other Notes',
    placeholder: "Anything else you want to remember...",
    icon: '📝',
  },
];

export default function SharePrepScreen() {
  const router = useRouter();
  const { notes, updateNote, clearNotes, hasContent, getPreviewText } = useSharePrepStore();
  const { todayReading, isLoading: readingLoading } = useReading();
  const { todayMeetings, nextMeeting } = useRegularMeetings();

  const [expandedSection, setExpandedSection] = useState<string | null>('topic');
  const [showPreview, setShowPreview] = useState(false);

  const handleClear = () => {
    if (!hasContent()) return;
    
    Alert.alert(
      'Clear Notes?',
      'Are you sure you want to clear all your preparation notes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearNotes,
        },
      ]
    );
  };

  const handleDone = () => {
    if (hasContent()) {
      Alert.alert(
        'Notes Saved',
        'Your notes are saved and will be available until you log a meeting.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      router.back();
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSection(expandedSection === key ? null : key);
  };

  // Get meeting context
  const upcomingMeeting = todayMeetings[0] || nextMeeting;

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
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text className="text-primary-600 text-lg">← Back</Text>
            </TouchableOpacity>
            {hasContent() && (
              <TouchableOpacity onPress={handleClear}>
                <Text className="text-red-500">Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="mb-6">
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
              Prepare to Share
            </Text>
            <Text className="text-surface-500">
              Jot down notes for your next share. These are private and just for you.
            </Text>
          </View>

          {/* Meeting Context */}
          {upcomingMeeting && (
            <Card variant="default" className="mb-4 bg-primary-50 dark:bg-primary-900/20">
              <View className="flex-row items-center">
                <Text className="text-lg mr-2">📅</Text>
                <View className="flex-1">
                  <Text className="text-sm text-primary-600 dark:text-primary-400">
                    {todayMeetings.length > 0 ? 'Meeting Today' : 'Next Meeting'}
                  </Text>
                  <Text className="font-semibold text-surface-900 dark:text-surface-100">
                    {upcomingMeeting.name}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Today's Reading Link */}
          {todayReading && !readingLoading && (
            <TouchableOpacity
              onPress={() => router.push('/reading')}
              className="mb-6"
            >
              <Card variant="outlined" className="border-amber-200 dark:border-amber-800">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-lg mr-2">📖</Text>
                    <View className="flex-1">
                      <Text className="text-sm text-amber-600 dark:text-amber-400">
                        Today's Reading
                      </Text>
                      <Text
                        className="text-surface-900 dark:text-surface-100 font-medium"
                        numberOfLines={1}
                      >
                        {todayReading.title}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-primary-600">View →</Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}

          {/* Prompt Sections */}
          <View className="space-y-3 mb-6">
            {PROMPTS.map((prompt) => (
              <Card key={prompt.key} variant="default">
                <TouchableOpacity
                  onPress={() => toggleSection(prompt.key)}
                  className="flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <Text className="text-xl mr-3">{prompt.icon}</Text>
                    <Text className="text-base font-medium text-surface-900 dark:text-surface-100">
                      {prompt.title}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    {notes[prompt.key].trim() && (
                      <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                    )}
                    <Text className="text-surface-400">
                      {expandedSection === prompt.key ? '▼' : '▶'}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {expandedSection === prompt.key && (
                  <View className="mt-3">
                    <TextInput
                      value={notes[prompt.key]}
                      onChangeText={(value) => updateNote(prompt.key, value)}
                      placeholder={prompt.placeholder}
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={4}
                      className="bg-surface-50 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 min-h-[100px]"
                      textAlignVertical="top"
                    />
                  </View>
                )}
              </Card>
            ))}
          </View>

          {/* Preview Toggle */}
          {hasContent() && (
            <View className="mb-6">
              <TouchableOpacity
                onPress={() => setShowPreview(!showPreview)}
                className="flex-row items-center justify-center py-3 bg-surface-100 dark:bg-surface-800 rounded-xl"
              >
                <Text className="text-primary-600 font-medium">
                  {showPreview ? '📝 Hide Preview' : '👁️ Preview Your Notes'}
                </Text>
              </TouchableOpacity>
              
              {showPreview && (
                <Card variant="outlined" className="mt-3">
                  <Text className="text-sm text-surface-500 mb-2">
                    Your complete notes:
                  </Text>
                  <Text className="text-surface-900 dark:text-surface-100 leading-6">
                    {getPreviewText() || 'No notes yet'}
                  </Text>
                </Card>
              )}
            </View>
          )}

          {/* Tips */}
          <Card variant="default" className="bg-surface-100 dark:bg-surface-800 mb-6">
            <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              💡 Tips for Sharing
            </Text>
            <View className="space-y-1">
              <Text className="text-sm text-surface-500">
                • Keep it focused on your own experience
              </Text>
              <Text className="text-sm text-surface-500">
                • Share what's worked for you, not advice
              </Text>
              <Text className="text-sm text-surface-500">
                • It's okay to be brief - every share matters
              </Text>
              <Text className="text-sm text-surface-500">
                • Start with gratitude if you're not sure what to say
              </Text>
            </View>
          </Card>

          {/* Bottom spacing */}
          <View className="h-4" />
        </ScrollView>

        {/* Bottom Actions */}
        <View className="px-4 py-4 border-t border-surface-200 dark:border-surface-700">
          <Button
            title={hasContent() ? 'Save & Close' : 'Done'}
            onPress={handleDone}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

