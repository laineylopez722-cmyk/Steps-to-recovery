/**
 * Phone Store
 * Manages phone call logs for fellowship connection tracking
 */

import { create } from 'zustand';
import type { PhoneCallLog } from '../types';
import {
  createPhoneCallLog,
  getPhoneCallLogs,
  getTodayCallLogs,
  getCallLogsByContact,
  deletePhoneCallLog,
} from '../db/models';
import { decryptContent } from '../encryption';
import { logger } from '../utils/logger';

interface PhoneState {
  todayCalls: PhoneCallLog[];
  callHistory: PhoneCallLog[];
  isLoading: boolean;
  error: string | null;
}

interface PhoneStats {
  todayCallCount: number;
  weekCallCount: number;
  totalCallMinutes: number;
  dailyGoal: number;
  goalProgress: number;
}

interface PhoneActions {
  loadTodayCalls: () => Promise<void>;
  loadCallHistory: (limit?: number) => Promise<void>;
  logCall: (
    contactId: string,
    contactName: string,
    duration?: number,
    notes?: string,
  ) => Promise<PhoneCallLog>;
  deleteCall: (id: string) => Promise<void>;
  getCallsByContact: (contactId: string) => Promise<PhoneCallLog[]>;
  getStats: () => PhoneStats;
  decryptCallNotes: (call: PhoneCallLog) => Promise<string | null>;
}

const DEFAULT_DAILY_GOAL = 3;

export const usePhoneStore = create<PhoneState & PhoneActions>((set, get) => ({
  todayCalls: [],
  callHistory: [],
  isLoading: false,
  error: null,

  loadTodayCalls: async () => {
    set({ isLoading: true, error: null });
    try {
      const todayCalls = await getTodayCallLogs();
      set({ todayCalls, isLoading: false });
    } catch (error) {
      logger.error('Failed to load today\'s calls', error);
      set({ error: 'Failed to load calls', isLoading: false });
    }
  },

  loadCallHistory: async (limit = 50) => {
    set({ isLoading: true, error: null });
    try {
      const callHistory = await getPhoneCallLogs(limit);
      // Also load today's calls if not already loaded
      const todayCalls = await getTodayCallLogs();
      set({ callHistory, todayCalls, isLoading: false });
    } catch (error) {
      logger.error('Failed to load call history', error);
      set({ error: 'Failed to load call history', isLoading: false });
    }
  },

  logCall: async (contactId, contactName, duration, notes) => {
    try {
      const call = await createPhoneCallLog(contactId, contactName, duration, notes);

      set((state) => ({
        todayCalls: [call, ...state.todayCalls],
        callHistory: [call, ...state.callHistory],
      }));

      return call;
    } catch (error) {
      logger.error('Failed to log call', error);
      throw error;
    }
  },

  deleteCall: async (id) => {
    try {
      await deletePhoneCallLog(id);

      set((state) => ({
        todayCalls: state.todayCalls.filter((c) => c.id !== id),
        callHistory: state.callHistory.filter((c) => c.id !== id),
      }));
    } catch (error) {
      logger.error('Failed to delete call', error);
      throw error;
    }
  },

  getCallsByContact: async (contactId) => {
    try {
      return await getCallLogsByContact(contactId);
    } catch (error) {
      logger.error('Failed to get calls for contact', error);
      return [];
    }
  },

  getStats: () => {
    const { todayCalls, callHistory } = get();

    // Today's count
    const todayCallCount = todayCalls.length;

    // This week's count
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const weekCallCount = callHistory.filter((call) => new Date(call.calledAt) >= weekAgo).length;

    // Total minutes (from calls with duration recorded)
    const totalCallMinutes = callHistory.reduce((sum, call) => sum + (call.duration || 0), 0);

    // Goal progress
    const dailyGoal = DEFAULT_DAILY_GOAL;
    const goalProgress = Math.min(1, todayCallCount / dailyGoal);

    return {
      todayCallCount,
      weekCallCount,
      totalCallMinutes,
      dailyGoal,
      goalProgress,
    };
  },

  decryptCallNotes: async (call) => {
    if (!call.notes) return null;
    try {
      return await decryptContent(call.notes);
    } catch (error) {
      logger.error('Failed to decrypt call notes', error);
      return null;
    }
  },
}));
