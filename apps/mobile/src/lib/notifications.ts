/**
 * Notification System - Permission & Handler Setup
 *
 * Manages push notification permissions, Expo push tokens, and notification handlers.
 * Follows privacy-first design with user control over notification preferences.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

/**
 * Configure notification behavior
 * - Show notifications when app is in foreground
 * - Play sound and show badge
 * Skip on web - notifications not fully supported
 * Wrapped in try-catch for Expo Go compatibility (notifications require dev build in SDK 53+)
 */
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (_error) {
    // Silently fail in Expo Go - notifications require development build
    // All other app features (journaling, check-ins, step work) work normally
    logger.warn(
      'Notification handler setup skipped (Expo Go does not support push notifications in SDK 53+)',
    );
  }
}

/**
 * Notification permission status
 */
export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

/**
 * Result of permission request
 */
export interface NotificationPermissionResult {
  status: NotificationPermissionStatus;
  canAskAgain: boolean;
  expoPushToken?: string;
}

/**
 * Request notification permissions from the user
 *
 * @returns Permission result with status and optional Expo push token
 */
export async function requestNotificationPermissions(): Promise<NotificationPermissionResult> {
  if (Platform.OS === 'web') {
    // Notifications not supported on web
    return {
      status: 'unavailable' as NotificationPermissionStatus,
      canAskAgain: false,
    };
  }

  try {
    // Check current permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If not determined, ask user for permission
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If permission denied, return early
    if (finalStatus !== 'granted') {
      logger.warn('Notification permission denied');
      return {
        status: finalStatus as NotificationPermissionStatus,
        canAskAgain: existingStatus === 'undetermined',
      };
    }

    // Permission granted - get Expo push token
    const expoPushToken = await getExpoPushToken();

    logger.info('Notification permission granted', { hasToken: !!expoPushToken });

    return {
      status: 'granted',
      canAskAgain: false,
      expoPushToken,
    };
  } catch (error) {
    logger.error('Error requesting notification permissions', { error });
    return {
      status: 'denied',
      canAskAgain: false,
    };
  }
}

/**
 * Get current notification permission status without requesting
 *
 * @returns Current permission status
 */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (Platform.OS === 'web') {
    // Notifications not supported on web
    return 'unavailable' as NotificationPermissionStatus;
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status as NotificationPermissionStatus;
  } catch (error) {
    logger.error('Error getting notification permission status', { error });
    return 'denied';
  }
}

/**
 * Get Expo push token for this device
 * Required for sending push notifications from backend
 *
 * @returns Expo push token or undefined if unavailable
 */
async function getExpoPushToken(): Promise<string | undefined> {
  try {
    // Android-specific setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Get push token
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: '12bd81db-2aa5-41b7-a7b5-fdfe22bc2bf2', // From app.json
    });

    return token;
  } catch (error) {
    logger.error('Error getting Expo push token', { error });
    return undefined;
  }
}

/**
 * Notification handler types
 */
export interface NotificationHandlers {
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
}

/**
 * Register notification event handlers
 *
 * @param handlers - Callback functions for notification events
 * @returns Cleanup function to remove listeners
 */
export function registerNotificationHandlers(handlers: NotificationHandlers): () => void {
  if (Platform.OS === 'web') {
    // Notifications not supported on web, return no-op cleanup
    return () => {};
  }

  const subscriptions: Notifications.Subscription[] = [];

  // Handler for notifications received while app is foregrounded
  if (handlers.onNotificationReceived) {
    const subscription = Notifications.addNotificationReceivedListener(
      handlers.onNotificationReceived,
    );
    subscriptions.push(subscription);
  }

  // Handler for user tapping on notification
  if (handlers.onNotificationResponse) {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handlers.onNotificationResponse,
    );
    subscriptions.push(subscription);
  }

  // Return cleanup function
  return () => {
    subscriptions.forEach((sub) => sub.remove());
  };
}

/**
 * Get the last notification response (if user opened app via notification)
 *
 * @returns Last notification response or null
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  try {
    return Notifications.getLastNotificationResponse();
  } catch (error) {
    logger.error('Error getting last notification response', { error });
    return null;
  }
}

/**
 * Clear all delivered notifications from notification tray
 */
export async function clearAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
    logger.info('All notifications cleared');
  } catch (error) {
    logger.error('Error clearing notifications', { error });
  }
}

/**
 * Get all scheduled notification requests
 *
 * @returns Array of scheduled notification requests
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    logger.error('Error getting scheduled notifications', { error });
    return [];
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    logger.info('All scheduled notifications cancelled');
  } catch (error) {
    logger.error('Error cancelling scheduled notifications', { error });
  }
}
