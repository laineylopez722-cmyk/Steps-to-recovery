/**
 * Safe Dial Service
 * 
 * Core service for managing risky contacts and intervention logic.
 * Implements "Ulysses Pact" pattern - users pre-commit to protective measures.
 * 
 * Security: All operations enforce user-scoped access via RLS policies.
 * Privacy: Contact data encrypted at rest, never leaves user control.
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

// ========================================
// Type Definitions
// ========================================

export type RelationshipType = 'dealer' | 'old_friend' | 'trigger_person' | 'other';

export type ActionTaken = 
  | 'called_sponsor' 
  | 'texted_sponsor' 
  | 'waited' 
  | 'dismissed' 
  | 'proceeded'
  | 'played_game';

export interface RiskyContact {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  relationshipType: RelationshipType;
  notes?: string;
  addedAt: string;
  isActive: boolean;
}

export interface CloseCall {
  id: string;
  userId: string;
  riskyContactId?: string;
  contactName: string;
  actionTaken: ActionTaken;
  notes?: string;
  createdAt: string;
}

export interface CloseCallStats {
  totalCloseCalls: number;
  timesResisted: number;
  timesProceeded: number;
  lastCloseCall: string | null;
  longestStreakDays: number;
}

export interface AddRiskyContactParams {
  userId: string;
  name: string;
  phoneNumber: string;
  relationshipType: RelationshipType;
  notes?: string;
}

export interface LogCloseCallParams {
  userId: string;
  contactName: string;
  actionTaken: ActionTaken;
  riskyContactId?: string;
  notes?: string;
}

// ========================================
// Database Mapping Helpers
// ========================================

function mapToRiskyContact(row: any): RiskyContact {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phoneNumber: row.phone_number,
    relationshipType: row.relationship_type,
    notes: row.notes,
    addedAt: row.added_at,
    isActive: row.is_active,
  };
}

function mapToCloseCall(row: any): CloseCall {
  return {
    id: row.id,
    userId: row.user_id,
    riskyContactId: row.risky_contact_id,
    contactName: row.contact_name,
    actionTaken: row.action_taken,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// ========================================
// Phone Number Normalization
// ========================================

/**
 * Normalize phone number for comparison
 * Strips all non-digit characters for consistent matching
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

// ========================================
// Risky Contact Operations
// ========================================

/**
 * Add a new risky contact to the danger zone
 * @throws Error if contact already exists or database operation fails
 */
export async function addRiskyContact(params: AddRiskyContactParams): Promise<RiskyContact> {
  try {
    const normalizedPhone = normalizePhoneNumber(params.phoneNumber);
    
    const { data, error } = await supabase
      .from('risky_contacts')
      .insert({
        user_id: params.userId,
        name: params.name,
        phone_number: normalizedPhone,
        relationship_type: params.relationshipType,
        notes: params.notes,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('This contact is already in your danger zone');
      }
      throw error;
    }

    logger.info('Risky contact added', { contactId: data.id, relationshipType: params.relationshipType });
    return mapToRiskyContact(data);
  } catch (error) {
    logger.error('Failed to add risky contact', error);
    throw error;
  }
}

/**
 * Get all active risky contacts for a user
 */
export async function getRiskyContacts(userId: string): Promise<RiskyContact[]> {
  try {
    const { data, error } = await supabase
      .from('risky_contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('added_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapToRiskyContact);
  } catch (error) {
    logger.error('Failed to fetch risky contacts', error);
    throw error;
  }
}

/**
 * Check if a phone number is in the user's danger zone
 * @returns The risky contact if found, null otherwise
 */
export async function isRiskyContact(
  userId: string, 
  phoneNumber: string
): Promise<RiskyContact | null> {
  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    const { data, error } = await supabase
      .from('risky_contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('phone_number', normalizedPhone)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;

    return data ? mapToRiskyContact(data) : null;
  } catch (error) {
    logger.error('Failed to check risky contact', error);
    throw error;
  }
}

/**
 * Update a risky contact
 */
export async function updateRiskyContact(
  contactId: string,
  updates: Partial<Pick<RiskyContact, 'name' | 'phoneNumber' | 'relationshipType' | 'notes' | 'isActive'>>
): Promise<RiskyContact> {
  try {
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phoneNumber !== undefined) dbUpdates.phone_number = normalizePhoneNumber(updates.phoneNumber);
    if (updates.relationshipType !== undefined) dbUpdates.relationship_type = updates.relationshipType;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('risky_contacts')
      .update(dbUpdates)
      .eq('id', contactId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Risky contact updated', { contactId });
    return mapToRiskyContact(data);
  } catch (error) {
    logger.error('Failed to update risky contact', error);
    throw error;
  }
}

/**
 * Delete a risky contact (soft delete by setting is_active = false)
 */
export async function deleteRiskyContact(contactId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('risky_contacts')
      .update({ is_active: false })
      .eq('id', contactId);

    if (error) throw error;

    logger.info('Risky contact deleted', { contactId });
  } catch (error) {
    logger.error('Failed to delete risky contact', error);
    throw error;
  }
}

/**
 * Permanently delete a risky contact (hard delete)
 * Use with caution - this cannot be undone
 */
export async function permanentlyDeleteRiskyContact(contactId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('risky_contacts')
      .delete()
      .eq('id', contactId);

    if (error) throw error;

    logger.info('Risky contact permanently deleted', { contactId });
  } catch (error) {
    logger.error('Failed to permanently delete risky contact', error);
    throw error;
  }
}

// ========================================
// Close Call Operations
// ========================================

/**
 * Log an intervention attempt (close call)
 */
export async function logCloseCall(params: LogCloseCallParams): Promise<CloseCall> {
  try {
    const { data, error } = await supabase
      .from('close_calls')
      .insert({
        user_id: params.userId,
        risky_contact_id: params.riskyContactId,
        contact_name: params.contactName,
        action_taken: params.actionTaken,
        notes: params.notes,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Close call logged', { 
      actionTaken: params.actionTaken, 
      contactName: params.contactName 
    });
    
    return mapToCloseCall(data);
  } catch (error) {
    logger.error('Failed to log close call', error);
    throw error;
  }
}

/**
 * Get close call history for a user
 */
export async function getCloseCallHistory(
  userId: string,
  limit: number = 50
): Promise<CloseCall[]> {
  try {
    const { data, error } = await supabase
      .from('close_calls')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(mapToCloseCall);
  } catch (error) {
    logger.error('Failed to fetch close call history', error);
    throw error;
  }
}

/**
 * Get aggregated statistics about close calls
 */
export async function getCloseCallStats(userId: string): Promise<CloseCallStats> {
  try {
    const { data, error } = await supabase
      .rpc('get_close_call_stats', { p_user_id: userId });

    if (error) throw error;

    const result = data[0];
    
    return {
      totalCloseCalls: parseInt(result.total_close_calls) || 0,
      timesResisted: parseInt(result.times_resisted) || 0,
      timesProceeded: parseInt(result.times_proceeded) || 0,
      lastCloseCall: result.last_close_call,
      longestStreakDays: result.longest_streak_days || 0,
    };
  } catch (error) {
    logger.error('Failed to fetch close call stats', error);
    throw error;
  }
}

// ========================================
// Batch Operations
// ========================================

/**
 * Add multiple risky contacts at once (e.g., from phone import)
 * Returns successful additions and failures separately
 */
export async function addMultipleRiskyContacts(
  contacts: AddRiskyContactParams[]
): Promise<{
  successful: RiskyContact[];
  failed: Array<{ contact: AddRiskyContactParams; error: string }>;
}> {
  const successful: RiskyContact[] = [];
  const failed: Array<{ contact: AddRiskyContactParams; error: string }> = [];

  for (const contact of contacts) {
    try {
      const added = await addRiskyContact(contact);
      successful.push(added);
    } catch (error) {
      failed.push({
        contact,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  logger.info('Batch risky contacts added', { 
    successful: successful.length, 
    failed: failed.length 
  });

  return { successful, failed };
}
