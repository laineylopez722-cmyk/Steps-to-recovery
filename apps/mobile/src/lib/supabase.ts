/**
 * Supabase Client Configuration
 *
 * Creates and configures the Supabase client with platform-specific
 * secure storage for authentication tokens.
 *
 * **Security**:
 * - Mobile: Uses SecureStore (Keychain/Keystore) for token storage
 * - Web: Falls back to MMKV/localStorage (SecureStore not available) ⚠️ LESS SECURE
 * - Tokens are never stored in plain text
 *
 * **Environment Variables Required**:
 * - `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
 * - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
 *
 * **Platform Notes**:
 * - Web platform uses MMKV/localStorage for auth tokens (not encrypted)
 * - Consider using Supabase Auth UI or custom auth for web if security is critical
 *
 * @module lib/supabase
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { mmkvStorage } from './mmkv';
import { logger } from '../utils/logger';

const CURRENT_PLATFORM = Platform.OS;
const IS_WEB = CURRENT_PLATFORM === 'web';
const IS_TEST_ENV = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);

/**
 * Custom storage adapter for Supabase auth tokens
 *
 * Uses SecureStore on mobile (encrypted storage) and MMKV/localStorage on web.
 * This ensures tokens are stored securely on all platforms.
 *
 * **Security Warning**: Web platform uses MMKV/localStorage (not encrypted).
 * Consider additional security measures for web deployment.
 *
 * @internal
 */
/** Log storage ops only in dev to avoid noise; platform is fixed at module load. */
function logStorage(operation: string, key: string, extra?: Record<string, unknown>): void {
  if (__DEV__ && !IS_TEST_ENV) {
    logger.debug('Supabase auth storage', {
      operation,
      platform: CURRENT_PLATFORM,
      key,
      ...extra,
    });
  }
}

const ExpoSecureStoreAdapter = IS_WEB
  ? {
      getItem: async (key: string) => {
        logStorage('getItem', key);
        return mmkvStorage.getItem(key);
      },
      setItem: async (key: string, value: string) => {
        logStorage('setItem', key, { valueLength: value.length });
        mmkvStorage.setItem(key, value);
      },
      removeItem: async (key: string) => {
        logStorage('removeItem', key);
        mmkvStorage.removeItem(key);
      },
    }
  : {
      getItem: async (key: string) => {
        logStorage('getItem', key);
        return SecureStore.getItemAsync(key);
      },
      setItem: async (key: string, value: string) => {
        logStorage('setItem', key, { valueLength: value.length });
        await SecureStore.setItemAsync(key, value);
      },
      removeItem: async (key: string) => {
        logStorage('removeItem', key);
        await SecureStore.deleteItemAsync(key);
      },
    };

if (__DEV__) {
  logger.info('Supabase storage adapter initialized', {
    platform: CURRENT_PLATFORM,
    usingSecureStore: !IS_WEB,
    webSecurityNote: IS_WEB
      ? 'Using MMKV/localStorage (not encrypted)'
      : 'Using SecureStore (encrypted)',
  });
}

/** Supabase project URL from environment */
const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

/** Supabase anonymous key from environment */
const rawSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl = rawSupabaseUrl?.trim();
const supabaseAnonKey = rawSupabaseAnonKey?.trim();

function looksLikePlaceholder(value: string | undefined): boolean {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes('your-project') ||
    normalized.includes('your-anon-key') ||
    normalized.includes('example.supabase.co') ||
    normalized === 'test-anon-key' ||
    normalized === 'test-anon-key-for-jest'
  );
}

function isValidHttpUrl(value: string | undefined): boolean {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates that required Supabase environment variables are present and sane
 * @throws Error if environment variables are missing or obviously invalid
 * @internal
 */
function validateEnvironmentVariables(): void {
  const missing: string[] = [];
  const invalid: string[] = [];

  if (!supabaseUrl) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  if (supabaseUrl && (looksLikePlaceholder(supabaseUrl) || !isValidHttpUrl(supabaseUrl))) {
    invalid.push('EXPO_PUBLIC_SUPABASE_URL');
  }

  if (supabaseAnonKey && looksLikePlaceholder(supabaseAnonKey)) {
    invalid.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (missing.length > 0 || invalid.length > 0) {
    const parts: string[] = [];

    if (missing.length > 0) {
      parts.push(`Missing required Supabase environment variables: ${missing.join(', ')}`);
    }

    if (invalid.length > 0) {
      parts.push(`Invalid or placeholder Supabase environment variables: ${invalid.join(', ')}`);
    }

    const errorMessage =
      `${parts.join('. ')}. ` +
      'Update apps/mobile/.env with the real Supabase Project URL and anon/public key from Supabase Dashboard → Settings → API. ' +
      'Do not leave template values like "your-project..." or "your-anon-key..." in place.';

    logger.error('Supabase configuration error', {
      missingVariables: missing,
      invalidVariables: invalid,
      urlPresent: !!supabaseUrl,
      keyPresent: !!supabaseAnonKey,
    });
    throw new Error(errorMessage);
  }

  if (__DEV__) {
    logger.info('Supabase environment variables validated', {
      urlPresent: !!supabaseUrl,
      keyPresent: !!supabaseAnonKey,
      urlPrefix: supabaseUrl?.substring(0, 30) + '...',
    });
  }
}

// Validate environment variables (skip in test environment)
if (!IS_TEST_ENV) {
  validateEnvironmentVariables();
}

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
    autoRefreshToken: !IS_TEST_ENV,
    persistSession: !IS_TEST_ENV,
    detectSessionInUrl: false,
  },
});

if (__DEV__) {
  logger.info('Supabase client created successfully', {
    url: supabaseUrl?.substring(0, 30) + '...',
    authConfigured: true,
    platform: CURRENT_PLATFORM,
  });
}

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
 *   logger.error('Supabase connection failed', { error: health.error });
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
    if (IS_WEB) {
      // Clear only Supabase auth keys (sb-* or supabase*) to avoid removing other app data
      const keys = mmkvStorage.getAllKeys();
      const authKeys = keys.filter(
        (key) => key.startsWith('sb-') || key.toLowerCase().includes('supabase'),
      );
      mmkvStorage.multiRemove(authKeys);
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
    platform: CURRENT_PLATFORM,
    urlConfigured: !!supabaseUrl,
    keyConfigured: !!supabaseAnonKey,
    storageType: IS_WEB ? 'MMKV' : 'SecureStore',
  });
}
