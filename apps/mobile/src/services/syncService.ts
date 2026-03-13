/**
 * Sync Service
 *
 * Handles background synchronization of local data with Supabase cloud storage.
 * Implements queue-based sync with retry logic, exponential backoff, and
 * conflict resolution.
 *
 * **Key Features**:
 * - Queue-based sync (processes pending operations)
 * - Retry logic with exponential backoff (max 3 attempts)
 * - Network timeout protection (30 seconds)
 * - Mutex to prevent concurrent syncs
 * - Deletes processed before inserts/updates (avoids FK conflicts)
 * - Idempotent operations using supabase_id
 *
 * **Sync Order**:
 * 1. Deletes (processed first to avoid foreign key conflicts)
 * 2. Inserts
 * 3. Updates
 *
 * @module services/syncService
 */

import { supabase } from '../lib/supabase';
import type { StorageAdapter } from '../adapters/storage';
import { logger } from '../utils/logger';
import { generateId } from '../utils/id';
import { decryptContent, encryptContent } from '../utils/encryption';
import {
  PULL_SYNC_TABLES,
  isValidSyncTable,
  type PullSyncTable,
} from './syncRegistry';

/**
 * Pull sync result for tracking cloud→device sync
 */
export interface PullSyncResult {
  pulled: number;
  errors: string[];
}

/**
 * Mutex to prevent concurrent sync operations
 *
 * Ensures only one sync runs at a time to avoid race conditions
 * and data corruption.
 *
 * @internal
 */
class SyncMutex {
  private locked: boolean = false;
  private queue: Array<() => void> = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }

  isLocked(): boolean {
    return this.locked;
  }
}

const syncMutex = new SyncMutex();

/** Network timeout for Supabase operations (30 seconds) */
const NETWORK_TIMEOUT_MS = 30000;

/** Maximum retry attempts before marking as failed */
const MAX_RETRY_COUNT = 3;

/** Base delay for exponential backoff (in milliseconds) */
const BASE_BACKOFF_MS = 1000;

// isValidSyncTable, PULL_SYNC_TABLES, and PullSyncTable are imported from
// syncRegistry (single source of truth).

/**
 * Wrap a promise with a timeout
 * Throws an error if the operation takes longer than the specified timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

/**
 * Sync result for tracking success/failures
 */
export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

/**
 * Sync queue item from SQLite
 */
interface SyncQueueItem {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'insert' | 'update' | 'delete';
  supabase_id: string | null;
  retry_count: number;
  last_error: string | null;
}

/**
 * Journal entry from local SQLite
 */
interface LocalJournalEntry {
  id: string;
  user_id: string;
  encrypted_title: string | null;
  encrypted_body: string;
  encrypted_mood: string | null;
  encrypted_craving: string | null;
  encrypted_tags: string | null;
  /** Added in migration v20 — may be absent on older schema versions */
  encrypted_audio: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  supabase_id: string | null;
}

/**
 * Step work from local SQLite
 */
interface LocalStepWork {
  id: string;
  user_id: string;
  step_number: number;
  question_number: number;
  encrypted_answer: string | null;
  is_complete: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  supabase_id: string | null;
}

/**
 * Daily check-in from local SQLite
 */
interface LocalDailyCheckIn {
  id: string;
  user_id: string;
  check_in_type: 'morning' | 'evening';
  check_in_date: string;
  encrypted_intention: string | null;
  encrypted_reflection: string | null;
  encrypted_mood: string | null;
  encrypted_craving: string | null;
  encrypted_gratitude: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  supabase_id: string | null;
}

/**
 * Favorite meeting from local SQLite
 */
interface LocalFavoriteMeeting {
  id: string;
  user_id: string;
  meeting_id: string;
  encrypted_notes: string | null;
  notification_enabled: number;
  created_at: string;
  sync_status: string;
  supabase_id: string | null;
}

/**
 * Reading reflection from local SQLite
 */
interface LocalReadingReflection {
  id: string;
  user_id: string;
  reading_id: string;
  reading_date: string;
  encrypted_reflection: string;
  word_count: number;
  created_at: string;
  updated_at: string;
  sync_status: string;
  supabase_id: string | null;
}

/**
 * Weekly report from local SQLite
 */
interface LocalWeeklyReport {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  report_json: string;
  created_at: string;
  sync_status: string;
  supabase_id: string | null;
}

/**
 * Sponsor connection from local SQLite
 */
interface LocalSponsorConnection {
  id: string;
  user_id: string;
  role: 'sponsee' | 'sponsor';
  status: 'pending' | 'connected';
  invite_code: string;
  display_name: string | null;
  own_public_key: string;
  peer_public_key: string | null;
  shared_key: string | null;
  pending_private_key: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  supabase_id: string | null;
}

/**
 * Sponsor shared entry from local SQLite
 */
interface LocalSponsorSharedEntry {
  id: string;
  user_id: string;
  connection_id: string;
  direction: 'outgoing' | 'incoming' | 'comment';
  journal_entry_id: string | null;
  payload: string;
  created_at: string;
  updated_at: string;
  sync_status: string;
  supabase_id: string | null;
}

/**
 * Achievement from local SQLite
 */
interface LocalAchievement {
  id: string;
  user_id: string;
  achievement_key: string;
  achievement_type: string;
  earned_at: string;
  is_viewed: number;
  sync_status: string;
  supabase_id: string | null;
}

/**
 * AI memory from local SQLite
 */
interface LocalAIMemory {
  id: string;
  user_id: string;
  type: string;
  encrypted_content: string;
  confidence: number;
  encrypted_context: string | null;
  source_conversation_id: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  supabase_id: string | null;
}



/**
 * Sync a single journal entry to Supabase
 * Maps local encrypted fields to Supabase schema
 */
export async function syncJournalEntry(
  db: StorageAdapter,
  entryId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch journal entry from local database
    const entry = await db.getFirstAsync<LocalJournalEntry>(
      'SELECT * FROM journal_entries WHERE id = ? AND user_id = ?',
      [entryId, userId],
    );

    if (!entry) {
      return { success: false, error: 'Journal entry not found' };
    }

    // Generate UUID for Supabase if not already synced
    const supabaseId = entry.supabase_id || generateId();

    // Tags: stored locally as a single encrypted blob. Supabase column is TEXT[].
    // Send as single-element array preserving the encrypted payload.
    const tags: string[] = entry.encrypted_tags ? [entry.encrypted_tags] : [];

    // Map local schema to Supabase schema.
    // Field name contract (local → remote):
    //   encrypted_title  → title
    //   encrypted_body   → content
    //   encrypted_mood   → mood
    //   encrypted_craving→ craving
    //   encrypted_tags   → tags (single-element array preserving the encrypted blob)
    //   encrypted_audio  → audio
    const supabaseData = {
      id: supabaseId,
      user_id: userId,
      title: entry.encrypted_title || '', // Encrypted title
      content: entry.encrypted_body, // Encrypted content
      mood: entry.encrypted_mood, // Encrypted mood (nullable)
      craving: entry.encrypted_craving || null, // Encrypted craving intensity (nullable)
      audio: entry.encrypted_audio || null, // Encrypted audio (v20, nullable)
      tags, // Array with encrypted tags
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    };

    // Upsert to Supabase (insert or update) with timeout
    const response = await withTimeout(
      Promise.resolve(
        supabase.from('journal_entries').upsert(supabaseData, {
          onConflict: 'id',
        }),
      ),
      NETWORK_TIMEOUT_MS,
      'Journal entry upsert',
    );
    const supabaseError = (response as { error: { message: string } | null }).error;

    if (supabaseError) {
      logger.error('Supabase upsert failed for journal entry', supabaseError);
      return { success: false, error: supabaseError.message };
    }

    // Update local record with supabase_id and mark as synced
    await db.runAsync(
      `UPDATE journal_entries
       SET supabase_id = ?, sync_status = 'synced', updated_at = ?
       WHERE id = ?`,
      [supabaseId, new Date().toISOString(), entryId],
    );

    logger.info('Journal entry synced successfully', { entryId, supabaseId });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to sync journal entry', { entryId, error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Sync a single step work record to Supabase
 * Note: Supabase step_work schema differs from local (content vs question_number/encrypted_answer)
 */
export async function syncStepWork(
  db: StorageAdapter,
  stepWorkId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch step work from local database
    const stepWork = await db.getFirstAsync<LocalStepWork>(
      'SELECT * FROM step_work WHERE id = ? AND user_id = ?',
      [stepWorkId, userId],
    );

    if (!stepWork) {
      return { success: false, error: 'Step work not found' };
    }

    // Generate or reuse Supabase ID
    const supabaseId = stepWork.supabase_id || generateId();

    // Map local schema to Supabase schema.
    // Field name contract (local → remote):
    //   step_number     → step_number
    //   question_number → question_number (added in Supabase migration 20260313000001)
    //   encrypted_answer→ content
    //   is_complete     → is_completed (boolean)
    const content = stepWork.encrypted_answer || '';

    const supabaseData = {
      id: supabaseId,
      user_id: userId,
      step_number: stepWork.step_number,
      question_number: stepWork.question_number, // Required for UNIQUE(user_id, step_number, question_number)
      content, // Encrypted answer
      is_completed: stepWork.is_complete === 1,
      created_at: stepWork.created_at,
      updated_at: stepWork.updated_at,
    };

    // Upsert to Supabase with timeout
    const response = await withTimeout(
      Promise.resolve(
        supabase.from('step_work').upsert(supabaseData, {
          onConflict: 'id',
        }),
      ),
      NETWORK_TIMEOUT_MS,
      'Step work upsert',
    );
    const supabaseError = (response as { error: { message: string } | null }).error;

    if (supabaseError) {
      logger.error('Supabase upsert failed for step work', supabaseError);
      return { success: false, error: supabaseError.message };
    }

    // Mark as synced in local database and store supabase_id
    await db.runAsync(
      `UPDATE step_work
       SET supabase_id = ?, sync_status = 'synced', updated_at = ?
       WHERE id = ?`,
      [supabaseId, new Date().toISOString(), stepWorkId],
    );

    logger.info('Step work synced successfully', { stepWorkId, supabaseId });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to sync step work', { stepWorkId, error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Sync a single daily check-in to Supabase
 * Maps local encrypted fields to Supabase schema
 *
 * Local schema fields → Supabase schema fields:
 * - check_in_type → checkin_type (note: no underscore in Supabase)
 * - encrypted_intention → intention (morning check-ins)
 * - encrypted_reflection → notes (evening check-ins - combined with wins/challenges)
 * - encrypted_mood → mood
 * - encrypted_craving → day_rating (converted: 0-10 craving → inverted 1-10 rating)
 */
export async function syncDailyCheckIn(
  db: StorageAdapter,
  checkInId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch check-in from local database
    const checkIn = await db.getFirstAsync<LocalDailyCheckIn>(
      'SELECT * FROM daily_checkins WHERE id = ? AND user_id = ?',
      [checkInId, userId],
    );

    if (!checkIn) {
      return { success: false, error: 'Daily check-in not found' };
    }

    // Generate UUID for Supabase if not already synced
    const supabaseId = checkIn.supabase_id || generateId();

    // Map local schema to Supabase schema
    // The Supabase schema has different field structure for morning vs evening
    const supabaseData: Record<string, unknown> = {
      id: supabaseId,
      user_id: userId,
      checkin_type: checkIn.check_in_type, // Note: no underscore in Supabase
      checkin_date: checkIn.check_in_date,
      created_at: checkIn.created_at,
      updated_at: checkIn.updated_at || new Date().toISOString(),
    };

    // Map fields based on check-in type
    if (checkIn.check_in_type === 'morning') {
      // Morning check-in: intention field
      supabaseData.intention = checkIn.encrypted_intention; // Already encrypted
      supabaseData.mood = checkIn.encrypted_mood;
      supabaseData.gratitude = checkIn.encrypted_gratitude; // Already encrypted
    } else {
      // Evening check-in: reflection goes to notes
      supabaseData.notes = checkIn.encrypted_reflection; // Already encrypted
      supabaseData.mood = checkIn.encrypted_mood;
      supabaseData.gratitude = checkIn.encrypted_gratitude; // Already encrypted
      // Convert craving (0-10) to day_rating (1-10, inverted: high craving = low rating)
      // If craving is encrypted, we store it as-is for now
      if (checkIn.encrypted_craving) {
        // Preserve encrypted craving data for privacy
        supabaseData.challenges_faced = checkIn.encrypted_craving;

        // Provide a numeric day_rating if we can safely derive it
        try {
          const decrypted = await decryptContent(checkIn.encrypted_craving);
          const craving = Number.parseInt(decrypted, 10);
          if (!Number.isNaN(craving)) {
            const rating = Math.max(1, Math.min(10, 11 - craving));
            supabaseData.day_rating = rating;
          }
        } catch {
          // Ignore decryption failures; keep encrypted fallback only
        }
      }
    }

    // Upsert to Supabase (insert or update) with timeout
    const response = await withTimeout(
      Promise.resolve(
        supabase.from('daily_checkins').upsert(supabaseData, {
          onConflict: 'id',
        }),
      ),
      NETWORK_TIMEOUT_MS,
      'Daily check-in upsert',
    );
    const supabaseError = (response as { error: { message: string } | null }).error;

    if (supabaseError) {
      logger.error('Supabase upsert failed for daily check-in', supabaseError);
      return { success: false, error: supabaseError.message };
    }

    // Update local record with supabase_id and mark as synced
    await db.runAsync(
      `UPDATE daily_checkins
       SET supabase_id = ?, sync_status = 'synced', updated_at = ?
       WHERE id = ?`,
      [supabaseId, new Date().toISOString(), checkInId],
    );

    logger.info('Daily check-in synced successfully', {
      checkInId,
      supabaseId,
      type: checkIn.check_in_type,
    });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to sync daily check-in', { checkInId, error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Sync a single favorite meeting to Supabase
 * User's favorite meetings are encrypted behavioral data
 */
export async function syncFavoriteMeeting(
  db: StorageAdapter,
  favoriteId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch favorite meeting from local database
    const favorite = await db.getFirstAsync<LocalFavoriteMeeting>(
      'SELECT * FROM favorite_meetings WHERE id = ? AND user_id = ?',
      [favoriteId, userId],
    );

    if (!favorite) {
      return { success: false, error: 'Favorite meeting not found' };
    }

    // Generate UUID for Supabase if not already synced
    const supabaseId = favorite.supabase_id || generateId();

    // Map local schema to Supabase schema
    const supabaseData = {
      id: supabaseId,
      user_id: userId,
      meeting_id: favorite.meeting_id,
      notes: favorite.encrypted_notes, // Already encrypted
      notification_enabled: favorite.notification_enabled === 1,
      created_at: favorite.created_at,
      updated_at: new Date().toISOString(),
    };

    // Upsert to Supabase (insert or update) with timeout
    const response = await withTimeout(
      Promise.resolve(
        supabase.from('favorite_meetings').upsert(supabaseData, {
          onConflict: 'id',
        }),
      ),
      NETWORK_TIMEOUT_MS,
      'Favorite meeting upsert',
    );
    const supabaseError = (response as { error: { message: string } | null }).error;

    if (supabaseError) {
      logger.error('Supabase upsert failed for favorite meeting', supabaseError);
      return { success: false, error: supabaseError.message };
    }

    // Update local record with supabase_id and mark as synced
    await db.runAsync(
      `UPDATE favorite_meetings
       SET supabase_id = ?, sync_status = 'synced'
       WHERE id = ?`,
      [supabaseId, favoriteId],
    );

    logger.info('Favorite meeting synced successfully', { favoriteId, supabaseId });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to sync favorite meeting', { favoriteId, error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Sync a single reading reflection to Supabase
 * Maps local encrypted fields to Supabase schema
 */
export async function syncReadingReflection(
  db: StorageAdapter,
  reflectionId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the reflection from local database
    const reflection = await db.getFirstAsync<LocalReadingReflection>(
      `SELECT id, user_id, reading_id, reading_date, encrypted_reflection,
       word_count, created_at, updated_at, sync_status, supabase_id
       FROM reading_reflections WHERE id = ? AND user_id = ?`,
      [reflectionId, userId],
    );

    if (!reflection) {
      return {
        success: false,
        error: `Reading reflection not found: ${reflectionId}`,
      };
    }

    // Generate Supabase ID if needed
    const supabaseId = reflection.supabase_id || generateId();

    // Prepare data for Supabase (using established schema patterns)
    const supabaseData = {
      id: supabaseId,
      user_id: reflection.user_id,
      reading_id: reflection.reading_id,
      reading_date: reflection.reading_date,
      encrypted_reflection: reflection.encrypted_reflection,
      word_count: reflection.word_count,
      created_at: reflection.created_at,
      updated_at: reflection.updated_at,
    };

    // Upsert to Supabase (insert or update) with timeout
    const response = await withTimeout(
      Promise.resolve(
        supabase.from('reading_reflections').upsert(supabaseData, {
          onConflict: 'id',
        }),
      ),
      NETWORK_TIMEOUT_MS,
      'Reading reflection upsert',
    );
    const supabaseError = (response as { error: { message: string } | null }).error;

    if (supabaseError) {
      logger.error('Supabase upsert failed for reading reflection', supabaseError);
      return { success: false, error: supabaseError.message };
    }

    // Update local record with supabase_id and mark as synced
    await db.runAsync(
      `UPDATE reading_reflections
       SET supabase_id = ?, sync_status = 'synced'
       WHERE id = ?`,
      [supabaseId, reflectionId],
    );

    logger.info('Reading reflection synced successfully', { reflectionId, supabaseId });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to sync reading reflection', { reflectionId, error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Sync a single weekly report to Supabase
 * Maps local report data to Supabase schema
 */
export async function syncWeeklyReport(
  db: StorageAdapter,
  reportId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const report = await db.getFirstAsync<LocalWeeklyReport>(
      'SELECT * FROM weekly_reports WHERE id = ? AND user_id = ?',
      [reportId, userId],
    );

    if (!report) {
      return { success: false, error: 'Weekly report not found' };
    }

    const supabaseId = report.supabase_id || generateId();

    const supabaseData = {
      id: supabaseId,
      user_id: userId,
      week_start: report.week_start,
      week_end: report.week_end,
      report_json: report.report_json, // Already encrypted or JSON string
      created_at: report.created_at,
    };

    const response = await withTimeout(
      Promise.resolve(
        supabase.from('weekly_reports').upsert(supabaseData, {
          onConflict: 'id',
        }),
      ),
      NETWORK_TIMEOUT_MS,
      'Weekly report upsert',
    );
    const supabaseError = (response as { error: { message: string } | null }).error;

    if (supabaseError) {
      logger.error('Supabase upsert failed for weekly report', supabaseError);
      return { success: false, error: supabaseError.message };
    }

    await db.runAsync(
      `UPDATE weekly_reports SET supabase_id = ?, sync_status = 'synced' WHERE id = ?`,
      [supabaseId, reportId],
    );

    logger.info('Weekly report synced successfully', { reportId, supabaseId });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to sync weekly report', { reportId, error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Sync a single sponsor connection to Supabase
 * Maps local connection data to Supabase schema
 */
export async function syncSponsorConnection(
  db: StorageAdapter,
  connectionId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const connection = await db.getFirstAsync<LocalSponsorConnection>(
      'SELECT * FROM sponsor_connections WHERE id = ? AND user_id = ?',
      [connectionId, userId],
    );

    if (!connection) {
      return { success: false, error: 'Sponsor connection not found' };
    }

    const supabaseId = connection.supabase_id || generateId();

    const supabaseData = {
      id: supabaseId,
      user_id: userId,
      role: connection.role,
      status: connection.status,
      invite_code: connection.invite_code,
      display_name: connection.display_name,
      own_public_key: connection.own_public_key,
      peer_public_key: connection.peer_public_key,
      shared_key: connection.shared_key ? await encryptContent(connection.shared_key) : null,
      pending_private_key: connection.pending_private_key ? await encryptContent(connection.pending_private_key) : null,
      created_at: connection.created_at,
      updated_at: connection.updated_at,
    };

    const response = await withTimeout(
      Promise.resolve(
        supabase.from('sponsor_connections').upsert(supabaseData, {
          onConflict: 'id',
        }),
      ),
      NETWORK_TIMEOUT_MS,
      'Sponsor connection upsert',
    );
    const supabaseError = (response as { error: { message: string } | null }).error;

    if (supabaseError) {
      logger.error('Supabase upsert failed for sponsor connection', supabaseError);
      return { success: false, error: supabaseError.message };
    }

    await db.runAsync(
      `UPDATE sponsor_connections SET supabase_id = ?, sync_status = 'synced', updated_at = ? WHERE id = ?`,
      [supabaseId, new Date().toISOString(), connectionId],
    );

    logger.info('Sponsor connection synced successfully', { connectionId, supabaseId });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to sync sponsor connection', { connectionId, error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Sync a single sponsor shared entry to Supabase
 * Maps local shared entry data to Supabase schema
 */
export async function syncSponsorSharedEntry(
  db: StorageAdapter,
  entryId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const entry = await db.getFirstAsync<LocalSponsorSharedEntry>(
      'SELECT * FROM sponsor_shared_entries WHERE id = ? AND user_id = ?',
      [entryId, userId],
    );

    if (!entry) {
      return { success: false, error: 'Sponsor shared entry not found' };
    }

    const supabaseId = entry.supabase_id || generateId();

    // Get the supabase_id for the connection_id reference
    const connection = await db.getFirstAsync<{ supabase_id: string | null }>(
      'SELECT supabase_id FROM sponsor_connections WHERE id = ?',
      [entry.connection_id],
    );

    if (!connection?.supabase_id) {
      return { success: false, error: 'Parent sponsor connection not synced yet' };
    }

    const supabaseData = {
      id: supabaseId,
      user_id: userId,
      connection_id: connection.supabase_id,
      direction: entry.direction,
      journal_entry_id: entry.journal_entry_id,
      payload: entry.payload, // Already encrypted
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    };

    const response = await withTimeout(
      Promise.resolve(
        supabase.from('sponsor_shared_entries').upsert(supabaseData, {
          onConflict: 'id',
        }),
      ),
      NETWORK_TIMEOUT_MS,
      'Sponsor shared entry upsert',
    );
    const supabaseError = (response as { error: { message: string } | null }).error;

    if (supabaseError) {
      logger.error('Supabase upsert failed for sponsor shared entry', supabaseError);
      return { success: false, error: supabaseError.message };
    }

    await db.runAsync(
      `UPDATE sponsor_shared_entries SET supabase_id = ?, sync_status = 'synced', updated_at = ? WHERE id = ?`,
      [supabaseId, new Date().toISOString(), entryId],
    );

    logger.info('Sponsor shared entry synced successfully', { entryId, supabaseId });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to sync sponsor shared entry', { entryId, error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Sync a single achievement to Supabase
 */
export async function syncAchievement(
  db: StorageAdapter,
  achievementId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const achievement = await db.getFirstAsync<LocalAchievement>(
      'SELECT * FROM achievements WHERE id = ? AND user_id = ?',
      [achievementId, userId],
    );

    if (!achievement) {
      return { success: false, error: 'Achievement not found' };
    }

    const supabaseId = achievement.supabase_id || generateId();

    const supabaseData = {
      id: supabaseId,
      user_id: userId,
      achievement_key: achievement.achievement_key,
      achievement_type: achievement.achievement_type,
      earned_at: achievement.earned_at,
      is_viewed: achievement.is_viewed === 1,
    };

    const response = await withTimeout(
      Promise.resolve(
        supabase.from('achievements').upsert(supabaseData, {
          onConflict: 'id',
        }),
      ),
      NETWORK_TIMEOUT_MS,
      'Achievement upsert',
    );
    const supabaseError = (response as { error: { message: string } | null }).error;

    if (supabaseError) {
      logger.error('Supabase upsert failed for achievement', supabaseError);
      return { success: false, error: supabaseError.message };
    }

    await db.runAsync(
      `UPDATE achievements SET supabase_id = ?, sync_status = 'synced' WHERE id = ?`,
      [supabaseId, achievementId],
    );

    logger.info('Achievement synced successfully', { achievementId, supabaseId });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to sync achievement', { achievementId, error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Sync a single AI memory to Supabase
 * Data is already encrypted locally, so it's sent as-is.
 */
export async function syncAIMemory(
  db: StorageAdapter,
  memoryId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const memory = await db.getFirstAsync<LocalAIMemory>(
      'SELECT * FROM ai_memories WHERE id = ? AND user_id = ?',
      [memoryId, userId],
    );

    if (!memory) {
      return { success: false, error: 'AI memory not found' };
    }

    const supabaseId = memory.supabase_id || generateId();

    const supabaseData = {
      id: supabaseId,
      user_id: userId,
      type: memory.type,
      encrypted_content: memory.encrypted_content,
      confidence: memory.confidence,
      encrypted_context: memory.encrypted_context,
      source_conversation_id: memory.source_conversation_id,
      created_at: memory.created_at,
      updated_at: memory.updated_at,
    };

    const response = await withTimeout(
      Promise.resolve(
        supabase.from('ai_memories').upsert(supabaseData, {
          onConflict: 'id',
        }),
      ),
      NETWORK_TIMEOUT_MS,
      'AI memory upsert',
    );
    const supabaseError = (response as { error: { message: string } | null }).error;

    if (supabaseError) {
      logger.error('Supabase upsert failed for AI memory', supabaseError);
      return { success: false, error: supabaseError.message };
    }

    await db.runAsync(
      `UPDATE ai_memories SET supabase_id = ?, sync_status = 'synced', updated_at = ? WHERE id = ?`,
      [supabaseId, new Date().toISOString(), memoryId],
    );

    logger.info('AI memory synced successfully', { memoryId, supabaseId });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to sync AI memory', { memoryId, error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete a record from Supabase
 */
async function deleteFromSupabase(
  tableName: string,
  supabaseId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await withTimeout(
      Promise.resolve(supabase.from(tableName).delete().eq('id', supabaseId).eq('user_id', userId)),
      NETWORK_TIMEOUT_MS,
      `Delete from ${tableName}`,
    );
    const supabaseError = (response as { error: { message: string } | null }).error;

    if (supabaseError) {
      logger.error('Supabase delete failed', { tableName, supabaseId, error: supabaseError });
      return { success: false, error: supabaseError.message };
    }

    logger.info('Record deleted from Supabase', { tableName, supabaseId });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete from Supabase', { tableName, supabaseId, error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Process a single sync queue item
 * Handles routing to correct sync function and result handling
 */
async function processSyncItem(
  db: StorageAdapter,
  item: SyncQueueItem,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  // Handle delete operations
  if (item.operation === 'delete') {
    if (item.supabase_id) {
      return deleteFromSupabase(item.table_name, item.supabase_id, userId);
    } else {
      // Record was never synced to cloud, so nothing to delete remotely
      logger.info('Delete skipped - record was never synced to cloud', {
        tableName: item.table_name,
        recordId: item.record_id,
        operation: item.operation,
      });
      return { success: true };
    }
  }

  // Handle insert/update operations - route to appropriate sync function
  switch (item.table_name) {
    case 'journal_entries':
      return syncJournalEntry(db, item.record_id, userId);
    case 'step_work':
      return syncStepWork(db, item.record_id, userId);
    case 'daily_checkins':
      return syncDailyCheckIn(db, item.record_id, userId);
    case 'favorite_meetings':
      return syncFavoriteMeeting(db, item.record_id, userId);
    case 'reading_reflections':
      return syncReadingReflection(db, item.record_id, userId);
    case 'weekly_reports':
      return syncWeeklyReport(db, item.record_id, userId);
    case 'sponsor_connections':
      return syncSponsorConnection(db, item.record_id, userId);
    case 'sponsor_shared_entries':
      return syncSponsorSharedEntry(db, item.record_id, userId);
    case 'achievements':
      return syncAchievement(db, item.record_id, userId);
    case 'ai_memories':
      return syncAIMemory(db, item.record_id, userId);
    default:
      return {
        success: false,
        error: `Unknown table: ${item.table_name}`,
      };
  }
}

/**
 * Handle the result of a sync operation
 * Updates queue item on failure, removes on success
 */
async function handleSyncResult(
  db: StorageAdapter,
  item: SyncQueueItem,
  syncResult: { success: boolean; error?: string },
  result: SyncResult,
): Promise<void> {
  if (syncResult.success) {
    // Remove from sync queue on success
    await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [item.id]);
    result.synced++;
    logger.info('Sync item processed successfully', {
      tableName: item.table_name,
      recordId: item.record_id,
      operation: item.operation,
    });
  } else {
    // Increment retry count and store error
    const newRetryCount = item.retry_count + 1;

    // Check if we've exceeded max retries
    if (newRetryCount >= MAX_RETRY_COUNT) {
      // Mark as failed permanently after max retries
      await db.runAsync(
        `UPDATE sync_queue
         SET retry_count = ?, last_error = ?, failed_at = ?
         WHERE id = ?`,
        [newRetryCount, syncResult.error || 'Unknown error', new Date().toISOString(), item.id],
      );
      logger.error('Sync item permanently failed after max retries', {
        queueItemId: item.id,
        tableName: item.table_name,
        recordId: item.record_id,
        operation: item.operation,
        retryCount: newRetryCount,
        error: syncResult.error,
      });
    } else {
      // Still have retries left
      await db.runAsync(
        `UPDATE sync_queue
         SET retry_count = ?, last_error = ?
         WHERE id = ?`,
        [newRetryCount, syncResult.error || 'Unknown error', item.id],
      );
      logger.warn('Sync failed, will retry', {
        queueItemId: item.id,
        tableName: item.table_name,
        recordId: item.record_id,
        operation: item.operation,
        retryCount: newRetryCount,
        maxRetries: MAX_RETRY_COUNT,
        error: syncResult.error,
      });
    }

    result.failed++;
    result.errors.push(
      `[${item.operation}] ${item.table_name}/${item.record_id}: ${syncResult.error || 'Unknown error'}`,
    );
  }
}

/** Maximum items to keep in sync queue (oldest failed items removed first) */
const MAX_SYNC_QUEUE_SIZE = 500;

/** Days to keep failed sync items before cleanup */
const FAILED_ITEM_RETENTION_DAYS = 7;

/**
 * Clean up old failed items and enforce queue size limits
 * Call periodically (e.g., daily) to prevent unbounded growth
 */
export async function cleanupSyncQueue(db: StorageAdapter): Promise<{ removed: number }> {
  let totalRemoved = 0;
  try {
    // Remove permanently failed items older than retention period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - FAILED_ITEM_RETENTION_DAYS);

    // Count before deleting
    const oldCountResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue WHERE failed_at IS NOT NULL AND failed_at < ?',
      [cutoffDate.toISOString()],
    );
    const oldCount = oldCountResult?.count || 0;

    await db.runAsync(
      `DELETE FROM sync_queue WHERE failed_at IS NOT NULL AND failed_at < ?`,
      [cutoffDate.toISOString()],
    );
    totalRemoved += oldCount;

    // Enforce queue size limit by removing oldest failed items first
    // Count total items
    const countResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue',
    );
    const count = countResult?.count || 0;

    if (count > MAX_SYNC_QUEUE_SIZE) {
      const excess = count - MAX_SYNC_QUEUE_SIZE;
      const removeCount = Math.min(excess, 100);

      // Count failed items before deleting
      const sizeCountResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sync_queue WHERE failed_at IS NOT NULL`,
      );
      const sizeCount = sizeCountResult?.count || 0;

      // Remove oldest failed items
      await db.runAsync(
        `DELETE FROM sync_queue
         WHERE id IN (
           SELECT id FROM sync_queue
           WHERE failed_at IS NOT NULL
           ORDER BY failed_at ASC
           LIMIT ${removeCount}
         )`,
      );
      totalRemoved += sizeCount;
    }

    return { removed: totalRemoved };
  } catch (error) {
    logger.error('Failed to cleanup sync queue', error);
    return { removed: 0 };
  }
}

/**
 * Process the sync queue with batch processing and retry logic
 *
 * IMPORTANT: Deletes are processed BEFORE inserts/updates to avoid
 * foreign key conflicts and ensure data consistency.
 *
 * @param db - Storage adapter instance (SQLite on mobile, IndexedDB on web)
 * @param userId - Current user ID
 * @param maxBatchSize - Maximum items to process per batch (default: 50)
 * @returns SyncResult with counts and errors
 */
export async function processSyncQueue(
  db: StorageAdapter,
  userId: string,
  maxBatchSize: number = 50,
): Promise<SyncResult> {
  // Prevent concurrent sync operations using mutex
  if (syncMutex.isLocked()) {
    logger.info('Sync already in progress, skipping duplicate call');
    return { synced: 0, failed: 0, errors: ['Sync already in progress'] };
  }

  await syncMutex.acquire();

  const result: SyncResult = {
    synced: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Fetch pending sync items, ordered by creation time
    // Limit to maxBatchSize to prevent overwhelming the system
    // Exclude items that have permanently failed (failed_at IS NOT NULL)
    const queueItems = await db.getAllAsync<SyncQueueItem>(
      `SELECT * FROM sync_queue
       WHERE retry_count < ?
       AND (failed_at IS NULL OR failed_at = '')
       ORDER BY created_at ASC
       LIMIT ?`,
      [MAX_RETRY_COUNT, maxBatchSize],
    );

    if (queueItems.length === 0) {
      logger.info('Sync queue is empty');
      return result;
    }

    // Separate deletes from inserts/updates
    // Process deletes FIRST to avoid foreign key conflicts
    const deleteItems = queueItems.filter((item) => item.operation === 'delete');
    const upsertItems = queueItems.filter((item) => item.operation !== 'delete');

    logger.info('Processing sync queue', {
      total: queueItems.length,
      deletes: deleteItems.length,
      upserts: upsertItems.length,
    });

    // Phase 1: Process all delete operations first
    if (deleteItems.length > 0) {
      logger.info('Phase 1: Processing delete operations', { count: deleteItems.length });
      for (const item of deleteItems) {
        const syncResult = await processSyncItem(db, item, userId);
        await handleSyncResult(db, item, syncResult, result);
      }
    }

    // Phase 2: Process all insert/update operations with exponential backoff for retries
    if (upsertItems.length > 0) {
      logger.info('Phase 2: Processing insert/update operations', { count: upsertItems.length });
      for (const item of upsertItems) {
        // Apply exponential backoff BEFORE retrying (not on first attempt)
        if (item.retry_count > 0) {
          const delayMs = Math.min(
            BASE_BACKOFF_MS * Math.pow(2, item.retry_count - 1),
            30000, // Cap at 30 seconds
          );
          logger.info('Applying exponential backoff before retry', {
            queueItemId: item.id,
            retryCount: item.retry_count,
            delayMs,
          });
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        const syncResult = await processSyncItem(db, item, userId);
        await handleSyncResult(db, item, syncResult, result);
      }
    }

    logger.info('Sync queue processing complete', {
      synced: result.synced,
      failed: result.failed,
      deletesProcessed: deleteItems.length,
      upsertsProcessed: upsertItems.length,
    });

    return result;
  } catch (error) {
    logger.error('Sync queue processing failed', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  } finally {
    // Always release the mutex, even if sync fails
    syncMutex.release();
  }
}

/**
 * Add a record to the sync queue
 * This should be called whenever a record is created, updated, or deleted
 *
 * @param db - Storage adapter instance (SQLite on mobile, IndexedDB on web)
 * @param tableName - Name of the table (journal_entries, daily_checkins, step_work)
 * @param recordId - ID of the record to sync
 * @param operation - Type of operation (insert, update, delete)
 * @param supabaseId - Optional Supabase ID (required for delete operations)
 */
export async function addToSyncQueue(
  db: StorageAdapter,
  tableName: string,
  recordId: string,
  operation: 'insert' | 'update' | 'delete',
  supabaseId?: string | null,
): Promise<void> {
  try {
    // Enforce queue size limit before adding.
    // IMPORTANT: Only evict permanently-failed items (failed_at IS NOT NULL).
    // Never evict pending items — that would silently drop unsynced user data.
    const totalResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue',
    );
    const total = totalResult?.count || 0;

    if (total >= MAX_SYNC_QUEUE_SIZE) {
      // Remove only permanently-failed items to make room, oldest first.
      const deleteResult = await db.runAsync(
        `DELETE FROM sync_queue
         WHERE id IN (
           SELECT id FROM sync_queue
           WHERE failed_at IS NOT NULL
           ORDER BY failed_at ASC
           LIMIT 10
         )`,
      );
      logger.warn('Sync queue at capacity, removed oldest permanently-failed items', { removed: deleteResult });
    }

    const queueId = generateId('sync');
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT OR REPLACE INTO sync_queue (id, table_name, record_id, operation, supabase_id, created_at, retry_count)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [queueId, tableName, recordId, operation, supabaseId || null, now],
    );

    logger.info('Added to sync queue', {
      tableName,
      recordId,
      operation,
      supabaseId: supabaseId || null,
    });
  } catch (error) {
    // Never throw — sync queue is a best-effort side effect.
    // The primary SQLite write already succeeded; a sync queue failure
    // should not propagate up and cause optimistic UI rollbacks.
    logger.error('Failed to add to sync queue', { tableName, recordId, error });
  }
}

/**
 * Queue a delete operation with proper supabase_id capture
 * This helper fetches the supabase_id before the record is deleted
 *
 * @param db - Storage adapter instance (SQLite on mobile, IndexedDB on web)
 * @param tableName - Name of the table
 * @param recordId - ID of the record to delete
 * @param userId - User ID for ownership verification
 */
export async function addDeleteToSyncQueue(
  db: StorageAdapter,
  tableName: string,
  recordId: string,
  userId: string,
): Promise<void> {
  try {
    if (!isValidSyncTable(tableName)) {
      throw new Error(`Invalid table name for sync: ${tableName}`);
    }

    // Fetch the supabase_id before deletion
    const record = await db.getFirstAsync<{ supabase_id: string | null }>(
      `SELECT supabase_id FROM ${tableName} WHERE id = ? AND user_id = ?`,
      [recordId, userId],
    );

    const supabaseId = record?.supabase_id || null;

    // Add to sync queue with the supabase_id
    await addToSyncQueue(db, tableName, recordId, 'delete', supabaseId);

    if (!supabaseId) {
      logger.info('Delete queued for unsynced record - will skip cloud delete', {
        tableName,
        recordId,
      });
    }
  } catch (error) {
    // Never throw — sync queue is a best-effort side effect.
    // The record will still be deleted locally; it just won't sync the
    // deletion to Supabase until re-queued or the next full sync.
    logger.error('Failed to queue delete operation', { tableName, recordId, error });
  }
}

// ─── Pull Sync (Cloud → Device) ─────────────────────────────────────────────

// PULL_SYNC_TABLES and PullSyncTable are imported from syncRegistry.

/**
 * Pull changes from Supabase for a single table.
 * Fetches records updated after the last pull timestamp and upserts locally.
 * Uses last-write-wins conflict resolution based on updated_at.
 */
async function pullTable(
  db: StorageAdapter,
  tableName: PullSyncTable,
  userId: string,
  lastPullAt: string | null,
): Promise<{ pulled: number; error?: string }> {
  try {
    let query = supabase
      .from(tableName)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: true })
      .limit(200);

    if (lastPullAt) {
      query = query.gt('updated_at', lastPullAt);
    }

    const { data, error } = await withTimeout(
      Promise.resolve(query),
      NETWORK_TIMEOUT_MS,
      `Pull ${tableName}`,
    );

    if (error) {
      return { pulled: 0, error: error.message };
    }

    if (!data || data.length === 0) {
      return { pulled: 0 };
    }

    let pulled = 0;

    for (const record of data) {
      try {
        const upserted = await upsertLocalRecord(db, tableName, record, userId);
        if (upserted) pulled++;
      } catch (err) {
        logger.error('Failed to upsert pulled record', {
          tableName,
          recordId: record.id,
          error: err,
        });
      }
    }

    return { pulled };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { pulled: 0, error: msg };
  }
}

/**
 * Upsert a remote record into the local database.
 * Skips if local record has a newer updated_at (last-write-wins).
 * Returns true if the record was inserted or updated.
 */
async function upsertLocalRecord(
  db: StorageAdapter,
  tableName: PullSyncTable,
  remote: Record<string, unknown>,
  userId: string,
): Promise<boolean> {
  const remoteId = remote.id as string;
  const remoteUpdatedAt = (remote.updated_at as string) || (remote.created_at as string);

  // Check if we already have this record (by supabase_id)
  const existing = await db.getFirstAsync<{
    id: string;
    updated_at: string;
    sync_status: string;
  }>(
    `SELECT id, updated_at, sync_status FROM ${tableName} WHERE supabase_id = ? AND user_id = ?`,
    [remoteId, userId],
  );

  if (existing) {
    // Last-write-wins: skip if local is newer or same
    if (existing.updated_at >= remoteUpdatedAt) {
      return false;
    }
    // Update existing local record
    await updateLocalFromRemote(db, tableName, existing.id, remote);
    return true;
  }

  // Insert new local record from remote
  await insertLocalFromRemote(db, tableName, remote, userId);
  return true;
}

/**
 * Update an existing local record with remote data.
 */
async function updateLocalFromRemote(
  db: StorageAdapter,
  tableName: PullSyncTable,
  localId: string,
  remote: Record<string, unknown>,
): Promise<void> {
  switch (tableName) {
    case 'journal_entries':
      // Remote field names must match what syncJournalEntry pushes:
      //   title → encrypted_title
      //   content → encrypted_body
      //   mood → encrypted_mood
      //   craving → encrypted_craving
      //   tags[0] → encrypted_tags (stored as single-element array on remote)
      //   audio → encrypted_audio
      await db.runAsync(
        `UPDATE journal_entries
         SET encrypted_title = ?, encrypted_body = ?, encrypted_mood = ?,
             encrypted_craving = ?, encrypted_tags = ?, encrypted_audio = ?,
             updated_at = ?, sync_status = 'synced'
         WHERE id = ?`,
        [
          (remote.title as string) || null,
          (remote.content as string) || '',
          (remote.mood as string) || null,
          (remote.craving as string) || null,
          Array.isArray(remote.tags) ? ((remote.tags as string[])[0] ?? null) : ((remote.tags as string) || null),
          (remote.audio as string) || null,
          (remote.updated_at as string) || new Date().toISOString(),
          localId,
        ],
      );
      break;

    case 'step_work':
      // Remote field name must match what syncStepWork pushes:
      //   content → encrypted_answer
      //   is_completed → is_complete (boolean → integer)
      await db.runAsync(
        `UPDATE step_work
         SET encrypted_answer = ?, is_complete = ?, completed_at = ?,
             updated_at = ?, sync_status = 'synced'
         WHERE id = ?`,
        [
          (remote.content as string) || null,
          remote.is_completed ? 1 : 0,
          (remote.completed_at as string) || null,
          (remote.updated_at as string) || new Date().toISOString(),
          localId,
        ],
      );
      break;

    case 'daily_checkins':
      await db.runAsync(
        `UPDATE daily_checkins
         SET encrypted_intention = ?, encrypted_reflection = ?,
             encrypted_mood = ?, encrypted_craving = ?, encrypted_gratitude = ?,
             updated_at = ?, sync_status = 'synced'
         WHERE id = ?`,
        [
          (remote.intention as string) || null,
          (remote.notes as string) || null,
          (remote.mood as string) || null,
          (remote.challenges_faced as string) || null,
          (remote.gratitude as string) || null,
          (remote.updated_at as string) || new Date().toISOString(),
          localId,
        ],
      );
      break;

    case 'favorite_meetings':
      await db.runAsync(
        `UPDATE favorite_meetings
         SET encrypted_notes = ?, notification_enabled = ?,
             sync_status = 'synced'
         WHERE id = ?`,
        [
          (remote.notes as string) || null,
          remote.notification_enabled ? 1 : 0,
          localId,
        ],
      );
      break;

    case 'reading_reflections':
      // Remote field name must match what syncReadingReflection pushes:
      //   encrypted_reflection → encrypted_reflection (same name kept on remote)
      await db.runAsync(
        `UPDATE reading_reflections
         SET encrypted_reflection = ?, word_count = ?,
             updated_at = ?, sync_status = 'synced'
         WHERE id = ?`,
        [
          (remote.encrypted_reflection as string) || '',
          (remote.word_count as number) || 0,
          (remote.updated_at as string) || new Date().toISOString(),
          localId,
        ],
      );
      break;

    case 'weekly_reports':
      await db.runAsync(
        `UPDATE weekly_reports
         SET report_json = ?, sync_status = 'synced'
         WHERE id = ?`,
        [(remote.report_json as string) || '{}', localId],
      );
      break;

    case 'achievements':
      await db.runAsync(
        `UPDATE achievements
         SET achievement_key = ?, achievement_type = ?, earned_at = ?,
             is_viewed = ?, sync_status = 'synced'
         WHERE id = ?`,
        [
          (remote.achievement_key as string) || '',
          (remote.achievement_type as string) || '',
          (remote.earned_at as string) || new Date().toISOString(),
          remote.is_viewed ? 1 : 0,
          localId,
        ],
      );
      break;

    case 'ai_memories':
      await db.runAsync(
        `UPDATE ai_memories
         SET type = ?, encrypted_content = ?, confidence = ?,
             encrypted_context = ?, source_conversation_id = ?,
             updated_at = ?, sync_status = 'synced'
         WHERE id = ?`,
        [
          (remote.type as string) || '',
          (remote.encrypted_content as string) || '',
          (remote.confidence as number) || 0.5,
          (remote.encrypted_context as string) || null,
          (remote.source_conversation_id as string) || null,
          (remote.updated_at as string) || new Date().toISOString(),
          localId,
        ],
      );
      break;
  }
}

/**
 * Insert a new local record from remote data.
 */
async function insertLocalFromRemote(
  db: StorageAdapter,
  tableName: PullSyncTable,
  remote: Record<string, unknown>,
  userId: string,
): Promise<void> {
  const localId = generateId('pull');
  const remoteId = remote.id as string;
  const now = new Date().toISOString();

  switch (tableName) {
    case 'journal_entries':
      // Remote field names mirror what syncJournalEntry pushes.
      await db.runAsync(
        `INSERT INTO journal_entries
         (id, user_id, encrypted_title, encrypted_body, encrypted_mood,
          encrypted_craving, encrypted_tags, encrypted_audio, created_at, updated_at,
          sync_status, supabase_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
        [
          localId, userId,
          (remote.title as string) || null,
          (remote.content as string) || '',
          (remote.mood as string) || null,
          (remote.craving as string) || null,
          Array.isArray(remote.tags) ? ((remote.tags as string[])[0] ?? null) : ((remote.tags as string) || null),
          (remote.audio as string) || null,
          (remote.created_at as string) || now,
          (remote.updated_at as string) || now,
          remoteId,
        ],
      );
      break;

    case 'step_work':
      // Remote field names mirror what syncStepWork pushes.
      // question_number is now included in push payload (Supabase migration 20260313000001).
      // INSERT OR IGNORE: if the UNIQUE(user_id, step_number, question_number) constraint fires
      // (e.g. remote schema predates the question_number column), skip the insert rather than crash.
      await db.runAsync(
        `INSERT OR IGNORE INTO step_work
         (id, user_id, step_number, question_number, encrypted_answer,
          is_complete, completed_at, created_at, updated_at,
          sync_status, supabase_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
        [
          localId, userId,
          (remote.step_number as number) || 1,
          (remote.question_number as number) || 1,
          (remote.content as string) || null,
          remote.is_completed ? 1 : 0,
          (remote.completed_at as string) || null,
          (remote.created_at as string) || now,
          (remote.updated_at as string) || now,
          remoteId,
        ],
      );
      break;

    case 'daily_checkins':
      await db.runAsync(
        `INSERT INTO daily_checkins
         (id, user_id, check_in_type, check_in_date,
          encrypted_intention, encrypted_reflection, encrypted_mood,
          encrypted_craving, encrypted_gratitude,
          created_at, updated_at, sync_status, supabase_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
        [
          localId, userId,
          (remote.checkin_type as string) || 'morning',
          (remote.checkin_date as string) || now.split('T')[0],
          (remote.intention as string) || null,
          (remote.notes as string) || null,
          (remote.mood as string) || null,
          (remote.challenges_faced as string) || null,
          (remote.gratitude as string) || null,
          (remote.created_at as string) || now,
          (remote.updated_at as string) || now,
          remoteId,
        ],
      );
      break;

    case 'favorite_meetings':
      await db.runAsync(
        `INSERT INTO favorite_meetings
         (id, user_id, meeting_id, encrypted_notes, notification_enabled,
          created_at, sync_status, supabase_id)
         VALUES (?, ?, ?, ?, ?, ?, 'synced', ?)`,
        [
          localId, userId,
          (remote.meeting_id as string) || '',
          (remote.notes as string) || null,
          remote.notification_enabled ? 1 : 0,
          (remote.created_at as string) || now,
          remoteId,
        ],
      );
      break;

    case 'reading_reflections':
      // Remote field names mirror what syncReadingReflection pushes.
      await db.runAsync(
        `INSERT INTO reading_reflections
         (id, user_id, reading_id, reading_date, encrypted_reflection,
          word_count, created_at, updated_at, sync_status, supabase_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
        [
          localId, userId,
          (remote.reading_id as string) || '',
          (remote.reading_date as string) || now.split('T')[0],
          (remote.encrypted_reflection as string) || '',
          (remote.word_count as number) || 0,
          (remote.created_at as string) || now,
          (remote.updated_at as string) || now,
          remoteId,
        ],
      );
      break;

    case 'weekly_reports':
      await db.runAsync(
        `INSERT INTO weekly_reports
         (id, user_id, week_start, week_end, report_json,
          created_at, sync_status, supabase_id)
         VALUES (?, ?, ?, ?, ?, ?, 'synced', ?)`,
        [
          localId, userId,
          (remote.week_start as string) || '',
          (remote.week_end as string) || '',
          (remote.report_json as string) || '{}',
          (remote.created_at as string) || now,
          remoteId,
        ],
      );
      break;

    case 'achievements':
      // updated_at added to achievements in local migration v22.
      // Remote schema should also have it (Supabase migration 20260313000002).
      await db.runAsync(
        `INSERT INTO achievements
         (id, user_id, achievement_key, achievement_type, earned_at,
          is_viewed, updated_at, sync_status, supabase_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
        [
          localId, userId,
          (remote.achievement_key as string) || '',
          (remote.achievement_type as string) || '',
          (remote.earned_at as string) || now,
          remote.is_viewed ? 1 : 0,
          (remote.updated_at as string) || (remote.earned_at as string) || now,
          remoteId,
        ],
      );
      break;

    case 'ai_memories':
      await db.runAsync(
        `INSERT INTO ai_memories
         (id, user_id, type, encrypted_content, confidence,
          encrypted_context, source_conversation_id,
          created_at, updated_at, sync_status, supabase_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
        [
          localId, userId,
          (remote.type as string) || '',
          (remote.encrypted_content as string) || '',
          (remote.confidence as number) || 0.5,
          (remote.encrypted_context as string) || null,
          (remote.source_conversation_id as string) || null,
          (remote.created_at as string) || now,
          (remote.updated_at as string) || now,
          remoteId,
        ],
      );
      break;
  }
}

/**
 * Pull all changes from Supabase to local device.
 *
 * Iterates over all syncable tables and pulls records updated since
 * the last pull timestamp. Uses last-write-wins conflict resolution.
 *
 * @param db - Storage adapter instance
 * @param userId - Authenticated user ID
 * @returns Pull sync result with count of pulled records
 */
export async function pullFromCloud(
  db: StorageAdapter,
  userId: string,
): Promise<PullSyncResult> {
  const result: PullSyncResult = { pulled: 0, errors: [] };

  if (syncMutex.isLocked()) {
    result.errors.push('Sync in progress, skipping pull');
    return result;
  }

  await syncMutex.acquire();

  try {
    for (const tableName of PULL_SYNC_TABLES) {
      // Get last pull timestamp for this table.
      // sync_metadata schema: (table_name TEXT PRIMARY KEY, last_pull_at TEXT, ...)
      const lastPullRow = await db.getFirstAsync<{ last_pull_at: string | null }>(
        `SELECT last_pull_at FROM sync_metadata WHERE table_name = ?`,
        [tableName],
      );
      const lastPullAt = lastPullRow?.last_pull_at ?? null;

      const tableResult = await pullTable(db, tableName, userId, lastPullAt);

      if (tableResult.error) {
        result.errors.push(`${tableName}: ${tableResult.error}`);
        logger.error('Pull failed for table', { tableName, error: tableResult.error });
      } else {
        result.pulled += tableResult.pulled;

        // Update last pull timestamp using the correct column names from migration v15.
        const now = new Date().toISOString();
        await db.runAsync(
          `INSERT OR REPLACE INTO sync_metadata (table_name, last_pull_at) VALUES (?, ?)`,
          [tableName, now],
        );
      }

      logger.info('Pull table result', {
        tableName,
        pulled: tableResult.pulled,
        error: tableResult.error || null,
      });
    }

    logger.info('Pull sync complete', {
      totalPulled: result.pulled,
      errors: result.errors.length,
    });

    return result;
  } catch (error) {
    logger.error('Pull sync failed', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown pull error');
    return result;
  } finally {
    syncMutex.release();
  }
}
