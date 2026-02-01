/**
 * NotificationSettingsScreen - Manage Notification Preferences
 *
 * Allows users to:
 * - Enable/disable notifications
 * - Customize reminder times
 * - Send test notifications
 * - View scheduled notifications
 */

import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNotifications } from '../../../contexts/NotificationContext';
import {
  cancelDailyReminders,
  DEFAULT_REMINDERS,
  getScheduledNotifications,
  scheduleDailyReminders,
  sendTestNotification,
  type DailyReminderConfig,
} from '../../../services/notificationService';
import { logger } from '../../../utils/logger';
import {
  Button,
  Card,
  Text,
  Toast,
  type ToastVariant,
  Toggle,
  useTheme,
} from '../../../design-system';

export function NotificationSettingsScreen(): React.ReactElement {
  const theme = useTheme();
  const { permissionStatus, requestPermissions, notificationsEnabled, setNotificationsEnabled } =
    useNotifications();

  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVariant, setToastVariant] = useState<ToastVariant>('info');

  const showToast = (message: string, variant: ToastVariant): void => {
    setToastMessage(message);
    setToastVariant(variant);
    setToastVisible(true);
  };

  const [morningEnabled, setMorningEnabled] = useState<boolean>(true);
  const [morningHour, setMorningHour] = useState<number>(DEFAULT_REMINDERS.morning.hour);
  const [morningMinute, setMorningMinute] = useState<number>(DEFAULT_REMINDERS.morning.minute);

  const [eveningEnabled, setEveningEnabled] = useState<boolean>(true);
  const [eveningHour, setEveningHour] = useState<number>(DEFAULT_REMINDERS.evening.hour);
  const [eveningMinute, setEveningMinute] = useState<number>(DEFAULT_REMINDERS.evening.minute);

  const [scheduledCount, setScheduledCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);

  const [showMorningTimePicker, setShowMorningTimePicker] = useState(false);
  const [showEveningTimePicker, setShowEveningTimePicker] = useState(false);

  /**
   * Load current notification count
   */
  useEffect(() => {
    loadScheduledNotifications();
  }, []);

  /**
   * Get scheduled notification count
   */
  const loadScheduledNotifications = async (): Promise<void> => {
    try {
      const scheduled = await getScheduledNotifications();
      setScheduledCount(scheduled.length);
    } catch (error) {
      logger.error('Failed to load scheduled notifications', error);
      setScheduledCount(0);
    }
  };

  /**
   * Toggle master notification switch
   */
  const handleToggleNotifications = async (enabled: boolean): Promise<void> => {
    if (isTogglingNotifications) return; // Prevent rapid toggling

    setIsTogglingNotifications(true);

    try {
      if (enabled && permissionStatus !== 'granted') {
        // Need to request permissions first
        const granted = await requestPermissions();
        if (!granted) {
          showToast('Enable notifications in device settings to receive reminders.', 'warning');
          return;
        }
      }

      setNotificationsEnabled(enabled);

      if (enabled) {
        // Re-schedule daily reminders
        await applyReminderSettings(true);
      } else {
        // Cancel all reminders
        await cancelDailyReminders();
        await loadScheduledNotifications();
      }
    } finally {
      setIsTogglingNotifications(false);
    }
  };

  /**
   * Apply current reminder settings
   */
  const applyReminderSettings = async (enabledOverride?: boolean): Promise<void> => {
    const shouldApply = enabledOverride ?? notificationsEnabled;
    if (!shouldApply) return;

    setIsUpdating(true);
    try {
      const morning: DailyReminderConfig = {
        enabled: morningEnabled,
        hour: morningHour,
        minute: morningMinute,
      };

      const evening: DailyReminderConfig = {
        enabled: eveningEnabled,
        hour: eveningHour,
        minute: eveningMinute,
      };

      await scheduleDailyReminders(morning, evening);
      await loadScheduledNotifications();

      showToast('Notification reminders updated.', 'success');
    } catch (error) {
      logger.error('Error updating reminders', error);
      showToast('Failed to update reminders. Please try again.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Send test notification
   */
  const handleSendTest = async (): Promise<void> => {
    if (permissionStatus !== 'granted') {
      showToast('Enable notifications to send a test notification.', 'warning');
      return;
    }

    try {
      await sendTestNotification(
        '🔔 Test Notification',
        'This is how your check-in reminders will look!',
      );
      showToast('Test notification sent.', 'success');
    } catch (error) {
      logger.error('Error sending test notification', error);
      showToast('Failed to send test notification.', 'error');
    }
  };

  /**
   * Format time for display
   */
  const formatTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = String(minute).padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  /**
   * Create a Date object from hour and minute for DateTimePicker
   */
  const createTimeDate = (hour: number, minute: number): Date => {
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    date.setSeconds(0);
    return date;
  };

  /**
   * Handle morning time change
   */
  const handleMorningTimeChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowMorningTimePicker(false);
    }

    if (event.type === 'dismissed') return;

    if (selectedDate) {
      setMorningHour(selectedDate.getHours());
      setMorningMinute(selectedDate.getMinutes());
    }
  };

  /**
   * Handle evening time change
   */
  const handleEveningTimeChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowEveningTimePicker(false);
    }

    if (event.type === 'dismissed') return;

    if (selectedDate) {
      setEveningHour(selectedDate.getHours());
      setEveningMinute(selectedDate.getMinutes());
    }
  };

  const permissionGranted = permissionStatus === 'granted';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <Toast
        visible={toastVisible}
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setToastVisible(false)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: theme.spacing.md,
            paddingBottom: theme.spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        accessibilityRole="scrollbar"
        accessibilityLabel="Notification settings"
      >
        <Text
          variant="title2"
          style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.md }}
        >
          Notifications
        </Text>

        {permissionStatus === 'denied' && (
          <Card
            variant="outlined"
            style={{
              borderColor: theme.colors.warning,
              backgroundColor: `${theme.colors.warning}15`,
              marginBottom: theme.spacing.md,
            }}
            accessibilityRole="alert"
            accessibilityLabel="Notifications disabled in device settings"
          >
            <Text variant="body" color="text">
              Notifications are disabled in your device settings.
            </Text>
            <Text variant="bodySmall" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
              Enable them to receive check-in reminders and milestone celebrations.
            </Text>
          </Card>
        )}

        <Card variant="elevated" style={{ marginBottom: theme.spacing.md }}>
          <Toggle
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            label="Enable notifications"
            disabled={isUpdating || isTogglingNotifications}
            style={{ marginBottom: theme.spacing.xs }}
          />
          <Text variant="bodySmall" color="textSecondary">
            Receive daily reminders for check-ins and milestone celebrations.
          </Text>
        </Card>

        {notificationsEnabled && permissionGranted && (
          <>
            <Text
              variant="h3"
              style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm }}
              accessibilityRole="header"
            >
              Daily reminders
            </Text>

            <Card variant="elevated" style={{ marginBottom: theme.spacing.md }}>
              <View style={styles.row}>
                <View style={styles.grow}>
                  <Text variant="labelLarge">Morning check-in</Text>
                  <Text variant="caption" color="primary" style={{ marginTop: theme.spacing.xs }}>
                    {formatTime(morningHour, morningMinute)}
                  </Text>
                </View>
                <Toggle
                  value={morningEnabled}
                  onValueChange={setMorningEnabled}
                  disabled={isUpdating}
                  accessibilityLabel="Morning check-in reminder"
                  accessibilityHint="Toggles the morning reminder on or off"
                  style={{ width: 56 }}
                />
              </View>

              {morningEnabled && (
                <View style={{ marginTop: theme.spacing.md }}>
                  <Button
                    title={showMorningTimePicker ? 'Close time picker' : 'Change time'}
                    variant="outline"
                    size="small"
                    onPress={() => setShowMorningTimePicker(!showMorningTimePicker)}
                    accessibilityLabel="Change morning reminder time"
                    accessibilityHint="Opens time picker to customize morning check-in reminder"
                  />

                  {showMorningTimePicker && (
                    <View style={{ marginTop: theme.spacing.sm }}>
                      <DateTimePicker
                        value={createTimeDate(morningHour, morningMinute)}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleMorningTimeChange}
                        testID="morning-time-picker"
                      />
                    </View>
                  )}

                  {Platform.OS === 'ios' && showMorningTimePicker && (
                    <View style={{ marginTop: theme.spacing.sm }}>
                      <Button
                        title="Done"
                        variant="primary"
                        size="small"
                        onPress={() => setShowMorningTimePicker(false)}
                        accessibilityLabel="Done selecting morning time"
                      />
                    </View>
                  )}
                </View>
              )}
            </Card>

            <Card variant="elevated" style={{ marginBottom: theme.spacing.md }}>
              <View style={styles.row}>
                <View style={styles.grow}>
                  <Text variant="labelLarge">Evening check-in</Text>
                  <Text variant="caption" color="primary" style={{ marginTop: theme.spacing.xs }}>
                    {formatTime(eveningHour, eveningMinute)}
                  </Text>
                </View>
                <Toggle
                  value={eveningEnabled}
                  onValueChange={setEveningEnabled}
                  disabled={isUpdating}
                  accessibilityLabel="Evening check-in reminder"
                  accessibilityHint="Toggles the evening reminder on or off"
                  style={{ width: 56 }}
                />
              </View>

              {eveningEnabled && (
                <View style={{ marginTop: theme.spacing.md }}>
                  <Button
                    title={showEveningTimePicker ? 'Close time picker' : 'Change time'}
                    variant="outline"
                    size="small"
                    onPress={() => setShowEveningTimePicker(!showEveningTimePicker)}
                    accessibilityLabel="Change evening reminder time"
                    accessibilityHint="Opens time picker to customize evening check-in reminder"
                  />

                  {showEveningTimePicker && (
                    <View style={{ marginTop: theme.spacing.sm }}>
                      <DateTimePicker
                        value={createTimeDate(eveningHour, eveningMinute)}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleEveningTimeChange}
                        testID="evening-time-picker"
                      />
                    </View>
                  )}

                  {Platform.OS === 'ios' && showEveningTimePicker && (
                    <View style={{ marginTop: theme.spacing.sm }}>
                      <Button
                        title="Done"
                        variant="primary"
                        size="small"
                        onPress={() => setShowEveningTimePicker(false)}
                        accessibilityLabel="Done selecting evening time"
                      />
                    </View>
                  )}
                </View>
              )}
            </Card>

            <Button
              title={isUpdating ? 'Updating...' : 'Apply settings'}
              onPress={() => applyReminderSettings()}
              variant="primary"
              size="large"
              disabled={isUpdating}
              loading={isUpdating}
              accessibilityLabel="Apply notification settings"
            />

            <View style={{ height: theme.spacing.md }} />

            <Button
              title="Send test notification"
              onPress={handleSendTest}
              variant="secondary"
              size="large"
              disabled={!permissionGranted || isUpdating}
              accessibilityLabel="Send a test notification"
            />

            <Card
              variant="outlined"
              style={{
                marginTop: theme.spacing.lg,
                backgroundColor: `${theme.colors.primary}10`,
                borderColor: theme.colors.border,
              }}
            >
              <Text variant="labelLarge">Scheduled notifications</Text>
              <Text
                variant="bodySmall"
                color="textSecondary"
                style={{ marginTop: theme.spacing.xs }}
              >
                {scheduledCount} scheduled (daily reminders + milestone celebrations)
              </Text>
            </Card>
          </>
        )}

        {!permissionGranted && permissionStatus === 'undetermined' && (
          <Card variant="elevated" style={{ marginTop: theme.spacing.md }}>
            <Text variant="labelLarge">Enable notifications</Text>
            <Text variant="bodySmall" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
              Allow notifications to receive daily reminders.
            </Text>
            <View style={{ marginTop: theme.spacing.md }}>
              <Button
                title="Grant permission"
                onPress={requestPermissions}
                variant="primary"
                size="large"
                accessibilityLabel="Grant notification permission"
              />
            </View>
          </Card>
        )}

        {!permissionGranted && permissionStatus === 'denied' && (
          <Card
            variant="elevated"
            style={{ marginTop: theme.spacing.md, backgroundColor: theme.colors.surface }}
          >
            <Text variant="labelLarge">Enable notifications in Settings</Text>
            <Text variant="bodySmall" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
              iOS blocks prompts after denying permission. Open system settings to enable
              notifications.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 4,
  },
  grow: {
    flex: 1,
    paddingRight: 12,
  },
  banner: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  bannerText: {
    color: '#856404',
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1,
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  timeDisplay: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  timePicker: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  pickerNote: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  timeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  timeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testButton: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#1976D2',
    lineHeight: 18,
  },
});
