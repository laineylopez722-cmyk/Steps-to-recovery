/**
 * Chat Screen Component
 * Main chat interface for the AI Recovery Companion.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { QuickActions } from './QuickActions';
import { CrisisOverlay } from './CrisisOverlay';
import { useAIChat } from '../hooks/useAIChat';
import { useSobriety } from '../../../hooks/useSobriety';
import { useSponsorInfo } from '../../../hooks/useSponsorInfo';
import type { Message, CrisisSignal } from '../types';

interface ChatScreenProps {
  userId: string;
}

export function ChatScreen({ userId }: ChatScreenProps) {
  // Get user context for AI
  const { soberDays } = useSobriety();
  const { sponsor } = useSponsorInfo(userId);
  const [showCrisis, setShowCrisis] = useState(false);
  const [crisisSeverity, setCrisisSeverity] = useState<'low' | 'medium' | 'high'>('low');

  const handleCrisisDetected = useCallback((signal: CrisisSignal) => {
    if (signal.severity === 'high' || signal.severity === 'medium') {
      setCrisisSeverity(signal.severity);
      setShowCrisis(true);
    }
  }, []);

  const {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    sendMessage,
    startNewConversation,
    currentConversation,
    error,
    isAIConfigured,
  } = useAIChat({
    userId,
    sobrietyDays: soberDays,
    sponsorName: sponsor?.name,
    onCrisisDetected: handleCrisisDetected,
  });

  // Start a new conversation on mount if none exists
  useEffect(() => {
    if (!currentConversation && isAIConfigured) {
      startNewConversation('general');
    }
  }, [currentConversation, isAIConfigured, startNewConversation]);

  const showQuickActions = messages.length === 0;

  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content);
    },
    [sendMessage]
  );

  // Build display messages including streaming content
  const displayMessages = React.useMemo(() => {
    const msgs = [...messages];

    // Add streaming message if actively streaming
    if (isStreaming && streamingContent) {
      msgs.push({
        id: 'streaming',
        conversationId: currentConversation?.id || '',
        role: 'assistant' as const,
        content: streamingContent,
        createdAt: new Date(),
      });
    }

    // Reverse for inverted FlatList
    return msgs.reverse();
  }, [messages, isStreaming, streamingContent, currentConversation]);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-800 flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-white">Chat</Text>
            {!isAIConfigured && (
              <Text className="text-sm text-amber-500">Set up in Profile → AI Companion</Text>
            )}
          </View>
        </View>

        {/* Error message */}
        {error && (
          <View className="px-4 py-2 bg-red-900/50">
            <Text className="text-red-300 text-sm">{error}</Text>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble message={item} isTyping={item.id === 'streaming' && !streamingContent} />
          )}
          inverted
          contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
          accessibilityRole="list"
          accessibilityLabel="Chat messages"
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center px-8">
              <Text className="text-4xl mb-4">💬</Text>
              <Text className="text-xl text-white text-center font-semibold mb-2">
                Hey
              </Text>
              <Text className="text-gray-400 text-center text-base leading-6">
                I don't know your story yet, but I'm here for it.{'\n'}
                No pressure — just say what's on your mind.
              </Text>
            </View>
          }
        />

        {/* Quick actions (shown when no messages) */}
        {showQuickActions && <QuickActions onSelect={handleSend} disabled={isLoading} />}

        {/* Input */}
        <ChatInput onSend={handleSend} isLoading={isLoading || isStreaming} />

        {/* Crisis overlay */}
        <CrisisOverlay
          visible={showCrisis}
          onDismiss={() => setShowCrisis(false)}
          severity={crisisSeverity}
          sponsorName={sponsor?.name}
          sponsorPhone={sponsor?.phone}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
