/**
 * NA Standard Keytag Definitions
 * Recovery milestones represented by keytag colors
 */

export interface Keytag {
  id: string;
  color: string;
  hexColor: string;
  title: string;
  days: number;
  description: string;
  message: string;
}

export interface KeytagWithStatus extends Keytag {
  isEarned: boolean;
  earnedAt?: Date;
  daysUntil?: number;
  progress?: number; // 0-100
}

/**
 * NA Standard Keytags
 * Based on official NA keytag colors and milestones
 */
export const KEYTAGS: Keytag[] = [
  {
    id: 'keytag-welcome',
    color: 'white',
    hexColor: '#FFFFFF',
    title: 'Welcome',
    days: 0,
    description: 'Just for today, you made it.',
    message: 'Welcome to recovery. The journey of a thousand miles begins with a single step.',
  },
  {
    id: 'keytag-30',
    color: 'orange',
    hexColor: '#F97316',
    title: '30 Days',
    days: 30,
    description: 'One month clean.',
    message: "Thirty days! You've proven you can do this. Keep coming back.",
  },
  {
    id: 'keytag-60',
    color: 'green',
    hexColor: '#22C55E',
    title: '60 Days',
    days: 60,
    description: 'Two months clean.',
    message: 'Sixty days of freedom. Your brain is healing, your life is changing.',
  },
  {
    id: 'keytag-90',
    color: 'red',
    hexColor: '#EF4444',
    title: '90 Days',
    days: 90,
    description: 'Three months clean.',
    message: "Ninety days! A cornerstone of recovery. You've built a foundation.",
  },
  {
    id: 'keytag-6mo',
    color: 'blue',
    hexColor: '#3B82F6',
    title: '6 Months',
    days: 180,
    description: 'Half a year clean.',
    message: "Six months of living clean. You're becoming who you were meant to be.",
  },
  {
    id: 'keytag-9mo',
    color: 'yellow',
    hexColor: '#EAB308',
    title: '9 Months',
    days: 270,
    description: 'Nine months clean.',
    message: "Nine months of growth. You've shown incredible dedication.",
  },
  {
    id: 'keytag-1yr',
    color: 'moonlight',
    hexColor: '#A78BFA',
    title: '1 Year',
    days: 365,
    description: 'One year clean.',
    message: 'ONE YEAR! A full trip around the sun, clean and free. Celebrate this miracle.',
  },
  {
    id: 'keytag-18mo',
    color: 'gray',
    hexColor: '#6B7280',
    title: '18 Months',
    days: 547,
    description: 'Eighteen months clean.',
    message: "A year and a half of recovery. You're an inspiration to newcomers.",
  },
  {
    id: 'keytag-multi',
    color: 'black',
    hexColor: '#1F2937',
    title: 'Multiple Years',
    days: 730,
    description: 'Two or more years clean.',
    message: 'Multiple years clean! You carry the message of hope wherever you go.',
  },
];

/**
 * Get keytag by days clean
 */
export function getKeytagForDays(days: number): Keytag | null {
  // Find the highest keytag the user has earned
  const earned = KEYTAGS.filter((k) => days >= k.days);
  return earned.length > 0 ? earned[earned.length - 1] : null;
}

/**
 * Get the next keytag to earn
 */
export function getNextKeytag(days: number): Keytag | null {
  return KEYTAGS.find((k) => k.days > days) || null;
}

/**
 * Get all keytags with status based on days clean
 */
export function getKeytagsWithStatus(
  days: number,
  earnedDates?: Record<string, Date>,
): KeytagWithStatus[] {
  return KEYTAGS.map((keytag) => {
    const isEarned = days >= keytag.days;
    const earnedAt = earnedDates?.[keytag.id];

    let progress = 0;
    let daysUntil = 0;

    if (!isEarned) {
      const previousKeytag = KEYTAGS.filter((k) => k.days < keytag.days).pop();
      const previousDays = previousKeytag?.days || 0;
      const totalDaysNeeded = keytag.days - previousDays;
      const daysProgress = days - previousDays;
      progress = Math.round((daysProgress / totalDaysNeeded) * 100);
      daysUntil = keytag.days - days;
    }

    return {
      ...keytag,
      isEarned,
      earnedAt,
      daysUntil: isEarned ? undefined : daysUntil,
      progress: isEarned ? 100 : progress,
    };
  });
}

/**
 * Get earned keytags count
 */
export function getEarnedKeytagsCount(days: number): number {
  return KEYTAGS.filter((k) => days >= k.days).length;
}
