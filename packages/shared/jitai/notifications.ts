/**
 * JITAI Notification Scheduling
 */

import * as Notifications from 'expo-notifications';
import type { JitaiIntervention } from './types';
import { logger } from '../utils/logger';

const JITAI_NOTIFICATION_PREFIX = 'jitai-';

/**
 * Schedule a JITAI intervention notification
 */
export async function scheduleJitaiNotification(intervention: JitaiIntervention): Promise<void> {
  try {
    // Cancel any existing notification for this trigger
    await cancelJitaiNotification(intervention.triggerId);

    await Notifications.scheduleNotificationAsync({
      identifier: `${JITAI_NOTIFICATION_PREFIX}${intervention.triggerId}`,
      content: {
        title: intervention.title,
        body: intervention.message,
        data: {
          type: 'jitai',
          triggerId: intervention.triggerId,
          action: intervention.action,
          category: intervention.category,
        },
        sound: true,
        badge: 1,
      },
      // Schedule for 5 seconds from now (slight delay for better UX)
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
      },
    });

    logger.info(`JITAI notification scheduled: ${intervention.triggerId}`);
  } catch (error) {
    logger.error('Failed to schedule JITAI notification', error);
  }
}

/**
 * Cancel a specific JITAI notification
 */
export async function cancelJitaiNotification(triggerId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(
      `${JITAI_NOTIFICATION_PREFIX}${triggerId}`,
    );
  } catch (error) {
    // Notification might not exist, that's okay
  }
}

/**
 * Cancel all JITAI notifications
 */
export async function cancelAllJitaiNotifications(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const jitaiNotifications = scheduled.filter((n) =>
      n.identifier.startsWith(JITAI_NOTIFICATION_PREFIX),
    );

    for (const notification of jitaiNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    logger.error('Failed to cancel JITAI notifications', error);
  }
}

/**
 * Get all scheduled JITAI notifications
 */
export async function getScheduledJitaiNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter((n) => n.identifier.startsWith(JITAI_NOTIFICATION_PREFIX));
}
