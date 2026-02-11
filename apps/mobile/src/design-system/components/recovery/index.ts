/**
 * Recovery Components
 * Specialized UI components for 12-step recovery companion apps
 */

// Streak Counter
export { StreakCounter } from './StreakCounter';
export { StreakHistoryGraph } from './StreakCounter/StreakHistoryGraph';
export type { StreakCounterProps } from './StreakCounter';

// Daily Check-In
export { DailyCheckInCard } from './DailyCheckInCard';
export type { DailyCheckInCardProps } from './DailyCheckInCard';

// Journal Entry
export { JournalEntryCard } from './JournalEntryCard';
export type { JournalEntryCardProps } from './JournalEntryCard';

// Step Progress
export { StepProgressTracker } from './StepProgressTracker';
export type { StepProgressTrackerProps } from './StepProgressTracker';

// Achievement Badge
export { AchievementBadge } from './AchievementBadge';
export type { AchievementBadgeProps } from './AchievementBadge';

// Crisis FAB
export { CrisisFAB, CompactCrisisButton } from './CrisisFAB';
export type { CrisisFABProps, CompactCrisisButtonProps } from './CrisisFAB';

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
