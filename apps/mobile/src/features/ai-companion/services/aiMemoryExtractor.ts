/**
 * AI-Powered Memory Extraction
 * Uses the AI model to extract structured memories from conversations.
 * Falls back to the existing regex-based extractor.
 */

import { logger } from '../../../utils/logger';
import { getAIService, type ChatMessage } from './aiService';
import { extractMemoriesFromMessage } from './memoryExtractor';

export interface ExtractedMemory {
  type: 'person' | 'trigger' | 'coping' | 'victory' | 'emotion' | 'relationship' | 'fear' | 'goal';
  content: string;
  confidence: number;
  context?: string;
}

const EXTRACTION_PROMPT = `Analyze this conversation exchange and extract structured facts about the user.

Return a JSON array of objects with:
- type: one of "person", "trigger", "coping", "victory", "emotion", "relationship", "fear", "goal"
- content: the specific fact (brief, 1-2 sentences)
- confidence: 0.0-1.0 how certain you are

Only extract facts the user explicitly stated or strongly implied. Be conservative.
If no facts can be extracted, return an empty array [].

Respond ONLY with valid JSON, no other text.`;

/**
 * Extract memories using AI, with regex fallback.
 */
export async function extractMemoriesWithAIService(
  userMessage: string,
  assistantResponse: string,
): Promise<ExtractedMemory[]> {
  try {
    const service = await getAIService();
    const configured = await service.isConfigured();
    if (!configured) {
      return fallbackExtract(userMessage);
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: EXTRACTION_PROMPT },
      {
        role: 'user',
        content: `User said: "${userMessage}"\nAssistant replied: "${assistantResponse}"`,
      },
    ];

    const response = await service.chatComplete(messages, {
      maxTokens: 500,
      temperature: 0.3,
    });

    const parsed = JSON.parse(response);
    if (!Array.isArray(parsed)) return fallbackExtract(userMessage);

    const memories: ExtractedMemory[] = parsed
      .filter(
        (m: Record<string, unknown>) =>
          typeof m.type === 'string' &&
          typeof m.content === 'string' &&
          typeof m.confidence === 'number' &&
          m.confidence >= 0.3,
      )
      .map((m: Record<string, unknown>) => ({
        type: m.type as ExtractedMemory['type'],
        content: String(m.content),
        confidence: Number(m.confidence),
      }));

    logger.debug('AI memory extraction', { count: memories.length });
    return memories;
  } catch (error) {
    logger.warn('AI memory extraction failed, using fallback', error);
    return fallbackExtract(userMessage);
  }
}

function fallbackExtract(message: string): ExtractedMemory[] {
  const regexMemories = extractMemoriesFromMessage('anonymous', message, 'fallback');
  return regexMemories.map((m) => ({
    type: m.type as ExtractedMemory['type'],
    content: m.content,
    confidence: 0.5,
  }));
}
