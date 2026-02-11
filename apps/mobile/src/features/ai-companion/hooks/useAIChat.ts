/**
 * AI Chat Hook
 * Main hook for AI conversation functionality.
 * Combines chat history with AI service.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import * as Sentry from '@sentry/react-native';
import { useChatHistory } from './useChatHistory';
import { getAIService, getRecoverySystemPrompt, type ChatMessage } from '../services/aiService';
import { extractMemoriesFromMessage } from '../services/memoryExtractor';
import {
  isOfflineMode,
  getOfflineResponse,
  cacheResponse,
  queuePendingMessage,
} from '../services/offlineFallback';
import { addToSessionCost, addToDailyCost, estimateCost } from '../services/costEstimation';
import { checkRateLimit, incrementMessageCount } from '../services/rateLimiter';
import { useMemoryStore } from '../../../hooks/useMemoryStore';
import { logger } from '../../../utils/logger';
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
  isOfflineResponse: boolean;
  remainingMessages: number | null;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  sendWelcomeMessage: () => Promise<void>;
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
  low: [/\bcraving\b/i, /\btriggered\b/i, /\btempted\b/i, /\bstrongly urge\b/i, /\bcan't cope\b/i],
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
 * Generate a short title from the first user message
 */
function generateConversationTitle(message: string): string {
  // Common patterns and their titles
  const patterns: Array<{ pattern: RegExp; title: string }> = [
    { pattern: /step\s*(\d+|work)/i, title: 'Step Work' },
    { pattern: /craving|urge|tempt/i, title: 'Craving Support' },
    { pattern: /relaps/i, title: 'Relapse Concern' },
    { pattern: /stressed|anxious|anxiety|worried/i, title: 'Stress & Anxiety' },
    { pattern: /sleep|insomnia|can't sleep/i, title: 'Sleep Troubles' },
    { pattern: /meeting|sponsor/i, title: 'Program Talk' },
    { pattern: /family|relationship|partner|spouse/i, title: 'Relationship' },
    { pattern: /work|job|boss/i, title: 'Work Stuff' },
    { pattern: /vent|off my chest|need to talk/i, title: 'Venting' },
    { pattern: /grateful|gratitude|thankful/i, title: 'Gratitude' },
    { pattern: /win|good news|celebrate/i, title: 'Good News' },
    { pattern: /morning|start.*day/i, title: 'Morning Check-in' },
    { pattern: /reflect|review|today went/i, title: 'Daily Reflection' },
  ];

  for (const { pattern, title } of patterns) {
    if (pattern.test(message)) {
      return title;
    }
  }

  // Fall back to first few words (cleaned up)
  const cleaned = message
    .replace(/[^\w\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(' ');

  return cleaned.length > 30 ? cleaned.slice(0, 30) + '...' : cleaned || 'Chat';
}

/**
 * Main AI Chat Hook
 */
export function useAIChat(options: UseAIChatOptions): UseAIChatReturn {
  const { userId, sobrietyDays, currentStep, userName, sponsorName, onCrisisDetected } = options;

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
  const [isOfflineResponse, setIsOfflineResponse] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);

  // Refs for cancellation and queue management
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageQueueRef = useRef<string[]>([]);
  const processingRef = useRef(false);

  // Check AI configuration on mount
  useEffect(() => {
    const checkConfig = async (): Promise<void> => {
      try {
        const service = await getAIService();
        const configured = await service.isConfigured();
        setIsAIConfigured(configured);
      } catch {
        setIsAIConfigured(false);
      }
    };
    const loadRateLimit = async (): Promise<void> => {
      try {
        const status = await checkRateLimit();
        setRemainingMessages(status.remaining);
      } catch {
        // Non-critical
      }
    };
    checkConfig();
    loadRateLimit();
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
    [chatHistory, cancelStream],
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
    [chatHistory, cancelStream],
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

    const agentSpan = Sentry.startInactiveSpan({
      op: 'gen_ai.invoke_agent',
      name: 'invoke_agent RecoveryCompanion',
    });
    agentSpan?.setAttribute('gen_ai.agent.name', 'RecoveryCompanion');

    try {
      if (!currentConversation) {
        throw new Error('No active conversation');
      }

      // Check AI configuration
      const service = await getAIService();
      if (!(await service.isConfigured())) {
        throw new Error('Please configure your AI API key in settings');
      }
      agentSpan?.setAttribute('gen_ai.request.model', service.getModel());

      // Detect crisis signals
      const crisis = detectCrisis(content);
      if (crisis && onCrisisDetected) {
        onCrisisDetected(crisis);
      }

      // Add user message
      const userMessage = await chatHistory.addMessage(currentConversation.id, 'user', content);
      setMessages((prev) => [...prev, userMessage]);

      // Check if offline — use cached/prewritten response instead
      const offline = await isOfflineMode();
      if (offline) {
        setIsOfflineResponse(true);
        const offlineResult = await getOfflineResponse(content);

        // Save offline response as assistant message
        const offlineMsg = await chatHistory.addMessage(
          currentConversation.id,
          'assistant',
          offlineResult.content,
          { offline: true, offlineSource: offlineResult.source },
        );
        setMessages((prev) => [...prev, offlineMsg]);

        // Queue the user message for sending when back online
        await queuePendingMessage(content, currentConversation.id);

        // Auto-title if first exchange
        if (messages.length === 0 && content.length > 0) {
          const title = generateConversationTitle(content);
          try {
            await chatHistory.updateConversationTitle(currentConversation.id, title);
            setCurrentConversation((prev) => (prev ? { ...prev, title } : prev));
          } catch {
            // Title update failed, not critical
          }
        }

        return;
      }

      setIsOfflineResponse(false);

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
        ...messages.map((m) => ({ role: m.role, content: m.content })),
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
          { crisisDetected: crisis?.detected },
        );
        setMessages((prev) => [...prev, aiMessage]);

        // Track cost and rate limit
        try {
          const costEst = estimateCost(content + fullResponse);
          addToSessionCost(costEst.estimatedCostUSD);
          await addToDailyCost(costEst.estimatedCostUSD);
          await incrementMessageCount();
          const updatedStatus = await checkRateLimit();
          setRemainingMessages(updatedStatus.remaining);
        } catch {
          // Cost/rate tracking is non-critical
        }

        // Auto-title the conversation after first exchange
        if (messages.length === 0 && content.length > 0) {
          // Generate a short title from the first user message
          const title = generateConversationTitle(content);
          try {
            await chatHistory.updateConversationTitle(currentConversation.id, title);
            setCurrentConversation((prev) => (prev ? { ...prev, title } : prev));
          } catch {
            // Title update failed, not critical
          }
        }

        // Extract and save memories from the user message
        try {
          const toolSpan = Sentry.startInactiveSpan({
            op: 'gen_ai.execute_tool',
            name: 'execute_tool memoryExtractor',
          });
          toolSpan?.setAttribute('gen_ai.tool.name', 'memoryExtractor');
          const memories = extractMemoriesFromMessage(userId, content, currentConversation.id);
          if (memories.length > 0) {
            await memoryStore.addMemories(memories);
          }
          toolSpan?.end();
        } catch (memErr) {
          // Don't fail the chat if memory extraction fails
          logger.warn('Memory extraction failed', memErr);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      agentSpan?.setStatus({ code: 2, message: err instanceof Error ? err.message : 'Agent failed' });
    } finally {
      agentSpan?.end();
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

      // Check rate limit before sending
      try {
        const rateLimitStatus = await checkRateLimit();
        if (!rateLimitStatus.allowed) {
          setError(
            `You\u2019ve reached your daily limit of ${rateLimitStatus.limit} messages. Take a break \u2014 your limit resets at midnight.`,
          );
          return;
        }
      } catch {
        // If rate limit check fails, allow the message
      }

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
    [currentConversation, startNewConversation, processQueue],
  );

  /**
   * Send a welcome message from the AI (for first-time users)
   * Call this when starting a new conversation with no history
   */
  const sendWelcomeMessage = useCallback(async () => {
    if (!currentConversation) return;

    try {
      const service = await getAIService();
      if (!(await service.isConfigured())) return;

      setIsStreaming(true);
      setStreamingContent('');

      // Build a welcome prompt
      const welcomePrompt =
        sobrietyDays && sobrietyDays > 0
          ? `The user just opened the chat for the first time. They have ${sobrietyDays} days sober. Send a warm, brief welcome (1-2 sentences max). Don't be cheesy or use recovery clichés. Just be real and curious about how they're doing. Don't mention the day count unless it's a milestone.`
          : `The user just opened the chat for the first time. Send a warm, brief welcome (1-2 sentences max). Don't be cheesy. Just be real - you're here to listen.`;

      const systemPrompt = getRecoverySystemPrompt({
        sobrietyDays,
        currentStep,
        userName,
        sponsorName,
      });

      const aiMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: welcomePrompt },
      ];

      let fullContent = '';
      for await (const chunk of service.chat(aiMessages)) {
        fullContent += chunk;
        setStreamingContent(fullContent);
      }

      // Save the welcome message
      if (fullContent.trim()) {
        const welcomeMsg = await chatHistory.addMessage(
          currentConversation.id,
          'assistant',
          fullContent.trim(),
        );
        setMessages([welcomeMsg]);
      }
    } catch (err) {
      // Silently fail - welcome message is optional
      logger.warn('Welcome message failed', err);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [currentConversation, sobrietyDays, currentStep, userName, sponsorName, chatHistory]);

  return {
    // State
    messages,
    currentConversation,
    isLoading: isLoading || chatHistory.isLoading,
    isStreaming,
    streamingContent,
    error,
    isOfflineResponse,
    remainingMessages,

    // Actions
    sendMessage,
    sendWelcomeMessage,
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
