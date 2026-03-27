import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockEncryptContent = jest.fn();
const mockDecryptContent = jest.fn();
const mockAddToSyncQueue = jest.fn();

type DbRow = Record<string, unknown>;
interface MockDb {
  getDatabaseName: jest.Mock<string, []>;
  getFirstAsync: jest.Mock<Promise<DbRow | null>, [string, readonly unknown[]]>;
  getAllAsync: jest.Mock<Promise<readonly DbRow[]>, [string, readonly unknown[]]>;
  runAsync: jest.Mock<Promise<unknown>, [string, readonly unknown[]]>;
  execAsync: jest.Mock<Promise<void>, [string]>;
  withTransactionAsync: jest.Mock<Promise<unknown>, [(fn: () => Promise<unknown>) => Promise<unknown>]>;
}

let mockDbIsReady = true;
let mockDbInstance: MockDb = createDb();

function createDb(): MockDb {
  return {
    getDatabaseName: jest.fn().mockReturnValue('test.db'),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    runAsync: jest.fn(),
    execAsync: jest.fn(),
    withTransactionAsync: jest.fn(),
  };
}

jest.mock('../../../../../../apps/mobile/src/contexts/DatabaseContext', () => ({
  useDatabase: () => ({ db: mockDbInstance, isReady: mockDbIsReady }),
}));
jest.mock('../../../../../../apps/mobile/src/utils/encryption', () => ({
  encryptContent: (content: string) => mockEncryptContent(content),
  decryptContent: (content: string) => mockDecryptContent(content),
}));
jest.mock('../../../../../../apps/mobile/src/services/syncService', () => ({
  addToSyncQueue: (...args: unknown[]) => mockAddToSyncQueue(...args),
}));
jest.mock('../../../../../../apps/mobile/src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { logger as mockLogger } from '../../../../../../apps/mobile/src/utils/logger';
import { safetyPlanKeys, useSafetyPlan, useUpdateSafetyPlan } from '../useSafetyPlan';

describe('useSafetyPlan', () => {
  const userId = 'user-123';
  let queryClient: QueryClient;

  const wrapper = () => ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbIsReady = true;
    mockDbInstance = createDb();
    mockDbInstance.getAllAsync.mockResolvedValue([]);
    mockDbInstance.getFirstAsync.mockResolvedValue(null);
    mockDbInstance.runAsync.mockResolvedValue({ changes: 1 });
    mockEncryptContent.mockImplementation((value: string) => Promise.resolve(`encrypted_${value}`));
    mockDecryptContent.mockImplementation((value: string) => Promise.resolve(value.replace('encrypted_', '')));
    mockAddToSyncQueue.mockResolvedValue(undefined);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });
  });

  afterEach(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
  });

  it('returns null when no safety plan exists', async () => {
    const { result } = renderHook(() => useSafetyPlan(userId), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plan).toBeNull();
  });

  it('decrypts the first valid safety plan and skips a corrupt row', async () => {
    mockDbInstance.getAllAsync.mockResolvedValue([
      {
        id: 'bad',
        user_id: userId,
        encrypted_warning_signs: 'encrypted_not-json',
        encrypted_coping_strategies: null,
        encrypted_reasons_to_live: null,
        encrypted_emergency_contacts: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
        sync_status: 'pending',
        supabase_id: null,
      },
      {
        id: 'good',
        user_id: userId,
        encrypted_warning_signs: 'encrypted_["alarm"]',
        encrypted_coping_strategies: 'encrypted_["call sponsor"]',
        encrypted_reasons_to_live: 'encrypted_["family"]',
        encrypted_emergency_contacts: 'encrypted_[{"name":"Sam","phone":"555"}]',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z',
        sync_status: 'pending',
        supabase_id: 'sb-1',
      },
    ]);

    const { result } = renderHook(() => useSafetyPlan(userId), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.plan).toMatchObject({
      id: 'good',
      warning_signs: ['alarm'],
      coping_strategies: ['call sponsor'],
      reasons_to_live: ['family'],
      emergency_contacts: [{ name: 'Sam', phone: '555' }],
    });
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to decrypt safety plan', {
      userId,
      planId: 'bad',
    });
  });

  it('encrypts fields, updates the row, and queues sync after update', async () => {
    queryClient.setQueryData(safetyPlanKeys.byUser(userId), {
      id: 'plan-1',
      user_id: userId,
      warning_signs: ['old'],
      coping_strategies: ['old'],
      reasons_to_live: ['old'],
      emergency_contacts: [{ name: 'Old' }],
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      sync_status: 'synced',
      supabase_id: 'sb-1',
    });
    mockDbInstance.getFirstAsync.mockResolvedValue({ id: 'plan-1' });

    const { result } = renderHook(() => useUpdateSafetyPlan(userId), { wrapper: wrapper() });

    await act(async () => {
      await result.current.updateSafetyPlan({
        warning_signs: ['panic'],
        emergency_contacts: [{ name: 'Sam', phone: '555' }],
      });
    });

    expect(mockEncryptContent).toHaveBeenCalledWith('["panic"]');
    expect(mockEncryptContent).toHaveBeenCalledWith('[{"name":"Sam","phone":"555"}]');
    expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE safety_plans SET'),
      expect.arrayContaining(['encrypted_["panic"]', 'encrypted_[{"name":"Sam","phone":"555"}]']),
    );
    expect(mockAddToSyncQueue).toHaveBeenCalledWith(mockDbInstance, 'safety_plans', 'plan-1', 'update');
    expect(mockDbInstance.runAsync.mock.invocationCallOrder[0]).toBeLessThan(
      mockAddToSyncQueue.mock.invocationCallOrder[0],
    );
  });

  it('only encrypts provided fields on partial update', async () => {
    mockDbInstance.getFirstAsync.mockResolvedValue({ id: 'plan-1' });
    const { result } = renderHook(() => useUpdateSafetyPlan(userId), { wrapper: wrapper() });

    await act(async () => {
      await result.current.updateSafetyPlan({ reasons_to_live: ['my kids'] });
    });

    expect(mockEncryptContent).toHaveBeenCalledTimes(1);
    expect(mockEncryptContent).toHaveBeenCalledWith('["my kids"]');
    expect(String(mockDbInstance.runAsync.mock.calls[0][0])).toContain('encrypted_reasons_to_live = ?');
    expect(String(mockDbInstance.runAsync.mock.calls[0][0])).not.toContain('encrypted_warning_signs = ?');
    expect(String(mockDbInstance.runAsync.mock.calls[0][0])).not.toContain('encrypted_coping_strategies = ?');
  });

  it('rolls back the cached plan when update fails', async () => {
    const original = {
      id: 'plan-1',
      user_id: userId,
      warning_signs: ['old'],
      coping_strategies: ['old'],
      reasons_to_live: ['old'],
      emergency_contacts: [{ name: 'Old' }],
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      sync_status: 'synced',
      supabase_id: 'sb-1',
    };
    queryClient.setQueryData(safetyPlanKeys.byUser(userId), original);
    mockDbInstance.getFirstAsync.mockResolvedValue({ id: 'plan-1' });
    mockDbInstance.runAsync.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useUpdateSafetyPlan(userId), { wrapper: wrapper() });

    await expect(
      act(async () => {
        await result.current.updateSafetyPlan({ warning_signs: ['new'] });
      }),
    ).rejects.toThrow('Update failed');

    expect(queryClient.getQueryData(safetyPlanKeys.byUser(userId))).toMatchObject(original);
  });
});
