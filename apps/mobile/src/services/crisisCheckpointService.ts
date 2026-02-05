/**
 * Before You Use - Crisis Checkpoint System
 * 
 * Life-saving intervention flow when user is considering using.
 * Multi-stage checkpoint with sponsor quick-dial, journaling,
 * craving tracking, and delay tactics.
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

// ========================================
// Types
// ========================================

export interface CrisisCheckpoint {
  id: string;
  user_id: string;
  started_at: string;
  completed_at?: string;
  outcome: 'resisted' | 'used' | 'abandoned';
  
  // Stage 1: Initial acknowledgment
  craving_intensity: number; // 1-10
  trigger_description?: string;
  
  // Stage 2: Delay tactics
  waited_10_minutes: boolean;
  called_sponsor: boolean;
  texted_sponsor: boolean;
  
  // Stage 3: Reflection
  journal_entry?: string;
  emotions_identified?: string[];
  
  // Stage 4: Outcome
  final_craving_intensity?: number;
  hours_resisted?: number;
  
  created_at: string;
  updated_at: string;
}

export interface CrisisStats {
  total_checkpoints: number;
  times_resisted: number;
  times_used: number;
  resistance_rate: number;
  average_craving_intensity: number;
  most_common_triggers: string[];
}

// ========================================
// Crisis Checkpoint Management
// ========================================

/**
 * Start a new crisis checkpoint
 */
export async function startCrisisCheckpoint(
  userId: string,
  cravingIntensity: number
): Promise<{ success: boolean; checkpointId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('crisis_checkpoints')
      .insert({
        user_id: userId,
        started_at: new Date().toISOString(),
        craving_intensity: cravingIntensity,
        outcome: 'abandoned', // Default, updated later
        waited_10_minutes: false,
        called_sponsor: false,
        texted_sponsor: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Crisis checkpoint: Start failed', { error });
      return { success: false, error: error.message };
    }

    logger.info('Crisis checkpoint: Started', { userId, checkpointId: data.id });
    return { success: true, checkpointId: data.id };
  } catch (error) {
    logger.error('Crisis checkpoint: Start error', { error });
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Update crisis checkpoint with trigger description
 */
export async function updateTriggerDescription(
  checkpointId: string,
  userId: string,
  triggerDescription: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('crisis_checkpoints')
      .update({
        trigger_description: triggerDescription,
        updated_at: new Date().toISOString(),
      })
      .eq('id', checkpointId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Crisis checkpoint: Trigger update failed', { error });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('Crisis checkpoint: Trigger update error', { error });
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Mark that user waited 10 minutes
 */
export async function markWaitedTenMinutes(
  checkpointId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('crisis_checkpoints')
      .update({
        waited_10_minutes: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', checkpointId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Crisis checkpoint: Wait update failed', { error });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('Crisis checkpoint: Wait update error', { error });
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Mark sponsor contact action
 */
export async function markSponsorContact(
  checkpointId: string,
  userId: string,
  actionType: 'call' | 'text'
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData = actionType === 'call'
      ? { called_sponsor: true }
      : { texted_sponsor: true };

    const { error } = await supabase
      .from('crisis_checkpoints')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', checkpointId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Crisis checkpoint: Sponsor contact update failed', { error });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('Crisis checkpoint: Sponsor contact update error', { error });
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Save journal entry and emotions
 */
export async function saveReflection(
  checkpointId: string,
  userId: string,
  journalEntry: string,
  emotions: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('crisis_checkpoints')
      .update({
        journal_entry: journalEntry,
        emotions_identified: emotions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', checkpointId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Crisis checkpoint: Reflection save failed', { error });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('Crisis checkpoint: Reflection save error', { error });
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Complete crisis checkpoint with outcome
 */
export async function completeCrisisCheckpoint(
  checkpointId: string,
  userId: string,
  outcome: 'resisted' | 'used',
  finalCravingIntensity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const completedAt = new Date();
    const startedAt = await getCheckpointStartTime(checkpointId, userId);
    
    let hoursResisted = 0;
    if (startedAt) {
      hoursResisted = (completedAt.getTime() - new Date(startedAt).getTime()) / (1000 * 60 * 60);
    }

    const { error } = await supabase
      .from('crisis_checkpoints')
      .update({
        completed_at: completedAt.toISOString(),
        outcome,
        final_craving_intensity: finalCravingIntensity,
        hours_resisted: hoursResisted,
        updated_at: completedAt.toISOString(),
      })
      .eq('id', checkpointId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Crisis checkpoint: Complete failed', { error });
      return { success: false, error: error.message };
    }

    logger.info('Crisis checkpoint: Completed', { 
      userId, 
      checkpointId, 
      outcome,
      hoursResisted 
    });
    
    return { success: true };
  } catch (error) {
    logger.error('Crisis checkpoint: Complete error', { error });
    return { success: false, error: 'Unexpected error' };
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Get checkpoint start time
 */
async function getCheckpointStartTime(
  checkpointId: string,
  userId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('crisis_checkpoints')
      .select('started_at')
      .eq('id', checkpointId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return null;
    }

    return data.started_at;
  } catch (error) {
    return null;
  }
}

/**
 * Get active checkpoint for user
 */
export async function getActiveCheckpoint(
  userId: string
): Promise<CrisisCheckpoint | null> {
  try {
    const { data, error } = await supabase
      .from('crisis_checkpoints')
      .select('*')
      .eq('user_id', userId)
      .is('completed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return null;
    }

    return data as CrisisCheckpoint;
  } catch (error) {
    return null;
  }
}

/**
 * Get crisis statistics
 */
export async function getCrisisStats(
  userId: string
): Promise<CrisisStats> {
  try {
    const { data, error } = await supabase
      .from('crisis_checkpoints')
      .select('*')
      .eq('user_id', userId)
      .not('completed_at', 'is', null);

    if (error || !data) {
      return {
        total_checkpoints: 0,
        times_resisted: 0,
        times_used: 0,
        resistance_rate: 0,
        average_craving_intensity: 0,
        most_common_triggers: [],
      };
    }

    const checkpoints = data as CrisisCheckpoint[];
    const total = checkpoints.length;
    const resisted = checkpoints.filter(c => c.outcome === 'resisted').length;
    const used = checkpoints.filter(c => c.outcome === 'used').length;
    
    const avgIntensity = total > 0
      ? checkpoints.reduce((sum, c) => sum + c.craving_intensity, 0) / total
      : 0;

    // Get most common triggers
    const triggerCounts: Record<string, number> = {};
    checkpoints.forEach(c => {
      if (c.trigger_description) {
        triggerCounts[c.trigger_description] = (triggerCounts[c.trigger_description] || 0) + 1;
      }
    });
    
    const mostCommon = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([trigger]) => trigger);

    return {
      total_checkpoints: total,
      times_resisted: resisted,
      times_used: used,
      resistance_rate: total > 0 ? (resisted / total) * 100 : 0,
      average_craving_intensity: avgIntensity,
      most_common_triggers: mostCommon,
    };
  } catch (error) {
    logger.error('Crisis stats: Query error', { error });
    return {
      total_checkpoints: 0,
      times_resisted: 0,
      times_used: 0,
      resistance_rate: 0,
      average_craving_intensity: 0,
      most_common_triggers: [],
    };
  }
}

// ========================================
// Common Emotions List
// ========================================

export const COMMON_EMOTIONS = [
  'Angry',
  'Anxious',
  'Bored',
  'Depressed',
  'Frustrated',
  'Lonely',
  'Overwhelmed',
  'Sad',
  'Scared',
  'Stressed',
  'Tired',
  'Worried',
];
