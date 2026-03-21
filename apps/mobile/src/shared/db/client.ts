/**
 * SQLite Database Client
 * Handles database initialization and migrations
 *
 * SECURITY ARCHITECTURE:
 * ---------------------
 * This app uses a DEFENSE-IN-DEPTH approach to data security:
 *
 * 1. FIELD-LEVEL ENCRYPTION (Primary Protection):
 *    - All sensitive content (journal entries, reflections, notes) is encrypted
 *      using AES-256-GCM before storage via lib/encryption
 *    - Encryption keys are stored in expo-secure-store with biometric protection
 *    - This ensures data remains encrypted even if database file is accessed
 *
 * 2. iOS DATA PROTECTION:
 *    - On iOS, database files automatically benefit from iOS Data Protection
 *    - Files are encrypted when device is locked (NSFileProtectionComplete)
 *
 * 3. ANDROID ENCRYPTED FILE SYSTEM:
 *    - Modern Android devices use file-based encryption (FBE)
 *    - Database files in app's private directory are protected
 *
 * NOTE ON SQLCipher:
 * -----------------
 * SQLCipher (full database encryption) is NOT currently used because:
 * - expo-sqlite doesn't natively support SQLCipher
 * - Field-level encryption already protects all sensitive content
 * - Platform-level protections provide additional file security
 * - Performance impact of full-DB encryption is avoided
 *
 * If SQLCipher is needed in future (e.g., for compliance), consider:
 * - expo-community-sqlite-storage with SQLCipher support
 * - react-native-quick-sqlite with encryption
 */

import * as SQLite from 'expo-sqlite';
import { logger } from '../utils/logger';

const DATABASE_NAME = 'recovery_companion.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get the database instance
 * Database is stored in the app's private directory which is:
 * - Protected by iOS Data Protection on iOS
 * - Protected by Android's FBE on Android
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    // Enable WAL mode for better performance and reliability
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // Enable foreign keys for referential integrity
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }
  return db;
}

/**
 * Initialize database with schema
 */
export async function initializeDatabase(): Promise<void> {
  try {
    const database = await getDatabase();

    // Create all tables
    await database.execAsync(`
    -- Sobriety Profile
    CREATE TABLE IF NOT EXISTS sobriety_profile (
      id TEXT PRIMARY KEY,
      sobriety_date TEXT NOT NULL,
      program_type TEXT NOT NULL,
      display_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Journal Entries
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      mood_before INTEGER,
      mood_after INTEGER,
      craving_level INTEGER,
      emotion_tags TEXT,
      step_number INTEGER,
      meeting_id TEXT,
      audio_uri TEXT,
      audio_duration INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (meeting_id) REFERENCES meeting_logs(id)
    );

    -- Daily Check-ins
    CREATE TABLE IF NOT EXISTS daily_checkins (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      mood INTEGER NOT NULL,
      craving_level INTEGER NOT NULL,
      gratitude TEXT,
      is_checked_in INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Milestones
    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      reflection TEXT,
      achieved_at TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL
    );

    -- Meeting Logs
    CREATE TABLE IF NOT EXISTS meeting_logs (
      id TEXT PRIMARY KEY,
      name TEXT,
      location TEXT,
      type TEXT NOT NULL,
      mood_before INTEGER NOT NULL,
      mood_after INTEGER NOT NULL,
      key_takeaways TEXT NOT NULL,
      topic_tags TEXT,
      attended_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      -- Enhanced fields (Phase 2)
      what_i_learned TEXT,
      quote_heard TEXT,
      connections_mode TEXT,
      connection_notes TEXT,
      did_share INTEGER DEFAULT 0,
      share_reflection TEXT,
      regular_meeting_id TEXT
    );

    -- Emotion Tags
    CREATE TABLE IF NOT EXISTS emotion_tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      is_custom INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- App Settings
    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY,
      check_in_time TEXT NOT NULL,
      auto_lock_minutes INTEGER NOT NULL DEFAULT 5,
      biometric_enabled INTEGER NOT NULL DEFAULT 1,
      theme_mode TEXT NOT NULL DEFAULT 'system',
      notifications_enabled INTEGER NOT NULL DEFAULT 1,
      crisis_region TEXT NOT NULL DEFAULT 'US',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Relapse Records
    CREATE TABLE IF NOT EXISTS relapse_records (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      what_happened TEXT,
      what_learned TEXT,
      plan TEXT,
      previous_sober_days INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Time Capsules
    CREATE TABLE IF NOT EXISTS time_capsules (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      unlock_date TEXT NOT NULL,
      is_unlocked INTEGER NOT NULL DEFAULT 0,
      unlocked_at TEXT,
      created_at TEXT NOT NULL
    );

    -- Motivation Vault
    CREATE TABLE IF NOT EXISTS motivation_vault (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      media_uri TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      view_count INTEGER NOT NULL DEFAULT 0,
      last_viewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Scenario Practice Records
    CREATE TABLE IF NOT EXISTS scenario_practices (
      id TEXT PRIMARY KEY,
      scenario_id TEXT NOT NULL,
      selected_option_index INTEGER NOT NULL,
      reflection TEXT,
      completed_at TEXT NOT NULL
    );

    -- V2 Tables --

    -- Recovery Contacts
    CREATE TABLE IF NOT EXISTS recovery_contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL,
      notes TEXT,
      last_contacted_at TEXT,
      created_at TEXT NOT NULL
    );

    -- Regular Meetings (recurring schedule)
    CREATE TABLE IF NOT EXISTS regular_meetings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      day_of_week INTEGER NOT NULL,
      time TEXT NOT NULL,
      type TEXT NOT NULL,
      is_home_group INTEGER NOT NULL DEFAULT 0,
      reminder_enabled INTEGER NOT NULL DEFAULT 1,
      reminder_minutes_before INTEGER NOT NULL DEFAULT 60,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    -- Achievements
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      unlock_type TEXT NOT NULL,
      target INTEGER,
      current INTEGER,
      status TEXT NOT NULL DEFAULT 'locked',
      unlocked_at TEXT,
      requires_days_clean INTEGER,
      requires_achievements TEXT,
      reflection TEXT
    );

    -- Daily Reading Reflections
    CREATE TABLE IF NOT EXISTS daily_reading_reflections (
      id TEXT PRIMARY KEY,
      reading_date TEXT NOT NULL,
      reflection TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Fourth Step Inventory
    CREATE TABLE IF NOT EXISTS fourth_step_inventory (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      who TEXT NOT NULL,
      cause TEXT NOT NULL,
      affects TEXT NOT NULL,
      my_part TEXT,
      created_at TEXT NOT NULL
    );

    -- Amends List (8th/9th Step)
    CREATE TABLE IF NOT EXISTS amends_list (
      id TEXT PRIMARY KEY,
      person TEXT NOT NULL,
      harm TEXT NOT NULL,
      amends_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'not_willing',
      notes TEXT,
      made_at TEXT,
      created_at TEXT NOT NULL
    );

    -- Phone Call Logs
    CREATE TABLE IF NOT EXISTS phone_call_logs (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      duration INTEGER,
      notes TEXT,
      called_at TEXT NOT NULL,
      FOREIGN KEY (contact_id) REFERENCES recovery_contacts(id)
    );

    -- Gratitude Entries
    CREATE TABLE IF NOT EXISTS gratitude_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      items TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Tenth Step Reviews
    CREATE TABLE IF NOT EXISTS tenth_step_reviews (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      was_resentful TEXT,
      was_selfish TEXT,
      was_dishonest TEXT,
      was_afraid TEXT,
      owe_apology TEXT,
      could_do_better TEXT,
      grateful_for TEXT,
      created_at TEXT NOT NULL
    );

    -- Literature Progress
    CREATE TABLE IF NOT EXISTS literature_progress (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      chapter_id TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL
    );

    -- Promise Experiences
    CREATE TABLE IF NOT EXISTS promise_experiences (
      promise_id TEXT PRIMARY KEY,
      experienced INTEGER NOT NULL DEFAULT 0,
      reflection TEXT,
      experienced_at TEXT
    );

    -- Step Progress
    CREATE TABLE IF NOT EXISTS step_progress (
      id TEXT PRIMARY KEY,
      step_number INTEGER NOT NULL,
      questions_answered INTEGER NOT NULL DEFAULT 0,
      total_questions INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'locked',
      started_at TEXT,
      completed_at TEXT,
      discussed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Step Answers
    CREATE TABLE IF NOT EXISTS step_answers (
      id TEXT PRIMARY KEY,
      step_number INTEGER NOT NULL,
      question_index INTEGER NOT NULL,
      answer TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_entries(created_at);
    CREATE INDEX IF NOT EXISTS idx_journal_type ON journal_entries(type);
    CREATE INDEX IF NOT EXISTS idx_checkin_date ON daily_checkins(date);
    CREATE INDEX IF NOT EXISTS idx_milestone_achieved ON milestones(achieved_at);
    CREATE INDEX IF NOT EXISTS idx_capsule_unlock ON time_capsules(unlock_date);
    CREATE INDEX IF NOT EXISTS idx_vault_favorite ON motivation_vault(is_favorite);
    CREATE INDEX IF NOT EXISTS idx_vault_type ON motivation_vault(type);
    CREATE INDEX IF NOT EXISTS idx_scenario_completed ON scenario_practices(completed_at);

    -- V2 Indexes
    CREATE INDEX IF NOT EXISTS idx_contacts_role ON recovery_contacts(role);
    CREATE INDEX IF NOT EXISTS idx_regular_meetings_day ON regular_meetings(day_of_week);
    CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
    CREATE INDEX IF NOT EXISTS idx_achievements_status ON achievements(status);
    CREATE INDEX IF NOT EXISTS idx_reading_reflections_date ON daily_reading_reflections(reading_date);
    CREATE INDEX IF NOT EXISTS idx_4th_step_type ON fourth_step_inventory(type);
    CREATE INDEX IF NOT EXISTS idx_amends_status ON amends_list(status);
    CREATE INDEX IF NOT EXISTS idx_phone_logs_called ON phone_call_logs(called_at);
    CREATE INDEX IF NOT EXISTS idx_gratitude_date ON gratitude_entries(date);
    CREATE INDEX IF NOT EXISTS idx_10th_step_date ON tenth_step_reviews(date);
    CREATE INDEX IF NOT EXISTS idx_literature_book ON literature_progress(book_id);
    CREATE INDEX IF NOT EXISTS idx_promise_experienced ON promise_experiences(experienced);
    CREATE INDEX IF NOT EXISTS idx_step_progress_number ON step_progress(step_number);
    CREATE INDEX IF NOT EXISTS idx_step_answers_step ON step_answers(step_number);

    -- Additional performance indexes
    CREATE INDEX IF NOT EXISTS idx_meeting_logs_attended ON meeting_logs(attended_at);
    CREATE INDEX IF NOT EXISTS idx_meeting_logs_regular ON meeting_logs(regular_meeting_id);
    CREATE INDEX IF NOT EXISTS idx_step_answers_composite ON step_answers(step_number, question_index);
    CREATE INDEX IF NOT EXISTS idx_journal_step ON journal_entries(step_number);
    CREATE INDEX IF NOT EXISTS idx_contacts_last_contacted ON recovery_contacts(last_contacted_at);
    CREATE INDEX IF NOT EXISTS idx_phone_logs_contact ON phone_call_logs(contact_id);
  `);

    // Run versioned migrations for existing databases
    await runMigrations(database);
  } catch (error) {
    throw error;
  }
}

// Current schema version - increment when adding new migrations
const SCHEMA_VERSION = 4;

/**
 * Migration definitions
 * Each migration runs only once, tracked by version number
 */
interface Migration {
  version: number;
  description: string;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Add audio columns to journal_entries',
    up: async (db) => {
      await db.execAsync(`ALTER TABLE journal_entries ADD COLUMN audio_uri TEXT;`);
      await db.execAsync(`ALTER TABLE journal_entries ADD COLUMN audio_duration INTEGER;`);
    },
  },
  {
    version: 2,
    description: 'Add plan column to relapse_records',
    up: async (db) => {
      await db.execAsync(`ALTER TABLE relapse_records ADD COLUMN plan TEXT;`);
    },
  },
  {
    version: 3,
    description: 'Add crisis_region to app_settings',
    up: async (db) => {
      await db.execAsync(
        `ALTER TABLE app_settings ADD COLUMN crisis_region TEXT NOT NULL DEFAULT 'US';`,
      );
    },
  },
  {
    version: 4,
    description: 'Add enhanced meeting_logs columns',
    up: async (db) => {
      const columns = [
        { name: 'what_i_learned', type: 'TEXT' },
        { name: 'quote_heard', type: 'TEXT' },
        { name: 'connections_mode', type: 'TEXT' },
        { name: 'connection_notes', type: 'TEXT' },
        { name: 'did_share', type: 'INTEGER DEFAULT 0' },
        { name: 'share_reflection', type: 'TEXT' },
        { name: 'regular_meeting_id', type: 'TEXT' },
      ];
      for (const column of columns) {
        try {
          await db.execAsync(`ALTER TABLE meeting_logs ADD COLUMN ${column.name} ${column.type};`);
        } catch {
          // Column may already exist from previous partial migration
        }
      }
    },
  },
];

/**
 * Get current schema version from database
 */
async function getSchemaVersion(database: SQLite.SQLiteDatabase): Promise<number> {
  try {
    // Create schema_versions table if it doesn't exist
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_versions (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        version INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `);

    // Get current version
    const result = await database.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_versions WHERE id = 1',
    );

    if (!result) {
      // Initialize version table with 0 for new databases
      // or detect existing unversioned databases
      const hasJournalTable = await database.getFirstAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='journal_entries'",
      );

      const initialVersion = hasJournalTable ? 0 : SCHEMA_VERSION;
      await database.runAsync(
        'INSERT INTO schema_versions (id, version, updated_at) VALUES (1, ?, ?)',
        [initialVersion, new Date().toISOString()],
      );
      return initialVersion;
    }

    return result.version;
  } catch {
    return 0;
  }
}

/**
 * Update schema version in database
 */
async function setSchemaVersion(database: SQLite.SQLiteDatabase, version: number): Promise<void> {
  await database.runAsync('UPDATE schema_versions SET version = ?, updated_at = ? WHERE id = 1', [
    version,
    new Date().toISOString(),
  ]);
}

/**
 * Run database migrations for schema updates
 * Uses version tracking for cleaner, idempotent migrations
 */
async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  const currentVersion = await getSchemaVersion(database);

  // Get migrations that need to run
  const pendingMigrations = MIGRATIONS.filter((m) => m.version > currentVersion);

  if (pendingMigrations.length === 0) {
    // No migrations needed
    return;
  }

  logger.info(`Running ${pendingMigrations.length} database migration(s)...`);

  // Run each migration in order
  for (const migration of pendingMigrations.sort((a, b) => a.version - b.version)) {
    try {
      logger.info(`Migration ${migration.version}: ${migration.description}`);
      await migration.up(database);
      await setSchemaVersion(database, migration.version);
    } catch (error) {
      logger.error(`Migration ${migration.version} failed`, error);
      // Continue with other migrations - some ALTERs may fail if column exists
    }
  }

  // Ensure we're at the current schema version
  await setSchemaVersion(database, SCHEMA_VERSION);
  logger.info(`Database schema updated to version ${SCHEMA_VERSION}`);
}

/**
 * Get current schema version for external use (e.g., debugging)
 */
export async function getCurrentSchemaVersion(): Promise<number> {
  const database = await getDatabase();
  return getSchemaVersion(database);
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

/**
 * Clear all data (for testing or account reset)
 * WARNING: This deletes all user data
 */
export async function clearAllData(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync(`
    DELETE FROM journal_entries;
    DELETE FROM daily_checkins;
    DELETE FROM milestones;
    DELETE FROM meeting_logs;
    DELETE FROM emotion_tags;
    DELETE FROM relapse_records;
    DELETE FROM sobriety_profile;
    DELETE FROM app_settings;
    DELETE FROM time_capsules;
    DELETE FROM motivation_vault;
    DELETE FROM scenario_practices;
    DELETE FROM recovery_contacts;
    DELETE FROM regular_meetings;
    DELETE FROM achievements;
    DELETE FROM daily_reading_reflections;
    DELETE FROM fourth_step_inventory;
    DELETE FROM amends_list;
    DELETE FROM phone_call_logs;
    DELETE FROM gratitude_entries;
    DELETE FROM tenth_step_reviews;
    DELETE FROM literature_progress;
    DELETE FROM promise_experiences;
    DELETE FROM step_progress;
    DELETE FROM step_answers;
  `);
}
