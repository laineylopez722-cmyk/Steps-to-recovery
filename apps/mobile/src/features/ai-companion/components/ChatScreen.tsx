/**
 * Chat Screen Component
 * Main chat interface for the AI Recovery Companion.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Settings } from 'lucide-react-native';
import { Icon } from '../../../components/ui/Icon';
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
  const navigation = useNavigation();
  
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
    sendWelcomeMessage,
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

  // Track if we've sent welcome
  const welcomeSentRef = useRef(false);

  // Start a new conversation on mount if none exists
  useEffect(() => {
    if (!currentConversation && isAIConfigured) {
      startNewConversation('general');
    }
  }, [currentConversation, isAIConfigured, startNewConversation]);

  // Send welcome message for new conversations
  useEffect(() => {
    if (
      currentConversation &&
      messages.length === 0 &&
      isAIConfigured &&
      !welcomeSentRef.current &&
      !isLoading &&
      !isStreaming
    ) {
      welcomeSentRef.current = true;
      sendWelcomeMessage();
    }
  }, [currentConversation, messages.length, isAIConfigured, isLoading, isStreaming, sendWelcomeMessage]);

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
          <View className="flex-row items-center">
            <Pressable
              onPress={() => navigation.goBack()}
              className="mr-3 p-1"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Icon as={ChevronLeft} size={24} className="text-white" />
            </Pressable>
            <View>
              <Text className="text-xl font-bold text-white">Chat</Text>
              {!isAIConfigured && (
                <Text className="text-sm text-amber-500">Tap ⚙️ to set up</Text>
              )}
            </View>
          </View>
          <Pressable
            onPress={() => (navigation as any).navigate('ProfileStack', { screen: 'AISettings' })}
            className="p-2"
            accessibilityRole="button"
            accessibilityLabel="AI Settings"
          >
            <Icon as={Settings} size={20} className="text-gray-400" />
          </Pressable>
        </View>

        {/* Error message */}
        {error && (
          <Pressable 
            onPress={() => {/* Could add retry here */}}
            className="mx-4 mt-2 px-4 py-3 bg-red-950/50 rounded-xl border border-red-900/50"
          >
            <Text className="text-red-300 text-sm">
              {error.includes('API key') || error.includes('configured')
                ? '⚙️ Tap the settings icon to add your API key'
                : error.includes('limit')
                ? '⏳ Daily limit reached. Try again tomorrow or add your own API key.'
                : `Something went wrong. ${error}`
              }
            </Text>
          </Pressable>
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
              {isLoading || isStreaming ? (
                // Loading state - waiting for welcome message
                <View className="items-center">
                  <Text className="text-4xl mb-4">💭</Text>
                  <Text className="text-gray-500 text-center">
                    {isStreaming ? '' : 'Starting conversation...'}
                  </Text>
                </View>
              ) : (
                // Empty state
                <>
                  <Text className="text-4xl mb-4">💬</Text>
                  <Text className="text-xl text-white text-center font-semibold mb-2">
                    {soberDays && soberDays > 0 
                      ? `Day ${soberDays}. How you doing?` 
                      : 'Hey there'}
                  </Text>
                  <Text className="text-gray-400 text-center text-base leading-6">
                    I'm here to listen, not judge.{'\n'}
                    Say whatever's on your mind.
                  </Text>
                </>
              )}
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
