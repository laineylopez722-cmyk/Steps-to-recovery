/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// Factory mocks must be defined BEFORE imports
const mockIsTaskRegisteredAsync = jest.fn();
const mockDefineTask = jest.fn();

const mockRegisterTaskAsync = jest.fn();
const mockUnregisterTaskAsync = jest.fn();
const mockGetStatusAsync = jest.fn();

// Background fetch status enum values
const BG_FETCH_STATUS = {
  Available: 3,
  Restricted: 1,
  Denied: 2,
};

const BG_FETCH_RESULT = {
  NoData: 1,
  NewData: 2,
  Failed: 3,
};

jest.mock('expo-task-manager', () => ({
  isTaskRegisteredAsync: (...args: unknown[]) => mockIsTaskRegisteredAsync(...args),
  defineTask: jest.fn(),
}));

jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: (...args: unknown[]) => mockRegisterTaskAsync(...args),
  unregisterTaskAsync: (...args: unknown[]) => mockUnregisterTaskAsync(...args),
  getStatusAsync: (...args: unknown[]) => mockGetStatusAsync(...args),
  BackgroundFetchStatus: BG_FETCH_STATUS,
  BackgroundFetchResult: BG_FETCH_RESULT,
}));

jest.mock('../../utils/logger');
jest.mock('../syncService');
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));
jest.mock('../../adapters/storage', () => ({
  createStorageAdapter: jest.fn(),
}));
jest.mock('../../utils/database', () => ({
  initDatabase: jest.fn(),
}));

import { Platform } from 'react-native';
import {
  registerBackgroundSync,
  unregisterBackgroundSync,
  isBackgroundSyncRegistered,
  getBackgroundFetchStatus,
  triggerBackgroundSync,
  setupBackgroundSync,
} from '../backgroundSync';
import { logger } from '../../utils/logger';
import { processSyncQueue } from '../syncService';

// Access mocked supabase
const { supabase } = jest.requireMock('../../lib/supabase') as {
  supabase: { auth: { getSession: jest.Mock } };
};
const { createStorageAdapter } = jest.requireMock('../../adapters/storage') as {
  createStorageAdapter: jest.Mock;
};
const { initDatabase } = jest.requireMock('../../utils/database') as {
  initDatabase: jest.Mock;
};

describe('backgroundSync', () => {
  const mockProcessSyncQueue = processSyncQueue as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: native platform
    (Platform as { OS: string }).OS = 'ios';

    mockIsTaskRegisteredAsync.mockResolvedValue(false);
    mockRegisterTaskAsync.mockResolvedValue(undefined);
    mockUnregisterTaskAsync.mockResolvedValue(undefined);
    mockGetStatusAsync.mockResolvedValue(BG_FETCH_STATUS.Available);
    mockProcessSyncQueue.mockResolvedValue({ synced: 0, failed: 0 });
  });

  // ========================================
  // registerBackgroundSync
  // ========================================

  describe('registerBackgroundSync', () => {
    it('should register background sync task on native', async () => {
      await registerBackgroundSync();

      expect(mockIsTaskRegisteredAsync).toHaveBeenCalledWith('background-sync-task');
      expect(mockRegisterTaskAsync).toHaveBeenCalledWith('background-sync-task', {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      expect(logger.info).toHaveBeenCalledWith('Background sync registered successfully');
    });

    it('should skip registration on web', async () => {
      (Platform as { OS: string }).OS = 'web';

      await registerBackgroundSync();

      expect(mockIsTaskRegisteredAsync).not.toHaveBeenCalled();
      expect(mockRegisterTaskAsync).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Background sync not supported on web');
    });

    it('should skip if already registered', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);

      await registerBackgroundSync();

      expect(mockRegisterTaskAsync).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Background sync already registered');
    });

    it('should handle registration error gracefully', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(false);
      mockRegisterTaskAsync.mockImplementation(async () => {
        throw new Error('Registration failed');
      });

      await registerBackgroundSync();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to register background sync',
        expect.any(Error),
      );
    });
  });

  // ========================================
  // unregisterBackgroundSync
  // ========================================

  describe('unregisterBackgroundSync', () => {
    it('should unregister task when registered', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);

      await unregisterBackgroundSync();

      expect(mockUnregisterTaskAsync).toHaveBeenCalledWith('background-sync-task');
      expect(logger.info).toHaveBeenCalledWith('Background sync unregistered');
    });

    it('should skip if not registered', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(false);

      await unregisterBackgroundSync();

      expect(mockUnregisterTaskAsync).not.toHaveBeenCalled();
    });

    it('should skip on web', async () => {
      (Platform as { OS: string }).OS = 'web';

      await unregisterBackgroundSync();

      expect(mockIsTaskRegisteredAsync).not.toHaveBeenCalled();
    });

    it('should handle error gracefully', async () => {
      mockIsTaskRegisteredAsync.mockImplementation(async () => {
        throw new Error('Check failed');
      });

      await unregisterBackgroundSync();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to unregister background sync',
        expect.any(Error),
      );
    });
  });

  // ========================================
  // isBackgroundSyncRegistered
  // ========================================

  describe('isBackgroundSyncRegistered', () => {
    it('should return true when task is registered', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);

      const result = await isBackgroundSyncRegistered();

      expect(result).toBe(true);
    });

    it('should return false when task is not registered', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(false);

      const result = await isBackgroundSyncRegistered();

      expect(result).toBe(false);
    });

    it('should return false on web', async () => {
      (Platform as { OS: string }).OS = 'web';

      const result = await isBackgroundSyncRegistered();

      expect(result).toBe(false);
      expect(mockIsTaskRegisteredAsync).not.toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      mockIsTaskRegisteredAsync.mockImplementation(async () => {
        throw new Error('Error');
      });

      const result = await isBackgroundSyncRegistered();

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ========================================
  // getBackgroundFetchStatus
  // ========================================

  describe('getBackgroundFetchStatus', () => {
    it('should return available status', async () => {
      mockGetStatusAsync.mockResolvedValue(BG_FETCH_STATUS.Available);

      const result = await getBackgroundFetchStatus();

      expect(result).toEqual({
        isAvailable: true,
        status: BG_FETCH_STATUS.Available,
      });
    });

    it('should return not available for restricted status', async () => {
      mockGetStatusAsync.mockResolvedValue(BG_FETCH_STATUS.Restricted);

      const result = await getBackgroundFetchStatus();

      expect(result).toEqual({
        isAvailable: false,
        status: BG_FETCH_STATUS.Restricted,
      });
    });

    it('should return not available on web', async () => {
      (Platform as { OS: string }).OS = 'web';

      const result = await getBackgroundFetchStatus();

      expect(result).toEqual({ isAvailable: false, status: null });
    });

    it('should return not available on error', async () => {
      mockGetStatusAsync.mockImplementation(async () => {
        throw new Error('Status error');
      });

      const result = await getBackgroundFetchStatus();

      expect(result).toEqual({ isAvailable: false, status: null });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ========================================
  // triggerBackgroundSync
  // ========================================

  describe('triggerBackgroundSync', () => {
    it('should return not supported on web', async () => {
      (Platform as { OS: string }).OS = 'web';

      const result = await triggerBackgroundSync();

      expect(result).toEqual({
        success: false,
        message: 'Background sync not supported on web',
      });
    });

    it('should return error if not registered', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(false);

      const result = await triggerBackgroundSync();

      expect(result).toEqual({
        success: false,
        message: 'Background sync not registered',
      });
    });

    it('should return error if no user logged in', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      const result = await triggerBackgroundSync();

      expect(result).toEqual({
        success: false,
        message: 'No user logged in',
      });
    });

    it('should return error if database not available', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });
      createStorageAdapter.mockImplementation(async () => {
        throw new Error('DB error');
      });

      const result = await triggerBackgroundSync();

      expect(result).toEqual({
        success: false,
        message: 'Database not available',
      });
    });

    it('should process sync queue and return success', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });
      const mockDb = { getFirstAsync: jest.fn(), runAsync: jest.fn() };
      createStorageAdapter.mockResolvedValue(mockDb);
      initDatabase.mockResolvedValue(undefined);
      mockProcessSyncQueue.mockResolvedValue({ synced: 3, failed: 0 });

      const result = await triggerBackgroundSync();

      expect(result).toEqual({
        success: true,
        message: 'Synced 3 items, 0 failed',
      });
      expect(mockProcessSyncQueue).toHaveBeenCalledWith(mockDb, 'user-1');
    });

    it('should return failure when sync has failed items', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });
      const mockDb = { getFirstAsync: jest.fn(), runAsync: jest.fn() };
      createStorageAdapter.mockResolvedValue(mockDb);
      initDatabase.mockResolvedValue(undefined);
      mockProcessSyncQueue.mockResolvedValue({ synced: 2, failed: 1 });

      const result = await triggerBackgroundSync();

      expect(result).toEqual({
        success: false,
        message: 'Synced 2 items, 1 failed',
      });
    });

    it('should handle sync exception', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });
      const mockDb = { getFirstAsync: jest.fn(), runAsync: jest.fn() };
      createStorageAdapter.mockResolvedValue(mockDb);
      initDatabase.mockResolvedValue(undefined);
      mockProcessSyncQueue.mockImplementation(async () => {
        throw new Error('Sync crash');
      });

      const result = await triggerBackgroundSync();

      expect(result).toEqual({
        success: false,
        message: 'Sync failed',
      });
      expect(logger.error).toHaveBeenCalledWith('Manual background sync failed', expect.any(Error));
    });
  });

  // ========================================
  // setupBackgroundSync
  // ========================================

  describe('setupBackgroundSync', () => {
    it('should skip on web', async () => {
      (Platform as { OS: string }).OS = 'web';

      await setupBackgroundSync();

      expect(mockGetStatusAsync).not.toHaveBeenCalled();
    });

    it('should register when background fetch is available', async () => {
      mockGetStatusAsync.mockResolvedValue(BG_FETCH_STATUS.Available);

      await setupBackgroundSync();

      expect(mockIsTaskRegisteredAsync).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Background sync setup completed');
    });

    it('should warn when background fetch is not available', async () => {
      mockGetStatusAsync.mockResolvedValue(BG_FETCH_STATUS.Denied);

      await setupBackgroundSync();

      expect(logger.warn).toHaveBeenCalledWith('Background fetch not available on this device');
      expect(mockIsTaskRegisteredAsync).not.toHaveBeenCalled();
    });

    it('should handle setup error gracefully', async () => {
      mockGetStatusAsync.mockImplementation(async () => {
        throw new Error('Setup error');
      });

      await setupBackgroundSync();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get background fetch status',
        expect.any(Error),
      );
    });
  });
});
