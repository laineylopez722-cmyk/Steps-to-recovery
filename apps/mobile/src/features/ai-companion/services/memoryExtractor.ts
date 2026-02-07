/**
 * Memory Extractor
 * Extracts facts and memories from AI conversations.
 */

import type {
  Memory,
  MemoryType,
} from '../../../features/journal/utils/memoryExtraction';

// Helper to generate IDs
function generateId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Simple rule-based extraction (can be enhanced with AI later)
export function extractMemoriesFromMessage(
  userId: string,
  message: string,
  sourceId: string
): Memory[] {
  const memories: Memory[] = [];
  const now = new Date();

  // Extract people mentions (basic pattern)
  const peoplePatterns = [
    /my (?:sponsor|friend|wife|husband|partner|mom|dad|mother|father|brother|sister|son|daughter|therapist|counselor|boss|coworker) (\w+)/gi,
    /(\w+),? (?:is )?my (?:sponsor|friend|wife|husband|partner|mom|dad|mother|father)/gi,
    /(?:sponsor|wife|husband|partner) (?:named|called|is) (\w+)/gi,
  ];

  for (const pattern of peoplePatterns) {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      const name = match[1];
      if (name && name.length > 1 && name.length < 20) {
        memories.push({
          id: generateId(),
          userId,
          type: 'person' as MemoryType,
          content: name,
          context: message.slice(
            Math.max(0, match.index - 50),
            match.index + match[0].length + 50
          ),
          confidence: 0.7,
          source: 'chat',
          sourceId,
          createdAt: now,
          updatedAt: now,
          key: `person:${name.toLowerCase()}`,
        });
      }
    }
  }

  // Extract triggers
  const triggerPatterns = [
    /when I (?:feel|get|am) (\w+(?:\s+\w+)?),? I (?:want to|feel like) (?:use|drink|relapse)/gi,
    /(?:triggers?|triggered) (?:by|when|me):? (.+?)(?:\.|,|$)/gi,
    /(?:makes me want to use|crave when) (.+?)(?:\.|,|$)/gi,
    /(\w+(?:\s+\w+)?) (?:is|are) (?:a )?trigger/gi,
  ];

  for (const pattern of triggerPatterns) {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      const trigger = match[1]?.trim();
      if (trigger && trigger.length > 2 && trigger.length < 100) {
        memories.push({
          id: generateId(),
          userId,
          type: 'trigger' as MemoryType,
          content: trigger,
          context: message.slice(
            Math.max(0, match.index - 30),
            Math.min(message.length, match.index + match[0].length + 30)
          ),
          confidence: 0.8,
          source: 'chat',
          sourceId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  // Extract coping strategies
  const copingPatterns = [
    /(?:what helps|helps me|works for me) (?:is|:) (.+?)(?:\.|,|$)/gi,
    /I (?:cope|deal|handle it) by (.+?)(?:\.|,|$)/gi,
    /(?:calling|meditation|exercise|meetings?|prayer|walking|journaling) (?:helps|works)/gi,
  ];

  for (const pattern of copingPatterns) {
    let match;
    while ((match = pattern.exec(message)) !== null) {
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
  }

  // Extract victories
  const victoryIndicators = [
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

  if (victoryIndicators.some((v) => message.toLowerCase().includes(v))) {
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
  const goalPatterns = [
    /(?:my goal is|I want to|I'm trying to|I'm working on) (.+?)(?:\.|,|$)/gi,
    /(?:hoping to|plan to|going to) (.+?)(?:\.|,|$)/gi,
  ];

  for (const pattern of goalPatterns) {
    let match;
    while ((match = pattern.exec(message)) !== null) {
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
  }

  // Extract insights/realizations
  const insightPatterns = [
    /I (?:realized|understand now|finally get|see now) (?:that )?(.+?)(?:\.|$)/gi,
    /(?:hit me|dawned on me|clicked) (?:that )?(.+?)(?:\.|$)/gi,
  ];

  for (const pattern of insightPatterns) {
    let match;
    while ((match = pattern.exec(message)) !== null) {
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
  }

  // Dedupe by content similarity
  return dedupeMemories(memories);
}

// Extract memories from assistant messages too (things the user confirmed)
export function extractMemoriesFromAssistantExchange(
  userId: string,
  userMessage: string,
  assistantMessage: string,
  sourceId: string
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

// Higher-level extraction that could use AI in the future
export async function extractMemoriesWithAI(
  _userId: string,
  _message: string,
  _sourceId: string
): Promise<Memory[]> {
  // TODO: Implement AI-powered extraction for more nuanced understanding
  // For now, fall back to rule-based extraction
  return extractMemoriesFromMessage(_userId, _message, _sourceId);
}
