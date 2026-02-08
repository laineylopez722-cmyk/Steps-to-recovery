import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { encryptContent, decryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import { generateId } from '../../../utils/id';
import {
  createConfirmPayload,
  createInvitePayload,
  deriveSharedKeyBase64,
  generateSponsorCode,
  generateSponsorKeyPair,
  parseConfirmPayload,
  parseInvitePayload,
  type SponsorConfirmPayload,
} from '@recovery/shared';

export type SponsorRole = 'sponsee' | 'sponsor';
export type SponsorStatus = 'pending' | 'connected';

export interface SponsorConnection {
  id: string;
  user_id: string;
  role: SponsorRole;
  status: SponsorStatus;
  invite_code: string;
  display_name: string | null;
  own_public_key: string;
  peer_public_key: string | null;
  shared_key: string | null; // encrypted
  pending_private_key: string | null; // encrypted
  created_at: string;
  updated_at: string;
}

export function useSponsorConnections(userId: string) {
  const { db, isReady } = useDatabase();
  const [connections, setConnections] = useState<SponsorConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    if (!db || !isReady || !userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const rows = await db.getAllAsync<SponsorConnection>(
        `SELECT * FROM sponsor_connections WHERE user_id = ? ORDER BY created_at DESC`,
        [userId],
      );
      setConnections(rows);
    } catch (loadError) {
      logger.warn('Failed to load sponsor connections', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  }, [db, isReady, userId]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const createInvite = useCallback(
    async (sponseeName?: string): Promise<{ payload: string; code: string }> => {
      if (!db || !userId) {
        throw new Error('Database not ready');
      }

      const code = await generateSponsorCode();
      const keyPair = await generateSponsorKeyPair();
      const now = new Date().toISOString();
      const encryptedPrivateKey = await encryptContent(keyPair.privateKey);

      const id = generateId('sponsor');
      await db.runAsync(
        `INSERT INTO sponsor_connections (
          id, user_id, role, status, invite_code, display_name,
          own_public_key, peer_public_key, shared_key, pending_private_key,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          'sponsee',
          'pending',
          code.code,
          sponseeName ?? null,
          keyPair.publicKey,
          null,
          null,
          encryptedPrivateKey,
          now,
          now,
        ],
      );

      const payload = createInvitePayload({
        version: 1,
        code: code.code,
        sponseeName,
        publicKey: keyPair.publicKey,
        createdAt: code.createdAt.toISOString(),
        expiresAt: code.expiresAt.toISOString(),
      });

      await loadConnections();
      return { payload, code: code.code };
    },
    [db, userId, loadConnections],
  );

  const confirmInvite = useCallback(
    async (payloadString: string): Promise<void> => {
      if (!db || !userId) {
        throw new Error('Database not ready');
      }

      const payload = parseConfirmPayload(payloadString);
      if (!payload) {
        throw new Error('Invalid confirmation payload');
      }

      const connection = await db.getFirstAsync<SponsorConnection>(
        `SELECT * FROM sponsor_connections WHERE user_id = ? AND role = 'sponsee' AND invite_code = ? AND status = 'pending'`,
        [userId, payload.code],
      );

      if (!connection || !connection.pending_private_key) {
        throw new Error('No pending invite found for this code');
      }

      const privateKey = await decryptContent(connection.pending_private_key);
      const sharedKey = await deriveSharedKeyBase64(privateKey, payload.publicKey);
      const encryptedSharedKey = await encryptContent(sharedKey);

      const now = new Date().toISOString();
      await db.runAsync(
        `UPDATE sponsor_connections
         SET status = ?, peer_public_key = ?, shared_key = ?, pending_private_key = ?, display_name = ?, updated_at = ?
         WHERE id = ?`,
        [
          'connected',
          payload.publicKey,
          encryptedSharedKey,
          null,
          payload.sponsorName ?? connection.display_name ?? null,
          now,
          connection.id,
        ],
      );

      await loadConnections();
    },
    [db, userId, loadConnections],
  );

  const connectAsSponsor = useCallback(
    async (inviteString: string, sponsorName?: string): Promise<string> => {
      if (!db || !userId) {
        throw new Error('Database not ready');
      }

      const invite = parseInvitePayload(inviteString);
      if (!invite) {
        throw new Error('Invalid invite payload');
      }

      const keyPair = await generateSponsorKeyPair();
      const sharedKey = await deriveSharedKeyBase64(keyPair.privateKey, invite.publicKey);
      const encryptedSharedKey = await encryptContent(sharedKey);
      const now = new Date().toISOString();

      const id = generateId('sponsor');
      await db.runAsync(
        `INSERT INTO sponsor_connections (
          id, user_id, role, status, invite_code, display_name,
          own_public_key, peer_public_key, shared_key, pending_private_key,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          'sponsor',
          'connected',
          invite.code,
          invite.sponseeName ?? null,
          keyPair.publicKey,
          invite.publicKey,
          encryptedSharedKey,
          null,
          now,
          now,
        ],
      );

      const confirmPayload: SponsorConfirmPayload = {
        version: 1,
        code: invite.code,
        sponsorName,
        publicKey: keyPair.publicKey,
        confirmedAt: new Date().toISOString(),
      };

      await loadConnections();
      return createConfirmPayload(confirmPayload);
    },
    [db, userId, loadConnections],
  );

  const removeConnection = useCallback(
    async (connectionId: string): Promise<void> => {
      if (!db || !userId) return;
      await db.runAsync(`DELETE FROM sponsor_connections WHERE id = ? AND user_id = ?`, [
        connectionId,
        userId,
      ]);
      await db.runAsync(
        `DELETE FROM sponsor_shared_entries WHERE connection_id = ? AND user_id = ?`,
        [connectionId, userId],
      );
      await loadConnections();
    },
    [db, userId, loadConnections],
  );

  const getSharedKey = useCallback(
    async (connectionId: string): Promise<string | null> => {
      if (!db) return null;
      const connection = await db.getFirstAsync<SponsorConnection>(
        `SELECT shared_key FROM sponsor_connections WHERE id = ?`,
        [connectionId],
      );
      if (!connection?.shared_key) return null;
      return decryptContent(connection.shared_key);
    },
    [db],
  );

  const mySponsor = useMemo(
    () => connections.find((c) => c.role === 'sponsee' && c.status === 'connected'),
    [connections],
  );

  const mySponsees = useMemo(
    () => connections.filter((c) => c.role === 'sponsor' && c.status === 'connected'),
    [connections],
  );

  const pendingInvites = useMemo(
    () => connections.filter((c) => c.role === 'sponsee' && c.status === 'pending'),
    [connections],
  );

  return {
    connections,
    isLoading,
    error,
    mySponsor,
    mySponsees,
    pendingInvites,
    loadConnections,
    createInvite,
    confirmInvite,
    connectAsSponsor,
    removeConnection,
    getSharedKey,
  };
}

