/**
 * View/Edit Vault Item Screen
 * Display and manage individual vault items
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Button } from '../../components/ui';
import { useVaultStore } from '../../lib/store';
import type { VaultItem, VaultItemType } from '../../lib/types';

const TYPE_CONFIG: Record<VaultItemType, { emoji: string; label: string; color: string }> = {
  letter: { emoji: '✉️', label: 'Letter to Self', color: 'bg-purple-100 dark:bg-purple-900/30' },
  photo: { emoji: '📷', label: 'Photo Memory', color: 'bg-blue-100 dark:bg-blue-900/30' },
  audio: { emoji: '🎙️', label: 'Voice Message', color: 'bg-green-100 dark:bg-green-900/30' },
  reason: { emoji: '💪', label: 'Reason for Recovery', color: 'bg-amber-100 dark:bg-amber-900/30' },
  quote: { emoji: '💬', label: 'Meaningful Quote', color: 'bg-rose-100 dark:bg-rose-900/30' },
};

export default function ViewVaultItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItemById, updateItem, deleteItem, toggleFavorite, items } = useVaultStore();

  const [item, setItem] = useState<VaultItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    loadItem();
  }, [id]);

  useEffect(() => {
    // Update item when store changes (for favorites toggle)
    const updatedItem = items.find((i) => i.id === id);
    if (updatedItem) {
      setItem(updatedItem);
    }
  }, [items, id]);

  const loadItem = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const loaded = await getItemById(id);
      if (loaded) {
        setItem(loaded);
        setEditedTitle(loaded.title);
        setEditedContent(loaded.content);
      }
    } catch (error) {
      console.error('Failed to load vault item:', error);
      Alert.alert('Error', 'Failed to load item');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!item || !editedTitle.trim() || !editedContent.trim()) return;

    try {
      await updateItem(item.id, {
        title: editedTitle.trim(),
        content: editedContent.trim(),
      });
      setItem({
        ...item,
        title: editedTitle.trim(),
        content: editedContent.trim(),
      });
      setIsEditing(false);
      Alert.alert('Saved', 'Your changes have been saved.');
    } catch (error) {
      console.error('Failed to update vault item:', error);
      Alert.alert('Error', 'Failed to save changes.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Motivation',
      'Are you sure you want to delete this from your vault? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(id!);
              router.back();
            } catch (error) {
              console.error('Failed to delete vault item:', error);
              Alert.alert('Error', 'Failed to delete.');
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async () => {
    if (!item) return;
    await toggleFavorite(item.id);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900 items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900 items-center justify-center">
        <Text className="text-surface-500">Item not found</Text>
        <Button title="Go Back" onPress={() => router.back()} className="mt-4" />
      </SafeAreaView>
    );
  }

  const config = TYPE_CONFIG[item.type];

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary-600">← Back</Text>
          </TouchableOpacity>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={handleToggleFavorite}>
              <Text className="text-2xl">{item.isFavorite ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text className="text-primary-600">{isEditing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Type Badge */}
        <View className="flex-row items-center gap-2 mb-4">
          <View className={`px-3 py-1 rounded-full ${config.color}`}>
            <Text className="text-sm">
              {config.emoji} {config.label}
            </Text>
          </View>
          {item.isFavorite && (
            <View className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Text className="text-sm">⭐ Favorite</Text>
            </View>
          )}
        </View>

        {/* Title */}
        {isEditing ? (
          <TextInput
            value={editedTitle}
            onChangeText={setEditedTitle}
            className="text-2xl font-bold text-surface-900 dark:text-surface-100 bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 mb-4"
          />
        ) : (
          <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-4">
            {item.title}
          </Text>
        )}

        {/* Content */}
        <Card variant="elevated" className="mb-6">
          {isEditing ? (
            <TextInput
              value={editedContent}
              onChangeText={setEditedContent}
              multiline
              numberOfLines={15}
              className="text-surface-700 dark:text-surface-300 leading-7 min-h-[300px]"
              textAlignVertical="top"
            />
          ) : (
            <Text className="text-surface-700 dark:text-surface-300 leading-7 text-base">
              {item.content}
            </Text>
          )}
        </Card>

        {/* Edit Actions */}
        {isEditing && (
          <Button
            title="Save Changes"
            onPress={handleSaveEdit}
            disabled={!editedTitle.trim() || !editedContent.trim()}
            className="mb-4"
          />
        )}

        {/* Stats */}
        <Card variant="outlined" className="mb-6">
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-primary-600">{item.viewCount}</Text>
              <Text className="text-xs text-surface-500">Times Viewed</Text>
            </View>
            <View className="w-px bg-surface-200 dark:bg-surface-700" />
            <View className="items-center flex-1">
              <Text className="text-sm text-surface-700 dark:text-surface-300">
                {item.createdAt.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Text className="text-xs text-surface-500">Created</Text>
            </View>
            {item.lastViewedAt && (
              <>
                <View className="w-px bg-surface-200 dark:bg-surface-700" />
                <View className="items-center flex-1">
                  <Text className="text-sm text-surface-700 dark:text-surface-300">
                    {item.lastViewedAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text className="text-xs text-surface-500">Last Viewed</Text>
                </View>
              </>
            )}
          </View>
        </Card>

        {/* Encouragement */}
        <Card variant="default" className="mb-6 bg-primary-50 dark:bg-primary-900/20">
          <View className="items-center">
            <Text className="text-4xl mb-2">💪</Text>
            <Text className="text-center text-primary-800 dark:text-primary-200 font-medium">
              You saved this for a reason
            </Text>
            <Text className="text-center text-primary-600 dark:text-primary-400 text-sm mt-1">
              Let it remind you of your strength
            </Text>
          </View>
        </Card>

        {/* Delete */}
        <TouchableOpacity
          onPress={handleDelete}
          className="py-4 items-center"
        >
          <Text className="text-red-500">Delete from Vault</Text>
        </TouchableOpacity>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

