import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
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
import { logger } from '../../../utils/logger';
import {
  exportAllUserData,
  exportAsCSV,
  deleteAllUserData,
} from '../../../services/dataExportService';
import type { ExportableTable } from '../../../services/dataExportService';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

// Type workaround for expo-file-system directory constants
const FileSystem = ExpoFileSystem as typeof ExpoFileSystem & {
  cacheDirectory: string | null;
};

const EXPORT_FORMATS = [
  { id: 'json', label: 'JSON', description: 'Machine readable format', icon: 'code' },
  { id: 'pdf', label: 'PDF', description: 'Human readable document', icon: 'picture-as-pdf' },
  { id: 'csv', label: 'CSV', description: 'Spreadsheet format', icon: 'table-chart' },
];

const DATA_TYPES = [
  { id: 'journal', label: 'Journal Entries', table: 'journal_entries' as ExportableTable },
  { id: 'checkins', label: 'Daily Check-ins', table: 'daily_checkins' as ExportableTable },
  { id: 'meetings', label: 'Meeting History', table: undefined },
  { id: 'steps', label: 'Step Work', table: 'step_work' as ExportableTable },
  { id: 'profile', label: 'Profile Data', table: undefined },
  { id: 'safety_plans', label: 'Safety Plans', table: 'safety_plans' as ExportableTable },
  { id: 'gratitude', label: 'Gratitude Entries', table: 'gratitude_entries' as ExportableTable },
  { id: 'inventory', label: 'Personal Inventory', table: 'personal_inventory' as ExportableTable },
  { id: 'cravings', label: 'Craving Surf Sessions', table: 'craving_surf_sessions' as ExportableTable },
  { id: 'sponsor', label: 'Sponsor Connections', table: 'sponsor_connections' as ExportableTable },
];

export function DataExportScreen(): React.ReactElement {
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    DATA_TYPES.map((t) => t.id),
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dataCounts, setDataCounts] = useState<Record<string, number>>({});
  const { showToast } = useToast();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const { db, isReady } = useDatabase();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!db || !isReady || !user) return;

    const loadCounts = async (): Promise<void> => {
      try {
        const [journal, checkins, meetings, steps, safetyPlans, gratitude, inventory, cravings, sponsor] = await Promise.all([
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
          db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM safety_plans WHERE user_id = ?',
            [user.id],
          ),
          db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM gratitude_entries WHERE user_id = ?',
            [user.id],
          ),
          db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM personal_inventory WHERE user_id = ?',
            [user.id],
          ),
          db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM craving_surf_sessions WHERE user_id = ?',
            [user.id],
          ),
          db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM sponsor_connections WHERE user_id = ?',
            [user.id],
          ),
        ]);

        setDataCounts({
          journal: journal?.count ?? 0,
          checkins: checkins?.count ?? 0,
          meetings: meetings?.count ?? 0,
          steps: steps?.count ?? 0,
          safety_plans: safetyPlans?.count ?? 0,
          gratitude: gratitude?.count ?? 0,
          inventory: inventory?.count ?? 0,
          cravings: cravings?.count ?? 0,
          sponsor: sponsor?.count ?? 0,
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
      setProgress(10);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const cacheDir = FileSystem.cacheDirectory;

      if (!cacheDir) {
        showToast('File system not available on this platform.', 'error');
        setIsExporting(false);
        return;
      }

      let fileContent: string;
      let mimeType: string;
      let extension: string;

      if (selectedFormat === 'csv') {
        // For CSV, export all selected tables concatenated
        const sections: string[] = [];
        const totalSteps = selectedTypes.length;

        for (let i = 0; i < selectedTypes.length; i++) {
          const dataType = selectedTypes[i];
          setProgress(Math.round(10 + (i / totalSteps) * 70));

          const tableConfig = DATA_TYPES.find((t) => t.id === dataType);
          if (tableConfig?.table) {
            const csv = await exportAsCSV(db, user.id, tableConfig.table);
            if (csv) {
              sections.push(`--- ${tableConfig.label} ---`);
              sections.push(csv);
              sections.push('');
            }
          }
        }

        fileContent = sections.join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
      } else {
        setProgress(30);
        fileContent = await exportAllUserData(db, user.id);
        mimeType = 'application/json';
        extension = 'json';
      }

      setProgress(90);

      const fileName = `recovery-export-${timestamp}.${extension}`;
      const filePath = `${cacheDir}${fileName}`;
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

  const handleExportCategory = async (tableName: ExportableTable, label: string): Promise<void> => {
    if (!db || !user) {
      showToast('Database not ready. Please try again.', 'error');
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      setProgress(20);
      const csv = await exportAsCSV(db, user.id, tableName);
      setProgress(80);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const cacheDir = FileSystem.cacheDirectory;

      if (!cacheDir) {
        showToast('File system not available on this platform.', 'error');
        setIsExporting(false);
        return;
      }

      const fileName = `recovery-${tableName}-${timestamp}.csv`;
      const filePath = `${cacheDir}${fileName}`;
      await ExpoFileSystem.writeAsStringAsync(filePath, csv);
      setProgress(100);

      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: `Export ${label}`,
        });
      } else {
        showToast('Sharing is not available on this device.', 'error');
      }

      setIsExporting(false);
      showToast(`${label} exported successfully!`, 'success');
    } catch (error) {
      logger.error('Category export failed', { error, tableName });
      setIsExporting(false);
      showToast('Export failed. Please try again.', 'error');
    }
  };

  const handleDeleteAccount = (): void => {
    Alert.alert(
      'Delete My Account',
      'This will permanently delete ALL your data from this device and the cloud. This action cannot be undone.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ],
    );
  };

  const confirmDeleteAccount = (): void => {
    Alert.alert(
      'Final Confirmation',
      'This is your last chance. All journal entries, check-ins, step work, and recovery data will be permanently erased.',
      [
        { text: 'Keep My Data', style: 'cancel' },
        {
          text: 'Yes, Delete Everything',
          style: 'destructive',
          onPress: () => void performDeletion(),
        },
      ],
    );
  };

  const performDeletion = async (): Promise<void> => {
    if (!db || !user) {
      showToast('Database not ready. Please try again.', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteAllUserData(db, user.id);

      if (result.success) {
        showToast('Account deleted successfully.', 'success');
      } else {
        showToast('Account deleted with some errors. Cloud data may need manual cleanup.', 'info');
      }

      // Sign out after deletion
      await signOut();
    } catch (error) {
      logger.error('Account deletion failed', error);
      showToast('Deletion failed. Please try again or contact support.', 'error');
    } finally {
      setIsDeleting(false);
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

          {/* Export by Category */}
          <Animated.View entering={FadeInUp.delay(500)}>
            <Text style={styles.sectionTitle}>Export by Category</Text>
            <GlassCard intensity="light">
              {DATA_TYPES.filter((t) => t.table != null).map((type, index, filtered) => (
                <View key={type.id}>
                  <Pressable
                    style={styles.categoryRow}
                    onPress={() => handleExportCategory(type.table!, type.label)}
                    disabled={isExporting}
                    accessibilityLabel={`Export ${type.label} as CSV`}
                    accessibilityRole="button"
                    accessibilityHint={`Exports your ${type.label.toLowerCase()} as a CSV file`}
                  >
                    <View style={styles.dataTypeInfo}>
                      <Text style={styles.dataTypeLabel}>{type.label}</Text>
                      {dataCounts[type.id] != null && (
                        <Text style={styles.dataTypeCount}>{dataCounts[type.id]} items</Text>
                      )}
                    </View>
                    <MaterialIcons name="file-download" size={22} color={darkAccent.primary} />
                  </Pressable>
                  {index < filtered.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </GlassCard>
          </Animated.View>

          {/* Delete Account Section */}
          <Animated.View entering={FadeInUp.delay(600)}>
            <Text style={styles.sectionTitle}>Danger Zone</Text>
            <GlassCard intensity="light" style={styles.dangerCard}>
              <View style={styles.dangerContent}>
                <MaterialIcons name="warning" size={24} color={darkAccent.error} />
                <Text style={styles.dangerTitle}>Delete My Account</Text>
                <Text style={styles.dangerText}>
                  Permanently delete all your data from this device and the cloud. This action
                  cannot be undone. We recommend exporting your data first.
                </Text>
                <GradientButton
                  title={isDeleting ? 'Deleting...' : 'Delete My Account'}
                  variant="danger"
                  size="lg"
                  fullWidth
                  disabled={isDeleting}
                  icon={<MaterialIcons name="delete-forever" size={20} color="#FFFFFF" />}
                  onPress={handleDeleteAccount}
                  accessibilityLabel="Delete my account and all data permanently"
                  accessibilityRole="button"
                  accessibilityHint="Opens a confirmation dialog before deleting all your data"
                />
              </View>
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
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
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[1],
    },
    dangerCard: {
      borderWidth: 1,
      borderColor: darkAccent.error,
    },
    dangerContent: {
      alignItems: 'center',
      gap: spacing[2],
      padding: spacing[2],
    },
    dangerTitle: {
      ...typography.h4,
      color: darkAccent.error,
    },
    dangerText: {
      ...typography.bodySmall,
      color: darkAccent.textMuted,
      textAlign: 'center',
    },
  }) as const;
