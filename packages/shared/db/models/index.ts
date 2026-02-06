/**
 * Database Model Operations
 * CRUD operations for all data models
 */

import { v4 as uuidv4 } from 'uuid';
import { decryptContent, encryptContent } from '../../encryption';
import type {
  AppSettings,
  ContactRole,
  CrisisRegion,
  DailyCheckin,
  DailyReadingReflection,
  DbAppSettings,
  DbDailyCheckin,
  DbDailyReadingReflection,
  DbEmotionTag,
  DbJournalEntry,
  DbMilestone,
  DbPhoneCallLog,
  DbRecoveryContact,
  DbSobrietyProfile,
  EmotionTag,
  JournalEntry,
  JournalType,
  MeetingLog,
  Milestone,
  MilestoneType,
  PhoneCallLog,
  ProgramType,
  // V2 Types
  RecoveryContact,
  SobrietyProfile,
  ThemeMode,
} from '../../types';
import { getDatabase } from '../client';

// ============================================
// SOBRIETY PROFILE
// ============================================

export async function createSobrietyProfile(
  sobrietyDate: Date,
  programType: ProgramType,
  displayName?: string,
): Promise<SobrietyProfile> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO sobriety_profile (id, sobriety_date, program_type, display_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, sobrietyDate.toISOString(), programType, displayName || null, now, now],
  );

  return {
    id,
    sobrietyDate,
    programType,
    displayName,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

export async function getSobrietyProfile(): Promise<SobrietyProfile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DbSobrietyProfile>('SELECT * FROM sobriety_profile LIMIT 1');

  if (!row) return null;

  return {
    id: row.id,
    sobrietyDate: new Date(row.sobriety_date),
    programType: row.program_type as ProgramType,
    displayName: row.display_name || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function updateSobrietyProfile(
  updates: Partial<Pick<SobrietyProfile, 'sobrietyDate' | 'programType' | 'displayName'>>,
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const profile = await getSobrietyProfile();

  if (!profile) return;

  await db.runAsync(
    `UPDATE sobriety_profile SET
      sobriety_date = ?,
      program_type = ?,
      display_name = ?,
      updated_at = ?
     WHERE id = ?`,
    [
      updates.sobrietyDate?.toISOString() || profile.sobrietyDate.toISOString(),
      updates.programType || profile.programType,
      updates.displayName || profile.displayName || null,
      now,
      profile.id,
    ],
  );
}

export async function deleteSobrietyProfile(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sobriety_profile');
}

// ============================================
// JOURNAL ENTRIES
// ============================================

export async function createJournalEntry(
  type: JournalType,
  content: string,
  options?: {
    moodBefore?: number;
    moodAfter?: number;
    cravingLevel?: number;
    emotionTags?: string[];
    stepNumber?: number;
    meetingId?: string;
    audioUri?: string;
    audioDuration?: number;
  },
): Promise<JournalEntry> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  // Encrypt the content
  const encryptedContent = await encryptContent(content);

  await db.runAsync(
    `INSERT INTO journal_entries (id, type, content, mood_before, mood_after, craving_level, emotion_tags, step_number, meeting_id, audio_uri, audio_duration, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      type,
      encryptedContent,
      options?.moodBefore || null,
      options?.moodAfter || null,
      options?.cravingLevel || null,
      JSON.stringify(options?.emotionTags || []),
      options?.stepNumber || null,
      options?.meetingId || null,
      options?.audioUri || null,
      options?.audioDuration || null,
      now,
      now,
    ],
  );

  return {
    id,
    type,
    content: encryptedContent,
    moodBefore: options?.moodBefore,
    moodAfter: options?.moodAfter,
    cravingLevel: options?.cravingLevel,
    emotionTags: options?.emotionTags || [],
    stepNumber: options?.stepNumber,
    meetingId: options?.meetingId,
    audioUri: options?.audioUri,
    audioDuration: options?.audioDuration,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

export async function getJournalEntries(
  limit = 50,
  offset = 0,
  type?: JournalType,
): Promise<JournalEntry[]> {
  const db = await getDatabase();

  let query = 'SELECT * FROM journal_entries';
  const params: (string | number)[] = [];

  if (type) {
    query += ' WHERE type = ?';
    params.push(type);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = await db.getAllAsync<DbJournalEntry>(query, params);

  return rows.map((row) => ({
    id: row.id,
    type: row.type as JournalType,
    content: row.content, // Still encrypted, decrypt when displaying
    moodBefore: row.mood_before || undefined,
    moodAfter: row.mood_after || undefined,
    cravingLevel: row.craving_level || undefined,
    emotionTags: JSON.parse(row.emotion_tags || '[]'),
    stepNumber: row.step_number || undefined,
    meetingId: row.meeting_id || undefined,
    audioUri: row.audio_uri || undefined,
    audioDuration: row.audio_duration || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

export async function getJournalEntryById(id: string): Promise<JournalEntry | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DbJournalEntry>('SELECT * FROM journal_entries WHERE id = ?', [
    id,
  ]);

  if (!row) return null;

  return {
    id: row.id,
    type: row.type as JournalType,
    content: row.content,
    moodBefore: row.mood_before || undefined,
    moodAfter: row.mood_after || undefined,
    cravingLevel: row.craving_level || undefined,
    emotionTags: JSON.parse(row.emotion_tags || '[]'),
    stepNumber: row.step_number || undefined,
    meetingId: row.meeting_id || undefined,
    audioUri: row.audio_uri || undefined,
    audioDuration: row.audio_duration || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function decryptJournalContent(entry: JournalEntry): Promise<string> {
  return await decryptContent(entry.content);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
}

// ============================================
// DAILY CHECK-INS
// ============================================

export async function createDailyCheckin(
  mood: number,
  cravingLevel: number,
  gratitude?: string,
): Promise<DailyCheckin> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  // Encrypt gratitude if provided
  const encryptedGratitude = gratitude ? await encryptContent(gratitude) : null;

  await db.runAsync(
    `INSERT OR REPLACE INTO daily_checkins (id, date, mood, craving_level, gratitude, is_checked_in, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [id, dateStr, mood, cravingLevel, encryptedGratitude, now.toISOString()],
  );

  return {
    id,
    date: now,
    mood,
    cravingLevel,
    gratitude: encryptedGratitude || undefined,
    isCheckedIn: true,
    createdAt: now,
  };
}

export async function getTodayCheckin(): Promise<DailyCheckin | null> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];

  const row = await db.getFirstAsync<DbDailyCheckin>(
    'SELECT * FROM daily_checkins WHERE date = ?',
    [today],
  );

  if (!row) return null;

  return {
    id: row.id,
    date: new Date(row.date),
    mood: row.mood,
    cravingLevel: row.craving_level,
    gratitude: row.gratitude || undefined,
    isCheckedIn: row.is_checked_in === 1,
    createdAt: new Date(row.created_at),
  };
}

export async function getCheckinHistory(days = 30): Promise<DailyCheckin[]> {
  const db = await getDatabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const rows = await db.getAllAsync<DbDailyCheckin>(
    'SELECT * FROM daily_checkins WHERE date >= ? ORDER BY date DESC',
    [startDate.toISOString().split('T')[0]],
  );

  return rows.map((row) => ({
    id: row.id,
    date: new Date(row.date),
    mood: row.mood,
    cravingLevel: row.craving_level,
    gratitude: row.gratitude || undefined,
    isCheckedIn: row.is_checked_in === 1,
    createdAt: new Date(row.created_at),
  }));
}

// ============================================
// MILESTONES
// ============================================

export async function createMilestone(
  type: MilestoneType,
  title: string,
  achievedAt: Date,
  options?: {
    description?: string;
    reflection?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<Milestone> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  // Encrypt reflection if provided
  const encryptedReflection = options?.reflection ? await encryptContent(options.reflection) : null;

  await db.runAsync(
    `INSERT INTO milestones (id, type, title, description, reflection, achieved_at, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      type,
      title,
      options?.description || null,
      encryptedReflection,
      achievedAt.toISOString(),
      JSON.stringify(options?.metadata || {}),
      now,
    ],
  );

  return {
    id,
    type,
    title,
    description: options?.description,
    reflection: encryptedReflection || undefined,
    achievedAt,
    metadata: options?.metadata || {},
    createdAt: new Date(now),
  };
}

export async function getMilestones(): Promise<Milestone[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DbMilestone>(
    'SELECT * FROM milestones ORDER BY achieved_at DESC',
  );

  return rows.map((row) => ({
    id: row.id,
    type: row.type as MilestoneType,
    title: row.title,
    description: row.description || undefined,
    reflection: row.reflection || undefined,
    achievedAt: new Date(row.achieved_at),
    metadata: JSON.parse(row.metadata || '{}'),
    createdAt: new Date(row.created_at),
  }));
}

// ============================================
// EMOTION TAGS
// ============================================

export async function getEmotionTags(): Promise<EmotionTag[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DbEmotionTag>('SELECT * FROM emotion_tags ORDER BY name');

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    isCustom: row.is_custom === 1,
    createdAt: new Date(row.created_at),
  }));
}

export async function createEmotionTag(name: string, color: string): Promise<EmotionTag> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO emotion_tags (id, name, color, is_custom, created_at)
     VALUES (?, ?, ?, 1, ?)`,
    [id, name, color, now],
  );

  return {
    id,
    name,
    color,
    isCustom: true,
    createdAt: new Date(now),
  };
}

// ============================================
// APP SETTINGS
// ============================================

export async function getAppSettings(): Promise<AppSettings | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DbAppSettings>('SELECT * FROM app_settings LIMIT 1');

  if (!row) return null;

  return {
    id: row.id,
    checkInTime: row.check_in_time,
    autoLockMinutes: row.auto_lock_minutes,
    biometricEnabled: row.biometric_enabled === 1,
    themeMode: row.theme_mode as ThemeMode,
    notificationsEnabled: row.notifications_enabled === 1,
    crisisRegion: (row.crisis_region || 'US') as CrisisRegion,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function createOrUpdateAppSettings(
  settings: Partial<Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<AppSettings> {
  const db = await getDatabase();
  const existing = await getAppSettings();
  const now = new Date().toISOString();

  if (existing) {
    await db.runAsync(
      `UPDATE app_settings SET
        check_in_time = ?,
        auto_lock_minutes = ?,
        biometric_enabled = ?,
        theme_mode = ?,
        notifications_enabled = ?,
        crisis_region = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        settings.checkInTime ?? existing.checkInTime,
        settings.autoLockMinutes ?? existing.autoLockMinutes,
        (settings.biometricEnabled ?? existing.biometricEnabled) ? 1 : 0,
        settings.themeMode ?? existing.themeMode,
        (settings.notificationsEnabled ?? existing.notificationsEnabled) ? 1 : 0,
        settings.crisisRegion ?? existing.crisisRegion,
        now,
        existing.id,
      ],
    );

    return {
      ...existing,
      ...settings,
      updatedAt: new Date(now),
    };
  } else {
    const id = uuidv4();
    await db.runAsync(
      `INSERT INTO app_settings (id, check_in_time, auto_lock_minutes, biometric_enabled, theme_mode, notifications_enabled, crisis_region, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        settings.checkInTime || '09:00',
        settings.autoLockMinutes ?? 5,
        settings.biometricEnabled !== false ? 1 : 0,
        settings.themeMode || 'system',
        settings.notificationsEnabled !== false ? 1 : 0,
        settings.crisisRegion || 'US',
        now,
        now,
      ],
    );

    return {
      id,
      checkInTime: settings.checkInTime || '09:00',
      autoLockMinutes: settings.autoLockMinutes ?? 5,
      biometricEnabled: settings.biometricEnabled !== false,
      themeMode: settings.themeMode || 'system',
      notificationsEnabled: settings.notificationsEnabled !== false,
      crisisRegion: settings.crisisRegion || 'US',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }
}

// ============================================
// RECOVERY CONTACTS (V2)
// ============================================

export async function createRecoveryContact(
  name: string,
  phone: string,
  role: ContactRole,
  notes?: string,
): Promise<RecoveryContact> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  // Encrypt notes if provided
  const encryptedNotes = notes ? await encryptContent(notes) : null;

  await db.runAsync(
    `INSERT INTO recovery_contacts (id, name, phone, role, notes, last_contacted_at, created_at)
     VALUES (?, ?, ?, ?, ?, NULL, ?)`,
    [id, name, phone, role, encryptedNotes, now],
  );

  return {
    id,
    name,
    phone,
    role,
    notes: encryptedNotes || undefined,
    createdAt: new Date(now),
  };
}

export async function getRecoveryContacts(): Promise<RecoveryContact[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DbRecoveryContact>(
    'SELECT * FROM recovery_contacts ORDER BY role, name',
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: row.role as ContactRole,
    notes: row.notes || undefined,
    lastContactedAt: row.last_contacted_at ? new Date(row.last_contacted_at) : undefined,
    createdAt: new Date(row.created_at),
  }));
}

export async function getRecoveryContactById(id: string): Promise<RecoveryContact | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DbRecoveryContact>(
    'SELECT * FROM recovery_contacts WHERE id = ?',
    [id],
  );

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: row.role as ContactRole,
    notes: row.notes || undefined,
    lastContactedAt: row.last_contacted_at ? new Date(row.last_contacted_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

export async function getContactsByRole(role: ContactRole): Promise<RecoveryContact[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DbRecoveryContact>(
    'SELECT * FROM recovery_contacts WHERE role = ? ORDER BY name',
    [role],
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: row.role as ContactRole,
    notes: row.notes || undefined,
    lastContactedAt: row.last_contacted_at ? new Date(row.last_contacted_at) : undefined,
    createdAt: new Date(row.created_at),
  }));
}

export async function getSponsor(): Promise<RecoveryContact | null> {
  const sponsors = await getContactsByRole('sponsor');
  return sponsors[0] || null;
}

export async function updateRecoveryContact(
  id: string,
  updates: Partial<Pick<RecoveryContact, 'name' | 'phone' | 'role' | 'notes'>>,
): Promise<void> {
  const db = await getDatabase();
  const updateFields: string[] = [];
  const values: (string | null)[] = [];

  if (updates.name !== undefined) {
    updateFields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.phone !== undefined) {
    updateFields.push('phone = ?');
    values.push(updates.phone);
  }
  if (updates.role !== undefined) {
    updateFields.push('role = ?');
    values.push(updates.role);
  }
  if (updates.notes !== undefined) {
    updateFields.push('notes = ?');
    values.push(updates.notes ? await encryptContent(updates.notes) : null);
  }

  if (updateFields.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE recovery_contacts SET ${updateFields.join(', ')} WHERE id = ?`, values);
}

export async function updateContactLastContacted(id: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync('UPDATE recovery_contacts SET last_contacted_at = ? WHERE id = ?', [now, id]);
}

export async function deleteRecoveryContact(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recovery_contacts WHERE id = ?', [id]);
}

// ============================================
// PHONE CALL LOGS (V2)
// ============================================

export async function createPhoneCallLog(
  contactId: string,
  contactName: string,
  duration?: number,
  notes?: string,
): Promise<PhoneCallLog> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = new Date();

  // Encrypt notes if provided
  const encryptedNotes = notes ? await encryptContent(notes) : null;

  await db.runAsync(
    `INSERT INTO phone_call_logs (id, contact_id, contact_name, duration, notes, called_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, contactId, contactName, duration || null, encryptedNotes, now.toISOString()],
  );

  // Update the contact's last contacted time
  await updateContactLastContacted(contactId);

  return {
    id,
    contactId,
    contactName,
    duration,
    notes: encryptedNotes || undefined,
    calledAt: now,
  };
}

export async function getPhoneCallLogs(limit = 50): Promise<PhoneCallLog[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DbPhoneCallLog>(
    'SELECT * FROM phone_call_logs ORDER BY called_at DESC LIMIT ?',
    [limit],
  );

  return rows.map((row) => ({
    id: row.id,
    contactId: row.contact_id,
    contactName: row.contact_name,
    duration: row.duration || undefined,
    notes: row.notes || undefined,
    calledAt: new Date(row.called_at),
  }));
}

export async function getTodayCallLogs(): Promise<PhoneCallLog[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];

  const rows = await db.getAllAsync<DbPhoneCallLog>(
    `SELECT * FROM phone_call_logs 
     WHERE date(called_at) = ? 
     ORDER BY called_at DESC`,
    [today],
  );

  return rows.map((row) => ({
    id: row.id,
    contactId: row.contact_id,
    contactName: row.contact_name,
    duration: row.duration || undefined,
    notes: row.notes || undefined,
    calledAt: new Date(row.called_at),
  }));
}

export async function getCallLogsByContact(contactId: string): Promise<PhoneCallLog[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DbPhoneCallLog>(
    'SELECT * FROM phone_call_logs WHERE contact_id = ? ORDER BY called_at DESC',
    [contactId],
  );

  return rows.map((row) => ({
    id: row.id,
    contactId: row.contact_id,
    contactName: row.contact_name,
    duration: row.duration || undefined,
    notes: row.notes || undefined,
    calledAt: new Date(row.called_at),
  }));
}

export async function deletePhoneCallLog(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM phone_call_logs WHERE id = ?', [id]);
}

// ============================================
// DAILY READING REFLECTIONS (V2)
// ============================================

export async function createDailyReadingReflection(
  readingDate: string,
  reflection: string,
): Promise<DailyReadingReflection> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = new Date();

  // Encrypt reflection
  const encryptedReflection = await encryptContent(reflection);

  // Use INSERT OR REPLACE to update if exists for same date
  await db.runAsync(
    `INSERT OR REPLACE INTO daily_reading_reflections (id, reading_date, reflection, created_at)
     VALUES (?, ?, ?, ?)`,
    [id, readingDate, encryptedReflection, now.toISOString()],
  );

  return {
    id,
    readingDate,
    reflection: encryptedReflection,
    createdAt: now,
  };
}

export async function getDailyReadingReflection(
  readingDate: string,
): Promise<DailyReadingReflection | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DbDailyReadingReflection>(
    'SELECT * FROM daily_reading_reflections WHERE reading_date = ?',
    [readingDate],
  );

  if (!row) return null;

  return {
    id: row.id,
    readingDate: row.reading_date,
    reflection: row.reflection,
    createdAt: new Date(row.created_at),
  };
}

export async function getTodayReadingReflection(): Promise<DailyReadingReflection | null> {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateKey = `${month}-${day}`;

  return getDailyReadingReflection(dateKey);
}

export async function getReadingReflections(limit = 30): Promise<DailyReadingReflection[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DbDailyReadingReflection>(
    'SELECT * FROM daily_reading_reflections ORDER BY created_at DESC LIMIT ?',
    [limit],
  );

  return rows.map((row) => ({
    id: row.id,
    readingDate: row.reading_date,
    reflection: row.reflection,
    createdAt: new Date(row.created_at),
  }));
}

export async function getReadingStreak(): Promise<number> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DbDailyReadingReflection>(
    'SELECT * FROM daily_reading_reflections ORDER BY created_at DESC LIMIT 365',
  );

  if (rows.length === 0) return 0;

  // Calculate streak based on consecutive days with reflections
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < rows.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedMonth = String(expectedDate.getMonth() + 1).padStart(2, '0');
    const expectedDay = String(expectedDate.getDate()).padStart(2, '0');
    const expectedKey = `${expectedMonth}-${expectedDay}`;

    const hasReflectionForDate = rows.some((row) => row.reading_date === expectedKey);

    if (hasReflectionForDate) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function decryptReflection(reflection: DailyReadingReflection): Promise<string> {
  return await decryptContent(reflection.reflection);
}

// ============================================
// ACHIEVEMENTS (Phase 4)
// ============================================

import { ALL_ACHIEVEMENTS, type AchievementDefinition } from '../../constants/achievements';
import type {
  Achievement,
  AchievementCategory,
  AchievementStatus,
  DbAchievement,
} from '../../types';

/**
 * Initialize achievements table with all definitions
 * Called on first app load or when new achievements are added
 */
export async function initializeAchievements(): Promise<void> {
  const db = await getDatabase();

  for (const def of ALL_ACHIEVEMENTS) {
    // Check if achievement already exists
    const existing = await db.getFirstAsync<DbAchievement>(
      'SELECT id FROM achievements WHERE id = ?',
      [def.id],
    );

    if (!existing) {
      await db.runAsync(
        `INSERT INTO achievements (
          id, category, title, description, icon, unlock_type,
          target, current, status, unlocked_at,
          requires_days_clean, requires_achievements, reflection
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          def.id,
          def.category,
          def.title,
          def.description,
          def.icon,
          def.unlockType,
          def.target || null,
          0,
          'locked',
          null,
          def.requiresDaysClean || null,
          def.requiresAchievements ? JSON.stringify(def.requiresAchievements) : null,
          null,
        ],
      );
    }
  }
}

/**
 * Get all achievements with current status
 */
export async function getAchievements(): Promise<Achievement[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DbAchievement>(
    'SELECT * FROM achievements ORDER BY category, title',
  );

  return rows.map(mapDbAchievementToAchievement);
}

/**
 * Get achievement by ID
 */
export async function getAchievementById(id: string): Promise<Achievement | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DbAchievement>('SELECT * FROM achievements WHERE id = ?', [
    id,
  ]);

  if (!row) return null;
  return mapDbAchievementToAchievement(row);
}

/**
 * Get achievements by category
 */
export async function getAchievementsByCategory(
  category: AchievementCategory,
): Promise<Achievement[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DbAchievement>(
    'SELECT * FROM achievements WHERE category = ? ORDER BY title',
    [category],
  );

  return rows.map(mapDbAchievementToAchievement);
}

/**
 * Get unlocked achievements
 */
export async function getUnlockedAchievements(): Promise<Achievement[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DbAchievement>(
    'SELECT * FROM achievements WHERE status = ? ORDER BY unlocked_at DESC',
    ['unlocked'],
  );

  return rows.map(mapDbAchievementToAchievement);
}

/**
 * Update achievement progress
 */
export async function updateAchievementProgress(
  id: string,
  current: number,
  target?: number,
): Promise<Achievement | null> {
  const db = await getDatabase();

  // Get current achievement
  const existing = await getAchievementById(id);
  if (!existing) return null;

  // Determine new status based on progress
  let newStatus: AchievementStatus = existing.status;
  const effectiveTarget = target ?? existing.target ?? 100;

  if (current >= effectiveTarget && existing.status !== 'unlocked') {
    newStatus = 'unlocked';
  } else if (current > 0 && existing.status === 'locked') {
    newStatus = 'in_progress';
  } else if (current > 0 && current < effectiveTarget) {
    newStatus = 'in_progress';
  }

  const now =
    newStatus === 'unlocked'
      ? new Date().toISOString()
      : existing.unlockedAt?.toISOString() || null;

  await db.runAsync(
    `UPDATE achievements SET current = ?, status = ?, unlocked_at = ? WHERE id = ?`,
    [current, newStatus, now, id],
  );

  return getAchievementById(id);
}

/**
 * Unlock an achievement manually (for self-check type)
 */
export async function unlockAchievement(id: string): Promise<Achievement | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE achievements SET status = ?, unlocked_at = ?, current = target WHERE id = ?`,
    ['unlocked', now, id],
  );

  return getAchievementById(id);
}

/**
 * Set achievement status
 */
export async function setAchievementStatus(id: string, status: AchievementStatus): Promise<void> {
  const db = await getDatabase();
  const now = status === 'unlocked' ? new Date().toISOString() : null;

  await db.runAsync(
    `UPDATE achievements SET status = ?, unlocked_at = COALESCE(unlocked_at, ?) WHERE id = ?`,
    [status, now, id],
  );
}

/**
 * Save achievement reflection (encrypted)
 */
export async function saveAchievementReflection(id: string, reflection: string): Promise<void> {
  const db = await getDatabase();
  const encryptedReflection = await encryptContent(reflection);

  await db.runAsync(`UPDATE achievements SET reflection = ? WHERE id = ?`, [
    encryptedReflection,
    id,
  ]);
}

/**
 * Get achievement reflection (decrypted)
 */
export async function getAchievementReflection(id: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ reflection: string | null }>(
    'SELECT reflection FROM achievements WHERE id = ?',
    [id],
  );

  if (!row?.reflection) return null;
  return decryptContent(row.reflection);
}

/**
 * Get unlocked count by category
 */
export async function getUnlockedCountByCategory(category: AchievementCategory): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM achievements WHERE category = ? AND status = ?',
    [category, 'unlocked'],
  );

  return result?.count || 0;
}

/**
 * Get total unlocked achievements count
 */
export async function getTotalUnlockedCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM achievements WHERE status = ?',
    ['unlocked'],
  );

  return result?.count || 0;
}

/**
 * Reset all achievements (for testing or account reset)
 */
export async function resetAllAchievements(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE achievements SET status = 'locked', current = 0, unlocked_at = NULL, reflection = NULL`,
  );
}

/**
 * Helper to map database row to Achievement type
 */
function mapDbAchievementToAchievement(row: DbAchievement): Achievement {
  return {
    id: row.id,
    category: row.category as AchievementCategory,
    title: row.title,
    description: row.description,
    icon: row.icon,
    unlockType: row.unlock_type as Achievement['unlockType'],
    target: row.target || undefined,
    current: row.current || undefined,
    status: row.status as AchievementStatus,
    unlockedAt: row.unlocked_at ? new Date(row.unlocked_at) : undefined,
    requiresDaysClean: row.requires_days_clean || undefined,
    requiresAchievements: row.requires_achievements
      ? JSON.parse(row.requires_achievements)
      : undefined,
    reflection: row.reflection || undefined,
  };
}
