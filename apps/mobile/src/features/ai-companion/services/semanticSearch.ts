/**
 * Semantic Memory Search
 * Lightweight vector similarity for memory retrieval.
 * Uses TF-IDF-like scoring since we can't run embedding models on-device efficiently.
 */

import { logger } from '../../../utils/logger';

export interface MemoryDocument {
  id: string;
  content: string;
  category: string;
  timestamp: string;
  terms?: Map<string, number>; // TF cache
}

// Stopwords to ignore
const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'can',
  'shall',
  'to',
  'of',
  'in',
  'for',
  'on',
  'with',
  'at',
  'by',
  'from',
  'as',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'between',
  'out',
  'off',
  'over',
  'under',
  'again',
  'further',
  'then',
  'once',
  'here',
  'there',
  'when',
  'where',
  'why',
  'how',
  'all',
  'both',
  'each',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'nor',
  'not',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  'just',
  'i',
  'me',
  'my',
  'myself',
  'we',
  'our',
  'you',
  'your',
  'he',
  'him',
  'she',
  'her',
  'it',
  'its',
  'they',
  'them',
  'their',
  'this',
  'that',
  'these',
  'those',
  'and',
  'but',
  'or',
  'if',
  'while',
  'because',
  'about',
  'until',
  'what',
  'which',
  'who',
]);

/**
 * Tokenize and normalize text.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/**
 * Compute term frequency for a document.
 */
function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  // Normalize
  const max = Math.max(...tf.values(), 1);
  for (const [term, count] of tf) {
    tf.set(term, count / max);
  }
  return tf;
}

/**
 * Compute IDF across a corpus.
 */
function computeIDF(documents: MemoryDocument[]): Map<string, number> {
  const docCount = documents.length;
  const termDocCounts = new Map<string, number>();

  for (const doc of documents) {
    const uniqueTerms = new Set(tokenize(doc.content));
    for (const term of uniqueTerms) {
      termDocCounts.set(term, (termDocCounts.get(term) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, count] of termDocCounts) {
    idf.set(term, Math.log(docCount / (1 + count)) + 1);
  }
  return idf;
}

/**
 * Search memories by semantic similarity using TF-IDF cosine similarity.
 */
export function searchMemories(
  query: string,
  documents: MemoryDocument[],
  limit: number = 5,
): Array<{ document: MemoryDocument; score: number }> {
  if (documents.length === 0) return [];

  const idf = computeIDF(documents);
  const queryTokens = tokenize(query);
  const queryTF = computeTF(queryTokens);

  // Build query vector
  const queryVector = new Map<string, number>();
  for (const [term, tf] of queryTF) {
    queryVector.set(term, tf * (idf.get(term) || 1));
  }

  // Score each document
  const results = documents.map((doc) => {
    const docTokens = tokenize(doc.content);
    const docTF = computeTF(docTokens);

    // Cosine similarity
    let dotProduct = 0;
    let docMagnitude = 0;
    let queryMagnitude = 0;

    const allTerms = new Set([...queryVector.keys(), ...docTF.keys()]);
    for (const term of allTerms) {
      const qWeight = queryVector.get(term) || 0;
      const dTF = docTF.get(term) || 0;
      const dWeight = dTF * (idf.get(term) || 1);

      dotProduct += qWeight * dWeight;
      queryMagnitude += qWeight * qWeight;
      docMagnitude += dWeight * dWeight;
    }

    queryMagnitude = Math.sqrt(queryMagnitude);
    docMagnitude = Math.sqrt(docMagnitude);

    const score =
      queryMagnitude > 0 && docMagnitude > 0 ? dotProduct / (queryMagnitude * docMagnitude) : 0;

    // Boost recent documents slightly
    const ageMs = Date.now() - new Date(doc.timestamp).getTime();
    const recencyBoost = Math.max(0, 1 - ageMs / (90 * 24 * 60 * 60 * 1000)); // Decay over 90 days
    const boostedScore = score * (1 + recencyBoost * 0.1);

    return { document: doc, score: boostedScore };
  });

  const sorted = results
    .filter((r) => r.score > 0.01)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  logger.debug('Semantic memory search', { query: query.substring(0, 50), results: sorted.length });
  return sorted;
}
