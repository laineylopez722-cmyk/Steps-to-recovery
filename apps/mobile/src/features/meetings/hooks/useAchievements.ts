/**
 * React Query hooks for achievements
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import * as checkInService from '../../../services/meetingCheckInService';
import {
  MEETING_ACHIEVEMENTS,
  getAchievementByKey,
  type Achievement as AchievementDefinition,
} from '@recovery/shared';

export interface AchievementWithStatus extends AchievementDefinition {
  unlocked: boolean;
  unlockedAt?: string;
}

/**
 * Hook for managing user achievements
 */
export function useAchievements() {
  const { user } = useAuth();
  const userId = user?.id;

  // Get unlocked achievements from database
  const {
    data: unlockedAchievements = [],
    isLoading: isLoadingUnlocked,
    error: unlockedError,
  } = useQuery({
    queryKey: ['achievements', userId],
    queryFn: () => (userId ? checkInService.getAchievements(userId) : []),
    enabled: !!userId,
  });

  // Get current stats for progress calculation
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['meetingStats', userId],
    queryFn: () =>
      userId
        ? checkInService.getMeetingStats(userId)
        : { totalMeetings: 0, currentStreak: 0, longestStreak: 0 },
    enabled: !!userId,
  });

  // Combine achievement definitions with unlock status
  const achievements: AchievementWithStatus[] = MEETING_ACHIEVEMENTS.map((achievement) => {
    const unlocked = unlockedAchievements.find((u) => u.achievementKey === achievement.key);

    return {
      ...achievement,
      unlocked: !!unlocked,
      unlockedAt: unlocked?.unlockedAt,
    };
  });

  // Calculate progress for each achievement
  const achievementsWithProgress = achievements.map((achievement) => {
    let progress = 0;
    let progressText = '';

    if (!achievement.unlocked) {
      switch (achievement.category) {
        case 'total':
          progress = Math.min(
            ((stats?.totalMeetings || 0) / (achievement.requirement as number)) * 100,
            100,
          );
          progressText = `${stats?.totalMeetings || 0} / ${achievement.requirement}`;
          break;
        case 'streak':
          progress = Math.min(
            ((stats?.currentStreak || 0) / (achievement.requirement as number)) * 100,
            100,
          );
          progressText = `${stats?.currentStreak || 0} / ${achievement.requirement} days`;
          break;
        // 'challenge' achievements (30 in 30, 90 in 90) handled separately
        case 'challenge':
          // Progress shown in dedicated 90-in-90 component
          progress = 0;
          progressText = 'Track in 90-in-90 dashboard';
          break;
      }
    } else {
      progress = 100;
      progressText = 'Unlocked!';
    }

    return {
      ...achievement,
      progress,
      progressText,
    };
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  return {
    achievements: achievementsWithProgress,
    isLoading: isLoadingUnlocked || isLoadingStats,
    error: unlockedError,
    unlockedCount,
    totalCount,
    unlockedAchievements,
  };
}

/**
 * Hook for a single achievement
 */
export function useAchievement(achievementKey: string) {
  const { achievements, isLoading } = useAchievements();
  const achievement = achievements.find((a) => a.key === achievementKey);

  return {
    achievement,
    isLoading,
  };
}

/**
 * Hook for recently unlocked achievements (for notifications)
 */
export function useRecentAchievements(sinceDays: number = 7) {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: recentAchievements = [], isLoading } = useQuery({
    queryKey: ['recentAchievements', userId, sinceDays],
    queryFn: async () => {
      if (!userId) return [];

      const allAchievements = await checkInService.getAchievements(userId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - sinceDays);

      return allAchievements
        .filter((a) => new Date(a.unlockedAt) >= cutoffDate)
        .map((a) => ({
          ...a,
          definition: getAchievementByKey(a.achievementKey),
        }));
    },
    enabled: !!userId,
  });

  return {
    recentAchievements,
    isLoading,
  };
}
