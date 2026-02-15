/**
 * Recovery Components
 * Specialized UI components for 12-step recovery companion apps
 */

// Daily Check-In
export { DailyCheckInCard } from './DailyCheckInCard';
export type { DailyCheckInCardProps } from './DailyCheckInCard';

// Achievement Badge
export { AchievementBadge } from './AchievementBadge';
export type { AchievementBadgeProps } from './AchievementBadge';

// Types and Constants
export type {
  CleanTime,
  StreakData,
  DailyActivity,
  CheckInStatus,
  CheckInData,
  MoodType,
  MoodData,
  JournalEntry,
  StepStatus,
  StepData,
  Achievement,
  AccessibilityProps,
  AnimationConfig,
  TouchTargetProps,
} from './types';

export {
  COLORS,
  MOOD_CONFIG,
  MILESTONE_MESSAGES,
  ANIMATION,
  DIMENSIONS,
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
} from './constants';
