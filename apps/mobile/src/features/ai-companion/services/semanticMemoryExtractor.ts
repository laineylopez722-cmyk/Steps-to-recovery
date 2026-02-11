/**
 * Semantic Memory Extractor
 *
 * Uses the AI provider to extract rich, structured memories from conversations.
 * Falls back to the rule-based extractor when AI is unavailable.
 *
 * Extracted memories are deduplicated against existing memories before returning.
 *
 * @module ai-companion/services/semanticMemoryExtractor
 */

import { logger } from '../../../utils/logger';
import { getAIService } from './aiService';
import type { ChatMessage } from './aiService';
import { extractMemoriesFromMessage } from './memoryExtractor';
import type { Memory, MemoryType } from '../../../features/journal/utils/memoryExtraction';

/**
 * Semantic extraction result with enriched metadata
 */
export interface ExtractedSemanticMemory {
  type:
    | 'emotion'
    | 'trigger'
    | 'coping_strategy'
    | 'milestone'
    | 'person'
    | 'goal'
    | 'insight'
    | 'victory'
    | 'struggle'
    | 'pattern';
  content: string;
  confidence: number;
  context: string;
  timestamp: string;
}

/** Prompt for semantic extraction */
const SEMANTIC_EXTRACTION_PROMPT = `You are a recovery-focused memory extraction system. Analyze the conversation and extract structured facts about the user.

Return a JSON array of objects. Each object must have:
- type: one of "emotion", "trigger", "coping_strategy", "milestone", "person", "goal", "insight", "victory", "struggle", "pattern"
- content: the specific fact (1-2 concise sentences)
- confidence: 0.0-1.0 (how certain you are this is a real fact, not hypothetical)
- context: a brief quote or paraphrase from the conversation that supports this fact

Guidelines:
- "emotion": Recurring emotional patterns ("User tends to feel anxious on Mondays")
- "trigger": Things that trigger cravings or negative states ("Work stress is a primary trigger")
- "coping_strategy": Strategies that help them cope ("Breathing exercises help when craving")
- "milestone": Recovery milestones mentioned ("Celebrated 30 days clean")
- "person": Key people in their life ("Sponsor named Mike", "Wife Sarah is supportive")
- "goal": Goals they've expressed ("Wants to complete Step 4 by next month")
- "insight": Self-realizations or breakthroughs ("Realized resentment was driving behavior")
- "victory": Achievements and wins ("Handled a trigger without using")
- "struggle": Current challenges ("Difficulty sleeping is a major challenge")
- "pattern": Behavioral patterns you notice ("Tends to isolate when stressed")

Rules:
- Only extract facts the user explicitly stated or strongly implied
- Be conservative — high confidence only for clear statements
- Skip vague or uncertain information
- If nothing meaningful can be extracted, return an empty array []

Respond ONLY with valid JSON, no markdown, no explanation.`;

/**
 * Message format for extraction
 */
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Use AI to extract rich memories from a conversation
 *
 * @param messages - Recent conversation messages to analyze
 * @param existingMemories - Already-known memories for deduplication
 * @param userId - User ID for memory attribution
 * @param sourceId - Conversation ID for tracking source
 * @returns Array of new ExtractedSemanticMemory items
 */
export async function extractSemanticMemories(
  messages: ConversationMessage[],
  existingMemories: Memory[],
  userId: string,
  sourceId: string,
): Promise<ExtractedSemanticMemory[]> {
  try {
    const service = await getAIService();
    const configured = await service.isConfigured();
    if (!configured) {
      return fallbackToRuleBased(messages, userId, sourceId);
    }

    // Build conversation text for analysis
    const conversationText = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const aiMessages: ChatMessage[] = [
      { role: 'system', content: SEMANTIC_EXTRACTION_PROMPT },
      { role: 'user', content: conversationText },
    ];

    const response = await service.chatComplete(aiMessages, {
      maxTokens: 800,
      temperature: 0.2,
    });

    // Parse AI response
    const cleaned = response.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    const parsed: unknown = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      logger.warn('Semantic extraction returned non-array');
      return fallbackToRuleBased(messages, userId, sourceId);
    }

    const memories: ExtractedSemanticMemory[] = parsed
      .filter(
        (m: Record<string, unknown>) =>
          typeof m.type === 'string' &&
          typeof m.content === 'string' &&
          typeof m.confidence === 'number' &&
          m.confidence >= 0.3,
      )
      .map((m: Record<string, unknown>) => ({
        type: m.type as ExtractedSemanticMemory['type'],
        content: String(m.content).slice(0, 500),
        confidence: Math.min(1, Math.max(0, Number(m.confidence))),
        context: typeof m.context === 'string' ? String(m.context).slice(0, 200) : '',
        timestamp: new Date().toISOString(),
      }));

    // Deduplicate against existing memories
    const deduped = deduplicateAgainstExisting(memories, existingMemories);

    logger.debug('Semantic memory extraction complete', {
      extracted: memories.length,
      afterDedup: deduped.length,
    });

    return deduped;
  } catch (error) {
    logger.warn('Semantic memory extraction failed, using fallback', error);
    return fallbackToRuleBased(messages, userId, sourceId);
  }
}

/**
 * Summarize a set of memories into a concise context string for AI prompts
 *
 * @param memories - Memories to summarize
 * @returns A concise summary string
 */
export async function summarizeMemories(memories: ExtractedSemanticMemory[]): Promise<string> {
  if (memories.length === 0) return '';

  try {
    const service = await getAIService();
    const configured = await service.isConfigured();

    if (!configured) {
      return buildBasicSummary(memories);
    }

    const memoryList = memories
      .map((m) => `- [${m.type}] ${m.content} (confidence: ${m.confidence})`)
      .join('\n');

    const aiMessages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'Summarize these extracted memories about a person in recovery into a brief, empathetic paragraph (3-5 sentences). Focus on what matters most for providing supportive conversation. Do not repeat every detail — capture the essence.',
      },
      { role: 'user', content: memoryList },
    ];

    return await service.chatComplete(aiMessages, {
      maxTokens: 300,
      temperature: 0.3,
    });
  } catch {
    return buildBasicSummary(memories);
  }
}

/**
 * Fall back to rule-based extraction when AI is unavailable
 */
function fallbackToRuleBased(
  messages: ConversationMessage[],
  userId: string,
  sourceId: string,
): ExtractedSemanticMemory[] {
  const userMessages = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ');

  const ruleMemories = extractMemoriesFromMessage(userId, userMessages, sourceId);

  return ruleMemories.map((m) => ({
    type: mapMemoryType(m.type),
    content: m.content,
    confidence: m.confidence,
    context: m.context || '',
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Map MemoryType to ExtractedSemanticMemory type
 */
function mapMemoryType(type: MemoryType): ExtractedSemanticMemory['type'] {
  const mapping: Record<MemoryType, ExtractedSemanticMemory['type']> = {
    person: 'person',
    trigger: 'trigger',
    coping_strategy: 'coping_strategy',
    emotion: 'emotion',
    victory: 'victory',
    struggle: 'struggle',
    goal: 'goal',
    insight: 'insight',
    preference: 'pattern',
    milestone: 'milestone',
    pattern: 'pattern',
  };
  return mapping[type] || 'insight';
}

/**
 * Remove memories that are too similar to existing ones
 */
function deduplicateAgainstExisting(
  newMemories: ExtractedSemanticMemory[],
  existingMemories: Memory[],
): ExtractedSemanticMemory[] {
  const existingContents = new Set(
    existingMemories.map((m) => m.content.toLowerCase().trim().slice(0, 80)),
  );

  return newMemories.filter((newMem) => {
    const normalised = newMem.content.toLowerCase().trim().slice(0, 80);
    // Skip if an existing memory has very similar content
    for (const existing of existingContents) {
      if (existing === normalised) return false;
      // Simple substring overlap check
      if (existing.length > 15 && normalised.includes(existing)) return false;
      if (normalised.length > 15 && existing.includes(normalised)) return false;
    }
    return true;
  });
}

/**
 * Build a basic summary without AI
 */
function buildBasicSummary(memories: ExtractedSemanticMemory[]): string {
  const grouped: Record<string, string[]> = {};
  for (const m of memories) {
    if (!grouped[m.type]) grouped[m.type] = [];
    grouped[m.type].push(m.content);
  }

  const parts: string[] = [];
  if (grouped['trigger']?.length) {
    parts.push(`Known triggers: ${grouped['trigger'].join(', ')}`);
  }
  if (grouped['coping_strategy']?.length) {
    parts.push(`Coping strategies: ${grouped['coping_strategy'].join(', ')}`);
  }
  if (grouped['person']?.length) {
    parts.push(`Key people: ${grouped['person'].join(', ')}`);
  }
  if (grouped['goal']?.length) {
    parts.push(`Goals: ${grouped['goal'].join(', ')}`);
  }
  if (grouped['insight']?.length) {
    parts.push(`Insights: ${grouped['insight'].join('; ')}`);
  }
  if (grouped['victory']?.length) {
    parts.push(`Recent wins: ${grouped['victory'].join('; ')}`);
  }
  if (grouped['emotion']?.length) {
    parts.push(`Emotional patterns: ${grouped['emotion'].join(', ')}`);
  }

  return parts.join('\n');
}
