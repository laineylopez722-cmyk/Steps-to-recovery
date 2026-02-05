/**
 * Achievement Definitions
 * Contains both legacy achievement system and new meeting check-in achievements
 */

import type { AchievementCategory, AchievementUnlockType } from '../types';

// ============================================================================
// LEGACY ACHIEVEMENT SYSTEM (for step work, fellowship, etc.)
// ============================================================================

export interface AchievementDefinition {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  icon: string;
  unlockType: AchievementUnlockType;
  target?: number;
  requiresDaysClean?: number;
  requiresAchievements?: string[];
}

/**
 * Fellowship Achievements
 * Earned through connection with others in recovery
 */
export const FELLOWSHIP_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'fellowship-newcomer',
    category: 'fellowship',
    title: 'Newcomer',
    description: 'Started your recovery journey',
    icon: '🌱',
    unlockType: 'automatic',
    requiresDaysClean: 0,
  },
  {
    id: 'fellowship-first-contact',
    category: 'fellowship',
    title: 'First Contact',
    description: 'Added your first recovery contact',
    icon: '📱',
    unlockType: 'count',
    target: 1,
  },
  {
    id: 'fellowship-building-network',
    category: 'fellowship',
    title: 'Building Network',
    description: 'Added 3 recovery contacts',
    icon: '🤝',
    unlockType: 'count',
    target: 3,
  },
  {
    id: 'fellowship-connected',
    category: 'fellowship',
    title: 'Connected',
    description: 'Added 10 recovery contacts',
    icon: '🌐',
    unlockType: 'count',
    target: 10,
  },
  {
    id: 'fellowship-home-group',
    category: 'fellowship',
    title: 'Found My Home',
    description: 'Set your home group meeting',
    icon: '🏠',
    unlockType: 'automatic',
  },
  {
    id: 'fellowship-sponsor',
    category: 'fellowship',
    title: 'Got a Sponsor',
    description: 'Added a sponsor to your contacts',
    icon: '🧭',
    unlockType: 'automatic',
  },
  {
    id: 'fellowship-voice',
    category: 'fellowship',
    title: 'Found My Voice',
    description: 'Shared at a meeting',
    icon: '🎤',
    unlockType: 'self_check',
  },
  {
    id: 'fellowship-service',
    category: 'fellowship',
    title: 'First Service',
    description: 'Gave back through service work',
    icon: '🤲',
    unlockType: 'self_check',
  },
  {
    id: 'fellowship-90-in-90',
    category: 'fellowship',
    title: '90 in 90',
    description: 'Attended 90 meetings in your first 90 days',
    icon: '🏆',
    unlockType: 'automatic',
    requiresDaysClean: 90,
  },
];

/**
 * Step Work Achievements
 * Earned through working the 12 steps
 */
export const STEP_WORK_ACHIEVEMENTS: AchievementDefinition[] = [
  // Step 1
  {
    id: 'step-1-started',
    category: 'step_work',
    title: 'Step 1 Started',
    description: 'Began working Step 1',
    icon: '1️⃣',
    unlockType: 'progressive',
    target: 50,
  },
  {
    id: 'step-1-completed',
    category: 'step_work',
    title: 'Step 1 Completed',
    description: 'Completed all Step 1 questions',
    icon: '✅',
    unlockType: 'progressive',
    target: 100,
  },
  // Step 2
  {
    id: 'step-2-started',
    category: 'step_work',
    title: 'Step 2 Started',
    description: 'Began working Step 2',
    icon: '2️⃣',
    unlockType: 'progressive',
    target: 50,
  },
  {
    id: 'step-2-completed',
    category: 'step_work',
    title: 'Step 2 Completed',
    description: 'Completed all Step 2 questions',
    icon: '✅',
    unlockType: 'progressive',
    target: 100,
  },
  // Steps 3-12 follow same pattern
  // (abbreviated for brevity - add remaining steps as needed)
];

/**
 * Daily Practice Achievements
 */
export const DAILY_PRACTICE_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'daily-first-journal',
    category: 'daily_practice',
    title: 'First Entry',
    description: 'Wrote your first journal entry',
    icon: '📝',
    unlockType: 'count',
    target: 1,
  },
  {
    id: 'daily-week-streak',
    category: 'daily_practice',
    title: 'Week Warrior',
    description: 'Journaled for 7 days straight',
    icon: '🔥',
    unlockType: 'streak',
    target: 7,
  },
  {
    id: 'daily-month-streak',
    category: 'daily_practice',
    title: 'Monthly Master',
    description: 'Journaled for 30 days straight',
    icon: '⭐',
    unlockType: 'streak',
    target: 30,
  },
];

/**
 * Service Achievements
 */
export const SERVICE_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'service-first-call',
    category: 'service',
    title: 'First Call',
    description: 'Reached out to help someone',
    icon: '📞',
    unlockType: 'self_check',
  },
  {
    id: 'service-sponsor',
    category: 'service',
    title: 'Sponsoring',
    description: 'Started sponsoring someone',
    icon: '🌟',
    unlockType: 'self_check',
  },
];

/**
 * All legacy achievements combined
 */
export const ALL_ACHIEVEMENTS: AchievementDefinition[] = [
  ...FELLOWSHIP_ACHIEVEMENTS,
  ...STEP_WORK_ACHIEVEMENTS,
  ...DAILY_PRACTICE_ACHIEVEMENTS,
  ...SERVICE_ACHIEVEMENTS,
];

/**
 * Get achievement definition by ID
 */
export function getAchievementDefinition(id: string): AchievementDefinition | undefined {
  return ALL_ACHIEVEMENTS.find((a) => a.id === id);
}

/**
 * Get total count of all achievements
 */
export function getTotalAchievementsCount(): number {
  return ALL_ACHIEVEMENTS.length;
}

/**
 * Check if achievement ID is valid
 */
export function isValidAchievementId(id: string): boolean {
  return ALL_ACHIEVEMENTS.some((a) => a.id === id);
}

// ============================================================================
// NEW MEETING CHECK-IN ACHIEVEMENT SYSTEM
// ============================================================================

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string; // Material Icons name
  requirement: number | string;
  category: 'streak' | 'total' | 'challenge';
}

export const MEETING_ACHIEVEMENTS: Achievement[] = [
  {
    key: 'first_meeting',
    title: 'First Step',
    description: 'Attended your first meeting',
    icon: 'flag',
    requirement: 1,
    category: 'total',
  },
  {
    key: 'week_strong',
    title: 'Week Strong',
    description: '7 consecutive days with meetings',
    icon: 'calendar-check',
    requirement: 7,
    category: 'streak',
  },
  {
    key: '30_in_30',
    title: '30 in 30',
    description: 'Attended 30 meetings in 30 days',
    icon: 'trophy',
    requirement: 30,
    category: 'challenge',
  },
  {
    key: '90_in_90',
    title: '90 in 90',
    description: 'Completed the legendary 90 in 90 challenge!',
    icon: 'star',
    requirement: 90,
    category: 'challenge',
  },
  {
    key: 'centurion',
    title: 'Centurion',
    description: 'Attended 100 total meetings',
    icon: 'medal',
    requirement: 100,
    category: 'total',
  },
  {
    key: 'year_strong',
    title: 'Year Strong',
    description: '365 consecutive days with meetings',
    icon: 'crown',
    requirement: 365,
    category: 'streak',
  },
  {
    key: 'marathon',
    title: 'Marathon',
    description: 'Attended 500 total meetings',
    icon: 'heart',
    requirement: 500,
    category: 'total',
  },
];

/**
 * Get achievement definition by key
 */
export function getAchievementByKey(key: string): Achievement | undefined {
  return MEETING_ACHIEVEMENTS.find((a) => a.key === key);
}

/**
 * Get all achievements in a specific category
 */
export function getAchievementsByCategory(
  category: Achievement['category']
): Achievement[] {
  return MEETING_ACHIEVEMENTS.filter((a) => a.category === category);
}

/**
 * Achievement color schemes for UI
 */
export const ACHIEVEMENT_COLORS: Record<
  Achievement['category'],
  { primary: string; secondary: string; gradient: [string, string] }
> = {
  streak: {
    primary: '#F59E0B',
    secondary: '#FCD34D',
    gradient: ['#F59E0B', '#FBBF24'],
  },
  total: {
    primary: '#3B82F6',
    secondary: '#60A5FA',
    gradient: ['#3B82F6', '#60A5FA'],
  },
  challenge: {
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    gradient: ['#8B5CF6', '#A78BFA'],
  },
};

/**
 * Motivational messages for achievements
 */
export const ACHIEVEMENT_MESSAGES: Record<string, string[]> = {
  first_meeting: [
    'You took the first step! 🎉',
    'Every journey begins with a single step.',
    'Welcome to your recovery journey!',
  ],
  week_strong: [
    "Seven days strong! You're building something powerful! 💪",
    'A week of commitment shows real dedication!',
    'One week down, many more to go!',
  ],
  '30_in_30': [
    '30 meetings in 30 days! Outstanding commitment! 🏆',
    "You've shown incredible dedication this month!",
    'A month of meetings - your foundation is solid!',
  ],
  '90_in_90': [
    '90 meetings in 90 days! LEGENDARY! ⭐',
    'You completed one of recovery\'s greatest challenges!',
    'This is a milestone worth celebrating! Incredible work!',
  ],
  centurion: [
    '100 meetings! You are a true warrior! 🥇',
    'A hundred meetings - your commitment is inspiring!',
    'Centurion status unlocked!',
  ],
  year_strong: [
    'A FULL YEAR streak! You are unstoppable! 👑',
    '365 consecutive days - absolutely incredible!',
    'You\'ve proven that consistency changes everything!',
  ],
  marathon: [
    '500 meetings! You are a recovery CHAMPION! ❤️',
    'Five hundred meetings - your journey inspires others!',
    'Marathon status achieved! Legendary commitment!',
  ],
};

/**
 * Get a random motivational message for an achievement
 */
export function getRandomAchievementMessage(achievementKey: string): string {
  const messages = ACHIEVEMENT_MESSAGES[achievementKey] || [
    'Achievement unlocked!',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
