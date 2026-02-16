/**
 * Widget Settings Screen
 *
 * Apple Settings-inspired screen that shows:
 * - Instructions for adding the home-screen widget
 * - Toggle for which data sections appear on the widget
 * - Live preview mockup of the widget appearance
 * - Last-synced timestamp
 *
 * @module features/settings/screens/WidgetSettingsScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Toggle } from '../../../design-system/components/Toggle';
import { Text } from '../../../design-system/components/Text';
import { MotionTransitions } from '../../../design-system/tokens/motion';
import { useMotionPress } from '../../../design-system/hooks/useMotionPress';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { useWidgetSync } from '../../../hooks/useWidgetSync';
import { readWidgetData, type WidgetBridgePayload } from '../../../services/widgetBridge';
import { logger } from '../../../utils/logger';

// ---------------------------------------------------------------------------
// Widget preference keys stored in-memory (no encryption needed —
// these are UI toggles, not sensitive data).
// ---------------------------------------------------------------------------

interface WidgetPreferences {
  showCleanTime: boolean;
  showDailyQuote: boolean;
  showTodayStatus: boolean;
  showStreaks: boolean;
}

const DEFAULT_PREFS: WidgetPreferences = {
  showCleanTime: true,
  showDailyQuote: true,
  showTodayStatus: true,
  showStreaks: true,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WidgetSettingsScreen(): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const { lastSyncTime, isSyncing, syncWidget } = useWidgetSync();

  const [prefs, setPrefs] = useState<WidgetPreferences>(DEFAULT_PREFS);
  const [previewData, setPreviewData] = useState<WidgetBridgePayload | null>(null);
  const { onPressIn, onPressOut, animatedStyle } = useMotionPress();

  // Load latest preview data
  useEffect(() => {
    readWidgetData()
      .then(setPreviewData)
      .catch(() => {
        logger.warn('Could not load widget preview data');
      });
  }, [lastSyncTime]);

  const togglePref = useCallback((key: keyof WidgetPreferences) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleManualSync = useCallback(async (): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await syncWidget();
    } catch {
      // Widget sync is best-effort
    }
  }, [syncWidget]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={MotionTransitions.screenEnter()} style={styles.header}>
            <Text
              style={styles.title}
              accessibilityRole="header"
              accessibilityLabel="Home Screen Widget settings"
            >
              Home Screen Widget
            </Text>
            <Text style={styles.subtitle}>See your recovery progress at a glance</Text>
          </Animated.View>

          {/* Setup Instructions */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text style={styles.sectionHeader} accessibilityRole="header">How to Add</Text>
            <View style={styles.cardGroup}>
              <InstructionStep
                number={1}
                text={
                  Platform.OS === 'ios'
                    ? 'Long-press your Home Screen until apps jiggle'
                    : 'Long-press an empty area of your Home Screen'
                }
                styles={styles}
                ds={ds}
              />
              <View style={styles.divider} />
              <InstructionStep
                number={2}
                text={
                  Platform.OS === 'ios'
                    ? 'Tap the "+" button in the top-left corner'
                    : 'Tap "Widgets" from the menu'
                }
                styles={styles}
                ds={ds}
              />
              <View style={styles.divider} />
              <InstructionStep
                number={3}
                text='Search for "Steps to Recovery"'
                styles={styles}
                ds={ds}
              />
              <View style={styles.divider} />
              <InstructionStep
                number={4}
                text="Choose a widget size and tap Add Widget"
                styles={styles}
                ds={ds}
                isLast
              />
            </View>
          </Animated.View>

          {/* Widget Preview */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={styles.sectionHeader} accessibilityRole="header">Preview</Text>
            <View style={styles.previewContainer}>
              <WidgetPreview data={previewData} prefs={prefs} styles={styles} ds={ds} />
            </View>
          </Animated.View>

          {/* Display Options */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Text style={styles.sectionHeader} accessibilityRole="header">Display Options</Text>
            <View style={styles.cardGroup}>
              <ToggleRow
                icon="clock"
                label="Clean Time"
                subtitle="Days, hours, and minutes"
                value={prefs.showCleanTime}
                onValueChange={() => togglePref('showCleanTime')}
                styles={styles}
                ds={ds}
              />
              <View style={styles.divider} />
              <ToggleRow
                icon="message-square"
                label="Daily Quote"
                subtitle="Motivational recovery quote"
                value={prefs.showDailyQuote}
                onValueChange={() => togglePref('showDailyQuote')}
                styles={styles}
                ds={ds}
              />
              <View style={styles.divider} />
              <ToggleRow
                icon="check-circle"
                label="Today's Progress"
                subtitle="Check-ins, journal, meetings"
                value={prefs.showTodayStatus}
                onValueChange={() => togglePref('showTodayStatus')}
                styles={styles}
                ds={ds}
              />
              <View style={styles.divider} />
              <ToggleRow
                icon="trending-up"
                label="Streaks"
                subtitle="Consecutive-day streaks"
                value={prefs.showStreaks}
                onValueChange={() => togglePref('showStreaks')}
                styles={styles}
                ds={ds}
                isLast
              />
            </View>
          </Animated.View>

          {/* Sync Status */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Text style={styles.sectionHeader} accessibilityRole="header">Sync</Text>
            <View style={styles.cardGroup}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.settingIcon,
                      { backgroundColor: ds.semantic.intent.primary.muted },
                    ]}
                  >
                    <Feather name="refresh-cw" size={18} color={ds.semantic.intent.primary.solid} />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Last synced</Text>
                    <Text style={styles.settingSubtitle}>
                      {lastSyncTime
                        ? new Date(lastSyncTime).toLocaleTimeString()
                        : 'Not yet synced'}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={handleManualSync}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                  disabled={isSyncing}
                  accessibilityRole="button"
                  accessibilityLabel="Sync widget data now"
                  accessibilityState={{ disabled: isSyncing }}
                  style={[styles.syncButton, animatedStyle]}
                >
                  <Text style={[styles.syncButtonText, isSyncing && styles.disabledText]}>
                    {isSyncing ? 'Syncing…' : 'Sync Now'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* Info Banner */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.infoBanner}>
            <Feather name="info" size={16} color={ds.semantic.text.tertiary} importantForAccessibility="no" accessibilityElementsHidden />
            <Text style={styles.infoText}>
              Widget data updates automatically every 5 minutes. Only aggregated counts are shown —
              no sensitive content leaves the app.
            </Text>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InstructionStepProps {
  number: number;
  text: string;
  styles: ReturnType<typeof createStyles>;
  ds: DS;
  isLast?: boolean;
}

function InstructionStep({
  number,
  text,
  styles: s,
  ds,
  isLast: _isLast,
}: InstructionStepProps): React.ReactElement {
  return (
    <View style={s.settingItem} accessibilityLabel={`Step ${number}: ${text}`}>
      <View style={s.settingInfo}>
        <View style={[s.stepBadge, { backgroundColor: ds.semantic.intent.primary.muted }]}>
          <Text style={[s.stepBadgeText, { color: ds.semantic.intent.primary.solid }]}>
            {number}
          </Text>
        </View>
        <View style={s.settingText}>
          <Text style={s.settingTitle}>{text}</Text>
        </View>
      </View>
    </View>
  );
}

interface ToggleRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  subtitle: string;
  value: boolean;
  onValueChange: () => void;
  styles: ReturnType<typeof createStyles>;
  ds: DS;
  isLast?: boolean;
}

function ToggleRow({
  icon,
  label,
  subtitle,
  value,
  onValueChange,
  styles: s,
  ds,
}: ToggleRowProps): React.ReactElement {
  return (
    <View style={s.settingItem}>
      <View style={s.settingInfo}>
        <View style={[s.settingIcon, { backgroundColor: ds.semantic.intent.primary.muted }]}>
          <Feather name={icon} size={18} color={ds.semantic.intent.primary.solid} />
        </View>
        <View style={s.settingText}>
          <Text style={s.settingTitle}>{label}</Text>
          <Text style={s.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Toggle value={value} onValueChange={onValueChange} accessibilityLabel={`Toggle ${label}`} />
    </View>
  );
}

interface WidgetPreviewProps {
  data: WidgetBridgePayload | null;
  prefs: WidgetPreferences;
  styles: ReturnType<typeof createStyles>;
  ds: DS;
}

function WidgetPreview({ data, prefs, styles: s, ds }: WidgetPreviewProps): React.ReactElement {
  const days = data?.cleanDays ?? 0;
  const hours = data?.cleanHours ?? 0;
  const minutes = data?.cleanMinutes ?? 0;

  return (
    <View
      style={s.widgetPreview}
      accessibilityRole="summary"
      accessibilityLabel={`Widget preview showing ${days} days clean`}
    >
      {prefs.showCleanTime && (
        <View style={s.previewCleanTime}>
          <Text style={[s.previewDays, { color: ds.semantic.intent.primary.solid }]}>{days}</Text>
          <Text style={[s.previewDaysLabel, { color: ds.semantic.text.secondary }]}>
            {days === 1 ? 'day' : 'days'} clean
          </Text>
          <Text style={[s.previewHoursLabel, { color: ds.semantic.text.tertiary }]}>
            {hours}h {minutes}m
          </Text>
        </View>
      )}

      {prefs.showDailyQuote && data?.quoteText && (
        <View style={s.previewQuote}>
          <Text
            style={[s.previewQuoteText, { color: ds.semantic.text.secondary }]}
            numberOfLines={2}
          >
            &ldquo;{data.quoteText}&rdquo;
          </Text>
          <Text style={[s.previewQuoteSource, { color: ds.semantic.text.tertiary }]}>
            — {data.quoteSource}
          </Text>
        </View>
      )}

      {prefs.showTodayStatus && (
        <View style={s.previewStatus}>
          <StatusDot label="Morning" done={data?.morningCheckIn ?? false} ds={ds} styles={s} />
          <StatusDot label="Evening" done={data?.eveningCheckIn ?? false} ds={ds} styles={s} />
          <StatusDot label="Journal" done={data?.journalWritten ?? false} ds={ds} styles={s} />
          <StatusDot label="Meeting" done={data?.meetingAttended ?? false} ds={ds} styles={s} />
        </View>
      )}

      {prefs.showStreaks && (
        <View style={s.previewStreaks}>
          <Text style={[s.previewStreakLabel, { color: ds.semantic.text.tertiary }]}>
            🔥 {data?.checkInStreak ?? 0} day check-in streak
          </Text>
        </View>
      )}

      {!prefs.showCleanTime &&
        !prefs.showDailyQuote &&
        !prefs.showTodayStatus &&
        !prefs.showStreaks && (
          <Text style={[s.previewEmpty, { color: ds.semantic.text.tertiary }]}>
            Enable at least one section above
          </Text>
        )}
    </View>
  );
}

interface StatusDotProps {
  label: string;
  done: boolean;
  ds: DS;
  styles: ReturnType<typeof createStyles>;
}

function StatusDot({ label, done, ds, styles: s }: StatusDotProps): React.ReactElement {
  return (
    <View style={s.statusDot} accessibilityLabel={`${label}: ${done ? 'completed' : 'not done'}`}>
      <Feather
        name={done ? 'check-circle' : 'circle'}
        size={14}
        color={done ? ds.semantic.intent.primary.solid : ds.semantic.text.muted}
      />
      <Text
        style={[
          s.statusDotLabel,
          { color: done ? ds.semantic.text.secondary : ds.semantic.text.muted },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const createStyles = (ds: DS) => ({
  container: {
    flex: 1,
    backgroundColor: ds.semantic.surface.app,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: ds.semantic.layout.screenPadding,
  },

  // Header
  header: {
    paddingTop: ds.space[6],
    paddingBottom: ds.space[4],
  },
  title: {
    fontSize: 34,
    fontWeight: '700' as const,
    color: ds.semantic.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...ds.typography.caption,
    color: ds.semantic.text.tertiary,
    marginTop: ds.space[1],
  },

  // Section Header
  sectionHeader: {
    ...ds.semantic.typography.sectionLabel,
    color: ds.semantic.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginTop: ds.space[6],
    marginBottom: ds.space[2],
    marginLeft: ds.space[1],
  },

  // Card Group
  cardGroup: {
    backgroundColor: ds.semantic.surface.card,
    borderRadius: ds.radius.lg,
    overflow: 'hidden' as const,
  },

  // Setting Item
  settingItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: ds.space[4],
    paddingHorizontal: ds.space[4],
    minHeight: 64,
  },
  settingInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    marginRight: ds.space[3],
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: ds.radius.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  settingText: {
    flex: 1,
    marginLeft: ds.space[3],
  },
  settingTitle: {
    ...ds.typography.body,
    color: ds.semantic.text.primary,
  },
  settingSubtitle: {
    ...ds.typography.caption,
    color: ds.semantic.text.tertiary,
    marginTop: 1,
  },
  disabledText: {
    opacity: 0.4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ds.colors.divider,
    marginLeft: 36 + ds.space[4] + ds.space[3],
  },

  // Step Badge
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  stepBadgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },

  // Sync button
  syncButton: {
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[2],
    borderRadius: ds.radius.md,
    backgroundColor: ds.semantic.intent.primary.muted,
  },
  syncButtonPressed: {
    opacity: 0.7,
  },
  syncButtonText: {
    ...ds.typography.caption,
    fontWeight: '600' as const,
    color: ds.semantic.intent.primary.solid,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[3],
    marginTop: ds.space[6],
    gap: ds.space[2],
  },
  infoText: {
    ...ds.typography.caption,
    color: ds.semantic.text.tertiary,
    flex: 1,
    lineHeight: 18,
  },

  // Preview
  previewContainer: {
    borderRadius: ds.radius.lg,
    overflow: 'hidden' as const,
  },
  widgetPreview: {
    backgroundColor: ds.semantic.surface.card,
    borderRadius: ds.radius.lg,
    padding: ds.space[5],
    gap: ds.space[4],
  },
  previewCleanTime: {
    alignItems: 'center' as const,
  },
  previewDays: {
    fontSize: 48,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  previewDaysLabel: {
    ...ds.typography.body,
    fontWeight: '500' as const,
    marginTop: -4,
  },
  previewHoursLabel: {
    ...ds.typography.caption,
    marginTop: 2,
  },
  previewQuote: {
    paddingHorizontal: ds.space[2],
  },
  previewQuoteText: {
    ...ds.typography.caption,
    fontStyle: 'italic' as const,
    lineHeight: 18,
  },
  previewQuoteSource: {
    ...ds.typography.caption,
    fontSize: 11,
    marginTop: 2,
  },
  previewStatus: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  previewStreaks: {
    alignItems: 'center' as const,
  },
  previewStreakLabel: {
    ...ds.typography.caption,
  },
  previewEmpty: {
    ...ds.typography.caption,
    textAlign: 'center' as const,
    paddingVertical: ds.space[4],
  },

  // Status dot
  statusDot: {
    alignItems: 'center' as const,
    gap: 4,
  },
  statusDotLabel: {
    fontSize: 11,
  },
});
