/**
 * MeetingFinderScreen
 * Main screen for finding nearby AA/NA meetings
 * Features: location-based search, filtering, offline caching
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { EmptyState } from '../../../design-system/components/EmptyState';
import { FloatingActionButton } from '../../../design-system/components/FloatingActionButton';
import { MeetingCard } from '../components/MeetingCard';
import { MeetingFilters } from '../components/MeetingFilters';
import { useNearbyMeetings } from '../hooks/useNearbyMeetings';
import type { MeetingWithDetails } from '../types/meeting';

type MeetingFinderScreenProps = NativeStackScreenProps<any, 'MeetingFinder'>;

export function MeetingFinderScreen({ navigation }: MeetingFinderScreenProps): React.ReactElement {
  const theme = useTheme();
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const {
    meetings,
    isLoading,
    error,
    searchNearby,
    applyFilters,
    clearFilters,
    currentFilters,
    locationError,
    requestLocationPermission,
  } = useNearbyMeetings();

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Initial search on mount
  React.useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = useCallback(async (): Promise<void> => {
    await searchNearby();
  }, [searchNearby]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    await searchNearby();
    setIsRefreshing(false);
  }, [searchNearby]);

  const handleMeetingPress = useCallback(
    (meeting: MeetingWithDetails): void => {
      navigation.navigate('MeetingDetail', { meetingId: meeting.id });
    },
    [navigation],
  );

  const handleFilterPress = useCallback((): void => {
    setShowFilters(true);
  }, []);

  const handleApplyFilters = useCallback(
    (filters: Parameters<typeof applyFilters>[0]): void => {
      applyFilters(filters);
      setShowFilters(false);
    },
    [applyFilters],
  );

  const handleClearFilters = useCallback((): void => {
    clearFilters();
    setShowFilters(false);
  }, [clearFilters]);

  // Render filter modal
  if (showFilters) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.filterHeader}>
          <Pressable
            onPress={() => setShowFilters(false)}
            accessibilityRole="button"
            accessibilityLabel="Close filters"
            hitSlop={12}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: theme.colors.surface,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <MaterialIcons name="close" size={24} color={theme.colors.text} />
          </Pressable>
        </View>
        <MeetingFilters
          currentFilters={currentFilters}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
        />
      </View>
    );
  }

  // Loading state (initial load only)
  if (isLoading && meetings.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Error state
  if (error && meetings.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="error-outline"
          title="Unable to find meetings"
          description={error}
          actionLabel="Try Again"
          onAction={handleSearch}
        />
      </View>
    );
  }

  // Location permission denied state
  if (locationError && meetings.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="location-off"
          title="Location Access Needed"
          description={locationError}
          actionLabel="Enable Location"
          onAction={requestLocationPermission}
        />
      </View>
    );
  }

  // Empty state (no meetings found)
  if (meetings.length === 0) {
    const hasFilters =
      currentFilters.day_of_week !== null ||
      currentFilters.time_of_day !== null ||
      currentFilters.meeting_types.length > 0;

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="search-off"
          title="No meetings found"
          description={
            hasFilters
              ? 'Try adjusting your filters or search radius.'
              : 'No meetings found in your area. Try expanding your search radius.'
          }
          actionLabel={hasFilters ? 'Clear Filters' : 'Search Again'}
          onAction={hasFilters ? clearFilters : handleSearch}
        />
        <FloatingActionButton
          icon={<MaterialIcons name="filter-list" size={24} color="#FFFFFF" />}
          onPress={handleFilterPress}
          accessibilityLabel="Filter meetings"
        />
      </View>
    );
  }

  // List view with meetings
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={meetings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MeetingCard meeting={item} onPress={() => handleMeetingPress(item)} showFavoriteIcon />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Pressable
              onPress={handleFilterPress}
              accessibilityRole="button"
              accessibilityLabel="Filter meetings"
              accessibilityHint="Open filter options"
              hitSlop={12}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: theme.colors.surface,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <MaterialIcons name="filter-list" size={24} color={theme.colors.primary} />
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
});
