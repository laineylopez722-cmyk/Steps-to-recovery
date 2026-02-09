/**
 * Journal Entry Detail Screen
 * View, edit, or delete a journal entry
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card } from '../../components/ui';
import { useJournalStore } from '../../lib/store';
import { decryptJournalContent } from '../../lib/db/models';
import { DEFAULT_EMOTIONS } from '../../lib/constants/emotions';
import type { JournalEntry } from '../../lib/types';

export default function JournalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, deleteEntry, loadEntries } = useJournalStore();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [decryptedContent, setDecryptedContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadEntry();
  }, [id]);

  const loadEntry = async () => {
    setIsLoading(true);
    try {
      // Find entry from store or load fresh
      let foundEntry = entries.find((e) => e.id === id);
      
      if (!foundEntry) {
        await loadEntries();
        foundEntry = entries.find((e) => e.id === id);
      }

      if (foundEntry) {
        setEntry(foundEntry);
        // Decrypt content
        const content = await decryptJournalContent(foundEntry);
        setDecryptedContent(content);
      }
    } catch (error) {
      console.error('Failed to load entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteEntry(id!);
              router.back();
            } catch (error) {
              console.error('Failed to delete entry:', error);
              Alert.alert('Error', 'Failed to delete entry.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const getTypeLabel = () => {
    switch (entry?.type) {
      case 'freeform':
        return '✏️ Free Write';
      case 'step-work':
        return `📖 Step ${entry.stepNumber || ''} Work`;
      case 'meeting-reflection':
        return '👥 Meeting Reflection';
      case 'daily-checkin':
        return '📋 Daily Check-In';
      default:
        return 'Journal Entry';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-surface-500 mt-4">Loading entry...</Text>
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900 items-center justify-center px-6">
        <Text className="text-5xl mb-4">📝</Text>
        <Text className="text-xl font-semibold text-surface-900 dark:text-surface-100 text-center">
          Entry Not Found
        </Text>
        <Text className="text-surface-500 text-center mt-2 mb-6">
          This entry may have been deleted.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary-600 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
          Entry
        </Text>
        <TouchableOpacity onPress={handleDelete} disabled={isDeleting}>
          <Text className="text-red-500 text-base">
            {isDeleting ? '...' : 'Delete'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {/* Entry Header */}
        <View className="mb-4">
          <Text className="text-sm text-surface-500 mb-1">
            {getTypeLabel()}
          </Text>
          <Text className="text-sm text-surface-400">
            {formatDate(entry.createdAt)}
          </Text>
        </View>

        {/* Content */}
        <Card variant="default" className="mb-4">
          <Text className="text-surface-900 dark:text-surface-100 text-base leading-relaxed">
            {decryptedContent || 'Unable to decrypt content'}
          </Text>
        </Card>

        {/* Emotion Tags */}
        {entry.emotionTags.length > 0 && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-surface-500 mb-2">
              Emotions
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {entry.emotionTags.map((emotionName) => {
                const emotion = DEFAULT_EMOTIONS.find(
                  (e) => e.name === emotionName
                );
                return (
                  <View
                    key={emotionName}
                    style={{ backgroundColor: emotion?.color || '#6b7280' }}
                    className="px-3 py-1.5 rounded-full"
                  >
                    <Text className="text-white text-sm">{emotionName}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Mood & Craving Stats */}
        <View className="flex-row gap-3 mb-4">
          {entry.moodBefore !== undefined && (
            <Card variant="default" className="flex-1">
              <Text className="text-sm text-surface-500 mb-1">Mood Before</Text>
              <Text className="text-2xl font-bold text-primary-600">
                {entry.moodBefore}/10
              </Text>
            </Card>
          )}
          {entry.moodAfter !== undefined && (
            <Card variant="default" className="flex-1">
              <Text className="text-sm text-surface-500 mb-1">Mood After</Text>
              <Text className="text-2xl font-bold text-secondary-600">
                {entry.moodAfter}/10
              </Text>
            </Card>
          )}
        </View>

        {entry.cravingLevel !== undefined && (
          <Card variant="default" className="mb-4">
            <Text className="text-sm text-surface-500 mb-1">Craving Level</Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-full">
                <View
                  className={`h-2 rounded-full ${
                    entry.cravingLevel <= 3
                      ? 'bg-green-500'
                      : entry.cravingLevel <= 6
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${(entry.cravingLevel / 10) * 100}%` }}
                />
              </View>
              <Text className="text-surface-900 dark:text-surface-100 font-semibold">
                {entry.cravingLevel}/10
              </Text>
            </View>
          </Card>
        )}

        {/* Mood Change Indicator */}
        {entry.moodBefore !== undefined &&
          entry.moodAfter !== undefined &&
          entry.moodAfter > entry.moodBefore && (
            <Card
              variant="default"
              className="bg-green-50 dark:bg-green-900/30 mb-4"
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">📈</Text>
                <Text className="text-green-700 dark:text-green-300">
                  Writing improved your mood by{' '}
                  {entry.moodAfter - entry.moodBefore} points!
                </Text>
              </View>
            </Card>
          )}

        {/* Bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

