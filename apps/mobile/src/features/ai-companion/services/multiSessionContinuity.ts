/**
 * Multi-Session Continuity Service
 * Enables "remember what we talked about" across conversations.
 */

import { logger } from '../../../utils/logger';
import { secureStorage } from '../../../adapters/secureStorage';

const RECENT_SUMMARIES_KEY = 'ai_recent_conversation_summaries';
const MAX_STORED_SUMMARIES = 10;

export interface ConversationSummaryRecord {
  conversationId: string;
  summary: string;
  topicTags: string[];
  createdAt: string;
  messageCount: number;
}

/**
 * Store a conversation summary for future reference.
 */
export async function storeConversationSummary(record: ConversationSummaryRecord): Promise<void> {
  try {
    const existing = await loadStoredSummaries();
    existing.unshift(record);

    // Keep only recent summaries
    const trimmed = existing.slice(0, MAX_STORED_SUMMARIES);
    await secureStorage.setItemAsync(RECENT_SUMMARIES_KEY, JSON.stringify(trimmed));

    logger.debug('Stored conversation summary', {
      conversationId: record.conversationId,
      topics: record.topicTags.join(', '),
    });
  } catch (error) {
    logger.error('Failed to store conversation summary', error);
  }
}

/**
 * Load stored conversation summaries.
 */
export async function loadStoredSummaries(): Promise<ConversationSummaryRecord[]> {
  try {
    const raw = await secureStorage.getItemAsync(RECENT_SUMMARIES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ConversationSummaryRecord[];
  } catch {
    return [];
  }
}

/**
 * Build continuity context for injection into system prompt.
 */
export async function buildContinuityContext(currentConversationId: string): Promise<string> {
  const summaries = await loadStoredSummaries();

  // Filter out the current conversation
  const previous = summaries.filter((s) => s.conversationId !== currentConversationId);

  if (previous.length === 0) return '';

  const lines = previous.slice(0, 5).map((s) => {
    const date = new Date(s.createdAt).toLocaleDateString();
    return `- ${date}: ${s.summary} [Topics: ${s.topicTags.join(', ')}]`;
  });

  return `\n\nPREVIOUS CONVERSATIONS:\nHere is a summary of recent conversations with this user. Reference them naturally when relevant.\n${lines.join('\n')}`;
}

/**
 * Find summaries relevant to a topic query.
 */
export async function findRelevantSummaries(
  query: string,
  limit: number = 3,
): Promise<ConversationSummaryRecord[]> {
  const summaries = await loadStoredSummaries();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 3);

  // Simple keyword matching (semantic search is a separate enhancement)
  const scored = summaries.map((s) => {
    const text = `${s.summary} ${s.topicTags.join(' ')}`.toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      if (text.includes(word)) score++;
    }
    return { summary: s, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.summary);
}
