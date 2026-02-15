/**
 * MeetingFinderScreen
 */

import React, { useState, useCallback } from 'react';
import { View, Text, RefreshControl, ActivityIndicator, Pressable, Linking } from 'react-native';
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
    try {
      await searchNearby();
    } catch {
      // Swallow — hook exposes error state for UI
    } finally {
      setIsRefreshing(false);
    }
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
        accessibilityLabel="Finding nearby meetings"
        accessibilityRole="progressbar"
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

    const handleOpenOnlineMeetings = (): void => {
      void Linking.openURL('https://aa-intergroup.org/meetings/');
    };

    const handleOpenAuMeetings = (): void => {
      void Linking.openURL('https://meetings.aa.org.au/');
    };

    return (
      <View style={[styles.container, { backgroundColor: ds.semantic.surface.app }]}>
        <Animated.View entering={MotionTransitions.fade()} style={styles.emptyHeader}>
          <View>
            <Text
              style={[styles.screenTitle, { color: ds.semantic.text.primary }]}
              accessibilityRole="header"
            >
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
                  importantForAccessibility="no"
                  accessibilityElementsHidden
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
                  importantForAccessibility="no"
                  accessibilityElementsHidden
                />
              </Animated.View>
            </Pressable>
          </View>
        </Animated.View>
        {hasFilters ? (
          <EmptyState
            icon="search-off"
            title="No meetings match"
            description="Try adjusting your filters or search radius."
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        ) : (
          <Animated.View entering={MotionTransitions.fade()} style={styles.noMeetingsContainer}>
            <View
              style={[
                styles.noMeetingsIconWrap,
                { backgroundColor: ds.semantic.intent.primary.solid + '15' },
              ]}
            >
              <MaterialIcons
                name="people-outline"
                size={48}
                color={ds.semantic.intent.primary.solid}
                importantForAccessibility="no"
                accessibilityElementsHidden
              />
            </View>
            <Text
              style={[styles.noMeetingsTitle, { color: ds.semantic.text.primary }]}
              accessibilityRole="header"
            >
              No nearby meetings found
            </Text>
            <Text style={[styles.noMeetingsDesc, { color: ds.semantic.text.secondary }]}>
              In-app meeting data currently covers select US areas. You can find meetings near you
              through these resources:
            </Text>

            <View style={styles.noMeetingsActions}>
              <Pressable
                onPress={handleOpenOnlineMeetings}
                accessibilityRole="link"
                accessibilityLabel="Find online meetings"
                accessibilityHint="Opens the Online Intergroup meeting directory in your browser"
                style={({ pressed }) => [
                  styles.resourceButton,
                  {
                    backgroundColor: ds.semantic.intent.primary.solid,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <MaterialIcons
                  name="videocam"
                  size={20}
                  color={ds.semantic.surface.app}
                  importantForAccessibility="no"
                  accessibilityElementsHidden
                />
                <Text style={[styles.resourceButtonText, { color: ds.semantic.surface.app }]}>
                  Find Online Meetings
                </Text>
              </Pressable>

              <Pressable
                onPress={handleOpenAuMeetings}
                accessibilityRole="link"
                accessibilityLabel="Find Australian meetings"
                accessibilityHint="Opens the AA Australia meeting directory in your browser"
                style={({ pressed }) => [
                  styles.resourceButton,
                  {
                    backgroundColor: ds.semantic.surface.card,
                    borderWidth: 1,
                    borderColor: ds.semantic.surface.overlay,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <MaterialIcons
                  name="place"
                  size={20}
                  color={ds.semantic.intent.primary.solid}
                  importantForAccessibility="no"
                  accessibilityElementsHidden
                />
                <Text
                  style={[
                    styles.resourceButtonText,
                    { color: ds.semantic.text.primary },
                  ]}
                >
                  Australian Meetings
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSearch}
                accessibilityRole="button"
                accessibilityLabel="Search again"
                style={({ pressed }) => [
                  styles.retryLink,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.retryLinkText, { color: ds.semantic.text.secondary }]}>
                  Search again
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
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
              <Text
                style={[styles.screenTitle, { color: ds.semantic.text.primary }]}
                accessibilityRole="header"
              >
                Meeting finder
              </Text>
              <Text
                style={[styles.screenSubtitle, { color: ds.semantic.text.secondary }]}
                accessibilityLabel={`${meetings.length} meetings found nearby`}
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
                    importantForAccessibility="no"
                    accessibilityElementsHidden
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
                    importantForAccessibility="no"
                    accessibilityElementsHidden
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
    noMeetingsContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: ds.space[8],
      paddingTop: ds.space[6],
    },
    noMeetingsIconWrap: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: ds.space[5],
    },
    noMeetingsTitle: {
      ...ds.semantic.typography.screenTitle,
      textAlign: 'center',
      marginBottom: ds.space[2],
    },
    noMeetingsDesc: {
      ...ds.semantic.typography.body,
      textAlign: 'center',
      maxWidth: 300,
      marginBottom: ds.space[6],
      lineHeight: 22,
    },
    noMeetingsActions: {
      width: '100%',
      maxWidth: 300,
      gap: ds.space[3],
      alignItems: 'center',
    },
    resourceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ds.space[2],
      width: '100%',
      paddingVertical: ds.space[3],
      paddingHorizontal: ds.space[4],
      borderRadius: ds.radius.lg,
      minHeight: ds.semantic.layout.touchTarget,
    },
    resourceButtonText: {
      ...ds.semantic.typography.body,
      fontWeight: '600',
    },
    retryLink: {
      paddingVertical: ds.space[2],
      minHeight: ds.semantic.layout.touchTarget,
      justifyContent: 'center',
    },
    retryLinkText: {
      ...ds.semantic.typography.meta,
      textDecorationLine: 'underline',
    },
  }) as const;
