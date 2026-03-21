/**
 * Recovery Context Enricher
 *
 * Pulls recent journal entries, step work answers, and check-in data
 * into a compact context string for the AI companion.
 *
 * This gives the AI real knowledge of the user's recovery journey —
 * not just extracted "memories" but actual writings and reflections.
 */

import { decryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import type { StorageAdapter } from '../../../adapters/storage';

// ============================================================================
// Types
// ============================================================================

interface RawJournalEntry {
  id: string;
  content: string;
  title: string | null;
  tags: string | null;
  mood: number | null;
  is_encrypted: number;
  created_at: string;
}

interface RawCheckIn {
  type: string;
  date: string;
  mood: number | null;
  craving: number | null;
  intention: string | null;
  reflection: string | null;
  gratitude: string | null;
  created_at: string;
}

interface RawStepAnswer {
  step_number: number;
  question_number: number;
  encrypted_answer: string | null;
  is_complete: number;
  updated_at: string;
}

interface RawStepProgress {
  step_number: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface EnrichedContext {
  journalContext: string;
  stepWorkContext: string;
  checkInContext: string;
  summary: string;
}

// ============================================================================
// Main function
// ============================================================================

/**
 * Build enriched context from the user's actual recovery data.
 * Returns a compact string suitable for injection into the AI system prompt.
 *
 * Budget: ~2000 tokens total to avoid blowing up context window.
 */
export async function buildEnrichedContext(
  db: StorageAdapter,
  userId: string,
): Promise<string> {
  const [journalCtx, stepCtx, checkInCtx] = await Promise.all([
    buildJournalContextFromDb(db, userId),
    buildStepWorkContext(db, userId),
    buildCheckInContext(db, userId),
  ]);

  const parts: string[] = [];
  if (checkInCtx) parts.push(checkInCtx);
  if (journalCtx) parts.push(journalCtx);
  if (stepCtx) parts.push(stepCtx);

  if (parts.length === 0) return '';

  return parts.join('\n\n');
}

// ============================================================================
// Journal entries
// ============================================================================

async function buildJournalContextFromDb(
  db: StorageAdapter,
  userId: string,
): Promise<string> {
  try {
    const entries = await db.getAllAsync<RawJournalEntry>(
      `SELECT id, content, title, tags, mood, is_encrypted, created_at
       FROM journal_entries
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId],
    );

    if (entries.length === 0) return '';

    const lines: string[] = ['RECENT JOURNAL ENTRIES:'];

    for (const entry of entries) {
      try {
        const text = entry.is_encrypted
          ? await decryptContent(entry.content)
          : entry.content;

        // Truncate to ~200 chars per entry
        const snippet = text.length > 200
          ? text.slice(0, 200).trimEnd() + '...'
          : text;

        const date = entry.created_at.split('T')[0] ?? entry.created_at;
        let line = `[${date}]`;
        if (entry.mood) line += ` mood:${entry.mood}/5`;
        if (entry.title) line += ` "${entry.title}"`;
        line += ` — ${snippet}`;

        lines.push(line);
      } catch {
        // Skip entries that fail to decrypt
      }
    }

    return lines.length > 1 ? lines.join('\n') : '';
  } catch (err) {
    logger.error('Failed to build journal context', err);
    return '';
  }
}

// ============================================================================
// Step work answers
// ============================================================================

async function buildStepWorkContext(
  db: StorageAdapter,
  userId: string,
): Promise<string> {
  try {
    // Get step progress overview
    const progress = await db.getAllAsync<RawStepProgress>(
      `SELECT step_number, status, started_at, completed_at
       FROM step_progress
       WHERE user_id = ?
       ORDER BY step_number ASC`,
      [userId],
    );

    // Get recent answers (last 15 answered questions across all steps)
    const answers = await db.getAllAsync<RawStepAnswer>(
      `SELECT step_number, question_number, encrypted_answer, is_complete, updated_at
       FROM step_work
       WHERE user_id = ? AND encrypted_answer IS NOT NULL
       ORDER BY updated_at DESC
       LIMIT 15`,
      [userId],
    );

    if (progress.length === 0 && answers.length === 0) return '';

    const lines: string[] = ['STEP WORK:'];

    // Progress overview
    if (progress.length > 0) {
      const completed = progress.filter((p) => p.status === 'completed').length;
      const inProgress = progress.filter((p) => p.status === 'in_progress');
      lines.push(`Progress: ${completed}/12 steps completed.`);
      if (inProgress.length > 0) {
        lines.push(
          `Currently working: ${inProgress.map((p) => `Step ${p.step_number}`).join(', ')}`,
        );
      }
    }

    // Recent answers — these reveal what the user is actually thinking/processing
    if (answers.length > 0) {
      lines.push('Recent step work answers:');

      // Import step prompts to get the actual question text
      const { STEP_PROMPTS } = await import('@/shared');

      for (const answer of answers) {
        try {
          const text = answer.encrypted_answer
            ? await decryptContent(answer.encrypted_answer)
            : null;
          if (!text?.trim()) continue;

          // Get the question prompt
          const stepData = STEP_PROMPTS.find((s) => s.step === answer.step_number);
          const questionText = stepData?.prompts[answer.question_number - 1] ?? '';

          const snippet = text.length > 150
            ? text.slice(0, 150).trimEnd() + '...'
            : text;

          // Include question for context so the AI knows what was asked
          const questionHint = questionText.length > 80
            ? questionText.slice(0, 80).trimEnd() + '...'
            : questionText;

          lines.push(`  Step ${answer.step_number} Q${answer.question_number}: "${questionHint}"`);
          lines.push(`  → ${snippet}`);
        } catch {
          // Skip answers that fail to decrypt
        }
      }
    }

    return lines.length > 1 ? lines.join('\n') : '';
  } catch (err) {
    logger.error('Failed to build step work context', err);
    return '';
  }
}

// ============================================================================
// Check-in data
// ============================================================================

async function buildCheckInContext(
  db: StorageAdapter,
  userId: string,
): Promise<string> {
  try {
    const checkIns = await db.getAllAsync<RawCheckIn>(
      `SELECT type, date, mood, craving, intention, reflection, gratitude, created_at
       FROM check_ins
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 14`,
      [userId],
    );

    if (checkIns.length === 0) return '';

    const lines: string[] = ['RECENT CHECK-INS:'];

    // Group by date for readability
    const byDate = new Map<string, RawCheckIn[]>();
    for (const ci of checkIns) {
      const date = ci.date;
      const existing = byDate.get(date) ?? [];
      existing.push(ci);
      byDate.set(date, existing);
    }

    for (const [date, cis] of byDate) {
      const morning = cis.find((c) => c.type === 'morning');
      const evening = cis.find((c) => c.type === 'evening');

      let line = `[${date}]`;

      if (morning) {
        line += ` Morning: mood ${morning.mood ?? '?'}/5`;
        if (morning.intention) {
          const intent = morning.intention.length > 80
            ? morning.intention.slice(0, 80) + '...'
            : morning.intention;
          line += ` intention: "${intent}"`;
        }
      }

      if (evening) {
        line += ` | Evening: mood ${evening.mood ?? '?'}/5`;
        if (evening.craving != null) line += ` craving ${evening.craving}/10`;
        if (evening.reflection) {
          const refl = evening.reflection.length > 80
            ? evening.reflection.slice(0, 80) + '...'
            : evening.reflection;
          line += ` reflection: "${refl}"`;
        }
        if (evening.gratitude) {
          const grat = evening.gratitude.length > 60
            ? evening.gratitude.slice(0, 60) + '...'
            : evening.gratitude;
          line += ` grateful for: "${grat}"`;
        }
      }

      lines.push(line);
    }

    // Mood trend
    const moods = checkIns
      .filter((c) => c.mood != null)
      .map((c) => c.mood as number);
    if (moods.length >= 3) {
      const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
      const recent = moods.slice(0, 3);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const trend = recentAvg > avg + 0.3 ? 'improving' : recentAvg < avg - 0.3 ? 'declining' : 'stable';
      lines.push(`Mood trend: ${avg.toFixed(1)}/5 avg, recent ${trend}`);
    }

    // Craving trend
    const cravings = checkIns
      .filter((c) => c.craving != null)
      .map((c) => c.craving as number);
    if (cravings.length >= 3) {
      const avg = cravings.reduce((a, b) => a + b, 0) / cravings.length;
      const recent = cravings.slice(0, 3);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const trend = recentAvg > avg + 0.5 ? 'increasing ⚠️' : recentAvg < avg - 0.5 ? 'decreasing' : 'stable';
      lines.push(`Craving trend: ${avg.toFixed(1)}/10 avg, recent ${trend}`);
    }

    return lines.length > 1 ? lines.join('\n') : '';
  } catch (err) {
    logger.error('Failed to build check-in context', err);
    return '';
  }
}
