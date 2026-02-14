/**
 * Sponsor Share Service
 *
 * Encrypts/decrypts shared journal entries for local-only sponsor exchange.
 * Uses AES encryption with a pairing code as the passphrase.
 *
 * This implementation uses standard PBKDF2 key derivation + AES-256-CBC,
 * replacing the previous CryptoJS passphrase-based encryption.
 */

import type { JournalEntryDecrypted } from '@recovery/shared';
import {
  aesDecryptCBC,
  aesEncryptCBC,
  pbkdf2,
} from '../utils/webCrypto';

const SHARE_PREFIX = 'RCENTRY:';

/** PBKDF2 iterations for key derivation */
const PBKDF2_ITERATIONS = 100000;

export interface SharedEntryPayload {
  version: 1;
  sharedAt: string;
  entry: {
    id: string;
    title: string | null;
    body: string;
    mood: number | null;
    craving: number | null;
    tags: string[];
    createdAt: string;
  };
}

/**
 * Encrypt a journal entry for sharing with a sponsor
 *
 * Uses PBKDF2 to derive an encryption key from the passphrase, then
 * encrypts with AES-256-CBC.
 *
 * @param entry - Journal entry to encrypt
 * @param passphrase - Passphrase (pairing code) for encryption
 * @returns Encrypted string with prefix
 */
export async function encryptSharedEntry(
  entry: JournalEntryDecrypted,
  passphrase: string,
): Promise<string> {
  const payload: SharedEntryPayload = {
    version: 1,
    sharedAt: new Date().toISOString(),
    entry: {
      id: entry.id,
      title: entry.title ?? null,
      body: entry.body,
      mood: entry.mood ?? null,
      craving: entry.craving ?? null,
      tags: entry.tags ?? [],
      createdAt: entry.created_at,
    },
  };

  const plaintext = JSON.stringify(payload);

  // Use passphrase as salt (simple approach for this use case)
  // In production, you might want a random salt transmitted with the ciphertext
  const salt = passphrase;

  // Derive 256-bit key from passphrase using PBKDF2
  const key = await pbkdf2(passphrase, salt, PBKDF2_ITERATIONS, 256);

  // Generate random IV (16 bytes)
  const ivBytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(ivBytes);
  const iv = Array.from(ivBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Encrypt with AES-256-CBC
  const ciphertext = await aesEncryptCBC(plaintext, key, iv);

  // Format: prefix:iv:ciphertext (no MAC needed for this use case)
  return `${SHARE_PREFIX}${iv}:${ciphertext}`;
}

/**
 * Decrypt a shared journal entry
 *
 * @param encoded - Encrypted string with prefix
 * @param passphrase - Passphrase (pairing code) for decryption
 * @returns Decrypted payload or null if decryption fails
 */
export async function decryptSharedEntry(
  encoded: string,
  passphrase: string,
): Promise<SharedEntryPayload | null> {
  try {
    if (!encoded.startsWith(SHARE_PREFIX)) {
      return null;
    }

    const encryptedData = encoded.slice(SHARE_PREFIX.length);
    const parts = encryptedData.split(':');

    if (parts.length !== 2) {
      return null;
    }

    const [iv, ciphertext] = parts;

    if (!iv || !ciphertext) {
      return null;
    }

    // Use passphrase as salt (must match encryption)
    const salt = passphrase;

    // Derive key from passphrase
    const key = await pbkdf2(passphrase, salt, PBKDF2_ITERATIONS, 256);

    // Decrypt
    const plaintext = await aesDecryptCBC(ciphertext, key, iv);

    if (!plaintext) {
      return null;
    }

    const payload = JSON.parse(plaintext) as SharedEntryPayload;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Build a share message for the sponsor
 *
 * @param payload - The decrypted payload
 * @param encoded - The encrypted string
 * @returns Formatted message for sharing
 */
export function buildShareMessage(payload: SharedEntryPayload, encoded: string): string {
  const title = payload.entry.title ? `"${payload.entry.title}"` : 'a journal entry';
  return [
    `A sponsee shared ${title} with you from Steps to Recovery.`,
    'Paste the code below into your Sponsor screen to import it.',
    '',
    encoded,
  ].join('\n');
}
