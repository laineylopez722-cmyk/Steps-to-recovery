/**
 * Database Client
 * 
 * Drizzle ORM with expo-sqlite.
 */

import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// Database name
const DATABASE_NAME = 'recovery.db';

// Open the database
const expoDb = openDatabaseSync(DATABASE_NAME);

// Create Drizzle instance
export const db = drizzle(expoDb, { schema });

// Export schema for convenience
export * from './schema';

// ============================================================================
// MIGRATIONS
// ============================================================================

/**
 * Run migrations manually (for now).
 * In production, use drizzle-kit migrations.
 */
export async function runMigrations() {
  // Create tables if they don't exist
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      sobriety_date TEXT,
      program_type TEXT,
      notifications_enabled INTEGER DEFAULT 1,
      biometrics_enabled INTEGER DEFAULT 0,
      dark_mode INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      intention TEXT,
      reflection TEXT,
      gratitude TEXT,
      mood INTEGER,
      craving INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      tags TEXT,
      mood INTEGER,
      is_encrypted INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reading_reflections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      reading_id TEXT,
      reflection TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      role TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS phone_calls (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      contact_id TEXT,
      contact_name TEXT,
      duration INTEGER,
      notes TEXT,
      called_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      value INTEGER,
      unlocked_at TEXT NOT NULL,
      celebrated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS step_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      started_at TEXT,
      completed_at TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- AI Companion: Chat Conversations
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT,
      type TEXT NOT NULL DEFAULT 'general',
      step_number INTEGER,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- AI Companion: Chat Messages
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      is_encrypted INTEGER DEFAULT 1,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
    );

    -- AI Companion: Step Work Entries
    CREATE TABLE IF NOT EXISTS step_work_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      entry_type TEXT NOT NULL,
      data TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON check_ins(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_journal_user_created ON journal_entries(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_step_work_user ON step_work_entries(user_id);
  `);

  console.log('[DB] Migrations complete');
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a UUID
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get current ISO timestamp
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}
