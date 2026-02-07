/**
 * AI Chat Hook
 * Main hook for AI conversation functionality.
 * Combines chat history with AI service.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useChatHistory } from './useChatHistory';
import { getAIService, getRecoverySystemPrompt, type ChatMessage } from '../services/aiService';
import { extractMemoriesFromMessage } from '../services/memoryExtractor';
import { useMemoryStore } from '../../../hooks/useMemoryStore';
import type { Message, Conversation, ConversationType, CrisisSignal } from '../types';

export interface UseAIChatOptions {
  userId: string;
  sobrietyDays?: number;
  currentStep?: number | null;
  userName?: string;
  sponsorName?: string | null;
  onCrisisDetected?: (signal: CrisisSignal) => void;
}

export interface UseAIChatReturn {
  // State
  messages: Message[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  startNewConversation: (type?: ConversationType, stepNumber?: number) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  clearError: () => void;
  cancelStream: () => void;

  // AI status
  isAIConfigured: boolean;

  // Conversations list
  conversations: Conversation[];
  archiveConversation: (id: string) => Promise<void>;
}

/**
 * Crisis detection keywords and phrases
 */
const CRISIS_PATTERNS = {
  high: [
    /\bsuicid(e|al)\b/i,
    /\bkill (myself|me)\b/i,
    /\bend (it|my life)\b/i,
    /\bwant to die\b/i,
    /\bbetter off dead\b/i,
  ],
  medium: [
    /\brelaps(e|ed|ing)\b/i,
    /\busing again\b/i,
    /\bcan't do this\b/i,
    /\bgive up\b/i,
    /\bhurt myself\b/i,
    /\bself.?harm\b/i,
  ],
  low: [
    /\bcraving\b/i,
    /\btriggered\b/i,
    /\btempted\b/i,
    /\bstrongly urge\b/i,
    /\bcan't cope\b/i,
  ],
};

/**
 * Detect crisis signals in user message
 */
function detectCrisis(content: string): CrisisSignal | null {
  const keywords: string[] = [];

  // Check high severity first
  for (const pattern of CRISIS_PATTERNS.high) {
    const match = content.match(pattern);
    if (match) {
      keywords.push(match[0]);
    }
  }
  if (keywords.length > 0) {
    return {
      detected: true,
      severity: 'high',
      keywords,
      suggestedAction: 'emergency',
    };
  }

  // Check medium severity
  for (const pattern of CRISIS_PATTERNS.medium) {
    const match = content.match(pattern);
    if (match) {
      keywords.push(match[0]);
    }
  }
  if (keywords.length > 0) {
    return {
      detected: true,
      severity: 'medium',
      keywords,
      suggestedAction: 'intervene',
    };
  }

  // Check low severity
  for (const pattern of CRISIS_PATTERNS.low) {
    const match = content.match(pattern);
    if (match) {
      keywords.push(match[0]);
    }
  }
  if (keywords.length > 0) {
    return {
      detected: true,
      severity: 'low',
      keywords,
      suggestedAction: 'monitor',
    };
  }

  return null;
}

/**
 * Main AI Chat Hook
 */
export function useAIChat(options: UseAIChatOptions): UseAIChatReturn {
  const {
    userId,
    sobrietyDays,
    currentStep,
    userName,
    sponsorName,
    onCrisisDetected,
  } = options;

  // Chat history management
  const chatHistory = useChatHistory(userId);
  
  // Memory store for saving extracted facts
  const memoryStore = useMemoryStore(userId);

  // Local state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAIConfigured, setIsAIConfigured] = useState(false);

  // Refs for cancellation and queue management
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageQueueRef = useRef<string[]>([]);
  const processingRef = useRef(false);

  // Check AI configuration on mount
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const service = await getAIService();
        const configured = await service.isConfigured();
        setIsAIConfigured(configured);
      } catch {
        setIsAIConfigured(false);
      }
    };
    checkConfig();
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Cancel current streaming request
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStreamingContent('');
  }, []);

  /**
   * Start a new conversation
   */
  const startNewConversation = useCallback(
    async (type: ConversationType = 'general', stepNumber?: number) => {
      try {
        setIsLoading(true);
        setError(null);
        cancelStream();

        const conversation = await chatHistory.createConversation(type, stepNumber);
        setCurrentConversation(conversation);
        setMessages([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start conversation');
      } finally {
        setIsLoading(false);
      }
    },
    [chatHistory, cancelStream]
  );

  /**
   * Load an existing conversation
   */
  const loadConversation = useCallback(
    async (conversationId: string) => {
      try {
        setIsLoading(true);
        setError(null);
        cancelStream();

        const conversation = await chatHistory.getConversation(conversationId);
        if (!conversation) {
          throw new Error('Conversation not found');
        }

        const loadedMessages = await chatHistory.getMessages(conversationId);
        setCurrentConversation(conversation);
        setMessages(loadedMessages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      } finally {
        setIsLoading(false);
      }
    },
    [chatHistory, cancelStream]
  );

  /**
   * Process message queue (prevents race conditions)
   */
  const processQueue = useCallback(async () => {
    if (processingRef.current || messageQueueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    const content = messageQueueRef.current.shift()!;

    try {
      if (!currentConversation) {
        throw new Error('No active conversation');
      }

      // Check AI configuration
      const service = await getAIService();
      if (!(await service.isConfigured())) {
        throw new Error('Please configure your AI API key in settings');
      }

      // Detect crisis signals
      const crisis = detectCrisis(content);
      if (crisis && onCrisisDetected) {
        onCrisisDetected(crisis);
      }

      // Add user message
      const userMessage = await chatHistory.addMessage(
        currentConversation.id,
        'user',
        content
      );
      setMessages(prev => [...prev, userMessage]);

      // Get memory context about the user
      let memoryContext = '';
      try {
        memoryContext = await memoryStore.generateAIContext();
      } catch {
        // Memories not available yet, that's okay
      }

      // Prepare messages for AI
      const systemPrompt = getRecoverySystemPrompt({
        sobrietyDays,
        currentStep,
        userName,
        sponsorName,
      });

      // Add memory context and crisis context to system prompt
      let contextualSystemPrompt = systemPrompt;
      if (memoryContext) {
        contextualSystemPrompt += `\n\nWhat I remember about them:\n${memoryContext}`;
      }
      if (crisis) {
        if (crisis.severity === 'high') {
          contextualSystemPrompt +=
            '\n\nIMPORTANT: The user may be in crisis. Respond with compassion, acknowledge their pain, and strongly encourage them to call a crisis hotline (988 Suicide & Crisis Lifeline) or emergency services immediately.';
        } else if (crisis.severity === 'medium') {
          contextualSystemPrompt +=
            '\n\nNote: The user may be struggling. Encourage them to reach out to their sponsor, attend a meeting, or call a support line.';
        }
      }

      const aiMessages: ChatMessage[] = [
        { role: 'system', content: contextualSystemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content },
      ];

      // Start streaming
      setIsStreaming(true);
      setStreamingContent('');
      abortControllerRef.current = new AbortController();

      let fullResponse = '';

      try {
        for await (const chunk of service.chat(aiMessages)) {
          // Check if aborted
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          fullResponse += chunk;
          setStreamingContent(fullResponse);
        }
      } catch (streamErr) {
        if (streamErr instanceof Error && streamErr.name === 'AbortError') {
          // User cancelled - don't save partial response
          return;
        }
        throw streamErr;
      }

      // Save AI response
      if (fullResponse) {
        const aiMessage = await chatHistory.addMessage(
          currentConversation.id,
          'assistant',
          fullResponse,
          { crisisDetected: crisis?.detected }
        );
        setMessages(prev => [...prev, aiMessage]);
        
        // Extract and save memories from the user message
        try {
          const memories = extractMemoriesFromMessage(
            userId,
            content,
            currentConversation.id
          );
          if (memories.length > 0) {
            await memoryStore.addMemories(memories);
          }
        } catch (memErr) {
          // Don't fail the chat if memory extraction fails
          console.warn('Memory extraction failed:', memErr);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
      processingRef.current = false;

      // Process next message in queue if any
      if (messageQueueRef.current.length > 0) {
        processQueue();
      }
    }
  }, [
    currentConversation,
    chatHistory,
    messages,
    sobrietyDays,
    currentStep,
    userName,
    sponsorName,
    onCrisisDetected,
    userId,
    memoryStore,
  ]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // If no conversation, start a new one
      if (!currentConversation) {
        await startNewConversation();
      }

      setIsLoading(true);
      setError(null);

      // Add to queue
      messageQueueRef.current.push(content.trim());

      // Wait a tick for conversation to be set
      setTimeout(() => {
        processQueue();
        setIsLoading(false);
      }, 100);
    },
    [currentConversation, startNewConversation, processQueue]
  );

  return {
    // State
    messages,
    currentConversation,
    isLoading: isLoading || chatHistory.isLoading,
    isStreaming,
    streamingContent,
    error,

    // Actions
    sendMessage,
    startNewConversation,
    loadConversation,
    clearError,
    cancelStream,

    // AI status
    isAIConfigured,

    // Conversations list
    conversations: chatHistory.conversations,
    archiveConversation: chatHistory.archiveConversation,
  };
}
