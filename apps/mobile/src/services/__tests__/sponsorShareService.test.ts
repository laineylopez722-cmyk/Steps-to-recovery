import CryptoJS from 'crypto-js';
import type { JournalEntryDecrypted } from '@recovery/shared';
import {
  encryptSharedEntry,
  decryptSharedEntry,
  buildShareMessage,
} from '../sponsorShareService';
import type { SharedEntryPayload } from '../sponsorShareService';

describe('sponsorShareService', () => {
  const mockEntry: JournalEntryDecrypted = {
    id: 'entry-123',
    user_id: 'user-1',
    title: 'My Recovery Journey',
    body: 'Today was a good day. I attended a meeting and shared.',
    mood: 4,
    craving: 2,
    tags: ['meeting', 'sharing'],
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
    sync_status: 'synced',
    supabase_id: 'sb-123',
  };

  const passphrase = 'test-pairing-code-123';

  // ========================================
  // encryptSharedEntry
  // ========================================

  describe('encryptSharedEntry', () => {
    it('should return string prefixed with RCENTRY:', () => {
      const result = encryptSharedEntry(mockEntry, passphrase);

      expect(result.startsWith('RCENTRY:')).toBe(true);
      expect(result.length).toBeGreaterThan('RCENTRY:'.length);
    });

    it('should produce different ciphertext than plaintext', () => {
      const result = encryptSharedEntry(mockEntry, passphrase);
      const ciphertext = result.slice('RCENTRY:'.length);

      expect(ciphertext).not.toContain(mockEntry.body);
      expect(ciphertext).not.toContain(mockEntry.title);
    });

    it('should handle entry with null title', () => {
      const entryNoTitle: JournalEntryDecrypted = {
        ...mockEntry,
        title: null,
      };

      const result = encryptSharedEntry(entryNoTitle, passphrase);

      expect(result.startsWith('RCENTRY:')).toBe(true);

      // Verify roundtrip
      const decrypted = decryptSharedEntry(result, passphrase);
      expect(decrypted).not.toBeNull();
      expect(decrypted?.entry.title).toBeNull();
    });

    it('should handle entry with null mood and craving', () => {
      const entryNoMood: JournalEntryDecrypted = {
        ...mockEntry,
        mood: null,
        craving: null,
      };

      const result = encryptSharedEntry(entryNoMood, passphrase);
      const decrypted = decryptSharedEntry(result, passphrase);

      expect(decrypted?.entry.mood).toBeNull();
      expect(decrypted?.entry.craving).toBeNull();
    });

    it('should handle entry with empty tags', () => {
      const entryNoTags: JournalEntryDecrypted = {
        ...mockEntry,
        tags: [],
      };

      const result = encryptSharedEntry(entryNoTags, passphrase);
      const decrypted = decryptSharedEntry(result, passphrase);

      expect(decrypted?.entry.tags).toEqual([]);
    });

    it('should include version 1 in payload', () => {
      const result = encryptSharedEntry(mockEntry, passphrase);
      const decrypted = decryptSharedEntry(result, passphrase);

      expect(decrypted?.version).toBe(1);
    });

    it('should include sharedAt timestamp', () => {
      const result = encryptSharedEntry(mockEntry, passphrase);
      const decrypted = decryptSharedEntry(result, passphrase);

      expect(decrypted?.sharedAt).toBeDefined();
      // Verify it's a valid ISO string
      expect(() => new Date(decrypted!.sharedAt)).not.toThrow();
    });
  });

  // ========================================
  // decryptSharedEntry
  // ========================================

  describe('decryptSharedEntry', () => {
    it('should decrypt an encrypted entry with correct passphrase', () => {
      const encrypted = encryptSharedEntry(mockEntry, passphrase);
      const decrypted = decryptSharedEntry(encrypted, passphrase);

      expect(decrypted).not.toBeNull();
      expect(decrypted?.entry.id).toBe(mockEntry.id);
      expect(decrypted?.entry.body).toBe(mockEntry.body);
      expect(decrypted?.entry.title).toBe(mockEntry.title);
      expect(decrypted?.entry.mood).toBe(mockEntry.mood);
      expect(decrypted?.entry.craving).toBe(mockEntry.craving);
      expect(decrypted?.entry.tags).toEqual(mockEntry.tags);
      expect(decrypted?.entry.createdAt).toBe(mockEntry.created_at);
    });

    it('should return null for wrong passphrase', () => {
      const encrypted = encryptSharedEntry(mockEntry, passphrase);
      const decrypted = decryptSharedEntry(encrypted, 'wrong-passphrase');

      expect(decrypted).toBeNull();
    });

    it('should return null for string without RCENTRY: prefix', () => {
      const result = decryptSharedEntry('some-random-string', passphrase);

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = decryptSharedEntry('', passphrase);

      expect(result).toBeNull();
    });

    it('should return null for malformed ciphertext after prefix', () => {
      const result = decryptSharedEntry('RCENTRY:not-valid-ciphertext', passphrase);

      expect(result).toBeNull();
    });

    it('should return null for RCENTRY: prefix with empty ciphertext', () => {
      const result = decryptSharedEntry('RCENTRY:', passphrase);

      expect(result).toBeNull();
    });

    it('should perform full encrypt-decrypt roundtrip', () => {
      const encrypted = encryptSharedEntry(mockEntry, passphrase);
      const decrypted = decryptSharedEntry(encrypted, passphrase);

      expect(decrypted).not.toBeNull();
      expect(decrypted?.version).toBe(1);
      expect(decrypted?.entry.id).toBe(mockEntry.id);
      expect(decrypted?.entry.body).toBe(mockEntry.body);
    });
  });

  // ========================================
  // buildShareMessage
  // ========================================

  describe('buildShareMessage', () => {
    it('should build message with entry title', () => {
      const payload: SharedEntryPayload = {
        version: 1,
        sharedAt: '2026-01-15T10:00:00Z',
        entry: {
          id: 'entry-123',
          title: 'My Recovery Journey',
          body: 'Today was good',
          mood: 4,
          craving: 2,
          tags: [],
          createdAt: '2026-01-15T10:00:00Z',
        },
      };
      const encoded = 'RCENTRY:abc123';

      const message = buildShareMessage(payload, encoded);

      expect(message).toContain('"My Recovery Journey"');
      expect(message).toContain('Steps to Recovery');
      expect(message).toContain('RCENTRY:abc123');
      expect(message).toContain('Paste the code below');
    });

    it('should build message with "a journal entry" when title is null', () => {
      const payload: SharedEntryPayload = {
        version: 1,
        sharedAt: '2026-01-15T10:00:00Z',
        entry: {
          id: 'entry-123',
          title: null,
          body: 'Today was good',
          mood: null,
          craving: null,
          tags: [],
          createdAt: '2026-01-15T10:00:00Z',
        },
      };
      const encoded = 'RCENTRY:xyz789';

      const message = buildShareMessage(payload, encoded);

      expect(message).toContain('a journal entry');
      expect(message).not.toContain('"');
      expect(message).toContain(encoded);
    });

    it('should include encoded payload as last line', () => {
      const payload: SharedEntryPayload = {
        version: 1,
        sharedAt: '2026-01-15T10:00:00Z',
        entry: {
          id: 'e1',
          title: 'Test',
          body: 'body',
          mood: null,
          craving: null,
          tags: [],
          createdAt: '2026-01-15T10:00:00Z',
        },
      };
      const encoded = 'RCENTRY:encoded-data';

      const message = buildShareMessage(payload, encoded);
      const lines = message.split('\n');

      expect(lines[lines.length - 1]).toBe(encoded);
    });
  });
});
