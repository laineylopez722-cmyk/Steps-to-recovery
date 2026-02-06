/**
 * Meeting Reminder Hook
 *
 * Manages meeting reminders and location-based notifications.
 * Integrates with the notification system for timely reminders.
 *
 * **Features**:
 * - Schedule reminders before meetings
 * - Geofencing for meeting locations
 * - Recurring meeting reminders
 * - Smart reminder timing
 *
 * @example
 * ```ts
 * const {
 *   scheduleReminder,
 *   cancelReminder,
 *   getUpcomingReminders,
 * } = useMeetingReminder();
 *
 * // Schedule reminder 30 min before meeting
 * await scheduleReminder(meeting, { minutesBefore: 30 });
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

const GEOFENCE_TASK_NAME = 'meeting-geofence-task';

interface Meeting {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  dayOfWeek?: number; // 0 = Sunday, 6 = Saturday
  time?: string; // HH:MM format
  isRecurring?: boolean;
}

interface ReminderOptions {
  /** Minutes before meeting to remind (default: 30) */
  minutesBefore?: number;
  /** Enable location-based reminder */
  enableGeofence?: boolean;
  /** Geofence radius in meters (default: 100) */
  geofenceRadius?: number;
  /** Custom notification title */
  title?: string;
  /** Custom notification body */
  body?: string;
}

interface ScheduledReminder {
  id: string;
  meetingId: string;
  meetingName: string;
  scheduledTime: Date;
  notificationId: string;
}

interface MeetingReminderState {
  /** Scheduled reminders */
  reminders: ScheduledReminder[];
  /** Geofencing is active */
  isGeofencingActive: boolean;
  /** Location permission status */
  locationPermission: 'granted' | 'denied' | 'undetermined';
  /** Notification permission status */
  notificationPermission: 'granted' | 'denied' | 'undetermined';
}

interface MeetingReminderActions {
  /** Schedule a meeting reminder */
  scheduleReminder: (meeting: Meeting, options?: ReminderOptions) => Promise<string | null>;
  /** Cancel a scheduled reminder */
  cancelReminder: (reminderId: string) => Promise<void>;
  /** Cancel all reminders for a meeting */
  cancelMeetingReminders: (meetingId: string) => Promise<void>;
  /** Get upcoming reminders */
  getUpcomingReminders: () => ScheduledReminder[];
  /** Request notification permission */
  requestNotificationPermission: () => Promise<boolean>;
  /** Request location permission (for geofencing) */
  requestLocationPermission: () => Promise<boolean>;
  /** Set up geofence for a meeting location */
  setupGeofence: (meeting: Meeting, radius?: number) => Promise<boolean>;
  /** Remove geofence */
  removeGeofence: (meetingId: string) => Promise<void>;
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useMeetingReminder(): MeetingReminderState & MeetingReminderActions {
  const [reminders, setReminders] = useState<ScheduledReminder[]>([]);
  const [isGeofencingActive, setIsGeofencingActive] = useState(false);
  const [locationPermission, setLocationPermission] = useState<
    'granted' | 'denied' | 'undetermined'
  >('undetermined');
  const [notificationPermission, setNotificationPermission] = useState<
    'granted' | 'denied' | 'undetermined'
  >('undetermined');

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async (): Promise<void> => {
      // Check notification permission
      const notifStatus = await Notifications.getPermissionsAsync();
      setNotificationPermission(
        notifStatus.granted ? 'granted' : notifStatus.canAskAgain ? 'undetermined' : 'denied',
      );

      // Check location permission
      const locStatus = await Location.getForegroundPermissionsAsync();
      setLocationPermission(
        locStatus.granted ? 'granted' : locStatus.canAskAgain ? 'undetermined' : 'denied',
      );
    };

    void checkPermissions();
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    setNotificationPermission(granted ? 'granted' : 'denied');
    return granted;
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    // Request foreground permission first
    const foregroundStatus = await Location.requestForegroundPermissionsAsync();
    if (!foregroundStatus.granted) {
      setLocationPermission('denied');
      return false;
    }

    // For geofencing, need background permission
    if (Platform.OS !== 'web') {
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (!backgroundStatus.granted) {
        logger.warn('Background location permission denied - geofencing limited');
      }
    }

    setLocationPermission('granted');
    return true;
  }, []);

  const scheduleReminder = useCallback(
    async (meeting: Meeting, options: ReminderOptions = {}): Promise<string | null> => {
      const { minutesBefore = 30, title, body } = options;

      // Check permission
      if (notificationPermission !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) {
          logger.warn('Cannot schedule reminder: notification permission denied');
          return null;
        }
      }

      try {
        // Calculate trigger time
        let triggerDate: Date;

        if (meeting.dayOfWeek !== undefined && meeting.time) {
          // Recurring meeting - find next occurrence
          const [hours, minutes] = meeting.time.split(':').map(Number);
          const now = new Date();
          triggerDate = new Date();
          triggerDate.setHours(hours, minutes, 0, 0);

          // Find next day of week
          const currentDay = now.getDay();
          let daysUntil = meeting.dayOfWeek - currentDay;
          if (daysUntil <= 0 || (daysUntil === 0 && triggerDate <= now)) {
            daysUntil += 7;
          }
          triggerDate.setDate(triggerDate.getDate() + daysUntil);

          // Subtract reminder time
          triggerDate.setMinutes(triggerDate.getMinutes() - minutesBefore);
        } else {
          logger.warn('Meeting has no scheduled time');
          return null;
        }

        // Don't schedule if in the past
        if (triggerDate <= new Date()) {
          logger.info('Reminder time is in the past, skipping');
          return null;
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: title || `Meeting Reminder: ${meeting.name}`,
            body: body || `Your meeting starts in ${minutesBefore} minutes`,
            data: { meetingId: meeting.id, type: 'meeting_reminder' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });

        const reminder: ScheduledReminder = {
          id: notificationId,
          meetingId: meeting.id,
          meetingName: meeting.name,
          scheduledTime: triggerDate,
          notificationId,
        };

        setReminders((prev) => [...prev, reminder]);

        logger.info('Meeting reminder scheduled', {
          meetingId: meeting.id,
          triggerTime: triggerDate.toISOString(),
        });

        return notificationId;
      } catch (error) {
        logger.error('Failed to schedule meeting reminder', error);
        return null;
      }
    },
    [notificationPermission, requestNotificationPermission],
  );

  const cancelReminder = useCallback(async (reminderId: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminderId);
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
      logger.info('Meeting reminder cancelled', { reminderId });
    } catch (error) {
      logger.error('Failed to cancel meeting reminder', error);
    }
  }, []);

  const cancelMeetingReminders = useCallback(
    async (meetingId: string): Promise<void> => {
      const meetingReminders = reminders.filter((r) => r.meetingId === meetingId);
      await Promise.all(meetingReminders.map((r) => cancelReminder(r.id)));
    },
    [reminders, cancelReminder],
  );

  const getUpcomingReminders = useCallback((): ScheduledReminder[] => {
    const now = new Date();
    return reminders
      .filter((r) => r.scheduledTime > now)
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }, [reminders]);

  const setupGeofence = useCallback(
    async (meeting: Meeting, radius = 100): Promise<boolean> => {
      if (Platform.OS === 'web') {
        logger.info('Geofencing not supported on web');
        return false;
      }

      if (!meeting.latitude || !meeting.longitude) {
        logger.warn('Cannot set up geofence: meeting has no coordinates');
        return false;
      }

      // Check permissions
      if (locationPermission !== 'granted') {
        const granted = await requestLocationPermission();
        if (!granted) {
          return false;
        }
      }

      try {
        // Define the geofence task if not already defined
        if (!TaskManager.isTaskDefined(GEOFENCE_TASK_NAME)) {
          TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }) => {
            if (error) {
              logger.error('Geofence task error', error);
              return;
            }

            const { eventType, region } = data as {
              eventType: Location.GeofencingEventType;
              region: Location.LocationRegion;
            };

            if (eventType === Location.GeofencingEventType.Enter) {
              // User entered meeting area
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "You're near a meeting!",
                  body: `${region.identifier} is nearby. Stay strong!`,
                  data: { type: 'geofence_enter', meetingName: region.identifier },
                },
                trigger: null,
              });
            }
          });
        }

        // Start geofencing
        await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, [
          {
            identifier: meeting.name,
            latitude: meeting.latitude,
            longitude: meeting.longitude,
            radius,
            notifyOnEnter: true,
            notifyOnExit: false,
          },
        ]);

        setIsGeofencingActive(true);
        logger.info('Geofence set up', { meetingId: meeting.id, radius });
        return true;
      } catch (error) {
        logger.error('Failed to set up geofence', error);
        return false;
      }
    },
    [locationPermission, requestLocationPermission],
  );

  const removeGeofence = useCallback(async (meetingId: string): Promise<void> => {
    if (Platform.OS === 'web') return;

    try {
      await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
      setIsGeofencingActive(false);
      logger.info('Geofence removed', { meetingId });
    } catch (error) {
      logger.error('Failed to remove geofence', error);
    }
  }, []);

  return {
    reminders,
    isGeofencingActive,
    locationPermission,
    notificationPermission,
    scheduleReminder,
    cancelReminder,
    cancelMeetingReminders,
    getUpcomingReminders,
    requestNotificationPermission,
    requestLocationPermission,
    setupGeofence,
    removeGeofence,
  };
}

export type { Meeting, ReminderOptions, ScheduledReminder };
