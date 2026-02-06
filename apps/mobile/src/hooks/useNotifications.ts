/**
 * Notifications Hook
 * Manages notification state and provides convenience methods
 */

import { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import {
  requestNotificationPermissions,
  scheduleDailyCheckinReminder,
  cancelDailyCheckinReminder,
  scheduleMilestoneNotification,
  getScheduledNotifications,
  clearBadge,
  useSettingsStore,
} from '@recovery/shared';
import { logger } from '../utils/logger';

export function useNotifications() {
  const { settings } = useSettingsStore();
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [scheduledNotifications, setScheduledNotifications] = useState<
    Notifications.NotificationRequest[]
  >([]);

  const checkPermissions = useCallback(async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      logger.error('Failed to check notification permissions:', error);
      setPermissionStatus('error');
    }
  }, []);

  // Check permission status on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestNotificationPermissions();
      await checkPermissions();
      return granted;
    } catch (error) {
      logger.error('Failed to request notification permissions:', error);
      return false;
    }
  }, [checkPermissions]);

  const scheduleCheckinReminder = useCallback(async (time?: string) => {
    try {
      const checkInTime = time || settings?.checkInTime || '09:00';
      await scheduleDailyCheckinReminder(checkInTime);
      await refreshScheduledNotifications();
    } catch (error) {
      logger.error('Failed to schedule check-in reminder:', error);
    }
  }, [settings?.checkInTime]);

  const cancelCheckinReminder = useCallback(async () => {
    try {
      await cancelDailyCheckinReminder();
      await refreshScheduledNotifications();
    } catch (error) {
      logger.error('Failed to cancel check-in reminder:', error);
    }
  }, []);

  const celebrateMilestone = useCallback(async (title: string, days: number) => {
    try {
      await scheduleMilestoneNotification(title, days);
    } catch (error) {
      logger.error('Failed to schedule milestone notification:', error);
    }
  }, []);

  const refreshScheduledNotifications = useCallback(async () => {
    try {
      const notifications = await getScheduledNotifications();
      setScheduledNotifications(notifications);
    } catch (error) {
      logger.error('Failed to refresh scheduled notifications:', error);
    }
  }, []);

  const clearNotificationBadge = useCallback(async () => {
    try {
      await clearBadge();
    } catch (error) {
      logger.error('Failed to clear notification badge:', error);
    }
  }, []);

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
