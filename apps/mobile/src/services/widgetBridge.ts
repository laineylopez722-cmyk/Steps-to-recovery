/**
 * Widget Bridge Service
 *
 * Bridges app data to the native widget layer by storing serialized
 * widget snapshots in a shared container that native WidgetKit (iOS)
 * and AppWidgetProvider (Android) can read.
 *
 * On iOS  → App Group shared UserDefaults
 * On Android → SharedPreferences
 *
 * Until a native widget package is installed, data is persisted to
 * MMKV under a well-known key so the pipeline is exercised
 * end-to-end and ready to swap in the real bridge.
 *
 * No sensitive content is stored — only aggregated counts, booleans,
 * and a motivational quote.
 *
 * @module services/widgetBridge
 */

import { Platform } from 'react-native';
import { mmkvStorage } from '../lib/mmkv';
import type { WidgetData } from './widgetDataService';
import type { WidgetSize } from '../config/widgetConfig';
import { WIDGET_CONFIG } from '../config/widgetConfig';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Flattened payload written to the shared container. */
export interface WidgetBridgePayload {
  cleanDays: number;
  cleanHours: number;
  cleanMinutes: number;
  nextMilestone: number;
  daysToMilestone: number;
  morningCheckIn: boolean;
  eveningCheckIn: boolean;
  journalWritten: boolean;
  meetingAttended: boolean;
  gratitudeCompleted: boolean;
  checkInStreak: number;
  journalStreak: number;
  quoteText: string;
  quoteSource: string;
  lastUpdated: string;
}

/** Well-known key used across JS ↔ native boundary. */
const WIDGET_STORAGE_KEY = 'com.recovery.stepstorecovery.widget-data';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function flattenWidgetData(data: WidgetData): WidgetBridgePayload {
  return {
    cleanDays: data.cleanTime.days,
    cleanHours: data.cleanTime.hours,
    cleanMinutes: data.cleanTime.minutes,
    nextMilestone: data.cleanTime.nextMilestone,
    daysToMilestone: data.cleanTime.daysToMilestone,
    morningCheckIn: data.todayStatus.morningCheckIn,
    eveningCheckIn: data.todayStatus.eveningCheckIn,
    journalWritten: data.todayStatus.journalWritten,
    meetingAttended: data.todayStatus.meetingAttended,
    gratitudeCompleted: data.todayStatus.gratitudeCompleted,
    checkInStreak: data.streaks.checkIn,
    journalStreak: data.streaks.journal,
    quoteText: data.dailyQuote.text,
    quoteSource: data.dailyQuote.source,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Filter payload fields based on widget size configuration.
 */
export function payloadForSize(
  payload: WidgetBridgePayload,
  size: WidgetSize,
): Partial<WidgetBridgePayload> {
  const config = WIDGET_CONFIG[size];
  const result: Partial<WidgetBridgePayload> = {
    lastUpdated: payload.lastUpdated,
  };

  if (config.showCleanTime) {
    result.cleanDays = payload.cleanDays;
    result.cleanHours = payload.cleanHours;
    result.cleanMinutes = payload.cleanMinutes;
    result.nextMilestone = payload.nextMilestone;
    result.daysToMilestone = payload.daysToMilestone;
  }

  if (config.showDailyQuote) {
    result.quoteText = payload.quoteText;
    result.quoteSource = payload.quoteSource;
  }

  if (config.showTodayStatus) {
    result.morningCheckIn = payload.morningCheckIn;
    result.eveningCheckIn = payload.eveningCheckIn;
    result.journalWritten = payload.journalWritten;
    result.meetingAttended = payload.meetingAttended;
    result.gratitudeCompleted = payload.gratitudeCompleted;
  }

  if (config.showStreaks) {
    result.checkInStreak = payload.checkInStreak;
    result.journalStreak = payload.journalStreak;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Persist widget data to the shared container so native widgets can
 * read it on next timeline reload.
 *
 * Currently uses MMKV as a placeholder. When a native widget
 * package (e.g. `react-native-android-widget` or an Expo WidgetKit
 * plugin) is installed, replace the storage call with the package's
 * shared-container API.
 */
export async function updateWidgetData(data: WidgetData): Promise<void> {
  try {
    const payload = flattenWidgetData(data);
    const json = JSON.stringify(payload);

    // TODO: Replace with native shared-container write when widget
    // package is installed:
    //   iOS  → SharedGroupPreferences.setItem(key, payload, appGroup)
    //   Android → SharedPreferences via NativeModule
    mmkvStorage.setItem(WIDGET_STORAGE_KEY, json);

    logger.info('Widget data updated', {
      platform: Platform.OS,
      cleanDays: payload.cleanDays,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to update widget data', { error: message });
  }
}

/**
 * Request the OS to refresh all widget timelines.
 *
 * No-op until a native widget package is installed.
 */
export async function refreshWidgets(): Promise<void> {
  try {
    // TODO: Replace with real native calls when widget package is installed:
    //   iOS  → WidgetCenter.shared.reloadAllTimelines()
    //   Android → AppWidgetManager.notifyAppWidgetViewDataChanged()
    logger.debug('Widget refresh requested', { platform: Platform.OS });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to refresh widgets', { error: message });
  }
}

/**
 * Read the last widget payload from the shared container.
 * Useful for diagnostics and the widget settings preview.
 */
export async function readWidgetData(): Promise<WidgetBridgePayload | null> {
  try {
    const json = mmkvStorage.getItem(WIDGET_STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json) as WidgetBridgePayload;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to read widget data', { error: message });
    return null;
  }
}

/**
 * Clear persisted widget data (e.g. on logout).
 */
export async function clearWidgetData(): Promise<void> {
  try {
    mmkvStorage.removeItem(WIDGET_STORAGE_KEY);
    await refreshWidgets();
    logger.info('Widget data cleared');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to clear widget data', { error: message });
  }
}
