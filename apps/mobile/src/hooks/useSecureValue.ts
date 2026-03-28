/**
 * Secure Value Hook
 *
 * Generic hook for storing and retrieving values from SecureStore.
 * Provides React state integration with secure persistent storage.
 *
 * **Security**:
 * - Values stored in device Keychain (iOS) / Keystore (Android)
 * - Values encrypted at rest
 * - NOT synced to cloud (device-local only)
 *
 * **Use Cases**:
 * - Encryption keys (NEVER use AsyncStorage)
 * - Session tokens
 * - Biometric settings
 * - PIN codes (hashed)
 *
 * @example
 * ```ts
 * const { value, setValue, deleteValue, isLoading } = useSecureValue<string>('user_pin_hash');
 *
 * // Set value
 * await setValue(hashedPin);
 *
 * // Delete value
 * await deleteValue();
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { secureStorage } from '../adapters/secureStorage';
import { logger } from '../utils/logger';

interface SecureValueState<T> {
  /** Current value (null if not set or not loaded yet) */
  value: T | null;
  /** Loading initial value from storage */
  isLoading: boolean;
  /** Error if load/save failed */
  error: Error | null;
  /** Value has been loaded at least once */
  isReady: boolean;
}

interface SecureValueActions<T> {
  /** Set a new value (persists to SecureStore) */
  setValue: (newValue: T) => Promise<void>;
  /** Delete the value from SecureStore */
  deleteValue: () => Promise<void>;
  /** Refresh value from SecureStore */
  refresh: () => Promise<void>;
}

interface SecureValueOptions<T> {
  /** Parse stored string to type T (default: JSON.parse) */
  deserialize?: (stored: string) => T;
  /** Serialize type T to string (default: JSON.stringify) */
  serialize?: (value: T) => string;
  /** Default value if nothing stored */
  defaultValue?: T;
  /** Don't load on mount (call refresh manually) */
  lazy?: boolean;
}

export function useSecureValue<T = string>(
  key: string,
  options: SecureValueOptions<T> = {},
): SecureValueState<T> & SecureValueActions<T> {
  const {
    deserialize = (s: string): T => JSON.parse(s) as T,
    serialize = (v: T): string => JSON.stringify(v),
    defaultValue,
    lazy = false,
  } = options;

  const [state, setState] = useState<SecureValueState<T>>({
    value: defaultValue ?? null,
    isLoading: !lazy,
    error: null,
    isReady: false,
  });

  const mountedRef = useRef(true);
  const keyRef = useRef(key);

  // Update key ref if key changes
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  const loadValue = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const stored = await secureStorage.getItemAsync(keyRef.current);

      if (!mountedRef.current) return;

      if (stored === null) {
        setState({
          value: defaultValue ?? null,
          isLoading: false,
          error: null,
          isReady: true,
        });
      } else {
        const parsed = deserialize(stored);
        setState({
          value: parsed,
          isLoading: false,
          error: null,
          isReady: true,
        });
      }
    } catch (error) {
      logger.error('Failed to load secure value', { error });

      if (!mountedRef.current) return;

      setState({
        value: defaultValue ?? null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to load secure value'),
        isReady: true,
      });
    }
  }, [deserialize, defaultValue]);

  const setValue = useCallback(
    async (newValue: T): Promise<void> => {
      try {
        const serialized = serialize(newValue);
        await secureStorage.setItemAsync(keyRef.current, serialized);

        if (!mountedRef.current) return;

        setState((prev) => ({ ...prev, value: newValue, error: null }));
        logger.info('Secure value saved');
      } catch (error) {
        logger.error('Failed to save secure value', { error });

        if (!mountedRef.current) return;

        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error('Failed to save secure value'),
        }));
        throw error;
      }
    },
    [serialize],
  );

  const deleteValue = useCallback(async (): Promise<void> => {
    try {
      await secureStorage.deleteItemAsync(keyRef.current);

      if (!mountedRef.current) return;

      setState((prev) => ({ ...prev, value: defaultValue ?? null, error: null }));
      logger.info('Secure value deleted');
    } catch (error) {
      logger.error('Failed to delete secure value', { error });

      if (!mountedRef.current) return;

      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to delete secure value'),
      }));
      throw error;
    }
  }, [defaultValue]);

  const refresh = useCallback(async (): Promise<void> => {
    await loadValue();
  }, [loadValue]);

  // Load value on mount (unless lazy)
  useEffect(() => {
    mountedRef.current = true;

    if (!lazy) {
      void loadValue();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [lazy, loadValue]);

  // Reload if key changes
  useEffect(() => {
    if (!lazy) {
      void loadValue();
    }
  }, [key, lazy, loadValue]);

  return {
    ...state,
    setValue,
    deleteValue,
    refresh,
  };
}

/**
 * Specialized hook for string values (no serialization needed)
 */
export function useSecureString(
  key: string,
  options: Omit<SecureValueOptions<string>, 'serialize' | 'deserialize'> = {},
): SecureValueState<string> & SecureValueActions<string> {
  return useSecureValue<string>(key, {
    ...options,
    deserialize: (s: string): string => s,
    serialize: (v: string): string => v,
  });
}

/**
 * Specialized hook for boolean values
 */
export function useSecureBoolean(
  key: string,
  defaultValue = false,
): SecureValueState<boolean> & SecureValueActions<boolean> {
  return useSecureValue<boolean>(key, {
    defaultValue,
    deserialize: (s: string): boolean => s === 'true',
    serialize: (v: boolean): string => String(v),
  });
}
