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

import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import { secureStorage } from '../adapters/secureStorage';

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
function constantTimeEqual(a: string, b: string): boolean {
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
