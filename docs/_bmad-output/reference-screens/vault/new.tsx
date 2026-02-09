/**
 * Create Vault Item Screen
 * Add personal motivations to the vault
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
import { Card, Button } from '../../components/ui';
import { useVaultStore } from '../../lib/store';
import type { VaultItemType } from '../../lib/types';

const TYPE_OPTIONS: { type: VaultItemType; emoji: string; label: string; description: string }[] = [
  {
    type: 'letter',
    emoji: '✉️',
    label: 'Letter to Self',
    description: 'Write a message to read when struggling',
  },
  {
    type: 'reason',
    emoji: '💪',
    label: 'Reason for Recovery',
    description: 'Why you chose this path',
  },
  {
    type: 'quote',
    emoji: '💬',
    label: 'Meaningful Quote',
    description: 'Words that resonate with you',
  },
  {
    type: 'photo',
    emoji: '📷',
    label: 'Photo Memory',
    description: 'Describe a photo or memory',
  },
  {
    type: 'audio',
    emoji: '🎙️',
    label: 'Voice Note',
    description: 'Write what you would say to yourself',
  },
];

const WRITING_PROMPTS: Record<VaultItemType, string[]> = {
  letter: [
    'Dear struggling me, I want you to remember...',
    'When you feel like giving up, remember that...',
    'You are stronger than you think because...',
    'The best version of you is worth fighting for because...',
  ],
  reason: [
    'I chose recovery because...',
    'My family/loved ones mean everything to me because...',
    'I deserve a better life because...',
    'The person I want to become is...',
  ],
  quote: [
    'This quote changed my perspective: ',
    'When I read these words, I feel...',
    'This reminds me that...',
  ],
  photo: [
    'This photo represents...',
    'When I look at this memory, I remember...',
    'This moment was important because...',
  ],
  audio: [
    'If I could tell myself one thing right now...',
    'The voice I need to hear says...',
    'A message from my recovered self: ',
  ],
};

export default function NewVaultItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { addItem, isLoading } = useVaultStore();

  const [selectedType, setSelectedType] = useState<VaultItemType>(
    (params.type as VaultItemType) || 'letter'
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const currentPrompts = WRITING_PROMPTS[selectedType];

  const applyPrompt = (prompt: string) => {
    if (!content) {
      setContent(prompt);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please give your motivation a title.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Content Required', 'Please write something meaningful.');
      return;
    }

    try {
      await addItem({
        type: selectedType,
        title: title.trim(),
        content: content.trim(),
        isFavorite,
      });

      Alert.alert(
        '🔐 Added to Vault',
        'Your motivation has been securely stored.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Failed to create vault item:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
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
              Add Motivation
            </Text>
            <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)}>
              <Text className="text-2xl">{isFavorite ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          </View>

          {/* Type Selector */}
          <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
            Type
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            <View className="flex-row gap-2 px-1">
              {TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.type}
                  onPress={() => setSelectedType(option.type)}
                  className={`px-4 py-3 rounded-xl min-w-[120px] ${
                    selectedType === option.type
                      ? 'bg-primary-500'
                      : 'bg-surface-100 dark:bg-surface-800'
                  }`}
                >
                  <Text className="text-center text-xl mb-1">{option.emoji}</Text>
                  <Text
                    className={`text-center text-sm font-medium ${
                      selectedType === option.type
                        ? 'text-white'
                        : 'text-surface-700 dark:text-surface-300'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Title */}
          <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
            Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={
              selectedType === 'letter'
                ? 'e.g., Letter for Hard Days'
                : selectedType === 'reason'
                ? 'e.g., My Children'
                : 'Give it a meaningful title'
            }
            placeholderTextColor="#9ca3af"
            className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 mb-6"
          />

          {/* Writing Prompts */}
          <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
            Prompts (tap to use)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <View className="flex-row gap-2 px-1">
              {currentPrompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => applyPrompt(prompt)}
                  className="px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 max-w-[200px]"
                >
                  <Text
                    className="text-sm text-surface-600 dark:text-surface-400"
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
            Content
          </Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Write something meaningful..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={10}
            className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-4 text-surface-900 dark:text-surface-100 min-h-[200px] mb-6"
            textAlignVertical="top"
          />

          {/* Tips based on type */}
          <Card variant="elevated" className="mb-6 bg-secondary-50 dark:bg-secondary-900/30">
            <View className="flex-row items-start gap-3">
              <Text className="text-2xl">💡</Text>
              <View className="flex-1">
                <Text className="text-sm font-medium text-secondary-800 dark:text-secondary-200 mb-1">
                  Tip for {TYPE_OPTIONS.find((t) => t.type === selectedType)?.label}
                </Text>
                <Text className="text-sm text-secondary-600 dark:text-secondary-400">
                  {selectedType === 'letter' &&
                    'Write as if speaking to yourself during your hardest moment. Be compassionate.'}
                  {selectedType === 'reason' &&
                    'Be specific. "My son Jake\'s smile" is more powerful than "my family."'}
                  {selectedType === 'quote' &&
                    'Include why this quote matters to you, not just the words.'}
                  {selectedType === 'photo' &&
                    'Describe the moment in vivid detail. What do you see, feel, remember?'}
                  {selectedType === 'audio' &&
                    'Write what you would say out loud. Your voice of strength.'}
                </Text>
              </View>
            </View>
          </Card>

          {/* When to use */}
          <Card variant="outlined" className="mb-6">
            <View className="flex-row items-center gap-2">
              <Text>🆘</Text>
              <Text className="text-sm text-surface-500 flex-1">
                This will be available in your vault when you need a reminder
                of why you're fighting. Access it anytime you're struggling.
              </Text>
            </View>
          </Card>

          <View className="h-8" />
        </ScrollView>

        {/* Save Button */}
        <View className="px-4 py-4 border-t border-surface-200 dark:border-surface-700">
          <Button
            title={isLoading ? 'Saving...' : 'Save to Vault 🔐'}
            onPress={handleCreate}
            disabled={isLoading || !title.trim() || !content.trim()}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

