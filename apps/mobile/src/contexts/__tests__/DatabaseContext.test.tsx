/**
 * DatabaseContext Test Suite
 *
 * Tests database initialization flow including:
 * - Platform-specific adapter creation (SQLite on mobile, IndexedDB on web)
 * - Database readiness state transitions
 * - Schema initialization via initDatabase
 * - Error handling during initialization
 * - Hook usage outside provider
 */

import React from 'react';
import { Platform } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';

// Mock dependencies BEFORE imports
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('../../adapters/storage', () => ({
  createStorageAdapter: jest.fn(),
}));

jest.mock('../../utils/database', () => ({
  initDatabase: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import mocked modules
import { openDatabaseAsync } from 'expo-sqlite';
import { createStorageAdapter } from '../../adapters/storage';
import type { StorageAdapter } from '../../adapters/storage';
import { initDatabase } from '../../utils/database';
import { DatabaseProvider, useDatabase } from '../DatabaseContext';

// Mock StorageAdapter that satisfies the interface
const mockStorageAdapter: StorageAdapter = {
  getDatabaseName: jest.fn().mockReturnValue('recovery.db'),
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  runAsync: jest.fn().mockResolvedValue(undefined),
  execAsync: jest.fn().mockResolvedValue(undefined),
  withTransactionAsync: jest.fn().mockImplementation(async (cb: () => Promise<void>) => cb()),
};

// Mock SQLite database object returned by openDatabaseAsync
const mockSqliteDb = {
  execAsync: jest.fn(),
  runAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
};

describe('DatabaseContext', () => {
  // Helper to flush the full async initialization chain
  // (dynamic import → openDatabaseAsync → createStorageAdapter → initDatabase → setState)
  const flushAsyncInit = async (): Promise<void> => {
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset Platform to iOS (mobile) for most tests
    (Platform as { OS: string }).OS = 'ios';

    // Default mock implementations
    (openDatabaseAsync as jest.Mock).mockResolvedValue(mockSqliteDb);
    (createStorageAdapter as jest.Mock).mockResolvedValue(mockStorageAdapter);
    (initDatabase as jest.Mock).mockResolvedValue(undefined);
  });

  // Wrapper component for testing hooks
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <DatabaseProvider>{children}</DatabaseProvider>
  );

  describe('useDatabase hook', () => {
    it('should return default context values when used without provider', () => {
      // useDatabase uses useContext with a default value, so it won't throw
      // It returns { db: null, isReady: false } by default
      const { result } = renderHook(() => useDatabase());

      expect(result.current.db).toBe(null);
      expect(result.current.isReady).toBe(false);
    });
  });

  describe('Mobile Database Initialization', () => {
    it('should provide db=null and isReady=false initially', () => {
      // Delay resolution so we can check initial state
      (openDatabaseAsync as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(() => useDatabase(), { wrapper });

      expect(result.current.db).toBe(null);
      expect(result.current.isReady).toBe(false);
    });

    it('should set isReady=true after successful initialization', async () => {
      const { result } = renderHook(() => useDatabase(), { wrapper });

      await flushAsyncInit();

      expect(result.current.isReady).toBe(true);
      expect(result.current.db).toBe(mockStorageAdapter);
    });

    it('should open database, create adapter, and initialize schema', async () => {
      const { result } = renderHook(() => useDatabase(), { wrapper });

      await flushAsyncInit();

      expect(result.current.isReady).toBe(true);
      expect(openDatabaseAsync).toHaveBeenCalledWith('recovery.db');
      expect(createStorageAdapter).toHaveBeenCalledWith(mockSqliteDb);
      expect(initDatabase).toHaveBeenCalledWith(mockStorageAdapter);
    });

    it('should provide StorageAdapter interface methods', async () => {
      const { result } = renderHook(() => useDatabase(), { wrapper });

      await flushAsyncInit();

      expect(result.current.isReady).toBe(true);
      const db = result.current.db;
      expect(db).not.toBeNull();
      expect(typeof db!.getAllAsync).toBe('function');
      expect(typeof db!.getFirstAsync).toBe('function');
      expect(typeof db!.runAsync).toBe('function');
      expect(typeof db!.execAsync).toBe('function');
      expect(typeof db!.withTransactionAsync).toBe('function');
      expect(typeof db!.getDatabaseName).toBe('function');
    });

    it('should handle openDatabaseAsync error gracefully', async () => {
      (openDatabaseAsync as jest.Mock).mockImplementation(async () => {
        throw new Error('Failed to open database');
      });

      const { result } = renderHook(() => useDatabase(), { wrapper });

      await flushAsyncInit();

      expect(result.current.db).toBe(null);
      expect(result.current.isReady).toBe(false);
    });

    it('should handle createStorageAdapter error gracefully', async () => {
      (createStorageAdapter as jest.Mock).mockImplementation(async () => {
        throw new Error('Adapter creation failed');
      });

      const { result } = renderHook(() => useDatabase(), { wrapper });

      await flushAsyncInit();

      expect(result.current.db).toBe(null);
      expect(result.current.isReady).toBe(false);
    });

    it('should handle initDatabase error gracefully', async () => {
      (initDatabase as jest.Mock).mockImplementation(async () => {
        throw new Error('Schema init failed');
      });

      const { result } = renderHook(() => useDatabase(), { wrapper });

      await flushAsyncInit();

      expect(result.current.db).toBe(null);
      expect(result.current.isReady).toBe(false);
    });
  });

  describe('Web Database Initialization', () => {
    beforeEach(() => {
      (Platform as { OS: string }).OS = 'web';
    });

    it('should initialize IndexedDB adapter on web platform', async () => {
      const { result } = renderHook(() => useDatabase(), { wrapper });

      await flushAsyncInit();

      expect(result.current.isReady).toBe(true);
      expect(createStorageAdapter).toHaveBeenCalledWith();
      expect(initDatabase).toHaveBeenCalledWith(mockStorageAdapter);
      expect(result.current.db).toBe(mockStorageAdapter);
    });

    it('should not call openDatabaseAsync on web platform', async () => {
      const { result } = renderHook(() => useDatabase(), { wrapper });

      await flushAsyncInit();

      expect(result.current.isReady).toBe(true);
      expect(openDatabaseAsync).not.toHaveBeenCalled();
    });

    it('should handle web initialization error gracefully', async () => {
      (createStorageAdapter as jest.Mock).mockImplementation(async () => {
        throw new Error('IndexedDB not available');
      });

      const { result } = renderHook(() => useDatabase(), { wrapper });

      await flushAsyncInit();

      expect(result.current.db).toBe(null);
      expect(result.current.isReady).toBe(false);
    });
  });

  describe('Context Value Stability', () => {
    it('should provide consistent context value reference when adapter has not changed', async () => {
      const { result, rerender } = renderHook(() => useDatabase(), { wrapper });

      await flushAsyncInit();

      expect(result.current.isReady).toBe(true);

      // Capture value after initialization
      const firstValue = result.current;

      // Re-render should provide same reference (useMemo)
      rerender({});

      const secondValue = result.current;
      expect(secondValue.db).toBe(firstValue.db);
      expect(secondValue.isReady).toBe(firstValue.isReady);
    });
  });

  describe('Cleanup', () => {
    it('should not update state after unmount', async () => {
      // Use a slow-resolving mock to test unmount during init
      let resolveOpen: ((value: typeof mockSqliteDb) => void) | undefined;
      (openDatabaseAsync as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveOpen = resolve;
          }),
      );

      const { unmount } = renderHook(() => useDatabase(), { wrapper });

      // Allow the useEffect to run and register the promise
      await act(async () => {
        await Promise.resolve();
      });

      // Unmount before initialization completes
      unmount();

      // Resolve the database open after unmount - should not cause warnings
      if (resolveOpen) {
        await act(async () => {
          resolveOpen!(mockSqliteDb);
        });
      }
    });
  });
});
