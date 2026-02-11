/**
 * Gratitude Journal Types
 *
 * Types for the daily "3 things I'm grateful for" feature
 * with streak tracking.
 */

export interface GratitudeEntry {
  id: string;
  userId: string;
  entryDate: string;
  items: [string, string, string];
  createdAt: string;
  updatedAt: string;
}

export interface GratitudeStreak {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
}
