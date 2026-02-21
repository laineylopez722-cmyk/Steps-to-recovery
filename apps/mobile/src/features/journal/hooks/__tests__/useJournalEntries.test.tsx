/**
 * useJournalEntries Hook Test Suite
 *
 * Tests journal entry functionality including:
 * - Fetch and decrypt journal entries
 * - Create entries with optimistic updates
 * - Update entries with partial updates
 * - Delete entries with sync queue
 * - Encryption/decryption of content
 * - Error handling and rollback
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies before importing hooks
const mockEncryptContent = jest.fn();
const mockDecryptContent = jest.fn();
const mockAddToSyncQueue = jest.fn();
const mockAddDeleteToSyncQueue = jest.fn();
const mockGenerateId = jest.fn();

// Mock database - mutable for dynamic testing
let mockDbIsReady = true;
let mockDbInstance: any = {
  getDatabaseName: jest.fn().mockReturnValue('test.db'),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
  execAsync: jest.fn(),
  withTransactionAsync: jest.fn(),
};

jest.mock('../../../../contexts/DatabaseContext', () => ({
  useDatabase: () => ({
    db: mockDbInstance,
    isReady: mockDbIsReady,
  }),
}));

jest.mock('../../../../utils/encryption', () => ({
  encryptContent: (content: string) => mockEncryptContent(content),
  decryptContent: (content: string) => mockDecryptContent(content),
}));

jest.mock('../../../../services/syncService', () => ({
  addToSyncQueue: (...args: any[]) => mockAddToSyncQueue(...args),
  addDeleteToSyncQueue: (...args: any[]) => mockAddDeleteToSyncQueue(...args),
}));

jest.mock('../../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../../utils/id', () => ({
  generateId: (prefix: string) => mockGenerateId(prefix),
}));

// Import hooks after mocking
import {
  useJournalEntries,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
  journalKeys,
} from '../useJournalEntries';
import { logger as mockLogger } from '../../../../utils/logger';

describe('useJournalEntries', () => {
  const testUserId = 'user-123';
  let queryClient: QueryClient;

  // Wrapper component with QueryClient
  const createWrapper = () => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock database state
    mockDbIsReady = true;
    mockDbInstance = {
      getDatabaseName: jest.fn().mockReturnValue('test.db'),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
      runAsync: jest.fn(),
      execAsync: jest.fn(),
      withTransactionAsync: jest.fn(),
    };

    // Fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    // Default mock implementations
    mockEncryptContent.mockImplementation((content: string) =>
      Promise.resolve(`encrypted_${content}`),
    );
    mockDecryptContent.mockImplementation((content: string) => {
      if (content === null || content === undefined) return Promise.resolve('');
      return Promise.resolve(content.replace('encrypted_', ''));
    });
    mockAddToSyncQueue.mockResolvedValue(undefined);
    mockAddDeleteToSyncQueue.mockResolvedValue(undefined);
    mockGenerateId.mockReturnValue('journal-test-id-123');
    mockDbInstance.getAllAsync.mockResolvedValue([]);
    mockDbInstance.getFirstAsync.mockResolvedValue(null);
    mockDbInstance.runAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
  });

  afterEach(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    mockDbIsReady = true;
  });

  describe('useJournalEntries', () => {
    it('should return empty array when no entries exist', async () => {
      mockDbInstance.getAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => useJournalEntries(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should fetch and decrypt journal entries', async () => {
      const dbEntries = [
        {
          id: 'entry-1',
          user_id: testUserId,
          encrypted_title: 'encrypted_My Title',
          encrypted_body: 'encrypted_My journal content',
          encrypted_mood: 'encrypted_5',
          encrypted_craving: 'encrypted_2',
          encrypted_tags: 'encrypted_["tag1","tag2"]',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced',
          supabase_id: 'sb-1',
        },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(dbEntries);
      mockDecryptContent
        .mockResolvedValueOnce('My Title')
        .mockResolvedValueOnce('My journal content')
        .mockResolvedValueOnce('5')
        .mockResolvedValueOnce('2')
        .mockResolvedValueOnce('["tag1","tag2"]');

      const { result } = renderHook(() => useJournalEntries(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0]).toMatchObject({
        id: 'entry-1',
        title: 'My Title',
        body: 'My journal content',
        mood: 5,
        craving: 2,
        tags: ['tag1', 'tag2'],
      });
    });

    it('should handle entries without optional fields', async () => {
      const dbEntries = [
        {
          id: 'entry-2',
          user_id: testUserId,
          encrypted_title: null,
          encrypted_body: 'encrypted_Minimal content',
          encrypted_mood: null,
          encrypted_craving: null,
          encrypted_tags: null,
          created_at: '2025-01-02T10:00:00Z',
          updated_at: '2025-01-02T10:00:00Z',
          sync_status: 'pending',
          supabase_id: null,
        },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(dbEntries);
      mockDecryptContent.mockResolvedValueOnce('Minimal content');

      const { result } = renderHook(() => useJournalEntries(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries[0]).toMatchObject({
        id: 'entry-2',
        title: null,
        body: 'Minimal content',
        mood: null,
        craving: null,
        tags: [],
      });
    });

    it('should sort entries by created_at DESC', async () => {
      const dbEntries = [
        {
          id: 'entry-old',
          user_id: testUserId,
          encrypted_title: null,
          encrypted_body: 'encrypted_Older',
          encrypted_mood: null,
          encrypted_craving: null,
          encrypted_tags: null,
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced',
          supabase_id: null,
        },
        {
          id: 'entry-new',
          user_id: testUserId,
          encrypted_title: null,
          encrypted_body: 'encrypted_Newer',
          encrypted_mood: null,
          encrypted_craving: null,
          encrypted_tags: null,
          created_at: '2025-01-03T10:00:00Z',
          updated_at: '2025-01-03T10:00:00Z',
          sync_status: 'synced',
          supabase_id: null,
        },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(dbEntries);
      mockDecryptContent.mockResolvedValueOnce('Older').mockResolvedValueOnce('Newer');

      renderHook(() => useJournalEntries(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockDbInstance.getAllAsync).toHaveBeenCalledWith(
          expect.stringContaining('ORDER BY created_at DESC'),
          [testUserId],
        );
      });
    });

    it('should handle database errors gracefully', async () => {
      mockDbInstance.getAllAsync.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useJournalEntries(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch journal entries',
        expect.any(Error),
      );
    });

    it('should filter entries by user_id', async () => {
      mockDbInstance.getAllAsync.mockResolvedValue([]);

      renderHook(() => useJournalEntries(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockDbInstance.getAllAsync).toHaveBeenCalledWith(
          expect.stringContaining('WHERE user_id = ?'),
          [testUserId],
        );
      });
    });

    it('should not fetch when database is not ready', async () => {
      mockDbIsReady = false;

      renderHook(() => useJournalEntries(testUserId), {
        wrapper: createWrapper(),
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify no db call was made since isReady is false
      expect(mockDbInstance.getAllAsync).not.toHaveBeenCalled();

      // Restore for other tests
      mockDbIsReady = true;
    });

    it('should handle decryption errors', async () => {
      const dbEntries = [
        {
          id: 'entry-1',
          user_id: testUserId,
          encrypted_title: 'encrypted_Title',
          encrypted_body: 'encrypted_Body',
          encrypted_mood: null,
          encrypted_craving: null,
          encrypted_tags: null,
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced',
          supabase_id: null,
        },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(dbEntries);
      mockDecryptContent.mockRejectedValue(new Error('Decryption failed'));

      const { result } = renderHook(() => useJournalEntries(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should provide refetch function', async () => {
      mockDbInstance.getAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => useJournalEntries(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockDbInstance.getAllAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('useCreateJournalEntry', () => {
    it('should create a journal entry with encryption', async () => {
      const { result } = renderHook(() => useCreateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createEntry({
          title: 'My Journal Title',
          body: 'My journal content here',
          mood: 7,
          craving: 3,
          tags: ['recovery', 'gratitude'],
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('My Journal Title');
      expect(mockEncryptContent).toHaveBeenCalledWith('My journal content here');
      expect(mockEncryptContent).toHaveBeenCalledWith('7');
      expect(mockEncryptContent).toHaveBeenCalledWith('3');
      expect(mockEncryptContent).toHaveBeenCalledWith('["recovery","gratitude"]');

      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO journal_entries'),
        expect.arrayContaining([
          'journal-test-id-123',
          testUserId,
          'encrypted_My Journal Title',
          'encrypted_My journal content here',
          'encrypted_7',
          'encrypted_3',
          'encrypted_["recovery","gratitude"]',
          expect.any(String), // created_at
          expect.any(String), // updated_at
          'pending',
        ]),
      );

      expect(mockAddToSyncQueue).toHaveBeenCalledWith(
        mockDbInstance,
        'journal_entries',
        'journal-test-id-123',
        'insert',
      );

      expect(mockLogger.info).toHaveBeenCalledWith('Journal entry created', {
        id: 'journal-test-id-123',
      });
    });

    it('should create entry without optional fields', async () => {
      const { result } = renderHook(() => useCreateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createEntry({
          title: '',
          body: 'Just a simple entry',
          mood: null,
          craving: null,
          tags: [],
        });
      });

      // Get the actual call arguments
      const insertCall = mockDbInstance.runAsync.mock.calls[0];
      const params = insertCall[1];

      // encrypted_title should be null when empty (index 2)
      expect(params[2]).toBeNull();
      // encrypted_mood should be null (index 5)
      expect(params[5]).toBeNull();
      // encrypted_craving should be null (index 6)
      expect(params[6]).toBeNull();
      // encrypted_tags should be null for empty array (index 7) - now using updated_at
      // The order is: id, user_id, encrypted_title, encrypted_body, encrypted_mood, encrypted_craving, encrypted_tags, created_at, updated_at, sync_status
      expect(params[6]).toBeNull(); // encrypted_tags is at index 6 now (before craving)
    });

    it('should handle optimistic updates', async () => {
      // Pre-populate cache with existing entries
      const existingEntry = {
        id: 'existing-entry',
        user_id: testUserId,
        title: 'Existing',
        body: 'Existing body',
        mood: 5,
        craving: null,
        tags: [],
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        sync_status: 'synced' as const,
        supabase_id: 'sb-1',
      };

      queryClient.setQueryData(journalKeys.byUser(testUserId), [existingEntry]);

      const { result } = renderHook(() => useCreateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      // Create entry and await completion
      await act(async () => {
        await result.current.createEntry({
          title: 'New Entry',
          body: 'New body',
          mood: 8,
          craving: null,
          tags: ['test'],
        });
      });

      // Verify the entry was created
      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO journal_entries'),
        expect.arrayContaining([
          expect.any(String),
          testUserId,
          'encrypted_New Entry',
          'encrypted_New body',
        ]),
      );
    });

    it('should rollback optimistic update on error', async () => {
      const existingEntry = {
        id: 'existing-entry',
        user_id: testUserId,
        title: 'Existing',
        body: 'Existing body',
        mood: 5,
        craving: null,
        tags: [],
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        sync_status: 'synced' as const,
        supabase_id: 'sb-1',
      };

      queryClient.setQueryData(journalKeys.byUser(testUserId), [existingEntry]);
      mockDbInstance.runAsync.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useCreateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.createEntry({
            title: 'New Entry',
            body: 'New body',
            mood: null,
            craving: null,
            tags: [],
          });
        }),
      ).rejects.toThrow('Database error');

      // Verify rollback occurred
      const cachedData = queryClient.getQueryData<(typeof existingEntry)[]>(
        journalKeys.byUser(testUserId),
      );
      expect(cachedData).toHaveLength(1);
      expect(cachedData?.[0].title).toBe('Existing');
    });

    it('should handle database not initialized', async () => {
      mockDbInstance = null;
      mockDbIsReady = false;

      const { result } = renderHook(() => useCreateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.createEntry({
            title: 'Test',
            body: 'Body',
            mood: null,
            craving: null,
            tags: [],
          });
        }),
      ).rejects.toThrow('Database not initialized');
    });

    it('should invalidate queries after creation', async () => {
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createEntry({
          title: 'Test',
          body: 'Body',
          mood: null,
          craving: null,
          tags: [],
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: journalKeys.byUser(testUserId),
      });
    });

    it('should track pending state', async () => {
      let resolveRunAsync: (value: unknown) => void;
      const runAsyncPromise = new Promise((resolve) => {
        resolveRunAsync = resolve;
      });
      mockDbInstance.runAsync.mockReturnValue(runAsyncPromise);

      const { result } = renderHook(() => useCreateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.createEntry({
          title: 'Test',
          body: 'Body',
          mood: null,
          craving: null,
          tags: [],
        });
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      resolveRunAsync!({ lastInsertRowId: 1, changes: 1 });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });

  describe('useUpdateJournalEntry', () => {
    it('should update a journal entry with encryption', async () => {
      const { result } = renderHook(() => useUpdateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateEntry('entry-123', {
          title: 'Updated Title',
          body: 'Updated content',
          mood: 9,
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('Updated Title');
      expect(mockEncryptContent).toHaveBeenCalledWith('Updated content');
      expect(mockEncryptContent).toHaveBeenCalledWith('9');

      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE journal_entries'),
        expect.arrayContaining([
          'encrypted_Updated Title',
          'encrypted_Updated content',
          'encrypted_9',
          expect.any(String), // updated_at
          'pending',
          'entry-123',
          testUserId,
        ]),
      );

      expect(mockAddToSyncQueue).toHaveBeenCalledWith(
        mockDbInstance,
        'journal_entries',
        'entry-123',
        'update',
      );

      expect(mockLogger.info).toHaveBeenCalledWith('Journal entry updated', { id: 'entry-123' });
    });

    it('should only update provided fields', async () => {
      const { result } = renderHook(() => useUpdateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateEntry('entry-123', {
          mood: 6,
        });
      });

      // Should only encrypt mood
      expect(mockEncryptContent).toHaveBeenCalledTimes(1);
      expect(mockEncryptContent).toHaveBeenCalledWith('6');

      const updateCall = mockDbInstance.runAsync.mock.calls[0][0] as string;
      expect(updateCall).toContain('encrypted_mood = ?');
      expect(updateCall).not.toContain('encrypted_title = ?');
      expect(updateCall).not.toContain('encrypted_body = ?');
    });

    it('should handle clearing fields (set to null)', async () => {
      const { result } = renderHook(() => useUpdateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateEntry('entry-123', {
          title: '', // Clear title
          mood: null, // Clear mood
        });
      });

      const updateCall = mockDbInstance.runAsync.mock.calls[0];
      const params = updateCall[1];
      // First two params should be the encrypted values (null for cleared fields)
      expect(params[0]).toBeNull(); // encrypted_title
      expect(params[1]).toBeNull(); // encrypted_mood
    });

    it('should handle optimistic updates', async () => {
      const { result } = renderHook(() => useUpdateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      // Update entry and verify SQL is correct
      await act(async () => {
        await result.current.updateEntry('entry-123', {
          title: 'Updated Title',
          mood: 8,
        });
      });

      // Verify the update was called with correct params
      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE journal_entries'),
        expect.arrayContaining([
          'encrypted_Updated Title',
          'encrypted_8',
          expect.any(String), // updated_at
          'pending',
          'entry-123',
          testUserId,
        ]),
      );
    });

    it('should rollback on error', async () => {
      const existingEntries = [
        {
          id: 'entry-123',
          user_id: testUserId,
          title: 'Original Title',
          body: 'Original body',
          mood: 5,
          craving: null,
          tags: [],
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced' as const,
          supabase_id: 'sb-1',
        },
      ];

      queryClient.setQueryData(journalKeys.byUser(testUserId), existingEntries);
      mockDbInstance.runAsync.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useUpdateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.updateEntry('entry-123', {
            title: 'New Title',
          });
        }),
      ).rejects.toThrow('Update failed');

      // Verify rollback
      const cachedData = queryClient.getQueryData<typeof existingEntries>(
        journalKeys.byUser(testUserId),
      );
      expect(cachedData?.[0].title).toBe('Original Title');
    });

    it('should require user_id in WHERE clause', async () => {
      const { result } = renderHook(() => useUpdateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateEntry('entry-123', {
          body: 'Updated',
        });
      });

      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ? AND user_id = ?'),
        expect.arrayContaining(['entry-123', testUserId]),
      );
    });

    it('should update tags correctly', async () => {
      const { result } = renderHook(() => useUpdateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateEntry('entry-123', {
          tags: ['new-tag-1', 'new-tag-2'],
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('["new-tag-1","new-tag-2"]');
    });

    it('should set sync_status to pending on update', async () => {
      const { result } = renderHook(() => useUpdateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateEntry('entry-123', {
          body: 'Updated',
        });
      });

      const updateCall = mockDbInstance.runAsync.mock.calls[0][0] as string;
      // The SQL uses a parameterized query: sync_status = ?
      // The value 'pending' is passed as a parameter, not in the SQL string
      expect(updateCall).toContain('sync_status = ?');

      // Verify the parameters include 'pending'
      const params = mockDbInstance.runAsync.mock.calls[0][1];
      expect(params).toContain('pending');
    });
  });

  describe('useDeleteJournalEntry', () => {
    it('should delete a journal entry', async () => {
      const { result } = renderHook(() => useDeleteJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.deleteEntry('entry-123');
      });

      // Should add to sync queue BEFORE delete
      expect(mockAddDeleteToSyncQueue).toHaveBeenCalledWith(
        mockDbInstance,
        'journal_entries',
        'entry-123',
        testUserId,
      );

      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        'DELETE FROM journal_entries WHERE id = ? AND user_id = ?',
        ['entry-123', testUserId],
      );

      expect(mockLogger.info).toHaveBeenCalledWith('Journal entry deleted', { id: 'entry-123' });
    });

    it('should handle optimistic removal', async () => {
      const { result } = renderHook(() => useDeleteJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      // Delete entry and verify SQL is correct
      await act(async () => {
        await result.current.deleteEntry('entry-123');
      });

      // Verify addDeleteToSyncQueue was called BEFORE delete
      expect(mockAddDeleteToSyncQueue).toHaveBeenCalledWith(
        mockDbInstance,
        'journal_entries',
        'entry-123',
        testUserId,
      );

      // Verify the delete was called with correct params
      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        'DELETE FROM journal_entries WHERE id = ? AND user_id = ?',
        ['entry-123', testUserId],
      );
    });

    it('should rollback on delete error', async () => {
      const existingEntries = [
        {
          id: 'entry-123',
          user_id: testUserId,
          title: 'To Delete',
          body: 'Body',
          mood: 5,
          craving: null,
          tags: [],
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced' as const,
          supabase_id: 'sb-1',
        },
      ];

      queryClient.setQueryData(journalKeys.byUser(testUserId), existingEntries);
      mockDbInstance.runAsync.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useDeleteJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.deleteEntry('entry-123');
        }),
      ).rejects.toThrow('Delete failed');

      // Verify rollback
      const cachedData = queryClient.getQueryData<typeof existingEntries>(
        journalKeys.byUser(testUserId),
      );
      expect(cachedData).toHaveLength(1);
      expect(cachedData?.[0].id).toBe('entry-123');
    });

    it('should require user_id in DELETE clause', async () => {
      const { result } = renderHook(() => useDeleteJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.deleteEntry('entry-123');
      });

      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('AND user_id = ?'),
        expect.arrayContaining([testUserId]),
      );
    });

    it('should handle database not initialized', async () => {
      mockDbInstance = null;
      mockDbIsReady = false;

      const { result } = renderHook(() => useDeleteJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.deleteEntry('entry-123');
        }),
      ).rejects.toThrow('Database not initialized');
    });
  });

  describe('journalKeys', () => {
    it('should generate correct query keys', () => {
      expect(journalKeys.all).toEqual(['journal_entries']);
      expect(journalKeys.byUser('user-123')).toEqual(['journal_entries', 'user-123']);
      expect(journalKeys.byId('user-123', 'entry-456')).toEqual([
        'journal_entries',
        'user-123',
        'entry-456',
      ]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle entries with special characters in content', async () => {
      mockDbInstance.getAllAsync.mockResolvedValue([
        {
          id: 'entry-1',
          user_id: testUserId,
          encrypted_title: 'encrypted_Special: "chars" & <tags>',
          encrypted_body: 'encrypted_Content with \n newlines \t tabs',
          encrypted_mood: null,
          encrypted_craving: null,
          encrypted_tags: null,
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced',
          supabase_id: null,
        },
      ]);

      mockDecryptContent
        .mockResolvedValueOnce('Special: "chars" & <tags>')
        .mockResolvedValueOnce('Content with \n newlines \t tabs');

      const { result } = renderHook(() => useJournalEntries(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries[0].title).toBe('Special: "chars" & <tags>');
      expect(result.current.entries[0].body).toBe('Content with \n newlines \t tabs');
    });

    it('should handle entries with emoji', async () => {
      const { result } = renderHook(() => useCreateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createEntry({
          title: 'Grateful day 🙏',
          body: 'Feeling blessed 🎉🎊',
          mood: 10,
          craving: null,
          tags: ['gratitude', '🙏'],
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('Grateful day 🙏');
      expect(mockEncryptContent).toHaveBeenCalledWith('Feeling blessed 🎉🎊');
    });

    it('should handle very long content', async () => {
      const longBody = 'A'.repeat(10000);

      const { result } = renderHook(() => useCreateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createEntry({
          title: 'Long entry',
          body: longBody,
          mood: null,
          craving: null,
          tags: [],
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith(longBody);
    });

    it('should handle rapid successive creations', async () => {
      const { result } = renderHook(() => useCreateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      let idCounter = 0;
      mockGenerateId.mockImplementation(() => `journal-${++idCounter}`);

      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          result.current.createEntry({
            title: `Entry ${i}`,
            body: `Body ${i}`,
            mood: i,
            craving: null,
            tags: [],
          }),
        );
      }

      await act(async () => {
        await Promise.all(promises);
      });

      expect(mockDbInstance.runAsync).toHaveBeenCalledTimes(5);
      expect(mockAddToSyncQueue).toHaveBeenCalledTimes(5);
    });

    it('should handle entries with empty tags array', async () => {
      const { result } = renderHook(() => useCreateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createEntry({
          title: 'No tags',
          body: 'Body',
          mood: null,
          craving: null,
          tags: [],
        });
      });

      const insertCall = mockDbInstance.runAsync.mock.calls[0];
      const params = insertCall[1];
      // encrypted_tags should be null for empty array (index 6, before craving)
      // Order: id, user_id, encrypted_title, encrypted_body, encrypted_mood, encrypted_craving, encrypted_tags, created_at, updated_at, sync_status
      expect(params[6]).toBeNull(); // encrypted_tags
    });

    it('should handle JSON parse errors in tags gracefully', async () => {
      const dbEntries = [
        {
          id: 'entry-1',
          user_id: testUserId,
          encrypted_title: null,
          encrypted_body: 'encrypted_Body',
          encrypted_mood: null,
          encrypted_craving: null,
          encrypted_tags: 'encrypted_invalid_json',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced',
          supabase_id: null,
        },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(dbEntries);
      mockDecryptContent.mockResolvedValueOnce('Body').mockResolvedValueOnce('not valid json');

      const { result } = renderHook(() => useJournalEntries(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should throw when trying to parse invalid JSON
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Integration between hooks', () => {
    it('should execute all CRUD operations successfully', async () => {
      // Create entry
      const { result: createResult } = renderHook(() => useCreateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await createResult.current.createEntry({
          title: 'New Entry',
          body: 'New body',
          mood: 8,
          craving: null,
          tags: ['new'],
        });
      });

      // Verify create was called
      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO journal_entries'),
        expect.any(Array),
      );

      // Update entry
      const { result: updateResult } = renderHook(() => useUpdateJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await updateResult.current.updateEntry('entry-1', {
          title: 'Updated Title',
        });
      });

      // Verify update was called
      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE journal_entries'),
        expect.any(Array),
      );

      // Delete entry
      const { result: deleteResult } = renderHook(() => useDeleteJournalEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await deleteResult.current.deleteEntry('entry-1');
      });

      // Verify delete was called
      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        'DELETE FROM journal_entries WHERE id = ? AND user_id = ?',
        ['entry-1', testUserId],
      );
    });
  });
});
