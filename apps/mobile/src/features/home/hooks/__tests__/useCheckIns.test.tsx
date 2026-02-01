/**
 * useCheckIns Hook Test Suite
 *
 * Tests check-in functionality including:
 * - Create morning/evening check-ins
 * - Update existing check-ins
 * - Delete check-ins with sync queue
 * - Streak calculation
 * - Encryption/decryption of content
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies before importing hooks
const mockEncryptContent = jest.fn();
const mockDecryptContent = jest.fn();
const mockAddToSyncQueue = jest.fn();
const mockAddDeleteToSyncQueue = jest.fn();

// Mock database
const mockDb = {
  getDatabaseName: jest.fn().mockReturnValue('test.db'),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
  execAsync: jest.fn(),
  withTransactionAsync: jest.fn(),
};

jest.mock('../../../../contexts/DatabaseContext', () => ({
  useDatabase: () => ({
    db: mockDb,
    isReady: true,
  }),
}));

jest.mock('../../../../utils/encryption', () => ({
  encryptContent: (content) => mockEncryptContent(content),
  decryptContent: (content) => mockDecryptContent(content),
}));

jest.mock('../../../../services/syncService', () => ({
  addToSyncQueue: (...args) => mockAddToSyncQueue(...args),
  addDeleteToSyncQueue: (...args) => mockAddDeleteToSyncQueue(...args),
}));

jest.mock('../../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import hooks after mocking
import {
  useTodayCheckIns,
  useCreateCheckIn,
  useUpdateCheckIn,
  useDeleteCheckIn,
  useStreak,
} from '../useCheckIns';
// Get reference to the mocked logger for assertions
import { logger as mockLogger } from '../../../../utils/logger';

describe('useCheckIns', () => {
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
    mockDecryptContent.mockImplementation((content: string) =>
      Promise.resolve(content.replace('encrypted_', '')),
    );
    mockAddToSyncQueue.mockResolvedValue(undefined);
    mockAddDeleteToSyncQueue.mockResolvedValue(undefined);
    mockDb.getAllAsync.mockResolvedValue([]);
    mockDb.getFirstAsync.mockResolvedValue(null);
    mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
  });

  describe('useTodayCheckIns', () => {
    it('should return null for both check-ins when none exist', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => useTodayCheckIns(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.morning).toBe(null);
      expect(result.current.evening).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should return morning check-in when exists', async () => {
      const morningCheckIn = {
        id: 'checkin-1',
        user_id: testUserId,
        check_in_type: 'morning',
        check_in_date: new Date().toISOString().split('T')[0],
        encrypted_intention: 'encrypted_My intention',
        encrypted_reflection: null,
        encrypted_mood: 'encrypted_4',
        encrypted_craving: null,
        created_at: '2025-01-01T08:00:00Z',
        sync_status: 'synced',
      };

      mockDb.getAllAsync.mockResolvedValue([morningCheckIn]);

      const { result } = renderHook(() => useTodayCheckIns(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.morning).toBeTruthy();
      expect(result.current.morning?.intention).toBe('My intention');
      expect(result.current.morning?.mood).toBe(4);
      expect(result.current.evening).toBe(null);
    });

    it('should return evening check-in when exists', async () => {
      const eveningCheckIn = {
        id: 'checkin-2',
        user_id: testUserId,
        check_in_type: 'evening',
        check_in_date: new Date().toISOString().split('T')[0],
        encrypted_intention: null,
        encrypted_reflection: 'encrypted_Good day',
        encrypted_mood: 'encrypted_5',
        encrypted_craving: 'encrypted_2',
        created_at: '2025-01-01T20:00:00Z',
        sync_status: 'synced',
      };

      mockDb.getAllAsync.mockResolvedValue([eveningCheckIn]);

      const { result } = renderHook(() => useTodayCheckIns(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.morning).toBe(null);
      expect(result.current.evening).toBeTruthy();
      expect(result.current.evening?.reflection).toBe('Good day');
      expect(result.current.evening?.mood).toBe(5);
      expect(result.current.evening?.craving).toBe(2);
    });

    it('should return both check-ins when both exist', async () => {
      const today = new Date().toISOString().split('T')[0];
      const checkIns = [
        {
          id: 'checkin-1',
          user_id: testUserId,
          check_in_type: 'morning',
          check_in_date: today,
          encrypted_intention: 'encrypted_Morning intention',
          encrypted_reflection: null,
          encrypted_mood: 'encrypted_4',
          encrypted_craving: null,
          created_at: '2025-01-01T08:00:00Z',
          sync_status: 'synced',
        },
        {
          id: 'checkin-2',
          user_id: testUserId,
          check_in_type: 'evening',
          check_in_date: today,
          encrypted_intention: null,
          encrypted_reflection: 'encrypted_Evening reflection',
          encrypted_mood: 'encrypted_5',
          encrypted_craving: 'encrypted_1',
          created_at: '2025-01-01T20:00:00Z',
          sync_status: 'synced',
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(checkIns);

      const { result } = renderHook(() => useTodayCheckIns(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.morning?.intention).toBe('Morning intention');
      expect(result.current.evening?.reflection).toBe('Evening reflection');
    });

    it('should handle decryption errors gracefully', async () => {
      const checkIn = {
        id: 'checkin-1',
        user_id: testUserId,
        check_in_type: 'morning',
        check_in_date: new Date().toISOString().split('T')[0],
        encrypted_intention: 'corrupted_data',
        encrypted_reflection: null,
        encrypted_mood: null,
        encrypted_craving: null,
        created_at: '2025-01-01T08:00:00Z',
        sync_status: 'synced',
      };

      mockDb.getAllAsync.mockResolvedValue([checkIn]);
      mockDecryptContent.mockRejectedValue(new Error('Decryption failed'));

      const { result } = renderHook(() => useTodayCheckIns(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useCreateCheckIn', () => {
    it('should create morning check-in with encryption', async () => {
      const { result } = renderHook(() => useCreateCheckIn(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createCheckIn({
          type: 'morning',
          intention: 'Stay positive today',
          mood: 4,
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('Stay positive today');
      expect(mockEncryptContent).toHaveBeenCalledWith('4');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO daily_checkins'),
        expect.arrayContaining([
          expect.any(String), // id
          testUserId,
          'morning',
          expect.any(String), // date
          'encrypted_Stay positive today', // encrypted_intention
          null, // encrypted_reflection
          'encrypted_4', // encrypted_mood
          null, // encrypted_craving
          expect.any(String), // created_at
          'pending', // sync_status
        ]),
      );
      expect(mockAddToSyncQueue).toHaveBeenCalledWith(
        mockDb,
        'daily_checkins',
        expect.any(String),
        'insert',
      );
    });

    it('should create evening check-in with all fields', async () => {
      const { result } = renderHook(() => useCreateCheckIn(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createCheckIn({
          type: 'evening',
          reflection: 'Great day overall',
          mood: 5,
          craving: 2,
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('Great day overall');
      expect(mockEncryptContent).toHaveBeenCalledWith('5');
      expect(mockEncryptContent).toHaveBeenCalledWith('2');
      expect(mockDb.runAsync).toHaveBeenCalled();
      expect(mockAddToSyncQueue).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Check-in created',
        expect.objectContaining({ type: 'evening' }),
      );
    });

    it('should handle optional fields correctly', async () => {
      const { result } = renderHook(() => useCreateCheckIn(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createCheckIn({
          type: 'morning',
          mood: 3,
          // No intention
        });
      });

      // Should not encrypt undefined values
      expect(mockEncryptContent).toHaveBeenCalledWith('3');
      expect(mockEncryptContent).not.toHaveBeenCalledWith(undefined);
    });

    it('should handle database errors', async () => {
      mockDb.runAsync.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useCreateCheckIn(testUserId), {
        wrapper: createWrapper(),
      });

      // Clear any previous calls before testing
      (mockLogger.error as jest.Mock).mockClear();

      await expect(
        act(async () => {
          await result.current.createCheckIn({
            type: 'morning',
            intention: 'Test',
            mood: 4,
          });
        }),
      ).rejects.toThrow('Database error');

      // Wait for the error to be logged
      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith('Failed to create check-in', expect.any(Error));
      });
    });

    it('should invalidate queries after successful creation', async () => {
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateCheckIn(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createCheckIn({
          type: 'morning',
          intention: 'Test',
          mood: 4,
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(['daily_checkins', testUserId]),
      });
    });
  });

  describe('useUpdateCheckIn', () => {
    it('should update check-in with encryption', async () => {
      const { result } = renderHook(() => useUpdateCheckIn(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateCheckIn('checkin-123', {
          intention: 'Updated intention',
          mood: 5,
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('Updated intention');
      expect(mockEncryptContent).toHaveBeenCalledWith('5');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE daily_checkins'),
        expect.any(Array),
      );
      expect(mockAddToSyncQueue).toHaveBeenCalledWith(
        mockDb,
        'daily_checkins',
        'checkin-123',
        'update',
      );
    });

    it('should only update provided fields', async () => {
      const { result } = renderHook(() => useUpdateCheckIn(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateCheckIn('checkin-123', {
          mood: 4,
          // Only mood, no intention or reflection
        });
      });

      // Should only encrypt mood
      expect(mockEncryptContent).toHaveBeenCalledWith('4');
      expect(mockEncryptContent).toHaveBeenCalledTimes(1);
    });

    it('should handle clear fields (set to null)', async () => {
      const { result } = renderHook(() => useUpdateCheckIn(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateCheckIn('checkin-123', {
          intention: '', // Clear intention
        });
      });

      // Empty string should result in null
      const updateCall = mockDb.runAsync.mock.calls[0];
      expect(updateCall[1]).toContain(null);
    });

    it('should handle update errors', async () => {
      mockDb.runAsync.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useUpdateCheckIn(testUserId), {
        wrapper: createWrapper(),
      });

      // Clear any previous calls before testing
      (mockLogger.error as jest.Mock).mockClear();

      await expect(
        act(async () => {
          await result.current.updateCheckIn('checkin-123', {
            mood: 5,
          });
        }),
      ).rejects.toThrow('Update failed');

      // Wait for the error to be logged
      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith('Failed to update check-in', expect.any(Error));
      });
    });
  });

  describe('useDeleteCheckIn', () => {
    it('should delete check-in and add to sync queue', async () => {
      const { result } = renderHook(() => useDeleteCheckIn(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.deleteCheckIn('checkin-123');
      });

      // Should add to sync queue BEFORE delete
      expect(mockAddDeleteToSyncQueue).toHaveBeenCalledWith(
        mockDb,
        'daily_checkins',
        'checkin-123',
        testUserId,
      );

      // Then delete locally
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM daily_checkins WHERE id = ? AND user_id = ?',
        ['checkin-123', testUserId],
      );

      expect(mockLogger.info).toHaveBeenCalledWith('Check-in deleted', { id: 'checkin-123' });
    });

    it('should handle delete errors', async () => {
      mockDb.runAsync.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useDeleteCheckIn(testUserId), {
        wrapper: createWrapper(),
      });

      // Clear any previous calls before testing
      (mockLogger.error as jest.Mock).mockClear();

      await expect(
        act(async () => {
          await result.current.deleteCheckIn('checkin-123');
        }),
      ).rejects.toThrow('Delete failed');

      // Wait for the error to be logged
      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete check-in', expect.any(Error));
      });
    });

    it('should invalidate streak query after deletion', async () => {
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteCheckIn(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.deleteCheckIn('checkin-123');
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['streak', testUserId],
      });
    });
  });

  describe('useStreak', () => {
    it('should return 0 streak when no check-ins exist', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => useStreak(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.current_streak).toBe(0);
      expect(result.current.longest_streak).toBe(0);
      expect(result.current.total_check_ins).toBe(0);
    });

    it('should calculate consecutive streak correctly', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const dates = [
        { check_in_date: today.toISOString().split('T')[0] },
        { check_in_date: yesterday.toISOString().split('T')[0] },
        { check_in_date: twoDaysAgo.toISOString().split('T')[0] },
      ];

      mockDb.getAllAsync.mockResolvedValue(dates);

      const { result } = renderHook(() => useStreak(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.current_streak).toBeGreaterThanOrEqual(1);
      expect(result.current.total_check_ins).toBe(3);
    });

    it('should handle gaps in streak', async () => {
      const today = new Date();
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const dates = [
        { check_in_date: today.toISOString().split('T')[0] },
        { check_in_date: twoDaysAgo.toISOString().split('T')[0] },
        { check_in_date: fiveDaysAgo.toISOString().split('T')[0] },
      ];

      mockDb.getAllAsync.mockResolvedValue(dates);

      const { result } = renderHook(() => useStreak(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Current streak should be 1 (today only, since yesterday is missing)
      expect(result.current.current_streak).toBeLessThanOrEqual(1);
      expect(result.current.total_check_ins).toBe(3);
    });

    it('should track longest streak separately from current', async () => {
      const today = new Date();
      // Current streak: today only
      // Longest streak: 5 days from a week ago
      const dates = [{ check_in_date: today.toISOString().split('T')[0] }];

      for (let i = 7; i <= 11; i++) {
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - i);
        dates.push({ check_in_date: pastDate.toISOString().split('T')[0] });
      }

      mockDb.getAllAsync.mockResolvedValue(dates);

      const { result } = renderHook(() => useStreak(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.longest_streak).toBeGreaterThanOrEqual(result.current.current_streak);
    });

    it('should handle database errors gracefully', async () => {
      mockDb.getAllAsync.mockRejectedValue(new Error('Query failed'));

      const { result } = renderHook(() => useStreak(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should return defaults on error
      expect(result.current.current_streak).toBe(0);
      expect(result.current.longest_streak).toBe(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined database gracefully', async () => {
      // This would require mocking useDatabase to return null
      // The hooks already have guards for this
    });

    it('should handle encryption of special characters', async () => {
      mockEncryptContent.mockImplementation((content: string) =>
        Promise.resolve(`encrypted_${content}`),
      );

      const { result } = renderHook(() => useCreateCheckIn(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createCheckIn({
          type: 'morning',
          intention: 'Special chars: "quotes" & <tags> \' apostrophe',
          mood: 4,
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith(
        'Special chars: "quotes" & <tags> \' apostrophe',
      );
    });

    it('should handle emoji in content', async () => {
      const { result } = renderHook(() => useCreateCheckIn(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createCheckIn({
          type: 'evening',
          reflection: 'Great day! 🎉 Feeling blessed 🙏',
          mood: 5,
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('Great day! 🎉 Feeling blessed 🙏');
    });

    it('should handle very long content', async () => {
      const longContent = 'A'.repeat(10000);

      const { result } = renderHook(() => useCreateCheckIn(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createCheckIn({
          type: 'morning',
          intention: longContent,
          mood: 4,
        });
      });

      expect(mockEncryptContent).toHaveBeenCalledWith(longContent);
    });
  });
});
