/**
 * Milestone Predictions Hook
 * Bridges the milestonePredictions service with the home screen
 * by gathering engagement context from the local database.
 */

import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { logger } from '../../../utils/logger';
import { predictMilestones } from '../../ai-companion/services/milestonePredictions';
import type { MilestonePrediction } from '../../ai-companion/services/milestonePredictions';

export type { MilestonePrediction };

export function useMilestonePredictions(userId: string): {
  predictions: MilestonePrediction[];
  isLoading: boolean;
  error: Error | null;
} {
  const { db, isReady } = useDatabase();

  const { data, isLoading, error } = useQuery({
    queryKey: ['milestone-predictions', userId],
    queryFn: async (): Promise<MilestonePrediction[]> => {
      if (!db) return [];
      logger.debug('Generating milestone predictions', { userId });

      // Sobriety days
      const profile = await db.getFirstAsync<{ sobriety_start_date: string | null }>(
        'SELECT sobriety_start_date FROM user_profile WHERE id = ?',
        [userId],
      );
      const sobrietyDays = profile?.sobriety_start_date
        ? Math.floor(
            (Date.now() - new Date(profile.sobriety_start_date).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

      // Current step (highest step with any work)
      const stepRow = await db.getFirstAsync<{ max_step: number }>(
        'SELECT MAX(step_number) as max_step FROM step_work WHERE user_id = ?',
        [userId],
      );
      const currentStep = stepRow?.max_step ?? 0;

      // Journal streak
      let journalStreak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        const entry = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM journal_entries WHERE user_id = ? AND DATE(created_at) = ?',
          [userId, dateStr],
        );
        if (entry) {
          journalStreak++;
        } else if (i > 0) {
          break;
        }
      }

      // Check-in streak
      let checkInStreak = 0;
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        const checkIn = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM daily_checkins WHERE user_id = ? AND check_in_date = ?',
          [userId, dateStr],
        );
        if (checkIn) {
          checkInStreak++;
        } else if (i > 0) {
          break;
        }
      }

      // Avg entries per week (last 4 weeks)
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const entryCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM journal_entries WHERE user_id = ? AND created_at >= ?',
        [userId, fourWeeksAgo.toISOString()],
      );
      const avgEntriesPerWeek = (entryCount?.count ?? 0) / 4;

      const predictions = predictMilestones({
        sobrietyDays,
        currentStep,
        journalStreak,
        checkInStreak,
        avgEntriesPerWeek,
      });

      // Sort by daysAway (items without daysAway go last)
      return predictions.sort((a, b) => (a.daysAway ?? 999) - (b.daysAway ?? 999));
    },
    enabled: isReady && !!db && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    predictions: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}
