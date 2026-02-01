/**
 * Achievement Hook
 * Provides achievement data and automatic checking functionality
 */

import { useEffect, useCallback } from 'react';
import { useAchievementStore, type AchievementContext } from '@recovery/shared';
import { useSobriety } from './useSobriety';
import { useCheckin } from './useCheckin';
import { logger } from '../utils/logger';
import {
  useContactStore,
  useMeetingStore,
  useRegularMeetingStore,
  useStepWorkStore,
  useTenthStepStore,
  usePhoneStore,
} from '@recovery/shared';
import { getReadingStreak } from '@recovery/shared';
import type { StepProgress, MeetingLog } from '@recovery/shared';

/**
 * Hook for managing and checking achievements
 */
export function useAchievements() {
  const {
    achievements,
    keytags,
    isLoading,
    isInitialized,
    totalUnlocked,
    totalAchievements,
    totalKeytags,
    earnedKeytags,
    recentUnlock,
    categoryProgress,
    initialize,
    loadAchievements,
    updateKeytagsForDays,
    checkAutoAchievements,
    selfCheckAchievement,
    saveReflection,
    getReflection,
    dismissRecentUnlock,
    getAchievementsByCategory,
  } = useAchievementStore();

  const { soberDays } = useSobriety();
  const { checkinStreak } = useCheckin();
  const { contacts } = useContactStore();
  const { meetings } = useMeetingStore();
  const { meetings: regularMeetings } = useRegularMeetingStore();
  const { progress } = useStepWorkStore();
  const { currentStreak: tenthStepStreak } = useTenthStepStore();
  const { callHistory } = usePhoneStore();

  // Initialize achievements on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Update keytags when sober days change
  useEffect(() => {
    if (soberDays >= 0) {
      updateKeytagsForDays(soberDays);
    }
  }, [soberDays, updateKeytagsForDays]);

  /**
   * Build the achievement context from current app state
   */
  const buildContext = useCallback(async (): Promise<AchievementContext> => {
    // Count contacts
    const contactsCount = contacts.length;
    const hasSponsor = contacts.some((c) => c.role === 'sponsor');

    // Check for home group
    const hasHomeGroup = regularMeetings.some((m) => m.isHomeGroup);

    // Count meetings
    const meetingsCount = meetings.length;

    // Calculate meetings in first 90 days (if applicable)
    let meetingsInFirst90Days = 0;
    if (soberDays >= 90) {
      // Placeholder: assume all logged meetings count until start-date tracking is added
      meetingsInFirst90Days = meetings.length;
    }

    // Get reading streak
    let readingStreak = 0;
    try {
      readingStreak = await getReadingStreak();
    } catch (error) {
      logger.error('Failed to get reading streak', error);
    }

    // Calculate step progress
    const stepProgressMap: Record<number, { answered: number; total: number }> = {};
    for (let step = 1; step <= 12; step++) {
      const stepEntry = progress.find((p: StepProgress) => p.stepNumber === step);
      stepProgressMap[step] = {
        answered: stepEntry?.questionsAnswered || 0,
        total: stepEntry?.totalQuestions || 10, // Default to 10 questions per step
      };
    }

    // Count phone therapy days (days with 3+ calls)
    // Group call history by date and count days with 3+ calls
    const callsByDate: Record<string, number> = {};
    callHistory.forEach((call) => {
      const dateStr = new Date(call.calledAt).toISOString().split('T')[0];
      callsByDate[dateStr] = (callsByDate[dateStr] || 0) + 1;
    });
    const phoneTherapyDays = Object.values(callsByDate).filter((count) => count >= 3).length;

    // Count meetings with shares
    const meetingsWithShares = meetings.filter((m: MeetingLog) => m.didShare).length;

    // Tenth step streak - from the tenth step store
    // (tenthStepStreak is already calculated from store hook above)

    // Gratitude streak - check daily checkins that have gratitude entries
    // For now, we'll use the checkin streak as a proxy since check-ins often include gratitude
    const gratitudeStreak = checkinStreak;

    return {
      soberDays,
      contactsCount,
      hasSponsor,
      hasHomeGroup,
      meetingsCount,
      meetingsInFirst90Days,
      checkinStreak,
      readingStreak,
      tenthStepStreak,
      gratitudeStreak,
      phoneTherapyDays,
      stepProgress: stepProgressMap,
      meetingsWithShares,
    };
  }, [
    soberDays,
    contacts,
    meetings,
    regularMeetings,
    checkinStreak,
    progress,
    tenthStepStreak,
    callHistory,
  ]);

  /**
   * Check all automatic achievements
   */
  const checkAchievements = useCallback(async () => {
    if (!isInitialized) return [];

    const context = await buildContext();
    return checkAutoAchievements(context);
  }, [isInitialized, buildContext, checkAutoAchievements]);

  /**
   * Trigger achievement check - call this after significant actions
   */
  const triggerCheck = useCallback(async () => {
    const newlyUnlocked = await checkAchievements();
    return newlyUnlocked;
  }, [checkAchievements]);

  /**
   * Get unlocked achievements
   */
  const unlockedAchievements = achievements.filter((a) => a.status === 'unlocked');

  /**
   * Get in-progress achievements
   */
  const inProgressAchievements = achievements.filter((a) => a.status === 'in_progress');

  /**
   * Get locked achievements
   */
  const lockedAchievements = achievements.filter((a) => a.status === 'locked');

  /**
   * Get next keytag to earn
   */
  const nextKeytag = keytags.find((k) => !k.isEarned);

  /**
   * Get most recently earned keytag
   */
  const currentKeytag = [...keytags].reverse().find((k) => k.isEarned);

  return {
    // State
    achievements,
    keytags,
    isLoading,
    isInitialized,
    totalUnlocked,
    totalAchievements,
    totalKeytags,
    earnedKeytags,
    recentUnlock,
    categoryProgress,

    // Computed
    unlockedAchievements,
    inProgressAchievements,
    lockedAchievements,
    nextKeytag,
    currentKeytag,

    // Actions
    loadAchievements,
    checkAchievements,
    triggerCheck,
    selfCheckAchievement,
    saveReflection,
    getReflection,
    dismissRecentUnlock,
    getAchievementsByCategory,
  };
}
