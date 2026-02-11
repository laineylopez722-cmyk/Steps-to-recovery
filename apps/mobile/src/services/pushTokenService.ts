/**
 * Push Token Service - Remote Push Notification Registration
 *
 * Manages Expo push token registration with Supabase for remote
 * push notifications. Tokens are stored in the profiles table
 * and refreshed on each app launch.
 *
 * @module services/pushTokenService
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

const EXPO_PROJECT_ID = '31a006e3-47da-4995-b63a-ded28567f594';

/**
 * Get the current Expo push token for this device.
 *
 * @returns The push token string, or null if unavailable
 */
export async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    logger.info('Push tokens not supported on web');
    return null;
  }

  try {
    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('Push notification permission denied');
        return null;
      }
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID,
    });

    logger.info('Push token retrieved', { hasToken: true });
    return token;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get push token', { error: msg });
    return null;
  }
}

/**
 * Register the device push token with Supabase.
 * Stores the token in the profiles table for server-initiated notifications.
 *
 * @param userId - The authenticated user's ID
 * @returns true if registration succeeded
 */
export async function registerPushToken(userId: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const token = await getPushToken();
    if (!token) {
      logger.warn('No push token available for registration');
      return false;
    }

    const { error } = await supabase.from('profiles').upsert(
      {
        id: userId,
        push_token: token,
        push_token_updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    if (error) {
      logger.error('Failed to register push token with Supabase', { error: error.message });
      return false;
    }

    logger.info('Push token registered successfully', { userId });
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Push token registration error', { error: msg });
    return false;
  }
}

/**
 * Unregister the device push token from Supabase.
 * Called on logout to stop receiving remote notifications.
 *
 * @param userId - The authenticated user's ID
 * @returns true if unregistration succeeded
 */
export async function unregisterPushToken(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        push_token: null,
        push_token_updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      logger.error('Failed to unregister push token', { error: error.message });
      return false;
    }

    logger.info('Push token unregistered', { userId });
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Push token unregistration error', { error: msg });
    return false;
  }
}
