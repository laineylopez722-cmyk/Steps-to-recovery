/**
 * Time-Based Milestones
 *
 * Recovery milestones based on sobriety duration.
 * These milestones celebrate key recovery anniversaries and provide
 * encouragement at significant time intervals.
 */
export interface TimeMilestone {
  /** Number of days of sobriety required for this milestone */
  readonly days: number;
  readonly title: string;
  readonly message: string;
  readonly emoji: string;
}

export const TIME_MILESTONES: readonly TimeMilestone[] = [
  {
    days: 1,
    title: '1 Day',
    message: 'Your first day! Every journey begins with a single step.',
    emoji: '🌱',
  },
  {
    days: 3,
    title: '3 Days',
    message: 'Three days strong! The hardest part is behind you.',
    emoji: '💪',
  },
  {
    days: 7,
    title: '1 Week',
    message: 'A full week! Your body and mind are already healing.',
    emoji: '⭐',
  },
  {
    days: 14,
    title: '2 Weeks',
    message: 'Two weeks of courage and commitment. Keep going!',
    emoji: '🌟',
  },
  {
    days: 30,
    title: '1 Month',
    message: 'One month! This is a major achievement. Be proud!',
    emoji: '🏆',
  },
  {
    days: 60,
    title: '2 Months',
    message: "Two months of freedom. You're building a new life!",
    emoji: '🎯',
  },
  {
    days: 90,
    title: '90 Days',
    message: 'The big 90! A cornerstone of recovery. Incredible!',
    emoji: '🎉',
  },
  {
    days: 180,
    title: '6 Months',
    message: 'Half a year! Your dedication is inspiring.',
    emoji: '🌈',
  },
  {
    days: 270,
    title: '9 Months',
    message: 'Nine months of growth and transformation!',
    emoji: '🦋',
  },
  {
    days: 365,
    title: '1 Year',
    message: 'ONE YEAR! A whole year of choosing yourself. Amazing!',
    emoji: '🎊',
  },
  {
    days: 548,
    title: '18 Months',
    message: 'A year and a half! Your resilience is remarkable.',
    emoji: '💎',
  },
  {
    days: 730,
    title: '2 Years',
    message: "Two years! You've proven anything is possible.",
    emoji: '👑',
  },
  {
    days: 1095,
    title: '3 Years',
    message: "Three years of freedom! You're an inspiration.",
    emoji: '🏅',
  },
  {
    days: 1825,
    title: '5 Years',
    message: 'FIVE YEARS! A true testament to your strength.',
    emoji: '🌠',
  },
  {
    days: 3650,
    title: '10 Years',
    message: 'A decade! Your journey is a beacon of hope for others.',
    emoji: '🏛️',
  },
];

/**
 * Get the next upcoming milestone
 *
 * @param soberDays - Current number of days of sobriety
 * @returns The next milestone to achieve, or null if all milestones are achieved
 * @example
 * ```ts
 * const next = getNextMilestone(5); // Returns 7-day milestone
 * ```
 */
export function getNextMilestone(soberDays: number): TimeMilestone | null {
  if (soberDays < 0) {
    return TIME_MILESTONES[0] || null;
  }
  return TIME_MILESTONES.find((m) => m.days > soberDays) || null;
}

/**
 * Get all achieved milestones
 *
 * @param soberDays - Current number of days of sobriety
 * @returns Array of all milestones that have been achieved
 * @example
 * ```ts
 * const achieved = getAchievedMilestones(30); // Returns [1, 3, 7, 14, 30 day milestones]
 * ```
 */
export function getAchievedMilestones(soberDays: number): readonly TimeMilestone[] {
  if (soberDays < 0) {
    return [];
  }
  return TIME_MILESTONES.filter((m) => m.days <= soberDays);
}

/**
 * Get the most recent achieved milestone
 *
 * @param soberDays - Current number of days of sobriety
 * @returns The most recently achieved milestone, or null if none achieved
 * @example
 * ```ts
 * const latest = getLatestMilestone(45); // Returns 30-day milestone
 * ```
 */
export function getLatestMilestone(soberDays: number): TimeMilestone | null {
  if (soberDays < 0) {
    return null;
  }
  const achieved = getAchievedMilestones(soberDays);
  return achieved.length > 0 ? achieved[achieved.length - 1] : null;
}

/**
 * Check if a specific milestone has been achieved
 *
 * @param soberDays - Current number of days of sobriety
 * @param milestoneDays - The milestone days to check (e.g., 30, 90, 365)
 * @returns True if the milestone has been achieved
 */
export function hasAchievedMilestone(soberDays: number, milestoneDays: number): boolean {
  return soberDays >= milestoneDays && TIME_MILESTONES.some((m) => m.days === milestoneDays);
}
