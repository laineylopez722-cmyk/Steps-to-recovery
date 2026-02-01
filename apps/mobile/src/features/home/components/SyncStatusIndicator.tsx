import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSync } from '../../../contexts/SyncContext';
import { useTheme } from '../../../design-system/hooks/useTheme';

export function SyncStatusIndicator() {
  const { isSyncing, lastSyncTime, pendingCount, error, isOnline, triggerSync } = useSync();
  const theme = useTheme();

  // Determine sync status
  const getStatus = () => {
    if (!isOnline) {
      return {
        icon: 'cloud-off-outline' as const,
        color: theme.colors.muted,
        label: 'Offline',
        subtext: 'Sync paused',
      };
    }

    if (isSyncing) {
      return {
        icon: 'cloud-sync' as const,
        color: theme.colors.primary,
        label: 'Syncing...',
        subtext: `${pendingCount} item${pendingCount !== 1 ? 's' : ''}`,
      };
    }

    if (error) {
      return {
        icon: 'cloud-alert' as const,
        color: theme.colors.danger,
        label: 'Sync Error',
        subtext: 'Tap to retry',
      };
    }

    if (pendingCount > 0) {
      return {
        icon: 'cloud-upload-outline' as const,
        color: theme.colors.warning,
        label: `${pendingCount} Pending`,
        subtext: 'Tap to sync',
      };
    }

    return {
      icon: 'cloud-check' as const,
      color: theme.colors.success,
      label: 'Synced',
      subtext: lastSyncTime ? formatSyncTime(lastSyncTime) : 'Never',
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

  const handlePress = () => {
    if (!isSyncing && isOnline) {
      triggerSync();
    }
  };

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
          <MaterialCommunityIcons key="status-indicator" name={status.icon} size={20} color={status.color} />
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
