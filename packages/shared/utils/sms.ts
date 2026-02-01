/**
 * SMS Utility
 *
 * Send SMS messages with SOS functionality and fallback handling.
 * Provides cross-platform SMS capabilities with graceful degradation.
 *
 * @module utils/sms
 */

import * as SMS from 'expo-sms';
import { Linking, Platform, Alert } from 'react-native';

/** Default SOS message for emergency contacts */
export const SOS_MESSAGE = "Hey, I'm having a hard time. Can you talk?";

/** Predefined SOS message templates */
export const SOS_MESSAGES = {
  /** Default SOS message */
  default: SOS_MESSAGE,
  /** Urgent support request */
  urgent: 'I really need to talk. Are you available?',
  /** Casual check-in message */
  checking_in: 'Hey, just checking in. Do you have a few minutes?',
  /** Message for when struggling */
  struggling: "I'm struggling right now and could use some support.",
} as const;

interface SendSMSResult {
  success: boolean;
  error?: string;
}

/**
 * Check if SMS is available on this device
 *
 * @returns Promise resolving to true if SMS is available, false otherwise
 * @example
 * ```ts
 * const available = await isSMSAvailable();
 * if (available) {
 *   await sendSMS('+1234567890', 'Hello');
 * }
 * ```
 */
export async function isSMSAvailable(): Promise<boolean> {
  try {
    return await SMS.isAvailableAsync();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SMS] Error checking SMS availability:', errorMessage);
    return false;
  }
}

/**
 * Send an SMS message
 *
 * Attempts to send SMS using expo-sms, with automatic fallback to
 * Linking API if expo-sms is unavailable.
 *
 * @param phoneNumber - Recipient phone number (can include + prefix)
 * @param message - Message text to send
 * @returns Promise resolving to result indicating success or failure
 * @throws Never throws - always returns a result object
 * @example
 * ```ts
 * const result = await sendSMS('+1234567890', 'Hello!');
 * if (result.success) {
 *   console.log('Message sent');
 * } else {
 *   console.error('Failed:', result.error);
 * }
 * ```
 */
export async function sendSMS(phoneNumber: string, message: string): Promise<SendSMSResult> {
  // Validate inputs
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return {
      success: false,
      error: 'Invalid phone number',
    };
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return {
      success: false,
      error: 'Message cannot be empty',
    };
  }

  try {
    // Check if SMS is available
    const available = await isSMSAvailable();

    if (!available) {
      // Fallback to Linking API
      return await sendSMSViaLinking(phoneNumber, message);
    }

    // Use expo-sms
    const { result } = await SMS.sendSMSAsync([phoneNumber], message);

    // Check result - 'sent' means user sent, 'cancelled' means they cancelled
    return {
      success: result === 'sent',
      error: result === 'cancelled' ? 'Message cancelled by user' : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SMS] Error sending SMS:', errorMessage);

    // Try fallback
    try {
      return await sendSMSViaLinking(phoneNumber, message);
    } catch (fallbackError) {
      return {
        success: false,
        error: 'Failed to send message. Please try calling instead.',
      };
    }
  }
}

/**
 * Send SMS via Linking API (fallback method)
 *
 * Opens the device's default SMS app with pre-filled recipient and message.
 * Note: This method cannot determine if the user actually sent the message.
 *
 * @param phoneNumber - Recipient phone number
 * @param message - Message text to pre-fill
 * @returns Promise resolving to result (always assumes success when app opens)
 * @internal
 */
async function sendSMSViaLinking(phoneNumber: string, message: string): Promise<SendSMSResult> {
  try {
    // Format the phone number (remove spaces and special chars except +)
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Encode the message
    const encodedMessage = encodeURIComponent(message);

    // Create SMS URL (different format for iOS and Android)
    const smsUrl = Platform.select({
      ios: `sms:${cleanedNumber}&body=${encodedMessage}`,
      android: `sms:${cleanedNumber}?body=${encodedMessage}`,
      default: `sms:${cleanedNumber}?body=${encodedMessage}`,
    });

    const canOpen = await Linking.canOpenURL(smsUrl);

    if (!canOpen) {
      return {
        success: false,
        error: 'Unable to open SMS app',
      };
    }

    await Linking.openURL(smsUrl);

    // We can't know if the user actually sent the message
    // when using Linking, so we assume success
    return { success: true };
  } catch (error) {
    console.error('Error with SMS linking fallback:', error);
    return {
      success: false,
      error: 'Failed to open SMS app',
    };
  }
}

/**
 * Send SOS message to a contact
 *
 * Shows a confirmation dialog before sending an SOS message.
 * Uses the default SOS message unless a custom message is provided.
 *
 * @param phoneNumber - Recipient phone number
 * @param contactName - Display name of the contact (for confirmation dialog)
 * @param customMessage - Optional custom message (defaults to SOS_MESSAGE)
 * @returns Promise resolving to result indicating success or failure
 * @example
 * ```ts
 * await sendSOSMessage('+1234567890', 'John Doe');
 * // Shows: "Send SOS Message? Send 'Hey, I'm having a hard time...' to John Doe?"
 * ```
 */
export async function sendSOSMessage(
  phoneNumber: string,
  contactName: string,
  customMessage?: string,
): Promise<SendSMSResult> {
  const message = customMessage || SOS_MESSAGE;

  return new Promise((resolve) => {
    Alert.alert('Send SOS Message?', `Send "${message}" to ${contactName}?`, [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => resolve({ success: false, error: 'Cancelled' }),
      },
      {
        text: 'Send',
        onPress: async () => {
          const result = await sendSMS(phoneNumber, message);

          if (result.success) {
            Alert.alert('Message Sent', `Your message was sent to ${contactName}.`);
          } else if (result.error && result.error !== 'Cancelled') {
            Alert.alert('Message Failed', result.error);
          }

          resolve(result);
        },
      },
    ]);
  });
}

/**
 * Quick send SOS without confirmation (for emergency use)
 *
 * Immediately sends the default SOS message without showing a confirmation dialog.
 * Use this for emergency situations where speed is critical.
 *
 * @param phoneNumber - Recipient phone number
 * @returns Promise resolving to result indicating success or failure
 * @example
 * ```ts
 * // Emergency button handler
 * const result = await quickSendSOS(sponsorPhoneNumber);
 * if (!result.success) {
 *   // Fallback to phone call
 *   await makePhoneCall(sponsorPhoneNumber);
 * }
 * ```
 */
export async function quickSendSOS(phoneNumber: string): Promise<SendSMSResult> {
  return sendSMS(phoneNumber, SOS_MESSAGE);
}

/**
 * Make a phone call
 *
 * Initiates a phone call using the device's default dialer.
 * Falls back gracefully if phone calls are not available.
 *
 * @param phoneNumber - Phone number to call (can include + prefix)
 * @returns Promise resolving to true if call was initiated, false otherwise
 * @example
 * ```ts
 * const success = await makePhoneCall('+1234567890');
 * if (!success) {
 *   Alert.alert('Unable to make call');
 * }
 * ```
 */
export async function makePhoneCall(phoneNumber: string): Promise<boolean> {
  try {
    // Format the phone number
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
    const telUrl = `tel:${cleanedNumber}`;

    const canOpen = await Linking.canOpenURL(telUrl);

    if (!canOpen) {
      Alert.alert('Cannot Make Call', 'Phone calls are not available on this device.');
      return false;
    }

    await Linking.openURL(telUrl);
    return true;
  } catch (error) {
    console.error('Error making phone call:', error);
    Alert.alert('Call Failed', 'Unable to make the call. Please try again.');
    return false;
  }
}

/**
 * Open the default messaging app (without pre-filled message)
 */
export async function openMessagingApp(phoneNumber: string): Promise<boolean> {
  try {
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
    const smsUrl = Platform.OS === 'ios' ? `sms:${cleanedNumber}` : `sms:${cleanedNumber}`;

    const canOpen = await Linking.canOpenURL(smsUrl);

    if (!canOpen) {
      return false;
    }

    await Linking.openURL(smsUrl);
    return true;
  } catch (error) {
    console.error('Error opening messaging app:', error);
    return false;
  }
}
