/**
 * Web secure storage adapter
 * Uses Web Crypto API for encryption + localStorage for persistence
 *
 * NOTE: Less secure than native keystores, but best available on web
 * Keys are encrypted with a master key derived from a per-user seed
 */

import type { SecureStorageAdapter } from './types';
import { logger } from '../../utils/logger';

const STORAGE_PREFIX = 'secure_';
const CRYPTO_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const SALT_STORAGE_KEY = '_master_key_salt';
const KEY_SEED_STORAGE_KEY = '_master_key_seed';

export class WebSecureStorageAdapter implements SecureStorageAdapter {
  private masterKey: CryptoKey | null = null;
  private userId: string | null = null;
  private sessionToken: string | null = null;
  private keySeed: Uint8Array | null = null;

  /**
   * Initialize storage with user session (REQUIRED before use)
   * Derives a user-specific master key from a per-user seed
   * (session token is retained for legacy migration only)
   */
  async initializeWithSession(userId: string, sessionToken: string): Promise<void> {
    // Clear old key if switching users
    if (this.userId !== userId) {
      this.masterKey = null;
      this.keySeed = null;
    }

    this.userId = userId;
    this.sessionToken = sessionToken;

    // Derive new master key immediately
    await this.getMasterKey();
  }

  /**
   * Clear session and master key (call on logout)
   * Also clears the stored salt and seed for the user
   */
  clearSession(): void {
    // Clear stored salt for this user
    if (this.userId) {
      const saltKey = `${STORAGE_PREFIX}${this.userId}${SALT_STORAGE_KEY}`;
      localStorage.removeItem(saltKey);
      const seedKey = `${STORAGE_PREFIX}${this.userId}${KEY_SEED_STORAGE_KEY}`;
      localStorage.removeItem(seedKey);
    }

    this.masterKey = null;
    this.userId = null;
    this.sessionToken = null;
    this.keySeed = null;
  }

  /**
   * Get or generate a random salt for key derivation
   *
   * Salt is stored in localStorage alongside encrypted data. While this means
   * an attacker with localStorage access also has the salt, it still provides
   * value by preventing rainbow table attacks and ensuring each user has unique
   * key derivation.
   *
   * NOTE: This is a necessary trade-off for web platform - there is no separate
   * secure storage available in browsers.
   */
  private async getSalt(): Promise<Uint8Array> {
    if (!this.userId) {
      throw new Error('UserId required to get salt');
    }

    const saltKey = `${STORAGE_PREFIX}${this.userId}${SALT_STORAGE_KEY}`;
    const storedSalt = localStorage.getItem(saltKey);

    if (storedSalt) {
      // Reconstruct Uint8Array from stored JSON array
      return new Uint8Array(JSON.parse(storedSalt));
    }

    // Generate new random salt (32 bytes)
    const salt = window.crypto.getRandomValues(new Uint8Array(32));

    // Store as JSON array
    localStorage.setItem(saltKey, JSON.stringify(Array.from(salt)));

    return salt;
  }

  /**
   * Get or generate a per-user master key seed
   * Seed is stored in localStorage and reused for the same user
   */
  private async getKeySeed(): Promise<Uint8Array> {
    if (!this.userId) {
      throw new Error('UserId required to get key seed');
    }

    if (this.keySeed) {
      return this.keySeed;
    }

    const seedKey = `${STORAGE_PREFIX}${this.userId}${KEY_SEED_STORAGE_KEY}`;
    const storedSeed = localStorage.getItem(seedKey);

    if (storedSeed) {
      this.keySeed = new Uint8Array(JSON.parse(storedSeed));
      return this.keySeed;
    }

    // Generate new random seed (32 bytes)
    const seed = window.crypto.getRandomValues(new Uint8Array(32));
    localStorage.setItem(seedKey, JSON.stringify(Array.from(seed)));
    this.keySeed = seed;
    return seed;
  }

  /**
   * Derive master encryption key from per-user seed + random salt
   */
  private async getMasterKey(): Promise<CryptoKey> {
    if (this.masterKey) return this.masterKey;

    if (!this.userId) {
      throw new Error('SecureStorage not initialized. Call initializeWithSession() first.');
    }

    const seed = await this.getKeySeed();
    // Convert Uint8Array to ArrayBuffer for importKey
    const seedBuffer = seed.buffer.slice(
      seed.byteOffset,
      seed.byteOffset + seed.byteLength,
    ) as ArrayBuffer;
    // Import per-user seed as key material
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      seedBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey'],
    );

    // Use random salt (generated once per user, then stored)
    const saltArray = await this.getSalt();
    const salt = saltArray.buffer.slice(
      saltArray.byteOffset,
      saltArray.byteOffset + saltArray.byteLength,
    ) as ArrayBuffer;

    this.masterKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: CRYPTO_ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt'],
    );

    return this.masterKey;
  }

  /**
   * Legacy master key derivation using session token (migration fallback)
   */
  private async getLegacyMasterKey(): Promise<CryptoKey> {
    if (!this.sessionToken || !this.userId) {
      throw new Error('SecureStorage not initialized. Call initializeWithSession() first.');
    }

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.sessionToken),
      { name: 'PBKDF2' },
      false,
      ['deriveKey'],
    );

    const saltArray = await this.getSalt();
    const salt = saltArray.buffer as ArrayBuffer;

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: CRYPTO_ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  async getItemAsync(key: string): Promise<string | null> {
    const encrypted = localStorage.getItem(STORAGE_PREFIX + key);
    if (!encrypted) return null;

    try {
      // Parse stored data (iv + ciphertext)
      const data = JSON.parse(encrypted) as { iv: number[]; ciphertext: number[] };
      const iv = new Uint8Array(data.iv);
      const ciphertext = new Uint8Array(data.ciphertext);

      // Decrypt
      const masterKey = await this.getMasterKey();
      const decrypted = await window.crypto.subtle.decrypt(
        { name: CRYPTO_ALGORITHM, iv },
        masterKey,
        ciphertext.buffer as ArrayBuffer,
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      if (this.sessionToken) {
        try {
          const data = JSON.parse(encrypted) as { iv: number[]; ciphertext: number[] };
          const iv = new Uint8Array(data.iv);
          const ciphertext = new Uint8Array(data.ciphertext);
          const legacyKey = await this.getLegacyMasterKey();
          const decrypted = await window.crypto.subtle.decrypt(
            { name: CRYPTO_ALGORITHM, iv },
            legacyKey,
            ciphertext.buffer as ArrayBuffer,
          );
          const plaintext = new TextDecoder().decode(decrypted);
          // Migrate to new key on successful legacy decrypt
          await this.setItemAsync(key, plaintext);
          return plaintext;
        } catch (legacyError) {
          // Use sanitized logger to prevent data leaks
          logger.error('Failed to decrypt secure storage item', legacyError);
          return null;
        }
      }

      // Use sanitized logger to prevent data leaks
      logger.error('Failed to decrypt secure storage item', error);
      return null;
    }
  }

  async setItemAsync(key: string, value: string): Promise<void> {
    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const masterKey = await this.getMasterKey();
    const encrypted = await window.crypto.subtle.encrypt(
      { name: CRYPTO_ALGORITHM, iv },
      masterKey,
      new TextEncoder().encode(value),
    );

    // Store as JSON (iv + ciphertext)
    const data = {
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(encrypted)),
    };

    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  }

  async deleteItemAsync(key: string): Promise<void> {
    localStorage.removeItem(STORAGE_PREFIX + key);
  }
}
