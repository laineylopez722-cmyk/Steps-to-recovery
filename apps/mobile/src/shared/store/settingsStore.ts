/**
 * Settings Store
 * Manages app settings and preferences
 */

import { create } from 'zustand';
import type { AppSettings, ThemeMode, CrisisRegion } from '../types';
import { getAppSettings, createOrUpdateAppSettings } from '../db/models';
import {
  scheduleDailyCheckinReminder,
  cancelDailyCheckinReminder,
  requestNotificationPermissions,
} from '../notifications';

interface SettingsStore {
  settings: AppSettings | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (
    updates: Partial<Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => Promise<void>;
  setCheckInTime: (time: string) => Promise<void>;
  setAutoLockMinutes: (minutes: number) => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<boolean>;
  setCrisisRegion: (region: CrisisRegion) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      let settings = await getAppSettings();

      // Create default settings if none exist
      if (!settings) {
        settings = await createOrUpdateAppSettings({
          checkInTime: '09:00',
          autoLockMinutes: 5,
          biometricEnabled: true,
          themeMode: 'system',
          notificationsEnabled: true,
        });
      }

      set({ settings, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load settings', isLoading: false });
    }
  },

  updateSettings: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const settings = await createOrUpdateAppSettings(updates);
      set({ settings, isLoading: false });

      // Handle notification scheduling when relevant settings change
      if (updates.notificationsEnabled !== undefined || updates.checkInTime !== undefined) {
        const enabled = updates.notificationsEnabled ?? settings.notificationsEnabled;
        const checkInTime = updates.checkInTime ?? settings.checkInTime;

        if (enabled) {
          await scheduleDailyCheckinReminder(checkInTime);
        } else {
          await cancelDailyCheckinReminder();
        }
      }
    } catch (error) {
      set({ error: 'Failed to update settings', isLoading: false });
    }
  },

  setCheckInTime: async (time: string) => {
    await get().updateSettings({ checkInTime: time });
  },

  setAutoLockMinutes: async (minutes: number) => {
    await get().updateSettings({ autoLockMinutes: minutes });
  },

  setBiometricEnabled: async (enabled: boolean) => {
    await get().updateSettings({ biometricEnabled: enabled });
  },

  setThemeMode: async (mode: ThemeMode) => {
    await get().updateSettings({ themeMode: mode });
  },

  setNotificationsEnabled: async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        return false;
      }
    }
    await get().updateSettings({ notificationsEnabled: enabled });
    return true;
  },

  setCrisisRegion: async (region: CrisisRegion) => {
    await get().updateSettings({ crisisRegion: region });
  },
}));
