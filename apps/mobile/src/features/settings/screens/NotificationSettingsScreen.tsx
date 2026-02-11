/**
 * Notification Settings Screen
 * 
 * Apple Settings-inspired notification preferences.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Platform, 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNotifications } from '../../../contexts/NotificationContext';
import { useNotificationPreferences } from '../../../hooks/useNotifications';
import {
  sendTestNotification,
  sendEncouragementNotification,
} from '../../../services/notificationService';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

// Toggle Row Component
function ToggleRow({ 
  label, 
  subtitle,
  value, 
  onValueChange,
  disabled,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleContent}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {subtitle && <Text style={styles.toggleSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={(val) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onValueChange(val);
        }}
        disabled={disabled}
        trackColor={{ false: ds.colors.bgQuaternary, true: ds.colors.success }}
        thumbColor={ds.semantic.text.onDark}
        accessibilityLabel={label}
        accessibilityHint={subtitle}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled: !!disabled }}
      />
    </View>
  );
}

// Time Picker Row
function TimePickerRow({
  label,
  enabled,
  hour,
  minute,
  onTimeChange,
  onToggle,
  disabled,
}: {
  label: string;
  enabled: boolean;
  hour: number;
  minute: number;
  onTimeChange: (h: number, m: number) => void;
  onToggle: (val: boolean) => void;
  disabled?: boolean;
}) {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const [showPicker, setShowPicker] = useState(false);

  const formatTime = (h: number, m: number): string => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
  };

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed') return;
    if (date) {
      onTimeChange(date.getHours(), date.getMinutes());
    }
  };

  const timeDate = new Date();
  timeDate.setHours(hour, minute, 0);

  return (
    <View style={styles.timeRow}>
      <View style={styles.timeHeader}>
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>{label}</Text>
          {enabled && (
            <Pressable
              onPress={() => setShowPicker(!showPicker)}
              accessibilityRole="button"
              accessibilityLabel={`Change ${label} time`}
              accessibilityHint={`Current time is ${formatTime(hour, minute)}`}
            >
              <Text style={styles.timeValue}>{formatTime(hour, minute)}</Text>
            </Pressable>
          )}
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{ false: ds.colors.bgQuaternary, true: ds.colors.success }}
          thumbColor={ds.semantic.text.onDark}
          accessibilityLabel={`${label} reminder`}
          accessibilityHint={enabled ? `Enabled at ${formatTime(hour, minute)}` : 'Disabled'}
          accessibilityRole="switch"
          accessibilityState={{ checked: enabled, disabled: !!disabled }}
        />
      </View>

      {enabled && showPicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={timeDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' && (
            <Pressable
              onPress={() => setShowPicker(false)}
              style={styles.doneBtn}
              accessibilityRole="button"
              accessibilityLabel="Done selecting time"
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export function NotificationSettingsScreen(): React.ReactElement {
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const { 
    permissionStatus, 
    requestPermissions, 
    notificationsEnabled, 
    setNotificationsEnabled 
  } = useNotifications();

  const {
    preferences,
    isLoading: prefsLoading,
    scheduledNotifications,
    updatePreference,
    toggleAll,
    refreshScheduled,
  } = useNotificationPreferences();

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    refreshScheduled();
  }, [refreshScheduled]);

  const handleToggleNotifications = useCallback(async (enabled: boolean) => {
    if (enabled && permissionStatus !== 'granted') {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Notifications Disabled', 'Enable notifications in device settings.');
        return;
      }
    }

    setNotificationsEnabled(enabled);
    setIsUpdating(true);

    try {
      await toggleAll(enabled);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setIsUpdating(false);
    }
  }, [permissionStatus, requestPermissions, setNotificationsEnabled, toggleAll]);

  const handleTimeChange = useCallback(
    async (
      key: 'morningCheckIn' | 'eveningCheckIn' | 'dailyReading' | 'gratitudeReminder',
      hour: number,
      minute: number,
    ) => {
      setIsUpdating(true);
      try {
        await updatePreference(key, { ...preferences[key], hour, minute });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {
        Alert.alert('Error', 'Failed to update reminder time.');
      } finally {
        setIsUpdating(false);
      }
    },
    [preferences, updatePreference],
  );

  const handleToggleReminder = useCallback(
    async (
      key: 'morningCheckIn' | 'eveningCheckIn' | 'dailyReading' | 'gratitudeReminder',
      enabled: boolean,
    ) => {
      setIsUpdating(true);
      try {
        await updatePreference(key, { ...preferences[key], enabled });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {
        Alert.alert('Error', 'Failed to update reminder.');
      } finally {
        setIsUpdating(false);
      }
    },
    [preferences, updatePreference],
  );

  const handleToggleSimple = useCallback(
    async (key: 'milestoneAlerts' | 'encouragement', enabled: boolean) => {
      setIsUpdating(true);
      try {
        await updatePreference(key, { enabled });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {
        Alert.alert('Error', 'Failed to update setting.');
      } finally {
        setIsUpdating(false);
      }
    },
    [updatePreference],
  );

  const handleSendTest = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert('Notifications Disabled', 'Enable notifications first.');
      return;
    }

    try {
      await sendTestNotification(
        'Test Notification',
        'This is how your reminders will look!'
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  const handleSendEncouragement = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert('Notifications Disabled', 'Enable notifications first.');
      return;
    }

    try {
      await sendEncouragementNotification();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Alert.alert('Error', 'Failed to send encouragement.');
    }
  };

  const permissionGranted = permissionStatus === 'granted';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to previous screen"
          >
            <Feather name="chevron-left" size={26} color={ds.colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Permission Warning */}
          {permissionStatus === 'denied' && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.warningCard}>
              <Feather name="alert-circle" size={20} color={ds.colors.warning} />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Notifications Disabled</Text>
                <Text style={styles.warningText}>
                  Enable in device settings to receive reminders.
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Master Toggle */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.card}>
            <ToggleRow
              label="Enable Notifications"
              subtitle="Daily reminders, milestones, and encouragement"
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              disabled={isUpdating || prefsLoading}
            />
          </Animated.View>

          {/* Reminders Section */}
          {notificationsEnabled && permissionGranted && (
            <>
              <Text style={styles.sectionHeader}>Daily Reminders</Text>
              
              <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.card}>
                <TimePickerRow
                  label="Morning check-in"
                  enabled={preferences.morningCheckIn.enabled}
                  hour={preferences.morningCheckIn.hour}
                  minute={preferences.morningCheckIn.minute}
                  onTimeChange={(h, m) => handleTimeChange('morningCheckIn', h, m)}
                  onToggle={(val) => handleToggleReminder('morningCheckIn', val)}
                  disabled={isUpdating}
                />
                
                <View style={styles.divider} />
                
                <TimePickerRow
                  label="Evening reflection"
                  enabled={preferences.eveningCheckIn.enabled}
                  hour={preferences.eveningCheckIn.hour}
                  minute={preferences.eveningCheckIn.minute}
                  onTimeChange={(h, m) => handleTimeChange('eveningCheckIn', h, m)}
                  onToggle={(val) => handleToggleReminder('eveningCheckIn', val)}
                  disabled={isUpdating}
                />

                <View style={styles.divider} />

                <TimePickerRow
                  label="Daily reading"
                  enabled={preferences.dailyReading.enabled}
                  hour={preferences.dailyReading.hour}
                  minute={preferences.dailyReading.minute}
                  onTimeChange={(h, m) => handleTimeChange('dailyReading', h, m)}
                  onToggle={(val) => handleToggleReminder('dailyReading', val)}
                  disabled={isUpdating}
                />

                <View style={styles.divider} />

                <TimePickerRow
                  label="Gratitude reminder"
                  enabled={preferences.gratitudeReminder.enabled}
                  hour={preferences.gratitudeReminder.hour}
                  minute={preferences.gratitudeReminder.minute}
                  onTimeChange={(h, m) => handleTimeChange('gratitudeReminder', h, m)}
                  onToggle={(val) => handleToggleReminder('gratitudeReminder', val)}
                  disabled={isUpdating}
                />
              </Animated.View>

              {/* Celebrations & Encouragement Section */}
              <Text style={styles.sectionHeader}>Celebrations & Encouragement</Text>

              <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.card}>
                <ToggleRow
                  label="Milestone celebrations"
                  subtitle="Celebrate sobriety milestones (1, 7, 30, 90, 365 days)"
                  value={preferences.milestoneAlerts.enabled}
                  onValueChange={(val) => handleToggleSimple('milestoneAlerts', val)}
                  disabled={isUpdating}
                />

                <View style={styles.divider} />

                <ToggleRow
                  label="Encouragement messages"
                  subtitle="Uplifting recovery-focused reminders"
                  value={preferences.encouragement.enabled}
                  onValueChange={(val) => handleToggleSimple('encouragement', val)}
                  disabled={isUpdating}
                />
              </Animated.View>

              {/* Actions Section */}
              <Text style={styles.sectionHeader}>Actions</Text>

              <Animated.View entering={FadeInDown.delay(200).duration(300)}>
                <Pressable
                  onPress={handleSendEncouragement}
                  style={styles.applyBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Send encouragement notification"
                  accessibilityHint="Sends an encouraging message right now"
                >
                  <Text style={styles.applyBtnText}>💜 Send Encouragement Now</Text>
                </Pressable>
              </Animated.View>

              {/* Test Button */}
              <Animated.View entering={FadeInDown.delay(250).duration(300)}>
                <Pressable
                  onPress={handleSendTest}
                  style={styles.testBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Send test notification"
                  accessibilityHint="Sends a sample notification to preview how reminders will look"
                >
                  <Text style={styles.testBtnText}>Send Test Notification</Text>
                </Pressable>
              </Animated.View>

              {/* Info Card */}
              <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.infoCard}>
                <Text style={styles.infoTitle}>{scheduledNotifications.length} notifications scheduled</Text>
                <Text style={styles.infoText}>
                  Includes daily reminders and milestone celebrations.
                </Text>
              </Animated.View>
            </>
          )}

          {/* Request Permission */}
          {permissionStatus === 'undetermined' && (
            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.card}>
              <Text style={styles.permissionTitle}>Allow Notifications</Text>
              <Text style={styles.permissionText}>
                We'll send reminders for daily check-ins, celebrate your milestones, and share
                words of encouragement.
              </Text>
              <Pressable
                onPress={requestPermissions}
                style={styles.permissionBtn}
                accessibilityRole="button"
                accessibilityLabel="Grant notification permission"
                accessibilityHint="Opens system settings to allow notifications"
              >
                <Text style={styles.permissionBtnText}>Grant Permission</Text>
              </Pressable>
            </Animated.View>
          )}

          <View style={{ height: ds.space[12] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (ds: DS) => ({
  container: {
    flex: 1,
    backgroundColor: ds.colors.bgPrimary,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: ds.sizes.contentPadding,
    paddingTop: ds.space[4],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ds.colors.borderSubtle,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...ds.typography.body,
    fontWeight: '600',
    color: ds.colors.textPrimary,
  },
  headerSpacer: {
    width: 44,
  },

  // Warning Card
  warningCard: {
    flexDirection: 'row',
    backgroundColor: ds.colors.warningMuted,
    borderRadius: ds.radius.lg,
    padding: ds.space[4],
    marginBottom: ds.space[4],
  },
  warningContent: {
    flex: 1,
    marginLeft: ds.space[3],
  },
  warningTitle: {
    ...ds.typography.body,
    fontWeight: '600',
    color: ds.colors.warning,
  },
  warningText: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    marginTop: 2,
  },

  // Card
  card: {
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: ds.radius.lg,
    marginBottom: ds.space[4],
  },

  // Toggle Row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ds.space[4],
  },
  toggleContent: {
    flex: 1,
    marginRight: ds.space[4],
  },
  toggleLabel: {
    ...ds.typography.body,
    color: ds.colors.textPrimary,
  },
  toggleSubtitle: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    marginTop: 2,
  },

  // Time Row
  timeRow: {
    padding: ds.space[4],
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInfo: {
    flex: 1,
  },
  timeLabel: {
    ...ds.typography.body,
    color: ds.colors.textPrimary,
  },
  timeValue: {
    ...ds.typography.caption,
    color: ds.colors.accent,
    marginTop: 4,
  },
  pickerContainer: {
    marginTop: ds.space[4],
    alignItems: 'center',
  },
  doneBtn: {
    backgroundColor: ds.colors.accent,
    paddingHorizontal: ds.space[6],
    paddingVertical: ds.space[3],
    borderRadius: ds.radius.md,
    marginTop: ds.space[3],
  },
  doneBtnText: {
    ...ds.typography.body,
    fontWeight: '600',
    color: ds.semantic.surface.app,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ds.colors.divider,
    marginHorizontal: ds.space[4],
  },

  // Section Header
  sectionHeader: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: ds.space[4],
    marginBottom: ds.space[2],
    marginLeft: ds.space[1],
  },

  // Buttons
  applyBtn: {
    backgroundColor: ds.colors.accent,
    borderRadius: ds.radius.lg,
    paddingVertical: ds.space[4],
    alignItems: 'center',
    marginBottom: ds.space[3],
  },
  applyBtnText: {
    ...ds.typography.body,
    fontWeight: '600',
    color: ds.semantic.surface.app,
  },
  testBtn: {
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: ds.radius.lg,
    paddingVertical: ds.space[4],
    alignItems: 'center',
    marginBottom: ds.space[6],
  },
  testBtnText: {
    ...ds.typography.body,
    fontWeight: '500',
    color: ds.colors.textSecondary,
  },

  // Info Card
  infoCard: {
    backgroundColor: ds.colors.accentSubtle,
    borderRadius: ds.radius.lg,
    padding: ds.space[4],
  },
  infoTitle: {
    ...ds.typography.body,
    fontWeight: '600',
    color: ds.colors.textPrimary,
  },
  infoText: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    marginTop: ds.space[1],
  },

  // Permission
  permissionTitle: {
    ...ds.typography.h3,
    color: ds.colors.textPrimary,
    padding: ds.space[4],
    paddingBottom: ds.space[2],
  },
  permissionText: {
    ...ds.typography.body,
    color: ds.colors.textTertiary,
    paddingHorizontal: ds.space[4],
    paddingBottom: ds.space[4],
  },
  permissionBtn: {
    backgroundColor: ds.colors.accent,
    margin: ds.space[4],
    marginTop: 0,
    paddingVertical: ds.space[4],
    borderRadius: ds.radius.lg,
    alignItems: 'center',
  },
  permissionBtnText: {
    ...ds.typography.body,
    fontWeight: '600',
    color: ds.semantic.surface.app,
  },
} as const);
