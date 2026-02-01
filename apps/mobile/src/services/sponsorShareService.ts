/**
 * Sponsor Share Service
 *
 * Encrypts/decrypts shared journal entries for local-only sponsor exchange.
 * Uses AES encryption with a pairing code as the passphrase.
 */

import CryptoJS from 'crypto-js';
import type { JournalEntryDecrypted } from '@recovery/shared/src/types/models';

const SHARE_PREFIX = 'RCENTRY:';

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

export function encryptSharedEntry(entry: JournalEntryDecrypted, passphrase: string): string {
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

  const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(payload), passphrase).toString();
  return `${SHARE_PREFIX}${ciphertext}`;
}

export function decryptSharedEntry(encoded: string, passphrase: string): SharedEntryPayload | null {
  try {
    if (!encoded.startsWith(SHARE_PREFIX)) {
      return null;
    }
    const ciphertext = encoded.slice(SHARE_PREFIX.length);
    const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    if (!plaintext) return null;
    return JSON.parse(plaintext) as SharedEntryPayload;
  } catch {
    return null;
  }
}

export function buildShareMessage(payload: SharedEntryPayload, encoded: string): string {
  const title = payload.entry.title ? `\"${payload.entry.title}\"` : 'a journal entry';
  return [
    `A sponsee shared ${title} with you from Steps to Recovery.`,
    'Paste the code below into your Sponsor screen to import it.',
    '',
    encoded,
  ].join('\n');
}
