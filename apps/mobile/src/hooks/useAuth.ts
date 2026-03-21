/**
 * Authentication Hook
 *
 * Manages biometric and PIN authentication for app security.
 * Handles auto-lock based on app state and user settings.
 *
 * **Features**:
 * - Biometric authentication (Face ID, Touch ID, fingerprint)
 * - PIN fallback authentication
 * - Auto-lock on app background
 * - Session management
 *
 * @returns Authentication state and methods
 * @example
 * ```ts
 * const { isAuthenticated, authenticate, lock } = useAuth();
 *
 * if (!isAuthenticated) {
 *   const success = await authenticate();
 *   if (!success) {
 *     // Show PIN input
 *   }
 * }
 * ```
 */

import { useCallback, useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuthStore } from '@/shared';
import { useSettingsStore } from '@/shared';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLocked: boolean;
  authenticate: () => Promise<boolean>;
  authenticateWithPin: (pin: string) => Promise<boolean>;
  setPin: (pin: string) => Promise<void>;
  hasPin: () => Promise<boolean>;
  lock: () => void;
  unlock: () => void;
  checkBiometricSupport: () => Promise<boolean>;
}

/**
 * Authentication hook
 *
 * Provides authentication state and methods for securing the app.
 * Automatically handles app state changes for auto-lock functionality.
 *
 * @returns Object with authentication state and methods
 */
export function useAuth(): UseAuthReturn {
  const {
    isAuthenticated,
    isLocked,
    checkBiometricSupport,
    authenticateWithBiometrics,
    authenticateWithPin,
    setPin,
    hasPin,
    lock,
    unlock,
    updateLastActive,
    checkAutoLock,
  } = useAuthStore();

  const { settings } = useSettingsStore();

  // Handle app state changes for auto-lock
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground
        if (settings) {
          checkAutoLock(settings.autoLockMinutes);
        }
      } else if (nextAppState === 'background') {
        // App went to background - update last active time
        updateLastActive();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [settings, checkAutoLock, updateLastActive]);

  // Authenticate user
  const authenticate = useCallback(async (): Promise<boolean> => {
    // First try biometrics if supported
    const biometricSupported = await checkBiometricSupport();

    if (biometricSupported && settings?.biometricEnabled) {
      const success = await authenticateWithBiometrics();
      if (success) return true;
    }

    // Fall back to PIN
    return false; // Caller should show PIN input
  }, [checkBiometricSupport, authenticateWithBiometrics, settings]);

  return {
    isAuthenticated,
    isLocked,
    authenticate,
    authenticateWithPin,
    setPin,
    hasPin,
    lock,
    unlock,
    checkBiometricSupport,
  };
}
