/**
 * Recovery Strength Hook
 * Bridges the recoveryStrengthScore service with the progress dashboard
 * by gathering metrics from the local database and computing a composite score.
 */

import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { decryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import {
  calculateRecoveryStrength,
  calculateCheckInConsistency,
  calculateMoodStability,
  calculateCravingManagement,
} from '../../ai-companion/services/recoveryStrengthScore';
import type { RecoveryStrengthResult, RecoveryMetrics } from '../../ai-companion/services/recoveryStrengthScore';

export type { RecoveryStrengthResult, RecoveryMetrics };

async function gatherMetrics(
  db: ReturnType<typeof useDatabase>['db'],
  userId: string,
): Promise<RecoveryMetrics> {
  if (!db) {
    return {
      checkInConsistency: 0,
      journalFrequency: 0,
      stepWorkProgress: 0,
      moodStability: 0.5,
      cravingManagement: 0.5,
    };
  }

  // Check-in dates (last 14 days)
  const checkInRows = await db.getAllAsync<{ check_in_date: string }>(
    `SELECT DISTINCT check_in_date FROM daily_checkins
     WHERE user_id = ? ORDER BY check_in_date DESC LIMIT 30`,
    [userId],
  );
  const checkInConsistency = calculateCheckInConsistency(
    checkInRows.map((r) => r.check_in_date),
  );

  // Journal frequency (entries in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const journalCount = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM journal_entries
     WHERE user_id = ? AND created_at >= ?`,
    [userId, sevenDaysAgo.toISOString()],
  );
  const journalFrequency = Math.min(1, (journalCount?.count ?? 0) / 7);

  // Step work progress
  const stepRows = await db.getAllAsync<{ step_number: number; is_complete: number }>(
    `SELECT step_number, is_complete FROM step_work WHERE user_id = ?`,
    [userId],
  );
  const completedSteps = new Set(
    stepRows.filter((r) => r.is_complete === 1).map((r) => r.step_number),
  );
  const stepWorkProgress = completedSteps.size / 12;

  // Mood stability (last 14 days of mood ratings)
  const moodRows = await db.getAllAsync<{ encrypted_mood: string }>(
    `SELECT encrypted_mood FROM daily_checkins
     WHERE user_id = ? AND encrypted_mood IS NOT NULL
     ORDER BY check_in_date DESC LIMIT 14`,
    [userId],
  );
  const moodRatings: number[] = [];
  for (const row of moodRows) {
    try {
      const decrypted = await decryptContent(row.encrypted_mood);
      const mood = parseInt(decrypted, 10);
      if (!isNaN(mood) && mood >= 1 && mood <= 5) {
        moodRatings.push(mood);
      }
    } catch {
      // Skip decryption errors
    }
  }
  const moodStability = calculateMoodStability(moodRatings);

  // Craving management (last 14 days)
  const cravingRows = await db.getAllAsync<{ encrypted_craving: string }>(
    `SELECT encrypted_craving FROM daily_checkins
     WHERE user_id = ? AND encrypted_craving IS NOT NULL
     ORDER BY check_in_date DESC LIMIT 14`,
    [userId],
  );
  const cravingLevels: number[] = [];
  for (const row of cravingRows) {
    try {
      const decrypted = await decryptContent(row.encrypted_craving);
      const craving = parseInt(decrypted, 10);
      if (!isNaN(craving) && craving >= 0 && craving <= 10) {
        cravingLevels.push(craving);
      }
    } catch {
      // Skip decryption errors
    }
  }
  const cravingManagement = calculateCravingManagement(cravingLevels);

  return {
    checkInConsistency,
    journalFrequency,
    stepWorkProgress,
    moodStability,
    cravingManagement,
  };
}

export function useRecoveryStrength(userId: string): {
  data: RecoveryStrengthResult | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const { db, isReady } = useDatabase();

  const { data, isLoading, error } = useQuery({
    queryKey: ['recovery-strength', userId],
    queryFn: async (): Promise<RecoveryStrengthResult> => {
      logger.debug('Calculating recovery strength', { userId });
      const metrics = await gatherMetrics(db, userId);
      return calculateRecoveryStrength(metrics);
    },
    enabled: isReady && !!db && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data,
    isLoading,
    error: error as Error | null,
  };
}
