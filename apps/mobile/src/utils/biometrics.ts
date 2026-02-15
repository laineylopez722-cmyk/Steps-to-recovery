
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { logger } from "./logger";

/**
 * Biometric Authentication Utilities
 *
 * Provides secure biometric authentication using:
 * - Face ID (iOS)
 * - Touch ID (iOS)
 * - Fingerprint (Android)
 * - Face Recognition (Android)
 * - Iris Scan (Android - Samsung)
 *
 * Features:
 * - Check device capabilities
 * - Enrolled biometrics detection
 * - Authentication with fallback
 * - Secure storage integration
 */

/**
 * Types of biometric authentication available
 */
export type BiometricType =
  | 'face_id'
  | 'touch_id'
  | 'fingerprint'
  | 'facial_recognition'
  | 'iris'
  | 'none';

/**
 * Result of biometric authentication
 */
export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  warning?: string;
}

/**
 * Check if device supports biometric authentication
 */
export async function isBiometricSupported(): Promise<boolean> {
  try {
    // Skip on web
    if (Platform.OS === 'web') {
      return false;
    }

    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    logger.error('Error checking biometric support', error);
    return false;
  }
}

/**
 * Check if user has enrolled biometrics
 */
export async function hasEnrolledBiometrics(): Promise<boolean> {
  try {
    // Skip on web
    if (Platform.OS === 'web') {
      return false;
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    logger.error('Error checking enrolled biometrics', error);
    return false;
  }
}

/**
 * Get the type of biometric authentication available
 */
export async function getBiometricType(): Promise<BiometricType> {
  try {
    // Skip on web
    if (Platform.OS === 'web') {
      return 'none';
    }

    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    // Check for specific types
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'face_id' : 'facial_recognition';
    }

    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'touch_id' : 'fingerprint';
    }

    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }

    return 'none';
  } catch (error) {
    logger.error('Error getting biometric type', error);
    return 'none';
  }
}

/**
 * Get human-readable label for biometric type
 */
export function getBiometricLabel(type: BiometricType): string {
  switch (type) {
    case 'face_id':
      return 'Face ID';
    case 'touch_id':
      return 'Touch ID';
    case 'fingerprint':
      return 'Fingerprint';
    case 'facial_recognition':
      return 'Face Recognition';
    case 'iris':
      return 'Iris Scan';
    case 'none':
    default:
      return 'Biometric Authentication';
  }
}

/**
 * Check if biometric authentication is available and ready
 */
export async function isBiometricReady(): Promise<{
  available: boolean;
  type: BiometricType;
  label: string;
  reason?: string;
}> {
  const type = await getBiometricType();

  if (type === 'none') {
    const supported = await isBiometricSupported();
    return {
      available: false,
      type: 'none',
      label: 'Biometric Authentication',
      reason: supported ? 'No biometrics enrolled' : 'Not supported on this device',
    };
  }

  const enrolled = await hasEnrolledBiometrics();

  if (!enrolled) {
    return {
      available: false,
      type,
      label: getBiometricLabel(type),
      reason: 'No biometrics enrolled',
    };
  }

  return {
    available: true,
    type,
    label: getBiometricLabel(type),
  };
}

/**
 * Authenticate user with biometrics
 *
 * @param options - Authentication options
 * @returns Authentication result
 */
export async function authenticateWithBiometrics(
  options: {
    promptMessage?: string;
    fallbackLabel?: string;
    cancelLabel?: string;
    allowDeviceCredentials?: boolean;
    requireConfirmation?: boolean;
  } = {},
): Promise<BiometricAuthResult> {
  try {
    // Skip on web
    if (Platform.OS === 'web') {
      return {
        success: false,
        error: 'Biometric authentication not available on web',
      };
    }

    // Check if biometrics are supported
    const supported = await isBiometricSupported();
    if (!supported) {
      return {
        success: false,
        error: 'Biometric authentication not supported on this device',
      };
    }

    // Check if biometrics are enrolled
    const enrolled = await hasEnrolledBiometrics();
    if (!enrolled) {
      return {
        success: false,
        error:
          'No biometrics enrolled. Please set up Face ID/Touch ID or Fingerprint in your device settings.',
        warning: 'BIOMETRICS_NOT_ENROLLED',
      };
    }

    const biometricType = await getBiometricType();
    const label = getBiometricLabel(biometricType);

    // Perform authentication
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: options.promptMessage || `Authenticate with ${label}`,
      fallbackLabel: options.fallbackLabel || 'Use passcode',
      cancelLabel: options.cancelLabel || 'Cancel',
      disableDeviceFallback: !options.allowDeviceCredentials,
      requireConfirmation: options.requireConfirmation ?? Platform.OS === 'android',
    });

    if (result.success) {
      logger.info('Biometric authentication successful');
      return { success: true };
    } else {
      // Handle specific error cases
      const error = result.error;
      let errorMessage = 'Authentication failed';

      switch (error) {
        case 'user_cancel':
          errorMessage = 'Authentication cancelled';
          break;
        case 'system_cancel':
          errorMessage = 'Authentication cancelled by system';
          break;
        case 'not_enrolled':
          errorMessage = 'Biometrics not enrolled';
          break;
        case 'passcode_not_set':
          errorMessage = 'Device passcode not set';
          break;
        case 'lockout':
          errorMessage = 'Too many failed attempts. Biometric authentication is locked.';
          break;
        default:
          errorMessage = `Authentication failed: ${error}`;
      }

      logger.warn('Biometric authentication failed', { error });
      return {
        success: false,
        error: errorMessage,
        warning: error,
      };
    }
  } catch (error) {
    logger.error('Error during biometric authentication', error);
    return {
      success: false,
      error: 'An error occurred during authentication',
    };
  }
}

/**
 * Securely authenticate user for sensitive operations
 * Always requires biometric confirmation
 */
export async function secureAuthenticate(
  operation: string = 'this action',
): Promise<BiometricAuthResult> {
  return authenticateWithBiometrics({
    promptMessage: `Authenticate to ${operation}`,
    requireConfirmation: true,
  });
}

/**
 * Quick authenticate for app unlock
 * Uses less strict requirements for better UX
 */
export async function quickAuthenticate(): Promise<BiometricAuthResult> {
  return authenticateWithBiometrics({
    promptMessage: 'Unlock Steps to Recovery',
    requireConfirmation: false,
  });
}

/**
 * Open device settings to enroll biometrics
 */
export async function openBiometricSettings(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      // iOS - open Face ID & Passcode settings
      const { Linking } = await import('react-native');
      await Linking.openURL('app-settings:');
    } else {
      // Android - open security settings
      const { Linking } = await import('react-native');
      await Linking.openSettings();
    }
  } catch (error) {
    logger.error('Error opening biometric settings', error);
  }
}

/**
 * Hook-compatible function to check biometric status
 * Returns all relevant information for UI display
 */
export async function getBiometricStatus(): Promise<{
  supported: boolean;
  enrolled: boolean;
  type: BiometricType;
  label: string;
  ready: boolean;
}> {
  const [supported, enrolled, type] = await Promise.all([
    isBiometricSupported(),
    hasEnrolledBiometrics(),
    getBiometricType(),
  ]);

  return {
    supported,
    enrolled,
    type,
    label: getBiometricLabel(type),
    ready: supported && enrolled,
  };
}

// All utilities are exported as named exports above
