/**
 * useAIChat Hook Test Suite
 *
 * Tests AI chat functionality including:
 * - Message sending and processing
 * - Crisis detection (high/medium/low severity)
 * - Conversation management
 * - AI configuration checks
 * - Message queue handling
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mock dependencies
const mockCreateConversation = jest.fn();
const mockGetConversation = jest.fn();
const mockGetMessages = jest.fn();
const mockAddMessage = jest.fn();
const mockArchiveConversation = jest.fn();
const mockUpdateConversationTitle = jest.fn();
const mockGenerateAIContext = jest.fn();
const mockAddMemories = jest.fn();

const mockChatService = {
  isConfigured: jest.fn(),
  chat: jest.fn(),
};

const mockGetAIService = jest.fn();
const mockGetRecoverySystemPrompt = jest.fn();
const mockExtractMemoriesFromMessage = jest.fn();

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

jest.mock('../useChatHistory', () => ({
  useChatHistory: () => ({
    conversations: [],
    isLoading: false,
    createConversation: (...args: unknown[]) => mockCreateConversation(...args),
    getConversation: (...args: unknown[]) => mockGetConversation(...args),
    getMessages: (...args: unknown[]) => mockGetMessages(...args),
    addMessage: (...args: unknown[]) => mockAddMessage(...args),
    archiveConversation: (...args: unknown[]) => mockArchiveConversation(...args),
    updateConversationTitle: (...args: unknown[]) => mockUpdateConversationTitle(...args),
  }),
}));

jest.mock('../../../../hooks/useMemoryStore', () => ({
  useMemoryStore: () => ({
    generateAIContext: () => mockGenerateAIContext(),
    addMemories: (...args: unknown[]) => mockAddMemories(...args),
  }),
}));

jest.mock('../../services/aiService', () => ({
  getAIService: () => mockGetAIService(),
  getRecoverySystemPrompt: (...args: unknown[]) => mockGetRecoverySystemPrompt(...args),
}));

jest.mock('../../services/memoryExtractor', () => ({
  extractMemoriesFromMessage: (...args: unknown[]) => mockExtractMemoriesFromMessage(...args),
}));

jest.mock('../../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import hook after mocking
import { useAIChat } from '../useAIChat';
import { logger as mockLogger } from '../../../../utils/logger';

describe('useAIChat', () => {
  const testUserId = 'user-123';
  const mockOnCrisisDetected = jest.fn();

  // Mock async generator for chat streaming
  async function* mockStreamGenerator(chunks: string[]) {
    for (const chunk of chunks) {
      yield chunk;
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockGetAIService.mockResolvedValue(mockChatService);
    mockChatService.isConfigured.mockResolvedValue(true);
    mockChatService.chat.mockImplementation((messages: unknown[]) => {
      return mockStreamGenerator(['Hello, ', 'how ', 'can ', 'I ', 'help?']);
    });
    mockGetRecoverySystemPrompt.mockReturnValue('Mock system prompt');

    mockCreateConversation.mockResolvedValue({
      id: 'conv-123',
      userId: testUserId,
      title: null,
      type: 'general',
      stepNumber: null,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockGetConversation.mockResolvedValue({
      id: 'conv-123',
      userId: testUserId,
      title: 'Test Conversation',
      type: 'general',
      stepNumber: null,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockGetMessages.mockResolvedValue([]);

    mockAddMessage.mockImplementation(
      async (conversationId: string, role: string, content: string) => ({
        id: `msg-${Date.now()}`,
        conversationId,
        role,
        content,
        createdAt: new Date(),
      }),
    );

    mockUpdateConversationTitle.mockResolvedValue(undefined);
    mockGenerateAIContext.mockResolvedValue('');
    mockExtractMemoriesFromMessage.mockReturnValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should check AI configuration on mount', async () => {
      renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await waitFor(() => {
        expect(mockGetAIService).toHaveBeenCalled();
      });

      expect(mockChatService.isConfigured).toHaveBeenCalled();
    });

    it('should set isAIConfigured to false when not configured', async () => {
      mockChatService.isConfigured.mockResolvedValue(false);

      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await waitFor(() => {
        expect(result.current.isAIConfigured).toBe(false);
      });
    });

    it('should set isAIConfigured to true when configured', async () => {
      mockChatService.isConfigured.mockResolvedValue(true);

      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await waitFor(() => {
        expect(result.current.isAIConfigured).toBe(true);
      });
    });
  });

  describe('Start New Conversation', () => {
    it('should create a new conversation', async () => {
      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('general');
      });

      expect(mockCreateConversation).toHaveBeenCalledWith('general', undefined);
      expect(result.current.currentConversation).toBeTruthy();
    });

    it('should create step work conversation with step number', async () => {
      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('step_work', 4);
      });

      expect(mockCreateConversation).toHaveBeenCalledWith('step_work', 4);
    });

    it('should clear messages when starting new conversation', async () => {
      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('general');
      });

      expect(result.current.messages).toEqual([]);
    });
  });

  describe('Load Conversation', () => {
    it('should load existing conversation', async () => {
      const existingMessages = [
        {
          id: 'msg-1',
          conversationId: 'conv-123',
          role: 'user',
          content: 'Hello',
          createdAt: new Date(),
        },
        {
          id: 'msg-2',
          conversationId: 'conv-123',
          role: 'assistant',
          content: 'Hi there!',
          createdAt: new Date(),
        },
      ];

      mockGetMessages.mockResolvedValue(existingMessages);

      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.loadConversation('conv-123');
      });

      expect(mockGetConversation).toHaveBeenCalledWith('conv-123');
      expect(mockGetMessages).toHaveBeenCalledWith('conv-123');
      expect(result.current.messages).toHaveLength(2);
    });

    it('should throw error when conversation not found', async () => {
      mockGetConversation.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.loadConversation('non-existent');
      });

      expect(result.current.error).toBe('Conversation not found');
    });
  });

  describe('Send Message', () => {
    it('should send message and receive AI response', async () => {
      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      // Start conversation first
      await act(async () => {
        await result.current.startNewConversation('general');
      });

      await act(async () => {
        await result.current.sendMessage('Hello AI');
        // Flush the setTimeout(fn, 100) inside sendMessage
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      });

      expect(mockAddMessage).toHaveBeenCalledWith('conv-123', 'user', 'Hello AI');
      expect(mockChatService.chat).toHaveBeenCalled();
      expect(result.current.messages).toHaveLength(2); // User + AI
    });

    it('should create conversation if none exists', async () => {
      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      jest.advanceTimersByTime(100);

      expect(mockCreateConversation).toHaveBeenCalled();
    });

    it('should not send empty messages', async () => {
      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      expect(mockChatService.chat).not.toHaveBeenCalled();
    });

    it('should show streaming content during response', async () => {
      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('general');
      });

      jest.advanceTimersByTime(100);

      // Start sending message but don't await
      act(() => {
        result.current.sendMessage('Hello');
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      });
    });
  });

  describe('Crisis Detection', () => {
    it('should detect high severity crisis (suicidal)', async () => {
      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('general');
      });

      await act(async () => {
        await result.current.sendMessage('I want to end my life');
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockOnCrisisDetected).toHaveBeenCalledWith(
          expect.objectContaining({
            detected: true,
            severity: 'high',
            suggestedAction: 'emergency',
          }),
        );
      });
    });

    it('should detect medium severity crisis (relapse)', async () => {
      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('general');
      });

      await act(async () => {
        await result.current.sendMessage('I relapsed today and feel like giving up');
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockOnCrisisDetected).toHaveBeenCalledWith(
          expect.objectContaining({
            detected: true,
            severity: 'medium',
            suggestedAction: 'intervene',
          }),
        );
      });
    });

    it('should detect low severity crisis (craving)', async () => {
      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('general');
      });

      await act(async () => {
        await result.current.sendMessage('Having a strong craving right now');
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockOnCrisisDetected).toHaveBeenCalledWith(
          expect.objectContaining({
            detected: true,
            severity: 'low',
            suggestedAction: 'monitor',
          }),
        );
      });
    });

    it('should not trigger crisis for normal messages', async () => {
      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('general');
      });

      jest.advanceTimersByTime(100);

      await act(async () => {
        await result.current.sendMessage('What is step 4 about?');
      });

      expect(mockOnCrisisDetected).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle AI not configured error', async () => {
      mockChatService.isConfigured.mockResolvedValue(false);

      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('general');
      });

      await act(async () => {
        await result.current.sendMessage('Hello');
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Please configure your AI API key in settings');
      });
    });

    it('should handle API errors gracefully', async () => {
      // Mock chat to return an async iterable that throws
      mockChatService.chat.mockImplementation(async function* () {
        throw new Error('API Error');
      });

      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('general');
      });

      await act(async () => {
        await result.current.sendMessage('Hello');
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('API Error');
      });
    });

    it('should clear error when clearError is called', async () => {
      mockChatService.isConfigured.mockResolvedValue(false);

      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('general');
      });

      await act(async () => {
        await result.current.sendMessage('Hello');
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Cancel Stream', () => {
    it('should cancel streaming', async () => {
      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('general');
      });

      jest.advanceTimersByTime(100);

      act(() => {
        result.current.sendMessage('Hello');
      });

      act(() => {
        result.current.cancelStream();
      });

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.streamingContent).toBe('');
    });
  });

  describe('Memory Extraction', () => {
    it('should extract and save memories from user messages', async () => {
      const memories = [{ type: 'fact', content: 'User likes coffee' }];
      mockExtractMemoriesFromMessage.mockReturnValue(memories);

      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('general');
      });

      await act(async () => {
        await result.current.sendMessage('I really like coffee in the morning');
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockExtractMemoriesFromMessage).toHaveBeenCalled();
      });

      expect(mockAddMemories).toHaveBeenCalledWith(memories);
    });

    it('should handle memory extraction errors gracefully', async () => {
      mockExtractMemoriesFromMessage.mockImplementation(() => {
        throw new Error('Extraction failed');
      });

      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('general');
      });

      // Should not throw
      await act(async () => {
        await result.current.sendMessage('Test message');
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Memory extraction failed',
          expect.any(Error),
        );
      });
    });
  });

  describe('Welcome Message', () => {
    it('should send welcome message', async () => {
      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          sobrietyDays: 90,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('general');
      });

      await act(async () => {
        await result.current.sendWelcomeMessage();
      });

      expect(mockChatService.chat).toHaveBeenCalled();
    });

    it('should not send welcome if AI not configured', async () => {
      mockChatService.isConfigured.mockResolvedValue(false);

      const { result } = renderHook(() =>
        useAIChat({
          userId: testUserId,
          onCrisisDetected: mockOnCrisisDetected,
        }),
      );

      await act(async () => {
        await result.current.startNewConversation('general');
      });

      await act(async () => {
        await result.current.sendWelcomeMessage();
      });

      // Should silently fail
      expect(result.current.messages).toHaveLength(0);
    });
  });
});
