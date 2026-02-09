/**
 * Chat Screen Component
 * 
 * Apple-inspired chat interface.
 * Clean, minimal, focused on content.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  Text, 
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Settings } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Icon } from '../../../components/ui/Icon';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { QuickActions } from './QuickActions';
import { CrisisOverlay } from './CrisisOverlay';
import { useAIChat } from '../hooks/useAIChat';
import { useSobriety } from '../../../hooks/useSobriety';
import { useSponsorInfo } from '../../../hooks/useSponsorInfo';
import { ds } from '../../../design-system/tokens/ds';
import type { Message, CrisisSignal } from '../types';

interface ChatScreenProps {
  userId: string;
}

export function ChatScreen({ userId }: ChatScreenProps) {
  const navigation = useNavigation();
  
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

  const welcomeSentRef = useRef(false);

  useEffect(() => {
    if (!currentConversation && isAIConfigured) {
      startNewConversation('general');
    }
  }, [currentConversation, isAIConfigured, startNewConversation]);

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

  const displayMessages = React.useMemo(() => {
    const msgs = [...messages];

    if (isStreaming && streamingContent) {
      msgs.push({
        id: 'streaming',
        conversationId: currentConversation?.id || '',
        role: 'assistant' as const,
        content: streamingContent,
        createdAt: new Date(),
      });
    }

    return msgs.reverse();
  }, [messages, isStreaming, streamingContent, currentConversation]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Header - Minimal */}
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Icon as={ChevronLeft} size={26} className="text-white" />
            </Pressable>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Chat</Text>
              {!isAIConfigured && (
                <Text style={styles.headerSubtitle}>Set up required</Text>
              )}
            </View>
            
            <Pressable
              onPress={() => (navigation as any).navigate('Profile', { screen: 'AISettings' })}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="AI Settings"
            >
              <Icon as={Settings} size={22} className="text-gray-400" />
            </Pressable>
          </View>

          {/* Error message */}
          {error && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {error.includes('API key') || error.includes('configured')
                  ? 'Tap settings to add your API key'
                  : error.includes('limit')
                  ? 'Daily limit reached. Try again tomorrow.'
                  : error
                }
              </Text>
            </Animated.View>
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
            contentContainerStyle={styles.messageList}
            accessibilityRole="list"
            accessibilityLabel="Chat messages"
            ListEmptyComponent={
              <View style={styles.emptyState}>
                {isLoading || isStreaming ? (
                  <Animated.View entering={FadeIn.duration(300)} style={styles.emptyContent}>
                    <Text style={styles.emptyEmoji}>💭</Text>
                  </Animated.View>
                ) : (
                  <Animated.View entering={FadeInUp.duration(400)} style={styles.emptyContent}>
                    <Text style={styles.emptyTitle}>
                      {soberDays && soberDays > 0 
                        ? `Day ${soberDays}` 
                        : 'Hey'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      What's on your mind?
                    </Text>
                  </Animated.View>
                )}
              </View>
            }
          />

          {/* Quick actions */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.bgPrimary,
  },
  safe: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ds.colors.borderSubtle,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: ds.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonPressed: {
    backgroundColor: ds.colors.bgTertiary,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    ...ds.typography.body,
    fontWeight: '600',
    color: ds.colors.textPrimary,
  },
  headerSubtitle: {
    ...ds.typography.micro,
    color: ds.colors.accent,
    marginTop: 1,
  },

  // Error
  errorContainer: {
    marginHorizontal: ds.space[5],
    marginTop: ds.space[3],
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[3],
    backgroundColor: ds.colors.errorMuted,
    borderRadius: ds.radius.md,
  },
  errorText: {
    ...ds.typography.caption,
    color: ds.colors.error,
    textAlign: 'center',
  },

  // Messages
  messageList: {
    paddingVertical: ds.space[4],
    flexGrow: 1,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ds.space[10],
    transform: [{ scaleY: -1 }], // Flip for inverted list
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    ...ds.typography.h1,
    color: ds.colors.textPrimary,
    textAlign: 'center',
    marginBottom: ds.space[2],
  },
  emptySubtitle: {
    ...ds.typography.body,
    color: ds.colors.textTertiary,
    textAlign: 'center',
  },
});
