/**
 * Notification Service - Scheduling & Management
 *
 * Handles scheduling of local notifications for:
 * - Daily check-in reminders (morning & evening)
 * - Recovery milestone celebrations
 * - Custom user-scheduled reminders
 */

import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { logger } from '../utils/logger';
import type { NotificationPayload } from '../types/notifications';

/**
 * Notification identifiers for managing specific notifications
 */
export const NOTIFICATION_IDS = {
  MORNING_CHECKIN: 'morning-checkin',
  EVENING_CHECKIN: 'evening-checkin',
  MILESTONE_PREFIX: 'milestone-',
} as const;

/**
 * Daily reminder configuration
 */
export interface DailyReminderConfig {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
}

/**
 * Default reminder times
 */
export const DEFAULT_REMINDERS = {
  morning: { hour: 9, minute: 0 }, // 9:00 AM
  evening: { hour: 21, minute: 0 }, // 9:00 PM
} as const;

/**
 * Schedule morning check-in reminder
 *
 * @param config - Reminder configuration (time & enabled status)
 * @returns Notification identifier or null if not scheduled
 */
export async function scheduleMorningReminder(
  config: DailyReminderConfig = { enabled: true, ...DEFAULT_REMINDERS.morning },
): Promise<string | null> {
  try {
    // Cancel existing morning reminder
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.MORNING_CHECKIN);

    if (!config.enabled) {
      logger.info('Morning reminder disabled');
      return null;
    }

    // Schedule new morning reminder
    const identifier = await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_IDS.MORNING_CHECKIN,
      content: {
        title: '🌅 Good Morning!',
        body: 'How are you feeling today? Take a moment for your morning check-in.',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          screen: 'Home.MorningIntention',
          type: 'morning-checkin',
        } as NotificationPayload,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: config.hour,
        minute: config.minute,
      },
    });

    logger.info('Morning reminder scheduled', {
      time: `${config.hour}:${String(config.minute).padStart(2, '0')}`,
      identifier,
    });

    return identifier;
  } catch (error) {
    logger.error('Error scheduling morning reminder', { error });
    return null;
  }
}

/**
 * Schedule evening check-in reminder
 *
 * @param config - Reminder configuration (time & enabled status)
 * @returns Notification identifier or null if not scheduled
 */
export async function scheduleEveningReminder(
  config: DailyReminderConfig = { enabled: true, ...DEFAULT_REMINDERS.evening },
): Promise<string | null> {
  try {
    // Cancel existing evening reminder
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.EVENING_CHECKIN);

    if (!config.enabled) {
      logger.info('Evening reminder disabled');
      return null;
    }

    // Schedule new evening reminder
    const identifier = await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_IDS.EVENING_CHECKIN,
      content: {
        title: '🌙 Evening Check-In',
        body: 'Reflect on your day. How did it go? Complete your evening pulse.',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          screen: 'Home.EveningPulse',
          type: 'evening-checkin',
        } as NotificationPayload,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: config.hour,
        minute: config.minute,
      },
    });

    logger.info('Evening reminder scheduled', {
      time: `${config.hour}:${String(config.minute).padStart(2, '0')}`,
      identifier,
    });

    return identifier;
  } catch (error) {
    logger.error('Error scheduling evening reminder', { error });
    return null;
  }
}

/**
 * Schedule both daily reminders (morning & evening)
 *
 * @param morning - Morning reminder config
 * @param evening - Evening reminder config
 * @returns Object with scheduled notification identifiers
 */
export async function scheduleDailyReminders(
  morning: DailyReminderConfig = { enabled: true, ...DEFAULT_REMINDERS.morning },
  evening: DailyReminderConfig = { enabled: true, ...DEFAULT_REMINDERS.evening },
): Promise<{ morning: string | null; evening: string | null }> {
  const [morningId, eveningId] = await Promise.all([
    scheduleMorningReminder(morning),
    scheduleEveningReminder(evening),
  ]);

  logger.info('Daily reminders scheduled', {
    morningEnabled: morning.enabled,
    eveningEnabled: evening.enabled,
  });

  return {
    morning: morningId,
    evening: eveningId,
  };
}

/**
 * Cancel all daily check-in reminders
 */
export async function cancelDailyReminders(): Promise<void> {
  try {
    await Promise.all([
      Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.MORNING_CHECKIN),
      Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.EVENING_CHECKIN),
    ]);

    logger.info('Daily reminders cancelled');
  } catch (error) {
    logger.error('Error cancelling daily reminders', { error });
  }
}

/**
 * Send immediate test notification
 *
 * @param title - Notification title
 * @param body - Notification body
 */
export async function sendTestNotification(
  title: string = 'Test Notification',
  body: string = 'This is a test notification from Steps to Recovery.',
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: {
          type: 'test',
        },
      },
      trigger: null, // Send immediately
    });

    logger.info('Test notification sent');
  } catch (error) {
    logger.error('Error sending test notification', { error });
  }
}

/**
 * Recovery milestone days that trigger celebration notifications
 */
export const MILESTONE_DAYS = [1, 7, 14, 30, 60, 90, 180, 365] as const;
export type MilestoneDay = (typeof MILESTONE_DAYS)[number];

/**
 * Get celebration message for a milestone
 *
 * @param days - Number of days clean
 * @returns Celebration message
 */
function getMilestoneMessage(days: MilestoneDay): { title: string; body: string } {
  const messages: Record<MilestoneDay, { title: string; body: string }> = {
    1: {
      title: '🎉 One Day Clean!',
      body: 'You did it! The first day is often the hardest. Celebrate this important victory.',
    },
    7: {
      title: '✨ One Week Strong!',
      body: "Seven days of recovery! You're building momentum. Keep going!",
    },
    14: {
      title: '🌟 Two Weeks!',
      body: "Two weeks clean! You're proving to yourself that change is possible.",
    },
    30: {
      title: '🏆 30 Days!',
      body: 'One month of recovery! This is a major milestone. You should be proud.',
    },
    60: {
      title: '💪 60 Days Strong!',
      body: 'Two months! Your dedication is inspiring. Recovery is becoming your new normal.',
    },
    90: {
      title: '🎊 90 Days!',
      body: 'Three months clean! This is huge. Your life is transforming.',
    },
    180: {
      title: '🌈 Six Months!',
      body: "Half a year of recovery! Look how far you've come. You're amazing.",
    },
    365: {
      title: '👑 ONE YEAR!',
      body: 'A full year of recovery! This is extraordinary. Celebrate this incredible achievement!',
    },
  };

  return messages[days];
}

/**
 * Schedule milestone celebration notification
 *
 * @param days - Milestone day (1, 7, 14, 30, 60, 90, 180, 365)
 * @param cleanSinceDate - Date user started recovery
 * @returns Notification identifier or null if not scheduled
 */
export async function scheduleMilestoneNotification(
  days: MilestoneDay,
  cleanSinceDate: Date,
): Promise<string | null> {
  try {
    if (!MILESTONE_DAYS.includes(days)) {
      logger.warn('Invalid milestone day', { days });
      return null;
    }

    const milestoneDate = new Date(cleanSinceDate);
    milestoneDate.setDate(milestoneDate.getDate() + days);
    milestoneDate.setHours(9, 0, 0, 0); // Set to 9:00 AM

    // Don't schedule if milestone is in the past
    if (milestoneDate < new Date()) {
      logger.info('Milestone date in past, not scheduling', { days, milestoneDate });
      return null;
    }

    const message = getMilestoneMessage(days);
    const identifier = `${NOTIFICATION_IDS.MILESTONE_PREFIX}${days}`;

    // Cancel existing milestone notification for this day
    await Notifications.cancelScheduledNotificationAsync(identifier);

    // Schedule milestone notification for 9 AM on milestone day
    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: message.title,
        body: message.body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: {
          screen: 'Home',
          params: { days },
          type: 'milestone',
        } as NotificationPayload,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: milestoneDate,
      },
    });

    logger.info('Milestone notification scheduled', {
      days,
      date: milestoneDate.toISOString(),
      identifier: notificationId,
    });

    return notificationId;
  } catch (error) {
    logger.error('Error scheduling milestone notification', { error, days });
    return null;
  }
}

/**
 * Schedule all upcoming milestone notifications
 *
 * @param cleanSinceDate - Date user started recovery
 * @returns Array of scheduled notification identifiers
 */
export async function scheduleAllMilestones(cleanSinceDate: Date): Promise<string[]> {
  try {
    const now = new Date();
    const daysSinceClean = Math.floor(
      (now.getTime() - cleanSinceDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Only schedule future milestones
    const futureMilestones = MILESTONE_DAYS.filter((day) => day > daysSinceClean);

    const scheduledIds = await Promise.all(
      futureMilestones.map((days) => scheduleMilestoneNotification(days, cleanSinceDate)),
    );

    const validIds = scheduledIds.filter((id): id is string => id !== null);

    logger.info('All milestone notifications scheduled', {
      count: validIds.length,
      milestones: futureMilestones,
    });

    return validIds;
  } catch (error) {
    logger.error('Error scheduling all milestones', { error });
    return [];
  }
}

/**
 * Cancel all milestone notifications
 */
export async function cancelAllMilestones(): Promise<void> {
  try {
    await Promise.all(
      MILESTONE_DAYS.map((days) =>
        Notifications.cancelScheduledNotificationAsync(
          `${NOTIFICATION_IDS.MILESTONE_PREFIX}${days}`,
        ),
      ),
    );

    logger.info('All milestone notifications cancelled');
  } catch (error) {
    logger.error('Error cancelling milestone notifications', { error });
  }
}

/**
 * Get all currently scheduled notifications
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
