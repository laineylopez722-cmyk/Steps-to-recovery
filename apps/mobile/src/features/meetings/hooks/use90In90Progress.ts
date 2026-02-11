/**
 * React Query hook for 90-in-90 challenge progress
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import * as checkInService from '../../../services/meetingCheckInService';

/**
 * Hook for 90-in-90 challenge progress
 */
export function use90In90Progress() {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    data: progress,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['90in90Progress', userId],
    queryFn: () =>
      userId
        ? checkInService.check90In90Progress(userId)
        : {
            daysCompleted: 0,
            daysRemaining: 90,
            isComplete: false,
            startDate: null,
            targetDate: null,
            daysElapsed: 0,
          },
    enabled: !!userId,
    staleTime: 30 * 60 * 1000, // 30 minutes - progress changes only on check-in
  });

  // Calculate percentage for progress bars
  const percentComplete = progress ? Math.min((progress.daysCompleted / 90) * 100, 100) : 0;

  // Calculate days until target (if started)
  const daysUntilTarget = progress?.targetDate
    ? Math.max(
        Math.ceil(
          (new Date(progress.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        ),
        0,
      )
    : null;

  // Check if user is on track (for encouraging messages)
  const isOnTrack = progress ? progress.daysCompleted >= progress.daysElapsed : false;

  return {
    progress: progress || {
      daysCompleted: 0,
      daysRemaining: 90,
      isComplete: false,
      startDate: null,
      targetDate: null,
      daysElapsed: 0,
    },
    percentComplete,
    daysUntilTarget,
    isOnTrack,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get motivational message based on 90-in-90 progress
 */
export function get90In90MotivationalMessage(daysCompleted: number): string {
  if (daysCompleted === 0) {
    return 'Ready to start the 90-in-90 challenge? Check in to your first meeting!';
  }
  if (daysCompleted === 1) {
    return "Day 1 complete! You've started something powerful! 🎉";
  }
  if (daysCompleted === 7) {
    return 'One week down! 83 more days to go! 💪';
  }
  if (daysCompleted === 30) {
    return "30 days! You're one-third of the way there! 🏆";
  }
  if (daysCompleted === 45) {
    return 'Halfway there! Keep up the amazing work! ⭐';
  }
  if (daysCompleted === 60) {
    return "60 days! Two-thirds complete! You're crushing it! 🔥";
  }
  if (daysCompleted === 75) {
    return '75 days! The finish line is in sight! 🎯';
  }
  if (daysCompleted === 89) {
    return "One more day! You're about to make history! 👑";
  }
  if (daysCompleted >= 90) {
    return '90 IN 90 COMPLETE! You are LEGENDARY! 🌟';
  }

  // Default messages for other milestones
  if (daysCompleted % 10 === 0) {
    return `${daysCompleted} meetings down! Keep building that momentum! 💫`;
  }

  return `Day ${daysCompleted} - One day at a time! 🚀`;
}
