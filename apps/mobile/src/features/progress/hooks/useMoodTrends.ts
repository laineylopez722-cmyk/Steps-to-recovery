/**
 * Mood Trends Hook
 * Fetches and analyzes mood/craving data from daily check-ins
 * with support for configurable time ranges and rolling averages.
 *
 * All data is decrypted client-side for privacy.
 */

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { decryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';

export type TimeRange = '7d' | '30d' | '90d';

export interface MoodDataPoint {
  date: string;
  mood: number; // 1-5
  craving: number; // 0-10
}

export interface MoodTrendData {
  daily: MoodDataPoint[];
  weeklyAverage: number;
  monthlyAverage: number;
  trend: 'improving' | 'stable' | 'declining';
  highestMoodDay: string;
  lowestMoodDay: string;
  averageCraving: number;
  cravingTrend: 'decreasing' | 'stable' | 'increasing';
  goodDayStreak: number;
  weekAvgMood: number;
  lastWeekAvgMood: number;
  weekAvgCraving: number;
  lastWeekAvgCraving: number;
}

function getDaysForRange(range: TimeRange): number {
  switch (range) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
  }
}

function calculateRollingAverage(
  data: MoodDataPoint[],
  field: 'mood' | 'craving',
  windowSize: number,
): number {
  if (data.length === 0) return 0;
  const window = data.slice(-windowSize);
  const sum = window.reduce((acc, d) => acc + d[field], 0);
  return Math.round((sum / window.length) * 10) / 10;
}

function calculateTrend(data: MoodDataPoint[]): 'improving' | 'stable' | 'declining' {
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
}

function calculateCravingTrend(data: MoodDataPoint[]): 'decreasing' | 'stable' | 'increasing' {
  if (data.length < 7) return 'stable';

  const recentWeek = data.slice(-7);
  const previousWeek = data.slice(-14, -7);

  if (previousWeek.length < 3) return 'stable';

  const recentAvg = recentWeek.reduce((sum, d) => sum + d.craving, 0) / recentWeek.length;
  const previousAvg = previousWeek.reduce((sum, d) => sum + d.craving, 0) / previousWeek.length;

  const diff = recentAvg - previousAvg;
  if (diff < -0.5) return 'decreasing';
  if (diff > 0.5) return 'increasing';
  return 'stable';
}

function calculateGoodDayStreak(data: MoodDataPoint[]): number {
  let streak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].mood >= 3) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function findExtremeDay(data: MoodDataPoint[], type: 'highest' | 'lowest'): string {
  if (data.length === 0) return '';
  let extremePoint = data[0];
  for (const point of data) {
    if (type === 'highest' && point.mood > extremePoint.mood) {
      extremePoint = point;
    } else if (type === 'lowest' && point.mood < extremePoint.mood) {
      extremePoint = point;
    }
  }
  return extremePoint.date;
}

function computeWeeklyAverages(
  data: MoodDataPoint[],
  field: 'mood' | 'craving',
): { current: number; previous: number } {
  const currentWeek = data.slice(-7);
  const previousWeek = data.slice(-14, -7);

  const currentAvg =
    currentWeek.length > 0
      ? Math.round((currentWeek.reduce((s, d) => s + d[field], 0) / currentWeek.length) * 10) / 10
      : 0;
  const previousAvg =
    previousWeek.length > 0
      ? Math.round((previousWeek.reduce((s, d) => s + d[field], 0) / previousWeek.length) * 10) / 10
      : 0;

  return { current: currentAvg, previous: previousAvg };
}

export function useMoodTrends(timeRange: TimeRange): {
  data: MoodTrendData | null;
  isLoading: boolean;
  error: string | null;
} {
  const { db, isReady } = useDatabase();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const fetchMoodData = useCallback(async (): Promise<MoodTrendData> => {
    if (!db || !isReady || !userId) {
      throw new Error('Database not ready');
    }

    const days = getDaysForRange(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const checkIns = await db.getAllAsync<{
      check_in_date: string;
      encrypted_mood: string | null;
      encrypted_craving: string | null;
    }>(
      `SELECT check_in_date, encrypted_mood, encrypted_craving
       FROM daily_checkins
       WHERE user_id = ? AND check_in_date >= ?
       ORDER BY check_in_date ASC`,
      [userId, startDateStr],
    );

    // Aggregate by date, decrypting values
    const byDate = new Map<string, { moods: number[]; cravings: number[] }>();

    for (const checkIn of checkIns) {
      const date = checkIn.check_in_date;
      if (!byDate.has(date)) {
        byDate.set(date, { moods: [], cravings: [] });
      }
      const dateData = byDate.get(date)!;

      if (checkIn.encrypted_mood) {
        try {
          const decryptedMood = await decryptContent(checkIn.encrypted_mood);
          const mood = parseInt(decryptedMood, 10);
          if (!isNaN(mood) && mood >= 1 && mood <= 5) {
            dateData.moods.push(mood);
          }
        } catch {
          logger.warn('Failed to decrypt mood value', { date });
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
          logger.warn('Failed to decrypt craving value', { date });
        }
      }
    }

    // Convert to daily data points
    const daily: MoodDataPoint[] = [];
    for (const [date, data] of byDate) {
      const avgMood =
        data.moods.length > 0
          ? Math.round((data.moods.reduce((a, b) => a + b, 0) / data.moods.length) * 10) / 10
          : 3;
      const avgCraving =
        data.cravings.length > 0
          ? Math.round((data.cravings.reduce((a, b) => a + b, 0) / data.cravings.length) * 10) / 10
          : 0;
      daily.push({ date, mood: avgMood, craving: avgCraving });
    }

    const weeklyAverage = calculateRollingAverage(daily, 'mood', 7);
    const monthlyAverage = calculateRollingAverage(daily, 'mood', 30);
    const trend = calculateTrend(daily);
    const cravingTrend = calculateCravingTrend(daily);
    const averageCraving = calculateRollingAverage(daily, 'craving', daily.length);
    const goodDayStreak = calculateGoodDayStreak(daily);
    const highestMoodDay = findExtremeDay(daily, 'highest');
    const lowestMoodDay = findExtremeDay(daily, 'lowest');

    const moodWeekly = computeWeeklyAverages(daily, 'mood');
    const cravingWeekly = computeWeeklyAverages(daily, 'craving');

    logger.info('Mood trends loaded', {
      userId,
      timeRange,
      dataPoints: daily.length,
    });

    return {
      daily,
      weeklyAverage,
      monthlyAverage,
      trend,
      highestMoodDay,
      lowestMoodDay,
      averageCraving,
      cravingTrend,
      goodDayStreak,
      weekAvgMood: moodWeekly.current,
      lastWeekAvgMood: moodWeekly.previous,
      weekAvgCraving: cravingWeekly.current,
      lastWeekAvgCraving: cravingWeekly.previous,
    };
  }, [db, isReady, userId, timeRange]);

  const query = useQuery({
    queryKey: ['mood-trends', userId, timeRange],
    queryFn: fetchMoodData,
    enabled: !!db && isReady && !!userId,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
  };
}
