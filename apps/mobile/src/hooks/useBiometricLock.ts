/**
 * Biometric App Lock Hook
 *
 * Manages biometric authentication for app lock functionality.
 * Settings stored in SecureStore (security-critical, never SQLite/AsyncStorage).
 *
 * Features:
 * - Lock/unlock with Face ID or fingerprint
 * - Auto-lock when app goes to background
 * - Configurable lock timeout
 * - PIN fallback support
 *
 * @module hooks/useBiometricLock
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { secureStorage } from '../adapters/secureStorage';
import { logger } from '../utils/logger';

const SETTINGS_KEY = 'biometric_lock_settings';
const PIN_KEY = 'biometric_lock_pin';

export interface BiometricLockSettings {
  enabled: boolean;
  lockOnBackground: boolean;
  lockTimeout: number; // Seconds before re-lock (0 = immediate)
}

const DEFAULT_SETTINGS: BiometricLockSettings = {
  enabled: false,
  lockOnBackground: true,
  lockTimeout: 0,
};

export type BiometricType = 'Face ID' | 'Touch ID' | 'Biometric';

export interface UseBiometricLockReturn {
  /** Whether the app is currently locked */
  isLocked: boolean;
  /** Whether biometric hardware is available */
  isAvailable: boolean;
  /** Current lock settings */
  settings: BiometricLockSettings;
  /** Type of biometric auth available */
  biometricType: BiometricType;
  /** Whether a PIN fallback has been set */
  hasPinSet: boolean;
  /** Enable biometric lock */
  enable: () => Promise<boolean>;
  /** Disable biometric lock */
  disable: () => Promise<void>;
  /** Trigger biometric authentication */
  authenticate: () => Promise<boolean>;
  /** Validate PIN fallback */
  validatePin: (pin: string) => Promise<boolean>;
  /** Set or update PIN fallback */
  setPin: (pin: string) => Promise<void>;
  /** Update lock settings */
  updateSettings: (updates: Partial<BiometricLockSettings>) => Promise<void>;
  /** Manually unlock (for emergency bypass) */
  emergencyUnlock: () => void;
}

export function useBiometricLock(): UseBiometricLockReturn {
  const [isLocked, setIsLocked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [settings, setSettings] = useState<BiometricLockSettings>(DEFAULT_SETTINGS);
  const [biometricType, setBiometricType] = useState<BiometricType>('Biometric');
  const [hasPinSet, setHasPinSet] = useState(false);

  const backgroundTimeRef = useRef<number | null>(null);
  const settingsRef = useRef<BiometricLockSettings>(DEFAULT_SETTINGS);
  const isLockedRef = useRef(false);
  const initializedRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  // Check biometric availability and load settings on mount
  useEffect(() => {
    const initialize = async (): Promise<void> => {
      try {
        const available = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsAvailable(available && enrolled);

        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID');
        }

        // Load saved settings
        const savedSettings = await secureStorage.getItemAsync(SETTINGS_KEY);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings) as BiometricLockSettings;
          setSettings(parsed);
          settingsRef.current = parsed;

          // Lock app on launch if biometric lock is enabled
          if (parsed.enabled) {
            setIsLocked(true);
            isLockedRef.current = true;
          }
        }

        // Check if PIN is set
        const pin = await secureStorage.getItemAsync(PIN_KEY);
        setHasPinSet(pin !== null);

        initializedRef.current = true;
        logger.info('Biometric lock initialized', { available, enrolled });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to initialize biometric lock', { error: message });
      }
    };

    initialize();
  }, []);

  // Handle app state changes for background locking
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus): void => {
      const currentSettings = settingsRef.current;
      if (!currentSettings.enabled || !currentSettings.lockOnBackground) return;

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        backgroundTimeRef.current = Date.now();
      }

      if (nextAppState === 'active' && backgroundTimeRef.current !== null) {
        const elapsed = (Date.now() - backgroundTimeRef.current) / 1000;
        backgroundTimeRef.current = null;

        if (elapsed >= currentSettings.lockTimeout) {
          setIsLocked(true);
          isLockedRef.current = true;
          logger.info('App locked after background timeout', { elapsed });
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const enable = useCallback(async (): Promise<boolean> => {
    try {
      // Verify biometric auth works before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify to enable app lock',
        fallbackLabel: 'Use Passcode',
      });

      if (!result.success) return false;

      const newSettings: BiometricLockSettings = {
        ...settingsRef.current,
        enabled: true,
      };
      await secureStorage.setItemAsync(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      logger.info('Biometric lock enabled');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to enable biometric lock', { error: message });
      return false;
    }
  }, []);

  const disable = useCallback(async (): Promise<void> => {
    try {
      const newSettings: BiometricLockSettings = {
        ...settingsRef.current,
        enabled: false,
      };
      await secureStorage.setItemAsync(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      setIsLocked(false);
      isLockedRef.current = false;
      logger.info('Biometric lock disabled');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to disable biometric lock', { error: message });
    }
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Steps to Recovery',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        setIsLocked(false);
        isLockedRef.current = false;
        logger.info('Biometric authentication successful');
        return true;
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Biometric authentication failed', { error: message });
      return false;
    }
  }, []);

  const validatePin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const storedPin = await secureStorage.getItemAsync(PIN_KEY);
      if (storedPin === pin) {
        setIsLocked(false);
        isLockedRef.current = false;
        logger.info('PIN authentication successful');
        return true;
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('PIN validation failed', { error: message });
      return false;
    }
  }, []);

  const setPin = useCallback(async (pin: string): Promise<void> => {
    try {
      await secureStorage.setItemAsync(PIN_KEY, pin);
      setHasPinSet(true);
      logger.info('PIN set successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to set PIN', { error: message });
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<BiometricLockSettings>): Promise<void> => {
    try {
      const newSettings: BiometricLockSettings = {
        ...settingsRef.current,
        ...updates,
      };
      await secureStorage.setItemAsync(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      logger.info('Biometric lock settings updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update settings', { error: message });
    }
  }, []);

  const emergencyUnlock = useCallback((): void => {
    setIsLocked(false);
    isLockedRef.current = false;
    logger.info('Emergency unlock activated');
  }, []);

  return {
    isLocked,
    isAvailable,
    settings,
    biometricType,
    hasPinSet,
    enable,
    disable,
    authenticate,
    validatePin,
    setPin,
    updateSettings,
    emergencyUnlock,
  };
}
