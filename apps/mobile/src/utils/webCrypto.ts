/**
 * Web Crypto API Utilities
 *
 * Provides low-level wrappers around the Web Crypto API (crypto.subtle) for
 * AES-256-CBC encryption, HMAC-SHA256, SHA-256, and PBKDF2.
 *
 * This replaces crypto-js with native-speed, hardware-backed crypto operations.
 * The implementations are designed to be byte-compatible with crypto-js for
 * backward compatibility with existing encrypted data.
 *
 * @module utils/webCrypto
 */

// Ensure crypto.subtle is available (provided by expo-standard-web-crypto)
import 'expo-standard-web-crypto';

/** Helper: cast Uint8Array to BufferSource for Web Crypto API TS strict mode */
function toBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/**
 * Convert a hex string to a Uint8Array
 */
export function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Convert a Uint8Array to a hex string
 */
export function bufferToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert a Uint8Array to a base64 string
 */
export function bufferToBase64(buf: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buf.length; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return globalThis.btoa(binary);
}

/**
 * Convert a base64 string to a Uint8Array
 */
export function base64ToBuffer(b64: string): Uint8Array {
  const binary = globalThis.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * AES-256-CBC encryption
 *
 * Encrypts plaintext using AES-256-CBC with PKCS7 padding.
 * Produces Base64-encoded ciphertext compatible with crypto-js output.
 *
 * @param plaintext - Plaintext to encrypt (UTF-8)
 * @param keyHex - Encryption key as hex string (256-bit)
 * @param ivHex - Initialization vector as hex string (128-bit)
 * @returns Base64-encoded ciphertext
 */
export async function aesEncryptCBC(
  plaintext: string,
  keyHex: string,
  ivHex: string,
): Promise<string> {
  const keyData = hexToBuffer(keyHex);
  const ivData = hexToBuffer(ivHex);

  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    toBuffer(keyData),
    { name: 'AES-CBC', length: 256 },
    false,
    ['encrypt'],
  );

  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: toBuffer(ivData) as ArrayBuffer },
    key,
    toBuffer(plaintextBytes),
  );

  return bufferToBase64(new Uint8Array(ciphertext));
}

/**
 * AES-256-CBC decryption
 *
 * Decrypts Base64-encoded ciphertext using AES-256-CBC.
 *
 * @param ciphertextB64 - Base64-encoded ciphertext
 * @param keyHex - Decryption key as hex string (256-bit)
 * @param ivHex - Initialization vector as hex string (128-bit)
 * @returns Decrypted plaintext (UTF-8)
 */
export async function aesDecryptCBC(
  ciphertextB64: string,
  keyHex: string,
  ivHex: string,
): Promise<string> {
  const keyData = hexToBuffer(keyHex);
  const ivData = hexToBuffer(ivHex);
  const ciphertext = base64ToBuffer(ciphertextB64);

  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    toBuffer(keyData),
    { name: 'AES-CBC', length: 256 },
    false,
    ['decrypt'],
  );

  const plaintextBytes = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: toBuffer(ivData) as ArrayBuffer },
    key,
    toBuffer(ciphertext),
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintextBytes);
}

/**
 * HMAC-SHA256
 *
 * Computes HMAC-SHA256 signature.
 *
 * @param data - Data to sign
 * @param keyHex - HMAC key as hex string
 * @returns Hex-encoded MAC (64 characters)
 */
export async function hmacSHA256(data: string, keyHex: string): Promise<string> {
  const keyData = hexToBuffer(keyHex);
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);

  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    toBuffer(keyData),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await globalThis.crypto.subtle.sign('HMAC', key, toBuffer(dataBytes));

  return bufferToHex(new Uint8Array(signature));
}

/**
 * SHA-256 hash
 *
 * Computes SHA-256 hash of a UTF-8 string.
 *
 * @param data - Data to hash
 * @returns Hex-encoded hash (64 characters)
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);

  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', toBuffer(dataBytes));

  return bufferToHex(new Uint8Array(hashBuffer));
}

/**
 * SHA-256 hash (raw bytes version)
 *
 * Computes SHA-256 hash of raw bytes (used for MAC key derivation from key bytes).
 *
 * @param dataBytes - Uint8Array of data to hash
 * @returns Hex-encoded hash (64 characters)
 */
export async function sha256Bytes(dataBytes: Uint8Array): Promise<string> {
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', toBuffer(dataBytes));

  return bufferToHex(new Uint8Array(hashBuffer));
}

/**
 * PBKDF2 key derivation
 *
 * Derives a key from a password using PBKDF2 with SHA-256.
 * The salt is treated as a UTF-8 string (matching CryptoJS behavior).
 *
 * @param password - Password to derive from (UTF-8 string)
 * @param salt - Salt as UTF-8 string
 * @param iterations - Number of iterations (default: 100000)
 * @param keyLength - Desired key length in bits (default: 256)
 * @returns Hex-encoded derived key
 */
export async function pbkdf2(
  password: string,
  salt: string,
  iterations: number = 100000,
  keyLength: number = 256,
): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const saltBytes = encoder.encode(salt);

  const passwordKey = await globalThis.crypto.subtle.importKey(
    'raw',
    toBuffer(passwordBytes),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: toBuffer(saltBytes),
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    keyLength,
  );

  return bufferToHex(new Uint8Array(derivedBits));
}

/**
 * PBKDF2 key derivation (raw bytes password)
 *
 * Derives a key from raw bytes using PBKDF2.
 *
 * @param passwordBytes - Password as Uint8Array
 * @param salt - Salt as UTF-8 string
 * @param iterations - Number of iterations (default: 100000)
 * @param keyLength - Desired key length in bits (default: 256)
 * @returns Hex-encoded derived key
 */
export async function pbkdf2FromBytes(
  passwordBytes: Uint8Array,
  salt: string,
  iterations: number = 100000,
  keyLength: number = 256,
): Promise<string> {
  const encoder = new TextEncoder();
  const saltBytes = encoder.encode(salt);

  const passwordKey = await globalThis.crypto.subtle.importKey(
    'raw',
    toBuffer(passwordBytes),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: toBuffer(saltBytes),
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    keyLength,
  );

  return bufferToHex(new Uint8Array(derivedBits));
}
