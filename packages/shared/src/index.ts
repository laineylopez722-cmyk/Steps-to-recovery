/**
 * Shared Package Exports
 *
 * This is the main entry point for the @recovery/shared package.
 * It exports all shared types, utilities, constants, and services
 * used across the Steps to Recovery application.
 *
 * @module @recovery/shared
 * @example
 * ```ts
 * import { AchievementDefinition, sendSMS, useAuthStore } from '@recovery/shared';
 * ```
 */

// Export only non-conflicting types from ./types
export type {
  SyncStatus,
  CheckInType,
  SyncOperation,
  SyncQueueItem,
  UserProfile as DbUserProfile,
  DailyCheckIn as DbDailyCheckIn,
  StepWork as DbStepWork,
} from './types';

// Main application types (camelCase properties)
export * from '../types';

// Explicit exports from constants to avoid naming conflicts
export {
  DEFAULT_EMOTIONS,
  type EmotionTag as EmotionTagConstant,
  getEmotionByName,
  isValidEmotionName,
} from '../constants';

export {
  TIME_MILESTONES,
  type TimeMilestone,
  getNextMilestone,
  getLatestMilestone,
  getAchievedMilestones,
  hasAchievedMilestone,
} from '../constants';

export {
  getAchievementDefinition,
  isValidAchievementId,
  MEETING_ACHIEVEMENTS,
  ACHIEVEMENT_COLORS,
  ACHIEVEMENT_MESSAGES,
  getAchievementByKey,
  getAchievementsByCategory,
  getRandomAchievementMessage,
  type Achievement,
  type AchievementDefinition,
} from '../constants';

export {
  STEP_PROMPTS,
  type StepPrompt,
  type StepSection,
  getStepPrompts,
  getStepSection,
  getStepQuestionCount,
  getTotalQuestionCount,
  isValidStepNumber,
  getAllStepNumbers,
} from '../constants';

export {
  type CrisisResource,
  type CrisisHotline,
  type RegionConfig,
  CRISIS_REGIONS,
  COPING_STRATEGIES,
  DEFAULT_REGION,
  getCrisisResources,
  getEmergencyNumber,
  getAvailableRegions,
  isValidRegion,
} from '../constants';

export {
  PRAYERS,
  type Prayer,
  getPrayerById,
  getPrayersByCategory,
  getPrayersForStep,
} from '../constants';

export {
  SLOGANS,
  type Slogan,
  getSloganById,
  getSlogansByCategory,
  getRandomSlogan,
} from '../constants';

export {
  type Keytag,
  type KeytagWithStatus,
  KEYTAGS,
  getKeytagForDays,
  getNextKeytag,
  getKeytagsWithStatus,
  getEarnedKeytagsCount,
} from '../constants';
export * from '../db';
export * from '../store';
export * from '../utils';
export * from '../utils/encryption';
export * from '../jitai';
export * from '../notifications';
export * from '../animations';
export * from '../export';
export * from './services/sponsorConnection';
