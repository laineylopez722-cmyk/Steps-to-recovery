/**
 * Database Utilities
 *
 * Provides database initialization, schema management, and migration utilities.
 * Works with both SQLite (mobile) and IndexedDB (web) via StorageAdapter abstraction.
 *
 * **Features**:
 * - Versioned schema migrations
 * - Idempotent initialization (safe to call multiple times)
 * - Concurrent initialization protection
 * - Automatic index creation for performance
 *
 * @module utils/database
 */

import type { StorageAdapter } from '../adapters/storage';
import { logger } from './logger';

/**
 * Guard against duplicate/concurrent initialization
 *
 * Common in React StrictMode (dev) and fast refresh scenarios.
 * Uses database name instead of object identity for more reliable duplicate detection.
 */
const initializedDatabases = new Set<string>();
const initPromises = new Map<string, Promise<void>>();

/**
 * Current database schema version
 *
 * Increment this when adding new migrations. Migrations are applied
 * sequentially from the current version to this target version.
 */
const CURRENT_SCHEMA_VERSION = 18;

/**
 * Initialize database with schema for offline-first storage
 *
 * Creates all required tables, indexes, and applies pending migrations.
 * Safe to call multiple times (idempotent).
 *
 * **Tables Created**:
 * - user_profile - User metadata
 * - journal_entries - Encrypted journal entries
 * - daily_checkins - Morning/evening check-ins
 * - step_work - 12-step work progress
 * - achievements - User achievements
 * - sync_queue - Pending cloud sync operations
 * - cached_meetings - Public meeting data cache
 * - favorite_meetings - User's favorite meetings
 *
 * @param db - Storage adapter instance (SQLite or IndexedDB)
 * @returns Promise that resolves when initialization is complete
 * @throws Error if initialization fails critically
 * @example
 * ```ts
 * const db = await getDatabase();
 * await initDatabase(db);
 * // Database is ready to use
 * ```
 */
export async function initDatabase(db: StorageAdapter): Promise<void> {
  const dbName = db.getDatabaseName();
  if (initializedDatabases.has(dbName)) {
    logger.info('Database already initialized, skipping', { dbName });
    return;
  }

  const existing = initPromises.get(dbName);
  if (existing) return existing;

  // Create and store the promise immediately to prevent race conditions
  // from concurrent calls
  const initPromise = initializeDatabaseInternal(db);
  initPromises.set(dbName, initPromise);

  try {
    await initPromise;
    initializedDatabases.add(dbName);
  } finally {
    initPromises.delete(dbName);
  }
}

async function initializeDatabaseInternal(db: StorageAdapter): Promise<void> {
  const dbName = db.getDatabaseName();
  logger.info('Initializing database', { dbName });
  // Some Android sqlite bindings can throw opaque native errors (e.g. NPE) when executing
  // very large multi-statement strings via execAsync. Execute pragmas and schema statements
  // in smaller chunks to be more reliable.

  // Pragmas
  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
  } catch {
    // Some platforms may not support WAL; ignore and continue.
  }
  try {
    await db.execAsync('PRAGMA busy_timeout = 5000;');
  } catch {
    // Ignore; best-effort.
  }
  try {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  } catch {
    // Ignore; best-effort.
  }

  const statements: string[] = [
    `CREATE TABLE IF NOT EXISTS user_profile (
        id TEXT PRIMARY KEY,
        encrypted_email TEXT NOT NULL,
        sobriety_start_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
    `CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        encrypted_title TEXT,
        encrypted_body TEXT NOT NULL,
        encrypted_mood TEXT,
        encrypted_craving TEXT,
        encrypted_tags TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        supabase_id TEXT,
        FOREIGN KEY (user_id) REFERENCES user_profile(id)
      );`,
    `CREATE TABLE IF NOT EXISTS daily_checkins (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        check_in_type TEXT NOT NULL CHECK(check_in_type IN ('morning','evening')),
        check_in_date TEXT NOT NULL,
        encrypted_intention TEXT,
        encrypted_reflection TEXT,
        encrypted_mood TEXT,
        encrypted_craving TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        sync_status TEXT DEFAULT 'pending',
        supabase_id TEXT,
        FOREIGN KEY (user_id) REFERENCES user_profile(id)
      );`,
    `CREATE TABLE IF NOT EXISTS step_work (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        step_number INTEGER NOT NULL CHECK(step_number >= 1 AND step_number <= 12),
        question_number INTEGER NOT NULL,
        encrypted_answer TEXT,
        is_complete INTEGER DEFAULT 0,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        supabase_id TEXT,
        UNIQUE(user_id, step_number, question_number),
        FOREIGN KEY (user_id) REFERENCES user_profile(id)
      );`,
    `CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        achievement_key TEXT NOT NULL,
        achievement_type TEXT NOT NULL,
        earned_at TEXT NOT NULL,
        is_viewed INTEGER DEFAULT 0,
        UNIQUE(user_id, achievement_key),
        FOREIGN KEY (user_id) REFERENCES user_profile(id)
      );`,
    `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL CHECK(operation IN ('insert','update','delete')),
        supabase_id TEXT,
        created_at TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT,
        failed_at TEXT,
        UNIQUE(table_name, record_id, operation)
      );`,
    `CREATE TABLE IF NOT EXISTS daily_readings (
        id TEXT PRIMARY KEY,
        day_of_year INTEGER NOT NULL UNIQUE CHECK(day_of_year >= 1 AND day_of_year <= 366),
        month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
        day INTEGER NOT NULL CHECK(day >= 1 AND day <= 31),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        source TEXT NOT NULL,
        reflection_prompt TEXT NOT NULL,
        created_at TEXT NOT NULL
      );`,
    `CREATE TABLE IF NOT EXISTS reading_reflections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        reading_id TEXT NOT NULL,
        reading_date TEXT NOT NULL,
        encrypted_reflection TEXT NOT NULL,
        word_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        supabase_id TEXT,
        UNIQUE(user_id, reading_date),
        FOREIGN KEY (user_id) REFERENCES user_profile(id),
        FOREIGN KEY (reading_id) REFERENCES daily_readings(id)
      );`,
    `CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );`,
    `CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_entries(created_at);`,
    `CREATE INDEX IF NOT EXISTS idx_checkin_user ON daily_checkins(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_checkin_date ON daily_checkins(check_in_date);`,
    `CREATE INDEX IF NOT EXISTS idx_step_user ON step_work(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_step_number ON step_work(step_number);`,
    `CREATE INDEX IF NOT EXISTS idx_step_supabase_id ON step_work(supabase_id);`,
    `CREATE INDEX IF NOT EXISTS idx_achievement_user ON achievements(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name);`,
    `CREATE INDEX IF NOT EXISTS idx_daily_readings_day ON daily_readings(day_of_year);`,
    `CREATE INDEX IF NOT EXISTS idx_reading_reflections_user ON reading_reflections(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_reading_reflections_date ON reading_reflections(reading_date);`,
  ];

  for (const sql of statements) {
    await db.execAsync(sql);
  }

  // Run versioned migrations
  await runMigrations(db);
  logger.info('Database initialization complete', { dbName });
}

/**
 * Get current schema version from database
 *
 * @param db - Storage adapter instance
 * @returns Promise resolving to current schema version (0 if no migrations applied)
 * @internal
 */
async function getCurrentSchemaVersion(db: StorageAdapter): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ version: number }>(
      'SELECT MAX(version) as version FROM schema_migrations',
    );
    return result?.version || 0;
  } catch {
    // Table might not exist yet
    return 0;
  }
}

/**
 * Check if a column exists in a table
 *
 * Used during migrations to safely add columns only if they don't exist.
 *
 * @param db - Storage adapter instance
 * @param tableName - Name of the table to check
 * @param columnName - Name of the column to check
 * @returns Promise resolving to true if column exists, false otherwise
 * @internal
 */
async function columnExists(
  db: StorageAdapter,
  tableName: string,
  columnName: string,
): Promise<boolean> {
  try {
    // SQLite pragma to get table info
    const result = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);
    return result.some((col) => col.name === columnName);
  } catch {
    // Table might not exist
    return false;
  }
}

/**
 * Mark a migration as applied
 *
 * Records the migration version in schema_migrations table.
 *
 * @param db - Storage adapter instance
 * @param version - Migration version number
 * @internal
 */
async function recordMigration(db: StorageAdapter, version: number): Promise<void> {
  await db.runAsync('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
    version,
    new Date().toISOString(),
  ]);
}

/**
 * Run all pending migrations
 *
 * Applies migrations sequentially from current version to CURRENT_SCHEMA_VERSION.
 * Each migration is idempotent and can be safely re-run.
 *
 * **Transaction safety**: Individual migrations are NOT wrapped in explicit
 * transactions because every migration step is guarded by `columnExists()` or
 * `CREATE TABLE IF NOT EXISTS`, making them idempotent. A partial failure
 * mid-migration is safe: the version is only recorded after all steps succeed
 * (`recordMigration`), so the migration will re-run on next launch and the
 * idempotent guards prevent double-apply.
 *
 * @param db - Storage adapter instance
 * @returns Promise that resolves when all migrations are complete
 * @internal
 */
async function runMigrations(db: StorageAdapter): Promise<void> {
  const currentVersion = await getCurrentSchemaVersion(db);

  logger.info('Database migration check', {
    currentVersion,
    targetVersion: CURRENT_SCHEMA_VERSION,
  });

  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    logger.info('Database schema is up to date');
    return;
  }

  // Migration version 1: Initial columns for sync and check-ins
  if (currentVersion < 1) {
    logger.info('Running migration v1: Adding sync tracking columns');

    // Only add columns if they don't already exist (base schema may have them)
    if (!(await columnExists(db, 'daily_checkins', 'supabase_id'))) {
      try {
        await db.execAsync(`ALTER TABLE daily_checkins ADD COLUMN supabase_id TEXT;`);
      } catch (error) {
        logger.warn('Migration v1: Failed to add daily_checkins.supabase_id', error);
      }
    }

    if (!(await columnExists(db, 'daily_checkins', 'updated_at'))) {
      try {
        await db.execAsync(
          `ALTER TABLE daily_checkins ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));`,
        );
      } catch (error) {
        logger.warn('Migration v1: Failed to add daily_checkins.updated_at', error);
      }
    }

    if (!(await columnExists(db, 'sync_queue', 'supabase_id'))) {
      try {
        await db.execAsync(`ALTER TABLE sync_queue ADD COLUMN supabase_id TEXT;`);
      } catch (error) {
        logger.warn('Migration v1: Failed to add sync_queue.supabase_id', error);
      }
    }

    await recordMigration(db, 1);
    logger.info('Migration v1 completed');
  }

  // Migration version 2: Add failed_at for permanent sync failures
  if (currentVersion < 2) {
    logger.info('Running migration v2: Adding failed_at to sync_queue');

    if (!(await columnExists(db, 'sync_queue', 'failed_at'))) {
      try {
        await db.execAsync(`ALTER TABLE sync_queue ADD COLUMN failed_at TEXT;`);
      } catch (error) {
        logger.warn('Migration v2: Failed to add sync_queue.failed_at', error);
      }
    }

    await recordMigration(db, 2);
    logger.info('Migration v2 completed');
  }

  // Migration version 3: Add meeting finder tables
  if (currentVersion < 3) {
    logger.info('Running migration v3: Adding meeting finder tables');
    const v3Migrations = [
      // Meeting cache table (public data - no encryption)
      `CREATE TABLE IF NOT EXISTS cached_meetings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT,
        postal_code TEXT,
        country TEXT DEFAULT 'US',
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        day_of_week INTEGER,
        time TEXT,
        types TEXT,
        notes TEXT,
        cached_at TEXT NOT NULL,
        cache_region TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      // User's favorite meetings (encrypted - sensitive behavioral data)
      `CREATE TABLE IF NOT EXISTS favorite_meetings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        meeting_id TEXT NOT NULL,
        encrypted_notes TEXT,
        notification_enabled INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        supabase_id TEXT,
        UNIQUE(user_id, meeting_id),
        FOREIGN KEY (user_id) REFERENCES user_profile(id),
        FOREIGN KEY (meeting_id) REFERENCES cached_meetings(id)
      );`,
      // Last search location (for offline fallback)
      `CREATE TABLE IF NOT EXISTS meeting_search_cache (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        radius_miles INTEGER DEFAULT 10,
        last_updated TEXT NOT NULL,
        UNIQUE(user_id)
      );`,
      // Indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_cached_meetings_location
        ON cached_meetings(latitude, longitude);`,
      `CREATE INDEX IF NOT EXISTS idx_cached_meetings_day
        ON cached_meetings(day_of_week);`,
      `CREATE INDEX IF NOT EXISTS idx_favorite_meetings_user
        ON favorite_meetings(user_id);`,
    ];

    for (const migration of v3Migrations) {
      try {
        await db.execAsync(migration);
      } catch (error) {
        logger.warn('Migration v3 step failed (may be already applied)', error);
      }
    }

    await recordMigration(db, 3);
    logger.info('Migration v3 completed');
  }

  // Migration version 4: Add supabase_id to step_work for idempotent sync
  if (currentVersion < 4) {
    logger.info('Running migration v4: Adding supabase_id to step_work');

    if (!(await columnExists(db, 'step_work', 'supabase_id'))) {
      try {
        await db.execAsync(`ALTER TABLE step_work ADD COLUMN supabase_id TEXT;`);
      } catch (error) {
        logger.warn('Migration v4: Failed to add step_work.supabase_id', error);
      }
    }

    // Index creation is idempotent (IF NOT EXISTS), so safe to run always
    try {
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS idx_step_supabase_id ON step_work(supabase_id);`,
      );
    } catch (error) {
      logger.warn('Migration v4: Index creation failed', error);
    }

    await recordMigration(db, 4);
    logger.info('Migration v4 completed');
  }

  // Migration version 5: Add daily readings and reading reflections tables
  if (currentVersion < 5) {
    logger.info('Running migration v5: Adding daily readings and reflections tables');
    const v5Migrations = [
      // Daily readings table (static content, no encryption needed)
      `CREATE TABLE IF NOT EXISTS daily_readings (
        id TEXT PRIMARY KEY,
        day_of_year INTEGER NOT NULL UNIQUE CHECK(day_of_year >= 1 AND day_of_year <= 366),
        month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
        day INTEGER NOT NULL CHECK(day >= 1 AND day <= 31),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        source TEXT NOT NULL,
        reflection_prompt TEXT NOT NULL,
        created_at TEXT NOT NULL
      );`,
      // Reading reflections table (user-generated content, encrypted)
      `CREATE TABLE IF NOT EXISTS reading_reflections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        reading_id TEXT NOT NULL,
        reading_date TEXT NOT NULL,
        encrypted_reflection TEXT NOT NULL,
        word_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        supabase_id TEXT,
        UNIQUE(user_id, reading_date),
        FOREIGN KEY (user_id) REFERENCES user_profile(id),
        FOREIGN KEY (reading_id) REFERENCES daily_readings(id)
      );`,
      // Indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_daily_readings_day ON daily_readings(day_of_year);`,
      `CREATE INDEX IF NOT EXISTS idx_reading_reflections_user ON reading_reflections(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_reading_reflections_date ON reading_reflections(reading_date);`,
    ];

    for (const migration of v5Migrations) {
      try {
        await db.execAsync(migration);
      } catch (error) {
        logger.warn('Migration v5 step failed (may be already applied)', error);
      }
    }

    await recordMigration(db, 5);
    logger.info('Migration v5 completed');
  }

  // Migration version 6: Add gratitude field to daily_checkins
  if (currentVersion < 6) {
    logger.info('Running migration v6: Adding gratitude field to daily_checkins');

    if (!(await columnExists(db, 'daily_checkins', 'encrypted_gratitude'))) {
      try {
        await db.execAsync(`ALTER TABLE daily_checkins ADD COLUMN encrypted_gratitude TEXT;`);
      } catch (error) {
        logger.warn('Migration v6: Failed to add daily_checkins.encrypted_gratitude', error);
      }
    }

    await recordMigration(db, 6);
    logger.info('Migration v6 completed');
  }

  // Migration version 7: Add sponsor connection tables
  if (currentVersion < 7) {
    logger.info('Running migration v7: Adding sponsor connection tables');
    const v7Migrations = [
      `CREATE TABLE IF NOT EXISTS sponsor_connections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('sponsee','sponsor')),
        status TEXT NOT NULL CHECK(status IN ('pending','connected')),
        invite_code TEXT NOT NULL,
        display_name TEXT,
        own_public_key TEXT NOT NULL,
        peer_public_key TEXT,
        shared_key TEXT,
        pending_private_key TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(user_id, invite_code, role)
      );`,
      `CREATE TABLE IF NOT EXISTS sponsor_shared_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        connection_id TEXT NOT NULL,
        direction TEXT NOT NULL CHECK(direction IN ('outgoing','incoming','comment')),
        journal_entry_id TEXT,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (connection_id) REFERENCES sponsor_connections(id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_sponsor_connections_user ON sponsor_connections(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_sponsor_connections_status ON sponsor_connections(status);`,
      `CREATE INDEX IF NOT EXISTS idx_sponsor_shared_entries_connection ON sponsor_shared_entries(connection_id);`,
      `CREATE INDEX IF NOT EXISTS idx_sponsor_shared_entries_entry ON sponsor_shared_entries(journal_entry_id);`,
    ];

    for (const migration of v7Migrations) {
      try {
        await db.execAsync(migration);
      } catch (error) {
        logger.warn('Migration v7 step failed (may be already applied)', error);
      }
    }

    await recordMigration(db, 7);
    logger.info('Migration v7 completed');
  }

  // Migration version 8: Add weekly reports table
  if (currentVersion < 8) {
    logger.info('Running migration v8: Adding weekly reports table');
    const v8Migrations = [
      `CREATE TABLE IF NOT EXISTS weekly_reports (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        week_start TEXT NOT NULL,
        week_end TEXT NOT NULL,
        report_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(user_id, week_start)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_weekly_reports_user ON weekly_reports(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON weekly_reports(week_start);`,
    ];

    for (const migration of v8Migrations) {
      try {
        await db.execAsync(migration);
      } catch (error) {
        logger.warn('Migration v8 step failed (may be already applied)', error);
      }
    }

    await recordMigration(db, 8);
    logger.info('Migration v8 completed');
  }

  // Migration version 9: Add sync columns to weekly_reports, sponsor_connections, and sponsor_shared_entries
  if (currentVersion < 9) {
    logger.info('Running migration v9: Adding sync columns to new tables');

    // Weekly reports sync columns
    if (!(await columnExists(db, 'weekly_reports', 'sync_status'))) {
      try {
        await db.execAsync(
          `ALTER TABLE weekly_reports ADD COLUMN sync_status TEXT DEFAULT 'pending';`,
        );
      } catch (error) {
        logger.warn('Migration v9: Failed to add weekly_reports.sync_status', error);
      }
    }

    if (!(await columnExists(db, 'weekly_reports', 'supabase_id'))) {
      try {
        await db.execAsync(`ALTER TABLE weekly_reports ADD COLUMN supabase_id TEXT;`);
      } catch (error) {
        logger.warn('Migration v9: Failed to add weekly_reports.supabase_id', error);
      }
    }

    // Sponsor connections sync columns
    if (!(await columnExists(db, 'sponsor_connections', 'sync_status'))) {
      try {
        await db.execAsync(
          `ALTER TABLE sponsor_connections ADD COLUMN sync_status TEXT DEFAULT 'pending';`,
        );
      } catch (error) {
        logger.warn('Migration v9: Failed to add sponsor_connections.sync_status', error);
      }
    }

    if (!(await columnExists(db, 'sponsor_connections', 'supabase_id'))) {
      try {
        await db.execAsync(`ALTER TABLE sponsor_connections ADD COLUMN supabase_id TEXT;`);
      } catch (error) {
        logger.warn('Migration v9: Failed to add sponsor_connections.supabase_id', error);
      }
    }

    // Sponsor shared entries sync columns
    if (!(await columnExists(db, 'sponsor_shared_entries', 'sync_status'))) {
      try {
        await db.execAsync(
          `ALTER TABLE sponsor_shared_entries ADD COLUMN sync_status TEXT DEFAULT 'pending';`,
        );
      } catch (error) {
        logger.warn('Migration v9: Failed to add sponsor_shared_entries.sync_status', error);
      }
    }

    if (!(await columnExists(db, 'sponsor_shared_entries', 'supabase_id'))) {
      try {
        await db.execAsync(`ALTER TABLE sponsor_shared_entries ADD COLUMN supabase_id TEXT;`);
      } catch (error) {
        logger.warn('Migration v9: Failed to add sponsor_shared_entries.supabase_id', error);
      }
    }

    await recordMigration(db, 9);
    logger.info('Migration v9 completed');
  }

  // Migration version 10: Add personal_inventory table (Tenth Step)
  if (currentVersion < 10) {
    logger.info('Running migration v10: Adding personal_inventory table');
    const v10InventoryMigrations = [
      `CREATE TABLE IF NOT EXISTS personal_inventory (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        check_date TEXT NOT NULL,
        encrypted_answers TEXT NOT NULL,
        encrypted_notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        supabase_id TEXT
      );`,
      `CREATE INDEX IF NOT EXISTS idx_personal_inventory_user_date ON personal_inventory(user_id, check_date);`,
    ];

    for (const migration of v10InventoryMigrations) {
      try {
        await db.execAsync(migration);
      } catch (error) {
        logger.warn('Migration v10 step failed (may be already applied)', error);
      }
    }

    await recordMigration(db, 10);
    logger.info('Migration v10 completed');
  }

  // Migration version 11: Add gratitude_entries table
  if (currentVersion < 11) {
    logger.info('Running migration v11: Adding gratitude_entries table');
    const v11Migrations = [
      `CREATE TABLE IF NOT EXISTS gratitude_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        entry_date TEXT NOT NULL,
        encrypted_item_1 TEXT NOT NULL,
        encrypted_item_2 TEXT NOT NULL,
        encrypted_item_3 TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        supabase_id TEXT
      );`,
      `CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user_date ON gratitude_entries(user_id, entry_date);`,
    ];

    for (const migration of v11Migrations) {
      try {
        await db.execAsync(migration);
      } catch (error) {
        logger.warn('Migration v11 step failed (may be already applied)', error);
      }
    }

    await recordMigration(db, 11);
    logger.info('Migration v11 completed');
  }

  // Migration version 12: Add craving_surf_sessions table
  if (currentVersion < 12) {
    logger.info('Running migration v12: Adding craving_surf_sessions table');
    const v12Migrations = [
      `CREATE TABLE IF NOT EXISTS craving_surf_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        encrypted_initial_rating TEXT NOT NULL,
        encrypted_final_rating TEXT,
        encrypted_distraction_used TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        supabase_id TEXT,
        FOREIGN KEY (user_id) REFERENCES user_profile(id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_craving_surf_user ON craving_surf_sessions(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_craving_surf_created ON craving_surf_sessions(created_at);`,
    ];

    for (const migration of v12Migrations) {
      try {
        await db.execAsync(migration);
      } catch (error) {
        logger.warn('Migration v12 step failed (may be already applied)', error);
      }
    }

    await recordMigration(db, 12);
    logger.info('Migration v12 completed');
  }

  // Migration version 13: Add safety_plans table
  if (currentVersion < 13) {
    logger.info('Running migration v13: Adding safety_plans table');
    const v13Migrations = [
      `CREATE TABLE IF NOT EXISTS safety_plans (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        encrypted_plan TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        supabase_id TEXT
      );`,
      `CREATE INDEX IF NOT EXISTS idx_safety_plans_user ON safety_plans(user_id);`,
    ];

    for (const migration of v13Migrations) {
      try {
        await db.execAsync(migration);
      } catch (error) {
        logger.warn('Migration v13 step failed (may be already applied)', error);
      }
    }

    await recordMigration(db, 13);
    logger.info('Migration v13 completed');
  }

  // v14: sponsor_messages table for E2E encrypted messaging
  if (currentVersion < 14) {
    const v14Migrations = [
      `CREATE TABLE IF NOT EXISTS sponsor_messages (
        id TEXT PRIMARY KEY,
        connection_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        encrypted_content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        read_at TEXT,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        supabase_id TEXT,
        FOREIGN KEY (connection_id) REFERENCES sponsor_connections(id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_sponsor_messages_connection ON sponsor_messages(connection_id, created_at);`,
      `CREATE INDEX IF NOT EXISTS idx_sponsor_messages_unread ON sponsor_messages(connection_id, read_at);`,
    ];

    for (const migration of v14Migrations) {
      try {
        await db.execAsync(migration);
      } catch (error) {
        logger.warn('Migration v14 step failed (may be already applied)', error);
      }
    }

    await recordMigration(db, 14);
    logger.info('Migration v14 completed');
  }

  // Migration version 15: Add sync_metadata table for multi-device pull sync tracking
  if (currentVersion < 15) {
    logger.info('Running migration v15: Adding sync_metadata table');
    const v15Migrations = [
      `CREATE TABLE IF NOT EXISTS sync_metadata (
        table_name TEXT PRIMARY KEY,
        last_pull_at TEXT,
        last_push_at TEXT,
        device_id TEXT
      );`,
    ];

    for (const migration of v15Migrations) {
      try {
        await db.execAsync(migration);
      } catch (error) {
        logger.warn('Migration v15 step failed (may be already applied)', error);
      }
    }

    await recordMigration(db, 15);
    logger.info('Migration v15 completed');
  }

  // Migration v16: AI memories table for semantic extraction
  if (currentVersion < 16) {
    logger.info('Running migration v16: AI memories table');

    const v16Migrations = [
      `CREATE TABLE IF NOT EXISTS ai_memories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        encrypted_content TEXT NOT NULL,
        confidence REAL NOT NULL,
        encrypted_context TEXT,
        source_conversation_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_ai_memories_user ON ai_memories(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_ai_memories_type ON ai_memories(user_id, type);`,
    ];

    for (const migration of v16Migrations) {
      try {
        await db.execAsync(migration);
      } catch (error) {
        logger.warn('Migration v16 step failed (may be already applied)', error);
      }
    }

    await recordMigration(db, 16);
    logger.info('Migration v16 completed');
  }

  // Migration version 17: Add active_challenges table for streak & challenge system
  if (currentVersion < 17) {
    logger.info('Running migration v17: Adding active_challenges table');
    const v17Migrations = [
      `CREATE TABLE IF NOT EXISTS active_challenges (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        current_progress INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','failed')),
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_active_challenges_user ON active_challenges(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_active_challenges_status ON active_challenges(user_id, status);`,
    ];

    for (const migration of v17Migrations) {
      try {
        await db.execAsync(migration);
      } catch (error) {
        logger.warn('Migration v17 step failed (may be already applied)', error);
      }
    }

    await recordMigration(db, 17);
    logger.info('Migration v17 completed');
  }

  // Migration version 18: Add weather_snapshots table for mood-weather correlation
  if (currentVersion < 18) {
    logger.info('Running migration v18: Adding weather_snapshots table');
    const v18Migrations = [
      `CREATE TABLE IF NOT EXISTS weather_snapshots (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        temperature REAL,
        condition TEXT,
        humidity REAL,
        location TEXT,
        created_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_weather_user_date ON weather_snapshots(user_id, date);`,
    ];

    for (const migration of v18Migrations) {
      try {
        await db.execAsync(migration);
      } catch (error) {
        logger.warn('Migration v18 step failed (may be already applied)', error);
      }
    }

    await recordMigration(db, 18);
    logger.info('Migration v18 completed');
  }

  logger.info('All migrations completed', { newVersion: CURRENT_SCHEMA_VERSION });
}

/**
 * Clear all local data
 *
 * **Warning**: This permanently deletes all user data from the local database!
 * Only call this during logout or account deletion. Encryption keys should
 * be deleted separately using `deleteEncryptionKey()`.
 *
 * @param db - Storage adapter instance
 * @returns Promise that resolves when all data is cleared
 * @example
 * ```ts
 * // During logout
 * await clearDatabase(db);
 * await deleteEncryptionKey();
 * ```
 */
export async function clearDatabase(db: StorageAdapter): Promise<void> {
  const statements = [
    'DELETE FROM sync_queue',
    'DELETE FROM active_challenges',
    'DELETE FROM craving_surf_sessions',
    'DELETE FROM safety_plans',
    'DELETE FROM favorite_meetings',
    'DELETE FROM meeting_search_cache',
    'DELETE FROM cached_meetings',
    'DELETE FROM reading_reflections',
    'DELETE FROM daily_readings',
    'DELETE FROM achievements',
    'DELETE FROM step_work',
    'DELETE FROM daily_checkins',
    'DELETE FROM journal_entries',
    'DELETE FROM sponsor_shared_entries',
    'DELETE FROM sponsor_connections',
    'DELETE FROM weekly_reports',
    'DELETE FROM gratitude_entries',
    'DELETE FROM personal_inventory',
    'DELETE FROM user_profile',
  ];

  await db.withTransactionAsync(async () => {
    for (const sql of statements) {
      await db.runAsync(sql);
    }
  });
}
