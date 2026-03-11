/**
 * Memory Extractor
 * Extracts facts and memories from AI conversations.
 */

import type { Memory, MemoryType } from '../../../features/journal/utils/memoryExtraction';

// Helper to generate IDs
function generateId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Compile regex patterns once at module level (performance optimization)
const PEOPLE_PATTERNS = [
  /my (?:sponsor|friend|wife|husband|partner|mom|dad|mother|father|brother|sister|son|daughter|therapist|counselor|boss|coworker) (\w+)/gi,
  /(\w+),? (?:is )?my (?:sponsor|friend|wife|husband|partner|mom|dad|mother|father)/gi,
  /(?:sponsor|wife|husband|partner) (?:named|called|is) (\w+)/gi,
];

const TRIGGER_PATTERNS = [
  /when I (?:feel|get|am) (\w+(?:\s+\w+)?),? I (?:want to|feel like) (?:use|drink|relapse)/gi,
  /(?:triggers?|triggered) (?:by|when|me):? (.+?)(?:\.|,|$)/gi,
  /(?:makes me want to use|crave when) (.+?)(?:\.|,|$)/gi,
  /(\w+(?:\s+\w+)?) (?:is|are) (?:a )?trigger/gi,
];

const COPING_PATTERNS = [
  /(?:what helps|helps me|works for me) (?:is|:) (.+?)(?:\.|,|$)/gi,
  /I (?:cope|deal|handle it) by (.+?)(?:\.|,|$)/gi,
  /(?:calling|meditation|exercise|meetings?|prayer|walking|journaling) (?:helps|works)/gi,
];

const GOAL_PATTERNS = [
  /(?:my goal is|I want to|I'm trying to|I'm working on) (.+?)(?:\.|,|$)/gi,
  /(?:hoping to|plan to|going to) (.+?)(?:\.|,|$)/gi,
];

const INSIGHT_PATTERNS = [
  /I (?:realized|understand now|finally get|see now) (?:that )?(.+?)(?:\.|$)/gi,
  /(?:hit me|dawned on me|clicked) (?:that )?(.+?)(?:\.|$)/gi,
];

const VICTORY_INDICATORS = [
  'made it',
  'survived',
  "didn't use",
  'stayed clean',
  'stayed sober',
  'proud',
  'milestone',
  'days clean',
  'days sober',
  'accomplished',
  'breakthrough',
];

// Helper to extract matches using pre-compiled patterns
function extractMatches(message: string, patterns: RegExp[]): RegExpExecArray[] {
  const matches: RegExpExecArray[] = [];
  for (const pattern of patterns) {
    // Reset lastIndex to ensure fresh matching
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(message)) !== null) {
      matches.push(match);
    }
  }
  return matches;
}

// Simple rule-based extraction (can be enhanced with AI later)
export function extractMemoriesFromMessage(
  userId: string,
  message: string,
  sourceId: string,
): Memory[] {
  const memories: Memory[] = [];
  const now = new Date();

  // Extract people mentions (basic pattern)
  for (const match of extractMatches(message, PEOPLE_PATTERNS)) {
    const name = match[1];
    if (name && name.length > 1 && name.length < 20) {
      memories.push({
        id: generateId(),
        userId,
        type: 'person' as MemoryType,
        content: name,
        context: message.slice(Math.max(0, match.index - 50), match.index + match[0].length + 50),
        confidence: 0.7,
        source: 'chat',
        sourceId,
        createdAt: now,
        updatedAt: now,
        key: `person:${name.toLowerCase()}`,
      });
    }
  }

  // Extract triggers
  for (const match of extractMatches(message, TRIGGER_PATTERNS)) {
    const trigger = match[1]?.trim();
    if (trigger && trigger.length > 2 && trigger.length < 100) {
      memories.push({
        id: generateId(),
        userId,
        type: 'trigger' as MemoryType,
        content: trigger,
        context: message.slice(
          Math.max(0, match.index - 30),
          Math.min(message.length, match.index + match[0].length + 30),
        ),
        confidence: 0.8,
        source: 'chat',
        sourceId,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Extract coping strategies
  for (const match of extractMatches(message, COPING_PATTERNS)) {
    const strategy = match[1]?.trim() || match[0];
    if (strategy && strategy.length > 3 && strategy.length < 150) {
      memories.push({
        id: generateId(),
        userId,
        type: 'coping_strategy' as MemoryType,
        content: strategy,
        confidence: 0.75,
        source: 'chat',
        sourceId,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Extract victories
  if (VICTORY_INDICATORS.some((v) => message.toLowerCase().includes(v))) {
    memories.push({
      id: generateId(),
      userId,
      type: 'victory' as MemoryType,
      content: message.slice(0, 200),
      confidence: 0.6,
      source: 'chat',
      sourceId,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Extract goals
  for (const match of extractMatches(message, GOAL_PATTERNS)) {
    const goal = match[1]?.trim();
    if (goal && goal.length > 5 && goal.length < 200) {
      memories.push({
        id: generateId(),
        userId,
        type: 'goal' as MemoryType,
        content: goal,
        confidence: 0.7,
        source: 'chat',
        sourceId,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Extract insights/realizations
  for (const match of extractMatches(message, INSIGHT_PATTERNS)) {
    const insight = match[1]?.trim();
    if (insight && insight.length > 10 && insight.length < 300) {
      memories.push({
        id: generateId(),
        userId,
        type: 'insight' as MemoryType,
        content: insight,
        confidence: 0.75,
        source: 'chat',
        sourceId,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Dedupe by content similarity
  return dedupeMemories(memories);
}

// Extract memories from assistant messages too (things the user confirmed)
export function extractMemoriesFromAssistantExchange(
  userId: string,
  userMessage: string,
  _assistantMessage: string,
  sourceId: string,
): Memory[] {
  // Only extract from user message for now
  // Could expand to confirm facts mentioned by assistant that user agrees with
  return extractMemoriesFromMessage(userId, userMessage, sourceId);
}

// Remove duplicates
function dedupeMemories(memories: Memory[]): Memory[] {
  const seen = new Set<string>();
  return memories.filter((m) => {
    const key = m.key || `${m.type}:${m.content.toLowerCase().slice(0, 50)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Higher-level memory extraction entry point.
 *
 * @remarks Falls back to rule-based extraction (`extractMemoriesFromMessage`).
 * In a future iteration this can call an AI endpoint for more nuanced
 * entity/event extraction while still returning the same `Memory[]` shape.
 */
export async function extractMemoriesWithAI(
  _userId: string,
  _message: string,
  _sourceId: string,
): Promise<Memory[]> {
  return extractMemoriesFromMessage(_userId, _message, _sourceId);
}
