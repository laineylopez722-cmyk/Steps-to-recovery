/**
 * Sobriety Milestones
 * Defines milestone days for achievement tracking
 */

export const MILESTONE_DAYS = [1, 7, 14, 30, 60, 90, 180, 365] as const;

export type MilestoneDays = (typeof MILESTONE_DAYS)[number];

export interface Milestone {
  days: number;
  label: string;
  emoji: string;
}

export const MILESTONES: Milestone[] = [
  { days: 1, label: '24 Hours', emoji: '🌟' },
  { days: 7, label: '1 Week', emoji: '🎯' },
  { days: 14, label: '2 Weeks', emoji: '💪' },
  { days: 30, label: '1 Month', emoji: '🏆' },
  { days: 60, label: '2 Months', emoji: '🎊' },
  { days: 90, label: '3 Months', emoji: '🎉' },
  { days: 180, label: '6 Months', emoji: '👑' },
  { days: 365, label: '1 Year', emoji: '🌈' },
];

export function getNextMilestone(currentDays: number): Milestone | null {
  const next = MILESTONES.find((m) => m.days > currentDays);
  return next || null;
}

export function getMilestoneForDays(days: number): Milestone | null {
  return MILESTONES.find((m) => m.days === days) || null;
}
