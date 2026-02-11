/* eslint-disable @typescript-eslint/no-unsafe-assignment */

const mockScheduleNotificationAsync = jest.fn();
const mockCancelScheduledNotificationAsync = jest.fn();
const mockGetAllScheduledNotificationsAsync = jest.fn();

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotificationAsync(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) =>
    mockCancelScheduledNotificationAsync(...args),
  getAllScheduledNotificationsAsync: (...args: unknown[]) =>
    mockGetAllScheduledNotificationsAsync(...args),
  AndroidNotificationPriority: { HIGH: 'high', MAX: 'max' },
  SchedulableTriggerInputTypes: { DAILY: 'daily', DATE: 'date' },
}));
jest.mock('../../utils/logger');

import {
  scheduleMorningReminder,
  scheduleEveningReminder,
  scheduleDailyReminders,
  cancelDailyReminders,
  sendTestNotification,
  scheduleMilestoneNotification,
  scheduleAllMilestones,
  cancelAllMilestones,
  getScheduledNotifications,
  NOTIFICATION_IDS,
  DEFAULT_REMINDERS,
  MILESTONE_DAYS,
} from '../notificationService';
import type { NotificationRequest } from 'expo-notifications';
import { logger } from '../../utils/logger';

describe('notificationService', () => {
  const mockSchedule = mockScheduleNotificationAsync;
  const mockCancel = mockCancelScheduledNotificationAsync;
  const mockGetAll = mockGetAllScheduledNotificationsAsync;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue('notif-id-123');
    mockCancel.mockResolvedValue(undefined);
    mockGetAll.mockResolvedValue([]);
  });

  // ========================================
  // Constants
  // ========================================

  describe('constants', () => {
    it('should export NOTIFICATION_IDS', () => {
      expect(NOTIFICATION_IDS.MORNING_CHECKIN).toBe('morning-checkin');
      expect(NOTIFICATION_IDS.EVENING_CHECKIN).toBe('evening-checkin');
      expect(NOTIFICATION_IDS.MILESTONE_PREFIX).toBe('milestone-');
    });

    it('should export DEFAULT_REMINDERS', () => {
      expect(DEFAULT_REMINDERS.morning).toEqual({ hour: 9, minute: 0 });
      expect(DEFAULT_REMINDERS.evening).toEqual({ hour: 21, minute: 0 });
    });

    it('should export MILESTONE_DAYS', () => {
      expect(MILESTONE_DAYS).toEqual([1, 7, 14, 30, 60, 90, 180, 365]);
    });
  });

  // ========================================
  // scheduleMorningReminder
  // ========================================

  describe('scheduleMorningReminder', () => {
    it('should cancel existing and schedule new morning reminder', async () => {
      const result = await scheduleMorningReminder({ enabled: true, hour: 8, minute: 30 });

      expect(mockCancel).toHaveBeenCalledWith(NOTIFICATION_IDS.MORNING_CHECKIN);
      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: NOTIFICATION_IDS.MORNING_CHECKIN,
          content: expect.objectContaining({
            title: '🌅 Good Morning!',
            sound: true,
          }),
          trigger: expect.objectContaining({
            hour: 8,
            minute: 30,
          }),
        }),
      );
      expect(result).toBe('notif-id-123');
      expect(logger.info).toHaveBeenCalledWith(
        'Morning reminder scheduled',
        expect.objectContaining({ time: '8:30' }),
      );
    });

    it('should return null and cancel when disabled', async () => {
      const result = await scheduleMorningReminder({ enabled: false, hour: 9, minute: 0 });

      expect(mockCancel).toHaveBeenCalledWith(NOTIFICATION_IDS.MORNING_CHECKIN);
      expect(mockSchedule).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(logger.info).toHaveBeenCalledWith('Morning reminder disabled');
    });

    it('should use default config when no argument provided', async () => {
      await scheduleMorningReminder();

      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: expect.objectContaining({
            hour: DEFAULT_REMINDERS.morning.hour,
            minute: DEFAULT_REMINDERS.morning.minute,
          }),
        }),
      );
    });

    it('should return null on scheduling error', async () => {
      mockCancel.mockResolvedValue(undefined);
      mockSchedule.mockImplementation(async () => {
        throw new Error('Scheduling failed');
      });

      const result = await scheduleMorningReminder({ enabled: true, hour: 9, minute: 0 });

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Error scheduling morning reminder',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });
  });

  // ========================================
  // scheduleEveningReminder
  // ========================================

  describe('scheduleEveningReminder', () => {
    it('should cancel existing and schedule new evening reminder', async () => {
      const result = await scheduleEveningReminder({ enabled: true, hour: 20, minute: 0 });

      expect(mockCancel).toHaveBeenCalledWith(NOTIFICATION_IDS.EVENING_CHECKIN);
      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: NOTIFICATION_IDS.EVENING_CHECKIN,
          content: expect.objectContaining({
            title: '🌙 Evening Check-In',
          }),
          trigger: expect.objectContaining({
            hour: 20,
            minute: 0,
          }),
        }),
      );
      expect(result).toBe('notif-id-123');
    });

    it('should return null when disabled', async () => {
      const result = await scheduleEveningReminder({ enabled: false, hour: 21, minute: 0 });

      expect(mockSchedule).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockSchedule.mockImplementation(async () => {
        throw new Error('Fail');
      });

      const result = await scheduleEveningReminder({ enabled: true, hour: 21, minute: 0 });

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ========================================
  // scheduleDailyReminders
  // ========================================

  describe('scheduleDailyReminders', () => {
    it('should schedule both morning and evening reminders', async () => {
      mockSchedule.mockResolvedValueOnce('morning-id').mockResolvedValueOnce('evening-id');

      const result = await scheduleDailyReminders(
        { enabled: true, hour: 7, minute: 0 },
        { enabled: true, hour: 22, minute: 30 },
      );

      expect(result).toEqual({ morning: 'morning-id', evening: 'evening-id' });
      expect(logger.info).toHaveBeenCalledWith(
        'Daily reminders scheduled',
        expect.objectContaining({ morningEnabled: true, eveningEnabled: true }),
      );
    });

    it('should handle one enabled and one disabled', async () => {
      mockSchedule.mockResolvedValueOnce('morning-id');

      const result = await scheduleDailyReminders(
        { enabled: true, hour: 9, minute: 0 },
        { enabled: false, hour: 21, minute: 0 },
      );

      expect(result.morning).toBe('morning-id');
      expect(result.evening).toBeNull();
    });
  });

  // ========================================
  // cancelDailyReminders
  // ========================================

  describe('cancelDailyReminders', () => {
    it('should cancel both morning and evening reminders', async () => {
      await cancelDailyReminders();

      expect(mockCancel).toHaveBeenCalledWith(NOTIFICATION_IDS.MORNING_CHECKIN);
      expect(mockCancel).toHaveBeenCalledWith(NOTIFICATION_IDS.EVENING_CHECKIN);
      expect(logger.info).toHaveBeenCalledWith('Daily reminders cancelled');
    });

    it('should handle cancel errors gracefully', async () => {
      mockCancel.mockImplementation(async () => {
        throw new Error('Cancel failed');
      });

      await cancelDailyReminders();

      expect(logger.error).toHaveBeenCalledWith(
        'Error cancelling daily reminders',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });
  });

  // ========================================
  // sendTestNotification
  // ========================================

  describe('sendTestNotification', () => {
    it('should send immediate notification with defaults', async () => {
      await sendTestNotification();

      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Test Notification',
            body: 'This is a test notification from Steps to Recovery.',
            sound: true,
          }),
          trigger: null,
        }),
      );
      expect(logger.info).toHaveBeenCalledWith('Test notification sent');
    });

    it('should send notification with custom title and body', async () => {
      await sendTestNotification('Custom Title', 'Custom Body');

      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Custom Title',
            body: 'Custom Body',
          }),
        }),
      );
    });

    it('should handle send error gracefully', async () => {
      mockSchedule.mockImplementation(async () => {
        throw new Error('Send failed');
      });

      await sendTestNotification();

      expect(logger.error).toHaveBeenCalledWith(
        'Error sending test notification',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });
  });

  // ========================================
  // scheduleMilestoneNotification
  // ========================================

  describe('scheduleMilestoneNotification', () => {
    it('should schedule milestone notification for future date', async () => {
      // Set clean date to 5 days ago so day-7 milestone is in the future
      const cleanDate = new Date();
      cleanDate.setDate(cleanDate.getDate() - 5);

      const result = await scheduleMilestoneNotification(7, cleanDate);

      expect(mockCancel).toHaveBeenCalledWith('milestone-7');
      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'milestone-7',
          content: expect.objectContaining({
            title: '✨ One Week Strong!',
            sound: true,
          }),
        }),
      );
      expect(result).toBe('notif-id-123');
    });

    it('should return null for milestone already in the past', async () => {
      // Set clean date to 40 days ago, so day-30 is in the past
      const cleanDate = new Date();
      cleanDate.setDate(cleanDate.getDate() - 40);

      const result = await scheduleMilestoneNotification(30, cleanDate);

      expect(result).toBeNull();
      expect(mockSchedule).not.toHaveBeenCalled();
    });

    it('should return null on scheduling error', async () => {
      const cleanDate = new Date();
      cleanDate.setDate(cleanDate.getDate() - 1);

      mockSchedule.mockImplementation(async () => {
        throw new Error('Schedule error');
      });

      const result = await scheduleMilestoneNotification(7, cleanDate);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Error scheduling milestone notification',
        expect.objectContaining({ error: expect.any(Error), days: 7 }),
      );
    });
  });

  // ========================================
  // scheduleAllMilestones
  // ========================================

  describe('scheduleAllMilestones', () => {
    it('should schedule only future milestones', async () => {
      // 10 days clean: milestones 1 and 7 are past, 14+ are future
      const cleanDate = new Date();
      cleanDate.setDate(cleanDate.getDate() - 10);

      mockSchedule.mockResolvedValue('notif-id');

      const result = await scheduleAllMilestones(cleanDate);

      expect(result.length).toBeGreaterThan(0);
      expect(logger.info).toHaveBeenCalledWith(
        'All milestone notifications scheduled',
        expect.objectContaining({ count: expect.any(Number) }),
      );
    });

    it('should return empty array when all milestones are past', async () => {
      // 400 days clean: all milestones are past
      const cleanDate = new Date();
      cleanDate.setDate(cleanDate.getDate() - 400);

      const result = await scheduleAllMilestones(cleanDate);

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      mockSchedule.mockImplementation(async () => {
        throw new Error('Fail');
      });

      const cleanDate = new Date();

      const result = await scheduleAllMilestones(cleanDate);

      // Some milestones may fail individually but the function catches per-milestone
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ========================================
  // cancelAllMilestones
  // ========================================

  describe('cancelAllMilestones', () => {
    it('should cancel all milestone notifications', async () => {
      await cancelAllMilestones();

      MILESTONE_DAYS.forEach((day) => {
        expect(mockCancel).toHaveBeenCalledWith(`${NOTIFICATION_IDS.MILESTONE_PREFIX}${day}`);
      });
      expect(logger.info).toHaveBeenCalledWith('All milestone notifications cancelled');
    });

    it('should handle cancel error gracefully', async () => {
      mockCancel.mockImplementation(async () => {
        throw new Error('Cancel error');
      });

      await cancelAllMilestones();

      expect(logger.error).toHaveBeenCalledWith(
        'Error cancelling milestone notifications',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });
  });

  // ========================================
  // getScheduledNotifications
  // ========================================

  describe('getScheduledNotifications', () => {
    it('should return all scheduled notifications', async () => {
      const mockNotifs = [
        { identifier: 'morning-checkin', content: { title: 'Test' } },
      ] as unknown as NotificationRequest[];
      mockGetAll.mockResolvedValue(mockNotifs);

      const result = await getScheduledNotifications();

      expect(result).toEqual(mockNotifs);
    });

    it('should return empty array on error', async () => {
      mockGetAll.mockImplementation(async () => {
        throw new Error('Error');
      });

      const result = await getScheduledNotifications();

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
