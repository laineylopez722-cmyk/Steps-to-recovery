/**
 * usePersonalInventory Hook Test Suite
 *
 * Tests mixed-field personal inventory functionality including:
 * - Fetch and decrypt inventory entries
 * - Create entries with optimistic updates
 * - Update entries with partial updates
 * - Delete entries with sync queue
 * - Encryption/decryption of content
 * - Error handling and rollback
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

type SyncOperation = 'insert' | 'update' | 'delete';

type MockDatabase = {
  getDatabaseName: jest.Mock<string, []>;
  getFirstAsync: jest.Mock<Promise<unknown>, unknown[]>;
  getAllAsync: jest.Mock<Promise<unknown[]>, unknown[]>;
  runAsync: jest.Mock<Promise<unknown>, unknown[]>;
  execAsync: jest.Mock<Promise<unknown>, unknown[]>;
  withTransactionAsync: jest.Mock<Promise<unknown>, unknown[]>;
};

const mockEncryptContent = jest.fn((content: string) => Promise.resolve(`encrypted_${content}`));
const mockDecryptContent = jest.fn((content: string) =>
  Promise.resolve(content.replace('encrypted_', '')),
);
const mockAddToSyncQueue = jest.fn(
  (_db: MockDatabase, _tableName: string, _recordId: string, _operation: SyncOperation) =>
    Promise.resolve(),
);
const mockAddDeleteToSyncQueue = jest.fn(
  (_db: MockDatabase, _tableName: string, _recordId: string, _userId: string) =>
    Promise.resolve(),
);
const mockGenerateId = jest.fn((prefix: string) => `${prefix}-test-id-123`);

let mockDbIsReady = true;
let mockDbInstance: MockDatabase = {
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
  useCreatePersonalInventory,
  useDeletePersonalInventory,
  usePersonalInventory,
  useUpdatePersonalInventory,
} from '../usePersonalInventory';
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
    mockDbInstance = {
      getDatabaseName: jest.fn().mockReturnValue('test.db'),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
      runAsync: jest.fn(),
      execAsync: jest.fn(),
      withTransactionAsync: jest.fn(),
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

    mockEncryptContent.mockImplementation((content: string) =>
      Promise.resolve(`encrypted_${content}`),
    );
    mockDecryptContent.mockImplementation((content: string) =>
      Promise.resolve(content.replace('encrypted_', '')),
    );
    mockAddToSyncQueue.mockResolvedValue(undefined);
    mockAddDeleteToSyncQueue.mockResolvedValue(undefined);
    mockGenerateId.mockImplementation((prefix: string) => `${prefix}-test-id-123`);
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

  describe('usePersonalInventory', () => {
    it('returns an empty array when no entries exist', async () => {
      mockDbInstance.getAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => usePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('fetches and decrypts inventory entries', async () => {
      const dbEntries = [
        {
          id: 'inv-1',
          user_id: testUserId,
          encrypted_person_name: 'encrypted_Person One',
          encrypted_resentment: 'encrypted_Resentment text',
          encrypted_my_part: 'encrypted_My part text',
          encrypted_impact: 'encrypted_Impact text',
          category: 'resentment',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced',
          supabase_id: 'sb-1',
        },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(dbEntries);
      mockDecryptContent
        .mockResolvedValueOnce('Person One')
        .mockResolvedValueOnce('Resentment text')
        .mockResolvedValueOnce('My part text')
        .mockResolvedValueOnce('Impact text');

      const { result } = renderHook(() => usePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0]).toMatchObject({
        id: 'inv-1',
        person_name: 'Person One',
        resentment: 'Resentment text',
        my_part: 'My part text',
        impact: 'Impact text',
        category: 'resentment',
      });
    });

    it('handles entries without optional encrypted fields', async () => {
      const dbEntries = [
        {
          id: 'inv-2',
          user_id: testUserId,
          encrypted_person_name: null,
          encrypted_resentment: 'encrypted_Only resentment',
          encrypted_my_part: null,
          encrypted_impact: null,
          category: 'fear',
          created_at: '2025-01-02T10:00:00Z',
          updated_at: '2025-01-02T10:00:00Z',
          sync_status: 'pending',
          supabase_id: null,
        },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(dbEntries);
      mockDecryptContent.mockResolvedValueOnce('Only resentment');

      const { result } = renderHook(() => usePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries[0]).toMatchObject({
        id: 'inv-2',
        person_name: null,
        resentment: 'Only resentment',
        my_part: null,
        impact: null,
        category: 'fear',
      });
    });

    it('queries by user_id and orders by created_at desc', async () => {
      mockDbInstance.getAllAsync.mockResolvedValue([]);

      renderHook(() => usePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockDbInstance.getAllAsync).toHaveBeenCalledWith(
          expect.stringContaining('WHERE user_id = ?'),
          [testUserId],
        );
      });

      expect(mockDbInstance.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        [testUserId],
      );
    });

    it('handles database errors gracefully', async () => {
      mockDbInstance.getAllAsync.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => usePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch personal inventory',
        expect.any(Error),
      );
    });

    it('filters out entries that fail to decrypt', async () => {
      mockDbInstance.getAllAsync.mockResolvedValue([
        {
          id: 'inv-1',
          user_id: testUserId,
          encrypted_person_name: 'encrypted_Person',
          encrypted_resentment: 'encrypted_Resentment',
          encrypted_my_part: 'encrypted_My part',
          encrypted_impact: 'encrypted_Impact',
          category: 'sex_conduct',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced',
          supabase_id: null,
        },
      ]);
      mockDecryptContent.mockRejectedValue(new Error('Decryption failed'));

      const { result } = renderHook(() => usePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries).toHaveLength(0);
      expect(result.current.error).toBeNull();
    });

    it('provides refetch', async () => {
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

    it('does not fetch when database is not ready', async () => {
      mockDbIsReady = false;

      renderHook(() => usePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockDbInstance.getAllAsync).not.toHaveBeenCalled();
      mockDbIsReady = true;
    });
  });

  describe('useCreatePersonalInventory', () => {
    it('creates an inventory entry with encryption', async () => {
      const { result } = renderHook(() => useCreatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createInventory({
          person_name: 'John',
          resentment: 'Anger and fear',
          my_part: 'My expectations',
          impact: 'Damage to relationships',
          category: 'resentment',
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('John');
      expect(mockEncryptContent).toHaveBeenCalledWith('Anger and fear');
      expect(mockEncryptContent).toHaveBeenCalledWith('My expectations');
      expect(mockEncryptContent).toHaveBeenCalledWith('Damage to relationships');
      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO personal_inventory'),
        expect.arrayContaining([
          'inventory-test-id-123',
          testUserId,
          'encrypted_John',
          'encrypted_Anger and fear',
          'encrypted_My expectations',
          'encrypted_Damage to relationships',
          'resentment',
          expect.any(String),
          expect.any(String),
          'pending',
        ]),
      );
      expect(mockAddToSyncQueue).toHaveBeenCalledWith(
        mockDbInstance,
        'personal_inventory',
        'inventory-test-id-123',
        'insert',
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Personal inventory entry created', {
        id: 'inventory-test-id-123',
        category: 'resentment',
      });
    });

    it('stores null for omitted optional fields', async () => {
      const { result } = renderHook(() => useCreatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createInventory({
          person_name: '',
          resentment: 'Resentment',
          my_part: null,
          impact: null,
          category: 'fear',
        });
      });

      const params = mockDbInstance.runAsync.mock.calls[0][1] as unknown[];
      expect(params[2]).toBeNull();
      expect(params[4]).toBeNull();
      expect(params[5]).toBeNull();
    });

    it('supports optimistic updates', async () => {
      queryClient.setQueryData(personalInventoryKeys.byUser(testUserId), [
        {
          id: 'existing-entry',
          user_id: testUserId,
          person_name: 'Existing',
          resentment: 'Existing resentment',
          my_part: 'Existing part',
          impact: 'Existing impact',
          category: 'resentment',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced' as const,
          supabase_id: 'sb-1',
        },
      ]);

      const { result } = renderHook(() => useCreatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createInventory({
          person_name: 'New Person',
          resentment: 'New resentment',
          my_part: 'My part',
          impact: 'Impact',
          category: 'fear',
        });
      });

      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO personal_inventory'),
        expect.arrayContaining(['inventory-test-id-123', testUserId, 'encrypted_New Person']),
      );
    });

    it('rolls back optimistic updates on error', async () => {
      queryClient.setQueryData(personalInventoryKeys.byUser(testUserId), [
        {
          id: 'existing-entry',
          user_id: testUserId,
          person_name: 'Existing',
          resentment: 'Existing resentment',
          my_part: 'Existing part',
          impact: 'Existing impact',
          category: 'resentment',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced' as const,
          supabase_id: 'sb-1',
        },
      ]);
      mockDbInstance.runAsync.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useCreatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await expectLegacyRollbackRejection(
        () =>
          result.current.createInventory({
            person_name: 'New Person',
            resentment: 'New resentment',
            my_part: 'New part',
            impact: 'New impact',
            category: 'fear',
          }),
        'Database error',
      );

      const cachedData = queryClient.getQueryData<unknown[]>(
        personalInventoryKeys.byUser(testUserId),
      );
      expect(cachedData).toHaveLength(1);
      expect((cachedData?.[0] as { person_name: string }).person_name).toBe('Existing');
    });

    it('throws when database is not initialized', async () => {
      mockDbInstance = null as unknown as MockDatabase;
      mockDbIsReady = false;

      const { result } = renderHook(() => useCreatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await expect(
          result.current.createInventory({
            person_name: 'Test',
            resentment: 'Test',
            my_part: 'Test',
            impact: 'Test',
            category: 'resentment',
          }),
        ).rejects.toThrow('Database not initialized');
      });
    });

    it('invalidates the inventory query on success', async () => {
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createInventory({
          person_name: 'Test',
          resentment: 'Test',
          my_part: 'Test',
          impact: 'Test',
          category: 'sex_conduct',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: personalInventoryKeys.byUser(testUserId),
      });
    });
  });

  describe('useUpdatePersonalInventory', () => {
    it('updates an inventory entry with encryption', async () => {
      const { result } = renderHook(() => useUpdatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateInventory('inv-123', {
          person_name: 'Updated Person',
          resentment: 'Updated resentment',
          my_part: 'Updated my part',
          impact: 'Updated impact',
          category: 'fear',
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('Updated Person');
      expect(mockEncryptContent).toHaveBeenCalledWith('Updated resentment');
      expect(mockEncryptContent).toHaveBeenCalledWith('Updated my part');
      expect(mockEncryptContent).toHaveBeenCalledWith('Updated impact');
      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE personal_inventory'),
        expect.arrayContaining([
          'encrypted_Updated Person',
          'encrypted_Updated resentment',
          'encrypted_Updated my part',
          'encrypted_Updated impact',
          'fear',
          expect.any(String),
          'pending',
          'inv-123',
          testUserId,
        ]),
      );
      expect(mockAddToSyncQueue).toHaveBeenCalledWith(
        mockDbInstance,
        'personal_inventory',
        'inv-123',
        'update',
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Personal inventory entry updated', {
        id: 'inv-123',
      });
    });

    it('only updates provided fields', async () => {
      const { result } = renderHook(() => useUpdatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateInventory('inv-123', {
          resentment: 'Only resentment',
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledTimes(1);
      expect(mockEncryptContent).toHaveBeenCalledWith('Only resentment');

      const updateSql = mockDbInstance.runAsync.mock.calls[0][0] as string;
      expect(updateSql).toContain('encrypted_resentment = ?');
      expect(updateSql).not.toContain('encrypted_person_name = ?');
      expect(updateSql).not.toContain('encrypted_my_part = ?');
      expect(updateSql).not.toContain('encrypted_impact = ?');
    });

    it('supports clearing fields by setting them to null', async () => {
      const { result } = renderHook(() => useUpdatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateInventory('inv-123', {
          person_name: '',
          impact: null,
        });
      });

      const params = mockDbInstance.runAsync.mock.calls[0][1] as unknown[];
      expect(params[0]).toBeNull();
      expect(params[1]).toBeNull();
    });

    it('updates category when provided', async () => {
      const { result } = renderHook(() => useUpdatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateInventory('inv-123', {
          category: 'sex_conduct',
        });
      });

      const updateSql = mockDbInstance.runAsync.mock.calls[0][0] as string;
      expect(updateSql).toContain('category = ?');
      expect(mockDbInstance.runAsync.mock.calls[0][1]).toContain('sex_conduct');
    });

    it('supports optimistic updates', async () => {
      queryClient.setQueryData(personalInventoryKeys.byUser(testUserId), [
        {
          id: 'inv-123',
          user_id: testUserId,
          person_name: 'Original',
          resentment: 'Original resentment',
          my_part: 'Original part',
          impact: 'Original impact',
          category: 'resentment',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced' as const,
          supabase_id: 'sb-1',
        },
      ]);

      const { result } = renderHook(() => useUpdatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateInventory('inv-123', {
          person_name: 'Updated',
        });
      });

      const cachedData = queryClient.getQueryData<unknown[]>(
        personalInventoryKeys.byUser(testUserId),
      );
      expect((cachedData?.[0] as { person_name: string }).person_name).toBe('Updated');
    });

    it('rolls back on error', async () => {
      queryClient.setQueryData(personalInventoryKeys.byUser(testUserId), [
        {
          id: 'inv-123',
          user_id: testUserId,
          person_name: 'Original',
          resentment: 'Original resentment',
          my_part: 'Original part',
          impact: 'Original impact',
          category: 'resentment',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced' as const,
          supabase_id: 'sb-1',
        },
      ]);
      mockDbInstance.runAsync.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useUpdatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await expectLegacyRollbackRejection(
        () =>
          result.current.updateInventory('inv-123', {
            person_name: 'Updated',
          }),
        'Update failed',
      );

      const cachedData = queryClient.getQueryData<unknown[]>(
        personalInventoryKeys.byUser(testUserId),
      );
      expect((cachedData?.[0] as { person_name: string }).person_name).toBe('Original');
    });

    it('requires user_id in WHERE clause', async () => {
      const { result } = renderHook(() => useUpdatePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateInventory('inv-123', {
          impact: 'Updated impact',
        });
      });

      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ? AND user_id = ?'),
        expect.arrayContaining(['inv-123', testUserId]),
      );
    });
  });

  describe('useDeletePersonalInventory', () => {
    it('deletes an inventory entry', async () => {
      const { result } = renderHook(() => useDeletePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.deleteInventory('inv-123');
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
      expect(mockLogger.info).toHaveBeenCalledWith('Personal inventory entry deleted', {
        id: 'inv-123',
      });
    });

    it('handles optimistic removal', async () => {
      queryClient.setQueryData(personalInventoryKeys.byUser(testUserId), [
        {
          id: 'inv-123',
          user_id: testUserId,
          person_name: 'Original',
          resentment: 'Original resentment',
          my_part: 'Original part',
          impact: 'Original impact',
          category: 'resentment',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced' as const,
          supabase_id: 'sb-1',
        },
        {
          id: 'inv-456',
          user_id: testUserId,
          person_name: 'Other',
          resentment: 'Other resentment',
          my_part: 'Other part',
          impact: 'Other impact',
          category: 'fear',
          created_at: '2025-01-02T10:00:00Z',
          updated_at: '2025-01-02T10:00:00Z',
          sync_status: 'synced' as const,
          supabase_id: null,
        },
      ]);

      const { result } = renderHook(() => useDeletePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.deleteInventory('inv-123');
      });

      const cachedData = queryClient.getQueryData<unknown[]>(
        personalInventoryKeys.byUser(testUserId),
      );
      expect(cachedData).toHaveLength(1);
      expect((cachedData?.[0] as { id: string }).id).toBe('inv-456');
    });

    it('rolls back on delete error', async () => {
      queryClient.setQueryData(personalInventoryKeys.byUser(testUserId), [
        {
          id: 'inv-123',
          user_id: testUserId,
          person_name: 'Original',
          resentment: 'Original resentment',
          my_part: 'Original part',
          impact: 'Original impact',
          category: 'resentment',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced' as const,
          supabase_id: 'sb-1',
        },
      ]);
      mockDbInstance.runAsync.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useDeletePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await expectLegacyRollbackRejection(
        () => result.current.deleteInventory('inv-123'),
        'Delete failed',
      );

      const cachedData = queryClient.getQueryData<unknown[]>(
        personalInventoryKeys.byUser(testUserId),
      );
      expect(cachedData).toHaveLength(1);
    });

    it('throws when database is not initialized', async () => {
      mockDbInstance = null as unknown as MockDatabase;
      mockDbIsReady = false;

      const { result } = renderHook(() => useDeletePersonalInventory(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await expect(result.current.deleteInventory('inv-123')).rejects.toThrow(
          'Database not initialized',
        );
      });
    });
  });

  describe('personalInventoryKeys', () => {
    it('generates consistent keys', () => {
      expect(personalInventoryKeys.all).toEqual(['personal_inventory']);
      expect(personalInventoryKeys.byUser('user-123')).toEqual([
        'personal_inventory',
        'user-123',
      ]);
      expect(personalInventoryKeys.byId('user-123', 'inv-1')).toEqual([
        'personal_inventory',
        'user-123',
        'inv-1',
      ]);
      expect(personalInventoryKeys.byCategory('user-123', 'fear')).toEqual([
        'personal_inventory',
        'user-123',
        'fear',
      ]);
    });
  });
});


