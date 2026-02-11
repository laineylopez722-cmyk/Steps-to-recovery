/**
 * useGeofencing Hook
 *
 * Manages meeting geofencing lifecycle: enables/disables geofencing,
 * registers geofences for favorite meetings, and persists preferences.
 *
 * Settings stored in SecureStore (location data is sensitive).
 *
 * @module hooks/useGeofencing
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { secureStorage } from '../adapters/secureStorage';
import { logger } from '../utils/logger';
import {
  registerMeetingGeofences,
  unregisterAllGeofences,
  isGeofencingActive,
  getGeofencePermissionStatus,
  requestGeofencePermissions,
  type GeofenceMeeting,
  type GeofencePermissionStatus,
} from '../services/geofenceService';

// ── Types ──────────────────────────────────────────────────────────

export type GeofenceRadius = 100 | 250 | 500;

export interface GeofenceSettings {
  enabled: boolean;
  radius: GeofenceRadius;
}

export interface UseGeofencingReturn {
  /** Whether geofencing is enabled by the user */
  isEnabled: boolean;
  /** Toggle geofencing on/off */
  setEnabled: (enabled: boolean) => Promise<void>;
  /** Whether the device supports geofencing */
  isSupported: boolean;
  /** Number of currently registered geofences */
  registeredCount: number;
  /** Current geofence radius in meters */
  radius: GeofenceRadius;
  /** Update the geofence radius */
  setRadius: (radius: GeofenceRadius) => Promise<void>;
  /** Current permission status */
  permissionStatus: GeofencePermissionStatus;
  /** Request background location permission */
  requestPermission: () => Promise<boolean>;
  /** Re-register geofences (e.g. after favorites change) */
  refresh: (meetings: GeofenceMeeting[]) => Promise<void>;
  /** Whether the settings are still loading */
  isLoading: boolean;
}

// ── Constants ──────────────────────────────────────────────────────

const SETTINGS_KEY = 'geofence_settings';

const DEFAULT_SETTINGS: GeofenceSettings = {
  enabled: false,
  radius: 250,
};

// ── Persistence ────────────────────────────────────────────────────

async function loadSettings(): Promise<GeofenceSettings> {
  try {
    const stored = await secureStorage.getItemAsync(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } as GeofenceSettings;
    }
  } catch (err: unknown) {
    logger.error('Failed to load geofence settings', err);
  }
  return { ...DEFAULT_SETTINGS };
}

async function saveSettings(settings: GeofenceSettings): Promise<void> {
  try {
    await secureStorage.setItemAsync(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err: unknown) {
    logger.error('Failed to save geofence settings', err);
  }
}

// ── Hook ───────────────────────────────────────────────────────────

export function useGeofencing(): UseGeofencingReturn {
  const [settings, setSettings] = useState<GeofenceSettings>(DEFAULT_SETTINGS);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [permissionStatus, setPermissionStatus] =
    useState<GeofencePermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  const isSupported = Platform.OS !== 'web';
  const meetingsRef = useRef<GeofenceMeeting[]>([]);

  // Load persisted settings and check permission on mount
  useEffect(() => {
    let cancelled = false;

    const init = async (): Promise<void> => {
      const [loaded, permStatus, active] = await Promise.all([
        loadSettings(),
        isSupported ? getGeofencePermissionStatus() : Promise.resolve('denied' as const),
        isSupported ? isGeofencingActive() : Promise.resolve(false),
      ]);

      if (cancelled) return;

      setSettings(loaded);
      setPermissionStatus(permStatus);
      // If geofencing was active but settings say disabled, stop it
      if (active && !loaded.enabled) {
        await unregisterAllGeofences();
      }
      setIsLoading(false);
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, [isSupported]);

  // Register / unregister geofences when settings or meetings change
  const syncGeofences = useCallback(
    async (meetings: GeofenceMeeting[], opts: GeofenceSettings): Promise<void> => {
      if (!isSupported) return;

      if (!opts.enabled) {
        await unregisterAllGeofences();
        setRegisteredCount(0);
        return;
      }

      const count = await registerMeetingGeofences(meetings, {
        radius: opts.radius,
      });
      setRegisteredCount(count);
    },
    [isSupported],
  );

  const setEnabled = useCallback(
    async (enabled: boolean): Promise<void> => {
      // If enabling, ensure permissions are granted
      if (enabled) {
        let status = permissionStatus;
        if (status !== 'granted') {
          status = await requestGeofencePermissions();
          setPermissionStatus(status);
        }
        if (status !== 'granted') {
          logger.warn('Cannot enable geofencing: permission not granted');
          return;
        }
      }

      const updated: GeofenceSettings = { ...settings, enabled };
      setSettings(updated);
      await saveSettings(updated);
      await syncGeofences(meetingsRef.current, updated);
    },
    [settings, permissionStatus, syncGeofences],
  );

  const setRadius = useCallback(
    async (radius: GeofenceRadius): Promise<void> => {
      const updated: GeofenceSettings = { ...settings, radius };
      setSettings(updated);
      await saveSettings(updated);

      // Re-register with new radius if enabled
      if (updated.enabled) {
        await syncGeofences(meetingsRef.current, updated);
      }
    },
    [settings, syncGeofences],
  );

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const status = await requestGeofencePermissions();
    setPermissionStatus(status);
    return status === 'granted';
  }, []);

  const refresh = useCallback(
    async (meetings: GeofenceMeeting[]): Promise<void> => {
      meetingsRef.current = meetings;
      if (settings.enabled) {
        await syncGeofences(meetings, settings);
      }
    },
    [settings, syncGeofences],
  );

  return {
    isEnabled: settings.enabled,
    setEnabled,
    isSupported,
    registeredCount,
    radius: settings.radius,
    setRadius,
    permissionStatus,
    requestPermission,
    refresh,
    isLoading,
  };
}
