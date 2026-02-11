import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ExpoFileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { GradientButton } from '../../../design-system/components/GradientButton';
import { AnimatedCheckbox } from '../../../design-system/components/MicroInteractions';
import { darkAccent, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { useToast } from '../../../design-system/components/ToastProvider';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { decryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

// Type workaround for expo-file-system directory constants
const FileSystem = ExpoFileSystem as typeof ExpoFileSystem & {
  cacheDirectory: string | null;
};

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

interface FavoriteMeetingRow {
  id: string;
  meeting_id: string | null;
  encrypted_notes: string | null;
  notification_enabled: number;
  created_at: string;
}

interface StepWorkRow {
  id: string;
  step_number: number;
  question_number: number;
  encrypted_answer: string;
  is_complete: number;
  completed_at: string | null;
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

const safeDecrypt = async (encrypted: string): Promise<string> => {
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

const convertToCSV = (data: Record<string, unknown>): string => {
  const sections: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (!Array.isArray(value)) {
      if (value && typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const headers = Object.keys(obj);
        sections.push(`--- ${key} ---`);
        sections.push(headers.join(','));
        sections.push(headers.map((h) => csvEscape(String(obj[h] ?? ''))).join(','));
      }
      continue;
    }

    if (value.length === 0) continue;

    const headers = Object.keys(value[0] as Record<string, unknown>);
    sections.push(`--- ${key} ---`);
    sections.push(headers.join(','));

    for (const row of value) {
      const rowObj = row as Record<string, unknown>;
      sections.push(headers.map((h) => csvEscape(String(rowObj[h] ?? ''))).join(','));
    }

    sections.push('');
  }

  return sections.join('\n');
};

const EXPORT_FORMATS = [
  { id: 'json', label: 'JSON', description: 'Machine readable format', icon: 'code' },
  { id: 'pdf', label: 'PDF', description: 'Human readable document', icon: 'picture-as-pdf' },
  { id: 'csv', label: 'CSV', description: 'Spreadsheet format', icon: 'table-chart' },
];

const DATA_TYPES = [
  { id: 'journal', label: 'Journal Entries' },
  { id: 'checkins', label: 'Daily Check-ins' },
  { id: 'meetings', label: 'Meeting History' },
  { id: 'steps', label: 'Step Work' },
  { id: 'profile', label: 'Profile Data' },
];

export function DataExportScreen(): React.ReactElement {
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'journal',
    'checkins',
    'meetings',
    'steps',
    'profile',
  ]);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dataCounts, setDataCounts] = useState<Record<string, number>>({});
  const { showToast } = useToast();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const { db, isReady } = useDatabase();
  const { user } = useAuth();

  useEffect(() => {
    if (!db || !isReady || !user) return;

    const loadCounts = async (): Promise<void> => {
      try {
        const [journal, checkins, meetings, steps] = await Promise.all([
          db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM journal_entries WHERE user_id = ?',
            [user.id],
          ),
          db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM daily_checkins WHERE user_id = ?',
            [user.id],
          ),
          db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM favorite_meetings WHERE user_id = ?',
            [user.id],
          ),
          db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM step_work WHERE user_id = ?',
            [user.id],
          ),
        ]);

        setDataCounts({
          journal: journal?.count ?? 0,
          checkins: checkins?.count ?? 0,
          meetings: meetings?.count ?? 0,
          steps: steps?.count ?? 0,
        });
      } catch (error) {
        logger.error('Failed to load data counts', error);
      }
    };

    loadCounts();
  }, [db, isReady, user]);

  const toggleDataType = (id: string): void => {
    setSelectedTypes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleExport = async (): Promise<void> => {
    if (selectedTypes.length === 0) {
      showToast('Please select at least one data type', 'error');
      return;
    }

    if (!db || !user) {
      showToast('Database not ready. Please try again.', 'error');
      return;
    }

    if (selectedFormat === 'pdf') {
      showToast('PDF export is not yet supported. Please use JSON or CSV.', 'info');
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      const exportData: Record<string, unknown> = {};
      const totalSteps = selectedTypes.length;

      for (let i = 0; i < selectedTypes.length; i++) {
        const dataType = selectedTypes[i];
        setProgress(Math.round((i / totalSteps) * 80));

        switch (dataType) {
          case 'journal': {
            const rows = await db.getAllAsync<JournalEntryRow>(
              'SELECT * FROM journal_entries WHERE user_id = ?',
              [user.id],
            );
            exportData.journal = await Promise.all(
              rows.map(async (row) => ({
                id: row.id,
                title: row.encrypted_title ? await safeDecrypt(row.encrypted_title) : null,
                body: await safeDecrypt(row.encrypted_body),
                mood: row.encrypted_mood ? await safeDecrypt(row.encrypted_mood) : null,
                craving: row.encrypted_craving ? await safeDecrypt(row.encrypted_craving) : null,
                tags: row.encrypted_tags ? await safeDecrypt(row.encrypted_tags) : null,
                created_at: row.created_at,
                updated_at: row.updated_at,
              })),
            );
            break;
          }
          case 'checkins': {
            const rows = await db.getAllAsync<DailyCheckinRow>(
              'SELECT * FROM daily_checkins WHERE user_id = ?',
              [user.id],
            );
            exportData.checkins = await Promise.all(
              rows.map(async (row) => ({
                id: row.id,
                check_in_type: row.check_in_type,
                check_in_date: row.check_in_date,
                intention: row.encrypted_intention
                  ? await safeDecrypt(row.encrypted_intention)
                  : null,
                reflection: row.encrypted_reflection
                  ? await safeDecrypt(row.encrypted_reflection)
                  : null,
                mood: row.encrypted_mood ? await safeDecrypt(row.encrypted_mood) : null,
                craving: row.encrypted_craving ? await safeDecrypt(row.encrypted_craving) : null,
                gratitude: row.encrypted_gratitude
                  ? await safeDecrypt(row.encrypted_gratitude)
                  : null,
                created_at: row.created_at,
                updated_at: row.updated_at,
              })),
            );
            break;
          }
          case 'meetings': {
            const rows = await db.getAllAsync<FavoriteMeetingRow>(
              'SELECT * FROM favorite_meetings WHERE user_id = ?',
              [user.id],
            );
            exportData.meetings = await Promise.all(
              rows.map(async (row) => ({
                id: row.id,
                meeting_id: row.meeting_id,
                notes: row.encrypted_notes ? await safeDecrypt(row.encrypted_notes) : null,
                notification_enabled: Boolean(row.notification_enabled),
                created_at: row.created_at,
              })),
            );
            break;
          }
          case 'steps': {
            const rows = await db.getAllAsync<StepWorkRow>(
              'SELECT * FROM step_work WHERE user_id = ?',
              [user.id],
            );
            exportData.steps = await Promise.all(
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
            break;
          }
          case 'profile': {
            const row = await db.getFirstAsync<UserProfileRow>(
              'SELECT * FROM user_profile WHERE id = ?',
              [user.id],
            );
            if (row) {
              exportData.profile = {
                id: row.id,
                email: row.encrypted_email ? await safeDecrypt(row.encrypted_email) : null,
                sobriety_start_date: row.sobriety_start_date,
                created_at: row.created_at,
                updated_at: row.updated_at,
              };
            }
            break;
          }
        }
      }

      setProgress(90);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = selectedFormat === 'csv' ? 'csv' : 'json';
      const fileName = `recovery-export-${timestamp}.${extension}`;
      const cacheDir = FileSystem.cacheDirectory;

      if (!cacheDir) {
        showToast('File system not available on this platform.', 'error');
        setIsExporting(false);
        return;
      }

      const filePath = `${cacheDir}${fileName}`;
      let mimeType: string;
      let fileContent: string;

      if (selectedFormat === 'csv') {
        fileContent = convertToCSV(exportData);
        mimeType = 'text/csv';
      } else {
        fileContent = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
      }

      await ExpoFileSystem.writeAsStringAsync(filePath, fileContent);
      setProgress(100);

      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType,
          dialogTitle: 'Export Recovery Data',
        });
      } else {
        showToast('Sharing is not available on this device.', 'error');
      }

      setIsExporting(false);
      showToast('Export completed successfully!', 'success');
    } catch (error) {
      logger.error('Data export failed', error);
      setIsExporting(false);
      showToast('Export failed. Please try again.', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[darkAccent.background, darkAccent.surface]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Header */}
          <Animated.View entering={FadeInUp}>
            <Text style={styles.title}>Export Your Data</Text>
            <Text style={styles.subtitle}>
              Download a copy of your recovery journey. All data is decrypted for export.
            </Text>
          </Animated.View>

          {/* Format Selection */}
          <Animated.View entering={FadeInUp.delay(100)}>
            <Text style={styles.sectionTitle}>Export Format</Text>
            <View style={styles.formatGrid}>
              {EXPORT_FORMATS.map((format) => (
                <Pressable
                  key={format.id}
                  onPress={() => setSelectedFormat(format.id)}
                  style={[
                    styles.formatCard,
                    selectedFormat === format.id && styles.formatCardSelected,
                  ]}
                >
                  <MaterialIcons
                    name={format.icon as IconName}
                    size={28}
                    color={selectedFormat === format.id ? darkAccent.primary : darkAccent.textMuted}
                  />
                  <Text
                    style={[
                      styles.formatLabel,
                      selectedFormat === format.id && styles.formatLabelSelected,
                    ]}
                  >
                    {format.label}
                  </Text>
                  <Text style={styles.formatDesc}>{format.description}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Data Types */}
          <Animated.View entering={FadeInUp.delay(200)}>
            <Text style={styles.sectionTitle}>Select Data to Export</Text>
            <GlassCard intensity="light">
              {DATA_TYPES.map((type, index) => (
                <View key={type.id}>
                  <View style={styles.dataTypeRow}>
                    <View style={styles.dataTypeInfo}>
                      <Text style={styles.dataTypeLabel}>{type.label}</Text>
                      {dataCounts[type.id] != null && (
                        <Text style={styles.dataTypeCount}>{dataCounts[type.id]} items</Text>
                      )}
                    </View>
                    <AnimatedCheckbox
                      checked={selectedTypes.includes(type.id)}
                      onToggle={() => toggleDataType(type.id)}
                    />
                  </View>
                  {index < DATA_TYPES.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </GlassCard>
          </Animated.View>

          {/* Privacy Notice */}
          <Animated.View entering={FadeInUp.delay(300)}>
            <View style={styles.privacyNotice}>
              <MaterialIcons name="info-outline" size={20} color={darkAccent.info} />
              <Text style={styles.privacyText}>
                Your exported data will be unencrypted. Keep it secure and do not share it with
                untrusted parties.
              </Text>
            </View>
          </Animated.View>

          {/* Export Button */}
          <Animated.View entering={FadeInUp.delay(400)}>
            {isExporting ? (
              <GlassCard
                intensity="medium"
                style={styles.progressCard}
                accessible
                accessibilityLabel={`Exporting data, ${progress} percent complete`}
                accessibilityRole="progressbar"
              >
                <Text style={styles.progressTitle}>Exporting your data...</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressPercent}>{progress}%</Text>
              </GlassCard>
            ) : (
              <GradientButton
                title={`Export ${selectedTypes.length} Data Types`}
                variant="primary"
                size="lg"
                fullWidth
                disabled={selectedTypes.length === 0}
                icon={<MaterialIcons name="download" size={20} color={ds.semantic.text.onDark} />}
                onPress={handleExport}
                accessibilityLabel={`Export ${selectedTypes.length} data types as ${selectedFormat.toUpperCase()}`}
                accessibilityRole="button"
              />
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

import { Pressable } from 'react-native';

const createStyles = (ds: DS) => ({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing[3],
    gap: spacing[4],
  },
  title: {
    ...typography.h1,
    color: darkAccent.text,
    marginBottom: spacing[1],
  },
  subtitle: {
    ...typography.body,
    color: darkAccent.textMuted,
  },
  sectionTitle: {
    ...typography.h4,
    color: darkAccent.text,
    marginBottom: spacing[2],
  },
  formatGrid: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  formatCard: {
    flex: 1,
    backgroundColor: darkAccent.surfaceHigh,
    borderRadius: radius.lg,
    padding: spacing[3],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formatCardSelected: {
    borderColor: darkAccent.primary,
    backgroundColor: ds.colors.accentMuted,
  },
  formatLabel: {
    ...typography.body,
    color: darkAccent.text,
    fontWeight: '600',
    marginTop: spacing[1],
  },
  formatLabelSelected: {
    color: darkAccent.primary,
  },
  formatDesc: {
    ...typography.caption,
    color: darkAccent.textSubtle,
    textAlign: 'center',
    marginTop: 2,
  },
  dataTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  dataTypeInfo: {
    flex: 1,
  },
  dataTypeLabel: {
    ...typography.body,
    color: darkAccent.text,
    fontWeight: '500',
  },
  dataTypeCount: {
    ...typography.caption,
    color: darkAccent.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: darkAccent.border,
  },
  privacyNotice: {
    flexDirection: 'row',
    gap: spacing[2],
    backgroundColor: ds.colors.infoMuted,
    padding: spacing[3],
    borderRadius: radius.lg,
  },
  privacyText: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
    flex: 1,
  },
  progressCard: {
    padding: spacing[4],
    alignItems: 'center',
  },
  progressTitle: {
    ...typography.body,
    color: darkAccent.text,
    marginBottom: spacing[3],
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: darkAccent.surfaceHigh,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing[2],
  },
  progressFill: {
    height: '100%',
    backgroundColor: darkAccent.primary,
    borderRadius: radius.full,
  },
  progressPercent: {
    ...typography.h4,
    color: darkAccent.primary,
  },
} as const);
