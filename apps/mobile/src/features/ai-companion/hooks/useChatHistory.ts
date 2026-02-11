/**
 * Chat History Hook
 * Manages persistent, encrypted chat conversations.
 *
 * SECURITY NOTE: Chat conversations and messages are ONLY stored locally
 * in SQLite (mobile) or IndexedDB (web). They are NEVER synced to Supabase.
 * This ensures maximum privacy for AI companion interactions.
 * All message content is encrypted before storage using AES-256-CBC.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { encryptContent, decryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import type { Conversation, Message, ConversationType, ConversationStatus } from '../types';

interface ConversationRow {
  id: string;
  user_id: string;
  title: string;
  type: string;
  step_number: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: string;
  encrypted_content: string;
  created_at: string;
  metadata: string | null;
}

export interface UseChatHistoryReturn {
  conversations: Conversation[];
  isLoading: boolean;

  // Conversation management
  createConversation: (type: ConversationType, stepNumber?: number) => Promise<Conversation>;
  getConversation: (id: string) => Promise<Conversation | null>;
  archiveConversation: (id: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;

  // Message management
  addMessage: (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, unknown>,
  ) => Promise<Message>;
  getMessages: (conversationId: string, limit?: number) => Promise<Message[]>;

  // Utilities
  refreshConversations: () => Promise<void>;
}

/**
 * Generate UUID in a platform-agnostic way
 */
async function generateId(): Promise<string> {
  if (Platform.OS === 'web') {
    return crypto.randomUUID();
  } else {
    const Crypto = await import('expo-crypto');
    return Crypto.randomUUID();
  }
}

/**
 * Convert database row to Conversation object
 */
function rowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    type: row.type as ConversationType,
    stepNumber: row.step_number,
    status: row.status as ConversationStatus,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert database row to Message object (content needs decryption separately)
 */
function rowToMessage(row: MessageRow, decryptedContent: string): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as 'user' | 'assistant' | 'system',
    content: decryptedContent,
    createdAt: new Date(row.created_at),
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  };
}

/**
 * Hook for managing encrypted chat history
 */
export function useChatHistory(userId: string): UseChatHistoryReturn {
  const { db, isReady } = useDatabase();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const initRef = useRef(false);

  // Initialize tables
  useEffect(() => {
    if (!db || !isReady || initRef.current) return;
    initRef.current = true;

    const initTables = async () => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS chat_conversations (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT,
            type TEXT NOT NULL DEFAULT 'general',
            step_number INTEGER,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);
          CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);

          CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            encrypted_content TEXT NOT NULL,
            metadata TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
          );
          CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
        `);
      } catch (err) {
        logger.error('Failed to initialize chat tables', err);
      }
    };

    initTables();
  }, [db, isReady]);

  /**
   * Load all active conversations for the user
   */
  const refreshConversations = useCallback(async () => {
    if (!db || !isReady) return;

    setIsLoading(true);
    try {
      const rows = await db.getAllAsync<ConversationRow>(
        `SELECT * FROM chat_conversations 
         WHERE user_id = ? AND status = 'active' 
         ORDER BY updated_at DESC`,
        [userId],
      );
      setConversations(rows.map(rowToConversation));
    } catch (err) {
      logger.error('Failed to load conversations', err);
    } finally {
      setIsLoading(false);
    }
  }, [db, isReady, userId]);

  // Load conversations on mount
  useEffect(() => {
    if (isReady) {
      refreshConversations();
    }
  }, [isReady, refreshConversations]);

  /**
   * Create a new conversation
   */
  const createConversation = useCallback(
    async (type: ConversationType, stepNumber?: number): Promise<Conversation> => {
      if (!db || !isReady) {
        throw new Error('Database not ready');
      }

      const id = await generateId();
      const now = new Date().toISOString();

      // Generate title based on type
      let title: string | null = null;
      switch (type) {
        case 'step_work':
          title = stepNumber ? `Step ${stepNumber} Work` : 'Step Work';
          break;
        case 'crisis':
          title = 'Crisis Support';
          break;
        case 'check_in':
          title = 'Daily Check-in';
          break;
        default:
          title = null; // Will be set later based on conversation
      }

      const conversation: Conversation = {
        id,
        userId,
        title,
        type,
        stepNumber: stepNumber ?? null,
        status: 'active',
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };

      try {
        await db.runAsync(
          `INSERT INTO chat_conversations 
           (id, user_id, title, type, step_number, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, userId, title, type, stepNumber ?? null, 'active', now, now],
        );

        // Update local state
        setConversations((prev) => [conversation, ...prev]);

        return conversation;
      } catch (err) {
        logger.error('Failed to create conversation', err);
        throw err;
      }
    },
    [db, isReady, userId],
  );

  /**
   * Get a single conversation by ID
   */
  const getConversation = useCallback(
    async (id: string): Promise<Conversation | null> => {
      if (!db || !isReady) return null;

      try {
        const row = await db.getFirstAsync<ConversationRow>(
          'SELECT * FROM chat_conversations WHERE id = ? AND user_id = ?',
          [id, userId],
        );

        if (!row) return null;
        return rowToConversation(row);
      } catch (err) {
        logger.error('Failed to get conversation', err);
        return null;
      }
    },
    [db, isReady, userId],
  );

  /**
   * Archive a conversation (soft delete)
   */
  const archiveConversation = useCallback(
    async (id: string): Promise<void> => {
      if (!db || !isReady) return;

      try {
        await db.runAsync(
          `UPDATE chat_conversations SET status = 'archived', updated_at = ? WHERE id = ?`,
          [new Date().toISOString(), id],
        );

        // Update local state
        setConversations((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        logger.error('Failed to archive conversation', err);
        throw err;
      }
    },
    [db, isReady],
  );

  /**
   * Add a message to a conversation (encrypted)
   */
  const addMessage = useCallback(
    async (
      conversationId: string,
      role: 'user' | 'assistant',
      content: string,
      metadata?: Record<string, unknown>,
    ): Promise<Message> => {
      if (!db || !isReady) {
        throw new Error('Database not ready');
      }

      const id = await generateId();
      const now = new Date().toISOString();

      // Encrypt the content before storing (skip empty strings)
      let encryptedContent: string;
      if (content.length === 0) {
        encryptedContent = content;
      } else {
        try {
          encryptedContent = await encryptContent(content);
        } catch (encryptErr) {
          logger.error('Failed to encrypt message, storing plaintext as fallback', encryptErr);
          encryptedContent = content;
        }
      }

      const message: Message = {
        id,
        conversationId,
        role,
        content, // Return unencrypted content to caller
        createdAt: new Date(now),
        metadata: metadata as Message['metadata'],
      };

      try {
        await db.runAsync(
          `INSERT INTO chat_messages (id, conversation_id, role, encrypted_content, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id,
            conversationId,
            role,
            encryptedContent,
            metadata ? JSON.stringify(metadata) : null,
            now,
          ],
        );

        // Update conversation's updated_at timestamp
        await db.runAsync(`UPDATE chat_conversations SET updated_at = ? WHERE id = ?`, [
          now,
          conversationId,
        ]);

        // Update title if this is the first user message
        if (role === 'user') {
          const msgCount = await db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM chat_messages WHERE conversation_id = ?',
            [conversationId],
          );

          if (msgCount?.count === 1) {
            // First message - use truncated content as title
            const title = content.length > 50 ? content.substring(0, 47) + '...' : content;
            await db.runAsync(
              `UPDATE chat_conversations SET title = ? WHERE id = ? AND title IS NULL`,
              [title, conversationId],
            );
          }
        }

        return message;
      } catch (err) {
        logger.error('Failed to add message', err);
        throw err;
      }
    },
    [db, isReady],
  );

  /**
   * Get messages for a conversation (decrypted)
   */
  const getMessages = useCallback(
    async (conversationId: string, limit?: number): Promise<Message[]> => {
      if (!db || !isReady) return [];

      try {
        const query = limit
          ? `SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?`
          : `SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC`;

        const params = limit ? [conversationId, limit] : [conversationId];
        const rows = await db.getAllAsync<MessageRow>(query, params);

        // If we limited and got DESC order, reverse to get chronological
        if (limit) {
          rows.reverse();
        }

        // Decrypt each message (fallback to raw content for unencrypted migration data)
        const messages: Message[] = [];
        for (const row of rows) {
          let decryptedContent: string;
          if (row.encrypted_content.length === 0) {
            decryptedContent = row.encrypted_content;
          } else {
            try {
              decryptedContent = await decryptContent(row.encrypted_content);
            } catch {
              // Likely an unencrypted legacy message — return as-is
              logger.warn(
                'Message decryption failed, returning raw content (possible legacy data)',
              );
              decryptedContent = row.encrypted_content;
            }
          }
          messages.push(rowToMessage(row, decryptedContent));
        }

        return messages;
      } catch (err) {
        logger.error('Failed to get messages', err);
        return [];
      }
    },
    [db, isReady],
  );

  /**
   * Update conversation title
   */
  const updateConversationTitle = useCallback(
    async (conversationId: string, title: string): Promise<void> => {
      if (!db || !isReady) return;

      try {
        await db.runAsync(`UPDATE chat_conversations SET title = ?, updated_at = ? WHERE id = ?`, [
          title,
          new Date().toISOString(),
          conversationId,
        ]);

        // Update local state
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, title } : c)),
        );
      } catch (err) {
        logger.error('Failed to update conversation title', err);
        throw err;
      }
    },
    [db, isReady],
  );

  return {
    conversations,
    isLoading,
    createConversation,
    getConversation,
    archiveConversation,
    updateConversationTitle,
    addMessage,
    getMessages,
    refreshConversations,
  };
}
