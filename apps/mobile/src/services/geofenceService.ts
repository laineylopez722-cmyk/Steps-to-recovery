/**
 * Geofence Service
 *
 * Manages geofencing for meeting locations using expo-location
 * and expo-task-manager. Sends local notifications when the user
 * enters a meeting area.
 *
 * Background location permission ("Allow all the time") is required
 * for geofencing to work when the app is not in the foreground.
 *
 * @module services/geofenceService
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';

const GEOFENCE_TASK = 'meeting-geofence-task';

// ── Types ──────────────────────────────────────────────────────────

export interface GeofenceMeeting {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface GeofenceOptions {
  /** Radius in meters (default: 250) */
  radius?: number;
  /** Notify when entering region (default: true) */
  notifyOnEnter?: boolean;
  /** Notify when exiting region (default: false) */
  notifyOnExit?: boolean;
}

export type GeofencePermissionStatus =
  | 'granted'
  | 'foreground_only'
  | 'denied'
  | 'undetermined';

// ── Background Task ────────────────────────────────────────────────

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    logger.error('Geofence task error', error);
    return;
  }

  if (!data) {
    return;
  }

  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };

  if (eventType === Location.GeofencingEventType.Enter) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "You're near a meeting!",
          body: `${region.identifier} is nearby. Stay strong! 💪`,
          data: {
            type: 'geofence_enter',
            meetingName: region.identifier,
          },
        },
        trigger: null,
      });
    } catch (err: unknown) {
      logger.error('Failed to schedule geofence notification', err);
    }

    logger.info('Geofence entered', { meeting: region.identifier });
  } else if (eventType === Location.GeofencingEventType.Exit) {
    logger.info('Geofence exited', { meeting: region.identifier });
  }
});

// ── Permission Helpers ─────────────────────────────────────────────

/**
 * Check the current geofence-related permission status.
 * Geofencing requires background location ("Allow all the time").
 */
export async function getGeofencePermissionStatus(): Promise<GeofencePermissionStatus> {
  if (Platform.OS === 'web') {
    return 'denied';
  }

  const foreground = await Location.getForegroundPermissionsAsync();
  if (!foreground.granted) {
    return foreground.canAskAgain ? 'undetermined' : 'denied';
  }

  const background = await Location.getBackgroundPermissionsAsync();
  if (!background.granted) {
    return 'foreground_only';
  }

  return 'granted';
}

/**
 * Request foreground and background location permissions.
 * Returns the resulting permission status.
 */
export async function requestGeofencePermissions(): Promise<GeofencePermissionStatus> {
  if (Platform.OS === 'web') {
    return 'denied';
  }

  // Foreground first (required before background on both platforms)
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) {
    logger.warn('Foreground location permission denied');
    return 'denied';
  }

  // Background permission for geofencing
  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) {
    logger.warn('Background location permission denied – geofencing limited');
    return 'foreground_only';
  }

  return 'granted';
}

// ── Geofence Management ────────────────────────────────────────────

/**
 * Register geofences for an array of meetings.
 * Replaces any previously registered geofences.
 */
export async function registerMeetingGeofences(
  meetings: GeofenceMeeting[],
  options: GeofenceOptions = {},
): Promise<number> {
  if (Platform.OS === 'web') {
    logger.info('Geofencing not supported on web');
    return 0;
  }

  if (meetings.length === 0) {
    logger.info('No meetings to register geofences for');
    return 0;
  }

  const {
    radius = 250,
    notifyOnEnter = true,
    notifyOnExit = false,
  } = options;

  // Verify permissions
  const permStatus = await getGeofencePermissionStatus();
  if (permStatus !== 'granted') {
    logger.warn('Cannot register geofences: background location not granted', {
      status: permStatus,
    });
    return 0;
  }

  // Filter meetings with valid coordinates
  const validMeetings = meetings.filter(
    (m) =>
      typeof m.latitude === 'number' &&
      typeof m.longitude === 'number' &&
      !isNaN(m.latitude) &&
      !isNaN(m.longitude),
  );

  if (validMeetings.length === 0) {
    logger.warn('No meetings with valid coordinates for geofencing');
    return 0;
  }

  const regions: Location.LocationRegion[] = validMeetings.map((m) => ({
    identifier: m.name,
    latitude: m.latitude,
    longitude: m.longitude,
    radius,
    notifyOnEnter,
    notifyOnExit,
  }));

  try {
    await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
    logger.info('Geofences registered', {
      count: regions.length,
      radius,
    });
    return regions.length;
  } catch (err: unknown) {
    logger.error('Failed to register geofences', err);
    return 0;
  }
}

/**
 * Unregister all meeting geofences.
 */
export async function unregisterAllGeofences(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const isActive = await isGeofencingActive();
    if (isActive) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
      logger.info('All geofences unregistered');
    }
  } catch (err: unknown) {
    logger.error('Failed to unregister geofences', err);
  }
}

/**
 * Check whether geofencing is currently active.
 */
export async function isGeofencingActive(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    return await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
  } catch {
    return false;
  }
}
