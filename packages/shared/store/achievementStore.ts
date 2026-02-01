/**
 * Achievement Store
 * Manages achievements, keytags, and unlock celebrations
 */

import { create } from 'zustand';
import {
  initializeAchievements,
  getAchievements,
  getAchievementById,
  updateAchievementProgress,
  unlockAchievement as unlockAchievementInDb,
  saveAchievementReflection,
  getAchievementReflection,
  getTotalUnlockedCount,
  getUnlockedCountByCategory,
} from '../db/models';
import {
  KEYTAGS,
  getKeytagsWithStatus,
  getEarnedKeytagsCount,
  type KeytagWithStatus,
} from '../constants/keytags';
import { ALL_ACHIEVEMENTS, getTotalAchievementsCount } from '../constants/achievements';
import type { Achievement, AchievementCategory } from '../types';

interface AchievementState {
  achievements: Achievement[];
  keytags: KeytagWithStatus[];
  isLoading: boolean;
  isInitialized: boolean;
  totalUnlocked: number;
  totalAchievements: number;
  totalKeytags: number;
  earnedKeytags: number;
  recentUnlock: Achievement | null;
  categoryProgress: Record<AchievementCategory, { unlocked: number; total: number }>;
}

interface AchievementActions {
  initialize: () => Promise<void>;
  loadAchievements: () => Promise<void>;
  updateKeytagsForDays: (days: number) => void;
  checkAutoAchievements: (context: AchievementContext) => Promise<Achievement[]>;
  selfCheckAchievement: (id: string) => Promise<Achievement | null>;
  saveReflection: (id: string, reflection: string) => Promise<void>;
  getReflection: (id: string) => Promise<string | null>;
  dismissRecentUnlock: () => void;
  getAchievementsByCategory: (category: AchievementCategory) => Achievement[];
  refreshProgress: () => Promise<void>;
}

/**
 * Context for checking automatic achievements
 */
export interface AchievementContext {
  soberDays: number;
  contactsCount: number;
  hasSponsor: boolean;
  hasHomeGroup: boolean;
  meetingsCount: number;
  meetingsInFirst90Days?: number;
  checkinStreak: number;
  readingStreak: number;
  tenthStepStreak: number;
  gratitudeStreak: number;
  phoneTherapyDays: number;
  stepProgress: Record<number, { answered: number; total: number }>;
  meetingsWithShares: number;
}

export const useAchievementStore = create<AchievementState & AchievementActions>((set, get) => ({
  achievements: [],
  keytags: [],
  isLoading: false,
  isInitialized: false,
  totalUnlocked: 0,
  totalAchievements: getTotalAchievementsCount(),
  totalKeytags: KEYTAGS.length,
  earnedKeytags: 0,
  recentUnlock: null,
  categoryProgress: {
    keytags: { unlocked: 0, total: KEYTAGS.length },
    fellowship: { unlocked: 0, total: 0 },
    step_work: { unlocked: 0, total: 0 },
    service: { unlocked: 0, total: 0 },
    daily_practice: { unlocked: 0, total: 0 },
  },

  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });
    try {
      // Initialize achievements in database
      await initializeAchievements();

      // Load achievements
      await get().loadAchievements();

      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      console.error('Failed to initialize achievements:', error);
      set({ isLoading: false });
    }
  },

  loadAchievements: async () => {
    set({ isLoading: true });
    try {
      const achievements = await getAchievements();
      const totalUnlocked = await getTotalUnlockedCount();

      // Calculate category progress
      const categoryProgress = {
        keytags: { unlocked: get().earnedKeytags, total: KEYTAGS.length },
        fellowship: {
          unlocked: await getUnlockedCountByCategory('fellowship'),
          total: ALL_ACHIEVEMENTS.filter((a) => a.category === 'fellowship').length,
        },
        step_work: {
          unlocked: await getUnlockedCountByCategory('step_work'),
          total: ALL_ACHIEVEMENTS.filter((a) => a.category === 'step_work').length,
        },
        service: {
          unlocked: await getUnlockedCountByCategory('service'),
          total: ALL_ACHIEVEMENTS.filter((a) => a.category === 'service').length,
        },
        daily_practice: {
          unlocked: await getUnlockedCountByCategory('daily_practice'),
          total: ALL_ACHIEVEMENTS.filter((a) => a.category === 'daily_practice').length,
        },
      };

      set({
        achievements,
        totalUnlocked,
        categoryProgress,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load achievements:', error);
      set({ isLoading: false });
    }
  },

  updateKeytagsForDays: (days: number) => {
    const keytags = getKeytagsWithStatus(days);
    const earnedKeytags = getEarnedKeytagsCount(days);

    set((state) => ({
      keytags,
      earnedKeytags,
      categoryProgress: {
        ...state.categoryProgress,
        keytags: { unlocked: earnedKeytags, total: KEYTAGS.length },
      },
    }));
  },

  checkAutoAchievements: async (context: AchievementContext) => {
    const { achievements } = get();
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of achievements) {
      if (achievement.status === 'unlocked') continue;

      const shouldUnlock = checkAchievementCondition(achievement, context);

      if (shouldUnlock) {
        const updated = await unlockAchievementInDb(achievement.id);
        if (updated) {
          newlyUnlocked.push(updated);
        }
      } else {
        // Update progress for progressive achievements
        const progress = getAchievementProgress(achievement, context);
        if (progress !== null && progress !== achievement.current) {
          await updateAchievementProgress(achievement.id, progress, achievement.target);
        }
      }
    }

    // Reload achievements if any were updated
    if (newlyUnlocked.length > 0) {
      await get().loadAchievements();

      // Set the most recent unlock for celebration
      set({ recentUnlock: newlyUnlocked[newlyUnlocked.length - 1] });
    }

    return newlyUnlocked;
  },

  selfCheckAchievement: async (id: string) => {
    try {
      const achievement = await getAchievementById(id);

      if (!achievement || achievement.unlockType !== 'self_check') {
        return null;
      }

      const updated = await unlockAchievementInDb(id);

      if (updated) {
        await get().loadAchievements();
        set({ recentUnlock: updated });
      }

      return updated;
    } catch (error) {
      console.error('Failed to self-check achievement:', error);
      return null;
    }
  },

  saveReflection: async (id: string, reflection: string) => {
    try {
      await saveAchievementReflection(id, reflection);
      await get().loadAchievements();
    } catch (error) {
      console.error('Failed to save reflection:', error);
    }
  },

  getReflection: async (id: string) => {
    try {
      return await getAchievementReflection(id);
    } catch (error) {
      console.error('Failed to get reflection:', error);
      return null;
    }
  },

  dismissRecentUnlock: () => {
    set({ recentUnlock: null });
  },

  getAchievementsByCategory: (category: AchievementCategory) => {
    return get().achievements.filter((a) => a.category === category);
  },

  refreshProgress: async () => {
    await get().loadAchievements();
  },
}));

/**
 * Check if an achievement's conditions are met
 */
function checkAchievementCondition(achievement: Achievement, context: AchievementContext): boolean {
  const { id, unlockType, target, requiresDaysClean, requiresAchievements } = achievement;

  // Check days clean requirement
  if (requiresDaysClean !== undefined && context.soberDays < requiresDaysClean) {
    return false;
  }

  // Check required achievements
  if (requiresAchievements && requiresAchievements.length > 0) {
    // This would need to check if all required achievements are unlocked
    // For now, we'll handle this in a simplified way
    return false;
  }

  switch (unlockType) {
    case 'automatic':
      return checkAutomaticAchievement(id, context);

    case 'count':
      return checkCountAchievement(id, target || 0, context);

    case 'streak':
      return checkStreakAchievement(id, target || 0, context);

    case 'progressive':
      const progress = getProgressiveProgress(id, context);
      return progress >= (target || 100);

    case 'self_check':
      return false; // Self-check achievements are never auto-unlocked

    default:
      return false;
  }
}

/**
 * Check automatic achievements
 */
function checkAutomaticAchievement(id: string, context: AchievementContext): boolean {
  switch (id) {
    case 'fellowship-newcomer':
      return context.soberDays >= 0;

    case 'fellowship-home-group':
      return context.hasHomeGroup;

    case 'fellowship-sponsor':
      return context.hasSponsor;

    case 'fellowship-90-in-90':
      return context.soberDays >= 90 && (context.meetingsInFirst90Days || 0) >= 90;

    default:
      return false;
  }
}

/**
 * Check count-based achievements
 */
function checkCountAchievement(id: string, target: number, context: AchievementContext): boolean {
  switch (id) {
    case 'fellowship-first-contact':
      return context.contactsCount >= target;

    case 'fellowship-building-network':
      return context.contactsCount >= target;

    case 'fellowship-connected':
      return context.contactsCount >= target;

    case 'service-first-meeting':
      return context.meetingsCount >= target;

    case 'service-10-meetings':
      return context.meetingsCount >= target;

    case 'service-50-meetings':
      return context.meetingsCount >= target;

    case 'service-100-meetings':
      return context.meetingsCount >= target;

    case 'practice-phone-therapy':
      return context.phoneTherapyDays >= target;

    default:
      return false;
  }
}

/**
 * Check streak-based achievements
 */
function checkStreakAchievement(id: string, target: number, context: AchievementContext): boolean {
  switch (id) {
    case 'practice-reader-7':
    case 'practice-reader-30':
    case 'practice-reader-90':
      return context.readingStreak >= target;

    case 'practice-checkin-7':
    case 'practice-checkin-30':
    case 'practice-checkin-90':
      return context.checkinStreak >= target;

    case 'practice-nightly-review-7':
    case 'practice-nightly-review-30':
      return context.tenthStepStreak >= target;

    case 'practice-gratitude-7':
    case 'practice-gratitude-30':
      return context.gratitudeStreak >= target;

    default:
      return false;
  }
}

/**
 * Get progress for progressive achievements (step work)
 */
function getProgressiveProgress(id: string, context: AchievementContext): number {
  // Parse step number from achievement ID
  const match = id.match(/step-(\d+)-(started|completed)/);
  if (!match) return 0;

  const stepNumber = parseInt(match[1], 10);
  const type = match[2];
  const stepData = context.stepProgress[stepNumber];

  if (!stepData) return 0;

  const percentage =
    stepData.total > 0 ? Math.round((stepData.answered / stepData.total) * 100) : 0;

  // "started" achievements unlock at 50%, "completed" at 100%
  if (type === 'started') {
    return percentage >= 50 ? 100 : percentage * 2;
  } else {
    return percentage;
  }
}

/**
 * Get current progress for an achievement
 */
function getAchievementProgress(
  achievement: Achievement,
  context: AchievementContext,
): number | null {
  const { id, unlockType, target } = achievement;

  switch (unlockType) {
    case 'count':
      return getCountProgress(id, context);

    case 'streak':
      return getStreakProgress(id, context);

    case 'progressive':
      return getProgressiveProgress(id, context);

    default:
      return null;
  }
}

/**
 * Get progress for count achievements
 */
function getCountProgress(id: string, context: AchievementContext): number {
  switch (id) {
    case 'fellowship-first-contact':
    case 'fellowship-building-network':
    case 'fellowship-connected':
      return context.contactsCount;

    case 'service-first-meeting':
    case 'service-10-meetings':
    case 'service-50-meetings':
    case 'service-100-meetings':
      return context.meetingsCount;

    case 'practice-phone-therapy':
      return context.phoneTherapyDays;

    default:
      return 0;
  }
}

/**
 * Get progress for streak achievements
 */
function getStreakProgress(id: string, context: AchievementContext): number {
  switch (id) {
    case 'practice-reader-7':
    case 'practice-reader-30':
    case 'practice-reader-90':
      return context.readingStreak;

    case 'practice-checkin-7':
    case 'practice-checkin-30':
    case 'practice-checkin-90':
      return context.checkinStreak;

    case 'practice-nightly-review-7':
    case 'practice-nightly-review-30':
      return context.tenthStepStreak;

    case 'practice-gratitude-7':
    case 'practice-gratitude-30':
      return context.gratitudeStreak;

    default:
      return 0;
  }
}
