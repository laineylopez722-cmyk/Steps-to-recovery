/**
 * Regular Meetings Database Model Operations
 * CRUD operations for recurring meeting schedule
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../client';
import { encryptContent, decryptContent } from '../../encryption';
import type { RegularMeeting, DbRegularMeeting, RegularMeetingType } from '../../types';
import { logger } from '../../utils/logger';

// ============================================
// CREATE
// ============================================

export async function createRegularMeeting(
  name: string,
  dayOfWeek: number,
  time: string,
  type: RegularMeetingType,
  options?: {
    location?: string;
    isHomeGroup?: boolean;
    reminderEnabled?: boolean;
    reminderMinutesBefore?: number;
    notes?: string;
  },
): Promise<RegularMeeting> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  // If setting as home group, unset any existing home group first
  if (options?.isHomeGroup) {
    await db.runAsync('UPDATE regular_meetings SET is_home_group = 0 WHERE is_home_group = 1');
  }

  // Encrypt notes if provided
  const encryptedNotes = options?.notes ? await encryptContent(options.notes) : null;

  await db.runAsync(
    `INSERT INTO regular_meetings (
      id, name, location, day_of_week, time, type,
      is_home_group, reminder_enabled, reminder_minutes_before,
      notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      name,
      options?.location || null,
      dayOfWeek,
      time,
      type,
      options?.isHomeGroup ? 1 : 0,
      options?.reminderEnabled !== false ? 1 : 0,
      options?.reminderMinutesBefore ?? 60,
      encryptedNotes,
      now,
    ],
  );

  return {
    id,
    name,
    location: options?.location,
    dayOfWeek,
    time,
    type,
    isHomeGroup: options?.isHomeGroup || false,
    reminderEnabled: options?.reminderEnabled !== false,
    reminderMinutesBefore: options?.reminderMinutesBefore ?? 60,
    notes: encryptedNotes || undefined,
    createdAt: new Date(now),
  };
}

// ============================================
// READ
// ============================================

export async function getRegularMeetings(): Promise<RegularMeeting[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DbRegularMeeting>(
    'SELECT * FROM regular_meetings ORDER BY day_of_week, time',
  );

  return rows.map((row: DbRegularMeeting) => ({
    id: row.id,
    name: row.name,
    location: row.location || undefined,
    dayOfWeek: row.day_of_week,
    time: row.time,
    type: row.type as RegularMeetingType,
    isHomeGroup: row.is_home_group === 1,
    reminderEnabled: row.reminder_enabled === 1,
    reminderMinutesBefore: row.reminder_minutes_before,
    notes: row.notes || undefined,
    createdAt: new Date(row.created_at),
  }));
}

export async function getRegularMeetingById(id: string): Promise<RegularMeeting | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DbRegularMeeting>(
    'SELECT * FROM regular_meetings WHERE id = ?',
    [id],
  );

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    location: row.location || undefined,
    dayOfWeek: row.day_of_week,
    time: row.time,
    type: row.type as RegularMeetingType,
    isHomeGroup: row.is_home_group === 1,
    reminderEnabled: row.reminder_enabled === 1,
    reminderMinutesBefore: row.reminder_minutes_before,
    notes: row.notes || undefined,
    createdAt: new Date(row.created_at),
  };
}

export async function getHomeGroup(): Promise<RegularMeeting | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DbRegularMeeting>(
    'SELECT * FROM regular_meetings WHERE is_home_group = 1 LIMIT 1',
  );

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    location: row.location || undefined,
    dayOfWeek: row.day_of_week,
    time: row.time,
    type: row.type as RegularMeetingType,
    isHomeGroup: true,
    reminderEnabled: row.reminder_enabled === 1,
    reminderMinutesBefore: row.reminder_minutes_before,
    notes: row.notes || undefined,
    createdAt: new Date(row.created_at),
  };
}

export async function getMeetingsByDay(dayOfWeek: number): Promise<RegularMeeting[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DbRegularMeeting>(
    'SELECT * FROM regular_meetings WHERE day_of_week = ? ORDER BY time',
    [dayOfWeek],
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    location: row.location || undefined,
    dayOfWeek: row.day_of_week,
    time: row.time,
    type: row.type as RegularMeetingType,
    isHomeGroup: row.is_home_group === 1,
    reminderEnabled: row.reminder_enabled === 1,
    reminderMinutesBefore: row.reminder_minutes_before,
    notes: row.notes || undefined,
    createdAt: new Date(row.created_at),
  }));
}

export async function getTodayMeetings(): Promise<RegularMeeting[]> {
  const today = new Date().getDay(); // 0-6, Sunday = 0
  return getMeetingsByDay(today);
}

export async function getUpcomingMeetings(days: number = 7): Promise<RegularMeeting[]> {
  const meetings = await getRegularMeetings();
  const today = new Date();
  const todayDay = today.getDay();

  // Sort meetings by how soon they occur from today
  return meetings
    .map((meeting) => {
      let daysUntil = meeting.dayOfWeek - todayDay;
      if (daysUntil < 0) daysUntil += 7;

      // If it's today, check if the time has passed
      if (daysUntil === 0) {
        const [hours, minutes] = meeting.time.split(':').map(Number);
        const meetingTime = new Date(today);
        meetingTime.setHours(hours, minutes, 0, 0);

        if (meetingTime < today) {
          daysUntil = 7; // Next week
        }
      }

      return { ...meeting, daysUntil };
    })
    .filter((m) => m.daysUntil < days)
    .sort((a, b) => {
      if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
      return a.time.localeCompare(b.time);
    });
}

export async function getNextMeeting(): Promise<RegularMeeting | null> {
  const upcoming = await getUpcomingMeetings(7);
  return upcoming[0] || null;
}

// ============================================
// UPDATE
// ============================================

export async function updateRegularMeeting(
  id: string,
  updates: Partial<{
    name: string;
    location: string;
    dayOfWeek: number;
    time: string;
    type: RegularMeetingType;
    isHomeGroup: boolean;
    reminderEnabled: boolean;
    reminderMinutesBefore: number;
    notes: string;
  }>,
): Promise<void> {
  const db = await getDatabase();

  // If setting as home group, unset any existing home group first
  if (updates.isHomeGroup) {
    await db.runAsync(
      'UPDATE regular_meetings SET is_home_group = 0 WHERE is_home_group = 1 AND id != ?',
      [id],
    );
  }

  const updateFields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    updateFields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.location !== undefined) {
    updateFields.push('location = ?');
    values.push(updates.location || null);
  }
  if (updates.dayOfWeek !== undefined) {
    updateFields.push('day_of_week = ?');
    values.push(updates.dayOfWeek);
  }
  if (updates.time !== undefined) {
    updateFields.push('time = ?');
    values.push(updates.time);
  }
  if (updates.type !== undefined) {
    updateFields.push('type = ?');
    values.push(updates.type);
  }
  if (updates.isHomeGroup !== undefined) {
    updateFields.push('is_home_group = ?');
    values.push(updates.isHomeGroup ? 1 : 0);
  }
  if (updates.reminderEnabled !== undefined) {
    updateFields.push('reminder_enabled = ?');
    values.push(updates.reminderEnabled ? 1 : 0);
  }
  if (updates.reminderMinutesBefore !== undefined) {
    updateFields.push('reminder_minutes_before = ?');
    values.push(updates.reminderMinutesBefore);
  }
  if (updates.notes !== undefined) {
    updateFields.push('notes = ?');
    values.push(updates.notes ? await encryptContent(updates.notes) : null);
  }

  if (updateFields.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE regular_meetings SET ${updateFields.join(', ')} WHERE id = ?`, values);
}

export async function toggleMeetingReminder(id: string, enabled: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE regular_meetings SET reminder_enabled = ? WHERE id = ?', [
    enabled ? 1 : 0,
    id,
  ]);
}

export async function setHomeGroup(id: string): Promise<void> {
  const db = await getDatabase();

  // Unset all home groups first
  await db.runAsync('UPDATE regular_meetings SET is_home_group = 0');

  // Set the new home group
  await db.runAsync('UPDATE regular_meetings SET is_home_group = 1 WHERE id = ?', [id]);
}

// ============================================
// DELETE
// ============================================

export async function deleteRegularMeeting(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM regular_meetings WHERE id = ?', [id]);
}

// ============================================
// UTILITIES
// ============================================

export async function decryptMeetingNotes(meeting: RegularMeeting): Promise<string | null> {
  if (!meeting.notes) return null;
  try {
    return await decryptContent(meeting.notes);
  } catch (error) {
    logger.error('Failed to decrypt meeting notes', error);
    return null;
  }
}

export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || '';
}

export function getShortDayName(dayOfWeek: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayOfWeek] || '';
}

export function formatMeetingTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function getMeetingTypeIcon(type: RegularMeetingType): string {
  switch (type) {
    case 'in-person':
      return '📍';
    case 'online':
      return '💻';
    case 'hybrid':
      return '🔄';
    default:
      return '📍';
  }
}
