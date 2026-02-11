/**
 * GDPR Data Export & Deletion Service
 *
 * Provides comprehensive data export (JSON/CSV) and account deletion
 * for GDPR compliance. All encrypted data is decrypted before export
 * so users receive their data in readable form.
 *
 * @module services/dataExportService
 */

import type { StorageAdapter } from '../adapters/storage';
import { decryptContent, deleteEncryptionKey } from '../utils/encryption';
import { clearDatabase } from '../utils/database';
import { secureStorage } from '../adapters/secureStorage';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

// ─── Row types for all exportable tables ───

interface JournalEntryRow {
  id: string;
  encrypted_title: string | null;
  encrypted_body: string;
  encrypted_mood: string | null;
  encrypted_craving: string | null;
  encrypted_tags: string | null;
  created_at: string;
  updated_at: string;
}

interface DailyCheckinRow {
  id: string;
  check_in_type: string;
  check_in_date: string;
  encrypted_intention: string | null;
  encrypted_reflection: string | null;
  encrypted_mood: string | null;
  encrypted_craving: string | null;
  encrypted_gratitude: string | null;
  created_at: string;
  updated_at: string;
}

interface StepWorkRow {
  id: string;
  step_number: number;
  question_number: number;
  encrypted_answer: string | null;
  is_complete: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AchievementRow {
  id: string;
  achievement_key: string;
  achievement_type: string;
  earned_at: string;
  is_viewed: number;
}

interface SafetyPlanRow {
  id: string;
  encrypted_plan: string;
  created_at: string;
  updated_at: string;
}

interface GratitudeEntryRow {
  id: string;
  entry_date: string;
  encrypted_item_1: string;
  encrypted_item_2: string;
  encrypted_item_3: string;
  created_at: string;
  updated_at: string;
}

interface PersonalInventoryRow {
  id: string;
  check_date: string;
  encrypted_answers: string;
  encrypted_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CravingSurfSessionRow {
  id: string;
  encrypted_initial_rating: string;
  encrypted_final_rating: string | null;
  encrypted_distraction_used: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SponsorConnectionRow {
  id: string;
  role: string;
  status: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

interface UserProfileRow {
  id: string;
  encrypted_email: string | null;
  sobriety_start_date: string | null;
  created_at: string;
  updated_at: string;
}

interface ReadingReflectionRow {
  id: string;
  reading_id: string;
  reading_date: string;
  encrypted_reflection: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Export metadata ───

interface ExportMetadata {
  exportDate: string;
  exportVersion: string;
  userId: string;
  appName: string;
}

interface FullExportData {
  metadata: ExportMetadata;
  profile: Record<string, unknown> | null;
  journal_entries: Record<string, unknown>[];
  daily_checkins: Record<string, unknown>[];
  step_work: Record<string, unknown>[];
  achievements: Record<string, unknown>[];
  safety_plans: Record<string, unknown>[];
  gratitude_entries: Record<string, unknown>[];
  personal_inventory: Record<string, unknown>[];
  craving_surf_sessions: Record<string, unknown>[];
  sponsor_connections: Record<string, unknown>[];
  reading_reflections: Record<string, unknown>[];
}

/** Valid table names for individual CSV export */
export type ExportableTable =
  | 'journal_entries'
  | 'daily_checkins'
  | 'step_work'
  | 'achievements'
  | 'safety_plans'
  | 'gratitude_entries'
  | 'personal_inventory'
  | 'craving_surf_sessions'
  | 'sponsor_connections'
  | 'reading_reflections';

// ─── Helpers ───

const safeDecrypt = async (encrypted: string | null): Promise<string | null> => {
  if (!encrypted) return null;
  try {
    return await decryptContent(encrypted);
  } catch {
    return '[decryption failed]';
  }
};

const csvEscape = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const rowsToCSV = (rows: Record<string, unknown>[]): string => {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(String(row[h] ?? ''))).join(','));
  }
  return lines.join('\n');
};

// ─── Table-specific export functions ───

async function exportJournalEntries(
  db: StorageAdapter,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const rows = await db.getAllAsync<JournalEntryRow>(
    'SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
  );
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      title: await safeDecrypt(row.encrypted_title),
      body: await safeDecrypt(row.encrypted_body),
      mood: await safeDecrypt(row.encrypted_mood),
      craving: await safeDecrypt(row.encrypted_craving),
      tags: await safeDecrypt(row.encrypted_tags),
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
  );
}

async function exportDailyCheckins(
  db: StorageAdapter,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const rows = await db.getAllAsync<DailyCheckinRow>(
    'SELECT * FROM daily_checkins WHERE user_id = ? ORDER BY check_in_date DESC',
    [userId],
  );
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      check_in_type: row.check_in_type,
      check_in_date: row.check_in_date,
      intention: await safeDecrypt(row.encrypted_intention),
      reflection: await safeDecrypt(row.encrypted_reflection),
      mood: await safeDecrypt(row.encrypted_mood),
      craving: await safeDecrypt(row.encrypted_craving),
      gratitude: await safeDecrypt(row.encrypted_gratitude),
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
  );
}

async function exportStepWork(
  db: StorageAdapter,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const rows = await db.getAllAsync<StepWorkRow>(
    'SELECT * FROM step_work WHERE user_id = ? ORDER BY step_number, question_number',
    [userId],
  );
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      step_number: row.step_number,
      question_number: row.question_number,
      answer: await safeDecrypt(row.encrypted_answer),
      is_complete: Boolean(row.is_complete),
      completed_at: row.completed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
  );
}

async function exportAchievements(
  db: StorageAdapter,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const rows = await db.getAllAsync<AchievementRow>(
    'SELECT * FROM achievements WHERE user_id = ? ORDER BY earned_at DESC',
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    achievement_key: row.achievement_key,
    achievement_type: row.achievement_type,
    earned_at: row.earned_at,
    is_viewed: Boolean(row.is_viewed),
  }));
}

async function exportSafetyPlans(
  db: StorageAdapter,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const rows = await db.getAllAsync<SafetyPlanRow>(
    'SELECT * FROM safety_plans WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
  );
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      plan: await safeDecrypt(row.encrypted_plan),
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
  );
}

async function exportGratitudeEntries(
  db: StorageAdapter,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const rows = await db.getAllAsync<GratitudeEntryRow>(
    'SELECT * FROM gratitude_entries WHERE user_id = ? ORDER BY entry_date DESC',
    [userId],
  );
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      entry_date: row.entry_date,
      item_1: await safeDecrypt(row.encrypted_item_1),
      item_2: await safeDecrypt(row.encrypted_item_2),
      item_3: await safeDecrypt(row.encrypted_item_3),
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
  );
}

async function exportPersonalInventory(
  db: StorageAdapter,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const rows = await db.getAllAsync<PersonalInventoryRow>(
    'SELECT * FROM personal_inventory WHERE user_id = ? ORDER BY check_date DESC',
    [userId],
  );
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      check_date: row.check_date,
      answers: await safeDecrypt(row.encrypted_answers),
      notes: await safeDecrypt(row.encrypted_notes),
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
  );
}

async function exportCravingSurfSessions(
  db: StorageAdapter,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const rows = await db.getAllAsync<CravingSurfSessionRow>(
    'SELECT * FROM craving_surf_sessions WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
  );
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      initial_rating: await safeDecrypt(row.encrypted_initial_rating),
      final_rating: await safeDecrypt(row.encrypted_final_rating),
      distraction_used: await safeDecrypt(row.encrypted_distraction_used),
      started_at: row.started_at,
      completed_at: row.completed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
  );
}

async function exportSponsorConnections(
  db: StorageAdapter,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const rows = await db.getAllAsync<SponsorConnectionRow>(
    'SELECT id, role, status, display_name, created_at, updated_at FROM sponsor_connections WHERE user_id = ?',
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    status: row.status,
    display_name: row.display_name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

async function exportReadingReflections(
  db: StorageAdapter,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const rows = await db.getAllAsync<ReadingReflectionRow>(
    'SELECT * FROM reading_reflections WHERE user_id = ? ORDER BY reading_date DESC',
    [userId],
  );
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      reading_id: row.reading_id,
      reading_date: row.reading_date,
      reflection: await safeDecrypt(row.encrypted_reflection),
      word_count: row.word_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
  );
}

// ─── Table export dispatcher ───

const TABLE_EXPORTERS: Record<
  ExportableTable,
  (db: StorageAdapter, userId: string) => Promise<Record<string, unknown>[]>
> = {
  journal_entries: exportJournalEntries,
  daily_checkins: exportDailyCheckins,
  step_work: exportStepWork,
  achievements: exportAchievements,
  safety_plans: exportSafetyPlans,
  gratitude_entries: exportGratitudeEntries,
  personal_inventory: exportPersonalInventory,
  craving_surf_sessions: exportCravingSurfSessions,
  sponsor_connections: exportSponsorConnections,
  reading_reflections: exportReadingReflections,
};

// ─── Public API ───

/**
 * Export all user data as a structured JSON string.
 * Decrypts all encrypted fields so the user gets readable data.
 *
 * @param db - Storage adapter instance
 * @param userId - User ID to export data for
 * @returns JSON string with all user data
 */
export async function exportAllUserData(db: StorageAdapter, userId: string): Promise<string> {
  logger.info('Starting full data export', { userId });

  const profileRow = await db.getFirstAsync<UserProfileRow>(
    'SELECT * FROM user_profile WHERE id = ?',
    [userId],
  );

  const profile = profileRow
    ? {
        id: profileRow.id,
        email: await safeDecrypt(profileRow.encrypted_email),
        sobriety_start_date: profileRow.sobriety_start_date,
        created_at: profileRow.created_at,
        updated_at: profileRow.updated_at,
      }
    : null;

  const [
    journal_entries,
    daily_checkins,
    step_work,
    achievements,
    safety_plans,
    gratitude_entries,
    personal_inventory,
    craving_surf_sessions,
    sponsor_connections,
    reading_reflections,
  ] = await Promise.all([
    exportJournalEntries(db, userId),
    exportDailyCheckins(db, userId),
    exportStepWork(db, userId),
    exportAchievements(db, userId),
    exportSafetyPlans(db, userId),
    exportGratitudeEntries(db, userId),
    exportPersonalInventory(db, userId),
    exportCravingSurfSessions(db, userId),
    exportSponsorConnections(db, userId),
    exportReadingReflections(db, userId),
  ]);

  const exportData: FullExportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0.0',
      userId,
      appName: 'Steps to Recovery',
    },
    profile,
    journal_entries,
    daily_checkins,
    step_work,
    achievements,
    safety_plans,
    gratitude_entries,
    personal_inventory,
    craving_surf_sessions,
    sponsor_connections,
    reading_reflections,
  };

  logger.info('Full data export complete', {
    tables: Object.keys(TABLE_EXPORTERS).length,
    userId,
  });

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export a single table as CSV string.
 * Decrypts encrypted fields before export.
 *
 * @param db - Storage adapter instance
 * @param userId - User ID to export data for
 * @param tableName - The table to export
 * @returns CSV string with headers and rows
 */
export async function exportAsCSV(
  db: StorageAdapter,
  userId: string,
  tableName: ExportableTable,
): Promise<string> {
  logger.info('Starting CSV export', { userId, tableName });

  const exporter = TABLE_EXPORTERS[tableName];
  if (!exporter) {
    throw new Error(`Unknown table: ${tableName}`);
  }

  const rows = await exporter(db, userId);
  const csv = rowsToCSV(rows);

  logger.info('CSV export complete', { userId, tableName, rowCount: rows.length });
  return csv;
}

/**
 * Delete all user data from local storage and cloud.
 * This is a destructive, irreversible operation for GDPR "right to be forgotten".
 *
 * @param db - Storage adapter instance
 * @param userId - User ID whose data to delete
 * @returns Confirmation object with status
 */
export async function deleteAllUserData(
  db: StorageAdapter,
  userId: string,
): Promise<{ success: boolean; errors: string[] }> {
  logger.info('Starting account deletion', { userId });
  const errors: string[] = [];

  // Step 1: Delete cloud data from Supabase
  const cloudTables = [
    'journal_entries',
    'daily_checkins',
    'step_work',
    'achievements',
    'safety_plans',
    'gratitude_entries',
    'personal_inventory',
    'craving_surf_sessions',
    'sponsor_connections',
    'reading_reflections',
    'weekly_reports',
    'sponsor_shared_entries',
    'sponsor_messages',
  ];

  for (const table of cloudTables) {
    try {
      const { error } = await supabase.from(table).delete().eq('user_id', userId);
      if (error) {
        logger.warn(`Cloud deletion failed for ${table}`, { error: error.message });
        errors.push(`Cloud: ${table} - ${error.message}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.warn(`Cloud deletion error for ${table}`, { error: msg });
      errors.push(`Cloud: ${table} - ${msg}`);
    }
  }

  // Delete user profile from Supabase
  try {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) {
      logger.warn('Cloud profile deletion failed', { error: error.message });
      errors.push(`Cloud: profiles - ${error.message}`);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Cloud: profiles - ${msg}`);
  }

  // Step 2: Clear all local database data
  try {
    await clearDatabase(db);
    logger.info('Local database cleared');
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to clear local database', { error: msg });
    errors.push(`Local DB: ${msg}`);
  }

  // Step 3: Delete encryption keys from SecureStore
  try {
    await deleteEncryptionKey();
    logger.info('Encryption keys deleted');
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete encryption keys', { error: msg });
    errors.push(`Encryption keys: ${msg}`);
  }

  // Step 4: Clear secure storage session
  try {
    await secureStorage.clearSession();
    logger.info('Secure storage session cleared');
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to clear secure storage', { error: msg });
    errors.push(`Secure storage: ${msg}`);
  }

  const success = errors.length === 0;
  logger.info('Account deletion complete', { success, errorCount: errors.length });

  return { success, errors };
}
