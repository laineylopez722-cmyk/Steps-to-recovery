/**
 * useNearbyMeetings Hook
 * High-level orchestration hook that combines location and search
 * Provides simple API for "find meetings near me"
 */

import { useState, useCallback, useMemo } from 'react';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { logger } from '../../../utils/logger';
import { useUserLocation } from './useUserLocation';
import { useMeetingSearch } from './useMeetingSearch';
import { useFavoriteMeetings } from './useFavoriteMeetings';
import type { CachedMeeting, MeetingWithDetails, MeetingFilters } from '../types/meeting';
import { calculateDistance, meetingMatchesFilters } from '../types/meeting';

/**
 * Default search radius (miles)
 */
const DEFAULT_RADIUS_MILES = 10;
const EXPANDED_RADIUS_MILES = 25;

export interface UseNearbyMeetingsReturn {
  meetings: MeetingWithDetails[];
  isLoading: boolean;
  error: string | null;
  searchNearby: (radiusMiles?: number) => Promise<void>;
  applyFilters: (filters: Partial<MeetingFilters>) => void;
  clearFilters: () => void;
  currentFilters: MeetingFilters;
  locationError: string | null;
  requestLocationPermission: () => Promise<void>;
}

/**
 * Hook to find meetings near user's current location
 * @returns Nearby meetings state and control functions
 */
export function useNearbyMeetings(): UseNearbyMeetingsReturn {
  const { db } = useDatabase();
  const locationHook = useUserLocation();
  const searchHook = useMeetingSearch();
  const favoritesHook = useFavoriteMeetings();

  const [rawMeetings, setRawMeetings] = useState<CachedMeeting[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<MeetingFilters>({
    day_of_week: null,
    time_of_day: null,
    meeting_types: [],
    max_distance_miles: DEFAULT_RADIUS_MILES,
  });

  /**
   * Request location permission (wrapper for useUserLocation)
   */
  const requestLocationPermission = useCallback(async (): Promise<void> => {
    await locationHook.requestLocation();
  }, [locationHook]);

  /**
   * Search for nearby meetings
   * @param radiusMiles Search radius in miles (default: 10)
   */
  const searchNearby = useCallback(
    async (radiusMiles: number = DEFAULT_RADIUS_MILES): Promise<void> => {
      if (!db) {
        setSearchError('Database not initialized');
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        // Get user location (will request permission if needed)
        const location = await locationHook.requestLocation();

        if (!location) {
          // Location denied or failed
          setSearchError(locationHook.error || 'Unable to get your location');
          setIsSearching(false);
          return;
        }

        // Search with Meeting Guide API + caching
        const meetings = await searchHook.search({
          latitude: location.latitude,
          longitude: location.longitude,
          radius_miles: radiusMiles,
        });

        // If no meetings found and using default radius, try expanded radius
        if (meetings.length === 0 && radiusMiles === DEFAULT_RADIUS_MILES) {
          logger.info('No meetings found, expanding search radius');

          const expandedMeetings = await searchHook.search({
            latitude: location.latitude,
            longitude: location.longitude,
            radius_miles: EXPANDED_RADIUS_MILES,
          });

          setRawMeetings(expandedMeetings);
          setFilters((prev) => ({
            ...prev,
            max_distance_miles: EXPANDED_RADIUS_MILES,
          }));
        } else {
          setRawMeetings(meetings);
          setFilters((prev) => ({
            ...prev,
            max_distance_miles: radiusMiles,
          }));
        }

        setIsSearching(false);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to search for nearby meetings';

        setSearchError(errorMessage);
        setIsSearching(false);
        logger.error('Nearby meeting search failed', error);
      }
    },
    [db, locationHook, searchHook],
  );

  /**
   * Apply filters to meetings
   */
  const applyFilters = useCallback((newFilters: Partial<MeetingFilters>): void => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback((): void => {
    setFilters({
      day_of_week: null,
      time_of_day: null,
      meeting_types: [],
      max_distance_miles: DEFAULT_RADIUS_MILES,
    });
  }, []);

  /**
   * Process meetings with distance calculation, favorite status, and filtering
   */
  const meetings = useMemo((): MeetingWithDetails[] => {
    if (!locationHook.location || rawMeetings.length === 0) {
      return [];
    }

    const { latitude: userLat, longitude: userLng } = locationHook.location;

    // Map meetings to MeetingWithDetails
    const meetingsWithDetails: MeetingWithDetails[] = rawMeetings.map((meeting) => {
      const distance = calculateDistance(userLat, userLng, meeting.latitude, meeting.longitude);

      const isFav = favoritesHook.isFavorite(meeting.id);

      return {
        ...meeting,
        is_favorite: isFav,
        distance_miles: distance,
      };
    });

    // Apply filters
    let filtered = meetingsWithDetails;

    // Distance filter
    filtered = filtered.filter(
      (meeting) =>
        meeting.distance_miles !== null && meeting.distance_miles <= filters.max_distance_miles,
    );

    // Day/time/type filters
    filtered = filtered.filter((meeting) => meetingMatchesFilters(meeting, filters));

    // Sort by distance (nearest first)
    filtered.sort((a, b) => {
      if (a.distance_miles === null) return 1;
      if (b.distance_miles === null) return -1;
      return a.distance_miles - b.distance_miles;
    });

    return filtered;
  }, [rawMeetings, locationHook.location, favoritesHook, filters]);

  return {
    meetings,
    isLoading: isSearching || locationHook.isLoading,
    error: searchError || searchHook.error,
    searchNearby,
    applyFilters,
    clearFilters,
    currentFilters: filters,
    locationError: locationHook.error,
    requestLocationPermission,
  };
}
