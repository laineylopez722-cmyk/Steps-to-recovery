/**
 * Data Export Utility
 *
 * Exports all user data to a JSON file for privacy compliance (GDPR, CCPA, etc.).
 * All encrypted content is decrypted before export so users have access to
 * their complete data.
 *
 * **Privacy Note**: Exported data contains decrypted sensitive information.
 * Users should handle exported files with care and store them securely.
 *
 * @module export
 */
import * as ExpoFileSystem from 'expo-file-system';
import * as ExpoSharing from 'expo-sharing';
import { getDatabase } from '../db/client';

// Re-export with proper types to work around type resolution issues
const FileSystem = ExpoFileSystem as typeof ExpoFileSystem & {
  documentDirectory: string | null;
};
const Sharing = ExpoSharing;
import { decryptContent } from '../encryption';
import { logger } from '../utils/logger';
import type {
  SobrietyProfile,
  JournalEntry,
  DailyCheckin,
  Milestone,
  MeetingLog,
  VaultItem,
  TimeCapsule,
  AppSettings,
  ScenarioPractice,
  DbSobrietyProfile,
  DbJournalEntry,
  DbDailyCheckin,
  DbMilestone,
  DbMeetingLog,
  DbVaultItem,
  DbTimeCapsule,
  DbAppSettings,
  DbScenarioPractice,
  JournalType,
  MilestoneType,
  MeetingType,
  ProgramType,
  ThemeMode,
  VaultItemType,
  CrisisRegion,
} from '../types';

/**
 * Exported data structure
 */
export interface ExportData {
  exportedAt: string;
  version: string;
  appVersion: string;
  profile: SobrietyProfile | null;
  journalEntries: Array<Omit<JournalEntry, 'content'> & { content: string }>;
  dailyCheckins: Array<Omit<DailyCheckin, 'gratitude'> & { gratitude?: string }>;
  milestones: Array<Omit<Milestone, 'reflection'> & { reflection?: string }>;
  meetingLogs: Array<Omit<MeetingLog, 'keyTakeaways'> & { keyTakeaways: string }>;
  vaultItems: Array<Omit<VaultItem, 'content'> & { content: string }>;
  timeCapsules: Array<Omit<TimeCapsule, 'content'> & { content: string }>;
  scenarioPractices: Array<Omit<ScenarioPractice, 'reflection'> & { reflection?: string }>;
  settings: AppSettings | null;
}

/**
 * Export all user data to a JSON file
 *
 * Fetches all user data from the database, decrypts encrypted content,
 * and writes it to a JSON file. Returns the file path for sharing.
 *
 * @returns Promise resolving to file path of exported JSON file
 * @throws May throw if database access fails or decryption errors occur
 * @example
 * ```ts
 * const filePath = await exportAllData();
 * // File is saved and ready to share
 * ```
 */
export async function exportAllData(): Promise<string> {
  const db = await getDatabase();

  // Fetch all data from database
  const [
    profileRow,
    journalRows,
    checkinRows,
    milestoneRows,
    meetingRows,
    vaultRows,
    capsuleRows,
    scenarioRows,
    settingsRow,
  ] = await Promise.all([
    db.getFirstAsync<DbSobrietyProfile>('SELECT * FROM sobriety_profile LIMIT 1'),
    db.getAllAsync<DbJournalEntry>('SELECT * FROM journal_entries ORDER BY created_at DESC'),
    db.getAllAsync<DbDailyCheckin>('SELECT * FROM daily_checkins ORDER BY date DESC'),
    db.getAllAsync<DbMilestone>('SELECT * FROM milestones ORDER BY achieved_at DESC'),
    db.getAllAsync<DbMeetingLog>('SELECT * FROM meeting_logs ORDER BY attended_at DESC'),
    db.getAllAsync<DbVaultItem>('SELECT * FROM motivation_vault ORDER BY created_at DESC'),
    db.getAllAsync<DbTimeCapsule>('SELECT * FROM time_capsules ORDER BY unlock_date ASC'),
    db.getAllAsync<DbScenarioPractice>(
      'SELECT * FROM scenario_practices ORDER BY completed_at DESC',
    ),
    db.getFirstAsync<DbAppSettings>('SELECT * FROM app_settings LIMIT 1'),
  ]);

  // Transform and decrypt profile
  const profile: SobrietyProfile | null = profileRow
    ? {
        id: profileRow.id,
        sobrietyDate: new Date(profileRow.sobriety_date),
        programType: profileRow.program_type as ProgramType,
        displayName: profileRow.display_name || undefined,
        createdAt: new Date(profileRow.created_at),
        updatedAt: new Date(profileRow.updated_at),
      }
    : null;

  // Transform and decrypt journal entries
  const journalEntries = await Promise.all(
    journalRows.map(async (row) => {
      let decryptedContent = '';
      try {
        decryptedContent = await decryptContent(row.content);
      } catch {
        decryptedContent = '[Unable to decrypt content]';
      }

      return {
        id: row.id,
        type: row.type as JournalType,
        content: decryptedContent,
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
    }),
  );

  // Transform and decrypt check-ins
  const dailyCheckins = await Promise.all(
    checkinRows.map(async (row) => {
      let decryptedGratitude: string | undefined;
      if (row.gratitude) {
        try {
          decryptedGratitude = await decryptContent(row.gratitude);
        } catch {
          decryptedGratitude = '[Unable to decrypt]';
        }
      }

      return {
        id: row.id,
        date: new Date(row.date),
        mood: row.mood,
        cravingLevel: row.craving_level,
        gratitude: decryptedGratitude,
        isCheckedIn: row.is_checked_in === 1,
        createdAt: new Date(row.created_at),
      };
    }),
  );

  // Transform and decrypt milestones
  const milestones = await Promise.all(
    milestoneRows.map(async (row) => {
      let decryptedReflection: string | undefined;
      if (row.reflection) {
        try {
          decryptedReflection = await decryptContent(row.reflection);
        } catch {
          decryptedReflection = '[Unable to decrypt]';
        }
      }

      return {
        id: row.id,
        type: row.type as MilestoneType,
        title: row.title,
        description: row.description || undefined,
        reflection: decryptedReflection,
        achievedAt: new Date(row.achieved_at),
        metadata: JSON.parse(row.metadata || '{}'),
        createdAt: new Date(row.created_at),
      };
    }),
  );

  // Transform and decrypt meeting logs
  const meetingLogs = await Promise.all(
    meetingRows.map(async (row) => {
      let decryptedTakeaways = '';
      try {
        decryptedTakeaways = await decryptContent(row.key_takeaways);
      } catch {
        decryptedTakeaways = '[Unable to decrypt]';
      }

      return {
        id: row.id,
        name: row.name || undefined,
        location: row.location || undefined,
        type: row.type as MeetingType,
        moodBefore: row.mood_before,
        moodAfter: row.mood_after,
        keyTakeaways: decryptedTakeaways,
        topicTags: JSON.parse(row.topic_tags || '[]'),
        attendedAt: new Date(row.attended_at),
        createdAt: new Date(row.created_at),
      };
    }),
  );

  // Transform and decrypt vault items
  const vaultItems = await Promise.all(
    vaultRows.map(async (row) => {
      let decryptedContent = '';
      try {
        decryptedContent = await decryptContent(row.content);
      } catch {
        decryptedContent = '[Unable to decrypt]';
      }

      return {
        id: row.id,
        type: row.type as VaultItemType,
        title: row.title,
        content: decryptedContent,
        mediaUri: row.media_uri || undefined,
        isFavorite: row.is_favorite === 1,
        viewCount: row.view_count,
        lastViewedAt: row.last_viewed_at ? new Date(row.last_viewed_at) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    }),
  );

  // Transform and decrypt time capsules
  const timeCapsules = await Promise.all(
    capsuleRows.map(async (row) => {
      let decryptedContent = '';
      // Only decrypt if unlocked or we're exporting
      try {
        decryptedContent = await decryptContent(row.content);
      } catch {
        decryptedContent = '[Unable to decrypt]';
      }

      return {
        id: row.id,
        title: row.title,
        content: decryptedContent,
        unlockDate: new Date(row.unlock_date),
        isUnlocked: row.is_unlocked === 1,
        unlockedAt: row.unlocked_at ? new Date(row.unlocked_at) : undefined,
        createdAt: new Date(row.created_at),
      };
    }),
  );

  // Transform and decrypt scenario practices
  const scenarioPractices = await Promise.all(
    scenarioRows.map(async (row) => {
      let decryptedReflection: string | undefined;
      if (row.reflection) {
        try {
          decryptedReflection = await decryptContent(row.reflection);
        } catch {
          decryptedReflection = '[Unable to decrypt]';
        }
      }

      return {
        id: row.id,
        scenarioId: row.scenario_id,
        selectedOptionIndex: row.selected_option_index,
        reflection: decryptedReflection,
        completedAt: new Date(row.completed_at),
      };
    }),
  );

  // Transform settings
  const settings: AppSettings | null = settingsRow
    ? {
        id: settingsRow.id,
        checkInTime: settingsRow.check_in_time,
        autoLockMinutes: settingsRow.auto_lock_minutes,
        biometricEnabled: settingsRow.biometric_enabled === 1,
        themeMode: settingsRow.theme_mode as ThemeMode,
        notificationsEnabled: settingsRow.notifications_enabled === 1,
        crisisRegion: (settingsRow.crisis_region as CrisisRegion) || 'global',
        createdAt: new Date(settingsRow.created_at),
        updatedAt: new Date(settingsRow.updated_at),
      }
    : null;

  // Build export object
  const exportData: ExportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    appVersion: '1.0.0',
    profile,
    journalEntries,
    dailyCheckins,
    milestones,
    meetingLogs: meetingLogs.map((log) => ({
      ...log,
      didShare: false,
    })),
    vaultItems,
    timeCapsules,
    scenarioPractices,
    settings,
  };

  // Generate filename with date
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `recovery-companion-export-${dateStr}.json`;
  const filePath = `${FileSystem.documentDirectory}${filename}`;

  // Write to file
  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));

  return filePath;
}

/**
 * Export data and share via system share sheet
 *
 * Exports all data and immediately opens the system share sheet
 * so users can share the exported file via email, cloud storage, etc.
 *
 * @returns Promise resolving to true if sharing succeeded
 * @throws Error if sharing is not available or export fails
 * @example
 * ```ts
 * try {
 *   await exportAndShare();
 *   // Share sheet opens automatically
 * } catch (error) {
 *   Alert.alert('Export failed', error.message);
 * }
 * ```
 */
export async function exportAndShare(): Promise<boolean> {
  try {
    // Check if sharing is available
    const sharingAvailable = await Sharing.isAvailableAsync();
    if (!sharingAvailable) {
      throw new Error('Sharing is not available on this device');
    }

    // Export data to file
    const filePath = await exportAllData();

    // Share the file
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Export Recovery Data',
      UTI: 'public.json',
    });

    // Clean up the temporary file after a delay
    setTimeout(async () => {
      try {
        await FileSystem.deleteAsync(filePath);
      } catch {
        // Ignore cleanup errors (file may not exist or already deleted)
      }
    }, 60000); // Delete after 1 minute

    return true;
  } catch (error) {
    logger.error('Export failed', error);
    throw error;
  }
}

/**
 * Get export statistics
 *
 * Returns counts of all data types that would be included in an export.
 * Useful for showing users what will be exported before they proceed.
 *
 * @returns Promise resolving to object with counts for each data type
 * @example
 * ```ts
 * const stats = await getExportStats();
 * // Show: "Your export will include 45 journal entries, 120 check-ins, etc."
 * ```
 */
export async function getExportStats(): Promise<{
  journalCount: number;
  checkinCount: number;
  milestoneCount: number;
  meetingCount: number;
  vaultCount: number;
  capsuleCount: number;
}> {
  const db = await getDatabase();

  const [journals, checkins, milestones, meetings, vault, capsules] = await Promise.all([
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM journal_entries'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM daily_checkins'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM milestones'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM meeting_logs'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM motivation_vault'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM time_capsules'),
  ]);

  return {
    journalCount: journals?.count || 0,
    checkinCount: checkins?.count || 0,
    milestoneCount: milestones?.count || 0,
    meetingCount: meetings?.count || 0,
    vaultCount: vault?.count || 0,
    capsuleCount: capsules?.count || 0,
  };
}
