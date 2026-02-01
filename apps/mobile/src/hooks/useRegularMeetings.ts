/**
 * useRegularMeetings Hook
 * Convenient hook for accessing regular meetings functionality
 */

import { useEffect, useCallback } from 'react';
import { useRegularMeetingStore } from '../store/regularMeetingStore';
import type { RegularMeeting, RegularMeetingType } from '../types';

interface UseRegularMeetingsReturn {
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

  // Utilities
  getDayName: (dayOfWeek: number) => string;
  getShortDayName: (dayOfWeek: number) => string;
  formatTime: (time: string) => string;
  getTypeIcon: (type: RegularMeetingType) => string;
  getDaysUntil: (meeting: RegularMeeting) => number;
  getNextOccurrence: (meeting: RegularMeeting) => Date;
}

export function useRegularMeetings(autoLoad = true): UseRegularMeetingsReturn {
  const store = useRegularMeetingStore();

  // Auto-load meetings on mount
  useEffect(() => {
    if (autoLoad && store.meetings.length === 0 && !store.isLoading) {
      store.loadMeetings();
    }
  }, [autoLoad]);

  // Calculate days until a meeting
  const getDaysUntil = useCallback((meeting: RegularMeeting): number => {
    const today = new Date();
    const todayDay = today.getDay();
    let daysUntil = meeting.dayOfWeek - todayDay;

    if (daysUntil < 0) daysUntil += 7;

    // If it's today, check if the time has passed
    if (daysUntil === 0) {
      const [hours, minutes] = meeting.time.split(':').map(Number);
      const meetingTime = new Date(today);
      meetingTime.setHours(hours, minutes, 0, 0);

      if (meetingTime < today) {
        daysUntil = 7; // Next week
      }
    }

    return daysUntil;
  }, []);

  // Get the next occurrence date for a meeting
  const getNextOccurrence = useCallback(
    (meeting: RegularMeeting): Date => {
      const today = new Date();
      const daysUntil = getDaysUntil(meeting);

      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysUntil);

      const [hours, minutes] = meeting.time.split(':').map(Number);
      nextDate.setHours(hours, minutes, 0, 0);

      return nextDate;
    },
    [getDaysUntil],
  );

  return {
    // State
    meetings: store.meetings,
    homeGroup: store.homeGroup,
    todayMeetings: store.todayMeetings,
    nextMeeting: store.nextMeeting,
    isLoading: store.isLoading,
    error: store.error,

    // Actions
    loadMeetings: store.loadMeetings,
    addMeeting: store.addMeeting,
    updateMeeting: store.updateMeeting,
    removeMeeting: store.removeMeeting,
    getMeetingById: store.getMeetingById,
    setAsHomeGroup: store.setAsHomeGroup,
    toggleReminder: store.toggleReminder,
    getUpcoming: store.getUpcoming,
    decryptNotes: store.decryptNotes,

    // Utilities
    getDayName: store.getDayName,
    getShortDayName: store.getShortDayName,
    formatTime: store.formatTime,
    getTypeIcon: store.getTypeIcon,
    getDaysUntil,
    getNextOccurrence,
  };
}
