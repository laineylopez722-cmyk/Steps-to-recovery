/**
 * Check-in Hook
 * Manages daily mood and craving tracking
 */

import { useEffect, useMemo } from 'react';
import { useCheckinStore } from '@recovery/shared';
import type { DailyCheckin } from '@recovery/shared';

export function useCheckin() {
  const {
    todayCheckin,
    history,
    isLoading,
    error,
    checkinStreak,
    averageMood,
    averageCraving,
    loadTodayCheckin,
    loadHistory,
    submitCheckin,
  } = useCheckinStore();

  // Load data on mount
  useEffect(() => {
    loadTodayCheckin();
    loadHistory(30);
  }, [loadTodayCheckin, loadHistory]);

  // Check if already checked in today
  const hasCheckedInToday = useMemo(() => {
    return todayCheckin?.isCheckedIn ?? false;
  }, [todayCheckin]);

  // Get mood trend (positive, negative, neutral)
  const moodTrend = useMemo(() => {
    if (history.length < 7) return 'neutral';

    const recentWeek = history.slice(0, 7).filter((c: DailyCheckin) => c.isCheckedIn);
    const previousWeek = history.slice(7, 14).filter((c: DailyCheckin) => c.isCheckedIn);

    if (recentWeek.length === 0 || previousWeek.length === 0) return 'neutral';

    const recentAvg =
      recentWeek.reduce((sum: number, c: DailyCheckin) => sum + c.mood, 0) / recentWeek.length;
    const previousAvg =
      previousWeek.reduce((sum: number, c: DailyCheckin) => sum + c.mood, 0) / previousWeek.length;

    if (recentAvg > previousAvg + 0.5) return 'positive';
    if (recentAvg < previousAvg - 0.5) return 'negative';
    return 'neutral';
  }, [history]);

  // Get craving trend
  const cravingTrend = useMemo(() => {
    if (history.length < 7) return 'neutral';

    const recentWeek = history.slice(0, 7).filter((c) => c.isCheckedIn);
    const previousWeek = history.slice(7, 14).filter((c) => c.isCheckedIn);

    if (recentWeek.length === 0 || previousWeek.length === 0) return 'neutral';

    const recentAvg = recentWeek.reduce((sum, c) => sum + c.cravingLevel, 0) / recentWeek.length;
    const previousAvg =
      previousWeek.reduce((sum, c) => sum + c.cravingLevel, 0) / previousWeek.length;

    // Lower cravings is positive
    if (recentAvg < previousAvg - 0.5) return 'positive';
    if (recentAvg > previousAvg + 0.5) return 'negative';
    return 'neutral';
  }, [history]);

  // Get check-in rate (percentage of days checked in)
  const checkinRate = useMemo(() => {
    if (history.length === 0) return 0;
    const checkedIn = history.filter((c) => c.isCheckedIn).length;
    return Math.round((checkedIn / history.length) * 100);
  }, [history]);

  return {
    todayCheckin,
    history,
    isLoading,
    error,
    hasCheckedInToday,
    checkinStreak,
    averageMood,
    averageCraving,
    moodTrend,
    cravingTrend,
    checkinRate,
    submitCheckin,
    loadHistory,
  };
}
