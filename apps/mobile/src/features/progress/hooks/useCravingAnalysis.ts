/**
 * Craving Analysis Hook
 *
 * Fetches craving data from daily_checkins and craving_surf_sessions,
 * decrypts values, calculates patterns (peak times, trends, heatmap),
 * and generates human-readable insights.
 *
 * All data is decrypted client-side for privacy.
 */

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { decryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import type { TimeRange } from './useMoodTrends';
import type {
  CravingDataPoint,
  CravingPattern,
  CravingHeatmapData,
  CravingSurfSummary,
} from '../types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

function getHourLabel(hour: number): string {
  if (hour === 0) return '12AM';
  if (hour < 12) return `${hour}AM`;
  if (hour === 12) return '12PM';
  return `${hour - 12}PM`;
}

function getTimeBlock(hour: number): string {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function buildHeatmap(dataPoints: CravingDataPoint[]): CravingHeatmapData[] {
  const grid = new Map<string, { total: number; count: number }>();

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      grid.set(`${day}-${hour}`, { total: 0, count: 0 });
    }
  }

  for (const point of dataPoints) {
    const key = `${point.dayOfWeek}-${point.hourOfDay}`;
    const cell = grid.get(key);
    if (cell) {
      cell.total += point.intensity;
      cell.count += 1;
    }
  }

  const heatmap: CravingHeatmapData[] = [];
  for (const [key, value] of grid) {
    const [day, hour] = key.split('-').map(Number);
    heatmap.push({
      dayOfWeek: day,
      hourOfDay: hour,
      averageIntensity: value.count > 0 ? Math.round((value.total / value.count) * 10) / 10 : 0,
      count: value.count,
    });
  }

  return heatmap;
}

function findPeakHour(heatmap: CravingHeatmapData[]): number {
  const hourAverages = new Map<number, { total: number; count: number }>();

  for (const cell of heatmap) {
    if (cell.count === 0) continue;
    const existing = hourAverages.get(cell.hourOfDay) ?? { total: 0, count: 0 };
    existing.total += cell.averageIntensity * cell.count;
    existing.count += cell.count;
    hourAverages.set(cell.hourOfDay, existing);
  }

  let peakHour = 0;
  let peakAvg = 0;
  for (const [hour, data] of hourAverages) {
    const avg = data.count > 0 ? data.total / data.count : 0;
    if (avg > peakAvg) {
      peakAvg = avg;
      peakHour = hour;
    }
  }

  return peakHour;
}

function findPeakDay(heatmap: CravingHeatmapData[]): string {
  const dayAverages = new Map<number, { total: number; count: number }>();

  for (const cell of heatmap) {
    if (cell.count === 0) continue;
    const existing = dayAverages.get(cell.dayOfWeek) ?? { total: 0, count: 0 };
    existing.total += cell.averageIntensity * cell.count;
    existing.count += cell.count;
    dayAverages.set(cell.dayOfWeek, existing);
  }

  let peakDay = 0;
  let peakAvg = 0;
  for (const [day, data] of dayAverages) {
    const avg = data.count > 0 ? data.total / data.count : 0;
    if (avg > peakAvg) {
      peakAvg = avg;
      peakDay = day;
    }
  }

  return DAY_NAMES[peakDay];
}

function findHighRiskTimes(heatmap: CravingHeatmapData[]): string[] {
  const threshold = 5;
  const riskWindows: string[] = [];

  // Group consecutive high-intensity hours by day
  for (let day = 0; day < 7; day++) {
    const dayCells = heatmap
      .filter((c) => c.dayOfWeek === day && c.averageIntensity >= threshold && c.count > 0)
      .sort((a, b) => a.hourOfDay - b.hourOfDay);

    if (dayCells.length === 0) continue;

    let startHour = dayCells[0].hourOfDay;
    let endHour = startHour;

    for (let i = 1; i < dayCells.length; i++) {
      if (dayCells[i].hourOfDay === endHour + 1) {
        endHour = dayCells[i].hourOfDay;
      } else {
        riskWindows.push(
          `${DAY_NAMES[day]} ${getHourLabel(startHour)}-${getHourLabel(endHour + 1)}`,
        );
        startHour = dayCells[i].hourOfDay;
        endHour = startHour;
      }
    }
    riskWindows.push(`${DAY_NAMES[day]} ${getHourLabel(startHour)}-${getHourLabel(endHour + 1)}`);
  }

  return riskWindows.slice(0, 5);
}

function calculateTrend(dataPoints: CravingDataPoint[]): {
  trend: 'decreasing' | 'stable' | 'increasing';
  weeklyChange: number;
} {
  if (dataPoints.length < 7) return { trend: 'stable', weeklyChange: 0 };

  const sorted = [...dataPoints].sort((a, b) => a.date.localeCompare(b.date));
  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);

  const firstAvg =
    firstHalf.length > 0
      ? firstHalf.reduce((sum, p) => sum + p.intensity, 0) / firstHalf.length
      : 0;
  const secondAvg =
    secondHalf.length > 0
      ? secondHalf.reduce((sum, p) => sum + p.intensity, 0) / secondHalf.length
      : 0;

  const change = firstAvg > 0 ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100) : 0;

  let trend: 'decreasing' | 'stable' | 'increasing' = 'stable';
  if (change < -10) trend = 'decreasing';
  else if (change > 10) trend = 'increasing';

  return { trend, weeklyChange: change };
}

function generateInsights(
  pattern: CravingPattern,
  surfSummary: CravingSurfSummary,
  dataPoints: CravingDataPoint[],
): string[] {
  const insights: string[] = [];

  // Peak time insight
  if (dataPoints.length >= 3) {
    const peakBlock = getTimeBlock(findPeakHour(buildHeatmap(dataPoints)));
    insights.push(
      `Your cravings tend to peak on ${pattern.peakDay} ${peakBlock}s around ${getHourLabel(findPeakHour(buildHeatmap(dataPoints)))}`,
    );
  }

  // Trend insight
  if (pattern.trend === 'decreasing') {
    insights.push(
      `Your average craving intensity decreased ${Math.abs(pattern.weeklyChange)}% recently — great progress!`,
    );
  } else if (pattern.trend === 'increasing') {
    insights.push(
      `Your cravings have increased ${Math.abs(pattern.weeklyChange)}% — consider reaching out to your support network`,
    );
  }

  // Surf sessions insight
  if (surfSummary.totalSessions > 0) {
    insights.push(
      `You've successfully surfed ${surfSummary.totalSessions} craving${surfSummary.totalSessions === 1 ? '' : 's'} this month`,
    );
  }

  // Surf success rate
  if (surfSummary.totalSessions >= 3 && surfSummary.successRate >= 70) {
    insights.push(
      `${surfSummary.successRate}% of your craving surf sessions ended with lower intensity — you're getting stronger!`,
    );
  }

  // Most effective technique
  if (surfSummary.mostEffectiveTechnique) {
    insights.push(
      `"${surfSummary.mostEffectiveTechnique}" seems to work best for managing your cravings`,
    );
  }

  // Low morning cravings
  const morningPoints = dataPoints.filter((p) => p.hourOfDay >= 5 && p.hourOfDay < 12);
  if (morningPoints.length > 0) {
    const morningAvg = morningPoints.reduce((s, p) => s + p.intensity, 0) / morningPoints.length;
    if (morningAvg <= 2) {
      insights.push('Morning cravings are rare for you — your routine is working');
    }
  }

  // Low overall average
  if (pattern.averageIntensity <= 2 && dataPoints.length >= 7) {
    insights.push('Your craving levels are consistently low — keep up the amazing work!');
  }

  // Default if no insights
  if (insights.length === 0) {
    insights.push('Keep logging your cravings to discover patterns and track your progress');
  }

  return insights;
}

export interface UseCravingAnalysisReturn {
  pattern: CravingPattern | null;
  heatmap: CravingHeatmapData[];
  surfSummary: CravingSurfSummary | null;
  dataPoints: CravingDataPoint[];
  isLoading: boolean;
  error: string | null;
}

export function useCravingAnalysis(timeRange: TimeRange): UseCravingAnalysisReturn {
  const { db, isReady } = useDatabase();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const fetchCravingData = useCallback(async (): Promise<{
    pattern: CravingPattern;
    heatmap: CravingHeatmapData[];
    surfSummary: CravingSurfSummary;
    dataPoints: CravingDataPoint[];
  }> => {
    if (!db || !isReady || !userId) {
      throw new Error('Database not ready');
    }

    const days = getDaysForRange(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Fetch check-in craving data
    const checkIns = await db.getAllAsync<{
      check_in_date: string;
      created_at: string;
      encrypted_craving: string | null;
    }>(
      `SELECT check_in_date, created_at, encrypted_craving
       FROM daily_checkins
       WHERE user_id = ? AND check_in_date >= ? AND encrypted_craving IS NOT NULL
       ORDER BY created_at ASC`,
      [userId, startDateStr],
    );

    const dataPoints: CravingDataPoint[] = [];

    for (const checkIn of checkIns) {
      if (!checkIn.encrypted_craving) continue;
      try {
        const decrypted = await decryptContent(checkIn.encrypted_craving);
        const intensity = parseInt(decrypted, 10);
        if (isNaN(intensity) || intensity < 0 || intensity > 10) continue;

        const createdDate = new Date(checkIn.created_at);
        dataPoints.push({
          date: checkIn.check_in_date,
          time: `${createdDate.getHours().toString().padStart(2, '0')}:${createdDate.getMinutes().toString().padStart(2, '0')}`,
          intensity,
          dayOfWeek: createdDate.getDay(),
          hourOfDay: createdDate.getHours(),
        });
      } catch {
        logger.warn('Failed to decrypt craving value', { date: checkIn.check_in_date });
      }
    }

    // Fetch craving surf session data
    const surfSessions = await db.getAllAsync<{
      id: string;
      encrypted_initial_rating: string;
      encrypted_final_rating: string | null;
      encrypted_distraction_used: string | null;
      started_at: string;
    }>(
      `SELECT id, encrypted_initial_rating, encrypted_final_rating, encrypted_distraction_used, started_at
       FROM craving_surf_sessions
       WHERE user_id = ? AND created_at >= ?
       ORDER BY created_at ASC`,
      [userId, startDateStr],
    );

    // Add surf session initial ratings as data points
    for (const session of surfSessions) {
      try {
        const initialDecrypted = await decryptContent(session.encrypted_initial_rating);
        const initial = parseInt(initialDecrypted, 10);
        if (isNaN(initial) || initial < 0 || initial > 10) continue;

        const sessionDate = new Date(session.started_at);
        dataPoints.push({
          date: sessionDate.toISOString().split('T')[0],
          time: `${sessionDate.getHours().toString().padStart(2, '0')}:${sessionDate.getMinutes().toString().padStart(2, '0')}`,
          intensity: initial,
          dayOfWeek: sessionDate.getDay(),
          hourOfDay: sessionDate.getHours(),
        });
      } catch {
        logger.warn('Failed to decrypt surf session rating', { sessionId: session.id });
      }
    }

    // Calculate surf summary
    let totalSessions = 0;
    let successCount = 0;
    let totalReduction = 0;
    const techniqueReductions = new Map<string, { total: number; count: number }>();

    for (const session of surfSessions) {
      try {
        const initialDecrypted = await decryptContent(session.encrypted_initial_rating);
        const initial = parseInt(initialDecrypted, 10);
        if (isNaN(initial)) continue;

        totalSessions++;

        if (session.encrypted_final_rating) {
          const finalDecrypted = await decryptContent(session.encrypted_final_rating);
          const final_ = parseInt(finalDecrypted, 10);
          if (!isNaN(final_)) {
            const reduction = initial - final_;
            totalReduction += reduction;
            if (final_ < initial) successCount++;

            if (session.encrypted_distraction_used) {
              const technique = await decryptContent(session.encrypted_distraction_used);
              const existing = techniqueReductions.get(technique) ?? { total: 0, count: 0 };
              existing.total += reduction;
              existing.count += 1;
              techniqueReductions.set(technique, existing);
            }
          }
        }
      } catch {
        logger.warn('Failed to process surf session', { sessionId: session.id });
      }
    }

    // Find most effective technique
    let mostEffectiveTechnique: string | null = null;
    let bestAvgReduction = 0;
    for (const [technique, data] of techniqueReductions) {
      const avg = data.count > 0 ? data.total / data.count : 0;
      if (avg > bestAvgReduction) {
        bestAvgReduction = avg;
        mostEffectiveTechnique = technique;
      }
    }

    // Format technique name for display
    if (mostEffectiveTechnique) {
      mostEffectiveTechnique = mostEffectiveTechnique
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    const surfSummary: CravingSurfSummary = {
      totalSessions,
      averageReduction:
        totalSessions > 0 ? Math.round((totalReduction / totalSessions) * 10) / 10 : 0,
      successRate: totalSessions > 0 ? Math.round((successCount / totalSessions) * 100) : 0,
      mostEffectiveTechnique,
    };

    // Build heatmap and pattern
    const heatmap = buildHeatmap(dataPoints);
    const peakHour = findPeakHour(heatmap);
    const peakDay = findPeakDay(heatmap);
    const highRiskTimes = findHighRiskTimes(heatmap);
    const { trend, weeklyChange } = calculateTrend(dataPoints);
    const averageIntensity =
      dataPoints.length > 0
        ? Math.round((dataPoints.reduce((s, p) => s + p.intensity, 0) / dataPoints.length) * 10) /
          10
        : 0;

    const pattern: CravingPattern = {
      peakHour,
      peakDay,
      averageIntensity,
      highRiskTimes,
      trend,
      weeklyChange,
      insights: [],
    };

    pattern.insights = generateInsights(pattern, surfSummary, dataPoints);

    logger.info('Craving analysis loaded', {
      userId,
      timeRange,
      dataPoints: dataPoints.length,
      surfSessions: totalSessions,
    });

    return { pattern, heatmap, surfSummary, dataPoints };
  }, [db, isReady, userId, timeRange]);

  const query = useQuery({
    queryKey: ['craving-analysis', userId, timeRange],
    queryFn: fetchCravingData,
    enabled: !!db && isReady && !!userId,
  });

  return {
    pattern: query.data?.pattern ?? null,
    heatmap: query.data?.heatmap ?? [],
    surfSummary: query.data?.surfSummary ?? null,
    dataPoints: query.data?.dataPoints ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
  };
}
