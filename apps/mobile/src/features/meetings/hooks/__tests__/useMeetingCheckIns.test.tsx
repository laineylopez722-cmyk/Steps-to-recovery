import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockUseAuth = jest.fn();
const mockGetMeetingCheckIns = jest.fn();
const mockGetMeetingStats = jest.fn();
const mockCheckInToMeeting = jest.fn();
const mockHasCheckedInToday = jest.fn();
const mockHasCheckedInToMeetingToday = jest.fn();

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../../../services/meetingCheckInService', () => ({
  getMeetingCheckIns: (...args: unknown[]) => mockGetMeetingCheckIns(...args),
  getMeetingStats: (...args: unknown[]) => mockGetMeetingStats(...args),
  checkInToMeeting: (...args: unknown[]) => mockCheckInToMeeting(...args),
  hasCheckedInToday: (...args: unknown[]) => mockHasCheckedInToday(...args),
  hasCheckedInToMeetingToday: (...args: unknown[]) => mockHasCheckedInToMeetingToday(...args),
}));

import {
  useMeetingCheckIns,
  useMeetingCheckInStatus,
  useTodayCheckIn,
} from '../useMeetingCheckIns';

describe('useMeetingCheckIns hooks', () => {
  const userId = 'user-123';
  let queryClient: QueryClient;

  const createWrapper = () => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

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

    mockUseAuth.mockReturnValue({ user: { id: userId } });
    mockGetMeetingCheckIns.mockResolvedValue([]);
    mockGetMeetingStats.mockResolvedValue({
      totalMeetings: 0,
      currentStreak: 0,
      longestStreak: 0,
    });
    mockHasCheckedInToday.mockResolvedValue(false);
    mockHasCheckedInToMeetingToday.mockResolvedValue(false);
  });

  describe('useMeetingCheckIns', () => {
    it('loads check-ins and stats for authenticated user', async () => {
      const checkIns = [
        {
          id: 'checkin-1',
          userId,
          meetingId: 'meeting-1',
          meetingName: 'Downtown Group',
          checkInType: 'manual',
          createdAt: '2026-02-09T12:00:00.000Z',
        },
      ];
      mockGetMeetingCheckIns.mockResolvedValue(checkIns);
      mockGetMeetingStats.mockResolvedValue({
        totalMeetings: 12,
        currentStreak: 3,
        longestStreak: 5,
      });

      const { result } = renderHook(() => useMeetingCheckIns(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetMeetingCheckIns).toHaveBeenCalledWith(userId, 50);
      expect(mockGetMeetingStats).toHaveBeenCalledWith(userId);
      expect(result.current.checkIns).toEqual(checkIns);
      expect(result.current.totalMeetings).toBe(12);
      expect(result.current.currentStreak).toBe(3);
      expect(result.current.longestStreak).toBe(5);
    });

    it('runs async check-in mutation and invalidates related queries', async () => {
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
      const checkInResult = {
        checkIn: {
          id: 'checkin-99',
          userId,
          meetingId: 'meeting-9',
          meetingName: 'Noon Meeting',
          checkInType: 'manual' as const,
          createdAt: '2026-02-09T12:30:00.000Z',
        },
        newAchievements: ['first_meeting'],
      };

      mockCheckInToMeeting.mockResolvedValue(checkInResult);

      const { result } = renderHook(() => useMeetingCheckIns(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.checkInAsync({
          meetingName: 'Noon Meeting',
          checkInType: 'manual',
          notes: 'Needed this today',
        });
        expect(response).toEqual(checkInResult);
      });

      expect(mockCheckInToMeeting).toHaveBeenCalledWith(userId, {
        meetingName: 'Noon Meeting',
        checkInType: 'manual',
        notes: 'Needed this today',
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['meetingCheckIns', userId] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['meetingStats', userId] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['achievements', userId] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['90in90Progress', userId] });
    });

    it('rejects check-in mutation when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({ user: null });

      const { result } = renderHook(() => useMeetingCheckIns(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.checkInAsync({
            meetingName: 'Evening Group',
            checkInType: 'manual',
          }),
        ).rejects.toThrow('User not authenticated');
      });

      expect(mockCheckInToMeeting).not.toHaveBeenCalled();
    });
  });

  describe('useTodayCheckIn', () => {
    it('returns today check-in status for authenticated user', async () => {
      mockHasCheckedInToday.mockResolvedValue(true);

      const { result } = renderHook(() => useTodayCheckIn(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockHasCheckedInToday).toHaveBeenCalledWith(userId);
      expect(result.current.hasCheckedIn).toBe(true);
    });

    it('returns false and does not query when unauthenticated', async () => {
      mockUseAuth.mockReturnValue({ user: null });

      const { result } = renderHook(() => useTodayCheckIn(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockHasCheckedInToday).not.toHaveBeenCalled();
      expect(result.current.hasCheckedIn).toBe(false);
    });
  });

  describe('useMeetingCheckInStatus', () => {
    it('returns meeting-specific check-in status', async () => {
      mockHasCheckedInToMeetingToday.mockResolvedValue(true);

      const { result } = renderHook(() => useMeetingCheckInStatus('meeting-abc'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockHasCheckedInToMeetingToday).toHaveBeenCalledWith(userId, 'meeting-abc');
      expect(result.current.hasCheckedIn).toBe(true);
    });

    it('does not query when meeting id is missing', async () => {
      const { result } = renderHook(() => useMeetingCheckInStatus(undefined), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockHasCheckedInToMeetingToday).not.toHaveBeenCalled();
      expect(result.current.hasCheckedIn).toBe(false);
    });
  });
});
