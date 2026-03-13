/**
 * Daily Reading Hook
 * Provides daily reading data and actions for UI components
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useReadingStore } from '../store/readingStore';
import type { DailyReading, DailyReadingReflection } from '../types';

interface UseReadingReturn {
  todayReading: DailyReading | null;
  todayReflection: DailyReadingReflection | null;
  reflections: DailyReadingReflection[];
  readingStreak: number;
  isLoading: boolean;
  error: string | null;
  hasReflectedToday: boolean;
  formattedDate: string;
  shortDate: string;
  readingPreview: string;
  streakMessage: string;
  loadTodayReading: () => Promise<void>;
  loadReflections: () => Promise<void>;
  submitReflection: (reflection: string) => Promise<DailyReadingReflection>;
  getReading: (date: Date) => Promise<DailyReading | null>;
  getReflection: (date: Date) => Promise<DailyReadingReflection | null>;
  decryptReflection: (reflection: DailyReadingReflection) => Promise<string>;
  formatSource: (source: string) => string;
  hasReflectionForDate: (date: Date) => boolean;
}

export function useReading(): UseReadingReturn {
  const {
    todayReading,
    todayReflection,
    reflections,
    readingStreak,
    isLoading,
    error,
    loadTodayReading,
    loadReflections,
    saveReflection,
    getReadingForDate,
    getReflectionForDate,
    decryptReflectionContent,
    hasReflectedToday,
  } = useReadingStore();

  // Load today's reading on mount
  useEffect(() => {
    loadTodayReading();
  }, []);

  // Has reflected today
  const reflected = useMemo(() => hasReflectedToday(), [todayReflection]);

  // Get formatted date for display
  const formattedDate = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Get short date (Nov 25)
  const shortDate = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Get reading preview (first 150 chars)
  const readingPreview = useMemo(() => {
    if (!todayReading) return '';
    const content = todayReading.content;
    if (content.length <= 150) return content;
    return content.substring(0, 150).trim() + '...';
  }, [todayReading]);

  // Get streak message
  const streakMessage = useMemo(() => {
    if (readingStreak === 0) return 'Start your streak today!';
    if (readingStreak === 1) return '1 day streak';
    if (readingStreak < 7) return `${readingStreak} day streak`;
    if (readingStreak < 30) return `${readingStreak} day streak - Keep it up!`;
    if (readingStreak < 90) return `${readingStreak} day streak - Amazing!`;
    return `${readingStreak} day streak - Incredible dedication!`;
  }, [readingStreak]);

  // Save reflection wrapper
  const submitReflection = useCallback(
    async (reflection: string): Promise<DailyReadingReflection> => {
      if (!reflection.trim()) {
        throw new Error('Reflection cannot be empty');
      }
      return saveReflection(reflection.trim());
    },
    [saveReflection],
  );

  // Get reading for specific date
  const getReading = useCallback(
    async (date: Date): Promise<DailyReading | null> => {
      return getReadingForDate(date);
    },
    [getReadingForDate],
  );

  // Get reflection for specific date (async)
  const getReflection = useCallback(
    async (date: Date): Promise<DailyReadingReflection | null> => {
      return getReflectionForDate(date);
    },
    [getReflectionForDate],
  );

  // Decrypt reflection content
  const decryptReflection = useCallback(
    async (reflection: DailyReadingReflection): Promise<string> => {
      return decryptReflectionContent(reflection);
    },
    [decryptReflectionContent],
  );

  // Format reading source
  const formatSource = useCallback((source: string): string => {
    switch (source) {
      case 'jft':
        return 'Just for Today';
      case 'daily_reflections':
        return 'Daily Reflections';
      case 'custom':
        return 'Custom Reading';
      default:
        return source;
    }
  }, []);

  // Check if a date has a reflection
  const hasReflectionForDate = useCallback(
    (date: Date): boolean => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${month}-${day}`;

      return reflections.some((r) => r.readingDate === dateKey);
    },
    [reflections],
  );

  return {
    // State
    todayReading,
    todayReflection,
    reflections,
    readingStreak,
    isLoading,
    error,

    // Computed
    hasReflectedToday: reflected,
    formattedDate,
    shortDate,
    readingPreview,
    streakMessage,

    // Actions
    loadTodayReading,
    loadReflections,
    submitReflection,
    getReading,
    getReflection,
    decryptReflection,

    // Utilities
    formatSource,
    hasReflectionForDate,
  };
}
