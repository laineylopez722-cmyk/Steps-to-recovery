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
import { extractSemanticMemories } from '../services/semanticMemoryExtractor';
import type { ExtractedSemanticMemory } from '../services/semanticMemoryExtractor';
import {
  isOfflineMode,
  getOfflineResponse,
  queuePendingMessage,
  cacheResponse,
} from '../services/offlineFallback';
import { filterAIResponse } from '../services/contentSafetyFilter';
import { detectCrisis as detectCrisisRaw, toCrisisSignal } from '../prompts/crisis';
import { buildEnrichedContext } from '../services/recoveryContextEnricher';
import { addToSessionCost, addToDailyCost, estimateCost } from '../services/costEstimation';
import { checkRateLimit, incrementMessageCount } from '../services/rateLimiter';
import { useMemoryStore } from '../../../hooks/useMemoryStore';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { encryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import { addToSyncQueue } from '../../../services/syncService';
import type { StorageAdapter } from '../../../adapters/storage';
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
 * Maximum number of previous messages to include as context.
 * Prevents token limit blowout on long conversations.
 * 50 messages ≈ 25 exchanges — enough for continuity without hitting limits.
 */
const MAX_HISTORY_MESSAGES = 50;

/**
 * Detect if an error is a network/server failure (vs. user error or logic bug).
 * Used to trigger offline fallback instead of showing raw error messages.
 */
function isNetworkOrServerError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    err.name === 'TypeError' || // fetch() throws TypeError for network failures
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('load failed') ||
    msg.includes('timed out') ||
    msg.includes('timeout') ||
    msg.includes('connection refused') ||
    msg.includes('openclaw error 5') || // 5xx server errors
    msg.includes('openclaw error 502') ||
    msg.includes('openclaw error 503') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('enetunreach')
  );
}

/**
 * Detect crisis signals in user message.
 * Delegates to the canonical crisis module (prompts/crisis.ts)
 * which has the most comprehensive keyword coverage.
 */
function detectCrisis(content: string): CrisisSignal | null {
  const result = detectCrisisRaw(content);
  return result.detected ? toCrisisSignal(result) : null;
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

  // Database access for semantic memory storage
  const { db, isReady: dbReady } = useDatabase();

  // Track message count for periodic semantic extraction
  const messageCountRef = useRef(0);

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
  // Mirror currentConversation in a ref so processQueue always sees latest value
  // (avoids stale closure from setTimeout / React batch updates)
  const currentConversationRef = useRef<Conversation | null>(null);

  // Check AI configuration on mount
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

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
        currentConversationRef.current = conversation;
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
      // Use ref to get latest conversation (avoids stale closure from React batch updates)
      const activeConversation = currentConversationRef.current;
      if (!activeConversation) {
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
      const userMessage = await chatHistory.addMessage(activeConversation.id, 'user', content);
      setMessages((prev) => [...prev, userMessage]);

      // Check if offline — use cached/prewritten response instead
      const offline = await isOfflineMode();
      if (offline) {
        setIsOfflineResponse(true);
        const offlineResult = await getOfflineResponse(content);

        // Save offline response as assistant message
        const offlineMsg = await chatHistory.addMessage(
          activeConversation.id,
          'assistant',
          offlineResult.content,
          { offline: true, offlineSource: offlineResult.source },
        );
        setMessages((prev) => [...prev, offlineMsg]);

        // Queue the user message for sending when back online
        await queuePendingMessage(content, activeConversation.id);

        // Auto-title if first exchange
        if (messages.length === 0 && content.length > 0) {
          const title = generateConversationTitle(content);
          try {
            await chatHistory.updateConversationTitle(activeConversation.id, title);
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
      } catch (err) {
        // Memories not available yet, that's okay
        logger.debug('Memory context unavailable', err);
      }

      // Get enriched context from journal, step work, and check-ins
      let enrichedContext = '';
      try {
        if (db && dbReady) {
          enrichedContext = await buildEnrichedContext(db, userId);
        }
      } catch {
        // Enriched context is additive — don't fail the chat
      }

      // Build system prompt based on provider.
      // OpenClaw: personality lives in SOUL.md server-side — only send user context.
      // Direct API providers: send full personality + context.
      const isOpenClaw = service.getProvider() === 'openclaw';

      let contextualSystemPrompt: string;

      if (isOpenClaw) {
        // User-specific context only (SOUL.md handles personality)
        const contextParts: string[] = [];
        if (userName) contextParts.push(`Their name is ${userName}.`);
        if (sobrietyDays !== undefined) contextParts.push(`They have ${sobrietyDays} days of sobriety.`);
        if (currentStep) contextParts.push(`Currently working on Step ${currentStep}.`);
        if (sponsorName) contextParts.push(`Their sponsor is ${sponsorName}.`);
        if (memoryContext) contextParts.push(`\nWhat I remember about them:\n${memoryContext}`);
        if (enrichedContext) contextParts.push(`\nTheir recovery journey (from their own writings):\n${enrichedContext}`);
        if (crisis) {
          if (crisis.severity === 'high') {
            contextParts.push(
              '\n⚠️ CRISIS DETECTED: The user may be in immediate danger. Acknowledge their pain, stay present, and surface crisis resources (988 Lifeline) immediately.',
            );
          } else if (crisis.severity === 'medium') {
            contextParts.push(
              '\nNote: The user may be struggling. Encourage reaching out to their sponsor, attending a meeting, or calling a support line.',
            );
          }
        }
        contextualSystemPrompt = contextParts.length > 0
          ? `About this user:\n${contextParts.join('\n')}`
          : '';
      } else {
        // Full prompt with personality (for direct API providers)
        contextualSystemPrompt = getRecoverySystemPrompt({
          sobrietyDays,
          currentStep,
          userName,
          sponsorName,
        });
        if (memoryContext) {
          contextualSystemPrompt += `\n\nWhat I remember about them:\n${memoryContext}`;
        }
        if (enrichedContext) {
          contextualSystemPrompt += `\n\nTheir recovery journey (from their own writings):\n${enrichedContext}`;
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
      }

      const aiMessages: ChatMessage[] = [
        // Only include system message if there's actual context to send
        ...(contextualSystemPrompt ? [{ role: 'system' as const, content: contextualSystemPrompt }] : []),
        // Sliding window: only send recent history to avoid token limit blowout
        ...messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content },
      ];

      // Start streaming
      setIsStreaming(true);
      setStreamingContent('');
      abortControllerRef.current = new AbortController();

      let fullResponse = '';

      try {
        for await (const chunk of service.chat(aiMessages, { signal: abortControllerRef.current.signal, userId })) {
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

        // Network/server error → gracefully fall back to offline responses
        // This handles: gateway unreachable, server down, DNS failure, timeout
        // Critical for rehab environments with restricted/spotty connectivity
        if (isNetworkOrServerError(streamErr)) {
          logger.warn('AI request failed, falling back to offline response', streamErr);
          setIsOfflineResponse(true);
          const offlineResult = await getOfflineResponse(content);
          const offlineMsg = await chatHistory.addMessage(
            activeConversation.id,
            'assistant',
            offlineResult.content,
            { offline: true, offlineSource: offlineResult.source },
          );
          setMessages((prev) => [...prev, offlineMsg]);
          await queuePendingMessage(content, activeConversation.id);
          return;
        }

        throw streamErr;
      }

      // Save AI response
      if (fullResponse) {
        // Run content safety filter before saving/displaying
        const safetyResult = filterAIResponse(fullResponse);
        const safeContent = safetyResult.filteredContent;

        if (safetyResult.blocked) {
          logger.warn('AI response blocked by safety filter', {
            reason: safetyResult.blockReason,
            conversationId: activeConversation.id,
          });
          Sentry.addBreadcrumb({
            category: 'ai.safety',
            message: `Response blocked: ${safetyResult.blockReason}`,
            level: 'warning',
          });
        }
        if (safetyResult.warnings.length > 0) {
          logger.warn('AI response safety warnings', { warnings: safetyResult.warnings });
        }

        const aiMessage = await chatHistory.addMessage(
          activeConversation.id,
          'assistant',
          safeContent,
          { crisisDetected: crisis?.detected },
        );
        setMessages((prev) => [...prev, aiMessage]);

        // Cache this response for offline use (fire-and-forget)
        cacheResponse(content, safeContent).catch(() => {});

        // Track cost and rate limit
        try {
          const costEst = estimateCost(content + safeContent);
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
            await chatHistory.updateConversationTitle(activeConversation.id, title);
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
          const memories = extractMemoriesFromMessage(userId, content, activeConversation.id);
          if (memories.length > 0) {
            await memoryStore.addMemories(memories);
          }
          toolSpan?.end();
        } catch (memErr) {
          // Don't fail the chat if memory extraction fails
          logger.warn('Memory extraction failed', memErr);
        }

        // Run semantic extraction every 5 messages
        messageCountRef.current += 1;
        if (messageCountRef.current % 5 === 0 && db && dbReady) {
          try {
            const existingMemories = await memoryStore.getAllMemories();
            const recentMessages = [
              ...messages,
              { role: 'user' as const, content },
              { role: 'assistant' as const, content: safeContent },
            ]
              .slice(-10)
              .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

            const semanticMemories = await extractSemanticMemories(
              recentMessages,
              existingMemories,
              userId,
              activeConversation.id,
            );

            if (semanticMemories.length > 0) {
              await storeSemanticMemories(db, semanticMemories, userId, activeConversation.id);
              logger.debug('Stored semantic memories', { count: semanticMemories.length });
            }
          } catch (semanticErr) {
            logger.warn('Semantic memory extraction failed', semanticErr);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      agentSpan?.setStatus({
        code: 2,
        message: err instanceof Error ? err.message : 'Agent failed',
      });
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
    chatHistory,
    messages,
    sobrietyDays,
    currentStep,
    userName,
    sponsorName,
    onCrisisDetected,
    userId,
    memoryStore,
    db,
    dbReady,
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

      // If no conversation, start a new one (also sets ref synchronously)
      if (!currentConversation) {
        await startNewConversation();
      }

      setIsLoading(true);
      setError(null);

      // Add to queue and process immediately — ref-based lookup avoids stale state
      messageQueueRef.current.push(content.trim());
      processQueue();
      setIsLoading(false);
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
      // Check if offline first — show a static welcome instead of blank screen
      const offline = await isOfflineMode();
      if (offline) {
        const offlineWelcome = userName
          ? `Hey${userName ? ` ${userName}` : ''}. I'm here whenever you need to talk. Even without internet, I can still help — just say what's on your mind.`
          : `Hey. I'm here whenever you need to talk. Even without internet, I can still help — just say what's on your mind.`;
        const welcomeMsg = await chatHistory.addMessage(
          currentConversation.id,
          'assistant',
          offlineWelcome,
          { offline: true, offlineSource: 'prewritten' },
        );
        setMessages([welcomeMsg]);
        setIsOfflineResponse(true);
        return;
      }

      const service = await getAIService();
      if (!(await service.isConfigured())) return;

      setIsStreaming(true);
      setStreamingContent('');

      // Build a welcome prompt
      const welcomePrompt =
        sobrietyDays && sobrietyDays > 0
          ? `The user just opened the chat for the first time. They have ${sobrietyDays} days sober. Send a warm, brief welcome (1-2 sentences max). Don't be cheesy or use recovery clichés. Just be real and curious about how they're doing. Don't mention the day count unless it's a milestone.`
          : `The user just opened the chat for the first time. Send a warm, brief welcome (1-2 sentences max). Don't be cheesy. Just be real - you're here to listen.`;

      const isOpenClaw = service.getProvider() === 'openclaw';

      let aiMessages: ChatMessage[];
      if (isOpenClaw) {
        // OpenClaw: SOUL.md handles personality; just send the welcome instruction
        const contextParts: string[] = [];
        if (userName) contextParts.push(`Their name is ${userName}.`);
        if (sobrietyDays !== undefined) contextParts.push(`They have ${sobrietyDays} days of sobriety.`);
        if (currentStep) contextParts.push(`Currently working on Step ${currentStep}.`);
        aiMessages = [
          ...(contextParts.length > 0 ? [{ role: 'system' as const, content: `About this user:\n${contextParts.join('\n')}` }] : []),
          { role: 'user' as const, content: welcomePrompt },
        ];
      } else {
        const systemPrompt = getRecoverySystemPrompt({
          sobrietyDays,
          currentStep,
          userName,
          sponsorName,
        });
        aiMessages = [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: welcomePrompt },
        ];
      }

      let fullContent = '';
      try {
        for await (const chunk of service.chat(aiMessages, { userId })) {
          fullContent += chunk;
          setStreamingContent(fullContent);
        }
      } catch (streamErr) {
        // Network error → show static welcome instead of blank screen
        if (isNetworkOrServerError(streamErr)) {
          logger.warn('Welcome stream failed, using offline welcome', streamErr);
          const fallbackWelcome = userName
            ? `Hey ${userName}. I'm here whenever you need to talk — just say what's on your mind.`
            : `Hey. I'm here whenever you need to talk — just say what's on your mind.`;
          const fallbackMsg = await chatHistory.addMessage(
            currentConversation.id,
            'assistant',
            fallbackWelcome,
            { offline: true, offlineSource: 'prewritten' },
          );
          setMessages([fallbackMsg]);
          setIsOfflineResponse(true);
          return;
        }
        throw streamErr;
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
  }, [currentConversation, sobrietyDays, currentStep, userName, sponsorName, chatHistory, userId]);

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

/**
 * Store extracted semantic memories into the ai_memories table (encrypted)
 */
async function storeSemanticMemories(
  db: StorageAdapter,
  memories: ExtractedSemanticMemory[],
  userId: string,
  conversationId: string,
): Promise<void> {
  const now = new Date().toISOString();
  for (const mem of memories) {
    const id = `ai_mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const encryptedContent = await encryptContent(mem.content);
    const encryptedContext = mem.context ? await encryptContent(mem.context) : null;

    await db.runAsync(
      `INSERT OR IGNORE INTO ai_memories
        (id, user_id, type, encrypted_content, confidence, encrypted_context, source_conversation_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        mem.type,
        encryptedContent,
        mem.confidence,
        encryptedContext,
        conversationId,
        now,
        now,
      ],
    );
    await addToSyncQueue(db, 'ai_memories', id, 'insert');
  }
}
