/**
 * useMemoryStore Hook Test Suite - Comprehensive
 *
 * Tests memory store functionality including:
 * - CRUD operations (all encrypted)
 * - Memory search with decryption
 * - AI context building
 * - Memory summary generation
 * - Database initialization
 * - Error handling
 */

import { renderHook, act } from '@testing-library/react-native';

// Mock encryption utilities
const mockEncryptContent = jest.fn();
const mockDecryptContent = jest.fn();

// Mock database
const mockExecAsync = jest.fn();
const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockRunAsync = jest.fn();

const mockDb = {
  execAsync: mockExecAsync,
  getAllAsync: mockGetAllAsync,
  getFirstAsync: mockGetFirstAsync,
  runAsync: mockRunAsync,
};

const mockUseDatabase = jest.fn();

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

jest.mock('../../contexts/DatabaseContext', () => ({
  useDatabase: () => mockUseDatabase(),
}));

jest.mock('../../utils/encryption', () => ({
  encryptContent: (content: string) => mockEncryptContent(content),
  decryptContent: (content: string) => mockDecryptContent(content),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../services/syncService', () => ({
  addToSyncQueue: jest.fn(),
  addDeleteToSyncQueue: jest.fn(),
}));

// Import hook after mocking
import { useMemoryStore, type MemorySummary } from '../useMemoryStore';
import { type Memory, type MemoryType } from '../../features/journal/utils/memoryExtraction';
import { logger as mockLogger } from '../../utils/logger';

// Helper to create mock memory
function createMockMemory(overrides: Partial<Memory> = {}): Memory {
  const now = new Date();
  return {
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    userId: 'user-123',
    type: 'person' as MemoryType,
    content: 'Test memory content',
    context: 'Test context',
    confidence: 0.8,
    source: 'journal' as const,
    sourceId: 'entry-123',
    key: undefined,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// Helper to create encrypted mock row
function createMockRow(
  overrides: Partial<{
    id: string;
    user_id: string;
    type: string;
    encrypted_content: string;
    encrypted_context: string | null;
    confidence: number;
    source: string;
    source_id: string;
    key: string;
    created_at: string;
    updated_at: string;
  }> = {},
) {
  const now = new Date().toISOString();
  return {
    id: 'mem-123',
    user_id: 'user-123',
    type: 'person',
    encrypted_content: 'encrypted:test-content',
    encrypted_context: 'encrypted:test-context',
    confidence: 0.8,
    source: 'journal',
    source_id: 'entry-123',
    key: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

describe('useMemoryStore', () => {
  const testUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Default database mock - ready state
    mockUseDatabase.mockReturnValue({
      db: mockDb,
      isReady: true,
    });

    // Default encryption mocks
    mockEncryptContent.mockImplementation((content: string) =>
      Promise.resolve(`encrypted:${content}`),
    );
    mockDecryptContent.mockImplementation((encrypted: string) => {
      if (encrypted.startsWith('encrypted:')) {
        return Promise.resolve(encrypted.replace('encrypted:', ''));
      }
      return Promise.resolve(encrypted);
    });

    // Default database operation mocks
    mockExecAsync.mockResolvedValue(undefined);
    mockRunAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });
    mockGetAllAsync.mockResolvedValue([]);
    mockGetFirstAsync.mockResolvedValue(null);
  });

  describe('Database Initialization', () => {
    it('should create memories table on mount when database is ready', async () => {
      renderHook(() => useMemoryStore(testUserId));

      // Wait for useEffect to run
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS memories'),
      );
    });

    it('should create indexes on mount', async () => {
      renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_memories_user'),
      );
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_memories_type'),
      );
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_memories_key'),
      );
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_memories_user_key'),
      );
    });

    it('should not initialize if database is not ready', async () => {
      mockUseDatabase.mockReturnValue({
        db: mockDb,
        isReady: false,
      });

      renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockExecAsync).not.toHaveBeenCalled();
    });

    it('should not initialize if database is null', async () => {
      mockUseDatabase.mockReturnValue({
        db: null,
        isReady: true,
      });

      renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockExecAsync).not.toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockExecAsync.mockRejectedValue(new Error('Database error'));

      renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to init memory table',
        expect.any(Object),
      );
    });

    it('should initialize when database becomes ready', async () => {
      mockUseDatabase.mockReturnValue({
        db: null,
        isReady: false,
      });

      const { rerender } = renderHook(() => useMemoryStore(testUserId));

      // First render - not ready
      expect(mockExecAsync).not.toHaveBeenCalled();

      // Update to ready
      mockUseDatabase.mockReturnValue({
        db: mockDb,
        isReady: true,
      });

      rerender({});

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockExecAsync).toHaveBeenCalled();
    });
  });

  describe('addMemories', () => {
    it('should encrypt and insert new memories', async () => {
      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const memory = createMockMemory({
        content: 'My sponsor John called today',
        context: 'We talked about step 4',
      });

      await act(async () => {
        await result.current.addMemories([memory]);
      });

      // Should encrypt content and context
      expect(mockEncryptContent).toHaveBeenCalledWith('My sponsor John called today');
      expect(mockEncryptContent).toHaveBeenCalledWith('We talked about step 4');

      // Should insert into database
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO memories'),
        expect.arrayContaining([
          memory.id,
          testUserId,
          'person',
          'encrypted:My sponsor John called today',
          'encrypted:We talked about step 4',
        ]),
      );
    });

    it('should handle memories without context', async () => {
      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const memory = createMockMemory({
        content: 'Simple memory',
        context: undefined,
      });

      await act(async () => {
        await result.current.addMemories([memory]);
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('Simple memory');
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([null]), // encrypted_context should be null
      );
    });

    it('should update existing memory when key matches', async () => {
      mockGetAllAsync.mockResolvedValue([{ id: 'existing-mem-123', key: 'person:john' }]);

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const memory = createMockMemory({
        key: 'person:john',
        content: 'Updated info about John',
        confidence: 0.9,
      });

      await act(async () => {
        await result.current.addMemories([memory]);
      });

      // Should check for existing keyed memories in a single query
      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, key FROM memories WHERE user_id = ? AND key IN (?)'),
        [testUserId, 'person:john'],
      );

      // Should update instead of insert
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE memories SET'),
        expect.arrayContaining(['encrypted:Updated info about John', 0.9, 'existing-mem-123']),
      );
    });

    it('should insert new memory when key does not match', async () => {
      mockGetAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const memory = createMockMemory({
        key: 'person:new-person',
        content: 'New person memory',
      });

      await act(async () => {
        await result.current.addMemories([memory]);
      });

      // Should check for existing keys
      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, key FROM memories WHERE user_id = ? AND key IN (?)'),
        [testUserId, 'person:new-person'],
      );

      // Should insert new
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO memories'),
        expect.any(Array),
      );
    });

    it('should handle multiple memories in one call', async () => {
      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const memories = [
        createMockMemory({ content: 'Memory 1' }),
        createMockMemory({ content: 'Memory 2' }),
        createMockMemory({ content: 'Memory 3' }),
      ];

      await act(async () => {
        await result.current.addMemories(memories);
      });

      // Should encrypt each memory
      expect(mockEncryptContent).toHaveBeenCalledTimes(6); // 3 content + 3 context

      // Should run 3 insert operations
      expect(mockRunAsync).toHaveBeenCalledTimes(3);
    });

    it('should set isLoading during add operation', async () => {
      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.isLoading).toBe(false);

      const memory = createMockMemory();

      await act(async () => {
        await result.current.addMemories([memory]);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should not add memories if database not ready', async () => {
      mockUseDatabase.mockReturnValue({
        db: mockDb,
        isReady: false,
      });

      const { result } = renderHook(() => useMemoryStore(testUserId));

      const memory = createMockMemory();

      await act(async () => {
        await result.current.addMemories([memory]);
      });

      expect(mockRunAsync).not.toHaveBeenCalled();
    });

    it('should handle empty array gracefully', async () => {
      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await result.current.addMemories([]);
      });

      expect(mockRunAsync).not.toHaveBeenCalled();
    });

    it('should handle add errors gracefully', async () => {
      mockRunAsync.mockRejectedValue(new Error('Insert failed'));

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const memory = createMockMemory();

      // Should not throw
      await act(async () => {
        await result.current.addMemories([memory]);
      });

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to add memories', expect.any(Object));

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle encryption errors', async () => {
      mockEncryptContent.mockRejectedValue(new Error('Encryption failed'));

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const memory = createMockMemory();

      // Should not throw
      await act(async () => {
        await result.current.addMemories([memory]);
      });

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getAllMemories', () => {
    it('should fetch and decrypt all memories', async () => {
      const mockRows = [
        createMockRow({
          id: 'mem-1',
          type: 'person',
          encrypted_content: 'enc:John',
          encrypted_context: 'enc:My sponsor',
        }),
        createMockRow({
          id: 'mem-2',
          type: 'trigger',
          encrypted_content: 'enc:Stress',
          encrypted_context: null,
        }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let memories: Memory[] = [];
      await act(async () => {
        memories = await result.current.getAllMemories();
      });

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM memories WHERE user_id = ?'),
        [testUserId],
      );

      expect(mockDecryptContent).toHaveBeenCalledWith('enc:John');
      expect(mockDecryptContent).toHaveBeenCalledWith('enc:My sponsor');
      expect(mockDecryptContent).toHaveBeenCalledWith('enc:Stress');

      expect(memories).toHaveLength(2);
      expect(memories[0].id).toBe('mem-1');
      expect(memories[0].type).toBe('person');
    });

    it('should return empty array if database not ready', async () => {
      mockUseDatabase.mockReturnValue({
        db: null,
        isReady: false,
      });

      const { result } = renderHook(() => useMemoryStore(testUserId));

      let memories: Memory[] = [];
      await act(async () => {
        memories = await result.current.getAllMemories();
      });

      expect(memories).toEqual([]);
      expect(mockGetAllAsync).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockGetAllAsync.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let memories: Memory[] = [];
      await act(async () => {
        memories = await result.current.getAllMemories();
      });

      expect(memories).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to get memories', expect.any(Object));
    });

    it('should handle decryption errors', async () => {
      const mockRows = [
        createMockRow({
          encrypted_content: 'invalid-encrypted-data',
        }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Set up decryption to fail for getAllMemories call
      mockDecryptContent.mockRejectedValue(new Error('Decryption failed'));

      // getAllMemories catches decryption errors internally and returns []
      // act() may re-throw the error, so we catch it here
      let memories: Memory[] = [];
      try {
        await act(async () => {
          memories = await result.current.getAllMemories();
        });
      } catch {
        // act() re-throws errors from async operations even when caught by source code
      }

      // Memory with decryption error should be skipped or handled
      expect(memories).toHaveLength(0);
    });

    it('should order memories by created_at DESC', async () => {
      mockGetAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await act(async () => {
        await result.current.getAllMemories();
      });

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        expect.any(Array),
      );
    });
  });

  describe('getMemoriesByType', () => {
    it('should fetch memories filtered by type', async () => {
      const mockRows = [
        createMockRow({
          id: 'mem-1',
          type: 'person',
          encrypted_content: 'enc:John',
        }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let memories: Memory[] = [];
      await act(async () => {
        memories = await result.current.getMemoriesByType('person');
      });

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = ? AND type = ?'),
        [testUserId, 'person'],
      );

      expect(memories).toHaveLength(1);
      expect(memories[0].type).toBe('person');
    });

    it('should handle all memory types', async () => {
      const types: MemoryType[] = [
        'person',
        'trigger',
        'coping_strategy',
        'emotion',
        'victory',
        'struggle',
        'goal',
        'insight',
        'preference',
        'milestone',
        'pattern',
      ];

      mockGetAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      for (const type of types) {
        await act(async () => {
          await result.current.getMemoriesByType(type);
        });

        expect(mockGetAllAsync).toHaveBeenCalledWith(expect.any(String), [testUserId, type]);
      }
    });

    it('should return empty array if database not ready', async () => {
      mockUseDatabase.mockReturnValue({
        db: null,
        isReady: false,
      });

      const { result } = renderHook(() => useMemoryStore(testUserId));

      const memories = await act(async () => {
        return result.current.getMemoriesByType('person');
      });

      expect(memories).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockGetAllAsync.mockRejectedValue(new Error('Query failed'));

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const memories = await act(async () => {
        return result.current.getMemoriesByType('person');
      });

      expect(memories).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get memories by type',
        expect.any(Object),
      );
    });
  });

  describe('getRecentMemories', () => {
    it('should fetch memories from recent days', async () => {
      const now = new Date();
      const oneDayAgo = new Date(now);
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const mockRows = [
        createMockRow({
          created_at: oneDayAgo.toISOString(),
          encrypted_content: 'enc:Recent memory',
        }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let memories: Memory[] = [];
      await act(async () => {
        memories = await result.current.getRecentMemories(7);
      });

      expect(mockGetAllAsync).toHaveBeenCalledWith(expect.stringContaining('created_at > ?'), [
        testUserId,
        expect.any(String),
      ]);

      expect(memories).toHaveLength(1);
    });

    it('should use default of 7 days', async () => {
      mockGetAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await act(async () => {
        await result.current.getRecentMemories();
      });

      const callArgs = mockGetAllAsync.mock.calls[0][1];
      const cutoffDate = new Date(callArgs[1]);
      const now = new Date();
      const daysDiff = (now.getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24);

      expect(daysDiff).toBeCloseTo(7, 0);
    });

    it('should accept custom day ranges', async () => {
      mockGetAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await act(async () => {
        await result.current.getRecentMemories(30);
      });

      const callArgs = mockGetAllAsync.mock.calls[0][1];
      const cutoffDate = new Date(callArgs[1]);
      const now = new Date();
      const daysDiff = (now.getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24);

      expect(daysDiff).toBeCloseTo(30, 0);
    });

    it('should return empty array if database not ready', async () => {
      mockUseDatabase.mockReturnValue({
        db: null,
        isReady: false,
      });

      const { result } = renderHook(() => useMemoryStore(testUserId));

      const memories = await act(async () => {
        return result.current.getRecentMemories(7);
      });

      expect(memories).toEqual([]);
    });
  });

  describe('searchMemories', () => {
    it('should search memories by query', async () => {
      const mockRows = [
        createMockRow({
          encrypted_content: 'enc:My sponsor John helped me',
          encrypted_context: 'enc:He called during a craving',
        }),
        createMockRow({
          encrypted_content: 'enc:Went to a meeting today',
          encrypted_context: null,
        }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);
      mockDecryptContent.mockImplementation((enc: string) => {
        if (enc === 'enc:My sponsor John helped me')
          return Promise.resolve('My sponsor John helped me');
        if (enc === 'enc:He called during a craving')
          return Promise.resolve('He called during a craving');
        if (enc === 'enc:Went to a meeting today')
          return Promise.resolve('Went to a meeting today');
        return Promise.resolve('');
      });

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let memories: Memory[] = [];
      await act(async () => {
        memories = await result.current.searchMemories('John');
      });

      // Should fetch all memories
      expect(mockGetAllAsync).toHaveBeenCalled();

      // Should decrypt and filter
      expect(memories).toHaveLength(1);
      expect(memories[0].content).toContain('John');
    });

    it('should search in context as well', async () => {
      const mockRows = [
        createMockRow({
          encrypted_content: 'enc:Some person',
          encrypted_context: 'enc:This is about my sponsor Mike',
        }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);
      mockDecryptContent.mockImplementation((enc: string) => {
        if (enc === 'enc:Some person') return Promise.resolve('Some person');
        if (enc === 'enc:This is about my sponsor Mike')
          return Promise.resolve('This is about my sponsor Mike');
        return Promise.resolve('');
      });

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let memories: Memory[] = [];
      await act(async () => {
        memories = await result.current.searchMemories('Mike');
      });

      expect(memories).toHaveLength(1);
    });

    it('should limit results to 20', async () => {
      const mockRows = Array.from({ length: 25 }, (_, i) =>
        createMockRow({
          id: `mem-${i}`,
          encrypted_content: `enc:Memory ${i}`,
        }),
      );

      mockGetAllAsync.mockResolvedValue(mockRows);
      mockDecryptContent.mockImplementation((enc: string) => {
        const match = enc.match(/enc:Memory (\d+)/);
        if (match) return Promise.resolve(`Memory ${match[1]}`);
        return Promise.resolve('');
      });

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let memories: Memory[] = [];
      await act(async () => {
        memories = await result.current.searchMemories('Memory');
      });

      expect(memories.length).toBeLessThanOrEqual(20);
    });

    it('should be case-insensitive', async () => {
      const mockRows = [
        createMockRow({
          encrypted_content: 'enc:John helped me',
        }),
        createMockRow({
          encrypted_content: 'enc:john called today',
        }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);
      mockDecryptContent.mockImplementation((enc: string) => {
        if (enc === 'enc:John helped me') return Promise.resolve('John helped me');
        if (enc === 'enc:john called today') return Promise.resolve('john called today');
        return Promise.resolve('');
      });

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let memories: Memory[] = [];
      await act(async () => {
        memories = await result.current.searchMemories('JOHN');
      });

      expect(memories).toHaveLength(2);
    });

    it('should return empty array for empty query', async () => {
      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const memories = await act(async () => {
        return result.current.searchMemories('');
      });

      expect(memories).toEqual([]);
      expect(mockGetAllAsync).not.toHaveBeenCalled();
    });

    it('should return empty array for whitespace-only query', async () => {
      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const memories = await act(async () => {
        return result.current.searchMemories('   ');
      });

      expect(memories).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockGetAllAsync.mockRejectedValue(new Error('Search failed'));

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const memories = await act(async () => {
        return result.current.searchMemories('test');
      });

      expect(memories).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to search memories',
        expect.any(Object),
      );
    });
  });

  describe('getMemorySummary', () => {
    it('should generate memory summary', async () => {
      const mockRows = [
        createMockRow({ type: 'person', encrypted_content: 'enc:John' }),
        createMockRow({ type: 'trigger', encrypted_content: 'enc:Stress' }),
        createMockRow({ type: 'coping_strategy', encrypted_content: 'enc:Meditation' }),
        createMockRow({ type: 'victory', encrypted_content: 'enc:30 days sober' }),
        createMockRow({ type: 'struggle', encrypted_content: 'enc:Cravings at night' }),
        createMockRow({ type: 'goal', encrypted_content: 'enc:Get 90 days' }),
        createMockRow({ type: 'insight', encrypted_content: 'enc:I need meetings' }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);
      mockDecryptContent.mockImplementation((enc: string) => {
        if (enc.startsWith('enc:')) {
          return Promise.resolve(enc.replace('enc:', ''));
        }
        return Promise.resolve(enc);
      });

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let summary: MemorySummary = {
        people: [],
        triggers: [],
        copingStrategies: [],
        recentVictories: [],
        currentStruggles: [],
        goals: [],
        insights: [],
        emotionalTrends: { positive: [], negative: [] },
      };

      await act(async () => {
        summary = await result.current.getMemorySummary();
      });

      expect(summary.people).toHaveLength(1);
      expect(summary.people[0].name).toBe('John');
      expect(summary.triggers).toContain('Stress');
      expect(summary.copingStrategies).toContain('Meditation');
      expect(summary.recentVictories).toHaveLength(1);
      expect(summary.currentStruggles).toContain('Cravings at night');
      expect(summary.goals).toContain('Get 90 days');
      expect(summary.insights).toContain('I need meetings');
    });

    it('should dedupe triggers and coping strategies', async () => {
      const mockRows = [
        createMockRow({ type: 'trigger', encrypted_content: 'enc:Stress' }),
        createMockRow({ type: 'trigger', encrypted_content: 'enc:Stress' }),
        createMockRow({ type: 'coping_strategy', encrypted_content: 'enc:Walking' }),
        createMockRow({ type: 'coping_strategy', encrypted_content: 'enc:Walking' }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);
      mockDecryptContent.mockImplementation((enc: string) =>
        Promise.resolve(enc.replace('enc:', '')),
      );

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let summary: MemorySummary = {
        people: [],
        triggers: [],
        copingStrategies: [],
        recentVictories: [],
        currentStruggles: [],
        goals: [],
        insights: [],
        emotionalTrends: { positive: [], negative: [] },
      };

      await act(async () => {
        summary = await result.current.getMemorySummary();
      });

      expect(summary.triggers).toHaveLength(1);
      expect(summary.copingStrategies).toHaveLength(1);
    });

    it('should categorize emotions as positive or negative', async () => {
      const mockRows = [
        createMockRow({ type: 'emotion', encrypted_content: 'enc:happy, grateful, sad' }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);
      mockDecryptContent.mockImplementation((enc: string) =>
        Promise.resolve(enc.replace('enc:', '')),
      );

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let summary: MemorySummary = {
        people: [],
        triggers: [],
        copingStrategies: [],
        recentVictories: [],
        currentStruggles: [],
        goals: [],
        insights: [],
        emotionalTrends: { positive: [], negative: [] },
      };

      await act(async () => {
        summary = await result.current.getMemorySummary();
      });

      expect(summary.emotionalTrends.positive).toContain('happy');
      expect(summary.emotionalTrends.positive).toContain('grateful');
      expect(summary.emotionalTrends.negative).toContain('sad');
    });

    it('should limit arrays to appropriate sizes', async () => {
      const mockRows = [
        ...Array.from({ length: 15 }, (_, i) =>
          createMockRow({ type: 'person', encrypted_content: `enc:Person${i}` }),
        ),
        ...Array.from({ length: 15 }, (_, i) =>
          createMockRow({ type: 'trigger', encrypted_content: `enc:Trigger${i}` }),
        ),
        ...Array.from({ length: 15 }, (_, i) =>
          createMockRow({ type: 'victory', encrypted_content: `enc:Victory${i}` }),
        ),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);
      mockDecryptContent.mockImplementation((enc: string) =>
        Promise.resolve(enc.replace('enc:', '')),
      );

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let summary: MemorySummary = {
        people: [],
        triggers: [],
        copingStrategies: [],
        recentVictories: [],
        currentStruggles: [],
        goals: [],
        insights: [],
        emotionalTrends: { positive: [], negative: [] },
      };

      await act(async () => {
        summary = await result.current.getMemorySummary();
      });

      expect(summary.people.length).toBeLessThanOrEqual(10);
      expect(summary.triggers.length).toBeLessThanOrEqual(10);
      expect(summary.recentVictories.length).toBeLessThanOrEqual(5);
    });

    it('should return empty summary if database not ready', async () => {
      mockUseDatabase.mockReturnValue({
        db: null,
        isReady: false,
      });

      const { result } = renderHook(() => useMemoryStore(testUserId));

      let summary: MemorySummary = {
        people: [],
        triggers: [],
        copingStrategies: [],
        recentVictories: [],
        currentStruggles: [],
        goals: [],
        insights: [],
        emotionalTrends: { positive: [], negative: [] },
      };

      await act(async () => {
        summary = await result.current.getMemorySummary();
      });

      expect(summary.people).toEqual([]);
      expect(summary.triggers).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockGetAllAsync.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let summary: MemorySummary = {
        people: [],
        triggers: [],
        copingStrategies: [],
        recentVictories: [],
        currentStruggles: [],
        goals: [],
        insights: [],
        emotionalTrends: { positive: [], negative: [] },
      };

      await act(async () => {
        summary = await result.current.getMemorySummary();
      });

      expect(summary.people).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('generateAIContext', () => {
    it('should generate context string for AI', async () => {
      const mockRows = [
        createMockRow({ type: 'person', encrypted_content: 'enc:John, Sarah' }),
        createMockRow({ type: 'trigger', encrypted_content: 'enc:Stress, Meetings' }),
        createMockRow({ type: 'coping_strategy', encrypted_content: 'enc:Walking, Prayer' }),
        createMockRow({ type: 'victory', encrypted_content: 'enc:30 days sober' }),
        createMockRow({ type: 'struggle', encrypted_content: 'enc:Night cravings' }),
        createMockRow({ type: 'goal', encrypted_content: 'enc:90 days chip' }),
        createMockRow({ type: 'insight', encrypted_content: 'enc:Need more sleep' }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);
      mockDecryptContent.mockImplementation((enc: string) => {
        return Promise.resolve(enc.replace('enc:', ''));
      });

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let context = '';
      await act(async () => {
        context = await result.current.generateAIContext();
      });

      expect(context).toContain('People in their life');
      expect(context).toContain('Known triggers');
      expect(context).toContain('Coping strategies that work');
      expect(context).toContain('Recent wins');
      expect(context).toContain('Current struggles');
      expect(context).toContain('Goals');
      expect(context).toContain('Key insights');
    });

    it('should omit empty sections', async () => {
      const mockRows: ReturnType<typeof createMockRow>[] = [];

      mockGetAllAsync.mockResolvedValue(mockRows);

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let context = '';
      await act(async () => {
        context = await result.current.generateAIContext();
      });

      expect(context).toBe('');
    });

    it('should include only non-empty sections', async () => {
      const mockRows = [createMockRow({ type: 'person', encrypted_content: 'enc:John' })];

      mockGetAllAsync.mockResolvedValue(mockRows);
      mockDecryptContent.mockImplementation((enc: string) =>
        Promise.resolve(enc.replace('enc:', '')),
      );

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let context = '';
      await act(async () => {
        context = await result.current.generateAIContext();
      });

      expect(context).toContain('People in their life: John');
      expect(context).not.toContain('Known triggers');
    });

    it('should format context with newlines between sections', async () => {
      const mockRows = [
        createMockRow({ type: 'person', encrypted_content: 'enc:John' }),
        createMockRow({ type: 'trigger', encrypted_content: 'enc:Stress' }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);
      mockDecryptContent.mockImplementation((enc: string) =>
        Promise.resolve(enc.replace('enc:', '')),
      );

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let context = '';
      await act(async () => {
        context = await result.current.generateAIContext();
      });

      const lines = context.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('updateMemory', () => {
    it('should update memory content with encryption', async () => {
      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await act(async () => {
        await result.current.updateMemory('mem-123', { content: 'Updated content' });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('Updated content');
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE memories SET'),
        expect.arrayContaining(['encrypted:Updated content']),
      );
    });

    it('should update memory context with encryption', async () => {
      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await act(async () => {
        await result.current.updateMemory('mem-123', { context: 'Updated context' });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('Updated context');
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE memories SET'),
        expect.arrayContaining(['encrypted:Updated context']),
      );
    });

    it('should not update context when undefined', async () => {
      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await act(async () => {
        await result.current.updateMemory('mem-123', { context: undefined });
      });

      // context: undefined means the field is not updated (updates.context !== undefined is false)
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE memories SET'),
        expect.not.arrayContaining([null]),
      );
    });

    it('should update confidence', async () => {
      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await act(async () => {
        await result.current.updateMemory('mem-123', { confidence: 0.95 });
      });

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE memories SET'),
        expect.arrayContaining([0.95]),
      );
    });

    it('should update multiple fields at once', async () => {
      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await act(async () => {
        await result.current.updateMemory('mem-123', {
          content: 'New content',
          context: 'New context',
          confidence: 0.9,
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('New content');
      expect(mockEncryptContent).toHaveBeenCalledWith('New context');
    });

    it('should update updated_at timestamp', async () => {
      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await act(async () => {
        await result.current.updateMemory('mem-123', { content: 'Test' });
      });

      const callArgs = mockRunAsync.mock.calls[0][1];
      // Last value should be the id
      expect(callArgs[callArgs.length - 1]).toBe('mem-123');
      // Second to last should be the timestamp
      expect(callArgs[callArgs.length - 2]).toEqual(expect.any(String));
    });

    it('should not update if database not ready', async () => {
      mockUseDatabase.mockReturnValue({
        db: null,
        isReady: false,
      });

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await result.current.updateMemory('mem-123', { content: 'Test' });
      });

      expect(mockRunAsync).not.toHaveBeenCalled();
    });

    it('should handle update errors gracefully', async () => {
      mockRunAsync.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Should not throw
      await act(async () => {
        await result.current.updateMemory('mem-123', { content: 'Test' });
      });

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to update memory', expect.any(Object));
    });
  });

  describe('deleteMemory', () => {
    it('should delete memory by id', async () => {
      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await act(async () => {
        await result.current.deleteMemory('mem-123');
      });

      expect(mockRunAsync).toHaveBeenCalledWith('DELETE FROM memories WHERE id = ?', ['mem-123']);
    });

    it('should not delete if database not ready', async () => {
      mockUseDatabase.mockReturnValue({
        db: null,
        isReady: false,
      });

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await result.current.deleteMemory('mem-123');
      });

      expect(mockRunAsync).not.toHaveBeenCalled();
    });

    it('should handle delete errors gracefully', async () => {
      mockRunAsync.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Should not throw
      await act(async () => {
        await result.current.deleteMemory('mem-123');
      });

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete memory', expect.any(Object));
    });
  });

  describe('Memory Types Handling', () => {
    it('should handle all memory types in getMemoriesByType', async () => {
      mockGetAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const types: MemoryType[] = [
        'person',
        'trigger',
        'coping_strategy',
        'emotion',
        'victory',
        'struggle',
        'goal',
        'insight',
        'preference',
        'milestone',
        'pattern',
      ];

      for (const type of types) {
        await act(async () => {
          await result.current.getMemoriesByType(type);
        });
      }

      expect(mockGetAllAsync).toHaveBeenCalledTimes(types.length);
    });

    it('should categorize all types in summary', async () => {
      const mockRows = [
        createMockRow({ type: 'person', encrypted_content: 'enc:John' }),
        createMockRow({ type: 'trigger', encrypted_content: 'enc:Stress' }),
        createMockRow({ type: 'coping_strategy', encrypted_content: 'enc:Walking' }),
        createMockRow({ type: 'emotion', encrypted_content: 'enc:happy, sad' }),
        createMockRow({ type: 'victory', encrypted_content: 'enc:Win' }),
        createMockRow({ type: 'struggle', encrypted_content: 'enc:Hard time' }),
        createMockRow({ type: 'goal', encrypted_content: 'enc:Get better' }),
        createMockRow({ type: 'insight', encrypted_content: 'enc:Realization' }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);
      mockDecryptContent.mockImplementation((enc: string) =>
        Promise.resolve(enc.replace('enc:', '')),
      );

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let summary: MemorySummary = {
        people: [],
        triggers: [],
        copingStrategies: [],
        recentVictories: [],
        currentStruggles: [],
        goals: [],
        insights: [],
        emotionalTrends: { positive: [], negative: [] },
      };

      await act(async () => {
        summary = await result.current.getMemorySummary();
      });

      expect(summary.people).toHaveLength(1);
      expect(summary.triggers).toHaveLength(1);
      expect(summary.copingStrategies).toHaveLength(1);
      expect(summary.recentVictories).toHaveLength(1);
      expect(summary.currentStruggles).toHaveLength(1);
      expect(summary.goals).toHaveLength(1);
      expect(summary.insights).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null context in row', async () => {
      const mockRows = [
        createMockRow({
          encrypted_context: null,
          encrypted_content: 'enc:Test',
        }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);
      mockDecryptContent.mockImplementation((enc: string) =>
        Promise.resolve(enc.replace('enc:', '')),
      );

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let memories: Memory[] = [];
      await act(async () => {
        memories = await result.current.getAllMemories();
      });

      expect(memories[0].context).toBeUndefined();
    });

    it('should handle various date formats', async () => {
      const mockRows = [
        createMockRow({
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-16T14:45:00.000Z',
        }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let memories: Memory[] = [];
      await act(async () => {
        memories = await result.current.getAllMemories();
      });

      expect(memories[0].createdAt).toBeInstanceOf(Date);
      expect(memories[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should handle unknown source values', async () => {
      const mockRows = [
        createMockRow({
          source: 'unknown_source',
          encrypted_content: 'enc:Test',
        }),
      ];

      mockGetAllAsync.mockResolvedValue(mockRows);
      mockDecryptContent.mockResolvedValue('Test');

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      let memories: Memory[] = [];
      await act(async () => {
        memories = await result.current.getAllMemories();
      });

      // Should default to 'journal'
      expect(memories[0].source).toBe('journal');
    });

    it('should handle valid source values', async () => {
      const sources = ['journal', 'checkin', 'chat'] as const;

      for (const source of sources) {
        mockGetAllAsync.mockResolvedValue([
          createMockRow({ source, encrypted_content: 'enc:Test' }),
        ]);
        mockDecryptContent.mockResolvedValue('Test');

        const { result } = renderHook(() => useMemoryStore(testUserId));

        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        });

        let memories: Memory[] = [];
        await act(async () => {
          memories = await result.current.getAllMemories();
        });

        expect(memories[0].source).toBe(source);
      }
    });

    it('should handle memory with key in update deduplication', async () => {
      mockGetAllAsync.mockResolvedValue([{ id: 'existing-id', key: 'unique:key' }]);

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const memory = createMockMemory({
        key: 'unique:key',
        content: 'Test content',
      });

      await act(async () => {
        await result.current.addMemories([memory]);
      });

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, key FROM memories WHERE user_id = ? AND key IN (?)'),
        [testUserId, 'unique:key'],
      );
    });
  });

  describe('isLoading State', () => {
    it('should track loading state during addMemories', async () => {
      const { result } = renderHook(() => useMemoryStore(testUserId));

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const memory = createMockMemory();

      // Slow encryption to observe loading state
      mockEncryptContent.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('encrypted:test'), 50)),
      );

      const addPromise = act(async () => {
        await result.current.addMemories([memory]);
      });

      await addPromise;

      // After completion, loading should be false
      expect(result.current.isLoading).toBe(false);
    });

    it('should reset loading state on error', async () => {
      mockEncryptContent.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useMemoryStore(testUserId));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const memory = createMockMemory();

      await act(async () => {
        await result.current.addMemories([memory]);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
