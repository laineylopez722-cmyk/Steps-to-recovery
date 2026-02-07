/**
 * Memory Extraction for AI Companion
 * 
 * Parses journal entries to extract key information:
 * - People mentioned (sponsor, family, friends)
 * - Triggers identified
 * - Emotions expressed
 * - Victories and struggles
 * - Patterns and themes
 * 
 * This data feeds the AI companion's memory store,
 * allowing it to reference user's history in conversations.
 */

export interface Memory {
  id: string;
  userId: string;
  type: MemoryType;
  content: string;
  context?: string;
  confidence: number; // 0-1, how confident we are in this extraction
  source: 'journal' | 'checkin' | 'chat';
  sourceId?: string;
  createdAt: Date;
  updatedAt: Date;
  // For deduplication and updating
  key?: string;
}

export type MemoryType =
  | 'person'           // Someone the user knows
  | 'trigger'          // What triggers cravings/negative feelings
  | 'coping_strategy'  // What helps them cope
  | 'emotion'          // Significant emotional moment
  | 'victory'          // Something they're proud of
  | 'struggle'         // Current challenges
  | 'goal'             // Things they want to achieve
  | 'insight'          // Self-realizations
  | 'preference'       // Likes/dislikes
  | 'milestone'        // Recovery milestones
  | 'pattern';         // Behavioral patterns

// Patterns to detect different memory types
const PATTERNS = {
  // People detection
  person: [
    /my (?:sponsor|wife|husband|partner|mom|dad|mother|father|brother|sister|son|daughter|friend|therapist|counselor)/gi,
    /(?:sponsor|wife|husband|partner) (?:named|called) (\w+)/gi,
    /talked to (\w+)/gi,
    /(\w+) (?:said|told me|helped|supported)/gi,
  ],
  
  // Trigger detection
  trigger: [
    /(?:triggered|craving|urge|tempted) (?:when|by|after) (.+?)(?:\.|$)/gi,
    /(?:makes me want to|feel like using when) (.+?)(?:\.|$)/gi,
    /(?:stress|anxiety|anger|loneliness|boredom) (?:makes|causes)/gi,
    /(?:hard|difficult|struggle) (?:when|after|with) (.+?)(?:\.|$)/gi,
  ],
  
  // Coping strategies
  coping: [
    /(?:helped|helps|calms|calmed) (?:me|when I) (.+?)(?:\.|$)/gi,
    /(?:instead of using|to stay sober) I (.+?)(?:\.|$)/gi,
    /what works (?:for me|is) (.+?)(?:\.|$)/gi,
    /(?:meditation|prayer|exercise|meeting|calling|walking)/gi,
  ],
  
  // Victories
  victory: [
    /(?:proud|accomplished|achieved|managed|succeeded)/gi,
    /(?:didn't use|stayed sober|made it through)/gi,
    /(?:first time|finally|breakthrough)/gi,
    /(?:\d+) (?:days|weeks|months) (?:clean|sober)/gi,
  ],
  
  // Struggles
  struggle: [
    /(?:struggling|hard time|difficult|tough|challenging)/gi,
    /(?:can't|cannot|unable|failing)/gi,
    /(?:relapse|slip|mistake|setback)/gi,
    /(?:craving|urge|temptation)/gi,
  ],
  
  // Goals
  goal: [
    /(?:want to|trying to|goal is|hope to|plan to) (.+?)(?:\.|$)/gi,
    /(?:working on|focusing on) (.+?)(?:\.|$)/gi,
    /(?:next step|my goal)/gi,
  ],
  
  // Insights
  insight: [
    /(?:realized|learned|understand|noticed|see that) (.+?)(?:\.|$)/gi,
    /(?:never knew|now I know|it hit me)/gi,
    /(?:the truth is|what I've learned)/gi,
  ],
};

// Emotion keywords with their categories
const EMOTION_KEYWORDS = {
  positive: [
    'happy', 'grateful', 'thankful', 'hopeful', 'proud', 'peaceful',
    'calm', 'content', 'relieved', 'excited', 'joyful', 'optimistic',
  ],
  negative: [
    'sad', 'angry', 'anxious', 'scared', 'lonely', 'depressed',
    'frustrated', 'overwhelmed', 'hopeless', 'ashamed', 'guilty',
  ],
  neutral: [
    'okay', 'fine', 'neutral', 'meh', 'uncertain', 'mixed',
  ],
};

/**
 * Extract memories from journal content
 */
export async function extractMemories(
  content: string,
  userId: string,
  sourceId?: string,
): Promise<Memory[]> {
  const memories: Memory[] = [];
  const now = new Date();
  
  // Skip if content is too short
  if (content.length < 20) return memories;
  
  // Normalize content
  const text = content.toLowerCase();
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  
  // Extract people
  for (const pattern of PATTERNS.person) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const person = match[1] || match[0];
      if (person && person.length > 1 && person.length < 30) {
        memories.push({
          id: generateId(),
          userId,
          type: 'person',
          content: person.trim(),
          context: getContext(content, match.index || 0),
          confidence: 0.7,
          source: 'journal',
          sourceId,
          createdAt: now,
          updatedAt: now,
          key: `person:${person.toLowerCase().trim()}`,
        });
      }
    }
  }
  
  // Extract triggers
  for (const pattern of PATTERNS.trigger) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const trigger = match[1] || match[0];
      if (trigger && trigger.length > 3) {
        memories.push({
          id: generateId(),
          userId,
          type: 'trigger',
          content: trigger.trim(),
          context: getContext(content, match.index || 0),
          confidence: 0.6,
          source: 'journal',
          sourceId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }
  
  // Extract coping strategies
  for (const pattern of PATTERNS.coping) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const strategy = match[1] || match[0];
      if (strategy && strategy.length > 3) {
        memories.push({
          id: generateId(),
          userId,
          type: 'coping_strategy',
          content: strategy.trim(),
          context: getContext(content, match.index || 0),
          confidence: 0.65,
          source: 'journal',
          sourceId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }
  
  // Extract victories
  for (const sentence of sentences) {
    for (const pattern of PATTERNS.victory) {
      if (pattern.test(sentence)) {
        memories.push({
          id: generateId(),
          userId,
          type: 'victory',
          content: sentence.trim(),
          confidence: 0.6,
          source: 'journal',
          sourceId,
          createdAt: now,
          updatedAt: now,
        });
        break;
      }
    }
  }
  
  // Extract struggles
  for (const sentence of sentences) {
    for (const pattern of PATTERNS.struggle) {
      if (pattern.test(sentence)) {
        memories.push({
          id: generateId(),
          userId,
          type: 'struggle',
          content: sentence.trim(),
          confidence: 0.6,
          source: 'journal',
          sourceId,
          createdAt: now,
          updatedAt: now,
        });
        break;
      }
    }
  }
  
  // Extract goals
  for (const pattern of PATTERNS.goal) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const goal = match[1] || match[0];
      if (goal && goal.length > 3) {
        memories.push({
          id: generateId(),
          userId,
          type: 'goal',
          content: goal.trim(),
          context: getContext(content, match.index || 0),
          confidence: 0.7,
          source: 'journal',
          sourceId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }
  
  // Extract insights
  for (const pattern of PATTERNS.insight) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const insight = match[1] || match[0];
      if (insight && insight.length > 10) {
        memories.push({
          id: generateId(),
          userId,
          type: 'insight',
          content: insight.trim(),
          context: getContext(content, match.index || 0),
          confidence: 0.75,
          source: 'journal',
          sourceId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }
  
  // Extract significant emotions
  const emotionMatches = detectEmotions(text);
  if (emotionMatches.length > 0) {
    memories.push({
      id: generateId(),
      userId,
      type: 'emotion',
      content: emotionMatches.join(', '),
      context: sentences[0]?.trim(),
      confidence: 0.8,
      source: 'journal',
      sourceId,
      createdAt: now,
      updatedAt: now,
    });
  }
  
  // Dedupe by content similarity
  return dedupeMemories(memories);
}

/**
 * Get surrounding context for a match
 */
function getContext(content: string, index: number, radius = 100): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, index + radius);
  return content.slice(start, end).trim();
}

/**
 * Detect emotions in text
 */
function detectEmotions(text: string): string[] {
  const found: string[] = [];
  
  for (const emotion of EMOTION_KEYWORDS.positive) {
    if (text.includes(emotion)) found.push(emotion);
  }
  for (const emotion of EMOTION_KEYWORDS.negative) {
    if (text.includes(emotion)) found.push(emotion);
  }
  
  return found.slice(0, 5); // Max 5 emotions
}

/**
 * Remove duplicate memories
 */
function dedupeMemories(memories: Memory[]): Memory[] {
  const seen = new Set<string>();
  return memories.filter(m => {
    const key = m.key || `${m.type}:${m.content.toLowerCase().slice(0, 50)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
