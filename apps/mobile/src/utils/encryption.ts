/**
 * Encryption Utilities
 *
 * Provides AES-256-CBC encryption for sensitive user data (journal entries,
 * step work, check-ins, etc.). All encryption keys are stored securely using
 * platform-specific secure storage (Keychain on iOS, Keystore on Android).
 *
 * **Security Features**:
 * - AES-256-CBC encryption with unique IV per encryption
 * - HMAC-SHA256 authentication tag (encrypt-then-MAC)
 * - PBKDF2 key derivation (100,000 iterations)
 * - Constant-time MAC comparison to prevent timing attacks
 * - Keys stored in SecureStore (never in AsyncStorage or database)
 * - Platform-agnostic implementation (works on mobile and web)
 *
 * @module utils/encryption
 */

import { Platform } from 'react-native';
import { secureStorage } from '../adapters/secureStorage';
import type { StorageAdapter } from '../adapters/storage';
import { logger } from './logger';
import {
  aesDecryptCBC,
  aesEncryptCBC,
  hmacSHA256,
  pbkdf2,
  sha256Bytes,
} from './webCrypto';

/**
 * Constant-time string comparison to prevent timing attacks
 *
 * This function compares two strings in constant time, regardless of
 * where they differ. This prevents timing attacks that could leak
 * information about the expected MAC value.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Secure storage key for encryption master key */
const ENCRYPTION_KEY_NAME = 'journal_encryption_key';

/** PBKDF2 iterations for key derivation (higher = more secure, slower) */
const KEY_DERIVATION_ITERATIONS = 100000;

/**
 * Get random bytes in a platform-agnostic way
 *
 * Uses crypto.getRandomValues on web and expo-crypto on mobile.
 *
 * @param length - Number of random bytes to generate
 * @returns Promise resolving to Uint8Array of random bytes
 * @internal
 */
async function getRandomBytes(length: number): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    return crypto.getRandomValues(new Uint8Array(length));
  } else {
    // Dynamically import expo-crypto only on mobile
    const Crypto = await import('expo-crypto');
    return Crypto.getRandomBytesAsync(length);
  }
}

/**
 * Generate random UUID in a platform-agnostic way
 *
 * Uses crypto.randomUUID on web and expo-crypto on mobile.
 *
 * @returns Promise resolving to UUID string
 * @internal
 */
async function generateUUID(): Promise<string> {
  if (Platform.OS === 'web') {
    return crypto.randomUUID();
  } else {
    // Dynamically import expo-crypto only on mobile
    const Crypto = await import('expo-crypto');
    return Crypto.randomUUID();
  }
}

/**
 * Generate a new encryption key
 *
 * Creates a cryptographically secure encryption key using PBKDF2 key derivation.
 * The key is stored securely in platform-specific secure storage.
 *
 * **Important**: This should only be called during onboarding. If a key already
 * exists, use `getEncryptionKey()` instead.
 *
 * @returns Promise resolving to the generated encryption key (hex string)
 * @throws Error if key generation or storage fails
 * @example
 * ```ts
 * // During onboarding
 * const key = await generateEncryptionKey();
 * // Key is now stored securely and ready to use
 * ```
 */
export async function generateEncryptionKey(): Promise<string> {
  const randomBytes = await getRandomBytes(32);
  const randomString = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  // Generate a unique encryption key using PBKDF2 for key stretching
  // Note: We use a random salt per key generation, but the derived key itself is stored
  const salt = await generateUUID();
  const derivedKey = await pbkdf2(randomString, salt, KEY_DERIVATION_ITERATIONS, 256);
  // Store only the derived key - salt is not needed for future operations
  await secureStorage.setItemAsync(ENCRYPTION_KEY_NAME, derivedKey);
  return derivedKey;
}

/**
 * Get the current encryption key
 *
 * Retrieves the encryption key from secure storage. Returns null if no key exists.
 *
 * @returns Promise resolving to encryption key or null if not found
 * @example
 * ```ts
 * const key = await getEncryptionKey();
 * if (!key) {
 *   // Redirect to onboarding to generate key
 * }
 * ```
 */
export async function getEncryptionKey(): Promise<string | null> {
  return secureStorage.getItemAsync(ENCRYPTION_KEY_NAME);
}

/**
 * Encrypt content using AES-256-CBC + HMAC-SHA256
 *
 * Encrypts sensitive content (journal entries, step work answers, etc.) using
 * AES-256-CBC with a unique IV for each encryption. An HMAC tag is appended
 * to prevent undetected tampering.
 *
 * **Format**: `{iv}:{ciphertext}:{mac}`
 * **Security**: Each encryption uses a unique IV and a MAC for integrity.
 *
 * @param content - Plaintext content to encrypt
 * @returns Promise resolving to encrypted string in format `{iv}:{ciphertext}:{mac}`
 * @throws Error if encryption key is not found
 * @example
 * ```ts
 * const encrypted = await encryptContent('My journal entry');
 * // Returns: "a1b2c3d4...:encrypted_ciphertext...:mac..."
 * ```
 */
export async function encryptContent(content: string): Promise<string> {
  const key = await getEncryptionKey();
  if (!key) throw new Error('Encryption key not found');

  // Generate random IV
  const ivBytes = await getRandomBytes(16);
  const iv = Array.from(ivBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Encrypt using AES-256-CBC
  const ciphertext = await aesEncryptCBC(content, key, iv);

  // Create payload for MAC
  const payload = `${iv}:${ciphertext}`;

  // Derive MAC key from encryption key using SHA-256
  const keyBytes = hexToBuffer(key);
  const macKeyHex = await sha256Bytes(keyBytes);

  // Compute HMAC over payload
  const mac = await hmacSHA256(payload, macKeyHex);

  return `${payload}:${mac}`;
}

/**
 * Decrypt content encrypted with encryptContent()
 *
 * Decrypts content that was encrypted using `encryptContent()`. Extracts the
 * IV from the encrypted string and uses it along with the stored encryption key.
 * If a MAC is present, it is verified before decryption.
 *
 * @param encrypted - Encrypted string in format `{iv}:{ciphertext}` or `{iv}:{ciphertext}:{mac}`
 * @returns Promise resolving to decrypted plaintext
 * @throws Error if encryption key is not found, format is invalid, or decryption fails
 * @example
 * ```ts
 * try {
 *   const decrypted = await decryptContent(encryptedString);
 *   // Use decrypted content
 * } catch (error) {
 *   // Handle decryption failure
 * }
 * ```
 */
export async function decryptContent(encrypted: string): Promise<string> {
  const key = await getEncryptionKey();
  if (!key) throw new Error('Encryption key not found');

  const parts = encrypted.split(':');
  if (parts.length !== 2 && parts.length !== 3) {
    throw new Error('Invalid format');
  }

  const [iv, ciphertext, mac] = parts;
  if (!iv || !ciphertext) throw new Error('Invalid format');
  if (parts.length === 3 && mac === '') throw new Error('Invalid format');

  // Verify MAC if present
  if (mac) {
    const keyBytes = hexToBuffer(key);
    const macKeyHex = await sha256Bytes(keyBytes);
    const payload = `${iv}:${ciphertext}`;
    const expectedMac = await hmacSHA256(payload, macKeyHex);

    if (!constantTimeEqual(expectedMac, mac)) {
      throw new Error('Integrity check failed');
    }
  }

  // Decrypt
  const plaintext = await aesDecryptCBC(ciphertext, key, iv);
  if (!plaintext) throw new Error('Decryption failed');

  return plaintext;
}

/**
 * Delete the encryption key
 *
 * **Warning**: This will make all encrypted data permanently inaccessible!
 * Only call this during account deletion or complete data wipe.
 *
 * @returns Promise that resolves when key is deleted
 * @example
 * ```ts
 * // During logout/account deletion
 * await deleteEncryptionKey();
 * await clearDatabase(db);
 * ```
 */
export async function deleteEncryptionKey(): Promise<void> {
  await secureStorage.deleteItemAsync(ENCRYPTION_KEY_NAME);
}

/**
 * Check if an encryption key exists
 *
 * @returns Promise resolving to true if encryption key exists, false otherwise
 * @example
 * ```ts
 * const hasKey = await hasEncryptionKey();
 * if (!hasKey) {
 *   // Show onboarding to generate key
 * }
 * ```
 */
export async function hasEncryptionKey(): Promise<boolean> {
  const key = await getEncryptionKey();
  return key !== null && key.length > 0;
}

/** Decrypt content with a specific key (for key rotation) */
async function decryptWithKey(encrypted: string, key: string): Promise<string> {
  const parts = encrypted.split(':');
  if (parts.length !== 2 && parts.length !== 3) throw new Error('Invalid format');
  const [iv, ciphertext, mac] = parts;
  if (!iv || !ciphertext) throw new Error('Invalid format');

  // Verify MAC if present
  if (mac) {
    const keyBytes = hexToBuffer(key);
    const macKeyHex = await sha256Bytes(keyBytes);
    const payload = `${iv}:${ciphertext}`;
    const expectedMac = await hmacSHA256(payload, macKeyHex);

    if (!constantTimeEqual(expectedMac, mac)) {
      throw new Error('Integrity check failed');
    }
  }

  // Decrypt
  const plaintext = await aesDecryptCBC(ciphertext, key, iv);
  if (!plaintext) throw new Error('Decryption failed');

  return plaintext;
}

/** Encrypt content with a specific key (for key rotation) */
async function encryptWithKey(content: string, key: string): Promise<string> {
  // Generate random IV
  const ivBytes = await getRandomBytes(16);
  const iv = Array.from(ivBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Encrypt using AES-256-CBC
  const ciphertext = await aesEncryptCBC(content, key, iv);

  // Create payload for MAC
  const payload = `${iv}:${ciphertext}`;

  // Derive MAC key from encryption key using SHA-256
  const keyBytes = hexToBuffer(key);
  const macKeyHex = await sha256Bytes(keyBytes);

  // Compute HMAC over payload
  const mac = await hmacSHA256(payload, macKeyHex);

  return `${payload}:${mac}`;
}

/**
 * Rotate the encryption key
 *
 * Generates a new key, re-encrypts all data, and atomically swaps keys.
 * This is a HEAVY operation that decrypts and re-encrypts all entries.
 *
 * @param db - Database adapter for querying/updating encrypted records
 * @param userId - Current user's ID
 * @param onProgress - Optional progress callback (0-100)
 * @returns Promise resolving when rotation is complete
 * @throws Error if rotation fails (original key is preserved)
 */
export async function rotateEncryptionKey(
  db: StorageAdapter,
  userId: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const oldKey = await getEncryptionKey();
  if (!oldKey) throw new Error('No existing encryption key found');

  // Generate new key (but don't store it yet)
  const randomBytes = await getRandomBytes(32);
  const randomString = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const salt = await generateUUID();
  const newKey = await pbkdf2(randomString, salt, KEY_DERIVATION_ITERATIONS, 256);

  // All tables with encrypted columns
  const tables = [
    {
      table: 'journal_entries',
      columns: [
        'encrypted_body',
        'encrypted_title',
        'encrypted_mood',
        'encrypted_craving',
        'encrypted_tags',
      ],
    },
    {
      table: 'daily_checkins',
      columns: [
        'encrypted_mood',
        'encrypted_craving',
        'encrypted_intention',
        'encrypted_reflection',
        'encrypted_gratitude',
      ],
    },
    { table: 'step_work', columns: ['encrypted_answer'] },
    { table: 'reading_reflections', columns: ['encrypted_reflection'] },
    { table: 'personal_inventory', columns: ['encrypted_answers', 'encrypted_notes'] },
    {
      table: 'gratitude_entries',
      columns: ['encrypted_item_1', 'encrypted_item_2', 'encrypted_item_3'],
    },
    {
      table: 'craving_surf_sessions',
      columns: ['encrypted_initial_rating', 'encrypted_final_rating', 'encrypted_distraction_used'],
    },
    { table: 'favorite_meetings', columns: ['encrypted_notes'] },
    { table: 'safety_plans', columns: ['encrypted_plan'] },
  ];

  // Count total items for progress
  let totalItems = 0;
  let processedItems = 0;

  for (const { table } of tables) {
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${table} WHERE user_id = ?`,
      [userId],
    );
    totalItems += result?.count ?? 0;
  }

  if (totalItems === 0) {
    // No data to re-encrypt, just swap the key
    await secureStorage.setItemAsync(ENCRYPTION_KEY_NAME, newKey);
    logger.info('Encryption key rotated (no data to re-encrypt)');
    onProgress?.(100);
    return;
  }

  logger.info('Starting encryption key rotation', { totalItems });

  // Re-encrypt all records: decrypt with old key, encrypt with new key
  for (const { table, columns } of tables) {
    const records = await db.getAllAsync<Record<string, string>>(
      `SELECT id, ${columns.join(', ')} FROM ${table} WHERE user_id = ?`,
      [userId],
    );

    for (const record of records) {
      const updates: string[] = [];
      const values: string[] = [];

      for (const col of columns) {
        const encrypted = record[col];
        if (encrypted) {
          const plaintext = await decryptWithKey(encrypted, oldKey);
          const reEncrypted = await encryptWithKey(plaintext, newKey);
          updates.push(`${col} = ?`);
          values.push(reEncrypted);
        }
      }

      if (updates.length > 0) {
        values.push(record['id']);
        await db.runAsync(`UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`, values);
      }

      processedItems++;
      onProgress?.(Math.round((processedItems / totalItems) * 100));
    }
  }

  // All data re-encrypted successfully, now swap the key
  await secureStorage.setItemAsync(ENCRYPTION_KEY_NAME, newKey);

  logger.info('Encryption key rotation complete', { totalItems: processedItems });
  onProgress?.(100);
}

/**
 * Helper to convert hex string to Uint8Array (internal)
 */
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}
