/**
 * Smart Notification Scheduler
 *
 * Analyses the user's historical check-in times to schedule nudges
 * at the moment they're most likely to be receptive — not at a fixed time.
 *
 * Privacy: All analysis is local. No data leaves the device.
 *
 * Scheduling strategy:
 * - Morning nudge: If user hasn't done morning check-in by their typical time + 45 min
 * - Evening nudge: If user hasn't done evening check-in by their typical time + 45 min
 * - High-risk window: If the last 3 days show rising craving, schedule a midday check-in
 *
 * Falls back to sensible defaults if insufficient data (<7 check-ins):
 * - Morning default: 8:30 AM
 * - Evening default: 8:00 PM
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { decryptContent } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import type { StorageAdapter } from '../../../adapters/storage/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SmartScheduleResult {
  morningHour: number;
  morningMinute: number;
  eveningHour: number;
  eveningMinute: number;
  /** Optional midday nudge during high-risk windows */
  middayNudge: boolean;
  dataPoints: number;
  source: 'learned' | 'default';
}

interface CheckInRow {
  check_in_type: string;
  created_at: string;
  encrypted_craving: string | null;
}

const IDENTIFIER_MORNING = 'smart_morning_checkin';
const IDENTIFIER_EVENING = 'smart_evening_checkin';
const IDENTIFIER_MIDDAY = 'smart_midday_support';

// ─────────────────────────────────────────────────────────────────────────────
// Analysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute optimal notification schedule from historical check-ins.
 */
export async function computeOptimalSchedule(
  db: StorageAdapter,
  userId: string,
): Promise<SmartScheduleResult> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60); // last 60 days

    const rows = await db.getAllAsync<CheckInRow>(
      `SELECT check_in_type, created_at, encrypted_craving
       FROM daily_checkins
       WHERE user_id = ? AND created_at >= ?
       ORDER BY created_at DESC`,
      [userId, cutoff.toISOString()],
    );

    const morningHours: number[] = [];
    const eveningHours: number[] = [];
    const recentCravings: number[] = [];
    const now = Date.now();

    for (const row of rows) {
      const date = new Date(row.created_at);
      const hour = date.getHours();
      const minute = date.getMinutes();
      const minuteOfDay = hour * 60 + minute;

      if (row.check_in_type === 'morning') {
        morningHours.push(minuteOfDay);
      } else if (row.check_in_type === 'evening') {
        eveningHours.push(minuteOfDay);

        // Collect recent craving values for risk window detection
        const ageMs = now - date.getTime();
        if (ageMs < 3 * 24 * 3600 * 1000 && row.encrypted_craving) {
          try {
            const val = parseFloat(await decryptContent(row.encrypted_craving));
            if (!isNaN(val)) recentCravings.push(val);
          } catch {
            // ignore decrypt failures
          }
        }
      }
    }

    const MIN_DATA = 7;
    const hasEnoughData = morningHours.length >= MIN_DATA || eveningHours.length >= MIN_DATA;

    if (!hasEnoughData) {
      return {
        morningHour: 8,
        morningMinute: 30,
        eveningHour: 20,
        eveningMinute: 0,
        middayNudge: false,
        dataPoints: rows.length,
        source: 'default',
      };
    }

    const avg = (nums: number[]): number =>
      nums.reduce((s, n) => s + n, 0) / nums.length;

    const morningAvg = morningHours.length >= MIN_DATA ? avg(morningHours) : 8 * 60 + 30;
    const eveningAvg = eveningHours.length >= MIN_DATA ? avg(eveningHours) : 20 * 60;

    // Add 45-minute buffer (nudge slightly after typical time)
    const morningTarget = Math.min(morningAvg + 45, 11 * 60); // cap at 11am
    const eveningTarget = Math.min(eveningAvg + 45, 22 * 60); // cap at 10pm

    // High-risk window: avg craving > 7 over last 3 evenings
    const avgRecentCraving =
      recentCravings.length > 0
        ? recentCravings.reduce((s, v) => s + v, 0) / recentCravings.length
        : 0;
    const middayNudge = avgRecentCraving >= 7;

    return {
      morningHour: Math.floor(morningTarget / 60),
      morningMinute: Math.round(morningTarget % 60),
      eveningHour: Math.floor(eveningTarget / 60),
      eveningMinute: Math.round(eveningTarget % 60),
      middayNudge,
      dataPoints: rows.length,
      source: 'learned',
    };
  } catch (error) {
    logger.error('Smart scheduler: analysis failed', error);
    return {
      morningHour: 8,
      morningMinute: 30,
      eveningHour: 20,
      eveningMinute: 0,
      middayNudge: false,
      dataPoints: 0,
      source: 'default',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Scheduling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cancel all previously scheduled smart reminders before rescheduling.
 */
async function cancelSmartReminders(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(IDENTIFIER_MORNING).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(IDENTIFIER_EVENING).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(IDENTIFIER_MIDDAY).catch(() => {});
}

/**
 * Schedule smart daily reminders based on the computed schedule.
 * Replaces any previously scheduled smart reminders.
 */
export async function scheduleSmartReminders(schedule: SmartScheduleResult): Promise<void> {
  if (Platform.OS === 'web') {
    logger.info('Smart scheduler: skipped on web');
    return;
  }

  try {
    await cancelSmartReminders();

    // Morning nudge
    await Notifications.scheduleNotificationAsync({
      identifier: IDENTIFIER_MORNING,
      content: {
        title: "Good morning — how are you feeling?",
        body: 'Take a moment to set your intention for the day.',
        data: { screen: 'MorningIntention' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: schedule.morningHour,
        minute: schedule.morningMinute,
      },
    });

    // Evening nudge
    await Notifications.scheduleNotificationAsync({
      identifier: IDENTIFIER_EVENING,
      content: {
        title: 'End of day reflection',
        body: "How did today go? A quick check-in keeps your streak alive.",
        data: { screen: 'EveningPulse' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: schedule.eveningHour,
        minute: schedule.eveningMinute,
      },
    });

    // Midday nudge during high-risk windows
    if (schedule.middayNudge) {
      await Notifications.scheduleNotificationAsync({
        identifier: IDENTIFIER_MIDDAY,
        content: {
          title: 'Midday check-in',
          body: "Cravings can peak in the afternoon. You've got tools — want to use one?",
          data: { screen: 'CopingRecommendations' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 13,
          minute: 0,
        },
      });
    }

    logger.info('Smart reminders scheduled', {
      morning: `${schedule.morningHour}:${String(schedule.morningMinute).padStart(2, '0')}`,
      evening: `${schedule.eveningHour}:${String(schedule.eveningMinute).padStart(2, '0')}`,
      middayNudge: schedule.middayNudge,
      source: schedule.source,
    });
  } catch (error) {
    logger.error('Smart scheduler: scheduling failed', error);
  }
}

/**
 * Remove all smart reminders (e.g., when user disables smart scheduling).
 */
export async function removeSmartReminders(): Promise<void> {
  try {
    await cancelSmartReminders();
    logger.info('Smart reminders removed');
  } catch (error) {
    logger.error('Smart scheduler: remove failed', error);
  }
}
