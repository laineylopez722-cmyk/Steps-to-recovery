/**
 * Supabase Client Configuration
 *
 * Creates and configures the Supabase client with platform-specific
 * secure storage for authentication tokens.
 *
 * **Security**:
 * - Mobile: Uses SecureStore (Keychain/Keystore) for token storage
 * - Web: Falls back to AsyncStorage (SecureStore not available) ⚠️ LESS SECURE
 * - Tokens are never stored in plain text
 *
 * **Environment Variables Required**:
 * - `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
 * - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
 *
 * **Platform Notes**:
 * - Web platform uses AsyncStorage for auth tokens (not encrypted)
 * - Consider using Supabase Auth UI or custom auth for web if security is critical
 *
 * @module lib/supabase
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import type { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

/**
 * Custom storage adapter for Supabase auth tokens
 *
 * Uses SecureStore on mobile (encrypted storage) and AsyncStorage on web.
 * This ensures tokens are stored securely on all platforms.
 *
 * **Security Warning**: Web platform uses AsyncStorage (not encrypted).
 * Consider additional security measures for web deployment.
 *
 * @internal
 */
const ExpoSecureStoreAdapter =
  Platform.OS === 'web'
    ? {
        getItem: async (key: string) => {
          logger.debug('Supabase auth storage', { operation: 'getItem', platform: 'web', key });
          return await AsyncStorage.getItem(key);
        },
        setItem: async (key: string, value: string) => {
          logger.debug('Supabase auth storage', {
            operation: 'setItem',
            platform: 'web',
            key,
            valueLength: value.length,
          });
          await AsyncStorage.setItem(key, value);
        },
        removeItem: async (key: string) => {
          logger.debug('Supabase auth storage', { operation: 'removeItem', platform: 'web', key });
          await AsyncStorage.removeItem(key);
        },
      }
    : {
        getItem: async (key: string) => {
          logger.debug('Supabase auth storage', { operation: 'getItem', platform: 'native', key });
          return await SecureStore.getItemAsync(key);
        },
        setItem: async (key: string, value: string) => {
          logger.debug('Supabase auth storage', {
            operation: 'setItem',
            platform: 'native',
            key,
            valueLength: value.length,
          });
          await SecureStore.setItemAsync(key, value);
        },
        removeItem: async (key: string) => {
          logger.debug('Supabase auth storage', {
            operation: 'removeItem',
            platform: 'native',
            key,
          });
          await SecureStore.deleteItemAsync(key);
        },
      };

// Log platform detection for debugging
logger.info('Supabase storage adapter initialized', {
  platform: Platform.OS,
  usingSecureStore: Platform.OS !== 'web',
  webSecurityNote:
    Platform.OS === 'web' ? 'Using AsyncStorage (not encrypted)' : 'Using SecureStore (encrypted)',
});

/** Supabase project URL from environment */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

/** Supabase anonymous key from environment */
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Validates that required Supabase environment variables are present
 * @throws Error if environment variables are missing
 * @internal
 */
function validateEnvironmentVariables(): void {
  const missing: string[] = [];

  if (!supabaseUrl) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    const errorMessage =
      `Missing required Supabase environment variables: ${missing.join(', ')}. ` +
      'Please create a .env file in apps/mobile/ with the required variables. ' +
      'See env.example for the expected format.';

    logger.error('Supabase configuration error', { missingVariables: missing });
    throw new Error(errorMessage);
  }

  logger.info('Supabase environment variables validated', {
    urlPresent: !!supabaseUrl,
    keyPresent: !!supabaseAnonKey,
    urlPrefix: supabaseUrl?.substring(0, 30) + '...',
  });
}

// Validate environment variables
validateEnvironmentVariables();

/**
 * Supabase client instance
 *
 * Configured with secure token storage and automatic session management.
 *
 * **Note**: The anon key is safe to expose in client code. Security is
 * enforced through Row-Level Security (RLS) policies on the server.
 *
 * @example
 * ```ts
 * import { supabase } from '@/lib/supabase';
 *
 * const { data, error } = await supabase
 *   .from('journal_entries')
 *   .select('*');
 * ```
 */
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

logger.info('Supabase client created successfully', {
  url: supabaseUrl?.substring(0, 30) + '...',
  authConfigured: true,
  platform: Platform.OS,
});

/**
 * Tests Supabase connectivity and basic functionality
 *
 * Useful for debugging connection issues or validating setup.
 * Returns connection status and any error information.
 *
 * @returns Promise<{connected: boolean, error?: string}>
 * @example
 * ```ts
 * const health = await testSupabaseConnection();
 * if (!health.connected) {
 *   console.error('Supabase connection failed:', health.error);
 * }
 * ```
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    logger.debug('Testing Supabase connection');

    // Test basic connectivity by attempting to get the current session
    // This doesn't require authentication and tests the client configuration
    const { error } = await supabase.auth.getSession();

    if (error) {
      logger.error('Supabase connection test failed', error);
      return { connected: false, error: error.message };
    }

    logger.info('Supabase connection test passed');
    return { connected: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Supabase connection test threw exception', error);
    return { connected: false, error: errorMessage };
  }
}

/**
 * Gets current session information for debugging
 *
 * @returns Promise with session info or null (sensitive data masked for security)
 */
export async function getSupabaseSessionInfo(): Promise<{
  session: {
    access_token: 'present' | 'missing';
    refresh_token: 'present' | 'missing';
    expires_at?: number;
    user: 'present' | 'missing';
  } | null;
  user: { id: string; email?: string; role?: string } | null;
  error?: string;
}> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      logger.debug('Session info retrieval failed', error);
      return { session: null, user: null, error: error.message };
    }

    logger.debug('Session info retrieved', {
      hasSession: !!session,
      hasUser: !!session?.user,
      expiresAt: session?.expires_at,
    });

    return {
      session: session
        ? {
            access_token: session.access_token ? 'present' : 'missing',
            refresh_token: session.refresh_token ? 'present' : 'missing',
            expires_at: session.expires_at,
            user: session.user ? 'present' : 'missing',
          }
        : null,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
          }
        : null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Session info retrieval threw exception', error);
    return { session: null, user: null, error: errorMessage };
  }
}

/**
 * Forces a session refresh (useful for debugging auth issues)
 *
 * @returns Promise<{success: boolean, error?: string}>
 */
export async function refreshSupabaseSession(): Promise<{ success: boolean; error?: string }> {
  try {
    logger.debug('Forcing session refresh');
    const { error } = await supabase.auth.refreshSession();

    if (error) {
      logger.error('Session refresh failed', error);
      return { success: false, error: error.message };
    }

    logger.info('Session refresh successful');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Session refresh threw exception', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Clears all auth storage (useful for development/testing)
 * WARNING: This will log out the current user
 *
 * @returns Promise<{success: boolean, error?: string}>
 */
export async function clearSupabaseAuthStorage(): Promise<{ success: boolean; error?: string }> {
  try {
    logger.warn('Clearing all Supabase auth storage');

    // Sign out to clear session
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      logger.warn('Sign out during storage clear failed', signOutError);
    }

    // Clear storage adapter
    if (Platform.OS === 'web') {
      // Clear AsyncStorage items that might contain auth data
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter((key) => key.includes('supabase') || key.includes('auth'));
      await AsyncStorage.multiRemove(authKeys);
    } else {
      // For native, rely on the signOut above and SecureStore cleanup
      // Note: SecureStore doesn't have a clear all method, individual keys are managed by Supabase
    }

    logger.info('Supabase auth storage cleared');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Clear auth storage threw exception', error);
    return { success: false, error: errorMessage };
  }
}

// Development helper: Log Supabase configuration on initialization
if (__DEV__) {
  logger.debug('Supabase client initialized in development mode', {
    platform: Platform.OS,
    urlConfigured: !!supabaseUrl,
    keyConfigured: !!supabaseAnonKey,
    storageType: Platform.OS === 'web' ? 'AsyncStorage' : 'SecureStore',
  });
}
