import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

interface GratitudeEntryDb {
  id: string;
  user_id: string;
  entry_date: string;
  encrypted_item_1: string;
  encrypted_item_2: string;
  encrypted_item_3: string;
  created_at: string;
  updated_at: string;
  sync_status: string;
  supabase_id: string | null;
}

interface GratitudeEntry {
  id: string;
  user_id: string;
  entry_date: string;
  items: [string, string, string];
  created_at: string;
  updated_at: string;
  sync_status: string;
  supabase_id: string | null;
}

interface MockDatabase {
  getDatabaseName: jest.Mock<string, []>;
  getFirstAsync: jest.Mock<Promise<unknown | null>, [string, readonly unknown[]]>;
  getAllAsync: jest.Mock<Promise<GratitudeEntryDb[]>, [string, readonly unknown[]]>;
  runAsync: jest.Mock<Promise<unknown>, [string, readonly unknown[]]>;
  execAsync: jest.Mock<Promise<unknown>, [string]>;
  withTransactionAsync: jest.Mock<Promise<unknown>, [() => Promise<unknown>]>;
}

const mockEncryptContent: jest.Mock<Promise<string>, [string]> = jest.fn();
const mockDecryptContent: jest.Mock<Promise<string>, [string]> = jest.fn();
const mockAddToSyncQueue: jest.Mock<Promise<void>, [MockDatabase, string, string, string]> =
  jest.fn();
const mockAddDeleteToSyncQueue: jest.Mock<Promise<void>, [MockDatabase, string, string, string]> =
  jest.fn();
const mockGenerateId: jest.Mock<string, [string]> = jest.fn();

let mockDbIsReady = true;
let mockDbInstance: MockDatabase | null = createMockDb();

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
  addToSyncQueue: (...args: readonly unknown[]) =>
    mockAddToSyncQueue(...(args as [MockDatabase, string, string, string])),
  addDeleteToSyncQueue: (...args: readonly unknown[]) =>
    mockAddDeleteToSyncQueue(...(args as [MockDatabase, string, string, string])),
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

import {
  gratitudeEntryKeys,
  useCreateGratitudeEntry,
  useDeleteGratitudeEntry,
  useGratitudeEntries,
  useUpdateGratitudeEntry,
} from '../useGratitudeEntries';
import { logger as mockLogger } from '../../../../utils/logger';

describe('useGratitudeEntries', () => {
  const testUserId = 'user-123';
  let queryClient: QueryClient;

  const createWrapper = () => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  };

  const expectRollbackRejection = async (
    operation: () => Promise<unknown>,
    expectedMessage: string,
  ) => {
    await expect(
      act(async () => {
        await operation();
      }),
    ).rejects.toThrow(expectedMessage);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbIsReady = true;
    mockDbInstance = createMockDb();
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

    mockEncryptContent.mockImplementation(async (content: string) => `encrypted_${content}`);
    mockDecryptContent.mockImplementation(async (content: string) => content.replace('encrypted_', ''));
    mockAddToSyncQueue.mockResolvedValue(undefined);
    mockAddDeleteToSyncQueue.mockResolvedValue(undefined);
    mockGenerateId.mockReturnValue('gratitude-test-id-123');

    const db = getDb();
    db.getAllAsync.mockResolvedValue([]);
    db.getFirstAsync.mockResolvedValue(null);
    db.runAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
  });

  afterEach(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    mockDbIsReady = true;
  });

  describe('useGratitudeEntries', () => {
    it('returns an empty array when there are no gratitude entries', async () => {
      const { result } = renderHook(() => useGratitudeEntries(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('fetches and decrypts gratitude entries', async () => {
      const db = getDb();
      const rows: GratitudeEntryDb[] = [
        {
          id: 'gratitude-1',
          user_id: testUserId,
          entry_date: '2026-03-22',
          encrypted_item_1: 'encrypted_Family',
          encrypted_item_2: 'encrypted_Coffee',
          encrypted_item_3: 'encrypted_Sunlight',
          created_at: '2026-03-22T09:00:00Z',
          updated_at: '2026-03-22T09:00:00Z',
          sync_status: 'synced',
          supabase_id: 'sb-1',
        },
      ];

      db.getAllAsync.mockResolvedValue(rows);

      mockDecryptContent
        .mockResolvedValueOnce('Family')
        .mockResolvedValueOnce('Coffee')
        .mockResolvedValueOnce('Sunlight');

      const { result } = renderHook(() => useGratitudeEntries(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(db.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY entry_date DESC'),
        [testUserId],
      );
      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0]).toMatchObject({
        id: 'gratitude-1',
        entry_date: '2026-03-22',
        items: ['Family', 'Coffee', 'Sunlight'],
      });
    });

    it('filters out a row when decryption fails', async () => {
      const db = getDb();
      db.getAllAsync.mockResolvedValue([
        {
          id: 'gratitude-good',
          user_id: testUserId,
          entry_date: '2026-03-22',
          encrypted_item_1: 'encrypted_One',
          encrypted_item_2: 'encrypted_Two',
          encrypted_item_3: 'encrypted_Three',
          created_at: '2026-03-22T09:00:00Z',
          updated_at: '2026-03-22T09:00:00Z',
          sync_status: 'synced',
          supabase_id: 'sb-1',
        },
        {
          id: 'gratitude-bad',
          user_id: testUserId,
          entry_date: '2026-03-21',
          encrypted_item_1: 'encrypted_Four',
          encrypted_item_2: 'encrypted_Five',
          encrypted_item_3: 'encrypted_Six',
          created_at: '2026-03-21T09:00:00Z',
          updated_at: '2026-03-21T09:00:00Z',
          sync_status: 'synced',
          supabase_id: 'sb-2',
        },
      ]);

      mockDecryptContent
        .mockResolvedValueOnce('One')
        .mockResolvedValueOnce('Two')
        .mockResolvedValueOnce('Three')
        .mockResolvedValueOnce('Four')
        .mockResolvedValueOnce('Five')
        .mockRejectedValueOnce(new Error('Corrupt ciphertext'));

      const { result } = renderHook(() => useGratitudeEntries(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0].id).toBe('gratitude-good');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to decrypt gratitude entry', {
        entryId: 'gratitude-bad',
      });
    });
  });

  describe('useCreateGratitudeEntry', () => {
    it('encrypts items, inserts the row, and queues sync after insert', async () => {
      const db = getDb();
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateGratitudeEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createEntry({
          entry_date: '2026-03-22',
          items: ['Family', 'Coffee', 'Sunlight'],
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('Family');
      expect(mockEncryptContent).toHaveBeenCalledWith('Coffee');
      expect(mockEncryptContent).toHaveBeenCalledWith('Sunlight');
      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO gratitude_entries'),
        expect.arrayContaining([
          'gratitude-test-id-123',
          testUserId,
          '2026-03-22',
          'encrypted_Family',
          'encrypted_Coffee',
          'encrypted_Sunlight',
          expect.any(String),
          expect.any(String),
          'pending',
        ]),
      );
      expect(db.runAsync.mock.invocationCallOrder[0]).toBeLessThan(
        mockAddToSyncQueue.mock.invocationCallOrder[0],
      );
      expect(mockAddToSyncQueue).toHaveBeenCalledWith(
        db,
        'gratitude_entries',
        'gratitude-test-id-123',
        'insert',
      );
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: gratitudeEntryKeys.byUser(testUserId),
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Gratitude entry created', {
        id: 'gratitude-test-id-123',
      });
    });

    it('rolls back optimistic create state on error', async () => {
      const seedEntries: GratitudeEntry[] = [
        {
          id: 'existing-entry',
          user_id: testUserId,
          entry_date: '2026-03-21',
          items: ['Existing 1', 'Existing 2', 'Existing 3'],
          created_at: '2026-03-21T09:00:00Z',
          updated_at: '2026-03-21T09:00:00Z',
          sync_status: 'synced',
          supabase_id: 'sb-existing',
        },
      ];

      queryClient.setQueryData(gratitudeEntryKeys.byUser(testUserId), seedEntries);
      getDb().runAsync.mockRejectedValue(new Error('Insert failed'));

      const { result } = renderHook(() => useCreateGratitudeEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await expectRollbackRejection(
        () =>
          result.current.createEntry({
            entry_date: '2026-03-22',
            items: ['New 1', 'New 2', 'New 3'],
          }),
        'Insert failed',
      );

      const cachedData = queryClient.getQueryData<GratitudeEntry[]>(
        gratitudeEntryKeys.byUser(testUserId),
      );
      expect(cachedData).toEqual(seedEntries);
    });

    it('rejects when the database is not initialized', async () => {
      mockDbInstance = null;

      const { result } = renderHook(() => useCreateGratitudeEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await expect(
          result.current.createEntry({
            entry_date: '2026-03-22',
            items: ['A', 'B', 'C'],
          }),
        ).rejects.toThrow('Database not initialized');
      });
    });
  });

  describe('useUpdateGratitudeEntry', () => {
    it('encrypts updated items and writes only the provided fields', async () => {
      const db = getDb();
      const { result } = renderHook(() => useUpdateGratitudeEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateEntry('gratitude-1', {
          items: ['Updated 1', 'Updated 2', 'Updated 3'],
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('Updated 1');
      expect(mockEncryptContent).toHaveBeenCalledWith('Updated 2');
      expect(mockEncryptContent).toHaveBeenCalledWith('Updated 3');
      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE gratitude_entries'),
        expect.arrayContaining([
          'encrypted_Updated 1',
          'encrypted_Updated 2',
          'encrypted_Updated 3',
          expect.any(String),
          'pending',
          'gratitude-1',
          testUserId,
        ]),
      );
      expect(mockAddToSyncQueue).toHaveBeenCalledWith(
        db,
        'gratitude_entries',
        'gratitude-1',
        'update',
      );
    });

    it('updates only metadata fields when items are not provided', async () => {
      const db = getDb();
      const { result } = renderHook(() => useUpdateGratitudeEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateEntry('gratitude-1', {
          entry_date: '2026-03-23',
        });
      });

      expect(mockEncryptContent).not.toHaveBeenCalled();
      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('entry_date = ?'),
        expect.arrayContaining(['2026-03-23', expect.any(String), 'pending', 'gratitude-1']),
      );
      expect(db.runAsync.mock.invocationCallOrder[0]).toBeLessThan(
        mockAddToSyncQueue.mock.invocationCallOrder[0],
      );
    });

    it('rolls back optimistic updates when the mutation fails', async () => {
      const seedEntries: GratitudeEntry[] = [
        {
          id: 'gratitude-1',
          user_id: testUserId,
          entry_date: '2026-03-21',
          items: ['Old 1', 'Old 2', 'Old 3'],
          created_at: '2026-03-21T09:00:00Z',
          updated_at: '2026-03-21T09:00:00Z',
          sync_status: 'synced',
          supabase_id: 'sb-1',
        },
      ];

      queryClient.setQueryData(gratitudeEntryKeys.byUser(testUserId), seedEntries);
      getDb().runAsync.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useUpdateGratitudeEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await expectRollbackRejection(
        () =>
          result.current.updateEntry('gratitude-1', {
            entry_date: '2026-03-24',
          }),
        'Update failed',
      );

      const cachedData = queryClient.getQueryData<GratitudeEntry[]>(
        gratitudeEntryKeys.byUser(testUserId),
      );
      expect(cachedData).toEqual(seedEntries);
    });
  });

  describe('useDeleteGratitudeEntry', () => {
    it('queues the delete before removing the row', async () => {
      const db = getDb();
      const { result } = renderHook(() => useDeleteGratitudeEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.deleteEntry('gratitude-1');
      });

      expect(mockAddDeleteToSyncQueue).toHaveBeenCalledWith(
        db,
        'gratitude_entries',
        'gratitude-1',
        testUserId,
      );
      expect(mockAddDeleteToSyncQueue.mock.invocationCallOrder[0]).toBeLessThan(
        db.runAsync.mock.invocationCallOrder[0],
      );
      expect(db.runAsync).toHaveBeenCalledWith(
        'DELETE FROM gratitude_entries WHERE id = ? AND user_id = ?',
        ['gratitude-1', testUserId],
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Gratitude entry deleted', {
        id: 'gratitude-1',
      });
    });

    it('removes the item optimistically and rolls back on error', async () => {
      const seedEntries: GratitudeEntry[] = [
        {
          id: 'gratitude-1',
          user_id: testUserId,
          entry_date: '2026-03-21',
          items: ['Old 1', 'Old 2', 'Old 3'],
          created_at: '2026-03-21T09:00:00Z',
          updated_at: '2026-03-21T09:00:00Z',
          sync_status: 'synced',
          supabase_id: 'sb-1',
        },
      ];

      queryClient.setQueryData(gratitudeEntryKeys.byUser(testUserId), seedEntries);
      getDb().runAsync.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useDeleteGratitudeEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await expectRollbackRejection(() => result.current.deleteEntry('gratitude-1'), 'Delete failed');

      const cachedData = queryClient.getQueryData<GratitudeEntry[]>(
        gratitudeEntryKeys.byUser(testUserId),
      );
      expect(cachedData).toEqual(seedEntries);
    });

    it('rejects when the database is not initialized', async () => {
      mockDbInstance = null;

      const { result } = renderHook(() => useDeleteGratitudeEntry(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await expect(result.current.deleteEntry('gratitude-1')).rejects.toThrow(
          'Database not initialized',
        );
      });
    });
  });

  describe('gratitudeEntryKeys', () => {
    it('builds hierarchical query keys', () => {
      expect(gratitudeEntryKeys.all).toEqual(['gratitude_entries']);
      expect(gratitudeEntryKeys.byUser('user-123')).toEqual([
        'gratitude_entries',
        'user-123',
      ]);
      expect(gratitudeEntryKeys.byId('user-123', 'gratitude-1')).toEqual([
        'gratitude_entries',
        'user-123',
        'gratitude-1',
      ]);
    });
  });
});

function createMockDb(): MockDatabase {
  return {
    getDatabaseName: jest.fn().mockReturnValue('test.db'),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    runAsync: jest.fn(),
    execAsync: jest.fn(),
    withTransactionAsync: jest.fn(),
  };
}

function getDb(): MockDatabase {
  if (!mockDbInstance) {
    throw new Error('Mock database not available');
  }

  return mockDbInstance;
}
