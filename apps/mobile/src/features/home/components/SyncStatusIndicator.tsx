import { useCallback } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsOnline } from '../../../providers/QueryProvider';
import * as useOfflineMutation from '../../../hooks/useOfflineMutation';
import { useSync } from '../../../contexts/SyncContext';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { logger } from '../../../utils/logger';

/**
 * SyncStatusIndicator - Enhanced with React Query offline support
 *
 * Shows sync status combining:
 * - Legacy sync queue status (for backward compatibility)
 * - React Query pending mutations
 * - Network connectivity
 *
 * Gradually migrating to React Query for all sync operations
 */
export function SyncStatusIndicator() {
  const theme = useTheme();

  // Legacy sync context (phasing out)
  const {
    isSyncing: isLegacySyncing,
    lastSyncTime,
    pendingCount: legacyPendingCount,
    error: legacyError,
    triggerSync,
  } = useSync();

  // New React Query offline status
  const isOnline = useIsOnline();
  const hasPendingMutations = useOfflineMutation.useHasPendingMutations();
  const syncPendingMutations = useOfflineMutation.useSyncPendingMutations();

  // Combined pending count (legacy + React Query)
  const totalPending = legacyPendingCount + (hasPendingMutations ? 1 : 0);
  const isSyncing = isLegacySyncing;
  const hasError = !!legacyError;

  // Handle sync press - triggers both legacy and new sync
  const handlePress = useCallback(async (event: GestureResponderEvent) => {
    if (isSyncing || !isOnline) return;

    try {
      // Trigger legacy sync
      await triggerSync();

      // Also sync any React Query pending mutations
      await syncPendingMutations();
    } catch (error) {
      logger.error('Manual sync failed', error);
    }
  }, [isSyncing, isOnline, triggerSync, syncPendingMutations]);

  // Determine sync status
  const getStatus = () => {
    if (!isOnline) {
      return {
        icon: 'cloud-off-outline' as const,
        color: theme.colors.muted,
        label: 'Offline',
        subtext:
          totalPending > 0
            ? `${totalPending} item${totalPending !== 1 ? 's' : ''} queued`
            : 'Sync paused',
      };
    }

    if (isSyncing) {
      return {
        icon: 'cloud-sync' as const,
        color: theme.colors.primary,
        label: 'Syncing...',
        subtext:
          totalPending > 0
            ? `${totalPending} item${totalPending !== 1 ? 's' : ''} remaining`
            : 'Uploading changes',
      };
    }

    if (hasError) {
      return {
        icon: 'cloud-alert' as const,
        color: theme.colors.danger,
        label: 'Sync Error',
        subtext: 'Tap to retry',
      };
    }

    if (totalPending > 0) {
      return {
        icon: 'cloud-upload-outline' as const,
        color: theme.colors.warning,
        label: `${totalPending} Pending`,
        subtext: 'Tap to sync now',
      };
    }

    return {
      icon: 'cloud-check' as const,
      color: theme.colors.success,
      label: 'Synced',
      subtext: lastSyncTime ? formatSyncTime(lastSyncTime) : 'All caught up',
    };
  };

  const formatSyncTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const status = getStatus();

  return (
    <TouchableOpacity
      testID="sync-status-indicator"
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={handlePress}
      disabled={isSyncing || !isOnline}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Sync status: ${status.label}. ${status.subtext}`}
      accessibilityHint={
        isSyncing ? 'Syncing in progress' : isOnline ? 'Tap to sync now' : 'No internet connection'
      }
      accessibilityState={{ disabled: isSyncing || !isOnline, busy: isSyncing }}
    >
      <View style={styles.content}>
        {isSyncing ? (
          <ActivityIndicator key="status-indicator" size={20} color={status.color} />
        ) : (
          <MaterialCommunityIcons
            key="status-indicator"
            name={status.icon}
            size={20}
            color={status.color}
          />
        )}
        <View key="text-container" style={styles.textContainer}>
          <Text style={[theme.typography.subheadline, { color: status.color, fontWeight: '600' }]}>
            {status.label}
          </Text>
          <Text
            style={[theme.typography.caption1, { color: theme.colors.textSecondary, marginTop: 2 }]}
          >
            {status.subtext}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
});
