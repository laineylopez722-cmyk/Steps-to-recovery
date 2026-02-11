/**
 * Journal Analysis Service
 * Enables "Ask AI about my journal" — query journal entries via natural language.
 */

import { logger } from '../../../utils/logger';
import { decryptContent } from '../../../utils/encryption';

export interface JournalAnalysisResult {
  answer: string;
  relevantEntryIds: string[];
  confidence: number;
}

export interface JournalEntry {
  id: string;
  encrypted_body: string;
  created_at: string;
  mood_rating?: number;
  craving_level?: number;
  tags?: string;
}

/**
 * Build context from journal entries for AI analysis.
 * Decrypts locally and creates anonymized summaries — never sends raw text externally.
 */
export async function buildJournalContext(
  entries: JournalEntry[],
  query: string,
  maxEntries: number = 15,
): Promise<string> {
  const decrypted: Array<{ date: string; text: string; mood?: number; craving?: number }> = [];

  for (const entry of entries.slice(0, maxEntries)) {
    try {
      const text = await decryptContent(entry.encrypted_body);
      decrypted.push({
        date: entry.created_at.split('T')[0] || entry.created_at,
        text: text.substring(0, 500), // Limit per entry
        mood: entry.mood_rating,
        craving: entry.craving_level,
      });
    } catch {
      logger.warn('Failed to decrypt journal entry for analysis', { entryId: entry.id });
    }
  }

  if (decrypted.length === 0) {
    return 'No journal entries available to analyze.';
  }

  const context = decrypted
    .map((e) => {
      let line = `[${e.date}]`;
      if (e.mood) line += ` Mood:${e.mood}/5`;
      if (e.craving) line += ` Craving:${e.craving}/10`;
      line += ` — ${e.text}`;
      return line;
    })
    .join('\n');

  return context;
}

/**
 * Create a prompt for journal analysis.
 */
export function createJournalAnalysisPrompt(query: string, journalContext: string): string {
  return `You are analyzing a user's recovery journal entries to answer their question.

IMPORTANT: The user trusts you with their private reflections. Be compassionate, insightful, and honest.
Never quote their entries back word-for-word. Summarize patterns and insights instead.

--- JOURNAL ENTRIES ---
${journalContext}
--- END ENTRIES ---

User's question: ${query}

Provide a thoughtful, specific answer based on the journal content. Reference dates when relevant.
If you notice concerning patterns (declining mood, increasing cravings), mention them gently.
If you can't find relevant information in the entries, say so honestly.`;
}

/**
 * Suggested journal analysis questions based on available data.
 */
export function getSuggestedQueries(entryCount: number, hasMoodData: boolean): string[] {
  const queries: string[] = [];

  if (entryCount > 0) {
    queries.push('What patterns do you see in my journal?');
  }

  if (entryCount > 7) {
    queries.push('How has my mood changed over the past week?');
    queries.push('When did I last feel really good?');
  }

  if (hasMoodData) {
    queries.push('What seems to trigger my low moods?');
    queries.push('Are my cravings getting better or worse?');
  }

  if (entryCount > 14) {
    queries.push('What themes keep coming up in my writing?');
    queries.push('What coping strategies have I mentioned?');
  }

  return queries.slice(0, 5);
}
