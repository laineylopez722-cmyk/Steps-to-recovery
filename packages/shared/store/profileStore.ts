/**
 * Profile Store
 * Manages sobriety profile and recovery metrics
 */

import { create } from 'zustand';
import type { SobrietyProfile, ProgramType } from '../types';
import {
  createSobrietyProfile,
  getSobrietyProfile,
  updateSobrietyProfile,
  deleteSobrietyProfile,
} from '../db/models';

interface ProfileStore {
  profile: SobrietyProfile | null;
  isLoading: boolean;
  error: string | null;

  // Computed values
  soberDays: number;
  soberHours: number;
  soberMinutes: number;

  // Actions
  loadProfile: () => Promise<void>;
  createProfile: (
    sobrietyDate: Date,
    programType: ProgramType,
    displayName?: string,
  ) => Promise<void>;
  updateProfile: (
    updates: Partial<Pick<SobrietyProfile, 'sobrietyDate' | 'programType' | 'displayName'>>,
  ) => Promise<void>;
  deleteProfile: () => Promise<void>;
  calculateSobriety: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,
  soberDays: 0,
  soberHours: 0,
  soberMinutes: 0,

  loadProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await getSobrietyProfile();
      set({ profile, isLoading: false });
      get().calculateSobriety();
    } catch (error) {
      set({ error: 'Failed to load profile', isLoading: false });
    }
  },

  createProfile: async (sobrietyDate: Date, programType: ProgramType, displayName?: string) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await createSobrietyProfile(sobrietyDate, programType, displayName);
      set({ profile, isLoading: false });
      get().calculateSobriety();
    } catch (error) {
      set({ error: 'Failed to create profile', isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      await updateSobrietyProfile(updates);
      const profile = await getSobrietyProfile();
      set({ profile, isLoading: false });
      get().calculateSobriety();
    } catch (error) {
      set({ error: 'Failed to update profile', isLoading: false });
    }
  },

  deleteProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      await deleteSobrietyProfile();
      set({ profile: null, isLoading: false, soberDays: 0, soberHours: 0, soberMinutes: 0 });
    } catch (error) {
      set({ error: 'Failed to delete profile', isLoading: false });
    }
  },

  calculateSobriety: () => {
    const { profile } = get();
    if (!profile) {
      set({ soberDays: 0, soberHours: 0, soberMinutes: 0 });
      return;
    }

    const now = new Date();
    const sobrietyDate = new Date(profile.sobrietyDate);
    const diff = now.getTime() - sobrietyDate.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    set({
      soberDays: days,
      soberHours: hours,
      soberMinutes: minutes,
    });
  },
}));
