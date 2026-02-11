/**
 * Drizzle Schema
 *
 * Database schema for the recovery app.
 * Uses SQLite with expo-sqlite.
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ============================================================================
// USER PROFILE
// ============================================================================

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),

  // Core info
  sobrietyDate: text('sobriety_date'), // ISO date string
  programType: text('program_type'), // 'NA', 'AA', 'Other'

  // Settings
  notificationsEnabled: integer('notifications_enabled', { mode: 'boolean' }).default(true),
  biometricsEnabled: integer('biometrics_enabled', { mode: 'boolean' }).default(false),
  darkMode: integer('dark_mode', { mode: 'boolean' }).default(true),

  // Timestamps
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ============================================================================
// CHECK-INS (Morning & Evening)
// ============================================================================

export const checkIns = sqliteTable('check_ins', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),

  // Type
  type: text('type').notNull(), // 'morning' | 'evening'
  date: text('date').notNull(), // ISO date (YYYY-MM-DD)

  // Morning fields
  intention: text('intention'),

  // Evening fields
  reflection: text('reflection'),
  gratitude: text('gratitude'),

  // Shared fields
  mood: integer('mood'), // 1-5
  craving: integer('craving'), // 0-10 (evening only)

  // Timestamps
  createdAt: text('created_at').notNull(),
});

// ============================================================================
// JOURNAL ENTRIES
// ============================================================================

export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),

  // Content
  title: text('title'),
  content: text('content').notNull(),
  tags: text('tags'), // JSON array

  // Mood at time of writing
  mood: integer('mood'),

  // Flags
  isEncrypted: integer('is_encrypted', { mode: 'boolean' }).default(false),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false),

  // Timestamps
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ============================================================================
// DAILY READINGS
// ============================================================================

export const readingReflections = sqliteTable('reading_reflections', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),

  // Reading reference
  date: text('date').notNull(), // ISO date
  readingId: text('reading_id'),

  // Reflection
  reflection: text('reflection').notNull(),

  // Timestamps
  createdAt: text('created_at').notNull(),
});

// ============================================================================
// CONTACTS (Sponsor, Support Network)
// ============================================================================

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),

  // Info
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  role: text('role'), // 'sponsor' | 'sponsee' | 'friend' | 'family'
  notes: text('notes'),

  // Timestamps
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ============================================================================
// PHONE CALL LOG
// ============================================================================

export const phoneCalls = sqliteTable('phone_calls', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  contactId: text('contact_id').references(() => contacts.id),

  // Call info
  contactName: text('contact_name'),
  duration: integer('duration'), // seconds
  notes: text('notes'),

  // Timestamps
  calledAt: text('called_at').notNull(),
});

// ============================================================================
// MILESTONES & ACHIEVEMENTS
// ============================================================================

export const achievements = sqliteTable('achievements', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),

  // Achievement
  type: text('type').notNull(), // 'days' | 'streak' | 'journal' | etc
  name: text('name').notNull(),
  description: text('description'),

  // Value (e.g., 30 for "30 days")
  value: integer('value'),

  // Timestamps
  unlockedAt: text('unlocked_at').notNull(),
  celebratedAt: text('celebrated_at'),
});

// ============================================================================
// STEP WORK
// ============================================================================

export const stepProgress = sqliteTable('step_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),

  // Step
  stepNumber: integer('step_number').notNull(), // 1-12
  status: text('status').notNull(), // 'not_started' | 'in_progress' | 'completed'

  // Content
  notes: text('notes'),

  // Timestamps
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  updatedAt: text('updated_at').notNull(),
});

// ============================================================================
// AI COMPANION - CHAT
// ============================================================================

export const chatConversations = sqliteTable('chat_conversations', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  title: text('title'),
  type: text('type').notNull(), // 'general' | 'step_work' | 'crisis' | 'check_in'
  stepNumber: integer('step_number'),
  status: text('status').default('active'), // 'active' | 'archived'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => chatConversations.id),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  isEncrypted: integer('is_encrypted', { mode: 'boolean' }).default(true),
  metadata: text('metadata'), // JSON: tokens, model, latency, etc.
  createdAt: text('created_at').notNull(),
});

// ============================================================================
// AI COMPANION - STEP WORK
// ============================================================================

export const stepWorkEntries = sqliteTable('step_work_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  stepNumber: integer('step_number').notNull(),
  entryType: text('entry_type').notNull(), // 'resentment' | 'fear' | 'amend' | 'reflection' | 'inventory'
  data: text('data').notNull(), // Encrypted JSON
  status: text('status').default('draft'), // 'draft' | 'complete' | 'discussed_with_sponsor'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type CheckIn = typeof checkIns.$inferSelect;
export type NewCheckIn = typeof checkIns.$inferInsert;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;

export type ReadingReflection = typeof readingReflections.$inferSelect;
export type NewReadingReflection = typeof readingReflections.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type PhoneCall = typeof phoneCalls.$inferSelect;
export type NewPhoneCall = typeof phoneCalls.$inferInsert;

export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;

export type StepProgress = typeof stepProgress.$inferSelect;
export type NewStepProgress = typeof stepProgress.$inferInsert;

export type ChatConversation = typeof chatConversations.$inferSelect;
export type NewChatConversation = typeof chatConversations.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

export type StepWorkEntry = typeof stepWorkEntries.$inferSelect;
export type NewStepWorkEntry = typeof stepWorkEntries.$inferInsert;
