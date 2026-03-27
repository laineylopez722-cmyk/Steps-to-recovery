import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

interface PersonalInventoryRow {
  id: string;
  user_id: string;
  encrypted_person_name: string | null;
  encrypted_resentment: string | null;
  encrypted_my_part: string | null;
  encrypted_impact: string | null;
  category: 'resentment' | 'fear' | 'sex_conduct';
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced' | 'error';
  supabase_id: string | null;
}

interface MockDatabase {
  getDatabaseName: jest.Mock<string, []>;
  getFirstAsync: jest.Mock<unknown, unknown[]>;
  getAllAsync: jest.Mock<unknown, unknown[]>;
  runAsync: jest.Mock<unknown, unknown[]>;
  execAsync: jest.Mock<unknown, unknown[]>;
  withTransactionAsync: jest.Mock<unknown, unknown[]>;
}

const mockEncryptContent = jest.fn();
const mockDecryptContent = jest.fn();
const mockAddToSyncQueue = jest.fn();
const mockAddDeleteToSyncQueue = jest.fn();
const mockGenerateId = jest.fn();

let mockDbIsReady = true;
let mockDbInstance: MockDatabase = createMockDb();

function createMockDb(): MockDatabase {
  return {
    getDatabaseName: jest.fn(() => 'test.db') as jest.Mock<string, []>,
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    runAsync: jest.fn(),
    execAsync: jest.fn(),
    withTransactionAsync: jest.fn(),
  };
}

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
  addToSyncQueue: (...args: unknown[]) => mockAddToSyncQueue(...args),
  addDeleteToSyncQueue: (...args: unknown[]) => mockAddDeleteToSyncQueue(...args),
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
  personalInventoryKeys,
  type PersonalInventoryCreateInput,
  type PersonalInventoryEntry,
  useCreatePersonalInventory,
  useDeletePersonalInventory,
  usePersonalInventory,
  useUpdatePersonalInventory,
} from './usePersonalInventory';
import { logger as mockLogger } from '../../../../utils/logger';

describe('usePersonalInventory', () => {
  const testUserId = 'user-123';
  let queryClient: QueryClient;

  const createWrapper = () => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  };

  const expectLegacyRollbackRejection = async (
    operation: () => Promise<unknown>,
    expectedMessage: string,
  ): Promise<void> => {
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

    mockEncryptContent.mockImplementation((content: string) =>
      Promise.resolve(`encrypted_${content}`),
    );
    mockDecryptContent.mockImplementation((content: string) => {
      if (content === null || content === undefined) {
        return Promise.resolve('');
      }

      return Promise.resolve(content.replace('encrypted_', ''));
    });
    mockAddToSyncQueue.mockResolvedValue(undefined);
    mockAddDeleteToSyncQueue.mockResolvedValue(undefined);
    mockGenerateId.mockReturnValue('inventory-test-id-123');
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
  });

  describe('usePersonalInventory', () => {
    it('returns an empty array when no inventory entries exist', async () => {
      const { result } = renderHook(() => usePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('fetches and decrypts inventory entries', async () => {
      const rows: PersonalInventoryRow[] = [
        {
          id: 'inv-1',
          user_id: testUserId,
          encrypted_person_name: 'encrypted_John',
          encrypted_resentment: 'encrypted_resentful about work',
          encrypted_my_part: 'encrypted_I reacted badly',
          encrypted_impact: 'encrypted_It affected my focus',
          category: 'resentment',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced',
          supabase_id: 'sb-1',
        },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(rows);
      mockDecryptContent
        .mockResolvedValueOnce('John')
        .mockResolvedValueOnce('resentful about work')
        .mockResolvedValueOnce('I reacted badly')
        .mockResolvedValueOnce('It affected my focus');

      const { result } = renderHook(() => usePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0]).toMatchObject({
        id: 'inv-1',
        user_id: testUserId,
        person_name: 'John',
        resentment: 'resentful about work',
        my_part: 'I reacted badly',
        impact: 'It affected my focus',
        category: 'resentment',
        sync_status: 'synced',
        supabase_id: 'sb-1',
      });
      expect(mockDecryptContent).toHaveBeenCalledTimes(4);
    });

    it('skips an entry when decryption fails for one row', async () => {
      const rows: PersonalInventoryRow[] = [
        {
          id: 'inv-bad',
          user_id: testUserId,
          encrypted_person_name: 'encrypted_Bad',
          encrypted_resentment: 'encrypted_Row',
          encrypted_my_part: 'encrypted_Will fail',
          encrypted_impact: 'encrypted_Still fail',
          category: 'fear',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced',
          supabase_id: null,
        },
        {
          id: 'inv-good',
          user_id: testUserId,
          encrypted_person_name: 'encrypted_Safe',
          encrypted_resentment: 'encrypted_Clear',
          encrypted_my_part: 'encrypted_Accountable',
          encrypted_impact: 'encrypted_Sober',
          category: 'sex_conduct',
          created_at: '2025-01-02T10:00:00Z',
          updated_at: '2025-01-02T10:00:00Z',
          sync_status: 'pending',
          supabase_id: null,
        },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(rows);
      mockDecryptContent
        .mockRejectedValueOnce(new Error('Decryption failed'))
        .mockResolvedValueOnce('Safe')
        .mockResolvedValueOnce('Clear')
        .mockResolvedValueOnce('Accountable')
        .mockResolvedValueOnce('Sober');

      const { result } = renderHook(() => usePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0].id).toBe('inv-good');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to decrypt personal inventory entry', {
        entryId: 'inv-bad',
      });
    });

    it('does not fetch while the database is not ready', async () => {
      mockDbIsReady = false;

      renderHook(() => usePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockDbInstance.getAllAsync).not.toHaveBeenCalled();
    });

    it('provides refetch support', async () => {
      mockDbInstance.getAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => usePersonalInventory(testUserId), {
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

  describe('useCreatePersonalInventory', () => {
    it('encrypts sensitive fields before insert and queues sync after insert', async () => {
      const { result } = renderHook(() => useCreatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      const input: PersonalInventoryCreateInput = {
        person_name: 'John',
        resentment: 'He interrupted me',
        my_part: 'I stayed silent',
        impact: 'I felt angry',
        category: 'resentment',
      };

      await act(async () => {
        await result.current.createEntry(input);
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('John');
      expect(mockEncryptContent).toHaveBeenCalledWith('He interrupted me');
      expect(mockEncryptContent).toHaveBeenCalledWith('I stayed silent');
      expect(mockEncryptContent).toHaveBeenCalledWith('I felt angry');
      expect(mockEncryptContent).not.toHaveBeenCalledWith('resentment');

      const insertCall = mockDbInstance.runAsync.mock.calls[0];
      const params = insertCall[1] as unknown[];
      expect(params[0]).toBe('inventory-test-id-123');
      expect(params[1]).toBe(testUserId);
      expect(params[6]).toBe('resentment');
      expect(params[9]).toBe('pending');

      expect(mockAddToSyncQueue).toHaveBeenCalledWith(
        mockDbInstance,
        'personal_inventory',
        'inventory-test-id-123',
        'insert',
      );

      expect(mockLogger.info).toHaveBeenCalledWith('Personal inventory entry created', {
        id: 'inventory-test-id-123',
      });

      expect(mockEncryptContent.mock.invocationCallOrder[0]).toBeLessThan(
        mockDbInstance.runAsync.mock.invocationCallOrder[0],
      );
    });

    it('rolls back optimistic create on error', async () => {
      const existingEntry: PersonalInventoryEntry = {
        id: 'existing-entry',
        user_id: testUserId,
        person_name: 'Existing',
        resentment: 'Existing resentment',
        my_part: 'Existing part',
        impact: 'Existing impact',
        category: 'fear',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        sync_status: 'synced',
        supabase_id: 'sb-1',
      };

      queryClient.setQueryData(personalInventoryKeys.byUser(testUserId), [existingEntry]);
      mockDbInstance.runAsync.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useCreatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await expectLegacyRollbackRejection(
        () =>
          result.current.createEntry({
            person_name: 'New Person',
            resentment: 'New resentment',
            my_part: 'New part',
            impact: 'New impact',
            category: 'fear',
          }),
        'Database error',
      );

      const cachedData = queryClient.getQueryData<PersonalInventoryEntry[]>(
        personalInventoryKeys.byUser(testUserId),
      );
      expect(cachedData).toHaveLength(1);
      expect(cachedData?.[0].id).toBe('existing-entry');
    });
  });

  describe('useUpdatePersonalInventory', () => {
    it('updates only supplied fields and keeps category plaintext', async () => {
      const { result } = renderHook(() => useUpdatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateEntry('inv-123', {
          person_name: 'Jane',
          category: 'fear',
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('Jane');
      expect(mockEncryptContent).not.toHaveBeenCalledWith('fear');

      const updateCall = mockDbInstance.runAsync.mock.calls[0];
      const sql = updateCall[0] as string;
      const params = updateCall[1] as unknown[];

      expect(sql).toContain('encrypted_person_name = ?');
      expect(sql).toContain('category = ?');
      expect(sql).toContain('WHERE id = ? AND user_id = ?');
      expect(params).toContain('fear');
      expect(params).toContain('pending');

      expect(mockAddToSyncQueue).toHaveBeenCalledWith(
        mockDbInstance,
        'personal_inventory',
        'inv-123',
        'update',
      );
    });

    it('rolls back optimistic update on error', async () => {
      const existingEntry: PersonalInventoryEntry = {
        id: 'inv-123',
        user_id: testUserId,
        person_name: 'Original',
        resentment: 'Original resentment',
        my_part: 'Original part',
        impact: 'Original impact',
        category: 'resentment',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        sync_status: 'synced',
        supabase_id: 'sb-1',
      };

      queryClient.setQueryData(personalInventoryKeys.byUser(testUserId), [existingEntry]);
      mockDbInstance.runAsync.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useUpdatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await expectLegacyRollbackRejection(
        () =>
          result.current.updateEntry('inv-123', {
            resentment: 'Changed resentment',
          }),
        'Update failed',
      );

      const cachedData = queryClient.getQueryData<PersonalInventoryEntry[]>(
        personalInventoryKeys.byUser(testUserId),
      );
      expect(cachedData?.[0].resentment).toBe('Original resentment');
    });
  });

  describe('useDeletePersonalInventory', () => {
    it('queues the delete before removing the row from SQLite', async () => {
      const { result } = renderHook(() => useDeletePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.deleteEntry('inv-123');
      });

      expect(mockAddDeleteToSyncQueue).toHaveBeenCalledWith(
        mockDbInstance,
        'personal_inventory',
        'inv-123',
        testUserId,
      );

      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        'DELETE FROM personal_inventory WHERE id = ? AND user_id = ?',
        ['inv-123', testUserId],
      );

      expect(mockAddDeleteToSyncQueue.mock.invocationCallOrder[0]).toBeLessThan(
        mockDbInstance.runAsync.mock.invocationCallOrder[0],
      );
    });

    it('rolls back optimistic delete on error', async () => {
      const existingEntry: PersonalInventoryEntry = {
        id: 'inv-123',
        user_id: testUserId,
        person_name: 'Original',
        resentment: 'Original resentment',
        my_part: 'Original part',
        impact: 'Original impact',
        category: 'sex_conduct',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        sync_status: 'synced',
        supabase_id: 'sb-1',
      };

      queryClient.setQueryData(personalInventoryKeys.byUser(testUserId), [existingEntry]);
      mockDbInstance.runAsync.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useDeletePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await expectLegacyRollbackRejection(() => result.current.deleteEntry('inv-123'), 'Delete failed');

      const cachedData = queryClient.getQueryData<PersonalInventoryEntry[]>(
        personalInventoryKeys.byUser(testUserId),
      );
      expect(cachedData).toHaveLength(1);
      expect(cachedData?.[0].id).toBe('inv-123');
    });
  });

  describe('personalInventoryKeys', () => {
    it('creates hierarchical query keys', () => {
      expect(personalInventoryKeys.all).toEqual(['personal_inventory']);
      expect(personalInventoryKeys.byUser('user-123')).toEqual(['personal_inventory', 'user-123']);
      expect(personalInventoryKeys.byId('user-123', 'inv-123')).toEqual([
        'personal_inventory',
        'user-123',
        'inv-123',
      ]);
    });
  });
});
