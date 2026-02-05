/**
 * Meeting Reflection Service
 * 
 * Manages pre-meeting intentions and post-meeting reflections.
 * Helps users maximize value from meeting attendance.
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

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
  prompts: PreMeetingPrompts
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('meeting_reflections')
      .insert({
        user_id: userId,
        checkin_id: checkinId,
        pre_intention: prompts.intention,
        pre_mood: prompts.mood,
        pre_hope: prompts.hope,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      logger.error('Meeting reflection: Pre-meeting save failed', { error });
      return { success: false, error: error.message };
    }

    logger.info('Meeting reflection: Pre-meeting saved', { userId, checkinId });
    return { success: true };
  } catch (error) {
    logger.error('Meeting reflection: Pre-meeting error', { error });
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
  prompts: PostMeetingPrompts
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('meeting_reflections')
      .update({
        post_key_takeaway: prompts.keyTakeaway,
        post_mood: prompts.mood,
        post_gratitude: prompts.gratitude,
        post_will_apply: prompts.willApply,
        updated_at: new Date().toISOString(),
      })
      .eq('checkin_id', checkinId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Meeting reflection: Post-meeting save failed', { error });
      return { success: false, error: error.message };
    }

    logger.info('Meeting reflection: Post-meeting saved', { userId, checkinId });
    return { success: true };
  } catch (error) {
    logger.error('Meeting reflection: Post-meeting error', { error });
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
  checkinId: string
): Promise<MeetingReflection | null> {
  try {
    const { data, error } = await supabase
      .from('meeting_reflections')
      .select('*')
      .eq('user_id', userId)
      .eq('checkin_id', checkinId)
      .single();

    if (error) {
      logger.error('Meeting reflection: Query failed', { error });
      return null;
    }

    return data as MeetingReflection;
  } catch (error) {
    logger.error('Meeting reflection: Query error', { error });
    return null;
  }
}

/**
 * Get all reflections for user
 */
export async function getAllReflections(
  userId: string
): Promise<MeetingReflection[]> {
  try {
    const { data, error } = await supabase
      .from('meeting_reflections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Meeting reflection: Get all failed', { error });
      return [];
    }

    return data as MeetingReflection[];
  } catch (error) {
    logger.error('Meeting reflection: Get all error', { error });
    return [];
  }
}

/**
 * Check if reflection exists for check-in
 */
export async function hasReflection(
  userId: string,
  checkinId: string
): Promise<boolean> {
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
  "What do you hope to get from this meeting?",
  "What's on your mind as you arrive?",
  "What intention are you setting for this meeting?",
  "What would make this meeting valuable for you?",
];

/**
 * Post-meeting takeaway prompts (random)
 */
const POST_TAKEAWAY_PROMPTS = [
  "What's one thing you'll remember from today?",
  "What resonated most with you?",
  "What was your biggest takeaway?",
  "What spoke to you today?",
];

/**
 * Get random pre-meeting prompt
 */
export function getRandomPrePrompt(): string {
  return PRE_INTENTION_PROMPTS[
    Math.floor(Math.random() * PRE_INTENTION_PROMPTS.length)
  ];
}

/**
 * Get random post-meeting prompt
 */
export function getRandomPostPrompt(): string {
  return POST_TAKEAWAY_PROMPTS[
    Math.floor(Math.random() * POST_TAKEAWAY_PROMPTS.length)
  ];
}
