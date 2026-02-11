/**
 * Conversation List Component
 * Shows history of past conversations.
 */

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Plus, Share2 } from 'lucide-react-native';
import { Icon } from '../../../components/ui/Icon';
import type { Conversation } from '../types';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  onArchive: (conversationId: string) => void;
  onExport?: (conversationId: string) => void;
  isLoading?: boolean;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

function getConversationIcon(type: string): string {
  switch (type) {
    case 'step_work':
      return '📝';
    case 'crisis':
      return '🆘';
    case 'check_in':
      return '✅';
    default:
      return '💬';
  }
}

export function ConversationList({
  conversations,
  currentConversationId,
  onSelect,
  onNewConversation,
  onArchive,
  onExport,
  isLoading: _isLoading,
}: ConversationListProps) {
  const navigation = useNavigation();

  const activeConversations = conversations.filter((c) => c.status === 'active');

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-800 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => navigation.goBack()}
            className="mr-3 p-1"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon as={ChevronLeft} size={24} className="text-white" />
          </Pressable>
          <Text className="text-xl font-bold text-white">Conversations</Text>
        </View>
        <Pressable
          onPress={onNewConversation}
          className="p-2 bg-amber-500 rounded-full"
          accessibilityRole="button"
          accessibilityLabel="New conversation"
        >
          <Icon as={Plus} size={20} className="text-black" />
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={activeConversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-8">
            <Text className="text-4xl mb-4">💬</Text>
            <Text className="text-gray-400 text-center text-base">
              No conversations yet.{'\n'}Start one to get going.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelect(item.id)}
            onLongPress={() => onArchive(item.id)}
            className={`
              px-4 py-4 border-b border-gray-800 flex-row items-center
              ${item.id === currentConversationId ? 'bg-gray-900' : ''}
            `}
            accessibilityRole="button"
            accessibilityLabel={`Conversation: ${item.title || 'Untitled'}`}
          >
            <View className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center mr-3">
              <Text className="text-lg">{getConversationIcon(item.type)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium" numberOfLines={1}>
                {item.title || 'New conversation'}
              </Text>
              <Text className="text-gray-500 text-sm mt-0.5">{formatDate(item.updatedAt)}</Text>
            </View>
            {onExport && (
              <Pressable
                onPress={() => onExport(item.id)}
                className="p-2 mr-1"
                accessibilityRole="button"
                accessibilityLabel="Export conversation"
                accessibilityHint="Share this conversation as text"
              >
                <Icon as={Share2} size={18} className="text-gray-500" />
              </Pressable>
            )}
            {item.id === currentConversationId && (
              <View className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </TouchableOpacity>
        )}
      />

      {/* Hint */}
      <View className="px-4 py-3 border-t border-gray-800">
        <Text className="text-gray-600 text-xs text-center">
          Long press to archive · Tap share icon to export
        </Text>
      </View>
    </SafeAreaView>
  );
}
