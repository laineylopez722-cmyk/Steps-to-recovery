/**
 * Notifications Hook
 * Manages notification state and provides convenience methods
 */

import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import {
  requestNotificationPermissions,
  scheduleDailyCheckinReminder,
  cancelDailyCheckinReminder,
  scheduleMilestoneNotification,
  getScheduledNotifications,
  clearBadge,
} from '@recovery/shared/notifications';
import { useSettingsStore } from '@recovery/shared';

export function useNotifications() {
  const { settings } = useSettingsStore();
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [scheduledNotifications, setScheduledNotifications] = useState<
    Notifications.NotificationRequest[]
  >([]);

  // Check permission status on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermissions = async (): Promise<boolean> => {
    const granted = await requestNotificationPermissions();
    await checkPermissions();
    return granted;
  };

  const scheduleCheckinReminder = async (time?: string) => {
    const checkInTime = time || settings?.checkInTime || '09:00';
    await scheduleDailyCheckinReminder(checkInTime);
    await refreshScheduledNotifications();
  };

  const cancelCheckinReminder = async () => {
    await cancelDailyCheckinReminder();
    await refreshScheduledNotifications();
  };

  const celebrateMilestone = async (title: string, days: number) => {
    await scheduleMilestoneNotification(title, days);
  };

  const refreshScheduledNotifications = async () => {
    const notifications = await getScheduledNotifications();
    setScheduledNotifications(notifications);
  };

  const clearNotificationBadge = async () => {
    await clearBadge();
  };

  return {
    permissionStatus,
    scheduledNotifications,
    hasPermission: permissionStatus === 'granted',
    isEnabled: settings?.notificationsEnabled ?? true,
    checkInTime: settings?.checkInTime || '09:00',
    requestPermissions,
    scheduleCheckinReminder,
    cancelCheckinReminder,
    celebrateMilestone,
    refreshScheduledNotifications,
    clearNotificationBadge,
  };
}
