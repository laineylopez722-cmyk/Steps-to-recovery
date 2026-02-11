/**
 * useWidgetSync Hook
 *
 * Keeps the native home-screen widget in sync with in-app state.
 * Listens for clean-time changes, check-in completions, and
 * milestone achievements; pushes a fresh snapshot to the shared
 * container whenever relevant data changes or the app returns to
 * the foreground.
 *
 * @module hooks/useWidgetSync
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useWidgetData } from './useWidgetData';
import { useAuth } from '../contexts/AuthContext';
import { useAppState } from './useAppState';
import { updateWidgetData, refreshWidgets } from '../services/widgetBridge';
import type { WidgetData } from '../services/widgetDataService';
import { logger } from '../utils/logger';

export interface WidgetSyncState {
  /** ISO-8601 timestamp of the last successful sync to widget storage */
  lastSyncTime: string | null;
  /** Whether a sync is currently in progress */
  isSyncing: boolean;
  /** Manually trigger a widget sync */
  syncWidget: () => Promise<void>;
}

/**
 * Syncs app data to the home-screen widget whenever key data
 * changes or the app returns to the foreground.
 */
export function useWidgetSync(): WidgetSyncState {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { data: widgetData } = useWidgetData(userId);

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Track previous snapshot to avoid redundant writes
  const prevSnapshotRef = useRef<string | null>(null);

  /**
   * Push current widget data to the shared container if it has
   * changed since the last push.
   */
  const syncWidget = useCallback(async (): Promise<void> => {
    if (!widgetData || !userId) return;

    const snapshot = buildSnapshotKey(widgetData);
    if (snapshot === prevSnapshotRef.current) {
      logger.debug('Widget sync skipped — data unchanged');
      return;
    }

    setIsSyncing(true);
    try {
      await updateWidgetData(widgetData);
      await refreshWidgets();

      const now = new Date().toISOString();
      prevSnapshotRef.current = snapshot;
      setLastSyncTime(now);
      logger.info('Widget synced successfully', { syncTime: now });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Widget sync failed', { error: message });
    } finally {
      setIsSyncing(false);
    }
  }, [widgetData, userId]);

  // Sync whenever widget data changes
  useEffect(() => {
    if (widgetData && userId) {
      syncWidget().catch(() => {
        // Error already logged inside syncWidget
      });
    }
    // syncWidget intentionally excluded — it changes when widgetData
    // changes, which would cause a redundant trigger. The snapshot check
    // inside syncWidget prevents duplicate writes.
  }, [widgetData, userId]);

  // Sync when app returns to foreground
  useAppState({
    onForeground: () => {
      // Invalidate the previous snapshot so the next sync
      // always writes fresh data after a foreground event.
      prevSnapshotRef.current = null;
      syncWidget().catch(() => {
        // Error already logged
      });
    },
  });

  return { lastSyncTime, isSyncing, syncWidget };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a cheap fingerprint of the widget data so we can detect
 * changes without deep-comparing the full object.
 */
function buildSnapshotKey(data: WidgetData): string {
  return [
    data.cleanTime.days,
    data.cleanTime.hours,
    data.todayStatus.morningCheckIn ? 1 : 0,
    data.todayStatus.eveningCheckIn ? 1 : 0,
    data.todayStatus.journalWritten ? 1 : 0,
    data.streaks.checkIn,
    data.streaks.journal,
  ].join(':');
}
