/**
 * Risk Pattern Detection Service
 *
 * Privacy-first detection of behavioral patterns that may indicate risk.
 * Queries user's own data via Supabase (protected by RLS policies).
 * Detection logic runs client-side; only aggregate pattern results are used locally.
 *
 * Patterns detected:
 * - Journal inactivity (3+ days)
 * - Check-in gaps (2+ days)
 * - Meeting absence (7+ days)
 * - JFT reflection gaps (5+ days)
 * - Sponsor contact gaps (7+ days, if sponsor connected)
 *
 * Philosophy: Proactive support, not surveillance.
 */

import { supabase } from '../lib/supabase';
import { encryptContent } from '../utils/encryption';
import { mmkvStorage } from '../lib/mmkv';
import { logger } from '../utils/logger';

// ========================================
// Type Definitions
// ========================================

export type RiskPatternType =
  | 'journal_inactive'
  | 'checkin_gap'
  | 'meeting_absent'
  | 'jft_gap'
  | 'sponsor_contact_gap';

export interface RiskPattern {
  type: RiskPatternType;
  severity: 'low' | 'medium' | 'high';
  daysSince: number;
  title: string;
  message: string;
  suggestedAction: string;
  actionRoute: string;
  actionParams?: Record<string, unknown>;
  icon: string;
  canNotifySponsor: boolean;
}

export interface RiskDetectionResult {
  hasRisks: boolean;
  patterns: RiskPattern[];
  lastChecked: number;
}

// ========================================
// Configuration
// ========================================

const THRESHOLDS = {
  journal: 3, // days
  checkin: 2, // days
  meeting: 7, // days
  jft: 5, // days
  sponsor: 7, // days
} as const;

const _SEVERITY_MAPPING: Record<number, 'low' | 'medium' | 'high'> = {
  1: 'low',
  2: 'low',
  3: 'medium',
  5: 'medium',
  7: 'high',
  10: 'high',
};

// ========================================
// Core Detection Logic
// ========================================

/**
 * Calculate days since last activity
 */
function daysSince(lastActivityDate: string | null): number {
  if (!lastActivityDate) return 999; // No activity ever

  const now = new Date();
  const last = new Date(lastActivityDate);
  const diffMs = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get severity level based on days
 */
function getSeverity(days: number): 'low' | 'medium' | 'high' {
  if (days >= 10) return 'high';
  if (days >= 5) return 'medium';
  return 'low';
}

/**
 * Check journal activity
 */
async function checkJournalActivity(userId: string): Promise<RiskPattern | null> {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Risk detection: journal check failed', { error });
      return null;
    }

    const days = daysSince(data?.created_at || null);

    if (days < THRESHOLDS.journal) return null;

    return {
      type: 'journal_inactive',
      severity: getSeverity(days),
      daysSince: days,
      title: 'Journal Inactivity',
      message: `You haven't journaled in ${days} days.`,
      suggestedAction: 'Write a quick journal entry',
      actionRoute: 'Journal',
      actionParams: { screen: 'JournalEditor', params: { mode: 'create' } },
      icon: 'book-open-variant',
      canNotifySponsor: days >= 5,
    };
  } catch (error) {
    logger.error('Risk detection: journal check error', { error });
    return null;
  }
}

/**
 * Check daily check-in activity
 */
async function checkCheckInActivity(userId: string): Promise<RiskPattern | null> {
  try {
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('checkin_date')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Risk detection: check-in check failed', { error });
      return null;
    }

    const days = daysSince(data?.checkin_date || null);

    if (days < THRESHOLDS.checkin) return null;

    return {
      type: 'checkin_gap',
      severity: getSeverity(days),
      daysSince: days,
      title: 'Check-In Gap',
      message: `You haven't checked in for ${days} days.`,
      suggestedAction: 'Check in now',
      actionRoute: 'Home',
      actionParams: { screen: 'HomeMain' },
      icon: 'calendar-check',
      canNotifySponsor: days >= 3,
    };
  } catch (error) {
    logger.error('Risk detection: check-in check error', { error });
    return null;
  }
}

/**
 * Check meeting attendance
 */
async function checkMeetingAttendance(userId: string): Promise<RiskPattern | null> {
  try {
    const { data, error } = await supabase
      .from('meeting_checkins')
      .select('checked_in_at')
      .eq('user_id', userId)
      .order('checked_in_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Risk detection: meeting check failed', { error });
      return null;
    }

    const days = daysSince(data?.checked_in_at || null);

    if (days < THRESHOLDS.meeting) return null;

    return {
      type: 'meeting_absent',
      severity: getSeverity(days),
      daysSince: days,
      title: 'Meeting Absence',
      message: `You haven't attended a meeting in ${days} days.`,
      suggestedAction: 'Find a meeting',
      actionRoute: 'Meetings',
      actionParams: { screen: 'MeetingFinder' },
      icon: 'account-group',
      canNotifySponsor: days >= 7,
    };
  } catch (error) {
    logger.error('Risk detection: meeting check error', { error });
    return null;
  }
}

/**
 * Check JFT reflection activity
 */
async function checkJFTReflections(userId: string): Promise<RiskPattern | null> {
  try {
    const { data, error } = await supabase
      .from('reading_reflections')
      .select('reflected_at')
      .eq('user_id', userId)
      .order('reflected_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Risk detection: JFT check failed', { error });
      return null;
    }

    const days = daysSince(data?.reflected_at || null);

    if (days < THRESHOLDS.jft) return null;

    return {
      type: 'jft_gap',
      severity: getSeverity(days),
      daysSince: days,
      title: 'Reflection Gap',
      message: `You haven't reflected on JFT in ${days} days.`,
      suggestedAction: "Read today's JFT",
      actionRoute: 'Home',
      actionParams: { screen: 'DailyReading' },
      icon: 'book-open-page-variant',
      canNotifySponsor: days >= 7,
    };
  } catch (error) {
    logger.error('Risk detection: JFT check error', { error });
    return null;
  }
}

/**
 * Check sponsor contact (if sponsor connected)
 */
async function checkSponsorContact(userId: string): Promise<RiskPattern | null> {
  try {
    // First check if user has a sponsor
    const { data: sponsorData, error: sponsorError } = await supabase
      .from('sponsorships')
      .select('sponsor_id')
      .eq('sponsee_id', userId)
      .eq('status', 'accepted')
      .single();

    if (sponsorError || !sponsorData) {
      // No sponsor, skip this check
      return null;
    }

    // Check last shared entry from this user to their sponsor connection.
    // Current schema uses sponsor_shared_entries with direction + user_id fields.
    const { data, error } = await supabase
      .from('sponsor_shared_entries')
      .select('created_at')
      .eq('user_id', userId)
      .eq('direction', 'outgoing')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Risk detection: sponsor contact check failed', { error });
      return null;
    }

    const days = daysSince(data?.created_at || null);

    if (days < THRESHOLDS.sponsor) return null;

    return {
      type: 'sponsor_contact_gap',
      severity: getSeverity(days),
      daysSince: days,
      title: 'Sponsor Contact Gap',
      message: `You haven't shared with your sponsor in ${days} days.`,
      suggestedAction: 'Share an entry with sponsor',
      actionRoute: 'Profile',
      actionParams: { screen: 'Sponsor' },
      icon: 'account-supervisor',
      canNotifySponsor: false, // Don't notify sponsor about not contacting sponsor!
    };
  } catch (error) {
    logger.error('Risk detection: sponsor contact check error', { error });
    return null;
  }
}

// ========================================
// Main Detection Function
// ========================================

/**
 * Detect all risk patterns for a user
 * Runs entirely client-side with local database queries
 */
export async function detectRiskPatterns(userId: string): Promise<RiskDetectionResult> {
  try {
    logger.info('Risk detection: Starting analysis', { userId });

    // Run all checks in parallel
    const [journal, checkin, meeting, jft, sponsor] = await Promise.all([
      checkJournalActivity(userId),
      checkCheckInActivity(userId),
      checkMeetingAttendance(userId),
      checkJFTReflections(userId),
      checkSponsorContact(userId),
    ]);

    // Filter out null results
    const patterns: RiskPattern[] = [journal, checkin, meeting, jft, sponsor]
      .filter((p): p is RiskPattern => p !== null)
      .sort((a, b) => {
        // Sort by severity (high → medium → low), then by days
        const severityOrder = { high: 3, medium: 2, low: 1 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return b.daysSince - a.daysSince;
      });

    const result: RiskDetectionResult = {
      hasRisks: patterns.length > 0,
      patterns,
      lastChecked: Date.now(),
    };

    logger.info('Risk detection: Analysis complete', {
      userId,
      patternCount: patterns.length,
      patterns: patterns.map((p) => p.type),
    });

    return result;
  } catch (error) {
    logger.error('Risk detection: Fatal error', { error, userId });

    // Return safe empty result on error
    return {
      hasRisks: false,
      patterns: [],
      lastChecked: Date.now(),
    };
  }
}

// ========================================
// Dismiss Pattern
// ========================================

/**
 * Mark a pattern as dismissed (store in MMKV)
 * User can dismiss alerts to avoid notification fatigue
 */
export async function dismissPattern(userId: string, patternType: RiskPatternType): Promise<void> {
  try {
    const key = `risk_dismissed_${userId}_${patternType}`;
    const value = Date.now().toString();

    // MMKV is acceptable here: dismissed timestamps are non-sensitive UI preference
    // data (no PII, no recovery content). SecureStore is reserved for encryption keys/tokens.
    mmkvStorage.setItem(key, value);

    logger.info('Risk detection: Pattern dismissed', { userId, patternType });
  } catch (error) {
    logger.error('Risk detection: Dismiss failed', { error, userId, patternType });
  }
}

/**
 * Check if pattern was recently dismissed
 * Don't show again for 24 hours after dismissal
 */
export async function wasRecentlyDismissed(
  userId: string,
  patternType: RiskPatternType,
): Promise<boolean> {
  try {
    const key = `risk_dismissed_${userId}_${patternType}`;
    const dismissed = mmkvStorage.getItem(key);

    if (!dismissed) return false;

    const dismissedAt = parseInt(dismissed, 10);
    const now = Date.now();
    const hoursSince = (now - dismissedAt) / (1000 * 60 * 60);

    return hoursSince < 24; // Show again after 24 hours
  } catch (error) {
    logger.error('Risk detection: Dismissed check failed', { error });
    return false;
  }
}

// ========================================
// Sponsor Notification
// ========================================

/**
 * Notify sponsor about risk pattern (with user permission)
 * Sends encrypted alert via existing sponsor connection
 */
export async function notifySponsor(
  userId: string,
  pattern: RiskPattern,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get sponsor connection
    const { data: sponsorship, error: sponsorError } = await supabase
      .from('sponsorships')
      .select('sponsor_id, sponsee_id')
      .eq('sponsee_id', userId)
      .eq('status', 'accepted')
      .single();

    if (sponsorError || !sponsorship) {
      return { success: false, error: 'No active sponsor connection' };
    }

    // Create notification entry (encrypt sensitive message content)
    const message = `📊 Recovery Check-In Alert\n\n${pattern.message}\n\nYour sponsee might benefit from a check-in.`;
    const encryptedMessage = await encryptContent(message);

    const { error: notifError } = await supabase.from('sponsor_notifications').insert({
      sponsor_id: sponsorship.sponsor_id,
      sponsee_id: userId,
      notification_type: 'risk_alert',
      message: encryptedMessage,
      severity: pattern.severity,
      created_at: new Date().toISOString(),
    });

    if (notifError) {
      logger.error('Risk detection: Sponsor notification failed', { error: notifError });
      return { success: false, error: 'Failed to send notification' };
    }

    logger.info('Risk detection: Sponsor notified', { userId, patternType: pattern.type });
    return { success: true };
  } catch (error) {
    logger.error('Risk detection: Sponsor notification error', { error });
    return { success: false, error: 'Unexpected error' };
  }
}
