/**
 * Conversation Export Service
 * Exports AI conversations as shareable text or summary.
 *
 * SECURITY NOTE: Strips sensitive metadata (model, tokens, latency)
 * before export. Only conversation content is shared.
 */

import { Share } from 'react-native';
import { logger } from '../../../utils/logger';
import { summarizeConversation } from './conversationSummarizer';
import type { ChatMessage } from './aiService';
import type { Conversation, Message } from '../types';

export type ExportFormat = 'text' | 'summary';

export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  error?: string;
}

/**
 * Format a date for display in exported text.
 */
function formatExportDate(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a role label for readable export.
 */
function formatRole(role: string): string {
  switch (role) {
    case 'user':
      return 'You';
    case 'assistant':
      return 'Recovery Companion';
    default:
      return role;
  }
}

/**
 * Strip sensitive metadata from messages before export.
 * Removes model info, token counts, latency, and crisis flags.
 */
function stripSensitiveContent(messages: Message[]): Message[] {
  return messages.map((msg) => ({
    ...msg,
    metadata: undefined,
  }));
}

/**
 * Format messages as readable plain text with timestamps.
 */
function formatAsText(conversation: Conversation, messages: Message[]): string {
  const safeMessages = stripSensitiveContent(messages);
  const title = conversation.title || 'Conversation';
  const date = formatExportDate(conversation.createdAt);

  const header = `${title}\n${date}\n${'─'.repeat(40)}\n`;

  const body = safeMessages
    .filter((msg) => msg.role !== 'system')
    .map((msg) => {
      const timestamp = formatExportDate(msg.createdAt);
      const role = formatRole(msg.role);
      return `[${timestamp}] ${role}:\n${msg.content}\n`;
    })
    .join('\n');

  const footer = `\n${'─'.repeat(40)}\nExported from Steps to Recovery`;

  return `${header}\n${body}${footer}`;
}

/**
 * Export a conversation in the specified format.
 * Uses React Native Share API to present the system share sheet.
 */
export async function exportConversation(
  conversation: Conversation,
  messages: Message[],
  format: ExportFormat,
): Promise<ExportResult> {
  try {
    if (messages.length === 0) {
      return {
        success: false,
        format,
        error: 'No messages to export',
      };
    }

    let shareText: string;

    if (format === 'summary') {
      const chatMessages: ChatMessage[] = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const summary = await summarizeConversation(chatMessages);
      const title = conversation.title || 'Conversation';
      const date = formatExportDate(conversation.createdAt);
      shareText = `${title} — Summary\n${date}\n${'─'.repeat(40)}\n\n${summary}\n\n${'─'.repeat(40)}\nExported from Steps to Recovery`;
    } else {
      shareText = formatAsText(conversation, messages);
    }

    await Share.share({
      message: shareText,
      title: conversation.title || 'Conversation Export',
    });

    logger.info('Conversation exported', {
      conversationId: conversation.id,
      format,
      messageCount: messages.length,
    });

    return { success: true, format };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed';
    logger.error('Conversation export failed', error);
    return { success: false, format, error: message };
  }
}
