/**
 * Meeting Tracker Hook
 * Provides meeting data and insights for UI components
 */

import { useEffect, useMemo } from 'react';
import { useMeetingStore } from '@recovery/shared';
import type { MeetingLog, MeetingType } from '@recovery/shared';

interface MeetingInsights {
  totalMeetings: number;
  meetingsThisMonth: number;
  meetingsThisWeek: number;
  averageMoodImprovement: number;
  mostCommonTopic: string | null;
  lastMeetingDate: Date | null;
  daysSinceLastMeeting: number | null;
  shareRate: number;
}

interface UseMeetingsReturn {
  meetings: MeetingLog[];
  isLoading: boolean;
  insights: MeetingInsights;
  recentMeetings: MeetingLog[];
  inPersonMeetings: MeetingLog[];
  onlineMeetings: MeetingLog[];
  meetingStreak: number;
  allTopics: string[];
  moodImprovementPercentage: number;
  loadMeetings: ReturnType<typeof useMeetingStore.getState>['loadMeetings'];
  createMeeting: ReturnType<typeof useMeetingStore.getState>['createMeeting'];
  updateMeeting: ReturnType<typeof useMeetingStore.getState>['updateMeeting'];
  deleteMeeting: (id: string) => Promise<void>;
  getMeetingById: (id: string) => Promise<MeetingLog | null>;
  getMeetingsByTopic: (topic: string) => MeetingLog[];
  getMeetingsInRange: (startDate: Date, endDate: Date) => MeetingLog[];
  getTypeLabel: (type: MeetingType) => string;
  formatMeetingDate: (date: Date) => string;
}

export function useMeetings(): UseMeetingsReturn {
  const {
    meetings,
    isLoading,
    insights,
    loadMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    getMeetingById,
  } = useMeetingStore();

  // Load meetings on mount
  useEffect(() => {
    loadMeetings();
  }, []);

  // Filter and sort options
  const recentMeetings = useMemo(() => meetings.slice(0, 5), [meetings]);

  const inPersonMeetings = useMemo(
    () => meetings.filter((m) => m.type === 'in-person'),
    [meetings],
  );

  const onlineMeetings = useMemo(() => meetings.filter((m) => m.type === 'online'), [meetings]);

  // Calculate streak (consecutive weeks with at least one meeting)
  const meetingStreak = useMemo(() => {
    if (meetings.length === 0) return 0;

    const now = new Date();
    let streak = 0;
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay()); // Start of current week
    currentWeekStart.setHours(0, 0, 0, 0);

    // Check each week going backwards
    while (true) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 7);

      const meetingsInWeek = meetings.filter((m) => {
        const attendedDate = new Date(m.attendedAt);
        return attendedDate >= currentWeekStart && attendedDate < weekEnd;
      });

      if (meetingsInWeek.length === 0 && streak > 0) {
        break;
      }

      if (meetingsInWeek.length > 0) {
        streak++;
      }

      // Move to previous week
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);

      // Safety limit
      if (streak > 52) break;
    }

    return streak;
  }, [meetings]);

  // Get meetings by topic
  const getMeetingsByTopic = (topic: string): MeetingLog[] => {
    return meetings.filter((m) => m.topicTags.includes(topic));
  };

  // Get all unique topics
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    meetings.forEach((m) => m.topicTags.forEach((t) => topics.add(t)));
    return Array.from(topics).sort();
  }, [meetings]);

  // Get meetings in date range
  const getMeetingsInRange = (startDate: Date, endDate: Date): MeetingLog[] => {
    return meetings.filter((m) => {
      const attended = new Date(m.attendedAt);
      return attended >= startDate && attended <= endDate;
    });
  };

  // Calculate mood improvement percentage
  const moodImprovementPercentage = useMemo(() => {
    if (meetings.length === 0) return 0;

    const improvements = meetings.filter((m) => m.moodAfter > m.moodBefore);
    return Math.round((improvements.length / meetings.length) * 100);
  }, [meetings]);

  // Get type label
  const getTypeLabel = (type: MeetingType): string => {
    switch (type) {
      case 'in-person':
        return 'In Person';
      case 'online':
        return 'Online';
      default:
        return type;
    }
  };

  // Format meeting date
  const formatMeetingDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return {
    // State
    meetings,
    isLoading,
    insights,

    // Derived data
    recentMeetings,
    inPersonMeetings,
    onlineMeetings,
    meetingStreak,
    allTopics,
    moodImprovementPercentage,

    // Actions
    loadMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    getMeetingById,

    // Utilities
    getMeetingsByTopic,
    getMeetingsInRange,
    getTypeLabel,
    formatMeetingDate,
  };
}
