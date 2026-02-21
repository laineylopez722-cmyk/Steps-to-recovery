/**
 * MMKV Storage Module
 *
 * High-performance synchronous key-value storage backed by react-native-mmkv.
 * Provides ~30x faster performance than AsyncStorage with synchronous access.
 *
 * Platform handling:
 * - iOS/Android: Uses MMKV for native performance
 * - Web: Falls back to localStorage
 *
 * @module lib/mmkv
 */

import { Platform } from 'react-native';
import type { MMKV } from 'react-native-mmkv';
import { nativeModulePort } from '@/platform/runtime/NativeModulePort';
import type { KVStorePort } from '@/platform/storage/KVStorePort';

// ========================================
// MMKV Instance
// ========================================

/**
 * Direct MMKV access for advanced use cases.
 * Returns null on web where MMKV is not available.
 */
type CreateMMKV = (options: { id: string }) => MMKV;

const createMMKV =
  Platform.OS !== 'web'
    ? nativeModulePort.loadOptional<CreateMMKV>(() => {
        const mmkvModule = require('react-native-mmkv') as { createMMKV: CreateMMKV };
        return mmkvModule.createMMKV;
      })
    : null;

export const mmkv: MMKV | null =
  createMMKV !== null ? createMMKV({ id: 'steps-to-recovery-storage' }) : null;

// ========================================
// AsyncStorage-Compatible Wrapper
// ========================================

/**
 * Provides an AsyncStorage-compatible API surface backed by MMKV.
 * Falls back to localStorage on web.
 *
 * Key differences from AsyncStorage:
 * - Synchronous operations (no await needed)
 * - Returns null instead of throwing for missing keys
 * - getAllKeys() returns string[] directly
 */
export const mmkvStorage: KVStorePort = {
  /**
   * Get a value by key
   * @returns The stored value, or null if not found
   */
  getItem: (key: string): string | null => {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(key);
    }
    return mmkv?.getString(key) ?? null;
  },

  /**
   * Set a value for a key
   */
  setItem: (key: string, value: string): void => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    mmkv?.set(key, value);
  },

  /**
   * Remove a key
   */
  removeItem: (key: string): void => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    mmkv?.remove(key);
  },

  /**
   * Get all keys
   * @returns Array of all stored keys
   */
  getAllKeys: (): string[] => {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return [];
      return Object.keys(localStorage);
    }
    return mmkv?.getAllKeys() ?? [];
  },

  /**
   * Set multiple key-value pairs
   * @param pairs Array of [key, value] tuples
   */
  multiSet: (pairs: [string, string][]): void => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        pairs.forEach(([key, value]) => localStorage.setItem(key, value));
      }
      return;
    }
    pairs.forEach(([key, value]) => mmkv?.set(key, value));
  },

  /**
   * Remove multiple keys
   * @param keys Array of keys to remove
   */
  multiRemove: (keys: string[]): void => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        keys.forEach((key) => localStorage.removeItem(key));
      }
      return;
    }
    keys.forEach((key) => mmkv?.remove(key));
  },
};

export default mmkvStorage;
