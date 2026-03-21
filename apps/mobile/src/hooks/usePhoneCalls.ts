/**
 * Phone Calls Hook
 * Provides phone call tracking data and actions for UI components
 */

import { useEffect, useMemo, useCallback } from 'react';
import { usePhoneStore, useContactStore } from '@/shared';
import type { PhoneCallLog, RecoveryContact } from '@/shared';

interface PhoneStats {
  todayCallCount: number;
  weekCallCount: number;
  totalCallMinutes: number;
  dailyGoal: number;
  goalProgress: number;
}

interface UsePhoneCallsReturn {
  todayCalls: PhoneCallLog[];
  callHistory: PhoneCallLog[];
  isLoading: boolean;
  error: string | null;
  stats: PhoneStats;
  hasCalledToday: boolean;
  isMeetingGoal: boolean;
  recentlyCalledContacts: PhoneCallLog[];
  callsByDate: Record<string, PhoneCallLog[]>;
  loadTodayCalls: () => Promise<void>;
  loadCallHistory: (limit?: number) => Promise<void>;
  logCall: (contactId: string, contactName: string, duration?: number, notes?: string) => Promise<PhoneCallLog>;
  logCallWithContact: (contact: RecoveryContact, duration?: number, notes?: string) => Promise<PhoneCallLog>;
  deleteCall: (id: string) => Promise<void>;
  getCallsByContact: (contactId: string) => Promise<PhoneCallLog[]>;
  decryptCallNotes: (call: PhoneCallLog) => Promise<string | null>;
  getCallCountForContact: (contactId: string) => number;
  formatCallTime: (call: PhoneCallLog) => string;
  formatCallDate: (call: PhoneCallLog) => string;
  formatDuration: (minutes?: number) => string;
  getContactForCall: (call: PhoneCallLog) => RecoveryContact | undefined;
}

export function usePhoneCalls(): UsePhoneCallsReturn {
  const {
    todayCalls,
    callHistory,
    isLoading,
    error,
    loadTodayCalls,
    loadCallHistory,
    logCall,
    deleteCall,
    getCallsByContact,
    getStats,
    decryptCallNotes,
  } = usePhoneStore();

  const { contacts } = useContactStore();

  // Load today's calls on mount
  useEffect(() => {
    loadTodayCalls();
  }, []);

  // Get stats
  const stats = useMemo(() => getStats(), [todayCalls, callHistory]);

  // Get recent unique contacts called
  const recentlyCalledContacts = useMemo(() => {
    const seen = new Set<string>();
    const recent: PhoneCallLog[] = [];

    for (const call of callHistory) {
      if (!seen.has(call.contactId) && recent.length < 5) {
        seen.add(call.contactId);
        recent.push(call);
      }
    }

    return recent;
  }, [callHistory]);

  // Log a call with a contact
  const logCallWithContact = useCallback(
    async (contact: RecoveryContact, duration?: number, notes?: string) => {
      return logCall(contact.id, contact.name, duration, notes);
    },
    [logCall],
  );

  // Get call count for a specific contact
  const getCallCountForContact = useCallback(
    (contactId: string): number => {
      return callHistory.filter((call) => call.contactId === contactId).length;
    },
    [callHistory],
  );

  // Check if called today
  const hasCalledToday = useMemo(() => todayCalls.length > 0, [todayCalls]);

  // Check if meeting daily goal
  const isMeetingGoal = useMemo(() => stats.todayCallCount >= stats.dailyGoal, [stats]);

  // Format call time
  const formatCallTime = useCallback((call: PhoneCallLog): string => {
    const date = new Date(call.calledAt);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  // Format call date
  const formatCallDate = useCallback((call: PhoneCallLog): string => {
    const date = new Date(call.calledAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Format duration
  const formatDuration = useCallback((minutes?: number): string => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, []);

  // Get contact for a call (from store)
  const getContactForCall = useCallback(
    (call: PhoneCallLog): RecoveryContact | undefined => {
      return contacts.find((c) => c.id === call.contactId);
    },
    [contacts],
  );

  // Calls grouped by date
  const callsByDate = useMemo(() => {
    const grouped: Record<string, PhoneCallLog[]> = {};

    callHistory.forEach((call) => {
      const date = new Date(call.calledAt).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(call);
    });

    return grouped;
  }, [callHistory]);

  return {
    // State
    todayCalls,
    callHistory,
    isLoading,
    error,

    // Stats
    stats,
    hasCalledToday,
    isMeetingGoal,

    // Derived data
    recentlyCalledContacts,
    callsByDate,

    // Actions
    loadTodayCalls,
    loadCallHistory,
    logCall,
    logCallWithContact,
    deleteCall,
    getCallsByContact,
    decryptCallNotes,

    // Utilities
    getCallCountForContact,
    formatCallTime,
    formatCallDate,
    formatDuration,
    getContactForCall,
  };
}
