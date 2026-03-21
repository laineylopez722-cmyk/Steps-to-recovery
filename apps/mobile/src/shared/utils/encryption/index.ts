/**
 * Encryption utilities for secure data storage
 * All sensitive journal content is encrypted before storage
 *
 * Uses AES-256-GCM for production-grade encryption
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_NAME = 'app_encryption_key';
const ENCRYPTION_VERSION = 2; // v1 = XOR (legacy), v2 = AES-256-GCM

// AES-256-GCM constants
const AES_KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

// Type declaration for accessing crypto.subtle safely
interface CryptoWithSubtle {
  subtle?: SubtleCrypto;
}

function assertWebCryptoAvailable() {
  const cryptoObj = globalThis.crypto as CryptoWithSubtle | undefined;
  if (!cryptoObj?.subtle) {
    throw new Error(
      'WebCrypto is unavailable. Ensure polyfills.ts/js loads expo-standard-web-crypto before app initialization.',
    );
  }
}

/**
 * Generate a new encryption key if one doesn't exist
 * Key is stored in secure storage with biometric protection
 */
export async function initializeEncryptionKey(): Promise<void> {
  try {
    const existingKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_NAME);
    if (!existingKey) {
      const randomBytes = await Crypto.getRandomBytesAsync(AES_KEY_LENGTH);
      const key = bytesToHex(new Uint8Array(randomBytes));

      await SecureStore.setItemAsync(ENCRYPTION_KEY_NAME, key, {
        requireAuthentication: true, // Biometric required to access
      });
    }
  } catch (error) {
    // Fallback: store without biometric requirement for devices that don't support it
    const randomBytes = await Crypto.getRandomBytesAsync(AES_KEY_LENGTH);
    const key = bytesToHex(new Uint8Array(randomBytes));

    await SecureStore.setItemAsync(ENCRYPTION_KEY_NAME, key);
  }
}

/**
 * Get the encryption key from secure storage
 */
export async function getEncryptionKey(): Promise<string | null> {
  return await SecureStore.getItemAsync(ENCRYPTION_KEY_NAME);
}

/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert string to UTF-8 bytes
 */
function stringToBytes(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Convert UTF-8 bytes to string
 */
function bytesToString(bytes: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

/**
 * Convert bytes to base64
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 to bytes
 */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Ensure we always pass a concrete ArrayBuffer (copy to avoid ArrayBufferLike issues)
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

/**
 * Import key for Web Crypto API
 */
async function importKey(keyHex: string): Promise<CryptoKey> {
  assertWebCryptoAvailable();
  const keyBytes = hexToBytes(keyHex);
  return await crypto.subtle.importKey('raw', toArrayBuffer(keyBytes), { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * AES-256-GCM Encryption
 * @param plaintext - The text to encrypt
 * @param keyHex - The hex-encoded encryption key
 * @returns Base64 encoded string: version(1) + iv(12) + ciphertext + authTag(16)
 */
async function aesGcmEncrypt(plaintext: string, keyHex: string): Promise<string> {
  assertWebCryptoAvailable();
  // Generate random IV
  const ivBytes = await Crypto.getRandomBytesAsync(IV_LENGTH);
  const iv = new Uint8Array(ivBytes);

  // Import key
  const cryptoKey = await importKey(keyHex);

  // Encrypt
  const plaintextBytes = stringToBytes(plaintext);
  const plaintextBuffer = toArrayBuffer(plaintextBytes);
  const ciphertextWithTag = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: AUTH_TAG_LENGTH * 8, // bits
    },
    cryptoKey,
    plaintextBuffer,
  );

  // Combine: version (1 byte) + iv (12 bytes) + ciphertext + authTag
  const combined = new Uint8Array(1 + IV_LENGTH + ciphertextWithTag.byteLength);
  combined[0] = ENCRYPTION_VERSION;
  combined.set(iv, 1);
  combined.set(new Uint8Array(ciphertextWithTag), 1 + IV_LENGTH);

  return bytesToBase64(combined);
}

/**
 * AES-256-GCM Decryption
 * @param ciphertext - Base64 encoded encrypted data
 * @param keyHex - The hex-encoded encryption key
 * @returns Decrypted plaintext
 */
async function aesGcmDecrypt(ciphertext: string, keyHex: string): Promise<string> {
  assertWebCryptoAvailable();
  const combined = base64ToBytes(ciphertext);

  // Extract components
  const version = combined[0];
  if (version !== ENCRYPTION_VERSION) {
    throw new Error(`Unsupported encryption version: ${version}`);
  }

  const iv = combined.slice(1, 1 + IV_LENGTH);
  const encryptedData = combined.slice(1 + IV_LENGTH);

  // Import key
  const cryptoKey = await importKey(keyHex);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: AUTH_TAG_LENGTH * 8,
    },
    cryptoKey,
    toArrayBuffer(encryptedData),
  );

  return bytesToString(new Uint8Array(decrypted));
}

// ============================================
// Legacy XOR encryption (v1) - for migration
// ============================================

/**
 * Legacy XOR-based encryption (v1) - ONLY for decrypting old data
 */
function xorDecryptLegacy(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

/**
 * Detect if ciphertext is legacy v1 (XOR) format
 * Legacy format: base64 encoded string starting with 32-char hex salt
 */
function isLegacyEncryption(ciphertext: string): boolean {
  try {
    const decoded = base64ToBytes(ciphertext);
    // v2 format starts with version byte (0x02)
    // v1 format starts with hex characters (0-9, a-f)
    return decoded[0] !== ENCRYPTION_VERSION;
  } catch {
    return true; // Assume legacy if parsing fails
  }
}

/**
 * Decrypt legacy XOR-encrypted content
 */
function decryptLegacy(ciphertext: string, key: string): string {
  const binaryString = atob(ciphertext);

  // Extract salt (first 32 chars = 16 bytes in hex)
  const saltHex = binaryString.substring(0, 32);
  const encrypted = binaryString.substring(32);

  const saltedKey = key + saltHex;
  return xorDecryptLegacy(encrypted, saltedKey);
}

// ============================================
// Public API
// ============================================

/**
 * Encrypt content before storing in database
 * @param plaintext - The text to encrypt
 * @returns Base64 encoded encrypted string (AES-256-GCM)
 */
export async function encryptContent(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  if (!key) {
    throw new Error('Encryption key not initialized');
  }

  return await aesGcmEncrypt(plaintext, key);
}

/**
 * Decrypt content retrieved from database
 * Automatically handles both legacy (XOR) and new (AES-GCM) formats
 * @param ciphertext - Base64 encoded encrypted string
 * @returns Decrypted plaintext
 */
export async function decryptContent(ciphertext: string): Promise<string> {
  const key = await getEncryptionKey();
  if (!key) {
    throw new Error('Encryption key not initialized');
  }

  // Check for legacy format and handle migration
  if (isLegacyEncryption(ciphertext)) {
    return decryptLegacy(ciphertext, key);
  }

  return await aesGcmDecrypt(ciphertext, key);
}

/**
 * Re-encrypt content from legacy format to new AES-GCM format
 * Use this for migrating existing encrypted data
 * @param legacyCiphertext - Legacy encrypted content
 * @returns New AES-GCM encrypted content
 */
export async function migrateEncryption(legacyCiphertext: string): Promise<string> {
  const key = await getEncryptionKey();
  if (!key) {
    throw new Error('Encryption key not initialized');
  }

  // Decrypt with legacy method
  const plaintext = decryptLegacy(legacyCiphertext, key);

  // Re-encrypt with AES-GCM
  return await aesGcmEncrypt(plaintext, key);
}

/**
 * Check if content needs migration to new encryption format
 */
export function needsMigration(ciphertext: string): boolean {
  return isLegacyEncryption(ciphertext);
}

/**
 * Check if encryption is properly initialized
 */
export async function isEncryptionReady(): Promise<boolean> {
  const key = await getEncryptionKey();
  return key !== null;
}

/**
 * Clear encryption key (for testing or account reset)
 * WARNING: This will make all encrypted data unrecoverable
 */
export async function clearEncryptionKey(): Promise<void> {
  await SecureStore.deleteItemAsync(ENCRYPTION_KEY_NAME);
}

/**
 * Get current encryption version
 */
export function getEncryptionVersion(): number {
  return ENCRYPTION_VERSION;
}
