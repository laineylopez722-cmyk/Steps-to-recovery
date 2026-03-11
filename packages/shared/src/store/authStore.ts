/**
 * Authentication Store
 * Manages biometric lock state and session
 */

import { create } from 'zustand';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import type { AuthState } from '../types';
import { logger } from '../utils/logger';

const PIN_KEY = 'app_pin_code';

interface AuthStore extends AuthState {
  // Actions
  checkBiometricSupport: () => Promise<boolean>;
  authenticateWithBiometrics: () => Promise<boolean>;
  authenticateWithPin: (pin: string) => Promise<boolean>;
  setPin: (pin: string) => Promise<void>;
  hasPin: () => Promise<boolean>;
  lock: () => void;
  unlock: () => void;
  updateLastActive: () => void;
  checkAutoLock: (autoLockMinutes: number) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  isLocked: true,
  lastActiveAt: null as Date | null,

  checkBiometricSupport: async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  },

  authenticateWithBiometrics: async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your recovery companion',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        set({ isAuthenticated: true, isLocked: false, lastActiveAt: new Date() });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Biometric authentication error', error);
      return false;
    }
  },

  authenticateWithPin: async (pin: string) => {
    try {
      const storedPin = await SecureStore.getItemAsync(PIN_KEY);
      if (storedPin === pin) {
        set({ isAuthenticated: true, isLocked: false, lastActiveAt: new Date() });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('PIN authentication error', error);
      return false;
    }
  },

  setPin: async (pin: string) => {
    await SecureStore.setItemAsync(PIN_KEY, pin);
  },

  hasPin: async () => {
    const pin = await SecureStore.getItemAsync(PIN_KEY);
    return pin !== null;
  },

  lock: () => {
    set({ isLocked: true });
  },

  unlock: () => {
    set({ isLocked: false, lastActiveAt: new Date() });
  },

  updateLastActive: () => {
    set({ lastActiveAt: new Date() });
  },

  checkAutoLock: (autoLockMinutes: number) => {
    const { lastActiveAt, isLocked } = get();

    if (isLocked) return true;
    if (!lastActiveAt) return true;

    const now = new Date();
    const diff = (now.getTime() - lastActiveAt.getTime()) / 1000 / 60;

    if (diff >= autoLockMinutes) {
      set({ isLocked: true });
      return true;
    }

    return false;
  },
}));
