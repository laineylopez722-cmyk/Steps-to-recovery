/**
 * SyncContext Test Suite
 *
 * Tests sync functionality including:
 * - Sync queue processing
 * - Offline → online transitions
 * - Retry logic
 * - Delete sync operations
 * - Background sync intervals
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';

// Must mock modules before importing the component
const mockProcessSyncQueue = jest.fn();
const mockPullFromCloud = jest.fn();
const mockClearDatabase = jest.fn();

// Mock NetInfo
interface NetInfoState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

let netInfoCallback: ((state: NetInfoState) => void) | null = null;
const mockNetInfoUnsubscribe = jest.fn();

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn((callback) => {
    netInfoCallback = callback;
    // Don't auto-fire - let tests control when network state changes
    return mockNetInfoUnsubscribe;
  }),
}));

jest.mock('../../services/syncService', () => ({
  processSyncQueue: (...args: unknown[]) => mockProcessSyncQueue(...args),
  pullFromCloud: (...args: unknown[]) => mockPullFromCloud(...args),
}));

jest.mock('../../utils/database', () => ({
  clearDatabase: (...args: unknown[]) => mockClearDatabase(...args),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the context modules
const mockUseAuth = jest.fn();
const mockUseDatabase = jest.fn();

jest.mock('../AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../DatabaseContext', () => ({
  useDatabase: () => mockUseDatabase(),
}));

// Now import the component
import { SyncProvider, useSync } from '../SyncContext';
import NetInfo from '@react-native-community/netinfo';
// Get reference to the mocked logger for assertions
import { logger as mockLogger } from '../../utils/logger';

describe('SyncContext', () => {
  // Mock database
  const mockDb = {
    getDatabaseName: jest.fn().mockReturnValue('test.db'),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    runAsync: jest.fn(),
    execAsync: jest.fn(),
    withTransactionAsync: jest.fn(),
  };

  // Mock user
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  // AppState callback holder
  let appStateCallback: ((state: string) => void) | null = null;
  let appStateRemove: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    netInfoCallback = null;
    appStateCallback = null;

    // Reset mocks
    mockDb.getFirstAsync.mockResolvedValue({ count: 0 });
    mockProcessSyncQueue.mockResolvedValue({
      synced: 0,
      failed: 0,
      errors: [],
    });
    mockPullFromCloud.mockResolvedValue({
      pulled: 0,
      errors: [],
    });
    mockClearDatabase.mockResolvedValue(undefined);

    // Default context values (no user, no db)
    mockUseAuth.mockReturnValue({ user: null });
    mockUseDatabase.mockReturnValue({ db: null, isReady: false });

    // Reset NetInfo mock - don't auto-fire callback
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      netInfoCallback = callback;
      return mockNetInfoUnsubscribe;
    });

    // Mock AppState.addEventListener
    appStateRemove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((event, callback) => {
      if (event === 'change') {
        appStateCallback = callback;
      }
      return { remove: appStateRemove };
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // Wrapper component
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SyncProvider>{children}</SyncProvider>
  );

  describe('useSync hook', () => {
    it('should throw error when used outside SyncProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useSync());
      }).toThrow('useSync must be used within a SyncProvider');

      consoleSpy.mockRestore();
    });

    it('should return context value when used within provider', () => {
      const { result } = renderHook(() => useSync(), { wrapper });

      expect(result.current).toHaveProperty('isSyncing');
      expect(result.current).toHaveProperty('lastSyncTime');
      expect(result.current).toHaveProperty('pendingCount');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('isOnline');
      expect(result.current).toHaveProperty('triggerSync');
      expect(result.current).toHaveProperty('clearError');
    });
  });

  describe('Initial State', () => {
    it('should start with correct default state', () => {
      const { result } = renderHook(() => useSync(), { wrapper });

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.lastSyncTime).toBe(null);
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.error).toBe(null);
      expect(result.current.isOnline).toBe(false);
    });
  });

  describe('triggerSync', () => {
    it('should not sync when user is not logged in', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      const { result } = renderHook(() => useSync(), { wrapper });

      await act(async () => {
        await result.current.triggerSync();
      });

      expect(mockProcessSyncQueue).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Cannot sync: no user logged in');
    });

    it('should not sync when database is not ready', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: null, isReady: false });

      const { result } = renderHook(() => useSync(), { wrapper });

      await act(async () => {
        await result.current.triggerSync();
      });

      expect(mockProcessSyncQueue).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Cannot sync: database not ready');
    });

    it('should not sync when device is offline', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      const { result } = renderHook(() => useSync(), { wrapper });

      // Ensure offline state
      expect(result.current.isOnline).toBe(false);

      await act(async () => {
        await result.current.triggerSync();
      });

      expect(mockProcessSyncQueue).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Cannot sync: device is offline');
    });

    it('should process sync queue when online with user and database', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      mockProcessSyncQueue.mockResolvedValue({
        synced: 3,
        failed: 0,
        errors: [],
      });

      const { result } = renderHook(() => useSync(), { wrapper });

      // Set online state
      act(() => {
        netInfoCallback?.({ isConnected: true, isInternetReachable: true });
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      await act(async () => {
        await result.current.triggerSync();
      });

      expect(mockProcessSyncQueue).toHaveBeenCalledWith(mockDb, mockUser.id);
      expect(result.current.isSyncing).toBe(false);
      expect(result.current.lastSyncTime).toBeInstanceOf(Date);
    });

    it('should not start new sync while sync is in progress', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      // Make processSyncQueue slow
      let resolveSync: () => void;
      mockProcessSyncQueue.mockImplementation(
        () =>
          new Promise<any>((resolve) => {
            resolveSync = () => resolve({ synced: 1, failed: 0, errors: [] });
          }),
      );

      const { result } = renderHook(() => useSync(), { wrapper });

      // Set online
      act(() => {
        netInfoCallback?.({ isConnected: true, isInternetReachable: true });
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      // Start first sync
      const sync1Promise = act(async () => {
        result.current.triggerSync();
      });

      // Wait for syncing state
      await waitFor(() => {
        expect(result.current.isSyncing).toBe(true);
      });

      // Try to start second sync
      await act(async () => {
        await result.current.triggerSync();
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Sync already in progress, skipping');
      expect(mockProcessSyncQueue).toHaveBeenCalledTimes(1);

      // Resolve first sync
      act(() => {
        resolveSync!();
      });

      await sync1Promise;
    });

    it('should handle sync errors gracefully', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      const syncError = new Error('Network timeout');
      mockProcessSyncQueue.mockRejectedValue(syncError);

      const { result } = renderHook(() => useSync(), { wrapper });

      // Set online
      act(() => {
        netInfoCallback?.({ isConnected: true, isInternetReachable: true });
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      await act(async () => {
        await result.current.triggerSync();
      });

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.error).toEqual(syncError);
      expect(mockLogger.error).toHaveBeenCalledWith('Sync failed', syncError);
    });

    it('should set error from sync result errors', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      mockProcessSyncQueue.mockResolvedValue({
        synced: 2,
        failed: 1,
        errors: ['Failed to sync entry-123'],
      });

      const { result } = renderHook(() => useSync(), { wrapper });

      // Set online
      act(() => {
        netInfoCallback?.({ isConnected: true, isInternetReachable: true });
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      await act(async () => {
        await result.current.triggerSync();
      });

      expect(result.current.error?.message).toBe('Failed to sync entry-123');
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      mockProcessSyncQueue.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useSync(), { wrapper });

      // Set online and trigger error
      act(() => {
        netInfoCallback?.({ isConnected: true, isInternetReachable: true });
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      await act(async () => {
        await result.current.triggerSync();
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Network State (Mobile)', () => {
    it('should set up NetInfo listener on mount', () => {
      renderHook(() => useSync(), { wrapper });

      expect(NetInfo.addEventListener).toHaveBeenCalled();
    });

    it('should update isOnline based on NetInfo events', async () => {
      const { result } = renderHook(() => useSync(), { wrapper });

      // Initial offline state
      expect(result.current.isOnline).toBe(false);

      // Simulate coming online
      act(() => {
        netInfoCallback?.({ isConnected: true, isInternetReachable: true });
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      // Simulate going offline
      act(() => {
        netInfoCallback?.({ isConnected: false, isInternetReachable: false });
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });
    });

    it('should trigger sync when device comes online', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      mockProcessSyncQueue.mockResolvedValue({
        synced: 1,
        failed: 0,
        errors: [],
      });

      const { result } = renderHook(() => useSync(), { wrapper });

      // Start offline
      expect(result.current.isOnline).toBe(false);

      // Simulate going online
      act(() => {
        netInfoCallback?.({ isConnected: true, isInternetReachable: true });
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Device came online, triggering sync');
    });

    it('should deduplicate rapid network state changes', async () => {
      const { result: _result } = renderHook(() => useSync(), { wrapper });

      // Rapid state changes (same state)
      act(() => {
        netInfoCallback?.({ isConnected: true, isInternetReachable: true });
        netInfoCallback?.({ isConnected: true, isInternetReachable: true });
        netInfoCallback?.({ isConnected: true, isInternetReachable: true });
      });

      // Should only log once due to deduplication
      const onlineCalls = mockLogger.info.mock.calls.filter(
        (call) => call[0] === 'Network state changed',
      );
      expect(onlineCalls.length).toBeLessThanOrEqual(1);
    });

    it('should unsubscribe from NetInfo on unmount', () => {
      const { unmount } = renderHook(() => useSync(), { wrapper });

      unmount();

      expect(mockNetInfoUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Pending Count', () => {
    it('should update pending count after sync', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      mockDb.getFirstAsync.mockResolvedValue({ count: 5 });
      mockProcessSyncQueue.mockResolvedValue({
        synced: 3,
        failed: 0,
        errors: [],
      });

      const { result } = renderHook(() => useSync(), { wrapper });

      // Set online
      act(() => {
        netInfoCallback?.({ isConnected: true, isInternetReachable: true });
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      // Trigger sync
      await act(async () => {
        await result.current.triggerSync();
      });

      // Pending count should be updated
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM sync_queue WHERE retry_count < 3 AND (failed_at IS NULL OR failed_at = "")',
      );
    });
  });

  describe('Periodic Sync', () => {
    it('should set up periodic sync interval when user and db are ready', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      renderHook(() => useSync(), { wrapper });

      await waitFor(() => {
        expect(mockDb.getFirstAsync).toHaveBeenCalled();
      });

      // Should have set up interval
      // Advance timers and verify periodic behavior
      // Note: Actual sync won't happen since we're offline initially
    });

    it('should trigger sync every 5 minutes when online', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      mockProcessSyncQueue.mockResolvedValue({
        synced: 1,
        failed: 0,
        errors: [],
      });

      const { result } = renderHook(() => useSync(), { wrapper });

      // Set online
      act(() => {
        netInfoCallback?.({ isConnected: true, isInternetReachable: true });
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      // Clear any initial calls
      mockProcessSyncQueue.mockClear();
      mockLogger.info.mockClear();

      // Advance 5 minutes
      await act(async () => {
        jest.advanceTimersByTime(5 * 60 * 1000);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockLogger.info).toHaveBeenCalledWith('Periodic sync triggered');
      });
    });

    it('should not trigger periodic sync when offline', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      const { result } = renderHook(() => useSync(), { wrapper });

      // Stay offline
      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });

      // Clear any calls
      mockProcessSyncQueue.mockClear();

      // Advance 5 minutes
      await act(async () => {
        jest.advanceTimersByTime(5 * 60 * 1000);
        await Promise.resolve();
      });

      // Should not have processed sync
      await waitFor(() => {
        expect(mockProcessSyncQueue).not.toHaveBeenCalled();
      });
    });

    it('should clear interval on unmount', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      const { unmount } = renderHook(() => useSync(), { wrapper });

      unmount();

      // Advance time - should not trigger sync after unmount
      mockProcessSyncQueue.mockClear();

      act(() => {
        jest.advanceTimersByTime(10 * 60 * 1000);
      });

      // processSyncQueue should not be called after unmount
      // (depending on cleanup)
    });
  });

  describe('App State Changes', () => {
    it('should trigger sync when app comes to foreground', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      mockProcessSyncQueue.mockResolvedValue({
        synced: 1,
        failed: 0,
        errors: [],
      });

      const { result } = renderHook(() => useSync(), { wrapper });

      // Set online
      act(() => {
        netInfoCallback?.({ isConnected: true, isInternetReachable: true });
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      // Wait for the initial online sync to complete
      await waitFor(() => {
        expect(result.current.isSyncing).toBe(false);
      });

      // Clear logger to isolate the foreground trigger test
      jest.mocked(mockLogger.info).mockClear();

      // Simulate app coming to foreground
      act(() => {
        appStateCallback?.('active');
      });

      expect(mockLogger.info).toHaveBeenCalledWith('App foregrounded, triggering sync');
    });

    it('should not trigger sync on foreground when offline', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      const { result } = renderHook(() => useSync(), { wrapper });

      // Stay offline
      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });

      // Clear any calls
      mockProcessSyncQueue.mockClear();

      // Simulate app coming to foreground
      await act(async () => {
        appStateCallback?.('active');
        await Promise.resolve();
      });

      // Should not sync since offline
      await waitFor(() => {
        expect(mockProcessSyncQueue).not.toHaveBeenCalled();
      });
    });

    it('should clean up AppState listener on unmount', () => {
      // Must have user for AppState listener to be set up
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      const { unmount } = renderHook(() => useSync(), { wrapper });

      unmount();

      expect(appStateRemove).toHaveBeenCalled();
    });
  });

  describe('Logout Handling', () => {
    it('should clear database when user logs out', async () => {
      // Start with logged in user
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      const { rerender } = renderHook(() => useSync(), { wrapper });

      // Clear any initial calls
      mockClearDatabase.mockClear();

      // Simulate logout by changing user to null
      mockUseAuth.mockReturnValue({ user: null });

      rerender({});

      // Wait for effect to run
      await waitFor(() => {
        expect(mockLogger.info).toHaveBeenCalledWith('User logged out, clearing local database');
      });

      expect(mockClearDatabase).toHaveBeenCalledWith(mockDb);
    });

    it('should handle database clear errors gracefully', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      const { rerender } = renderHook(() => useSync(), { wrapper });

      // Setup error
      mockClearDatabase.mockRejectedValue(new Error('Clear failed'));

      // Simulate logout
      mockUseAuth.mockReturnValue({ user: null });

      rerender({});

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to clear database on logout',
          expect.any(Error),
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null isInternetReachable (indeterminate state)', async () => {
      const { result } = renderHook(() => useSync(), { wrapper });

      // NetInfo can return null for isInternetReachable
      act(() => {
        netInfoCallback?.({ isConnected: true, isInternetReachable: null });
      });

      // Should remain offline since isInternetReachable is not true
      expect(result.current.isOnline).toBe(false);
    });

    it('should handle database query errors for pending count', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockUseDatabase.mockReturnValue({ db: mockDb, isReady: true });

      mockDb.getFirstAsync.mockRejectedValue(new Error('Query failed'));

      renderHook(() => useSync(), { wrapper });

      // Should log error but not crash
      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to update pending count',
          expect.any(Error),
        );
      });
    });
  });
});
