/**
 * Conversation Summarizer
 * Auto-summarizes long conversations to reduce token usage.
 */

import { logger } from '../../../utils/logger';
import { getAIService, type ChatMessage } from './aiService';

const SUMMARY_THRESHOLD = 20;
const RE_SUMMARY_INTERVAL = 10;

/**
 * Check if a conversation should be summarized.
 */
export function shouldSummarize(
  messageCount: number,
  existingSummary?: string | null,
  summaryMessageCount?: number,
): boolean {
  if (!existingSummary && messageCount >= SUMMARY_THRESHOLD) return true;
  if (existingSummary && summaryMessageCount) {
    return messageCount - summaryMessageCount >= RE_SUMMARY_INTERVAL;
  }
  return false;
}

/**
 * Generate a conversation summary.
 */
export async function summarizeConversation(
  messages: ChatMessage[],
  existingSummary?: string | null,
): Promise<string> {
  try {
    const service = await getAIService();
    const configured = await service.isConfigured();
    if (!configured) {
      return buildFallbackSummary(messages);
    }

    const contextParts: string[] = [];
    if (existingSummary) {
      contextParts.push(`Previous summary: ${existingSummary}`);
      contextParts.push('New messages since then:');
    }

    const recentMessages = messages
      .slice(-30)
      .map((m) => `${m.role}: ${m.content.substring(0, 200)}`);
    contextParts.push(recentMessages.join('\n'));

    const prompt: ChatMessage[] = [
      {
        role: 'system',
        content: `Summarize this recovery support conversation in 2-3 sentences. 
Focus on: key topics discussed, emotional state, any action items or commitments made, 
and important personal details shared. Be concise but capture what matters.
Do NOT include greetings or filler.`,
      },
      { role: 'user', content: contextParts.join('\n') },
    ];

    const summary = await service.chatComplete(prompt, {
      maxTokens: 200,
      temperature: 0.3,
    });

    logger.debug('Conversation summarized', { messageCount: messages.length });
    return summary.trim();
  } catch (error) {
    logger.warn('Conversation summarization failed', error);
    return buildFallbackSummary(messages);
  }
}

function buildFallbackSummary(messages: ChatMessage[]): string {
  const userMessages = messages
    .filter((m) => m.role === 'user')
    .slice(-5)
    .map((m) => m.content.substring(0, 50));

  return `Discussion covering: ${userMessages.join('; ')}`;
}
