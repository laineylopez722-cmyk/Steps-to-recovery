/**
 * NotificationContext - Notification State Management
 *
 * Manages notification permissions, handlers, and user preferences.
 * Provides context for enabling/disabling notifications app-wide.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import type * as Notifications from 'expo-notifications';
import {
  requestNotificationPermissions,
  getNotificationPermissionStatus,
  registerNotificationHandlers,
  getLastNotificationResponse,
  type NotificationPermissionStatus,
} from '../lib/notifications';
import { logger } from '../utils/logger';
import { navigateFromNotification } from '../navigation/navigationRef';
import type { NotificationPayload } from '../types/notifications';

interface NotificationContextValue {
  // Permission state
  permissionStatus: NotificationPermissionStatus;
  expoPushToken: string | null;
  isLoading: boolean;

  // Actions
  requestPermissions: () => Promise<boolean>;
  checkPermissionStatus: () => Promise<void>;

  // Preferences
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>('undetermined');
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  /**
   * Check current permission status on mount
   */
  const checkPermissionStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = await getNotificationPermissionStatus();
      setPermissionStatus(status);
    } catch (error) {
      logger.error('Error checking notification permission', { error });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Request notification permissions from user
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await requestNotificationPermissions();
      setPermissionStatus(result.status);

      if (result.expoPushToken) {
        setExpoPushToken(result.expoPushToken);
      }

      return result.status === 'granted';
    } catch (error) {
      logger.error('Error requesting notification permissions', { error });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle notification received while app is in foreground
   */
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    logger.info('Notification received', {
      title: notification.request.content.title,
      body: notification.request.content.body,
    });

    // Could add custom handling here (e.g., show in-app banner)
  }, []);

  /**
   * Handle user tapping on notification
   */
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const { title, data } = response.notification.request.content;

    logger.info('Notification tapped', {
      title,
      data,
    });

    // Navigate using new payload structure
    // Falls back to legacy format if data.screen is a string
    const payload = data as unknown as NotificationPayload | undefined;
    navigateFromNotification(payload);
  }, []);

  /**
   * Register notification handlers on mount
   * Skip on web - notifications not fully supported
   */
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Notifications not supported on web, skip registration
      return;
    }

    const cleanup = registerNotificationHandlers({
      onNotificationReceived: handleNotificationReceived,
      onNotificationResponse: handleNotificationResponse,
    });

    return cleanup;
  }, [handleNotificationReceived, handleNotificationResponse]);

  /**
   * Check permission status on mount
   * Skip on web - notifications not fully supported
   */
  useEffect(() => {
    if (Platform.OS === 'web') {
      // On web, set status to unavailable
      setPermissionStatus('unavailable');
      setIsLoading(false);
      return;
    }

    checkPermissionStatus();
  }, [checkPermissionStatus]);

  /**
   * Handle notification that launched the app (cold start)
   * Check for last notification response and navigate after mount
   */
  useEffect(() => {
    if (Platform.OS === 'web') {
      return; // Not applicable on web
    }

    let isMounted = true;

    async function handleInitialNotification(): Promise<void> {
      try {
        // Wait for navigation to be ready
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (!isMounted) return;

        const response = await getLastNotificationResponse();

        if (response) {
          logger.info('App launched from notification', {
            title: response.notification.request.content.title,
          });

          const data = response.notification.request.content.data;
          const payload = data as unknown as NotificationPayload | undefined;
          navigateFromNotification(payload);
        }
      } catch (error) {
        logger.error('Error handling initial notification', { error });
      }
    }

    handleInitialNotification();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      permissionStatus,
      expoPushToken,
      isLoading,
      requestPermissions,
      checkPermissionStatus,
      notificationsEnabled,
      setNotificationsEnabled,
    }),
    [
      permissionStatus,
      expoPushToken,
      isLoading,
      requestPermissions,
      checkPermissionStatus,
      notificationsEnabled,
      setNotificationsEnabled,
    ],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

/**
 * Hook to access notification context
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
