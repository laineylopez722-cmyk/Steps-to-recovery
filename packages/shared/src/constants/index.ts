/**
 * Constants Exports
 *
 * Central export point for all application constants including:
 * - Achievement definitions
 * - Milestone configurations
 * - Step work prompts
 * - Emotion tags
 * - Meeting topics
 * - Crisis resources
 * - And more...
 *
 * @module constants
 */

export * from './emotions';
export * from './milestones';
export * from './stepPrompts';
export * from './meetingTopics';
export * from './triggerScenarios';
export * from './crisisResources';
export * from './designTokens';
export * from './dailyReadings';
export * from './prayers';
export * from './keytags';

// Export legacy achievement system
export {
  FELLOWSHIP_ACHIEVEMENTS,
  STEP_WORK_ACHIEVEMENTS,
  DAILY_PRACTICE_ACHIEVEMENTS,
  SERVICE_ACHIEVEMENTS,
  ALL_ACHIEVEMENTS,
  getAchievementDefinition,
  getTotalAchievementsCount,
  isValidAchievementId,
  type AchievementDefinition,
} from './achievements';

// Export meeting check-in achievement system
export {
  MEETING_ACHIEVEMENTS,
  ACHIEVEMENT_COLORS,
  ACHIEVEMENT_MESSAGES,
  getAchievementByKey,
  getAchievementsByCategory,
  getRandomAchievementMessage,
  type Achievement,
} from './achievements';

export * from './readings';
export * from './slogans';
export * from './promises';
