import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { GradientButton } from '../../../design-system/components/GradientButton';
import { AnimatedCheckbox } from '../../../design-system/components/MicroInteractions';
import { darkAccent, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { useToast } from '../../../design-system/components/ToastProvider';
import { ds } from '../../../design-system/tokens/ds';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const EXPORT_FORMATS = [
  { id: 'json', label: 'JSON', description: 'Machine readable format', icon: 'code' },
  { id: 'pdf', label: 'PDF', description: 'Human readable document', icon: 'picture-as-pdf' },
  { id: 'csv', label: 'CSV', description: 'Spreadsheet format', icon: 'table-chart' },
];

const DATA_TYPES = [
  { id: 'journal', label: 'Journal Entries', count: 24 },
  { id: 'checkins', label: 'Daily Check-ins', count: 156 },
  { id: 'meetings', label: 'Meeting History', count: 42 },
  { id: 'steps', label: 'Step Work', count: 8 },
  { id: 'profile', label: 'Profile Data', count: null },
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
  const { showToast } = useToast();

  const toggleDataType = (id: string) => {
    setSelectedTypes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleExport = async () => {
    if (selectedTypes.length === 0) {
      showToast('Please select at least one data type', 'error');
      return;
    }

    setIsExporting(true);
    setProgress(0);

    // Simulate export progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setProgress(i);
    }

    setIsExporting(false);
    showToast('Export completed! Check your downloads.', 'success', {
      action: {
        label: 'Share',
        onPress: () => {
          // Share functionality
        },
      },
    });
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
                      {type.count !== null && (
                        <Text style={styles.dataTypeCount}>{type.count} items</Text>
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
              <GlassCard intensity="medium" style={styles.progressCard}>
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
                icon={<MaterialIcons name="download" size={20} color={ds.semantic.text.onDark} />}
                onPress={handleExport}
              />
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

import { Pressable } from 'react-native';

const styles = StyleSheet.create({
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
});
