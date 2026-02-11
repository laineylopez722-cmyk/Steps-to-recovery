/**
 * Commitment Calendar Hook
 *
 * Queries the last 90 days of recovery activity from local SQLite tables
 * and aggregates into DayActivity records for the heat-map calendar.
 *
 * Uses COUNT queries to avoid decrypting data — we only need existence checks.
 */

import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';
import type { DayActivity, ActivityLevel, CalendarMonth } from '../types';

interface DateCountRow {
  activity_date: string;
  cnt: number;
}

function getActivityLevel(count: number): ActivityLevel {
  if (count === 0) return 'none';
  if (count === 1) return 'low';
  if (count === 2) return 'medium';
  if (count <= 4) return 'high';
  return 'excellent';
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Build a 90-day date range ending today.
 */
function buildDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 89);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

export function useCommitmentCalendar(
  year: number,
  month: number,
): {
  calendarMonth: CalendarMonth | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { db, isReady } = useDatabase();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const { data, isLoading, error } = useQuery<CalendarMonth>({
    queryKey: ['commitment-calendar', userId, year, month],
    queryFn: async (): Promise<CalendarMonth> => {
      if (!db) {
        throw new Error('Database not ready');
      }

      const daysInMonth = getDaysInMonth(year, month);
      const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      // Query counts per date from each activity table in parallel
      const [checkIns, journals, stepWork, gratitude] = await Promise.all([
        // daily_checkins — count distinct dates with at least one check-in
        db.getAllAsync<DateCountRow>(
          `SELECT check_in_date AS activity_date, COUNT(*) AS cnt
           FROM daily_checkins
           WHERE user_id = ? AND check_in_date BETWEEN ? AND ?
           GROUP BY check_in_date`,
          [userId, monthStart, monthEnd],
        ),

        // journal_entries — count by created_at date
        db.getAllAsync<DateCountRow>(
          `SELECT DATE(created_at) AS activity_date, COUNT(*) AS cnt
           FROM journal_entries
           WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ?
           GROUP BY DATE(created_at)`,
          [userId, monthStart, monthEnd],
        ),

        // step_work — count dates with completed answers
        db.getAllAsync<DateCountRow>(
          `SELECT DATE(updated_at) AS activity_date, COUNT(*) AS cnt
           FROM step_work
           WHERE user_id = ? AND is_complete = 1 AND DATE(updated_at) BETWEEN ? AND ?
           GROUP BY DATE(updated_at)`,
          [userId, monthStart, monthEnd],
        ),

        // gratitude_entries — count by entry_date
        db.getAllAsync<DateCountRow>(
          `SELECT entry_date AS activity_date, COUNT(*) AS cnt
           FROM gratitude_entries
           WHERE user_id = ? AND entry_date BETWEEN ? AND ?
           GROUP BY entry_date`,
          [userId, monthStart, monthEnd],
        ),
      ]);

      // Build lookup maps (date → boolean)
      const toSet = (rows: DateCountRow[]): Set<string> =>
        new Set(rows.filter((r) => r.cnt > 0).map((r) => r.activity_date));

      const checkInDates = toSet(checkIns);
      const journalDates = toSet(journals);
      const stepWorkDates = toSet(stepWork);
      const gratitudeDates = toSet(gratitude);

      // Build DayActivity for each day in the month
      const days: DayActivity[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const checkInCompleted = checkInDates.has(dateStr);
        const journalWritten = journalDates.has(dateStr);
        // Meeting attendance is stored in Supabase only — not in local SQLite
        const meetingAttended = false;
        const stepWorkDone = stepWorkDates.has(dateStr);
        const gratitudeCompleted = gratitudeDates.has(dateStr);

        const activityCount =
          (checkInCompleted ? 1 : 0) +
          (journalWritten ? 1 : 0) +
          (meetingAttended ? 1 : 0) +
          (stepWorkDone ? 1 : 0) +
          (gratitudeCompleted ? 1 : 0);

        days.push({
          date: dateStr,
          checkInCompleted,
          journalWritten,
          meetingAttended,
          stepWorkDone,
          gratitudeCompleted,
          activityLevel: getActivityLevel(activityCount),
          activityCount,
        });
      }

      logger.info('Commitment calendar loaded', {
        year,
        month,
        totalDays: daysInMonth,
      });

      return { year, month, days };
    },
    enabled: isReady && !!db && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours for offline support
  });

  return {
    calendarMonth: data ?? null,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Helper to get the date range for the commitment calendar overview.
 */
export { buildDateRange, getActivityLevel, formatDate, getDaysInMonth };
