/**
 * React Query hooks for meeting check-ins
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import * as checkInService from '../../../services/meetingCheckInService';
import type { MeetingCheckIn } from '../../../services/meetingCheckInService';

/**
 * Hook for managing meeting check-ins
 */
export function useMeetingCheckIns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const userId = user?.id;

  // Query: Get user's check-ins
  const {
    data: checkIns = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['meetingCheckIns', userId],
    queryFn: () =>
      userId ? checkInService.getMeetingCheckIns(userId, 50) : [],
    enabled: !!userId,
  });

  // Query: Get stats
  const { data: stats } = useQuery({
    queryKey: ['meetingStats', userId],
    queryFn: () =>
      userId
        ? checkInService.getMeetingStats(userId)
        : { totalMeetings: 0, currentStreak: 0, longestStreak: 0 },
    enabled: !!userId,
  });

  // Mutation: Create new check-in
  const checkInMutation = useMutation({
    mutationFn: async (
      meetingData: Omit<MeetingCheckIn, 'id' | 'userId' | 'createdAt'>
    ) => {
      if (!userId) throw new Error('User not authenticated');
      return checkInService.checkInToMeeting(userId, meetingData);
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['meetingCheckIns', userId] });
      queryClient.invalidateQueries({ queryKey: ['meetingStats', userId] });
      queryClient.invalidateQueries({ queryKey: ['achievements', userId] });
      queryClient.invalidateQueries({ queryKey: ['90in90Progress', userId] });
    },
  });

  return {
    checkIns,
    isLoading,
    error,
    refetch,
    checkIn: checkInMutation.mutate,
    isCheckingIn: checkInMutation.isPending,
    checkInError: checkInMutation.error,
    lastCheckInResult: checkInMutation.data,
    totalMeetings: stats?.totalMeetings || 0,
    currentStreak: stats?.currentStreak || 0,
    longestStreak: stats?.longestStreak || 0,
  };
}

/**
 * Hook for getting today's check-in status
 */
export function useTodayCheckIn() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: hasCheckedIn = false, isLoading } = useQuery({
    queryKey: ['todayCheckIn', userId],
    queryFn: () =>
      userId ? checkInService.hasCheckedInToday(userId) : false,
    enabled: !!userId,
  });

  return {
    hasCheckedIn,
    isLoading,
  };
}

/**
 * Hook for checking meeting-specific check-in status
 */
export function useMeetingCheckInStatus(meetingId?: string) {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: hasCheckedIn = false, isLoading } = useQuery({
    queryKey: ['meetingCheckIn', userId, meetingId],
    queryFn: () =>
      userId && meetingId
        ? checkInService.hasCheckedInToMeetingToday(userId, meetingId)
        : false,
    enabled: !!userId && !!meetingId,
  });

  return {
    hasCheckedIn,
    isLoading,
  };
}
