/**
 * useSafetyPlan Hook Test Suite
 *
 * Tests safety plan functionality including:
 * - Fetch and decrypt the safety plan
 * - Update the plan with encryption
 * - Optimistic updates and rollback
 * - Error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockEncryptContent = jest.fn();
const mockDecryptContent = jest.fn();
const mockAddToSyncQueue = jest.fn();

interface MockDatabase {
  getDatabaseName: () => string;
  getFirstAsync: <T>(query: string, params?: readonly unknown[]) => Promise<T | null>;
  getAllAsync: <T>(query: string, params?: readonly unknown[]) => Promise<T[]>;
  runAsync: (query: string, params?: readonly unknown[]) => Promise<unknown>;
  execAsync: (query: string) => Promise<unknown>;
  withTransactionAsync: <T>(callback: () => Promise<T>) => Promise<T>;
}

let mockDbIsReady = true;
let mockDbInstance: jest.Mocked<MockDatabase> = {
  getDatabaseName: jest.fn(() => 'test.db'),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
  execAsync: jest.fn(),
  withTransactionAsync: jest.fn(),
} as jest.Mocked<MockDatabase>;

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
  addToSyncQueue: (...args: readonly unknown[]) => mockAddToSyncQueue(...args),
}));

jest.mock('../../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { useSafetyPlan, useUpdateSafetyPlan, safetyPlanKeys } from '../useSafetyPlan';
import { logger as mockLogger } from '../../../../utils/logger';

describe('useSafetyPlan', () => {
  const testUserId = 'user-123';
  let queryClient: QueryClient;

  const createWrapper = () => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbIsReady = true;
    mockDbInstance = {
      getDatabaseName: jest.fn(() => 'test.db'),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
      runAsync: jest.fn(),
      execAsync: jest.fn(),
      withTransactionAsync: jest.fn(),
    } as jest.Mocked<MockDatabase>;

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
    mockDbInstance.getFirstAsync.mockResolvedValue(null);
    mockDbInstance.getAllAsync.mockResolvedValue([]);
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

  it('should return null when no safety plan exists', async () => {
    mockDbInstance.getFirstAsync.mockResolvedValue(null);

    const { result } = renderHook(() => useSafetyPlan(testUserId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plan).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch and decrypt a safety plan', async () => {
    const row = {
      id: 'plan-1',
      user_id: testUserId,
      encrypted_warning_signs: 'encrypted_["isolating","not sleeping"]',
      encrypted_coping_strategies: 'encrypted_["call sponsor","pray"]',
      encrypted_reasons_to_live: 'encrypted_["kids","recovery"]',
      encrypted_emergency_contacts:
        'encrypted_{"sponsor":{"name":"Sam","phone":"555-0100"},"therapist":{"name":"Dr. Lee","phone":"555-0199"}}',
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-02T10:00:00Z',
      sync_status: 'synced',
      supabase_id: 'sb-1',
    };

    mockDbInstance.getFirstAsync.mockResolvedValue(row);
    mockDecryptContent
      .mockResolvedValueOnce('["isolating","not sleeping"]')
      .mockResolvedValueOnce('["call sponsor","pray"]')
      .mockResolvedValueOnce('["kids","recovery"]')
      .mockResolvedValueOnce(
        '{"sponsor":{"name":"Sam","phone":"555-0100"},"therapist":{"name":"Dr. Lee","phone":"555-0199"}}',
      );

    const { result } = renderHook(() => useSafetyPlan(testUserId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plan).toMatchObject({
      id: 'plan-1',
      user_id: testUserId,
      warning_signs: ['isolating', 'not sleeping'],
      coping_strategies: ['call sponsor', 'pray'],
      reasons_to_live: ['kids', 'recovery'],
      emergency_contacts: {
        sponsor: { name: 'Sam', phone: '555-0100' },
        therapist: { name: 'Dr. Lee', phone: '555-0199' },
      },
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-02T10:00:00Z',
      sync_status: 'synced',
      supabase_id: 'sb-1',
    });
  });

  it('should handle database errors gracefully', async () => {
    mockDbInstance.getFirstAsync.mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useSafetyPlan(testUserId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plan).toBeNull();
    expect(result.current.error).toBeTruthy();
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch safety plan', expect.any(Error));
  });

  it('should not fetch when database is not ready', async () => {
    mockDbIsReady = false;

    renderHook(() => useSafetyPlan(testUserId), {
      wrapper: createWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockDbInstance.getFirstAsync).not.toHaveBeenCalled();
  });

  it('should update a safety plan with encryption', async () => {
    mockDbInstance.getFirstAsync
      .mockResolvedValueOnce({ id: 'plan-1' })
      .mockResolvedValueOnce({
        id: 'plan-1',
        user_id: testUserId,
        encrypted_warning_signs: null,
        encrypted_coping_strategies: null,
        encrypted_reasons_to_live: null,
        encrypted_emergency_contacts: null,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        sync_status: 'synced',
        supabase_id: 'sb-1',
      });

    const { result } = renderHook(() => useUpdateSafetyPlan(testUserId), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.updatePlan({
        warning_signs: ['isolating', 'not eating'],
        coping_strategies: ['call sponsor', 'go to a meeting'],
        reasons_to_live: ['kids', 'my future'],
        emergency_contacts: {
          sponsor: { name: 'Sam', phone: '555-0100' },
        },
      });
    });

    expect(mockEncryptContent).toHaveBeenCalledWith('["isolating","not eating"]');
    expect(mockEncryptContent).toHaveBeenCalledWith('["call sponsor","go to a meeting"]');
    expect(mockEncryptContent).toHaveBeenCalledWith('["kids","my future"]');
    expect(mockEncryptContent).toHaveBeenCalledWith(
      '{"sponsor":{"name":"Sam","phone":"555-0100"}}',
    );

    expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE safety_plans'),
      expect.arrayContaining([
        'encrypted_["isolating","not eating"]',
        'encrypted_["call sponsor","go to a meeting"]',
        'encrypted_["kids","my future"]',
        'encrypted_{"sponsor":{"name":"Sam","phone":"555-0100"}}',
        expect.any(String),
        'pending',
        'plan-1',
        testUserId,
      ]),
    );

    expect(mockAddToSyncQueue).toHaveBeenCalledWith(mockDbInstance, 'safety_plans', 'plan-1', 'update');
    expect(mockLogger.info).toHaveBeenCalledWith('Safety plan updated', { id: 'plan-1' });
  });

  it('should rollback optimistic updates on error', async () => {
    const existingPlan = {
      id: 'plan-1',
      user_id: testUserId,
      warning_signs: ['old warning'],
      coping_strategies: ['old coping'],
      reasons_to_live: ['old reason'],
      emergency_contacts: { sponsor: { name: 'Old Sponsor' } },
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
      sync_status: 'synced' as const,
      supabase_id: 'sb-1',
    };

    queryClient.setQueryData(safetyPlanKeys.byUser(testUserId), existingPlan);
    mockDbInstance.getFirstAsync.mockResolvedValueOnce({ id: 'plan-1' });
    mockDbInstance.runAsync.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useUpdateSafetyPlan(testUserId), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.updatePlan({
          warning_signs: ['new warning'],
          coping_strategies: ['new coping'],
          reasons_to_live: ['new reason'],
          emergency_contacts: { sponsor: { name: 'New Sponsor' } },
        });
      }),
    ).rejects.toThrow('Update failed');

    const cachedData = queryClient.getQueryData<typeof existingPlan>(safetyPlanKeys.byUser(testUserId));
    expect(cachedData?.warning_signs).toEqual(['old warning']);
  });

  it('should handle database not initialized', async () => {
    mockDbInstance = null as unknown as jest.Mocked<MockDatabase>;
    mockDbIsReady = false;

    const { result } = renderHook(() => useUpdateSafetyPlan(testUserId), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(
        result.current.updatePlan({
          warning_signs: ['a'],
          coping_strategies: ['b'],
          reasons_to_live: ['c'],
          emergency_contacts: {},
        }),
      ).rejects.toThrow('Database not initialized');
    });
  });

  it('should invalidate queries after update', async () => {
    mockDbInstance.getFirstAsync.mockResolvedValueOnce({ id: 'plan-1' });

    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateSafetyPlan(testUserId), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.updatePlan({
        warning_signs: ['warning'],
        coping_strategies: ['coping'],
        reasons_to_live: ['reason'],
        emergency_contacts: {},
      });
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: safetyPlanKeys.byUser(testUserId),
    });
  });
});
