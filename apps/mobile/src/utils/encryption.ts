import CryptoJS from 'crypto-js';
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
import { secureStorage } from '../adapters/secureStorage/index';
import type { StorageAdapter } from '../adapters/storage/index.ts';
import { logger } from './logger';

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
  const derivedKey = CryptoJS.PBKDF2(randomString, salt, {
    keySize: 256 / 32,
    iterations: KEY_DERIVATION_ITERATIONS,
  }).toString();
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
// deno-lint-ignore require-await
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
  const ivBytes = await getRandomBytes(16);
  const iv = Array.from(ivBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const ivWordArray = CryptoJS.enc.Hex.parse(iv);
  const keyWordArray = CryptoJS.enc.Hex.parse(key);
  const encrypted = CryptoJS.AES.encrypt(content, keyWordArray, {
    iv: ivWordArray,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const payload = `${iv}:${encrypted.toString()}`;
  const macKey = CryptoJS.SHA256(keyWordArray);
  const mac = CryptoJS.HmacSHA256(payload, macKey).toString(CryptoJS.enc.Hex);
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
  if (mac) {
    const keyWordArray = CryptoJS.enc.Hex.parse(key);
    const macKey = CryptoJS.SHA256(keyWordArray);
    const payload = `${iv}:${ciphertext}`;
    const expectedMac = CryptoJS.HmacSHA256(payload, macKey).toString(CryptoJS.enc.Hex);
    if (!constantTimeEqual(expectedMac, mac)) {
      throw new Error('Integrity check failed');
    }
  }
  const ivWordArray = CryptoJS.enc.Hex.parse(iv);
  const keyWordArray = CryptoJS.enc.Hex.parse(key);
  const decrypted = CryptoJS.AES.decrypt(ciphertext, keyWordArray, {
    iv: ivWordArray,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
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

/**
 * Decrypt content with a specific key (used for key rotation workflows).
 *
 * This is a low-level, synchronous helper that performs decryption and
 * integrity verification using the provided key. Unlike {@link decryptContent},
 * this function does not access secure storage or perform any asynchronous I/O;
 * callers must supply the correct raw encryption key.
 *
 * The expected encrypted format is:
 * - `"iv:ciphertext"` for payloads without an HMAC
 * - `"iv:ciphertext:mac"` for payloads with an HMAC-SHA256 authentication tag
 *
 * @param encrypted - The encrypted payload string in `iv:ciphertext[:mac]` format,
 *                    where `iv`, `ciphertext`, and optional `mac` are hex-encoded.
 * @param key - Hex-encoded AES key to use for decryption. This should be the
 *              exact key that was originally used to encrypt the content.
 * @returns The decrypted plaintext string.
 *
 * @throws {Error} If the encrypted string format is invalid (missing parts).
 * @throws {Error} If the integrity check fails due to MAC mismatch.
 * @throws {Error} If decryption fails (for example, due to an incorrect key
 *                 or corrupted ciphertext).
 */
function decryptWithKey({ encrypted, key }: { encrypted: string; key: string }): string {
  const parts = encrypted.split(':');
  if (parts.length !== 2 && parts.length !== 3) throw new Error('Invalid format');
  const [iv, ciphertext, mac] = parts;
  if (!iv || !ciphertext) throw new Error('Invalid format');

  if (mac) {
    const keyWordArray = CryptoJS.enc.Hex.parse(key);
    const macKey = CryptoJS.SHA256(keyWordArray);
    const payload = `${iv}:${ciphertext}`;
    const expectedMac = CryptoJS.HmacSHA256(payload, macKey).toString(CryptoJS.enc.Hex);
    if (!constantTimeEqual(expectedMac, mac)) {
      throw new Error('Integrity check failed');
    }
  }

  const ivWordArray = CryptoJS.enc.Hex.parse(iv);
  const keyWordArray = CryptoJS.enc.Hex.parse(key);
  const decrypted = CryptoJS.AES.decrypt(ciphertext, keyWordArray, {
    iv: ivWordArray,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
  if (!plaintext) throw new Error('Decryption failed');
  return plaintext;
}

/** Encrypt content with a specific key (for key rotation) */
async function encryptWithKey(content: string, key: string): Promise<string> {
  const ivBytes = await getRandomBytes(16);
  const iv = Array.from(ivBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const ivWordArray = CryptoJS.enc.Hex.parse(iv);
  const keyWordArray = CryptoJS.enc.Hex.parse(key);
  const encrypted = CryptoJS.AES.encrypt(content, keyWordArray, {
    iv: ivWordArray,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const payload = `${iv}:${encrypted.toString()}`;
  const macKey = CryptoJS.SHA256(keyWordArray);
  const mac = CryptoJS.HmacSHA256(payload, macKey).toString(CryptoJS.enc.Hex);
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
  const newKey = CryptoJS.PBKDF2(randomString, salt, {
    keySize: 256 / 32,
    iterations: KEY_DERIVATION_ITERATIONS,
  }).toString();

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
      columns: ['encrypted_notes'],
    },
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

  // Pre-compute all re-encrypted values BEFORE touching the database.
  // This keeps the transaction short and pure (only UPDATEs, no crypto work).
  type PendingUpdate = { table: string; sql: string; values: string[] };
  const pendingUpdates: PendingUpdate[] = [];

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
          const plaintext = await decryptWithKey({ encrypted, key: oldKey });
          const reEncrypted = await encryptWithKey(plaintext, newKey);
          updates.push(`${col} = ?`);
          values.push(reEncrypted);
        }
      }

      if (updates.length > 0) {
        values.push(record['id']);
        pendingUpdates.push({
          table,
          sql: `UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`,
          values,
        });
      }

      processedItems++;
      onProgress?.(Math.round((processedItems / totalItems) * 90)); // 0-90% for re-encrypt phase
    }
  }

  // Apply all re-encrypted records atomically. If any UPDATE fails the
  // transaction rolls back and the old key remains valid — no data corruption.
  await db.withTransactionAsync(async () => {
    for (const { sql, values } of pendingUpdates) {
      await db.runAsync(sql, values);
    }
  });

  // All data re-encrypted successfully, now swap the key
  await secureStorage.setItemAsync(ENCRYPTION_KEY_NAME, newKey);

  logger.info('Encryption key rotation complete', { totalItems: processedItems });
  onProgress?.(100); // 100% only after key swap succeeds
}
