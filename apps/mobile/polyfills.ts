/**
 * Polyfills for Steps to Recovery
 *
 * CRITICAL: This file MUST be imported FIRST in App.tsx before any other code.
 *
 * Provides shims for web APIs that may be missing in:
 * - React Native/Hermes runtime
 * - Expo Go
 * - SSR during expo-router web builds
 * - Node.js tooling (Metro bundler, Jest)
 *
 * Polyfills included:
 * - crypto.getRandomValues() - for encryption
 * - crypto.subtle - for AES-256 encryption
 * - localStorage - for Supabase auth persistence
 * - atob/btoa - for Base64 encoding
 */

// === Crypto Polyfills (MUST be first) ===
// These provide secure random number generation for encryption
import 'react-native-get-random-values';
import 'expo-standard-web-crypto';

// === Base64 Polyfills ===
import { decode as atobPolyfill, encode as btoaPolyfill } from 'base-64';

// === localStorage Shim ===
// Required for Supabase auth token persistence on React Native
if (
  typeof globalThis.localStorage === 'undefined' ||
  typeof globalThis.localStorage?.getItem !== 'function'
) {
  const memoryStore = new Map<string, string>();

  const localStorageShim: Storage = {
    getItem(key: string): string | null {
      return memoryStore.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      memoryStore.set(key, String(value));
    },
    removeItem(key: string): void {
      memoryStore.delete(key);
    },
    clear(): void {
      memoryStore.clear();
    },
    key(index: number): string | null {
      return Array.from(memoryStore.keys())[index] ?? null;
    },
    get length(): number {
      return memoryStore.size;
    },
  };

  (globalThis as Record<string, unknown>).localStorage = localStorageShim;
}

// === Base64 Functions ===
// Hermes engine doesn't include atob/btoa by default
if (typeof globalThis.atob !== 'function') {
  (globalThis as Record<string, unknown>).atob = atobPolyfill;
}
if (typeof globalThis.btoa !== 'function') {
  (globalThis as Record<string, unknown>).btoa = btoaPolyfill;
}

// === Crypto Subtle Verification ===
// expo-standard-web-crypto should provide crypto.subtle for AES-256
// If it's missing, ensure the object exists (operations will fail gracefully)
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as Record<string, unknown>).crypto = {};
}
