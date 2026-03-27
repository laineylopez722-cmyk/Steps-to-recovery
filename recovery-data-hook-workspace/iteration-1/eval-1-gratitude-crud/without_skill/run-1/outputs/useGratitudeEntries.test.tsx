import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockEncryptContent = jest.fn();
const mockDecryptContent = jest.fn();
const mockAddToSyncQueue = jest.fn();
const mockAddDeleteToSyncQueue = jest.fn();
const mockGenerateId = jest.fn();
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

interface MockDb {
  getAllAsync: jest.Mock;
  runAsync: jest.Mock;
}

let mockDbIsReady = true;
let mockDbInstance: MockDb | null = {
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
};

jest.mock('@/contexts/DatabaseContext', () => ({
  useDatabase: (): { db: MockDb | null; isReady: boolean } => ({
    db: mockDbInstance,
    isReady: mockDbIsReady,
  }),
}));

jest.mock('@/utils/encryption', () => ({
  encryptContent: (content: string) => mockEncryptContent(content),
  decryptContent: (content: string) => mockDecryptContent(content),
}));

jest.mock('@/services/syncService', () => ({
  addToSyncQueue: (...args: unknown[]) => mockAddToSyncQueue(...args),
  addDeleteToSyncQueue: (...args: unknown[]) => mockAddDeleteToSyncQueue(...args),
}));

jest.mock('@/utils/logger', () => ({
  logger: mockLogger,
}));

jest.mock('@/utils/id', () => ({
  generateId: (prefix: string) => mockGenerateId(prefix),
}));

import {
  gratitudeKeys,
  useCreateGratitudeEntry,
  useDeleteGratitudeEntry,
  useGratitudeEntries,
  useUpdateGratitudeEntry,
} from './useGratitudeEntries';

describe('useGratitudeEntries', () => {
  const userId = 'user-123';
  let queryClient: QueryClient;

  const createWrapper = (): React.FC<{ children: React.ReactNode }> => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbIsReady = true;
    mockDbInstance = {
      getAllAsync: jest.fn(),
      runAsync: jest.fn(),
    };
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

    mockEncryptContent.mockImplementation((content: string) => Promise.resolve(`encrypted_${content}`));
    mockDecryptContent.mockImplementation((content: string) =>
      Promise.resolve(content.replace('encrypted_', '')),
    );
    mockAddToSyncQueue.mockResolvedValue(undefined);
    mockAddDeleteToSyncQueue.mockResolvedValue(undefined);
    mockGenerateId.mockReturnValue('gratitude-test-id-123');
    mockDbInstance.getAllAsync.mockResolvedValue([]);
    mockDbInstance.runAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
  });

  afterEach(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  it('fetches and decrypts gratitude entries', async () => {
    mockDbInstance.getAllAsync.mockResolvedValue([
      {
        id: 'gratitude-1',
        user_id: userId,
        entry_date: '2026-03-22',
        encrypted_item_1: 'encrypted_Family',
        encrypted_item_2: 'encrypted_Sobriety',
        encrypted_item_3: 'encrypted_Support',
        created_at: '2026-03-22T08:00:00Z',
        updated_at: '2026-03-22T08:00:00Z',
        sync_status: 'synced',
        supabase_id: null,
      },
    ]);

    const { result } = renderHook(() => useGratitudeEntries(userId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toMatchObject({
      id: 'gratitude-1',
      user_id: userId,
      entry_date: '2026-03-22',
      items: ['Family', 'Sobriety', 'Support'],
    });
  });

  it('filters out entries that fail decryption', async () => {
    mockDbInstance.getAllAsync.mockResolvedValue([
      {
        id: 'gratitude-1',
        user_id: userId,
        entry_date: '2026-03-22',
        encrypted_item_1: 'encrypted_Family',
        encrypted_item_2: 'encrypted_Sobriety',
        encrypted_item_3: 'encrypted_Support',
        created_at: '2026-03-22T08:00:00Z',
        updated_at: '2026-03-22T08:00:00Z',
        sync_status: 'synced',
        supabase_id: null,
      },
    ]);
    mockDecryptContent.mockRejectedValueOnce(new Error('Decryption failed'));

    const { result } = renderHook(() => useGratitudeEntries(userId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.entries).toHaveLength(0);
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to decrypt gratitude entry',
      expect.objectContaining({ entryId: 'gratitude-1' }),
    );
  });

  it('does not fetch when the database is not ready', async () => {
    mockDbIsReady = false;

    renderHook(() => useGratitudeEntries(userId), {
      wrapper: createWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockDbInstance?.getAllAsync).not.toHaveBeenCalled();
  });

  it('creates an encrypted gratitude entry and queues sync', async () => {
    const { result } = renderHook(() => useCreateGratitudeEntry(userId), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.createEntry({
        entry_date: '2026-03-22',
        items: ['Family', 'Sobriety', 'Support'],
      });
    });

    expect(mockEncryptContent).toHaveBeenCalledWith('Family');
    expect(mockEncryptContent).toHaveBeenCalledWith('Sobriety');
    expect(mockEncryptContent).toHaveBeenCalledWith('Support');
    expect(mockDbInstance?.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO gratitude_entries'),
      expect.arrayContaining([
        'gratitude-test-id-123',
        userId,
        '2026-03-22',
        'encrypted_Family',
        'encrypted_Sobriety',
        'encrypted_Support',
        expect.any(String),
        expect.any(String),
        'pending',
      ]),
    );
    expect(mockAddToSyncQueue).toHaveBeenCalledWith(
      mockDbInstance,
      'gratitude_entries',
      'gratitude-test-id-123',
      'insert',
    );
    expect(mockLogger.info).toHaveBeenCalledWith('Gratitude entry created', {
      id: 'gratitude-test-id-123',
      entryDate: '2026-03-22',
    });
  });

  it('updates only the provided gratitude fields', async () => {
    const { result } = renderHook(() => useUpdateGratitudeEntry(userId), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.updateEntry('gratitude-1', {
        items: ['Health', 'Friends', 'Peace'],
      });
    });

    expect(mockEncryptContent).toHaveBeenCalledWith('Health');
    expect(mockEncryptContent).toHaveBeenCalledWith('Friends');
    expect(mockEncryptContent).toHaveBeenCalledWith('Peace');

    const runAsyncMock = mockDbInstance?.runAsync;
    if (!runAsyncMock) {
      throw new Error('Expected runAsync mock to be defined');
    }
    const sql = runAsyncMock.mock.calls[0][0] as string;
    expect(sql).toContain('UPDATE gratitude_entries');
    expect(sql).toContain('encrypted_item_1 = ?');
    expect(sql).toContain('encrypted_item_2 = ?');
    expect(sql).toContain('encrypted_item_3 = ?');
    expect(sql).toContain('WHERE id = ? AND user_id = ?');

    expect(mockAddToSyncQueue).toHaveBeenCalledWith(
      mockDbInstance,
      'gratitude_entries',
      'gratitude-1',
      'update',
    );
  });

  it('deletes entries after adding them to the sync queue', async () => {
    const { result } = renderHook(() => useDeleteGratitudeEntry(userId), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.deleteEntry('gratitude-1');
    });

    expect(mockAddDeleteToSyncQueue).toHaveBeenCalledWith(
      mockDbInstance,
      'gratitude_entries',
      'gratitude-1',
      userId,
    );
    expect(mockDbInstance?.runAsync).toHaveBeenCalledWith(
      'DELETE FROM gratitude_entries WHERE id = ? AND user_id = ?',
      ['gratitude-1', userId],
    );
    expect(mockLogger.info).toHaveBeenCalledWith('Gratitude entry deleted', {
      id: 'gratitude-1',
    });
    const runAsyncMock = mockDbInstance?.runAsync;
    if (!runAsyncMock) {
      throw new Error('Expected runAsync mock to be defined');
    }
    expect(mockAddDeleteToSyncQueue.mock.invocationCallOrder[0]).toBeLessThan(
      runAsyncMock.mock.invocationCallOrder[0],
    );
  });

  it('throws when creating without an initialized database', async () => {
    mockDbInstance = null;
    mockDbIsReady = false;

    const { result } = renderHook(() => useCreateGratitudeEntry(userId), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(
        result.current.createEntry({
          entry_date: '2026-03-22',
          items: ['Family', 'Sobriety', 'Support'],
        }),
      ).rejects.toThrow('Database not initialized');
    });
  });

  it('exposes stable gratitude query keys', () => {
    expect(gratitudeKeys.all).toEqual(['gratitude_entries']);
    expect(gratitudeKeys.byUser('user-123')).toEqual(['gratitude_entries', 'user-123']);
    expect(gratitudeKeys.byId('user-123', 'gratitude-1')).toEqual([
      'gratitude_entries',
      'user-123',
      'gratitude-1',
    ]);
  });
});
