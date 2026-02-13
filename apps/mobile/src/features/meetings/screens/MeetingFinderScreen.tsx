/**
 * MeetingFinderScreen
 */

import React, { useState, useCallback } from 'react';
import { View, Text, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { MotionTransitions, motionScale } from '../../../design-system/tokens/motion';
import { useMotionPress } from '../../../design-system/hooks/useMotionPress';
import { EmptyState } from '../../../design-system/components/EmptyState';
import { MeetingCard } from '../components/MeetingCard';
import { MeetingFilters } from '../components/MeetingFilters';
import { useNearbyMeetings } from '../hooks/useNearbyMeetings';
import type { MeetingWithDetails } from '../types/meeting';
import type { MeetingsStackParamList } from '../../../navigation/types';
import { useDs } from '../../../design-system';

type MeetingFinderScreenProps = NativeStackScreenProps<MeetingsStackParamList, 'MeetingFinder'>;

export function MeetingFinderScreen({ navigation }: MeetingFinderScreenProps): React.ReactElement {
  const ds = useDs();
  const styles = useThemedStyles(createStyles);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const {
    onPressIn: onFilterPressIn,
    onPressOut: onFilterPressOut,
    animatedStyle: filterAnimatedStyle,
  } = useMotionPress({ scaleTo: motionScale.pressButton });
  const {
    onPressIn: onFavoritesPressIn,
    onPressOut: onFavoritesPressOut,
    animatedStyle: favoritesAnimatedStyle,
  } = useMotionPress({ scaleTo: motionScale.pressButton });
  const {
    onPressIn: onClosePressIn,
    onPressOut: onClosePressOut,
    animatedStyle: closeAnimatedStyle,
  } = useMotionPress({ scaleTo: motionScale.pressButton });

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

  React.useEffect(() => {
    void handleSearch();
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

  const handleFavoritesPress = useCallback((): void => {
    navigation.navigate('FavoriteMeetings');
  }, [navigation]);

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

  if (showFilters) {
    return (
      <View style={[styles.container, { backgroundColor: ds.semantic.surface.app }]}>
        <View style={styles.filterHeader}>
          <Pressable
            onPress={() => setShowFilters(false)}
            onPressIn={onClosePressIn}
            onPressOut={onClosePressOut}
            accessibilityRole="button"
            accessibilityLabel="Close filters"
            accessibilityHint="Closes the filter panel and returns to meetings list"
            hitSlop={12}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: ds.semantic.surface.card,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Animated.View style={closeAnimatedStyle}>
              <MaterialIcons name="close" size={24} color={ds.semantic.text.primary} />
            </Animated.View>
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

  if (isLoading && meetings.length === 0) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: ds.semantic.surface.app }]}
      >
        <ActivityIndicator size="large" color={ds.semantic.intent.primary.solid} />
      </View>
    );
  }

  if (error && meetings.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: ds.semantic.surface.app }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Unable to find meetings"
          description={error}
          actionLabel="Try Again"
          onAction={handleSearch}
        />
      </View>
    );
  }

  if (locationError && meetings.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: ds.semantic.surface.app }]}>
        <EmptyState
          icon="map-marker-off-outline"
          title="Location Access Needed"
          description={locationError}
          actionLabel="Enable Location"
          onAction={requestLocationPermission}
        />
      </View>
    );
  }

  if (meetings.length === 0) {
    const hasFilters =
      currentFilters.day_of_week !== null ||
      currentFilters.time_of_day !== null ||
      currentFilters.meeting_types.length > 0;

    return (
      <View style={[styles.container, { backgroundColor: ds.semantic.surface.app }]}>
        <Animated.View entering={MotionTransitions.fade()} style={styles.emptyHeader}>
          <View>
            <Text style={[styles.screenTitle, { color: ds.semantic.text.primary }]}>
              Meeting finder
            </Text>
            <Text style={[styles.screenSubtitle, { color: ds.semantic.text.secondary }]}>
              Find nearby support right now
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleFavoritesPress}
              onPressIn={onFavoritesPressIn}
              onPressOut={onFavoritesPressOut}
              accessibilityRole="button"
              accessibilityLabel="Open favorite meetings"
              accessibilityHint="Shows meetings you have favorited"
              hitSlop={12}
              style={({ pressed }) => [
                styles.filterButton,
                {
                  backgroundColor: ds.semantic.surface.card,
                  borderColor: ds.semantic.surface.overlay,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Animated.View style={favoritesAnimatedStyle}>
                <MaterialIcons
                  name="favorite"
                  size={20}
                  color={ds.semantic.intent.primary.solid}
                />
              </Animated.View>
            </Pressable>
            <Pressable
              onPress={handleFilterPress}
              onPressIn={onFilterPressIn}
              onPressOut={onFilterPressOut}
              accessibilityRole="button"
              accessibilityLabel="Filter meetings"
              accessibilityHint="Open filter options to refine meeting search"
              hitSlop={12}
              style={({ pressed }) => [
                styles.filterButton,
                {
                  backgroundColor: ds.semantic.surface.card,
                  borderColor: ds.semantic.surface.overlay,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Animated.View style={filterAnimatedStyle}>
                <MaterialIcons
                  name="filter-list"
                  size={20}
                  color={ds.semantic.intent.primary.solid}
                />
              </Animated.View>
            </Pressable>
          </View>
        </Animated.View>
        <EmptyState
          icon="search-off"
          title="No meetings found"
          description={
            hasFilters
              ? 'Try adjusting your filters or search radius.'
              : 'Finding your people is part of recovery. Try expanding your search radius.'
          }
          actionLabel={hasFilters ? 'Clear Filters' : 'Search Again'}
          onAction={hasFilters ? clearFilters : handleSearch}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: ds.semantic.surface.app }]}>
      <FlashList
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
            tintColor={ds.semantic.intent.primary.solid}
          />
        }
        ListHeaderComponent={
          <Animated.View entering={MotionTransitions.fade()} style={styles.listHeader}>
            <View>
              <Text style={[styles.screenTitle, { color: ds.semantic.text.primary }]}>
                Meeting finder
              </Text>
              <Text
                style={[styles.screenSubtitle, { color: ds.semantic.text.secondary }]}
              >
                {meetings.length} meetings nearby
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={handleFavoritesPress}
                onPressIn={onFavoritesPressIn}
                onPressOut={onFavoritesPressOut}
                accessibilityRole="button"
                accessibilityLabel="Open favorite meetings"
                accessibilityHint="Shows meetings you have favorited"
                hitSlop={12}
                style={({ pressed }) => [
                  styles.filterButton,
                  {
                    backgroundColor: ds.semantic.surface.card,
                    borderColor: ds.semantic.surface.overlay,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Animated.View style={favoritesAnimatedStyle}>
                  <MaterialIcons
                    name="favorite"
                    size={20}
                    color={ds.semantic.intent.primary.solid}
                  />
                </Animated.View>
              </Pressable>
              <Pressable
                onPress={handleFilterPress}
                onPressIn={onFilterPressIn}
                onPressOut={onFilterPressOut}
                accessibilityRole="button"
                accessibilityLabel="Filter meetings"
                accessibilityHint="Open filter options"
                hitSlop={12}
                style={({ pressed }) => [
                  styles.filterButton,
                  {
                    backgroundColor: ds.semantic.surface.card,
                    borderColor: ds.semantic.surface.overlay,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Animated.View style={filterAnimatedStyle}>
                  <MaterialIcons
                    name="filter-list"
                    size={20}
                    color={ds.semantic.intent.primary.solid}
                  />
                </Animated.View>
              </Pressable>
            </View>
          </Animated.View>
        }
      />
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      flex: 1,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      paddingVertical: ds.space[4],
      paddingHorizontal: ds.semantic.layout.screenPadding,
      gap: ds.space[2],
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: ds.space[3],
      backgroundColor: ds.semantic.surface.card,
      borderRadius: ds.radius.xl,
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[4],
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
    },
    emptyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: ds.semantic.layout.screenPadding,
      paddingTop: ds.space[4],
      marginBottom: ds.space[3],
    },
    screenTitle: {
      ...ds.semantic.typography.screenTitle,
    },
    screenSubtitle: {
      ...ds.semantic.typography.meta,
      marginTop: 2,
    },
    iconButton: {
      minWidth: ds.semantic.layout.touchTarget,
      minHeight: ds.semantic.layout.touchTarget,
      borderRadius: ds.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterButton: {
      minWidth: ds.semantic.layout.touchTarget,
      minHeight: ds.semantic.layout.touchTarget,
      borderRadius: ds.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    headerActions: {
      flexDirection: 'row',
      gap: ds.space[2],
      alignItems: 'center',
    },
    filterHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: ds.semantic.layout.screenPadding,
      paddingTop: ds.space[4],
      paddingBottom: ds.space[2],
    },
  }) as const;
