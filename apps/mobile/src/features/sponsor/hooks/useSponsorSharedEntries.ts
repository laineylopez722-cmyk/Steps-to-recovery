import { useCallback } from 'react';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { decryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import { generateId } from '../../../utils/id';
import type { JournalEntryDecrypted } from '@recovery/shared/src/types/models';
import {
  createEntrySharePayload,
  createCommentSharePayload,
  decryptWithSharedKey,
  encryptWithSharedKey,
  parseCommentSharePayload,
  parseEntrySharePayload,
} from '@recovery/shared/services/sponsorConnection';

interface SponsorConnectionRow {
  id: string;
  invite_code: string;
  shared_key: string | null;
}

interface SharedEntryContent {
  title: string | null;
  body: string;
  mood: number | null;
  craving: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SharedEntryView {
  id: string;
  entryId: string;
  title: string | null;
  body: string;
  mood: number | null;
  craving: number | null;
  tags: string[];
  createdAt: string;
  sharedAt: string;
}

export interface SharedCommentView {
  id: string;
  entryId: string;
  comment: string;
  createdAt: string;
}

function splitPayloads(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function useSponsorSharedEntries(userId: string) {
  const { db, isReady } = useDatabase();

  const getConnectionById = useCallback(
    async (connectionId: string): Promise<SponsorConnectionRow | null> => {
      if (!db || !isReady) return null;
      return db.getFirstAsync<SponsorConnectionRow>(
        `SELECT id, invite_code, shared_key FROM sponsor_connections WHERE id = ? AND user_id = ?`,
        [connectionId, userId],
      );
    },
    [db, isReady, userId],
  );

  const getConnectionByCode = useCallback(
    async (code: string): Promise<SponsorConnectionRow | null> => {
      if (!db || !isReady) return null;
      return db.getFirstAsync<SponsorConnectionRow>(
        `SELECT id, invite_code, shared_key FROM sponsor_connections WHERE user_id = ? AND invite_code = ?`,
        [userId, code],
      );
    },
    [db, isReady, userId],
  );

  const getSharedKeyForConnection = useCallback(
    async (connectionId: string): Promise<string | null> => {
      const connection = await getConnectionById(connectionId);
      if (!connection?.shared_key) return null;
      return decryptContent(connection.shared_key);
    },
    [getConnectionById],
  );

  const shareEntries = useCallback(
    async (
      connectionId: string,
      entries: JournalEntryDecrypted[],
      senderName?: string,
    ): Promise<string[]> => {
      if (!db || !isReady || !userId) {
        throw new Error('Database not ready');
      }

      const connection = await getConnectionById(connectionId);
      if (!connection?.shared_key) {
        throw new Error('Sponsor connection not ready');
      }

      const sharedKey = await decryptContent(connection.shared_key);
      const now = new Date().toISOString();
      const payloads: string[] = [];

      for (const entry of entries) {
        const content: SharedEntryContent = {
          title: entry.title ?? null,
          body: entry.body,
          mood: entry.mood ?? null,
          craving: entry.craving ?? null,
          tags: entry.tags ?? [],
          createdAt: entry.created_at,
          updatedAt: entry.updated_at,
        };

        const encrypted = await encryptWithSharedKey(sharedKey, JSON.stringify(content));
        const payload = createEntrySharePayload({
          version: 1,
          code: connection.invite_code,
          entryId: entry.id,
          encrypted,
          senderName,
          createdAt: now,
        });

        await db.runAsync(
          `INSERT INTO sponsor_shared_entries (
            id, user_id, connection_id, direction, journal_entry_id, payload, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [generateId('share'), userId, connectionId, 'outgoing', entry.id, payload, now, now],
        );

        payloads.push(payload);
      }

      return payloads;
    },
    [db, isReady, userId, getConnectionById],
  );

  const shareComment = useCallback(
    async (
      connectionId: string,
      entryId: string,
      comment: string,
      senderName?: string,
    ): Promise<string> => {
      if (!db || !isReady || !userId) {
        throw new Error('Database not ready');
      }

      const connection = await getConnectionById(connectionId);
      if (!connection?.shared_key) {
        throw new Error('Sponsor connection not ready');
      }

      const sharedKey = await decryptContent(connection.shared_key);
      const now = new Date().toISOString();
      const encrypted = await encryptWithSharedKey(
        sharedKey,
        JSON.stringify({ comment, createdAt: now }),
      );
      const payload = createCommentSharePayload({
        version: 1,
        code: connection.invite_code,
        entryId,
        encrypted,
        senderName,
        createdAt: now,
      });

      await db.runAsync(
        `INSERT INTO sponsor_shared_entries (
          id, user_id, connection_id, direction, journal_entry_id, payload, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [generateId('comment'), userId, connectionId, 'comment', entryId, payload, now, now],
      );

      return payload;
    },
    [db, isReady, userId, getConnectionById],
  );

  const importPayloads = useCallback(
    async (
      payloadText: string,
    ): Promise<{ entries: number; comments: number; skipped: number }> => {
      if (!db || !isReady || !userId) {
        throw new Error('Database not ready');
      }

      let entries = 0;
      let comments = 0;
      let skipped = 0;
      const payloads = splitPayloads(payloadText);

      for (const payload of payloads) {
        const entryPayload = parseEntrySharePayload(payload);
        const commentPayload = entryPayload ? null : parseCommentSharePayload(payload);

        const targetPayload = entryPayload ?? commentPayload;
        if (!targetPayload) {
          skipped += 1;
          continue;
        }

        const connection = await getConnectionByCode(targetPayload.code);
        if (!connection?.shared_key) {
          skipped += 1;
          continue;
        }

        const sharedKey = await decryptContent(connection.shared_key);
        try {
          const decrypted = await decryptWithSharedKey(sharedKey, targetPayload.encrypted);
          JSON.parse(decrypted);
        } catch (error) {
          logger.warn('Failed to decrypt sponsor payload', { error });
          skipped += 1;
          continue;
        }

        const existing = await db.getFirstAsync<{ id: string }>(
          `SELECT id FROM sponsor_shared_entries WHERE user_id = ? AND connection_id = ? AND payload = ?`,
          [userId, connection.id, payload],
        );
        if (existing) {
          skipped += 1;
          continue;
        }

        const now = new Date().toISOString();
        const direction = entryPayload ? 'incoming' : 'comment';
        await db.runAsync(
          `INSERT INTO sponsor_shared_entries (
            id, user_id, connection_id, direction, journal_entry_id, payload, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            generateId(direction === 'incoming' ? 'incoming' : 'comment'),
            userId,
            connection.id,
            direction,
            targetPayload.entryId,
            payload,
            now,
            now,
          ],
        );

        if (entryPayload) {
          entries += 1;
        } else {
          comments += 1;
        }
      }

      return { entries, comments, skipped };
    },
    [db, isReady, userId, getConnectionByCode],
  );

  const loadIncomingEntries = useCallback(
    async (connectionId: string): Promise<SharedEntryView[]> => {
      if (!db || !isReady || !userId) return [];

      const sharedKey = await getSharedKeyForConnection(connectionId);
      if (!sharedKey) return [];

      const rows = await db.getAllAsync<{
        id: string;
        journal_entry_id: string;
        payload: string;
        created_at: string;
      }>(
        `SELECT id, journal_entry_id, payload, created_at
         FROM sponsor_shared_entries
         WHERE user_id = ? AND connection_id = ? AND direction = 'incoming'
         ORDER BY created_at DESC`,
        [userId, connectionId],
      );

      const entries: SharedEntryView[] = [];
      for (const row of rows) {
        const payload = parseEntrySharePayload(row.payload);
        if (!payload) continue;

        try {
          const decrypted = await decryptWithSharedKey(sharedKey, payload.encrypted);
          const content = JSON.parse(decrypted) as SharedEntryContent;
          entries.push({
            id: row.id,
            entryId: payload.entryId,
            title: content.title ?? null,
            body: content.body,
            mood: content.mood ?? null,
            craving: content.craving ?? null,
            tags: content.tags ?? [],
            createdAt: content.createdAt ?? row.created_at,
            sharedAt: row.created_at,
          });
        } catch (error) {
          logger.warn('Failed to decrypt shared entry payload', { error });
        }
      }

      return entries;
    },
    [db, isReady, userId, getSharedKeyForConnection],
  );

  const loadCommentsForEntry = useCallback(
    async (entryId: string): Promise<SharedCommentView[]> => {
      if (!db || !isReady || !userId) return [];

      const rows = await db.getAllAsync<{
        id: string;
        connection_id: string;
        payload: string;
        created_at: string;
      }>(
        `SELECT id, connection_id, payload, created_at
         FROM sponsor_shared_entries
         WHERE user_id = ? AND journal_entry_id = ? AND direction = 'comment'
         ORDER BY created_at DESC`,
        [userId, entryId],
      );

      const comments: SharedCommentView[] = [];
      for (const row of rows) {
        const payload = parseCommentSharePayload(row.payload);
        if (!payload) continue;

        const sharedKey = await getSharedKeyForConnection(row.connection_id);
        if (!sharedKey) continue;

        try {
          const decrypted = await decryptWithSharedKey(sharedKey, payload.encrypted);
          const content = JSON.parse(decrypted) as { comment: string; createdAt?: string };
          comments.push({
            id: row.id,
            entryId: payload.entryId,
            comment: content.comment,
            createdAt: content.createdAt ?? row.created_at,
          });
        } catch (error) {
          logger.warn('Failed to decrypt sponsor comment payload', { error });
        }
      }

      return comments;
    },
    [db, isReady, userId, getSharedKeyForConnection],
  );

  return {
    shareEntries,
    shareComment,
    importPayloads,
    loadIncomingEntries,
    loadCommentsForEntry,
  };
}
