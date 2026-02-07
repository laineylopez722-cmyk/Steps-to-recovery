import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { logger } from '../../../utils/logger';
import { scheduleAllMilestones } from '../../../services/notificationService';
import { generateId } from '../../../utils/id';
import type { UserProfile, MilestoneDefinition as Milestone } from '@recovery/shared';

/**
 * Milestones configuration
 */
const MILESTONES: Milestone[] = [
  {
    key: '24_hours',
    days: 1,
    title: 'First 24 Hours',
    description: 'One day at a time',
    icon: '🌅',
  },
  { key: '3_days', days: 3, title: '3 Days Clean', description: 'Building momentum', icon: '💪' },
  { key: '1_week', days: 7, title: 'One Week', description: 'A full week of recovery', icon: '⭐' },
  { key: '2_weeks', days: 14, title: '2 Weeks Clean', description: 'Two weeks strong', icon: '🔥' },
  { key: '30_days', days: 30, title: '30 Days', description: 'One month milestone', icon: '🎉' },
  { key: '60_days', days: 60, title: '60 Days', description: 'Two months of growth', icon: '🌟' },
  {
    key: '90_days',
    days: 90,
    title: '90 Days',
    description: 'Three months - a new season',
    icon: '🏆',
  },
  { key: '6_months', days: 182, title: '6 Months', description: 'Half a year clean', icon: '💎' },
  {
    key: '9_months',
    days: 274,
    title: '9 Months',
    description: 'Three quarters of a year',
    icon: '🎖️',
  },
  {
    key: '1_year',
    days: 365,
    title: 'One Year',
    description: 'A full year of recovery',
    icon: '👑',
  },
];

/**
 * Calculate clean time from sobriety start date
 */
function calculateCleanTime(sobrietyStartDate: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const start = new Date(sobrietyStartDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return {
    days,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
  };
}

/**
 * Hook to get clean time and milestones
 */
export function useCleanTime(userId: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  nextMilestone: Milestone | null;
  recentMilestones: Milestone[];
  isLoading: boolean;
  error: Error | null;
} {
  const { db, isReady } = useDatabase();

  const { data, isLoading, error } = useQuery({
    queryKey: ['clean_time', userId],
    queryFn: async () => {
      if (!db || !isReady) {
        // Return defaults when database not ready
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          nextMilestone: MILESTONES[0],
          recentMilestones: [],
        };
      }
      try {
        const result = await db.getFirstAsync<UserProfile>(
          'SELECT * FROM user_profile WHERE id = ?',
          [userId],
        );

        // Handle missing profile gracefully - user may not have set sobriety date yet
        if (!result || !result.sobriety_start_date) {
          logger.debug('User profile or sobriety date not found, returning defaults');
          return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            nextMilestone: MILESTONES[0],
            recentMilestones: [],
          };
        }

        const cleanTime = calculateCleanTime(result.sobriety_start_date);
        const nextMilestone = MILESTONES.find((m) => m.days > cleanTime.days) || null;
        const recentMilestones = MILESTONES.filter((m) => m.days <= cleanTime.days).slice(-3);

        return {
          ...cleanTime,
          nextMilestone,
          recentMilestones,
        };
      } catch (err) {
        logger.error('Failed to calculate clean time', err);
        // Return defaults on error instead of throwing
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          nextMilestone: MILESTONES[0],
          recentMilestones: [],
        };
      }
    },
    enabled: isReady && !!db,
    refetchInterval: 1000, // Update every second for live counter
  });

  return {
    days: data?.days || 0,
    hours: data?.hours || 0,
    minutes: data?.minutes || 0,
    seconds: data?.seconds || 0,
    nextMilestone: data?.nextMilestone || null,
    recentMilestones: data?.recentMilestones || [],
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Hook to check for new milestones and schedule celebration notifications
 */
export function useMilestones(userId: string): {
  milestones: Milestone[];
  checkForNewMilestones: () => Promise<Milestone[]>;
  newMilestone: Milestone | null;
} {
  const { db } = useDatabase();
  const [newMilestone, setNewMilestone] = React.useState<Milestone | null>(null);
  const hasScheduledNotifications = useRef(false);

  /**
   * Schedule milestone notifications on mount (only once)
   */
  useEffect(() => {
    if (hasScheduledNotifications.current || !db) return;

    const scheduleMilestoneNotifications = async () => {
      try {
        const profile = await db.getFirstAsync<UserProfile>(
          'SELECT * FROM user_profile WHERE id = ?',
          [userId],
        );

        if (!profile?.sobriety_start_date) {
          return;
        }

        // Schedule all future milestone notifications
        const cleanSinceDate = new Date(profile.sobriety_start_date);
        await scheduleAllMilestones(cleanSinceDate);

        hasScheduledNotifications.current = true;
        logger.info('Milestone notifications scheduled for user', { userId });
      } catch (err) {
        logger.error('Failed to schedule milestone notifications', err);
      }
    };

    scheduleMilestoneNotifications();
  }, [db, userId]);

  const checkForNewMilestones = async (): Promise<Milestone[]> => {
    if (!db) return [];

    try {
      const profile = await db.getFirstAsync<UserProfile>(
        'SELECT * FROM user_profile WHERE id = ?',
        [userId],
      );

      if (!profile || !profile.sobriety_start_date) {
        return [];
      }

      const cleanTime = calculateCleanTime(profile.sobriety_start_date);
      const earnedMilestones = MILESTONES.filter((m) => m.days <= cleanTime.days);

      // Check which milestones are already recorded
      const recorded = await db.getAllAsync<{ achievement_key: string }>(
        'SELECT achievement_key FROM achievements WHERE user_id = ? AND achievement_type = ?',
        [userId, 'milestone'],
      );

      const recordedKeys = new Set(recorded.map((r) => r.achievement_key));
      const newMilestones = earnedMilestones.filter((m) => !recordedKeys.has(m.key));

      // Record new milestones
      for (const milestone of newMilestones) {
        const id = generateId('achievement');
        const now = new Date().toISOString();

        await db.runAsync(
          'INSERT INTO achievements (id, user_id, achievement_key, achievement_type, earned_at, is_viewed) VALUES (?, ?, ?, ?, ?, ?)',
          [id, userId, milestone.key, 'milestone', now, 0],
        );

        logger.info('Milestone earned', { key: milestone.key, days: milestone.days });

        // Set the most recent new milestone for celebration modal
        setNewMilestone(milestone);
      }

      return newMilestones;
    } catch (err) {
      logger.error('Failed to check for new milestones', err);
      return [];
    }
  };

  return {
    milestones: MILESTONES,
    checkForNewMilestones,
    newMilestone,
  };
}
