/**
 * Notifications Preferences Hook
 *
 * Manages notification preferences stored in SecureStore and
 * provides methods to update individual preferences and reschedule notifications.
 *
 * This hook is for notification *preferences/scheduling* management.
 * For permission state and handlers, use the NotificationContext.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type * as Notifications from 'expo-notifications';
import { secureStorage } from '../adapters/secureStorage';
import {
  DEFAULT_PREFERENCES,
  getScheduledNotifications,
  rescheduleAll,
  cancelAllScheduled,
  type NotificationPreferences,
} from '../services/notificationService';
import { logger } from '../utils/logger';

const PREFERENCES_KEY = 'notification_preferences';

/**
 * Load notification preferences from SecureStore
 */
async function loadPreferences(): Promise<NotificationPreferences> {
  try {
    const stored = await secureStorage.getItemAsync(PREFERENCES_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } as NotificationPreferences;
    }
  } catch (error) {
    logger.error('Failed to load notification preferences', { error });
  }
  return { ...DEFAULT_PREFERENCES };
}

/**
 * Save notification preferences to SecureStore
 */
async function savePreferences(preferences: NotificationPreferences): Promise<void> {
  try {
    await secureStorage.setItemAsync(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    logger.error('Failed to save notification preferences', { error });
  }
}

export function useNotificationPreferences(): {
  preferences: NotificationPreferences;
  isLoading: boolean;
  scheduledNotifications: Notifications.NotificationRequest[];
  updatePreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ) => Promise<void>;
  toggleAll: (enabled: boolean) => Promise<void>;
  refreshScheduled: () => Promise<void>;
} {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledNotifications, setScheduledNotifications] = useState<
    Notifications.NotificationRequest[]
  >([]);
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;

  // Load preferences on mount
  useEffect(() => {
    let mounted = true;

    async function init(): Promise<void> {
      const loaded = await loadPreferences();
      if (mounted) {
        setPreferences(loaded);
        setIsLoading(false);
      }
      // Also load scheduled notification count
      const scheduled = await getScheduledNotifications();
      if (mounted) {
        setScheduledNotifications(scheduled);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshScheduled = useCallback(async (): Promise<void> => {
    try {
      const scheduled = await getScheduledNotifications();
      setScheduledNotifications(scheduled);
    } catch (error) {
      logger.error('Failed to refresh scheduled notifications', { error });
    }
  }, []);

  /**
   * Update a single preference key and reschedule all notifications
   */
  const updatePreference = useCallback(
    async <K extends keyof NotificationPreferences>(
      key: K,
      value: NotificationPreferences[K],
    ): Promise<void> => {
      const updated: NotificationPreferences = {
        ...preferencesRef.current,
        [key]: value,
      };
      setPreferences(updated);
      preferencesRef.current = updated;

      await savePreferences(updated);
      await rescheduleAll(updated);
      await refreshScheduled();

      logger.info('Notification preference updated', { key, value });
    },
    [refreshScheduled],
  );

  /**
   * Toggle all notifications on or off
   */
  const toggleAll = useCallback(
    async (enabled: boolean): Promise<void> => {
      const updated: NotificationPreferences = {
        morningCheckIn: { ...preferencesRef.current.morningCheckIn, enabled },
        eveningCheckIn: { ...preferencesRef.current.eveningCheckIn, enabled },
        dailyReading: { ...preferencesRef.current.dailyReading, enabled },
        gratitudeReminder: { ...preferencesRef.current.gratitudeReminder, enabled },
        milestoneAlerts: { enabled },
        encouragement: { enabled },
      };
      setPreferences(updated);
      preferencesRef.current = updated;

      await savePreferences(updated);

      if (enabled) {
        await rescheduleAll(updated);
      } else {
        await cancelAllScheduled();
      }

      await refreshScheduled();

      logger.info('All notifications toggled', { enabled });
    },
    [refreshScheduled],
  );

  return {
    preferences,
    isLoading,
    scheduledNotifications,
    updatePreference,
    toggleAll,
    refreshScheduled,
  };
}
