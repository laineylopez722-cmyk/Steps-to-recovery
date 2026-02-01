/**
 * Meeting Reminders Service
 * Handles scheduling and managing reminders for regular meetings
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { RegularMeeting } from '../types';

// Notification identifier prefix
const REGULAR_MEETING_REMINDER_PREFIX = 'regular-meeting-';

/**
 * Get the notification identifier for a regular meeting
 */
function getMeetingNotificationId(meetingId: string): string {
  return `${REGULAR_MEETING_REMINDER_PREFIX}${meetingId}`;
}

/**
 * Calculate the trigger time for a weekly meeting reminder
 */
function calculateMeetingTrigger(
  dayOfWeek: number,
  time: string,
  reminderMinutesBefore: number,
): Notifications.WeeklyTriggerInput {
  const [hours, minutes] = time.split(':').map(Number);

  // Calculate reminder time
  let reminderHours = hours;
  let reminderMinutes = minutes - reminderMinutesBefore;

  // Handle negative minutes (goes to previous hour)
  while (reminderMinutes < 0) {
    reminderMinutes += 60;
    reminderHours -= 1;
  }

  // Handle hour underflow (goes to previous day)
  let reminderDay = dayOfWeek;
  if (reminderHours < 0) {
    reminderHours += 24;
    reminderDay = (dayOfWeek - 1 + 7) % 7;
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday: reminderDay + 1, // expo-notifications uses 1-7 (Sunday=1)
    hour: reminderHours,
    minute: reminderMinutes,
  };
}

/**
 * Get reminder messages for meetings
 */
function getMeetingReminderContent(meeting: RegularMeeting, minutesBefore: number) {
  const timeDisplay = formatTime12Hour(meeting.time);
  const locationText = meeting.location ? ` at ${meeting.location}` : '';

  const messages = [
    {
      title: `📅 Meeting in ${minutesBefore} minutes`,
      body: `${meeting.name}${locationText} starts at ${timeDisplay}`,
    },
    {
      title: `🤝 ${meeting.name} soon`,
      body: `Your meeting starts at ${timeDisplay}${locationText}`,
    },
    {
      title: meeting.isHomeGroup ? `🏠 Home Group time!` : `📍 Meeting reminder`,
      body: `${meeting.name} at ${timeDisplay}`,
    },
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Format time to 12-hour format
 */
function formatTime12Hour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Schedule a reminder notification for a regular meeting
 */
export async function scheduleRegularMeetingReminder(meeting: RegularMeeting): Promise<void> {
  if (!meeting.reminderEnabled) return;

  // Cancel existing reminder first
  await cancelRegularMeetingReminder(meeting.id);

  try {
    const trigger = calculateMeetingTrigger(
      meeting.dayOfWeek,
      meeting.time,
      meeting.reminderMinutesBefore,
    );

    const content = getMeetingReminderContent(meeting, meeting.reminderMinutesBefore);

    await Notifications.scheduleNotificationAsync({
      identifier: getMeetingNotificationId(meeting.id),
      content: {
        title: content.title,
        body: content.body,
        data: {
          screen: 'my-meetings',
          meetingId: meeting.id,
          action: 'reminder',
        },
        sound: true,
        badge: 1,
      },
      trigger,
    });

    console.log(
      `Scheduled meeting reminder for "${meeting.name}" on day ${meeting.dayOfWeek} at ${meeting.time}`,
    );
  } catch (error) {
    console.error('Failed to schedule meeting reminder:', error);
  }
}

/**
 * Cancel a reminder notification for a regular meeting
 */
export async function cancelRegularMeetingReminder(meetingId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(getMeetingNotificationId(meetingId));
  } catch (error) {
    console.error('Failed to cancel meeting reminder:', error);
  }
}

/**
 * Schedule reminders for all meetings with reminders enabled
 */
export async function scheduleAllMeetingReminders(meetings: RegularMeeting[]): Promise<void> {
  const meetingsWithReminders = meetings.filter((m) => m.reminderEnabled);

  for (const meeting of meetingsWithReminders) {
    await scheduleRegularMeetingReminder(meeting);
  }

  console.log(`Scheduled ${meetingsWithReminders.length} meeting reminders`);
}

/**
 * Cancel all meeting reminders
 */
export async function cancelAllMeetingReminders(meetings: RegularMeeting[]): Promise<void> {
  for (const meeting of meetings) {
    await cancelRegularMeetingReminder(meeting.id);
  }
}

/**
 * Send an immediate notification about an upcoming meeting (for testing)
 */
export async function sendImmediateMeetingReminder(meeting: RegularMeeting): Promise<void> {
  const content = getMeetingReminderContent(meeting, meeting.reminderMinutesBefore);

  await Notifications.scheduleNotificationAsync({
    identifier: `${getMeetingNotificationId(meeting.id)}-immediate`,
    content: {
      title: content.title,
      body: content.body,
      data: {
        screen: 'my-meetings',
        meetingId: meeting.id,
        action: 'immediate',
      },
      sound: true,
    },
    trigger: null, // Immediate
  });
}

/**
 * Create Android notification channel for meeting reminders
 */
export async function createMeetingNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('meetings', {
      name: 'Meeting Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3b82f6',
      description: 'Reminders for your regular recovery meetings',
    });
  }
}

/**
 * Get all scheduled meeting reminder notifications
 */
export async function getScheduledMeetingReminders(): Promise<Notifications.NotificationRequest[]> {
  const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
  return allNotifications.filter((n) => n.identifier.startsWith(REGULAR_MEETING_REMINDER_PREFIX));
}
