/**
 * Meeting Helper Utilities
 *
 * Provides common patterns and utilities for meeting data operations,
 * including encryption/decryption, data transformation, and calculations.
 */

import { decryptContent, encryptContent } from '../encryption';
import type { DbMeetingLog, MeetingLog, MeetingType, MeetingConnectionMode } from '../types';

/**
 * Encrypt sensitive fields in meeting data
 */
export async function encryptMeetingFields(data: {
  keyTakeaways: string;
  whatILearned?: string;
  quoteHeard?: string;
  connectionNotes?: string;
  shareReflection?: string;
}): Promise<{
  encryptedTakeaways: string;
  encryptedWhatILearned: string | null;
  encryptedQuoteHeard: string | null;
  encryptedConnectionNotes: string | null;
  encryptedShareReflection: string | null;
}> {
  const [
    encryptedTakeaways,
    encryptedWhatILearned,
    encryptedQuoteHeard,
    encryptedConnectionNotes,
    encryptedShareReflection,
  ] = await Promise.all([
    encryptContent(data.keyTakeaways),
    data.whatILearned ? encryptContent(data.whatILearned) : Promise.resolve(null),
    data.quoteHeard ? encryptContent(data.quoteHeard) : Promise.resolve(null),
    data.connectionNotes ? encryptContent(data.connectionNotes) : Promise.resolve(null),
    data.shareReflection ? encryptContent(data.shareReflection) : Promise.resolve(null),
  ]);

  return {
    encryptedTakeaways,
    encryptedWhatILearned,
    encryptedQuoteHeard,
    encryptedConnectionNotes,
    encryptedShareReflection,
  };
}

/**
 * Decrypt sensitive fields in database meeting row
 */
export async function decryptMeetingFields(row: DbMeetingLog): Promise<{
  keyTakeaways: string;
  whatILearned?: string;
  quoteHeard?: string;
  connectionNotes?: string;
  shareReflection?: string;
}> {
  const [keyTakeaways, whatILearned, quoteHeard, connectionNotes, shareReflection] =
    await Promise.all([
      decryptContent(row.key_takeaways),
      row.what_i_learned ? decryptContent(row.what_i_learned) : Promise.resolve(undefined),
      row.quote_heard ? decryptContent(row.quote_heard) : Promise.resolve(undefined),
      row.connection_notes ? decryptContent(row.connection_notes) : Promise.resolve(undefined),
      row.share_reflection ? decryptContent(row.share_reflection) : Promise.resolve(undefined),
    ]);

  return {
    keyTakeaways,
    whatILearned,
    quoteHeard,
    connectionNotes,
    shareReflection,
  };
}

/**
 * Convert database row to MeetingLog object
 */
export async function dbRowToMeetingLog(row: DbMeetingLog): Promise<MeetingLog> {
  const decryptedFields = await decryptMeetingFields(row);

  return {
    id: row.id,
    name: row.name || undefined,
    location: row.location || undefined,
    type: row.type as MeetingType,
    moodBefore: row.mood_before,
    moodAfter: row.mood_after,
    keyTakeaways: decryptedFields.keyTakeaways,
    topicTags: row.topic_tags ? JSON.parse(row.topic_tags) : [],
    attendedAt: new Date(row.attended_at),
    createdAt: new Date(row.created_at),
    // Enhanced fields
    whatILearned: decryptedFields.whatILearned,
    quoteHeard: decryptedFields.quoteHeard,
    connectionsMode: row.connections_mode ? JSON.parse(row.connections_mode) : undefined,
    connectionNotes: decryptedFields.connectionNotes,
    didShare: row.did_share === 1,
    shareReflection: decryptedFields.shareReflection,
    regularMeetingId: row.regular_meeting_id || undefined,
  };
}

/**
 * Calculate mood improvement
 */
export function calculateMoodImprovement(moodBefore: number, moodAfter: number): number {
  return moodAfter - moodBefore;
}

/**
 * Check if meeting has significant mood improvement
 */
export function hasSignificantMoodImprovement(moodBefore: number, moodAfter: number): boolean {
  return calculateMoodImprovement(moodBefore, moodAfter) > 0;
}

/**
 * Get meeting duration estimate based on type and content length
 */
export function estimateMeetingDuration(meeting: MeetingLog): number {
  // Base duration by type (minutes)
  const baseDuration: Record<MeetingType, number> = {
    'in-person': 60,
    online: 60,
  };

  let duration = baseDuration[meeting.type];

  // Add time for sharing
  if (meeting.didShare) {
    duration += 5; // Extra time for sharing
  }

  // Add time based on content length (rough estimate)
  const contentLength =
    meeting.keyTakeaways.length +
    (meeting.whatILearned?.length || 0) +
    (meeting.quoteHeard?.length || 0) +
    (meeting.connectionNotes?.length || 0) +
    (meeting.shareReflection?.length || 0);

  if (contentLength > 1000) {
    duration += 10;
  } else if (contentLength > 500) {
    duration += 5;
  }

  return duration;
}

/**
 * Get connection quality score based on connection modes and notes
 */
export function calculateConnectionQuality(meeting: MeetingLog): number {
  let score = 0;

  // Base score from connection modes
  if (meeting.connectionsMode) {
    score += meeting.connectionsMode.length * 20; // 20 points per connection type
  }

  // Bonus for detailed notes
  if (meeting.connectionNotes && meeting.connectionNotes.length > 50) {
    score += 20;
  }

  // Bonus for sharing
  if (meeting.didShare) {
    score += 30;
  }

  return Math.min(score, 100); // Cap at 100
}

/**
 * Get meeting engagement score
 */
export function calculateEngagementScore(meeting: MeetingLog): number {
  let score = 0;

  // Mood improvement (0-30 points)
  const moodImprovement = calculateMoodImprovement(meeting.moodBefore, meeting.moodAfter);
  if (moodImprovement > 0) {
    score += Math.min(moodImprovement * 10, 30);
  }

  // Content quality (0-30 points)
  const contentLength =
    meeting.keyTakeaways.length +
    (meeting.whatILearned?.length || 0) +
    (meeting.quoteHeard?.length || 0);
  if (contentLength > 200) {
    score += 30;
  } else if (contentLength > 100) {
    score += 20;
  } else if (contentLength > 50) {
    score += 10;
  }

  // Topic tags (0-20 points)
  score += Math.min(meeting.topicTags.length * 5, 20);

  // Sharing and connections (0-20 points)
  if (meeting.didShare) score += 10;
  if (meeting.connectionsMode && meeting.connectionsMode.length > 0) score += 10;

  return Math.min(score, 100);
}

/**
 * Filter meetings by date range
 */
export function filterMeetingsByDate(
  meetings: MeetingLog[],
  startDate?: Date,
  endDate?: Date,
): MeetingLog[] {
  return meetings.filter((meeting) => {
    const meetingDate = meeting.attendedAt;
    if (startDate && meetingDate < startDate) return false;
    if (endDate && meetingDate > endDate) return false;
    return true;
  });
}

/**
 * Filter meetings by mood range
 */
export function filterMeetingsByMood(
  meetings: MeetingLog[],
  minMood?: number,
  maxMood?: number,
): MeetingLog[] {
  return meetings.filter((meeting) => {
    if (minMood !== undefined && meeting.moodAfter < minMood) return false;
    if (maxMood !== undefined && meeting.moodAfter > maxMood) return false;
    return true;
  });
}

/**
 * Search meetings by text content
 */
export function searchMeetings(meetings: MeetingLog[], query: string): MeetingLog[] {
  const lowercaseQuery = query.toLowerCase();

  return meetings.filter((meeting) => {
    const searchableText = [
      meeting.name,
      meeting.location,
      meeting.keyTakeaways,
      meeting.whatILearned,
      meeting.quoteHeard,
      meeting.connectionNotes,
      meeting.shareReflection,
      ...meeting.topicTags,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(lowercaseQuery);
  });
}
