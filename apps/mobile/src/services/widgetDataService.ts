/**
 * Widget Data Service
 *
 * Provides aggregated, widget-ready data snapshots for the TodayWidget
 * component and future native OS widget support.
 *
 * No encryption needed — widget data contains only aggregated counts
 * and status booleans, not sensitive user content.
 *
 * @module services/widgetDataService
 */

import type { StorageAdapter } from '../adapters/storage/types';
import { getQuoteForDate, type DailyQuote } from './dailyQuotes';
import { logger } from '../utils/logger';

// Milestone thresholds in days
const MILESTONES = [1, 3, 7, 14, 30, 60, 90, 182, 274, 365];

export interface WidgetCleanTime {
  days: number;
  hours: number;
  minutes: number;
  nextMilestone: number;
  daysToMilestone: number;
}

export interface WidgetTodayStatus {
  morningCheckIn: boolean;
  eveningCheckIn: boolean;
  journalWritten: boolean;
  meetingAttended: boolean;
  gratitudeCompleted: boolean;
}

export interface WidgetStreaks {
  checkIn: number;
  journal: number;
  meeting: number;
  gratitude: number;
}

export interface WidgetData {
  cleanTime: WidgetCleanTime;
  dailyQuote: DailyQuote;
  todayStatus: WidgetTodayStatus;
  streaks: WidgetStreaks;
}

/**
 * Calculate clean time from a sobriety start date.
 */
function calculateCleanTimeForWidget(sobrietyStartDate: string): WidgetCleanTime {
  const start = new Date(sobrietyStartDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  const nextMilestone = MILESTONES.find((m) => m > days) ?? days + 365;
  const daysToMilestone = nextMilestone - days;

  return { days, hours, minutes, nextMilestone, daysToMilestone };
}

/**
 * Get the daily recovery quote for today.
 */
export function getDailyQuote(): DailyQuote {
  return getQuoteForDate(new Date());
}

/**
 * Check what activities the user has completed today.
 */
export async function getTodayStatus(
  db: StorageAdapter,
  userId: string,
): Promise<WidgetTodayStatus> {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Check-ins for today
    const checkIns = await db.getAllAsync<{ check_in_type: string }>(
      'SELECT check_in_type FROM daily_checkins WHERE user_id = ? AND check_in_date = ?',
      [userId, today],
    );

    const morningCheckIn = checkIns.some((c) => c.check_in_type === 'morning');
    const eveningCheckIn = checkIns.some((c) => c.check_in_type === 'evening');

    // Journal entries written today
    const journalResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM journal_entries WHERE user_id = ? AND DATE(created_at) = ?',
      [userId, today],
    );
    const journalWritten = (journalResult?.count ?? 0) > 0;

    // Meetings attended today
    let meetingAttended = false;
    try {
      const meetingResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM meeting_checkins WHERE user_id = ? AND DATE(checked_in_at) = ?',
        [userId, today],
      );
      meetingAttended = (meetingResult?.count ?? 0) > 0;
    } catch {
      // Table may not exist yet
      meetingAttended = false;
    }

    // Gratitude completed today (check for gratitude in morning check-in)
    const gratitudeResult = await db.getFirstAsync<{ encrypted_gratitude: string | null }>(
      "SELECT encrypted_gratitude FROM daily_checkins WHERE user_id = ? AND check_in_date = ? AND encrypted_gratitude IS NOT NULL AND encrypted_gratitude != ''",
      [userId, today],
    );
    const gratitudeCompleted = gratitudeResult !== null;

    return {
      morningCheckIn,
      eveningCheckIn,
      journalWritten,
      meetingAttended,
      gratitudeCompleted,
    };
  } catch (err) {
    logger.error('Failed to get today status for widget', err);
    return {
      morningCheckIn: false,
      eveningCheckIn: false,
      journalWritten: false,
      meetingAttended: false,
      gratitudeCompleted: false,
    };
  }
}

/**
 * Calculate consecutive-day streaks for various activities.
 */
async function getStreaks(db: StorageAdapter, userId: string): Promise<WidgetStreaks> {
  try {
    const checkInStreak = await calculateStreak(
      db,
      'SELECT DISTINCT check_in_date as d FROM daily_checkins WHERE user_id = ? ORDER BY check_in_date DESC',
      userId,
    );

    const journalStreak = await calculateStreak(
      db,
      'SELECT DISTINCT DATE(created_at) as d FROM journal_entries WHERE user_id = ? ORDER BY d DESC',
      userId,
    );

    let meetingStreak = 0;
    try {
      meetingStreak = await calculateStreak(
        db,
        'SELECT DISTINCT DATE(checked_in_at) as d FROM meeting_checkins WHERE user_id = ? ORDER BY d DESC',
        userId,
      );
    } catch {
      // Table may not exist yet
    }

    let gratitudeStreak = 0;
    try {
      gratitudeStreak = await calculateStreak(
        db,
        "SELECT DISTINCT check_in_date as d FROM daily_checkins WHERE user_id = ? AND encrypted_gratitude IS NOT NULL AND encrypted_gratitude != '' ORDER BY check_in_date DESC",
        userId,
      );
    } catch {
      // Column may not exist yet
    }

    return {
      checkIn: checkInStreak,
      journal: journalStreak,
      meeting: meetingStreak,
      gratitude: gratitudeStreak,
    };
  } catch (err) {
    logger.error('Failed to calculate streaks for widget', err);
    return { checkIn: 0, journal: 0, meeting: 0, gratitude: 0 };
  }
}

/**
 * Generic streak calculator — counts consecutive days from today backwards.
 */
async function calculateStreak(db: StorageAdapter, query: string, userId: string): Promise<number> {
  const rows = await db.getAllAsync<{ d: string }>(query, [userId]);
  if (rows.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const expectedDate = new Date(today);

  for (const row of rows) {
    const rowDate = new Date(row.d);
    rowDate.setHours(0, 0, 0, 0);

    const expectedStr = expectedDate.toISOString().split('T')[0];
    const rowStr = rowDate.toISOString().split('T')[0];

    if (rowStr === expectedStr) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (streak === 0 && rowStr < expectedStr) {
      // First entry is not today — no active streak
      break;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Aggregate all widget data from the local database.
 * Returns a complete snapshot suitable for widget rendering.
 */
export async function getWidgetData(db: StorageAdapter, userId: string): Promise<WidgetData> {
  try {
    // Get sobriety start date for clean time calculation
    const profile = await db.getFirstAsync<{ sobriety_start_date: string | null }>(
      'SELECT sobriety_start_date FROM user_profile WHERE id = ?',
      [userId],
    );

    const cleanTime: WidgetCleanTime = profile?.sobriety_start_date
      ? calculateCleanTimeForWidget(profile.sobriety_start_date)
      : { days: 0, hours: 0, minutes: 0, nextMilestone: 1, daysToMilestone: 1 };

    const [todayStatus, streaks] = await Promise.all([
      getTodayStatus(db, userId),
      getStreaks(db, userId),
    ]);

    return {
      cleanTime,
      dailyQuote: getDailyQuote(),
      todayStatus,
      streaks,
    };
  } catch (err) {
    logger.error('Failed to aggregate widget data', err);
    return {
      cleanTime: { days: 0, hours: 0, minutes: 0, nextMilestone: 1, daysToMilestone: 1 },
      dailyQuote: getDailyQuote(),
      todayStatus: {
        morningCheckIn: false,
        eveningCheckIn: false,
        journalWritten: false,
        meetingAttended: false,
        gratitudeCompleted: false,
      },
      streaks: { checkIn: 0, journal: 0, meeting: 0, gratitude: 0 },
    };
  }
}
