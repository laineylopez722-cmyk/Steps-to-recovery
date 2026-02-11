/**
 * Meeting Check-In Service
 * Handles check-ins, streak calculation, and achievement unlocking
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { encryptContent, decryptContent } from '../utils/encryption';

/**
 * Safely decrypt a value, returning as-is if not encrypted (migration support)
 */
async function safeDecrypt(value: string | null | undefined): Promise<string | undefined> {
  if (!value) return undefined;
  try {
    return await decryptContent(value);
  } catch {
    return value;
  }
}

export interface MeetingCheckIn {
  id: string;
  userId: string;
  meetingId?: string;
  meetingName: string;
  meetingAddress?: string;
  checkInType: 'geofence' | 'manual' | 'qr';
  latitude?: number;
  longitude?: number;
  notes?: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  achievementKey: string;
  unlockedAt: string;
}

export interface MeetingStats {
  totalMeetings: number;
  currentStreak: number;
  longestStreak: number;
}

export interface NinetyInNinetyProgress {
  daysCompleted: number;
  daysRemaining: number;
  isComplete: boolean;
  startDate: string | null;
  targetDate: string | null;
  daysElapsed: number;
}

/**
 * Check in to a meeting
 */
export async function checkInToMeeting(
  userId: string,
  meetingData: Omit<MeetingCheckIn, 'id' | 'userId' | 'createdAt'>,
): Promise<{ checkIn: MeetingCheckIn; newAchievements: string[] } | null> {
  try {
    // Encrypt notes before storage
    let encryptedNotes: string | undefined = undefined;
    if (meetingData.notes && meetingData.notes.trim()) {
      encryptedNotes = await encryptContent(meetingData.notes.trim());
    }

    // Insert check-in
    const { data: checkInData, error: checkInError } = await supabase
      .from('meeting_checkins')
      .insert({
        user_id: userId,
        meeting_id: meetingData.meetingId,
        meeting_name: meetingData.meetingName,
        meeting_address: meetingData.meetingAddress,
        check_in_type: meetingData.checkInType,
        latitude: meetingData.latitude,
        longitude: meetingData.longitude,
        notes: encryptedNotes,
      })
      .select()
      .single();

    if (checkInError) {
      logger.warn('Error checking in:', checkInError);
      return null;
    }

    // Get newly unlocked achievements (from trigger)
    const { data: recentAchievements } = await supabase
      .from('achievements')
      .select('achievement_key')
      .eq('user_id', userId)
      .gte('unlocked_at', checkInData.created_at)
      .order('unlocked_at', { ascending: false });

    const newAchievements = recentAchievements?.map((a) => a.achievement_key) || [];

    return {
      checkIn: {
        id: checkInData.id,
        userId: checkInData.user_id,
        meetingId: checkInData.meeting_id,
        meetingName: checkInData.meeting_name,
        meetingAddress: checkInData.meeting_address,
        checkInType: checkInData.check_in_type as 'geofence' | 'manual' | 'qr',
        latitude: checkInData.latitude,
        longitude: checkInData.longitude,
        notes: await safeDecrypt(checkInData.notes),
        createdAt: checkInData.created_at,
      },
      newAchievements,
    };
  } catch (error) {
    logger.warn('Error in checkInToMeeting:', error);
    return null;
  }
}

/**
 * Get user's meeting check-ins
 */
export async function getMeetingCheckIns(
  userId: string,
  limit?: number,
): Promise<MeetingCheckIn[]> {
  try {
    let query = supabase
      .from('meeting_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.warn('Error fetching check-ins:', error);
      return [];
    }

    // Decrypt notes for each check-in
    const checkIns = await Promise.all(
      (data || []).map(async (item) => ({
        id: item.id,
        userId: item.user_id,
        meetingId: item.meeting_id,
        meetingName: item.meeting_name,
        meetingAddress: item.meeting_address,
        checkInType: item.check_in_type as 'geofence' | 'manual' | 'qr',
        latitude: item.latitude,
        longitude: item.longitude,
        notes: await safeDecrypt(item.notes),
        createdAt: item.created_at,
      })),
    );

    return checkIns;
  } catch (error) {
    logger.warn('Error in getMeetingCheckIns:', error);
    return [];
  }
}

/**
 * Calculate user's current meeting streak
 */
export async function calculateStreak(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_user_meeting_streak', {
      user_uuid: userId,
    });

    if (error) {
      logger.warn('Error calculating streak:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    logger.warn('Error in calculateStreak:', error);
    return 0;
  }
}

/**
 * Calculate total meetings attended
 */
export async function calculateTotal(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_user_total_meetings', {
      user_uuid: userId,
    });

    if (error) {
      logger.warn('Error calculating total:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    logger.warn('Error in calculateTotal:', error);
    return 0;
  }
}

/**
 * Get 90-in-90 challenge progress
 */
export async function check90In90Progress(userId: string): Promise<NinetyInNinetyProgress> {
  try {
    const { data, error } = await supabase.rpc('get_90_in_90_progress', {
      user_uuid: userId,
    });

    if (error) {
      logger.warn('Error getting 90-in-90 progress:', error);
      return {
        daysCompleted: 0,
        daysRemaining: 90,
        isComplete: false,
        startDate: null,
        targetDate: null,
        daysElapsed: 0,
      };
    }

    return {
      daysCompleted: data.daysCompleted || 0,
      daysRemaining: data.daysRemaining || 90,
      isComplete: data.isComplete || false,
      startDate: data.startDate || null,
      targetDate: data.targetDate || null,
      daysElapsed: data.daysElapsed || 0,
    };
  } catch (error) {
    logger.warn('Error in check90In90Progress:', error);
    return {
      daysCompleted: 0,
      daysRemaining: 90,
      isComplete: false,
      startDate: null,
      targetDate: null,
      daysElapsed: 0,
    };
  }
}

/**
 * Get user's unlocked achievements
 */
export async function getAchievements(userId: string): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) {
      logger.warn('Error fetching achievements:', error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      achievementKey: item.achievement_key,
      unlockedAt: item.unlocked_at,
    }));
  } catch (error) {
    logger.warn('Error in getAchievements:', error);
    return [];
  }
}

/**
 * Get meeting stats for a user
 */
export async function getMeetingStats(userId: string): Promise<MeetingStats> {
  try {
    const [totalMeetings, currentStreak] = await Promise.all([
      calculateTotal(userId),
      calculateStreak(userId),
    ]);

    // Calculate longest streak from check-ins
    const checkIns = await getMeetingCheckIns(userId);
    const longestStreak = calculateLongestStreakFromCheckIns(checkIns);

    return {
      totalMeetings,
      currentStreak,
      longestStreak,
    };
  } catch (error) {
    logger.warn('Error in getMeetingStats:', error);
    return {
      totalMeetings: 0,
      currentStreak: 0,
      longestStreak: 0,
    };
  }
}

/**
 * Calculate longest streak from check-in history
 */
function calculateLongestStreakFromCheckIns(checkIns: MeetingCheckIn[]): number {
  if (checkIns.length === 0) return 0;

  // Get unique dates and sort
  const uniqueDates = Array.from(new Set(checkIns.map((c) => c.createdAt.split('T')[0]))).sort();

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currDate = new Date(uniqueDates[i]);
    const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * Check if user has already checked in today
 */
export async function hasCheckedInToday(userId: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('meeting_checkins')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .limit(1);

    if (error) {
      logger.warn("Error checking today's check-in:", error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    logger.warn('Error in hasCheckedInToday:', error);
    return false;
  }
}

/**
 * Check if user has already checked into a specific meeting today
 */
export async function hasCheckedInToMeetingToday(
  userId: string,
  meetingId: string,
): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('meeting_checkins')
      .select('id')
      .eq('user_id', userId)
      .eq('meeting_id', meetingId)
      .gte('created_at', `${today}T00:00:00`)
      .limit(1);

    if (error) {
      logger.warn('Error checking meeting check-in:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    logger.warn('Error in hasCheckedInToMeetingToday:', error);
    return false;
  }
}

/**
 * Delete a meeting check-in
 */
export async function deleteMeetingCheckIn(
  userId: string,
  checkInId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('meeting_checkins')
      .delete()
      .eq('id', checkInId)
      .eq('user_id', userId);

    if (error) {
      logger.warn('Error deleting check-in:', error);
      return false;
    }

    logger.info('Meeting check-in deleted', { checkInId });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Error in deleteMeetingCheckIn:', { message });
    return false;
  }
}

