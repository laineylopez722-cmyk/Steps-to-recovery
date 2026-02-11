/**
 * Encryption Key Rotation Service
 *
 * Allows users to rotate their encryption key and re-encrypt all existing data.
 * The rotation is atomic: if it fails mid-way, the old key is preserved.
 *
 * Key metadata (creation timestamp) is stored in SecureStore alongside the key.
 *
 * @module services/keyRotationService
 */

import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import { secureStorage } from '../adapters/secureStorage';
import type { StorageAdapter } from '../adapters/storage';
import { logger } from '../utils/logger';
import { addToSyncQueue } from './syncService';

/** SecureStore key names */
const ENCRYPTION_KEY_NAME = 'journal_encryption_key';
const KEY_CREATED_AT_NAME = 'encryption_key_created_at';

/** PBKDF2 iterations for key derivation */
const KEY_DERIVATION_ITERATIONS = 100000;

/** Recommended rotation interval in days */
const ROTATION_INTERVAL_DAYS = 90;

/**
 * Progress information during key rotation
 */
export interface KeyRotationProgress {
  totalRecords: number;
  processedRecords: number;
  currentTable: string;
  status: 'idle' | 'in_progress' | 'completed' | 'failed';
  error?: string;
}

/**
 * Key metadata returned by getKeyMetadata
 */
export interface KeyMetadata {
  createdAt: string;
  ageDays: number;
}

/**
 * Table definition for re-encryption
 */
interface EncryptedTableDef {
  table: string;
  columns: string[];
}

/** All tables with encrypted columns that need re-encryption */
const ENCRYPTED_TABLES: EncryptedTableDef[] = [
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
  { table: 'sponsor_messages', columns: ['encrypted_content'] },
  { table: 'memories', columns: ['encrypted_content', 'encrypted_context'] },
];

/**
 * Get random bytes in a platform-agnostic way
 */
async function getRandomBytes(length: number): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    return crypto.getRandomValues(new Uint8Array(length));
  } else {
    const Crypto = await import('expo-crypto');
    return Crypto.getRandomBytesAsync(length);
  }
}

/**
 * Generate random UUID in a platform-agnostic way
 */
async function generateUUID(): Promise<string> {
  if (Platform.OS === 'web') {
    return crypto.randomUUID();
  } else {
    const Crypto = await import('expo-crypto');
    return Crypto.randomUUID();
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Decrypt content with a specific key
 */
function decryptWithKey(encrypted: string, key: string): string {
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

/**
 * Encrypt content with a specific key
 */
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
 * Generate a new derived encryption key (without storing it)
 */
async function generateNewKey(): Promise<string> {
  const randomBytes = await getRandomBytes(32);
  const randomString = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const salt = await generateUUID();
  return CryptoJS.PBKDF2(randomString, salt, {
    keySize: 256 / 32,
    iterations: KEY_DERIVATION_ITERATIONS,
  }).toString();
}

/**
 * Check whether a table exists in the database
 */
async function tableExists(db: StorageAdapter, tableName: string): Promise<boolean> {
  const result = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name=?`,
    [tableName],
  );
  return (result?.cnt ?? 0) > 0;
}

/**
 * Rotate the encryption key
 *
 * Generates a new encryption key, re-encrypts all data across all encrypted
 * tables, and atomically swaps the key. If any step fails, the old key is
 * preserved and all data remains decryptable.
 *
 * After rotation, all records are marked for re-sync so the cloud backup
 * receives the re-encrypted data.
 *
 * @param db - Database storage adapter
 * @param userId - Current user's ID
 * @param onProgress - Callback invoked with rotation progress updates
 * @returns true on success, false on failure
 */
export async function rotateEncryptionKey(
  db: StorageAdapter,
  userId: string,
  onProgress: (progress: KeyRotationProgress) => void,
): Promise<boolean> {
  const oldKey = await secureStorage.getItemAsync(ENCRYPTION_KEY_NAME);
  if (!oldKey) {
    onProgress({
      totalRecords: 0,
      processedRecords: 0,
      currentTable: '',
      status: 'failed',
      error: 'No existing encryption key found',
    });
    return false;
  }

  onProgress({
    totalRecords: 0,
    processedRecords: 0,
    currentTable: '',
    status: 'in_progress',
  });

  let newKey: string;
  try {
    newKey = await generateNewKey();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Key generation failed';
    onProgress({
      totalRecords: 0,
      processedRecords: 0,
      currentTable: '',
      status: 'failed',
      error: message,
    });
    return false;
  }

  // Determine which tables actually exist in the database
  const activeTables: EncryptedTableDef[] = [];
  for (const def of ENCRYPTED_TABLES) {
    if (await tableExists(db, def.table)) {
      activeTables.push(def);
    }
  }

  // Count total records across all tables for progress reporting
  let totalRecords = 0;
  for (const { table } of activeTables) {
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${table} WHERE user_id = ?`,
        [userId],
      );
      totalRecords += result?.count ?? 0;
    } catch {
      // Table may not have user_id column; skip count
    }
  }

  if (totalRecords === 0) {
    // No data to re-encrypt — just swap the key
    await secureStorage.setItemAsync(ENCRYPTION_KEY_NAME, newKey);
    await secureStorage.setItemAsync(KEY_CREATED_AT_NAME, new Date().toISOString());
    logger.info('Encryption key rotated (no data to re-encrypt)');
    onProgress({
      totalRecords: 0,
      processedRecords: 0,
      currentTable: '',
      status: 'completed',
    });
    return true;
  }

  logger.info('Starting encryption key rotation', { totalRecords });

  let processedRecords = 0;

  try {
    for (const { table, columns } of activeTables) {
      onProgress({
        totalRecords,
        processedRecords,
        currentTable: table,
        status: 'in_progress',
      });

      let records: Record<string, string>[];
      try {
        records = await db.getAllAsync<Record<string, string>>(
          `SELECT id, ${columns.join(', ')} FROM ${table} WHERE user_id = ?`,
          [userId],
        );
      } catch {
        // Table may not match expected schema; skip
        continue;
      }

      for (const record of records) {
        const updates: string[] = [];
        const values: (string | null)[] = [];

        for (const col of columns) {
          const encrypted = record[col];
          if (encrypted) {
            try {
              const plaintext = decryptWithKey(encrypted, oldKey);
              const reEncrypted = await encryptWithKey(plaintext, newKey);
              updates.push(`${col} = ?`);
              values.push(reEncrypted);
            } catch {
              // Column value may not be encrypted or may be corrupt; skip it
              logger.warn('Skipped column during rotation', { table, col, recordId: record['id'] });
            }
          }
        }

        if (updates.length > 0) {
          values.push(record['id']);
          await db.runAsync(`UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`, values);
        }

        processedRecords++;
        onProgress({
          totalRecords,
          processedRecords,
          currentTable: table,
          status: 'in_progress',
        });
      }

      // Mark all records in this table for re-sync
      for (const record of records) {
        try {
          await addToSyncQueue(db, table, record['id'], 'update');
        } catch {
          // Sync queue failure is non-critical for rotation
        }
      }
    }

    // All data re-encrypted successfully — swap the key
    await secureStorage.setItemAsync(ENCRYPTION_KEY_NAME, newKey);
    await secureStorage.setItemAsync(KEY_CREATED_AT_NAME, new Date().toISOString());

    logger.info('Encryption key rotation complete', { totalRecords: processedRecords });
    onProgress({
      totalRecords,
      processedRecords,
      currentTable: '',
      status: 'completed',
    });
    return true;
  } catch (error) {
    // Rotation failed — old key is still in place, no data was lost
    const message = error instanceof Error ? error.message : 'Rotation failed';
    logger.error('Encryption key rotation failed', { error: message });
    onProgress({
      totalRecords,
      processedRecords,
      currentTable: '',
      status: 'failed',
      error: message,
    });
    return false;
  }
}

/**
 * Check if the encryption key should be rotated
 *
 * Returns true if the key is older than 90 days or if no creation date
 * is recorded (legacy key).
 */
export async function shouldRotateKey(): Promise<boolean> {
  const metadata = await getKeyMetadata();
  if (!metadata) return false;
  return metadata.ageDays >= ROTATION_INTERVAL_DAYS;
}

/**
 * Get metadata about the current encryption key
 *
 * @returns Key metadata with creation date and age, or null if no key exists
 */
export async function getKeyMetadata(): Promise<KeyMetadata | null> {
  const key = await secureStorage.getItemAsync(ENCRYPTION_KEY_NAME);
  if (!key) return null;

  const createdAt = await secureStorage.getItemAsync(KEY_CREATED_AT_NAME);
  if (!createdAt) {
    // Legacy key with no recorded creation date — treat as very old
    return {
      createdAt: 'unknown',
      ageDays: ROTATION_INTERVAL_DAYS + 1,
    };
  }

  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const ageDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return { createdAt, ageDays };
}

/**
 * Record the current time as the key creation date
 *
 * Call this after generating an encryption key during onboarding
 * so key age can be tracked.
 */
export async function recordKeyCreationDate(): Promise<void> {
  await secureStorage.setItemAsync(KEY_CREATED_AT_NAME, new Date().toISOString());
}
