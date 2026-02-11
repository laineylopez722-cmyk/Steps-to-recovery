/**
 * Meeting Reflection Service
 *
 * Manages pre-meeting intentions and post-meeting reflections.
 * Helps users maximize value from meeting attendance.
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { encryptContent, decryptContent } from '../utils/encryption';

// ========================================
// Encryption Helpers
// ========================================

/**
 * Safely decrypt a string value, returning as-is if not encrypted (migration support)
 */
async function safeDecrypt(value: string | null | undefined): Promise<string | undefined> {
  if (!value) return undefined;
  try {
    return await decryptContent(value);
  } catch {
    return value;
  }
}

/**
 * Safely decrypt a mood value stored as encrypted string or legacy integer
 */
async function safeDecryptMood(value: unknown): Promise<number | undefined> {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return undefined;
  try {
    const decrypted = await decryptContent(value);
    const num = parseInt(decrypted, 10);
    return isNaN(num) ? undefined : num;
  } catch {
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  }
}

/**
 * Decrypt all sensitive fields in a raw reflection record
 */
async function decryptReflection(raw: Record<string, unknown>): Promise<MeetingReflection> {
  return {
    id: raw.id as string,
    user_id: raw.user_id as string,
    checkin_id: raw.checkin_id as string,
    pre_intention: await safeDecrypt(raw.pre_intention as string | null),
    pre_mood: await safeDecryptMood(raw.pre_mood),
    pre_hope: await safeDecrypt(raw.pre_hope as string | null),
    post_key_takeaway: await safeDecrypt(raw.post_key_takeaway as string | null),
    post_mood: await safeDecryptMood(raw.post_mood),
    post_gratitude: await safeDecrypt(raw.post_gratitude as string | null),
    post_will_apply: await safeDecrypt(raw.post_will_apply as string | null),
    created_at: raw.created_at as string,
    updated_at: raw.updated_at as string,
  };
}

// ========================================
// Types
// ========================================

export interface MeetingReflection {
  id: string;
  user_id: string;
  checkin_id: string; // Links to meeting_checkins table

  // Pre-meeting
  pre_intention?: string;
  pre_mood?: number; // 1-5
  pre_hope?: string; // What are you hoping for?

  // Post-meeting
  post_key_takeaway?: string;
  post_mood?: number; // 1-5
  post_gratitude?: string;
  post_will_apply?: string; // What will you apply?

  created_at: string;
  updated_at: string;
}

export interface PreMeetingPrompts {
  intention: string;
  mood: number;
  hope: string;
}

export interface PostMeetingPrompts {
  keyTakeaway: string;
  mood: number;
  gratitude: string;
  willApply: string;
}

// ========================================
// Pre-Meeting Functions
// ========================================

/**
 * Save pre-meeting reflection
 */
export async function savePreMeetingReflection(
  userId: string,
  checkinId: string,
  prompts: PreMeetingPrompts,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Encrypt sensitive fields before storage
    const encryptedIntention = prompts.intention ? await encryptContent(prompts.intention) : null;
    const encryptedMood = await encryptContent(String(prompts.mood));
    const encryptedHope = prompts.hope ? await encryptContent(prompts.hope) : null;

    const { error } = await supabase.from('meeting_reflections').insert({
      user_id: userId,
      checkin_id: checkinId,
      pre_intention: encryptedIntention,
      pre_mood: encryptedMood,
      pre_hope: encryptedHope,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      logger.warn('Meeting reflection: Pre-meeting save failed', { error });
      return { success: false, error: error.message };
    }

    logger.info('Meeting reflection: Pre-meeting saved', { userId, checkinId });
    return { success: true };
  } catch (error) {
    logger.warn('Meeting reflection: Pre-meeting error', { error });
    return { success: false, error: 'Unexpected error' };
  }
}

// ========================================
// Post-Meeting Functions
// ========================================

/**
 * Update with post-meeting reflection
 */
export async function savePostMeetingReflection(
  userId: string,
  checkinId: string,
  prompts: PostMeetingPrompts,
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();

    // Encrypt sensitive fields before storage
    const encryptedKeyTakeaway = prompts.keyTakeaway
      ? await encryptContent(prompts.keyTakeaway)
      : null;
    const encryptedMood = await encryptContent(String(prompts.mood));
    const encryptedGratitude = prompts.gratitude ? await encryptContent(prompts.gratitude) : null;
    const encryptedWillApply = prompts.willApply ? await encryptContent(prompts.willApply) : null;

    const { data: updatedRows, error: updateError } = await supabase
      .from('meeting_reflections')
      .update({
        post_key_takeaway: encryptedKeyTakeaway,
        post_mood: encryptedMood,
        post_gratitude: encryptedGratitude,
        post_will_apply: encryptedWillApply,
        updated_at: now,
      })
      .eq('checkin_id', checkinId)
      .eq('user_id', userId)
      .select('id');

    if (updateError) {
      logger.warn('Meeting reflection: Post-meeting save failed', { error: updateError });
      return { success: false, error: updateError.message };
    }

    if (!updatedRows || updatedRows.length === 0) {
      const { error: insertError } = await supabase.from('meeting_reflections').insert({
        user_id: userId,
        checkin_id: checkinId,
        post_key_takeaway: encryptedKeyTakeaway,
        post_mood: encryptedMood,
        post_gratitude: encryptedGratitude,
        post_will_apply: encryptedWillApply,
        created_at: now,
        updated_at: now,
      });

      if (insertError) {
        logger.warn('Meeting reflection: Post-meeting insert fallback failed', {
          error: insertError,
        });
        return { success: false, error: insertError.message };
      }
    }

    logger.info('Meeting reflection: Post-meeting saved', { userId, checkinId });
    return { success: true };
  } catch (error) {
    logger.warn('Meeting reflection: Post-meeting error', { error });
    return { success: false, error: 'Unexpected error' };
  }
}

// ========================================
// Query Functions
// ========================================

/**
 * Get reflection for a check-in
 */
export async function getReflectionForCheckin(
  userId: string,
  checkinId: string,
): Promise<MeetingReflection | null> {
  try {
    const { data, error } = await supabase
      .from('meeting_reflections')
      .select('*')
      .eq('user_id', userId)
      .eq('checkin_id', checkinId)
      .single();

    if (error) {
      logger.warn('Meeting reflection: Query failed', { error });
      return null;
    }

    return data ? await decryptReflection(data as Record<string, unknown>) : null;
  } catch (error) {
    logger.warn('Meeting reflection: Query error', { error });
    return null;
  }
}

/**
 * Get all reflections for user
 */
export async function getAllReflections(userId: string): Promise<MeetingReflection[]> {
  try {
    const { data, error } = await supabase
      .from('meeting_reflections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.warn('Meeting reflection: Get all failed', { error });
      return [];
    }

    return Promise.all(
      (data || []).map((item) => decryptReflection(item as Record<string, unknown>)),
    );
  } catch (error) {
    logger.warn('Meeting reflection: Get all error', { error });
    return [];
  }
}

/**
 * Check if reflection exists for check-in
 */
export async function hasReflection(userId: string, checkinId: string): Promise<boolean> {
  const reflection = await getReflectionForCheckin(userId, checkinId);
  return reflection !== null;
}

/**
 * Calculate mood lift from pre to post
 */
export function calculateMoodLift(reflection: MeetingReflection): number | null {
  if (reflection.pre_mood && reflection.post_mood) {
    return reflection.post_mood - reflection.pre_mood;
  }
  return null;
}

// ========================================
// Prompts & Suggestions
// ========================================

/**
 * Pre-meeting intention prompts (random)
 */
const PRE_INTENTION_PROMPTS = [
  'What do you hope to get from this meeting?',
  "What's on your mind as you arrive?",
  'What intention are you setting for this meeting?',
  'What would make this meeting valuable for you?',
];

/**
 * Post-meeting takeaway prompts (random)
 */
const POST_TAKEAWAY_PROMPTS = [
  "What's one thing you'll remember from today?",
  'What resonated most with you?',
  'What was your biggest takeaway?',
  'What spoke to you today?',
];

/**
 * Get random pre-meeting prompt
 */
export function getRandomPrePrompt(): string {
  return PRE_INTENTION_PROMPTS[Math.floor(Math.random() * PRE_INTENTION_PROMPTS.length)];
}

/**
 * Get random post-meeting prompt
 */
export function getRandomPostPrompt(): string {
  return POST_TAKEAWAY_PROMPTS[Math.floor(Math.random() * POST_TAKEAWAY_PROMPTS.length)];
}
