/**
 * Weekly Report Service
 *
 * Generates and persists weekly recovery reports by aggregating
 * journal entries, check-ins, step work, and meeting attendance.
 * Sensitive summaries are encrypted before storage.
 */

import type { StorageAdapter } from '../adapters/storage';
import { encryptContent, decryptContent } from '../utils/encryption';
import { generateId } from '../utils/id';
import { addToSyncQueue } from './syncService';
import { logger } from '../utils/logger';
import {
  generateWeeklyReport as buildReport,
  type WeeklyReport,
  type WeeklyReportData,
} from '../features/ai-companion/services/weeklyReport';

interface WeeklyReportRow {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  report_json: string;
  created_at: string;
}

/**
 * Generate and persist a weekly recovery report.
 */
export async function generateWeeklyReport(
  db: StorageAdapter,
  userId: string,
  weekStartDate: Date,
): Promise<WeeklyReport> {
  const weekStart = toDateString(weekStartDate);
  const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  const weekEnd = toDateString(weekEndDate);

  const data = await gatherWeeklyData(db, userId, weekStart, weekEnd);
  const report = buildReport(data);

  const encryptedJson = await encryptContent(JSON.stringify(report));

  const id = generateId('report');
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT OR REPLACE INTO weekly_reports (id, user_id, week_start, week_end, report_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userId, weekStart, weekEnd, encryptedJson, now],
  );

  await addToSyncQueue(db, 'weekly_reports', id, 'insert');

  logger.info('Weekly report generated', { weekStart, weekEnd });
  return report;
}

/**
 * Fetch past weekly reports, decrypting each.
 */
export async function getWeeklyReports(
  db: StorageAdapter,
  userId: string,
  limit: number = 12,
): Promise<WeeklyReport[]> {
  const rows = await db.getAllAsync<WeeklyReportRow>(
    `SELECT * FROM weekly_reports
     WHERE user_id = ?
     ORDER BY week_start DESC
     LIMIT ?`,
    [userId, limit],
  );

  const reports: WeeklyReport[] = [];
  for (const row of rows) {
    try {
      const json = await decryptContent(row.report_json);
      reports.push(JSON.parse(json) as WeeklyReport);
    } catch (err) {
      logger.error('Failed to decrypt weekly report', err);
    }
  }

  return reports;
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

async function gatherWeeklyData(
  db: StorageAdapter,
  userId: string,
  weekStart: string,
  weekEnd: string,
): Promise<WeeklyReportData> {
  const weekEndPlusOne = new Date(weekEnd + 'T00:00:00');
  weekEndPlusOne.setDate(weekEndPlusOne.getDate() + 1);
  const endExclusive = toDateString(weekEndPlusOne);

  // Journal entry count
  const journalRow = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM journal_entries
     WHERE user_id = ? AND created_at >= ? AND created_at < ?`,
    [userId, weekStart, endExclusive],
  );
  const journalEntryCount = journalRow?.cnt ?? 0;

  // Daily check-ins with mood and craving data
  const checkIns = await db.getAllAsync<{
    check_in_date: string;
    encrypted_mood: string | null;
    encrypted_craving: string | null;
  }>(
    `SELECT check_in_date, encrypted_mood, encrypted_craving FROM daily_checkins
     WHERE user_id = ? AND check_in_date >= ? AND check_in_date < ?`,
    [userId, weekStart, endExclusive],
  );

  const moodRatings: Array<{ date: string; mood: number }> = [];
  const cravingLevels: Array<{ date: string; level: number }> = [];
  const checkInDates: string[] = [];

  for (const ci of checkIns) {
    checkInDates.push(ci.check_in_date);
    if (ci.encrypted_mood) {
      try {
        const mood = parseFloat(await decryptContent(ci.encrypted_mood));
        if (!isNaN(mood)) {
          moodRatings.push({ date: ci.check_in_date, mood });
        }
      } catch {
        // skip corrupt data
      }
    }
    if (ci.encrypted_craving) {
      try {
        const level = parseFloat(await decryptContent(ci.encrypted_craving));
        if (!isNaN(level)) {
          cravingLevels.push({ date: ci.check_in_date, level });
        }
      } catch {
        // skip corrupt data
      }
    }
  }

  // Step work progress
  const stepWorkRow = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM step_work
     WHERE user_id = ? AND updated_at >= ? AND updated_at < ?`,
    [userId, weekStart, endExclusive],
  );
  const stepWorkEntries = stepWorkRow?.cnt ?? 0;

  const currentStepRow = await db.getFirstAsync<{ step_number: number }>(
    `SELECT step_number FROM step_work
     WHERE user_id = ? AND is_complete = 0
     ORDER BY step_number ASC LIMIT 1`,
    [userId],
  );
  const currentStep = currentStepRow?.step_number ?? 1;

  // Meeting attendance
  const meetingRow = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM meeting_checkins
     WHERE user_id = ? AND checked_in_at >= ? AND checked_in_at < ?`,
    [userId, weekStart, endExclusive],
  );

  // Sobriety days
  const profileRow = await db.getFirstAsync<{ sobriety_start_date: string | null }>(
    `SELECT sobriety_start_date FROM user_profile WHERE id = ? LIMIT 1`,
    [userId],
  );
  let sobrietyDays = 0;
  if (profileRow?.sobriety_start_date) {
    const start = new Date(profileRow.sobriety_start_date);
    sobrietyDays = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    moodRatings,
    cravingLevels,
    journalEntryCount,
    journalThemes: [],
    checkInDates,
    currentStep,
    stepWorkEntries,
    sobrietyDays,
  };
}
