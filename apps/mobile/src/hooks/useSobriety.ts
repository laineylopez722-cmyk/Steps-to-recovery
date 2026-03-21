/**
 * Sobriety Hook
 *
 * Provides sobriety calculations, milestone tracking, and automatic
 * milestone celebration notifications.
 *
 * **Features**:
 * - Real-time sobriety duration calculation (updates every minute)
 * - Milestone detection and tracking
 * - Progress calculation to next milestone
 * - Automatic milestone celebration notifications
 * - Formatted duration display (days, months, years)
 *
 * @returns Sobriety state, calculations, and milestone information
 * @example
 * ```ts
 * const { soberDays, nextMilestone, formattedDuration } = useSobriety();
 * // Display: "45 days" or "1 year, 30 days"
 * ```
 */

import { useEffect, useMemo, useRef } from 'react';
import {
  useProfileStore,
  useSettingsStore,
  getNextMilestone,
  getLatestMilestone,
  getAchievedMilestones,
  scheduleMilestoneNotification,
} from '@/shared';
import type { AppSettings, TimeMilestone } from '@/shared';

/** Sobriety profile type derived from the profile store */
type ProfileType = ReturnType<typeof useProfileStore.getState>['profile'];

/** Program type for profile creation */
type ProgramType = '12-step-aa' | '12-step-na' | 'smart' | 'custom';

interface UseSobrietyReturn {
  profile: ProfileType;
  soberDays: number;
  soberHours: number;
  soberMinutes: number;
  isLoading: boolean;
  createProfile: (sobrietyDate: Date, programType: ProgramType, displayName?: string) => Promise<void>;
  updateProfile: (updates: Partial<{ sobrietyDate: Date; programType: ProgramType; displayName: string }>) => Promise<void>;
  nextMilestone: TimeMilestone | null;
  latestMilestone: TimeMilestone | null;
  achievedMilestones: readonly TimeMilestone[];
  daysUntilNextMilestone: number | null;
  progressToNextMilestone: number;
  formattedDuration: string;
}

/**
 * Sobriety calculation and milestone tracking hook
 *
 * Automatically recalculates sobriety duration every minute and
 * triggers milestone celebrations when new milestones are achieved.
 *
 * @returns Object with sobriety state, calculations, and milestones
 */
export function useSobriety(): UseSobrietyReturn {
  const {
    profile,
    soberDays,
    soberHours,
    soberMinutes,
    isLoading,
    loadProfile,
    createProfile,
    updateProfile,
    calculateSobriety,
  } = useProfileStore();

  const appSettings = useSettingsStore((state): AppSettings | null => state.settings);
  const previousMilestoneCountRef = useRef<number | null>(null);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Recalculate sobriety every minute
  useEffect(() => {
    const interval = setInterval(() => {
      calculateSobriety();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [calculateSobriety]);

  // Check for new milestones and celebrate
  useEffect(() => {
    if (!profile || !appSettings?.notificationsEnabled) return;

    const achievedCount = getAchievedMilestones(soberDays).length;

    // Only trigger if we have a previous count and the count has increased
    if (
      previousMilestoneCountRef.current !== null &&
      achievedCount > previousMilestoneCountRef.current
    ) {
      const latestAchieved = getLatestMilestone(soberDays);
      if (latestAchieved) {
        // Trigger milestone celebration notification
        scheduleMilestoneNotification(latestAchieved.title, latestAchieved.days);
      }
    }

    previousMilestoneCountRef.current = achievedCount;
  }, [soberDays, profile, appSettings?.notificationsEnabled]);

  // Computed milestone info
  const nextMilestone = useMemo(() => getNextMilestone(soberDays), [soberDays]);
  const latestMilestone = useMemo(() => getLatestMilestone(soberDays), [soberDays]);
  const achievedMilestones = useMemo(() => getAchievedMilestones(soberDays), [soberDays]);

  // Days until next milestone
  const daysUntilNextMilestone = useMemo(() => {
    if (!nextMilestone) return null;
    return nextMilestone.days - soberDays;
  }, [nextMilestone, soberDays]);

  // Progress percentage to next milestone
  const progressToNextMilestone = useMemo(() => {
    if (!nextMilestone || !latestMilestone) return 0;
    const totalDays = nextMilestone.days - latestMilestone.days;
    const currentDays = soberDays - latestMilestone.days;
    return Math.round((currentDays / totalDays) * 100);
  }, [nextMilestone, latestMilestone, soberDays]);

  // Format sobriety duration
  const formattedDuration = useMemo(() => {
    if (soberDays >= 365) {
      const years = Math.floor(soberDays / 365);
      const remainingDays = soberDays % 365;
      if (remainingDays === 0) {
        return `${years} year${years > 1 ? 's' : ''}`;
      }
      return `${years} year${years > 1 ? 's' : ''}, ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
    }
    if (soberDays >= 30) {
      const months = Math.floor(soberDays / 30);
      const remainingDays = soberDays % 30;
      if (remainingDays === 0) {
        return `${months} month${months > 1 ? 's' : ''}`;
      }
      return `${months} month${months > 1 ? 's' : ''}, ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
    }
    return `${soberDays} day${soberDays !== 1 ? 's' : ''}`;
  }, [soberDays]);

  return {
    profile,
    soberDays,
    soberHours,
    soberMinutes,
    isLoading,
    createProfile,
    updateProfile,
    nextMilestone,
    latestMilestone,
    achievedMilestones,
    daysUntilNextMilestone,
    progressToNextMilestone,
    formattedDuration,
  };
}
