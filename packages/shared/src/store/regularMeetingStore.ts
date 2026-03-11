/**
 * Regular Meeting Store
 * Manages recurring meeting schedule and reminders
 */

import { create } from 'zustand';
import type { RegularMeeting, RegularMeetingType } from '../types';
import { logger } from '../utils/logger';
import {
  createRegularMeeting,
  getRegularMeetings,
  getRegularMeetingById,
  getHomeGroup,
  getTodayMeetings,
  getUpcomingMeetings,
  getNextMeeting,
  updateRegularMeeting,
  deleteRegularMeeting,
  setHomeGroup,
  toggleMeetingReminder,
  decryptMeetingNotes,
  getDayName,
  getShortDayName,
  formatMeetingTime,
  getMeetingTypeIcon,
} from '../db/models/regularMeetings';
import {
  scheduleRegularMeetingReminder,
  cancelRegularMeetingReminder,
  scheduleAllMeetingReminders,
} from '../notifications/meetingReminders';

interface RegularMeetingState {
  meetings: RegularMeeting[];
  homeGroup: RegularMeeting | null;
  todayMeetings: RegularMeeting[];
  nextMeeting: RegularMeeting | null;
  isLoading: boolean;
  error: string | null;
}

interface RegularMeetingActions {
  loadMeetings: () => Promise<void>;
  addMeeting: (
    name: string,
    dayOfWeek: number,
    time: string,
    type: RegularMeetingType,
    options?: {
      location?: string;
      isHomeGroup?: boolean;
      reminderEnabled?: boolean;
      reminderMinutesBefore?: number;
      notes?: string;
    },
  ) => Promise<RegularMeeting>;
  updateMeeting: (
    id: string,
    updates: Partial<{
      name: string;
      location: string;
      dayOfWeek: number;
      time: string;
      type: RegularMeetingType;
      isHomeGroup: boolean;
      reminderEnabled: boolean;
      reminderMinutesBefore: number;
      notes: string;
    }>,
  ) => Promise<void>;
  removeMeeting: (id: string) => Promise<void>;
  getMeetingById: (id: string) => Promise<RegularMeeting | null>;
  setAsHomeGroup: (id: string) => Promise<void>;
  toggleReminder: (id: string, enabled: boolean) => Promise<void>;
  getUpcoming: (days?: number) => Promise<RegularMeeting[]>;
  refreshTodayMeetings: () => Promise<void>;
  refreshNextMeeting: () => Promise<void>;
  decryptNotes: (meeting: RegularMeeting) => Promise<string | null>;
  // Utilities
  getDayName: (dayOfWeek: number) => string;
  getShortDayName: (dayOfWeek: number) => string;
  formatTime: (time: string) => string;
  getTypeIcon: (type: RegularMeetingType) => string;
}

export const useRegularMeetingStore = create<RegularMeetingState & RegularMeetingActions>(
  (set, get) => ({
    meetings: [],
    homeGroup: null,
    todayMeetings: [],
    nextMeeting: null,
    isLoading: false,
    error: null,

    loadMeetings: async () => {
      set({ isLoading: true, error: null });
      try {
        const [meetings, homeGroup, todayMeetings, nextMeeting] = await Promise.all([
          getRegularMeetings(),
          getHomeGroup(),
          getTodayMeetings(),
          getNextMeeting(),
        ]);

        set({
          meetings,
          homeGroup,
          todayMeetings,
          nextMeeting,
          isLoading: false,
        });

        // Schedule reminders for all meetings with reminders enabled
        await scheduleAllMeetingReminders(meetings);
      } catch (error) {
        logger.error('Failed to load regular meetings', error);
        set({ error: 'Failed to load meetings', isLoading: false });
      }
    },

    addMeeting: async (name, dayOfWeek, time, type, options) => {
      try {
        const meeting = await createRegularMeeting(name, dayOfWeek, time, type, options);

        set((state) => {
          const newMeetings = [...state.meetings, meeting].sort((a, b) => {
            if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
            return a.time.localeCompare(b.time);
          });

          return {
            meetings: newMeetings,
            homeGroup: options?.isHomeGroup ? meeting : state.homeGroup,
          };
        });

        // Schedule reminder if enabled
        if (meeting.reminderEnabled) {
          await scheduleRegularMeetingReminder(meeting);
        }

        // Refresh today and next meeting
        await get().refreshTodayMeetings();
        await get().refreshNextMeeting();

        return meeting;
      } catch (error) {
        logger.error('Failed to add meeting', error);
        throw error;
      }
    },

    updateMeeting: async (id, updates) => {
      try {
        await updateRegularMeeting(id, updates);

        set((state) => {
          const updatedMeetings = state.meetings.map((m) =>
            m.id === id ? { ...m, ...updates } : m,
          );

          // If home group status changed
          let newHomeGroup = state.homeGroup;
          if (updates.isHomeGroup === true) {
            newHomeGroup = updatedMeetings.find((m) => m.id === id) || null;
          } else if (updates.isHomeGroup === false && state.homeGroup?.id === id) {
            newHomeGroup = null;
          }

          return {
            meetings: updatedMeetings.sort((a, b) => {
              if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
              return a.time.localeCompare(b.time);
            }),
            homeGroup: newHomeGroup,
          };
        });

        // Update reminder scheduling
        const meeting = await getRegularMeetingById(id);
        if (meeting) {
          if (meeting.reminderEnabled) {
            await scheduleRegularMeetingReminder(meeting);
          } else {
            await cancelRegularMeetingReminder(id);
          }
        }

        // Refresh today and next meeting
        await get().refreshTodayMeetings();
        await get().refreshNextMeeting();
      } catch (error) {
        logger.error('Failed to update meeting', error);
        throw error;
      }
    },

    removeMeeting: async (id) => {
      try {
        // Cancel reminder first
        await cancelRegularMeetingReminder(id);

        await deleteRegularMeeting(id);

        set((state) => ({
          meetings: state.meetings.filter((m) => m.id !== id),
          homeGroup: state.homeGroup?.id === id ? null : state.homeGroup,
          todayMeetings: state.todayMeetings.filter((m) => m.id !== id),
          nextMeeting: state.nextMeeting?.id === id ? null : state.nextMeeting,
        }));

        // Refresh next meeting if needed
        if (get().nextMeeting === null) {
          await get().refreshNextMeeting();
        }
      } catch (error) {
        logger.error('Failed to delete meeting', error);
        throw error;
      }
    },

    getMeetingById: async (id) => {
      const { meetings } = get();
      const cached = meetings.find((m) => m.id === id);
      if (cached) return cached;

      try {
        return await getRegularMeetingById(id);
      } catch (error) {
        logger.error('Failed to get meeting', error);
        return null;
      }
    },

    setAsHomeGroup: async (id) => {
      try {
        await setHomeGroup(id);

        set((state) => ({
          meetings: state.meetings.map((m) => ({
            ...m,
            isHomeGroup: m.id === id,
          })),
          homeGroup: state.meetings.find((m) => m.id === id) || null,
        }));
      } catch (error) {
        logger.error('Failed to set home group', error);
        throw error;
      }
    },

    toggleReminder: async (id, enabled) => {
      try {
        await toggleMeetingReminder(id, enabled);

        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.id === id ? { ...m, reminderEnabled: enabled } : m,
          ),
        }));

        // Update notification scheduling
        const meeting = await getRegularMeetingById(id);
        if (meeting) {
          if (enabled) {
            await scheduleRegularMeetingReminder(meeting);
          } else {
            await cancelRegularMeetingReminder(id);
          }
        }
      } catch (error) {
        logger.error('Failed to toggle reminder', error);
        throw error;
      }
    },

    getUpcoming: async (days = 7) => {
      try {
        return await getUpcomingMeetings(days);
      } catch (error) {
        logger.error('Failed to get upcoming meetings', error);
        return [];
      }
    },

    refreshTodayMeetings: async () => {
      try {
        const todayMeetings = await getTodayMeetings();
        set({ todayMeetings });
      } catch (error) {
        logger.error('Failed to refresh today meetings', error);
      }
    },

    refreshNextMeeting: async () => {
      try {
        const nextMeeting = await getNextMeeting();
        set({ nextMeeting });
      } catch (error) {
        logger.error('Failed to refresh next meeting', error);
      }
    },

    decryptNotes: async (meeting) => {
      return decryptMeetingNotes(meeting);
    },

    // Utility methods
    getDayName: (dayOfWeek) => getDayName(dayOfWeek),
    getShortDayName: (dayOfWeek) => getShortDayName(dayOfWeek),
    formatTime: (time) => formatMeetingTime(time),
    getTypeIcon: (type) => getMeetingTypeIcon(type),
  }),
);
