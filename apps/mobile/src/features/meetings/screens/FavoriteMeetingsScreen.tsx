/**
 * FavoriteMeetingsScreen
 * Displays user's favorited meetings for quick offline access
 */

import { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../../design-system/hooks/useTheme';
import { EmptyState } from '../../../design-system/components/EmptyState';
import { MeetingCard } from '../components/MeetingCard';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useFavoriteMeetings } from '../hooks/useFavoriteMeetings';
import { useUserLocation } from '../hooks/useUserLocation';
import { getCachedMeetingById } from '../services/meetingCacheService';
import type { MeetingWithDetails } from '../types/meeting';
import { calculateDistance } from '../types/meeting';
import { logger } from '../../../utils/logger';
import type { MeetingsStackParamList } from '../../../navigation/types';

type FavoriteMeetingsScreenProps = NativeStackScreenProps<MeetingsStackParamList, 'FavoriteMeetings'>;

export function FavoriteMeetingsScreen({
  navigation,
}: FavoriteMeetingsScreenProps): React.ReactElement {
  const theme = useTheme();
  const { db } = useDatabase();
  const { favoriteMeetings, isLoading: isFavoritesLoading } = useFavoriteMeetings();
  const { location, requestLocation } = useUserLocation();

  const [meetings, setMeetings] = useState<MeetingWithDetails[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState<boolean>(true);

  // Load full meeting details for favorites
  useEffect(() => {
    const loadMeetingDetails = async (): Promise<void> => {
      if (!db || favoriteMeetings.length === 0) {
        setMeetings([]);
        setIsLoadingMeetings(false);
        return;
      }

      setIsLoadingMeetings(true);

      try {
        // Request location for distance calculation (optional)
        const userLocation = location || (await requestLocation());

        const meetingDetailsPromises = favoriteMeetings.map(async (favorite) => {
          const meeting = await getCachedMeetingById(db, favorite.meeting_id);
          if (!meeting) return null;

          // Calculate distance if location available
          let distance: number | null = null;
          if (userLocation) {
            distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              meeting.latitude,
              meeting.longitude,
            );
          }

          const meetingWithDetails: MeetingWithDetails = {
            ...meeting,
            is_favorite: true,
            distance_miles: distance,
          };

          return meetingWithDetails;
        });

        const meetingDetails = await Promise.all(meetingDetailsPromises);
        const validMeetings = meetingDetails.filter((m): m is MeetingWithDetails => m !== null);

        // Sort by distance if available, otherwise by name
        validMeetings.sort((a, b) => {
          if (a.distance_miles !== null && b.distance_miles !== null) {
            return a.distance_miles - b.distance_miles;
          }
          return a.name.localeCompare(b.name);
        });

        setMeetings(validMeetings);
      } catch (error) {
        logger.error('Failed to load favorite meetings', error);
        setMeetings([]);
      } finally {
        setIsLoadingMeetings(false);
      }
    };

    loadMeetingDetails();
  }, [db, favoriteMeetings, location, requestLocation]);

  const handleMeetingPress = useCallback(
    (meeting: MeetingWithDetails): void => {
      navigation.navigate('MeetingDetail', { meetingId: meeting.id });
    },
    [navigation],
  );

  const handleFindMeetings = useCallback((): void => {
    navigation.navigate('MeetingFinder');
  }, [navigation]);

  const isLoading = isFavoritesLoading || isLoadingMeetings;

  // Loading state
  if (isLoading && meetings.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Empty state
  if (meetings.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="favorite-border"
          title="No Favorite Meetings"
          description="Favorite meetings to access them quickly offline."
          actionLabel="Find Meetings"
          onAction={handleFindMeetings}
        />
      </View>
    );
  }

  // List of favorited meetings
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={meetings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MeetingCard
            meeting={item}
            onPress={() => handleMeetingPress(item)}
            showFavoriteIcon={false}
          />
        )}
        contentContainerStyle={styles.listContent}
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
});
