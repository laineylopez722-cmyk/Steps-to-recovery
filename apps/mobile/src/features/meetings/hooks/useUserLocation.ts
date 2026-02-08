/**
 * useUserLocation Hook
 * Handles location permissions and current user position
 * Progressive permission disclosure - only asks when needed
 *
 * Supports both foreground (meeting search) and background (geofencing) permissions
 */

import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { logger } from '../../../utils/logger';
import type { SearchLocation } from '../types/meeting';
import { validateCoordinates } from '../services/meetingGuideApi';

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

export interface BackgroundPermissionStatus {
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  canAskAgain: boolean;
}

export interface LocationState {
  location: SearchLocation | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: LocationPermissionStatus | null;
  backgroundPermissionStatus: BackgroundPermissionStatus | null;
}

export interface UseUserLocationReturn {
  location: SearchLocation | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: LocationPermissionStatus | null;
  backgroundPermissionStatus: BackgroundPermissionStatus | null;
  requestLocation: () => Promise<SearchLocation | null>;
  requestBackgroundPermission: () => Promise<boolean>;
  clearError: () => void;
}

/**
 * Hook to manage user location permissions and current position
 * @returns Location state and control functions
 */
export function useUserLocation(): UseUserLocationReturn {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: false,
    error: null,
    permissionStatus: null,
    backgroundPermissionStatus: null,
  });

  /**
   * Clear error message
   */
  const clearError = useCallback((): void => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Request location permission and get current position
   * @returns Current location or null if denied/failed
   */
  const requestLocation = useCallback(async (): Promise<SearchLocation | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check current permission status
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();

      logger.info('Location permission status', { status: currentStatus });

      // Request permission if not granted
      if (currentStatus !== Location.PermissionStatus.GRANTED) {
        const { status: newStatus, canAskAgain } =
          await Location.requestForegroundPermissionsAsync();

        setState((prev) => ({
          ...prev,
          permissionStatus: {
            granted: newStatus === Location.PermissionStatus.GRANTED,
            canAskAgain,
          },
        }));

        if (newStatus !== Location.PermissionStatus.GRANTED) {
          const errorMsg = canAskAgain
            ? 'Location permission denied. Please enable location access to find nearby meetings.'
            : 'Location permission permanently denied. Please enable location in your device settings.';

          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: errorMsg,
          }));

          logger.warn('Location permission denied', {
            status: newStatus,
            canAskAgain,
          });

          return null;
        }
      } else {
        setState((prev) => ({
          ...prev,
          permissionStatus: { granted: true, canAskAgain: true },
        }));
      }

      // Get current position
      logger.info('Getting current location');

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Good balance of accuracy and battery
      });

      const { latitude, longitude } = position.coords;

      // Validate coordinates
      if (!validateCoordinates(latitude, longitude)) {
        throw new Error('Invalid coordinates received from device');
      }

      const location: SearchLocation = {
        latitude,
        longitude,
      };

      setState((prev) => ({
        ...prev,
        location,
        isLoading: false,
        error: null,
      }));

      logger.info('Location retrieved successfully', {
        latitude: latitude.toFixed(4),
        longitude: longitude.toFixed(4),
      });

      return location;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to get current location. Please try again.';

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      logger.warn('Failed to get user location', error);
      return null;
    }
  }, []);

  /**
   * Request background location permission for geofencing
   * Must be called AFTER foreground permission is granted
   *
   * Android 10+ requires separate background permission request
   * Android 12+ shows "Allow all the time" in a separate dialog
   *
   * @returns true if background permission granted
   */
  const requestBackgroundPermission = useCallback(async (): Promise<boolean> => {
    try {
      // First ensure foreground permission is granted
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();

      if (foregroundStatus !== Location.PermissionStatus.GRANTED) {
        logger.warn('Background permission requested without foreground permission');
        setState((prev) => ({
          ...prev,
          backgroundPermissionStatus: {
            foregroundGranted: false,
            backgroundGranted: false,
            canAskAgain: true,
          },
          error: 'Please grant location permission first before enabling background access.',
        }));
        return false;
      }

      // Check current background permission status
      const { status: currentBackgroundStatus } = await Location.getBackgroundPermissionsAsync();

      logger.info('Background permission status', { status: currentBackgroundStatus });

      if (currentBackgroundStatus === Location.PermissionStatus.GRANTED) {
        setState((prev) => ({
          ...prev,
          backgroundPermissionStatus: {
            foregroundGranted: true,
            backgroundGranted: true,
            canAskAgain: false,
          },
        }));
        return true;
      }

      // Request background permission (Android 10+ shows separate dialog)
      const { status: newStatus, canAskAgain } = await Location.requestBackgroundPermissionsAsync();

      const backgroundGranted = newStatus === Location.PermissionStatus.GRANTED;

      setState((prev) => ({
        ...prev,
        backgroundPermissionStatus: {
          foregroundGranted: true,
          backgroundGranted,
          canAskAgain,
        },
        error: backgroundGranted
          ? null
          : 'Background location needed for meeting reminders. Enable "Allow all the time" in settings.',
      }));

      logger.info('Background permission result', {
        granted: backgroundGranted,
        canAskAgain,
        platform: Platform.OS,
      });

      return backgroundGranted;
    } catch (error) {
      logger.warn('Failed to request background permission', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to request background location permission.',
        backgroundPermissionStatus: {
          foregroundGranted: false,
          backgroundGranted: false,
          canAskAgain: true,
        },
      }));
      return false;
    }
  }, []);

  return {
    location: state.location,
    isLoading: state.isLoading,
    error: state.error,
    permissionStatus: state.permissionStatus,
    backgroundPermissionStatus: state.backgroundPermissionStatus,
    requestLocation,
    requestBackgroundPermission,
    clearError,
  };
}

