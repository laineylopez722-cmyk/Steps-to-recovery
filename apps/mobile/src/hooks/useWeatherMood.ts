/**
 * Weather-Mood Correlation Hook
 *
 * Fetches current weather on mount and computes mood-weather
 * correlations from historical data. Saves weather snapshots
 * alongside daily check-ins.
 *
 * @module hooks/useWeatherMood
 */

import { useEffect, useState, useCallback } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getCurrentWeather,
  saveWeatherSnapshot,
  correlateMoodWithWeather,
  getWeatherDataPointCount,
} from '../services/weatherService';
import type { WeatherData, MoodWeatherCorrelation } from '../services/weatherService';
import { logger } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

interface UseWeatherMoodResult {
  currentWeather: WeatherData | null;
  correlations: MoodWeatherCorrelation[];
  dataPointCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Default coordinates (US center) used when location is unavailable
const DEFAULT_LATITUDE = 39.8283;
const DEFAULT_LONGITUDE = -98.5795;

// ============================================================================
// HOOK
// ============================================================================

export function useWeatherMood(): UseWeatherMoodResult {
  const { db, isReady } = useDatabase();
  const { user } = useAuth();
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [correlations, setCorrelations] = useState<MoodWeatherCorrelation[]>([]);
  const [dataPointCount, setDataPointCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherAndCorrelations = useCallback(async (): Promise<void> => {
    if (!db || !isReady || !user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get location (best-effort, fall back to defaults)
      let latitude = DEFAULT_LATITUDE;
      let longitude = DEFAULT_LONGITUDE;

      try {
        const Location = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        }
      } catch {
        // Location unavailable; use defaults
        logger.info('Location unavailable for weather, using defaults');
      }

      // Retrieve API key from env (optional)
      const apiKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY || undefined;

      // Fetch current weather
      const weather = await getCurrentWeather(latitude, longitude, apiKey);
      setCurrentWeather(weather);

      // Save weather snapshot
      await saveWeatherSnapshot(db, user.id, weather);

      // Compute correlations
      const moodCorrelations = await correlateMoodWithWeather(db, user.id);
      setCorrelations(moodCorrelations);

      // Get data point count
      const count = await getWeatherDataPointCount(db, user.id);
      setDataPointCount(count);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.warn('Weather-mood fetch failed', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [db, isReady, user?.id]);

  useEffect(() => {
    fetchWeatherAndCorrelations();
  }, [fetchWeatherAndCorrelations]);

  return {
    currentWeather,
    correlations,
    dataPointCount,
    isLoading,
    error,
    refresh: fetchWeatherAndCorrelations,
  };
}
