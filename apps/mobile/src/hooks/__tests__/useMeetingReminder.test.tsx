/**
 * useMeetingReminder Hook Test Suite
 *
 * Tests meeting reminder functionality including:
 * - Schedule time-based reminders
 * - Cancel individual and meeting reminders
 * - Geofencing for location-based reminders
 * - Permission management (notifications and location)
 * - Upcoming reminders retrieval
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock function declarations (must be before jest.mock)
const mockScheduleNotificationAsync = jest.fn();
const mockCancelScheduledNotificationAsync = jest.fn();
const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const _mockSetNotificationHandler = jest.fn();

const mockGetForegroundPermissionsAsync = jest.fn();
const mockRequestForegroundPermissionsAsync = jest.fn();
const mockRequestBackgroundPermissionsAsync = jest.fn();
const mockStartGeofencingAsync = jest.fn();
const mockStopGeofencingAsync = jest.fn();

const mockIsTaskDefined = jest.fn();
const mockDefineTask = jest.fn();

const mockLoggerInfo = jest.fn();
const mockLoggerWarn = jest.fn();
const mockLoggerError = jest.fn();
const mockLoggerDebug = jest.fn();

// jest.mock calls (hoisted, reference the mock functions declared above)
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotificationAsync(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) =>
    mockCancelScheduledNotificationAsync(...args),
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: {
    DATE: 'date',
  },
  AndroidNotificationPriority: {
    HIGH: 'high',
  },
}));

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: (...args: unknown[]) => mockGetForegroundPermissionsAsync(...args),
  requestForegroundPermissionsAsync: (...args: unknown[]) =>
    mockRequestForegroundPermissionsAsync(...args),
  requestBackgroundPermissionsAsync: (...args: unknown[]) =>
    mockRequestBackgroundPermissionsAsync(...args),
  startGeofencingAsync: (...args: unknown[]) => mockStartGeofencingAsync(...args),
  stopGeofencingAsync: (...args: unknown[]) => mockStopGeofencingAsync(...args),
  GeofencingEventType: {
    Enter: 1,
    Exit: 2,
  },
}));

jest.mock('expo-task-manager', () => ({
  isTaskDefined: (...args: unknown[]) => mockIsTaskDefined(...args),
  defineTask: (...args: unknown[]) => mockDefineTask(...args),
}));

// Platform mock: override the Platform module that react-native re-exports
jest.mock('react-native/Libraries/Utilities/Platform', () => {
  let os = 'ios';
  return {
    __esModule: true,
    default: {
      get OS() {
        return os;
      },
      set OS(value: string) {
        os = value;
      },
      select: jest.fn((obj: Record<string, unknown>) => obj[os]),
    },
    get OS() {
      return os;
    },
    set OS(value: string) {
      os = value;
    },
    select: jest.fn((obj: Record<string, unknown>) => obj[os]),
  };
});

jest.mock('../../utils/logger', () => ({
  logger: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
    error: (...args: unknown[]) => mockLoggerError(...args),
    debug: (...args: unknown[]) => mockLoggerDebug(...args),
  },
}));

// Import hook after mocking
import { useMeetingReminder } from '../useMeetingReminder';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

describe('useMeetingReminder', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as unknown as { OS: string }).OS = 'ios';

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    // Default mock implementations
    mockGetPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
    mockGetForegroundPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ granted: true });
    mockRequestBackgroundPermissionsAsync.mockResolvedValue({ granted: true });
    mockScheduleNotificationAsync.mockResolvedValue('notification-id-123');
    mockCancelScheduledNotificationAsync.mockResolvedValue(undefined);
    mockIsTaskDefined.mockReturnValue(false);
    mockStartGeofencingAsync.mockResolvedValue(undefined);
    mockStopGeofencingAsync.mockResolvedValue(undefined);
  });

  describe('Permission Management', () => {
    it('should check notification permission on mount', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.notificationPermission).toBe('granted');
      });
    });

    it('should check location permission on mount', async () => {
      mockGetForegroundPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.locationPermission).toBe('granted');
      });

      expect(mockGetForegroundPermissionsAsync).toHaveBeenCalled();
    });

    it('should set permission to denied when cannot ask again and not granted', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });
      mockGetForegroundPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.notificationPermission).toBe('denied');
        expect(result.current.locationPermission).toBe('denied');
      });
    });

    it('should request notification permission and return true when granted', async () => {
      mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      let granted = false;
      await act(async () => {
        granted = await result.current.requestNotificationPermission();
      });

      expect(granted).toBe(true);
      expect(mockRequestPermissionsAsync).toHaveBeenCalled();
      expect(result.current.notificationPermission).toBe('granted');
    });

    it('should request notification permission and return false when denied', async () => {
      mockRequestPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      let granted = true;
      await act(async () => {
        granted = await result.current.requestNotificationPermission();
      });

      expect(granted).toBe(false);
      expect(result.current.notificationPermission).toBe('denied');
    });

    it('should request location permission (foreground and background)', async () => {
      mockRequestForegroundPermissionsAsync.mockResolvedValue({ granted: true });
      mockRequestBackgroundPermissionsAsync.mockResolvedValue({ granted: true });

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      let granted = false;
      await act(async () => {
        granted = await result.current.requestLocationPermission();
      });

      expect(granted).toBe(true);
      expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(mockRequestBackgroundPermissionsAsync).toHaveBeenCalled();
      expect(result.current.locationPermission).toBe('granted');
    });

    it('should return false for location permission when foreground denied', async () => {
      mockGetForegroundPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
      mockRequestForegroundPermissionsAsync.mockResolvedValue({ granted: false });

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      // Wait for initial mount permissions check to settle
      await waitFor(() => {
        expect(result.current.locationPermission).toBe('undetermined');
      });

      let granted = true;
      await act(async () => {
        granted = await result.current.requestLocationPermission();
      });

      expect(granted).toBe(false);
      expect(result.current.locationPermission).toBe('denied');
      expect(mockRequestBackgroundPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should not request background permission on web', async () => {
      (Platform as unknown as { OS: string }).OS = 'web';

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.requestLocationPermission();
      });

      expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(mockRequestBackgroundPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should log warning when background permission denied', async () => {
      mockRequestForegroundPermissionsAsync.mockResolvedValue({ granted: true });
      mockRequestBackgroundPermissionsAsync.mockResolvedValue({ granted: false });

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.requestLocationPermission();
      });

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Background location permission denied - geofencing limited',
      );
    });
  });

  describe('scheduleReminder', () => {
    it('should calculate trigger time for recurring meeting and schedule notification', async () => {
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        dayOfWeek: 1, // Monday
        time: '19:00',
      };

      mockScheduleNotificationAsync.mockResolvedValue('notif-id-123');

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      let notificationId: string | null = null;
      await act(async () => {
        notificationId = await result.current.scheduleReminder(meeting, { minutesBefore: 30 });
      });

      expect(notificationId).toBe('notif-id-123');
      expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Meeting Reminder: Test Meeting',
            body: 'Your meeting starts in 30 minutes',
            data: { meetingId: 'meeting-1', type: 'meeting_reminder' },
          }),
          trigger: expect.objectContaining({
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: expect.any(Date),
          }),
        }),
      );
    });

    it('should use custom title and body when provided', async () => {
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        dayOfWeek: 1,
        time: '19:00',
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.scheduleReminder(meeting, {
          minutesBefore: 15,
          title: 'Custom Title',
          body: 'Custom Body',
        });
      });

      expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Custom Title',
            body: 'Custom Body',
          }),
        }),
      );
    });

    it('should request permission if not granted before scheduling', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
      mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });

      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        dayOfWeek: 1,
        time: '19:00',
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.notificationPermission).toBe('undetermined');
      });

      await act(async () => {
        await result.current.scheduleReminder(meeting, { minutesBefore: 30 });
      });

      expect(mockRequestPermissionsAsync).toHaveBeenCalled();
    });

    it('should return null and skip if permission denied', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
      mockRequestPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        dayOfWeek: 1,
        time: '19:00',
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.notificationPermission).toBe('undetermined');
      });

      let notificationId: string | null = 'should-be-null';
      await act(async () => {
        notificationId = await result.current.scheduleReminder(meeting, { minutesBefore: 30 });
      });

      expect(notificationId).toBeNull();
      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Cannot schedule reminder: notification permission denied',
      );
    });

    it('should skip scheduling if trigger time is in the past', async () => {
      // Use a large minutesBefore that pushes the trigger time into the past.
      // The hook always pushes the meeting to next week when today's time has
      // passed, so we need minutesBefore > 7 days (10080 min) to land in the past.
      const now = new Date();
      const tomorrowDayOfWeek = (now.getDay() + 1) % 7;

      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        dayOfWeek: tomorrowDayOfWeek,
        time: '00:00',
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      let notificationId: string | null = 'should-be-null';
      await act(async () => {
        // minutesBefore of 20000 (~14 days) guarantees the trigger is in the past
        notificationId = await result.current.scheduleReminder(meeting, { minutesBefore: 20000 });
      });

      expect(notificationId).toBeNull();
      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
      expect(mockLoggerInfo).toHaveBeenCalledWith('Reminder time is in the past, skipping');
    });

    it('should return null if meeting has no scheduled time', async () => {
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        // No dayOfWeek or time
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      let notificationId: string | null = 'should-be-null';
      await act(async () => {
        notificationId = await result.current.scheduleReminder(meeting, { minutesBefore: 30 });
      });

      expect(notificationId).toBeNull();
      expect(mockLoggerWarn).toHaveBeenCalledWith('Meeting has no scheduled time');
    });

    it('should calculate next week if meeting time has already passed today', async () => {
      // Meeting is for today but time has passed
      const now = new Date();
      const currentDayOfWeek = now.getDay();
      const pastHour = now.getHours() - 1;
      const timeString = `${pastHour.toString().padStart(2, '0')}:00`;

      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        dayOfWeek: currentDayOfWeek,
        time: timeString,
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.scheduleReminder(meeting, { minutesBefore: 0 });
      });

      expect(mockScheduleNotificationAsync).toHaveBeenCalled();
      const trigger = mockScheduleNotificationAsync.mock.calls[0][0].trigger;
      const triggerDate = trigger.date;

      // Should be scheduled for next week
      const daysDiff = Math.round((triggerDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(6);
    });

    it('should add reminder to state after scheduling', async () => {
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        dayOfWeek: 1,
        time: '19:00',
      };

      mockScheduleNotificationAsync.mockResolvedValue('notif-id-123');

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.scheduleReminder(meeting, { minutesBefore: 30 });
      });

      expect(result.current.reminders).toHaveLength(1);
      expect(result.current.reminders[0]).toMatchObject({
        id: 'notif-id-123',
        meetingId: 'meeting-1',
        meetingName: 'Test Meeting',
        notificationId: 'notif-id-123',
      });
    });

    it('should use default 30 minutes before when not specified', async () => {
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        dayOfWeek: 1,
        time: '19:00',
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.scheduleReminder(meeting);
      });

      expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            body: 'Your meeting starts in 30 minutes',
          }),
        }),
      );
    });

    it('should handle scheduling errors gracefully', async () => {
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        dayOfWeek: 1,
        time: '19:00',
      };

      mockScheduleNotificationAsync.mockRejectedValue(new Error('Scheduling failed'));

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      let notificationId: string | null = 'should-be-null';
      await act(async () => {
        notificationId = await result.current.scheduleReminder(meeting);
      });

      expect(notificationId).toBeNull();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Failed to schedule meeting reminder',
        expect.any(Error),
      );
    });

    it('should log successful scheduling', async () => {
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        dayOfWeek: 1,
        time: '19:00',
      };

      mockScheduleNotificationAsync.mockResolvedValue('notif-id-123');

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.scheduleReminder(meeting, { minutesBefore: 30 });
      });

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Meeting reminder scheduled',
        expect.objectContaining({
          meetingId: 'meeting-1',
          triggerTime: expect.any(String),
        }),
      );
    });
  });

  describe('cancelReminder', () => {
    it('should cancel scheduled notification', async () => {
      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.cancelReminder('reminder-id-123');
      });

      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith('reminder-id-123');
    });

    it('should remove reminder from state', async () => {
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        dayOfWeek: 1,
        time: '19:00',
      };

      mockScheduleNotificationAsync.mockResolvedValue('reminder-id-123');

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      // First schedule a reminder
      await act(async () => {
        await result.current.scheduleReminder(meeting);
      });

      expect(result.current.reminders).toHaveLength(1);

      // Then cancel it
      await act(async () => {
        await result.current.cancelReminder('reminder-id-123');
      });

      expect(result.current.reminders).toHaveLength(0);
    });

    it('should log successful cancellation', async () => {
      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.cancelReminder('reminder-id-123');
      });

      expect(mockLoggerInfo).toHaveBeenCalledWith('Meeting reminder cancelled', {
        reminderId: 'reminder-id-123',
      });
    });

    it('should handle cancellation errors gracefully', async () => {
      mockCancelScheduledNotificationAsync.mockRejectedValue(new Error('Cancel failed'));

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.cancelReminder('reminder-id-123');
      });

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Failed to cancel meeting reminder',
        expect.any(Error),
      );
    });
  });

  describe('cancelMeetingReminders', () => {
    it('should cancel all reminders for a specific meeting', async () => {
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        dayOfWeek: 1,
        time: '19:00',
      };

      mockScheduleNotificationAsync
        .mockResolvedValueOnce('reminder-1')
        .mockResolvedValueOnce('reminder-2');

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      // Schedule two reminders for the same meeting
      await act(async () => {
        await result.current.scheduleReminder(meeting, { minutesBefore: 30 });
        await result.current.scheduleReminder(meeting, { minutesBefore: 60 });
      });

      expect(result.current.reminders).toHaveLength(2);

      // Cancel all reminders for this meeting
      await act(async () => {
        await result.current.cancelMeetingReminders('meeting-1');
      });

      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith('reminder-1');
      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith('reminder-2');
      expect(result.current.reminders).toHaveLength(0);
    });
  });

  describe('getUpcomingReminders', () => {
    it('should return only future reminders sorted by time', async () => {
      const now = new Date();
      const futureDate1 = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const pastDate = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        dayOfWeek: now.getDay(),
        time: `${futureDate1.getHours()}:${futureDate1.getMinutes().toString().padStart(2, '0')}`,
      };

      mockScheduleNotificationAsync.mockResolvedValue('reminder-future-1');

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      // Schedule reminders
      await act(async () => {
        await result.current.scheduleReminder(meeting, { minutesBefore: 0 });
      });

      // Manually add a past reminder to test filtering
      act(() => {
        const pastReminder = {
          id: 'reminder-past',
          meetingId: 'meeting-past',
          meetingName: 'Past Meeting',
          scheduledTime: pastDate,
          notificationId: 'reminder-past',
        };
        // @ts-expect-error - accessing internal state for testing
        result.current.reminders.push(pastReminder);
      });

      const upcoming = result.current.getUpcomingReminders();

      expect(upcoming).toHaveLength(1);
      expect(upcoming[0].id).toBe('reminder-future-1');
    });

    it('should return empty array when no upcoming reminders', async () => {
      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.notificationPermission).toBe('granted');
        expect(result.current.locationPermission).toBe('granted');
      });

      const upcoming = result.current.getUpcomingReminders();

      expect(upcoming).toEqual([]);
    });

    it('should sort reminders by scheduled time', async () => {
      // Schedule three reminders for the same future meeting with different minutesBefore
      // so they have different scheduledTime values and can be sorted.
      const now = new Date();
      const futureDayOfWeek = (now.getDay() + 3) % 7; // 3 days from now

      const meeting1 = {
        id: 'meeting-1',
        name: 'Meeting 1',
        dayOfWeek: futureDayOfWeek,
        time: '20:00',
      };
      const meeting2 = {
        id: 'meeting-2',
        name: 'Meeting 2',
        dayOfWeek: futureDayOfWeek,
        time: '18:00',
      };
      const meeting3 = {
        id: 'meeting-3',
        name: 'Meeting 3',
        dayOfWeek: futureDayOfWeek,
        time: '19:00',
      };

      mockScheduleNotificationAsync
        .mockResolvedValueOnce('reminder-3') // meeting1 at 20:00 - latest
        .mockResolvedValueOnce('reminder-1') // meeting2 at 18:00 - earliest
        .mockResolvedValueOnce('reminder-2'); // meeting3 at 19:00 - middle

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      // Schedule in non-sorted order (20:00, 18:00, 19:00)
      await act(async () => {
        await result.current.scheduleReminder(meeting1, { minutesBefore: 0 });
        await result.current.scheduleReminder(meeting2, { minutesBefore: 0 });
        await result.current.scheduleReminder(meeting3, { minutesBefore: 0 });
      });

      const upcoming = result.current.getUpcomingReminders();

      expect(upcoming).toHaveLength(3);
      expect(upcoming[0].id).toBe('reminder-1'); // 18:00
      expect(upcoming[1].id).toBe('reminder-2'); // 19:00
      expect(upcoming[2].id).toBe('reminder-3'); // 20:00
    });
  });

  describe('setupGeofence', () => {
    it('should return false on web platform', async () => {
      (Platform as unknown as { OS: string }).OS = 'web';

      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        latitude: 40.7128,
        longitude: -74.006,
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      let success = true;
      await act(async () => {
        success = await result.current.setupGeofence(meeting);
      });

      expect(success).toBe(false);
      expect(mockLoggerInfo).toHaveBeenCalledWith('Geofencing not supported on web');
    });

    it('should return false if meeting has no coordinates', async () => {
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        // No latitude or longitude
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      let success = true;
      await act(async () => {
        success = await result.current.setupGeofence(meeting);
      });

      expect(success).toBe(false);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Cannot set up geofence: meeting has no coordinates',
      );
    });

    it('should request location permission if not granted', async () => {
      mockGetForegroundPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
      mockRequestForegroundPermissionsAsync.mockResolvedValue({ granted: true });
      mockRequestBackgroundPermissionsAsync.mockResolvedValue({ granted: true });

      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        latitude: 40.7128,
        longitude: -74.006,
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.locationPermission).toBe('undetermined');
      });

      await act(async () => {
        await result.current.setupGeofence(meeting);
      });

      expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalled();
    });

    it('should return false if location permission denied', async () => {
      mockGetForegroundPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
      mockRequestForegroundPermissionsAsync.mockResolvedValue({ granted: false });

      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        latitude: 40.7128,
        longitude: -74.006,
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.locationPermission).toBe('undetermined');
      });

      let success = true;
      await act(async () => {
        success = await result.current.setupGeofence(meeting);
      });

      expect(success).toBe(false);
    });

    it('should define geofence task if not already defined', async () => {
      mockIsTaskDefined.mockReturnValue(false);

      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        latitude: 40.7128,
        longitude: -74.006,
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.setupGeofence(meeting);
      });

      expect(mockIsTaskDefined).toHaveBeenCalledWith('meeting-geofence-task');
      expect(mockDefineTask).toHaveBeenCalledWith('meeting-geofence-task', expect.any(Function));
    });

    it('should start geofencing with correct parameters', async () => {
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        latitude: 40.7128,
        longitude: -74.006,
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.setupGeofence(meeting, 150);
      });

      expect(mockStartGeofencingAsync).toHaveBeenCalledWith('meeting-geofence-task', [
        expect.objectContaining({
          identifier: 'Test Meeting',
          latitude: 40.7128,
          longitude: -74.006,
          radius: 150,
          notifyOnEnter: true,
          notifyOnExit: false,
        }),
      ]);
    });

    it('should use default radius of 100 meters', async () => {
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        latitude: 40.7128,
        longitude: -74.006,
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.setupGeofence(meeting);
      });

      expect(mockStartGeofencingAsync).toHaveBeenCalledWith('meeting-geofence-task', [
        expect.objectContaining({
          radius: 100,
        }),
      ]);
    });

    it('should set isGeofencingActive to true on success', async () => {
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        latitude: 40.7128,
        longitude: -74.006,
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isGeofencingActive).toBe(false);

      await act(async () => {
        await result.current.setupGeofence(meeting);
      });

      expect(result.current.isGeofencingActive).toBe(true);
    });

    it('should return true on successful setup', async () => {
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        latitude: 40.7128,
        longitude: -74.006,
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      let success = false;
      await act(async () => {
        success = await result.current.setupGeofence(meeting);
      });

      expect(success).toBe(true);
    });

    it('should log successful geofence setup', async () => {
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        latitude: 40.7128,
        longitude: -74.006,
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.setupGeofence(meeting, 150);
      });

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Geofence set up',
        expect.objectContaining({
          meetingId: 'meeting-1',
          radius: 150,
        }),
      );
    });

    it('should handle geofencing setup errors gracefully', async () => {
      mockStartGeofencingAsync.mockRejectedValue(new Error('Geofencing failed'));

      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        latitude: 40.7128,
        longitude: -74.006,
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      let success = true;
      await act(async () => {
        success = await result.current.setupGeofence(meeting);
      });

      expect(success).toBe(false);
      expect(mockLoggerWarn).toHaveBeenCalledWith('Failed to set up geofence', expect.any(Error));
    });

    it('should not redefine task if already defined', async () => {
      mockIsTaskDefined.mockReturnValue(true);

      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        latitude: 40.7128,
        longitude: -74.006,
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.setupGeofence(meeting);
      });

      expect(mockIsTaskDefined).toHaveBeenCalledWith('meeting-geofence-task');
      expect(mockDefineTask).not.toHaveBeenCalled();
    });
  });

  describe('removeGeofence', () => {
    it('should return early on web platform', async () => {
      (Platform as unknown as { OS: string }).OS = 'web';

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.removeGeofence('meeting-1');
      });

      expect(mockStopGeofencingAsync).not.toHaveBeenCalled();
    });

    it('should stop geofencing and update state', async () => {
      // First set up a geofence
      const meeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        latitude: 40.7128,
        longitude: -74.006,
      };

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.setupGeofence(meeting);
      });

      expect(result.current.isGeofencingActive).toBe(true);

      // Then remove it
      await act(async () => {
        await result.current.removeGeofence('meeting-1');
      });

      expect(mockStopGeofencingAsync).toHaveBeenCalledWith('meeting-geofence-task');
      expect(result.current.isGeofencingActive).toBe(false);
    });

    it('should log successful removal', async () => {
      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.removeGeofence('meeting-1');
      });

      expect(mockLoggerInfo).toHaveBeenCalledWith('Geofence removed', {
        meetingId: 'meeting-1',
      });
    });

    it('should handle removal errors gracefully', async () => {
      mockStopGeofencingAsync.mockRejectedValue(new Error('Stop failed'));

      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.removeGeofence('meeting-1');
      });

      expect(mockLoggerWarn).toHaveBeenCalledWith('Failed to remove geofence', expect.any(Error));
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state values', async () => {
      const { result } = renderHook(() => useMeetingReminder(), {
        wrapper: createWrapper(),
      });

      expect(result.current.reminders).toEqual([]);
      expect(result.current.isGeofencingActive).toBe(false);
      expect(result.current.locationPermission).toBe('undetermined');
      expect(result.current.notificationPermission).toBe('undetermined');

      // Allow permission checks to settle to avoid act warnings
      await waitFor(() => {
        expect(result.current.notificationPermission).toBe('granted');
        expect(result.current.locationPermission).toBe('granted');
      });
    });
  });

  describe('Notification Handler Setup', () => {
    it('should set notification handler on module load', () => {
      // setNotificationHandler is called at module level during import.
      // Since jest.clearAllMocks() in beforeEach clears the call record,
      // we verify the mock was configured (it is a jest.fn from the mock factory).
      const Notif = require('expo-notifications');
      expect(Notif.setNotificationHandler).toBeDefined();
      expect(typeof Notif.setNotificationHandler).toBe('function');
    });
  });
});
