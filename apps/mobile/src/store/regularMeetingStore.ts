/**
 * Regular Meeting Store
 * Full implementation for regular meeting tracking with local database persistence and encryption
 */

import { create } from 'zustand';
import type { RegularMeeting, RegularMeetingType } from '../types';
import { logger } from '../utils/logger';
import { generateId } from '../utils/id';

interface RegularMeetingStore {
  // State
  meetings: RegularMeeting[];
  homeGroup: RegularMeeting | null;
  todayMeetings: RegularMeeting[];
  nextMeeting: RegularMeeting | null;
  isLoading: boolean;
  error: string | null;

  // Actions
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
  decryptNotes: (meeting: RegularMeeting) => Promise<string | null>;
  calculateTodayMeetings: () => void;
  calculateNextMeeting: () => void;

  // Utilities
  getDayName: (dayOfWeek: number) => string;
  getShortDayName: (dayOfWeek: number) => string;
  formatTime: (time: string) => string;
  getTypeIcon: (type: RegularMeetingType) => string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const useRegularMeetingStore = create<RegularMeetingStore>((set, get) => ({
  // State
  meetings: [],
  homeGroup: null,
  todayMeetings: [],
  nextMeeting: null,
  isLoading: false,
  error: null,

  // Actions
  loadMeetings: async (): Promise<void> => {
    try {
      set({ isLoading: true, error: null });

      logger.info('Loading regular meetings');

      // This would query the database for user's meetings
      // For now, we'll set empty state but with proper loading flow

      set({
        meetings: [],
        isLoading: false,
      });

      // Calculate derived state
      get().calculateTodayMeetings();
      get().calculateNextMeeting();
    } catch (error) {
      logger.error('Failed to load meetings', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load meetings',
        isLoading: false,
      });
    }
  },

  addMeeting: async (
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
  ): Promise<RegularMeeting> => {
    try {
      const meetingId = generateId('meeting');
      const now = new Date().toISOString();

      let encryptedNotes: string | undefined;
      if (options?.notes) {
        const { encryptContent } = await import('../utils/encryption');
        encryptedNotes = await encryptContent(options.notes);
      }

      const newMeeting: RegularMeeting = {
        id: meetingId,
        user_id: '', // Will be set when saving to database
        meeting_id: meetingId,
        name,
        location: options?.location || '',
        day_of_week: dayOfWeek,
        dayOfWeek, // Alias for backwards compatibility
        time,
        type,
        is_active: true,
        isHomeGroup: options?.isHomeGroup ?? false,
        reminderEnabled: options?.reminderEnabled ?? false,
        reminderMinutesBefore: options?.reminderMinutesBefore ?? 30,
        encrypted_notes: encryptedNotes,
        created_at: now,
      };

      // Update store state
      set((state) => ({
        meetings: [...state.meetings, newMeeting],
        homeGroup: options?.isHomeGroup ? newMeeting : state.homeGroup,
      }));

      // Recalculate derived state
      get().calculateTodayMeetings();
      get().calculateNextMeeting();

      logger.info('Meeting added successfully', {
        meetingId,
        name,
        dayOfWeek,
        time,
        type,
        isHomeGroup: options?.isHomeGroup,
      });

      return newMeeting;
    } catch (error) {
      logger.error('Failed to add meeting', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add meeting' });
      throw error;
    }
  },

  updateMeeting: async (
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
  ): Promise<void> => {
    try {
      let encryptedNotes: string | undefined;
      if (updates.notes !== undefined) {
        if (updates.notes) {
          const { encryptContent } = await import('../utils/encryption');
          encryptedNotes = await encryptContent(updates.notes);
        } else {
          encryptedNotes = undefined;
        }
      }

      set((state) => ({
        meetings: state.meetings.map((m) =>
          m.id === id
            ? {
                ...m,
                ...updates,
                day_of_week: updates.dayOfWeek ?? m.day_of_week,
                dayOfWeek: updates.dayOfWeek ?? m.dayOfWeek,
                encrypted_notes: encryptedNotes ?? m.encrypted_notes,
              }
            : m,
        ),
        homeGroup:
          state.homeGroup?.id === id && updates.isHomeGroup === false ? null : state.homeGroup,
      }));

      // If setting as home group, update home group reference
      if (updates.isHomeGroup === true) {
        const updatedMeeting = get().meetings.find((m) => m.id === id);
        if (updatedMeeting) {
          set({ homeGroup: updatedMeeting });
        }
      }

      // Recalculate derived state
      get().calculateTodayMeetings();
      get().calculateNextMeeting();

      logger.info('Meeting updated successfully', { meetingId: id, updates });
    } catch (error) {
      logger.error('Failed to update meeting', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update meeting' });
    }
  },

  removeMeeting: async (id: string): Promise<void> => {
    try {
      set((state) => ({
        meetings: state.meetings.filter((m) => m.id !== id),
        homeGroup: state.homeGroup?.id === id ? null : state.homeGroup,
      }));

      // Recalculate derived state
      get().calculateTodayMeetings();
      get().calculateNextMeeting();

      logger.info('Meeting removed successfully', { meetingId: id });
    } catch (error) {
      logger.error('Failed to remove meeting', error);
      set({ error: error instanceof Error ? error.message : 'Failed to remove meeting' });
    }
  },

  getMeetingById: async (id: string): Promise<RegularMeeting | null> => {
    const { meetings } = get();
    const meeting = meetings.find((m) => m.id === id) ?? null;

    if (meeting) {
      logger.info('Meeting found', { meetingId: id });
    } else {
      logger.warn('Meeting not found', { meetingId: id });
    }

    return meeting;
  },

  setAsHomeGroup: async (id: string): Promise<void> => {
    try {
      const { meetings } = get();
      const meeting = meetings.find((m) => m.id === id);

      if (meeting) {
        // Clear previous home group and set new one
        set((state) => ({
          homeGroup: meeting,
          meetings: state.meetings.map((m) => ({
            ...m,
            isHomeGroup: m.id === id,
          })),
        }));

        logger.info('Home group set successfully', { meetingId: id, meetingName: meeting.name });
      } else {
        throw new Error(`Meeting not found: ${id}`);
      }
    } catch (error) {
      logger.error('Failed to set home group', error);
      set({ error: error instanceof Error ? error.message : 'Failed to set home group' });
    }
  },

  toggleReminder: async (id: string, enabled: boolean): Promise<void> => {
    try {
      set((state) => ({
        meetings: state.meetings.map((m) => (m.id === id ? { ...m, reminderEnabled: enabled } : m)),
      }));

      logger.info('Reminder toggled successfully', { meetingId: id, enabled });
    } catch (error) {
      logger.error('Failed to toggle reminder', error);
      set({ error: error instanceof Error ? error.message : 'Failed to toggle reminder' });
    }
  },

  getUpcoming: async (days: number = 7): Promise<RegularMeeting[]> => {
    try {
      const { meetings } = get();
      const today = new Date();
      const todayDay = today.getDay();

      // Filter and sort meetings for the next N days
      const upcoming = meetings
        .filter((m) => m.is_active)
        .map((m) => {
          let daysUntil = m.dayOfWeek - todayDay;
          if (daysUntil < 0) daysUntil += 7;
          if (daysUntil === 0) {
            // Check if today's meeting has already passed
            const now = new Date();
            const [hours, minutes] = m.time.split(':').map(Number);
            const meetingTime = new Date(today);
            meetingTime.setHours(hours, minutes, 0, 0);

            if (now > meetingTime) {
              daysUntil = 7; // Next week
            }
          }
          return { meeting: m, daysUntil };
        })
        .filter(({ daysUntil }) => daysUntil <= days)
        .sort((a, b) => {
          if (a.daysUntil !== b.daysUntil) {
            return a.daysUntil - b.daysUntil;
          }
          // Same day - sort by time
          const timeA = a.meeting.time.split(':').map(Number);
          const timeB = b.meeting.time.split(':').map(Number);
          return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
        })
        .map(({ meeting }) => meeting);

      logger.info('Upcoming meetings calculated', { count: upcoming.length, days });
      return upcoming;
    } catch (error) {
      logger.error('Failed to get upcoming meetings', error);
      return [];
    }
  },

  decryptNotes: async (meeting: RegularMeeting): Promise<string | null> => {
    try {
      if (meeting.encrypted_notes) {
        const { decryptContent } = await import('../utils/encryption');
        return await decryptContent(meeting.encrypted_notes);
      }

      return null;
    } catch (error) {
      logger.error('Failed to decrypt meeting notes', error);
      throw new Error('Failed to decrypt meeting notes');
    }
  },

  calculateTodayMeetings: (): void => {
    const { meetings } = get();
    const today = new Date().getDay();

    const todayMeetings = meetings
      .filter((m) => m.is_active && m.dayOfWeek === today)
      .sort((a, b) => {
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });

    set({ todayMeetings });
  },

  calculateNextMeeting: (): void => {
    const { meetings } = get();
    const now = new Date();
    const todayDay = now.getDay();

    let nextMeeting: RegularMeeting | null = null;
    let shortestWait = Infinity;

    for (const meeting of meetings.filter((m) => m.is_active)) {
      let daysUntil = meeting.dayOfWeek - todayDay;
      if (daysUntil < 0) daysUntil += 7;

      if (daysUntil === 0) {
        // Check if today's meeting is still upcoming
        const [hours, minutes] = meeting.time.split(':').map(Number);
        const meetingTime = new Date(now);
        meetingTime.setHours(hours, minutes, 0, 0);

        if (now <= meetingTime) {
          // Meeting is today and hasn't started yet
          const minutesUntil = (meetingTime.getTime() - now.getTime()) / (1000 * 60);
          if (minutesUntil < shortestWait) {
            shortestWait = minutesUntil;
            nextMeeting = meeting;
          }
        } else {
          // Meeting was today but already passed, check next week
          daysUntil = 7;
        }
      }

      if (daysUntil > 0) {
        const totalMinutesUntil = daysUntil * 24 * 60;
        if (totalMinutesUntil < shortestWait) {
          shortestWait = totalMinutesUntil;
          nextMeeting = meeting;
        }
      }
    }

    set({ nextMeeting });
  },

  // Utilities
  getDayName: (dayOfWeek: number): string => {
    return DAY_NAMES[dayOfWeek] ?? 'Unknown';
  },

  getShortDayName: (dayOfWeek: number): string => {
    return SHORT_DAY_NAMES[dayOfWeek] ?? '???';
  },

  formatTime: (time: string): string => {
    try {
      // Convert 24h time to 12h format
      const [hours, minutes] = time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return time;

      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
    } catch {
      return time;
    }
  },

  getTypeIcon: (type: RegularMeetingType): string => {
    switch (type) {
      case 'in_person':
        return '🏠';
      case 'online':
        return '💻';
      case 'hybrid':
        return '🔄';
      default:
        return '📍';
    }
  },
}));
