/**
 * Sync Registry
 *
 * Single source of truth for all table-level sync configuration.
 * Replaces the scattered VALID_SYNC_TABLES / PULL_SYNC_TABLES / clearDatabase
 * table lists with one typed registry that all sync and cleanup code imports.
 *
 * **Table categories**:
 * - SYNCABLE_TABLES   — full push + pull support
 * - PUSH_ONLY_TABLES  — push implemented, pull not yet (E2E-encrypted channels)
 * - VALID_SYNC_TABLES — union: any table eligible for addToSyncQueue / addDeleteToSyncQueue
 * - PULL_SYNC_TABLES  — alias for SYNCABLE_TABLES (what pullFromCloud iterates)
 * - CLEANUP_TABLES    — every user-data table, ordered FK-safe for clearDatabase
 *
 * **Adding a new syncable table**:
 * 1. Add it to SYNCABLE_TABLES (or PUSH_ONLY_TABLES if pull isn't ready).
 * 2. Add a processSyncItem case in syncService.ts.
 * 3. If pull is supported, add updateLocalFromRemote + insertLocalFromRemote cases.
 * 4. Add it to CLEANUP_TABLES at the correct FK-ordered position.
 * 5. Add migration if schema columns are needed (sync_status, supabase_id, updated_at).
 *
 * @module services/syncRegistry
 */

// ─── Push + Pull tables ──────────────────────────────────────────────────────

/**
 * Tables that have BOTH push (processSyncItem) and pull
 * (updateLocalFromRemote / insertLocalFromRemote) handlers implemented.
 *
 * These are iterated by pullFromCloud and are eligible for full bidirectional sync.
 */
export const SYNCABLE_TABLES = [
  'journal_entries',
  'step_work',
  'daily_checkins',
  'favorite_meetings',
  'reading_reflections',
  'weekly_reports',
  'achievements',
  'ai_memories',
] as const;

export type SyncableTable = (typeof SYNCABLE_TABLES)[number];

// ─── Push-only tables ────────────────────────────────────────────────────────

/**
 * Tables that have push handlers but no pull implementation yet.
 *
 * sponsor_connections / sponsor_shared_entries use E2E-encrypted key exchange;
 * pull requires additional decryption context not yet implemented.
 */
export const PUSH_ONLY_TABLES = [
  'sponsor_connections',
  'sponsor_shared_entries',
] as const;

export type PushOnlyTable = (typeof PUSH_ONLY_TABLES)[number];

// ─── Derived unions ──────────────────────────────────────────────────────────

/**
 * All tables eligible for addToSyncQueue / addDeleteToSyncQueue.
 * A table belongs here only when ALL THREE are true:
 *   1. A processSyncItem handler exists (push).
 *   2. The table has sync_status TEXT, supabase_id TEXT, and updated_at TEXT columns.
 *   3. addDeleteToSyncQueue can safely capture supabase_id before deletion.
 *
 * Tables deliberately excluded (not yet ready for sync):
 *   - personal_inventory — schema prep done (v21), no handler yet
 *   - gratitude_entries  — schema prep done (v21), no handler yet
 *   - safety_plans       — schema prep done (v21), no handler yet
 *   - sponsor_messages   — schema prep done (v21), no handler yet
 *   - craving_surf_sessions — has sync_status/supabase_id but no handler yet
 *   - active_challenges  — local-only, no supabase table
 *   - weather_snapshots  — local-only cache
 */
export const VALID_SYNC_TABLES = [
  ...SYNCABLE_TABLES,
  ...PUSH_ONLY_TABLES,
] as const;

export type ValidSyncTable = (typeof VALID_SYNC_TABLES)[number];

/**
 * Tables that support pull sync (cloud → device).
 * Alias for SYNCABLE_TABLES; kept as a named export for clarity at the call site.
 */
export const PULL_SYNC_TABLES = SYNCABLE_TABLES;

export type PullSyncTable = SyncableTable;

// ─── Cleanup registry ────────────────────────────────────────────────────────

/**
 * All user-data tables, ordered so children are deleted before parents
 * (foreign key safe). Pass to clearDatabase.
 *
 * **NOT included** (correct omissions):
 *   - schema_migrations  — device-level metadata; never cleared on logout
 *
 * **FK dependency order** (child → parent):
 *   sponsor_messages         → sponsor_connections
 *   sponsor_shared_entries   → sponsor_connections
 *   favorite_meetings        → cached_meetings
 *   reading_reflections      → user_profile, daily_readings
 *   journal/step/checkins/achievements/etc → user_profile
 */
export const CLEANUP_TABLES = [
  // Auxiliary / metadata (no FK dependants)
  'sync_queue',
  'sync_metadata',
  // Standalone activity tables
  'active_challenges',
  'weather_snapshots',
  'ai_memories',
  'craving_surf_sessions',
  'safety_plans',
  // Sponsor sub-tables before sponsor_connections
  'sponsor_messages',
  'sponsor_shared_entries',
  'sponsor_connections',
  // Meeting sub-tables before cached_meetings
  'favorite_meetings',
  'meeting_search_cache',
  'cached_meetings',
  // Content tables (reference user_profile)
  'reading_reflections', // also references daily_readings
  'daily_readings',
  'achievements',
  'step_work',
  'daily_checkins',
  'journal_entries',
  'weekly_reports',
  'gratitude_entries',
  'personal_inventory',
  // Root user record last
  'user_profile',
] as const;

export type CleanupTable = (typeof CLEANUP_TABLES)[number];

// ─── Guards ──────────────────────────────────────────────────────────────────

/** Type guard: is this string a member of VALID_SYNC_TABLES? */
export function isValidSyncTable(tableName: string): tableName is ValidSyncTable {
  return (VALID_SYNC_TABLES as readonly string[]).includes(tableName);
}

/** Type guard: is this string a member of PULL_SYNC_TABLES? */
export function isPullSyncTable(tableName: string): tableName is PullSyncTable {
  return (PULL_SYNC_TABLES as readonly string[]).includes(tableName);
}
