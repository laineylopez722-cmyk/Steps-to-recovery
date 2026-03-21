/**
 * Recovery Analytics Hook
 * Aggregates user data to provide insights for the progress dashboard
 *
 * Features:
 * - Mood trend analysis (last 30 days)
 * - Craving pattern detection (time-of-day, day-of-week)
 * - Step work progress tracking
 * - Journal frequency analysis
 * - Streak calculations
 *
 * All data is decrypted client-side for privacy.
 */

import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { decryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import { STEP_PROMPTS } from '@/shared';

export interface MoodDataPoint {
  date: string;
  mood: number; // 1-5
  craving: number; // 0-10
}

export interface StepProgress {
  stepNumber: number;
  totalQuestions: number;
  answeredQuestions: number;
  isComplete: boolean;
}

export interface RecoveryInsight {
  type: 'positive' | 'warning' | 'neutral';
  title: string;
  description: string;
}

export interface RecoveryAnalytics {
  // Mood & Craving Data
  moodData: MoodDataPoint[];
  averageMood: number;
  averageCraving: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  cravingTrend: 'improving' | 'stable' | 'worsening';

  // Step Progress
  stepProgress: StepProgress[];
  totalStepsStarted: number;
  totalStepsCompleted: number;

  // Journal Stats
  journalEntryCount: number;
  journalStreak: number;
  totalWordsWritten: number;

  // Check-in Stats
  checkInStreak: number;
  totalCheckIns: number;

  // Insights
  insights: RecoveryInsight[];

  // Loading state
  isLoading: boolean;
  error: string | null;
}

/** Canonical question counts per step derived from shared step prompts. */
const STEP_TOTAL_QUESTIONS: Record<number, number> = Object.fromEntries(
  STEP_PROMPTS.map((step) => [step.step, step.prompts.length]),
);

export function useRecoveryAnalytics(userId: string): RecoveryAnalytics {
  const { db, isReady } = useDatabase();

  const [analytics, setAnalytics] = useState<RecoveryAnalytics>({
    moodData: [],
    averageMood: 0,
    averageCraving: 0,
    moodTrend: 'stable',
    cravingTrend: 'stable',
    stepProgress: [],
    totalStepsStarted: 0,
    totalStepsCompleted: 0,
    journalEntryCount: 0,
    journalStreak: 0,
    totalWordsWritten: 0,
    checkInStreak: 0,
    totalCheckIns: 0,
    insights: [],
    isLoading: true,
    error: null,
  });

  const calculateMoodTrend = (data: MoodDataPoint[]): 'improving' | 'stable' | 'declining' => {
    if (data.length < 7) return 'stable';

    const recentWeek = data.slice(-7);
    const previousWeek = data.slice(-14, -7);

    if (previousWeek.length < 3) return 'stable';

    const recentAvg = recentWeek.reduce((sum, d) => sum + d.mood, 0) / recentWeek.length;
    const previousAvg = previousWeek.reduce((sum, d) => sum + d.mood, 0) / previousWeek.length;

    const diff = recentAvg - previousAvg;
    if (diff > 0.3) return 'improving';
    if (diff < -0.3) return 'declining';
    return 'stable';
  };

  const calculateCravingTrend = (data: MoodDataPoint[]): 'improving' | 'stable' | 'worsening' => {
    if (data.length < 7) return 'stable';

    const recentWeek = data.slice(-7);
    const previousWeek = data.slice(-14, -7);

    if (previousWeek.length < 3) return 'stable';

    const recentAvg = recentWeek.reduce((sum, d) => sum + d.craving, 0) / recentWeek.length;
    const previousAvg = previousWeek.reduce((sum, d) => sum + d.craving, 0) / previousWeek.length;

    const diff = recentAvg - previousAvg;
    if (diff < -0.5) return 'improving'; // Lower cravings = improving
    if (diff > 0.5) return 'worsening';
    return 'stable';
  };

  const generateInsights = (data: {
    moodData: MoodDataPoint[];
    moodTrend: 'improving' | 'stable' | 'declining';
    cravingTrend: 'improving' | 'stable' | 'worsening';
    checkInStreak: number;
    journalStreak: number;
    totalStepsCompleted: number;
    averageCraving: number;
  }): RecoveryInsight[] => {
    const insights: RecoveryInsight[] = [];

    // Mood trend insights
    if (data.moodTrend === 'improving') {
      insights.push({
        type: 'positive',
        title: 'Mood Improving',
        description:
          'Your mood has been trending upward over the past week. Keep up the great work!',
      });
    } else if (data.moodTrend === 'declining') {
      insights.push({
        type: 'warning',
        title: 'Mood Needs Attention',
        description:
          'Your mood has dipped recently. Consider reaching out to your support network or sponsor.',
      });
    }

    // Craving trend insights
    if (data.cravingTrend === 'improving') {
      insights.push({
        type: 'positive',
        title: 'Cravings Decreasing',
        description: 'Your cravings are trending downward. Your recovery work is paying off!',
      });
    } else if (data.cravingTrend === 'worsening') {
      insights.push({
        type: 'warning',
        title: 'Craving Alert',
        description:
          'Your cravings have increased. This is normal in recovery - use your emergency tools if needed.',
      });
    }

    // Streak insights
    if (data.checkInStreak >= 7) {
      insights.push({
        type: 'positive',
        title: `${data.checkInStreak} Day Check-in Streak`,
        description: 'Consistency is key to recovery. You are showing up for yourself every day!',
      });
    }

    if (data.journalStreak >= 3) {
      insights.push({
        type: 'positive',
        title: 'Journaling Habit Forming',
        description: `${data.journalStreak} days of journaling. Writing helps process emotions and track progress.`,
      });
    }

    // Step completion insights
    if (data.totalStepsCompleted > 0) {
      insights.push({
        type: 'positive',
        title: `Step ${data.totalStepsCompleted} Complete`,
        description:
          'You have completed step work. Each step moves you forward in your recovery journey.',
      });
    }

    // High craving alert
    if (data.averageCraving >= 6) {
      insights.push({
        type: 'warning',
        title: 'High Craving Levels',
        description:
          'Your average craving level is elevated. Consider attending a meeting or calling your sponsor.',
      });
    }

    // Default positive insight if nothing else
    if (insights.length === 0) {
      insights.push({
        type: 'neutral',
        title: 'Keep Going',
        description: 'Every day in recovery is progress. Continue checking in and doing the work.',
      });
    }

    return insights;
  };

  const loadAnalytics = useCallback(async (): Promise<void> => {
    if (!db || !isReady || !userId) return;

    try {
      setAnalytics((prev) => ({ ...prev, isLoading: true, error: null }));

      // Get check-ins for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      const checkIns = await db.getAllAsync<{
        check_in_date: string;
        encrypted_mood: string | null;
        encrypted_craving: string | null;
        check_in_type: string;
      }>(
        `SELECT check_in_date, encrypted_mood, encrypted_craving, check_in_type
         FROM daily_checkins
         WHERE user_id = ? AND check_in_date >= ?
         ORDER BY check_in_date ASC`,
        [userId, thirtyDaysAgoStr],
      );

      // Process mood data (decrypt and aggregate by date)
      const moodByDate = new Map<string, { moods: number[]; cravings: number[] }>();

      for (const checkIn of checkIns) {
        const date = checkIn.check_in_date;
        if (!moodByDate.has(date)) {
          moodByDate.set(date, { moods: [], cravings: [] });
        }

        const dateData = moodByDate.get(date)!;

        if (checkIn.encrypted_mood) {
          try {
            const decryptedMood = await decryptContent(checkIn.encrypted_mood);
            const mood = parseInt(decryptedMood, 10);
            if (!isNaN(mood) && mood >= 1 && mood <= 5) {
              dateData.moods.push(mood);
            }
          } catch {
            // Skip decryption errors
          }
        }

        if (checkIn.encrypted_craving) {
          try {
            const decryptedCraving = await decryptContent(checkIn.encrypted_craving);
            const craving = parseInt(decryptedCraving, 10);
            if (!isNaN(craving) && craving >= 0 && craving <= 10) {
              dateData.cravings.push(craving);
            }
          } catch {
            // Skip decryption errors
          }
        }
      }

      // Convert to data points
      const moodData: MoodDataPoint[] = [];
      for (const [date, data] of moodByDate) {
        const avgMood =
          data.moods.length > 0 ? data.moods.reduce((a, b) => a + b, 0) / data.moods.length : 3;
        const avgCraving =
          data.cravings.length > 0
            ? data.cravings.reduce((a, b) => a + b, 0) / data.cravings.length
            : 0;

        moodData.push({
          date,
          mood: Math.round(avgMood * 10) / 10,
          craving: Math.round(avgCraving * 10) / 10,
        });
      }

      // Calculate averages
      const averageMood =
        moodData.length > 0
          ? Math.round((moodData.reduce((sum, d) => sum + d.mood, 0) / moodData.length) * 10) / 10
          : 0;
      const averageCraving =
        moodData.length > 0
          ? Math.round((moodData.reduce((sum, d) => sum + d.craving, 0) / moodData.length) * 10) /
            10
          : 0;

      // Get step work progress (count completed questions per step)
      const stepWork = await db.getAllAsync<{
        step_number: number;
        answered: number;
      }>(
        `SELECT step_number, SUM(CASE WHEN is_complete = 1 THEN 1 ELSE 0 END) as answered
         FROM step_work WHERE user_id = ? GROUP BY step_number`,
        [userId],
      );

      const answeredMap = new Map<number, number>(
        stepWork.map((row) => [row.step_number, row.answered || 0]),
      );

      const stepProgress: StepProgress[] = [];
      for (let step = 1; step <= 12; step++) {
        const totalQuestions = STEP_TOTAL_QUESTIONS[step] || 0;
        const answeredQuestions = answeredMap.get(step) || 0;
        stepProgress.push({
          stepNumber: step,
          totalQuestions,
          answeredQuestions,
          isComplete: totalQuestions > 0 && answeredQuestions >= totalQuestions,
        });
      }

      const totalStepsStarted = stepProgress.filter((s) => s.answeredQuestions > 0).length;
      const totalStepsCompleted = stepProgress.filter((s) => s.isComplete).length;

      // Get journal stats
      const journalStats = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM journal_entries WHERE user_id = ?`,
        [userId],
      );
      const journalEntryCount = journalStats?.count || 0;

      // Calculate total words written (decrypt and count)
      let totalWordsWritten = 0;
      try {
        const journalEntries = await db.getAllAsync<{ encrypted_body: string }>(
          'SELECT encrypted_body FROM journal_entries WHERE user_id = ?',
          [userId],
        );
        for (const entry of journalEntries) {
          if (entry.encrypted_body) {
            try {
              const decrypted = await decryptContent(entry.encrypted_body);
              totalWordsWritten += decrypted.split(/\s+/).filter(Boolean).length;
            } catch {
              // Skip entries that fail to decrypt
            }
          }
        }
      } catch {
        // If word count fails, use 0 (non-critical)
      }

      // Calculate journal streak
      let journalStreak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        const entry = await db.getFirstAsync<{ id: string }>(
          `SELECT id FROM journal_entries WHERE user_id = ? AND DATE(created_at) = ?`,
          [userId, dateStr],
        );

        if (entry) {
          journalStreak++;
        } else if (i > 0) {
          break;
        }
      }

      // Calculate check-in streak
      let checkInStreak = 0;
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        const checkIn = await db.getFirstAsync<{ id: string }>(
          `SELECT id FROM daily_checkins WHERE user_id = ? AND check_in_date = ?`,
          [userId, dateStr],
        );

        if (checkIn) {
          checkInStreak++;
        } else if (i > 0) {
          break;
        }
      }

      // Calculate total check-ins
      const checkInTotal = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM daily_checkins WHERE user_id = ?`,
        [userId],
      );
      const totalCheckIns = checkInTotal?.count || 0;

      // Calculate trends
      const moodTrend = calculateMoodTrend(moodData);
      const cravingTrend = calculateCravingTrend(moodData);

      // Generate insights
      const insights = generateInsights({
        moodData,
        moodTrend,
        cravingTrend,
        checkInStreak,
        journalStreak,
        totalStepsCompleted,
        averageCraving,
      });

      setAnalytics({
        moodData,
        averageMood,
        averageCraving,
        moodTrend,
        cravingTrend,
        stepProgress,
        totalStepsStarted,
        totalStepsCompleted,
        journalEntryCount,
        journalStreak,
        totalWordsWritten,
        checkInStreak,
        totalCheckIns,
        insights,
        isLoading: false,
        error: null,
      });

      logger.info('Recovery analytics loaded', { userId, moodDataPoints: moodData.length });
    } catch (error) {
      logger.error('Failed to load recovery analytics', error);
      setAnalytics((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load analytics',
      }));
    }
  }, [db, isReady, userId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return analytics;
}
