/**
 * Weather Service
 *
 * Fetches current weather data and correlates it with mood patterns
 * from daily check-ins. Uses OpenWeatherMap API when configured,
 * otherwise falls back to basic season-based estimation.
 *
 * Weather data is non-sensitive and does NOT require encryption.
 *
 * @module services/weatherService
 */

import type { StorageAdapter } from '../adapters/storage';
import { logger } from '../utils/logger';

const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// ============================================================================
// TYPES
// ============================================================================

type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'foggy';
type CorrelationTrend = 'positive' | 'negative' | 'neutral';

interface WeatherData {
  temperature: number;
  condition: WeatherCondition;
  humidity: number;
  description: string;
  icon: string;
  timestamp: string;
  location: string;
}

interface MoodWeatherCorrelation {
  condition: string;
  avgMood: number;
  avgCraving: number;
  sampleSize: number;
  trend: CorrelationTrend;
}

interface WeatherSnapshot {
  id: string;
  userId: string;
  date: string;
  temperature: number;
  condition: WeatherCondition;
  humidity: number;
  location: string;
  createdAt: string;
}

// ============================================================================
// WEATHER CONDITION MAPPING
// ============================================================================

const OWM_CONDITION_MAP: Record<string, WeatherCondition> = {
  Clear: 'sunny',
  Clouds: 'cloudy',
  Rain: 'rainy',
  Drizzle: 'rainy',
  Thunderstorm: 'stormy',
  Snow: 'snowy',
  Mist: 'foggy',
  Fog: 'foggy',
  Haze: 'foggy',
  Smoke: 'foggy',
  Dust: 'foggy',
  Sand: 'foggy',
  Ash: 'foggy',
  Squall: 'stormy',
  Tornado: 'stormy',
};

const CONDITION_ICONS: Record<WeatherCondition, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
  stormy: '⛈️',
  foggy: '🌫️',
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch current weather from OpenWeatherMap API.
 * Falls back to season-based estimation if API key is not available.
 */
async function getCurrentWeather(
  latitude: number,
  longitude: number,
  apiKey?: string,
): Promise<WeatherData> {
  if (apiKey) {
    try {
      const url = `${WEATHER_API_URL}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=imperial`;
      const response = await fetch(url);

      if (!response.ok) {
        logger.warn('Weather API returned non-OK status', { status: response.status });
        return getSeasonalFallback(latitude);
      }

      const data: Record<string, unknown> = await response.json();
      const weatherMain = (data.weather as Array<{ main: string; description: string }>)?.[0];
      const main = data.main as { temp: number; humidity: number };
      const locationName = data.name as string;
      const condition = OWM_CONDITION_MAP[weatherMain?.main ?? 'Clear'] ?? 'cloudy';

      return {
        temperature: Math.round(main?.temp ?? 70),
        condition,
        humidity: Math.round(main?.humidity ?? 50),
        description: weatherMain?.description ?? condition,
        icon: CONDITION_ICONS[condition],
        timestamp: new Date().toISOString(),
        location: locationName ?? 'Unknown',
      };
    } catch (error) {
      logger.warn('Failed to fetch weather from API, using fallback', error);
      return getSeasonalFallback(latitude);
    }
  }

  return getSeasonalFallback(latitude);
}

/**
 * Season-based weather estimation when API key is unavailable.
 * Uses latitude and current month to estimate weather.
 */
function getSeasonalFallback(latitude: number): WeatherData {
  const month = new Date().getMonth(); // 0-11
  const isNorthernHemisphere = latitude >= 0;

  // Adjust month for southern hemisphere
  const adjustedMonth = isNorthernHemisphere ? month : (month + 6) % 12;

  let condition: WeatherCondition;
  let temperature: number;
  let humidity: number;

  if (adjustedMonth >= 5 && adjustedMonth <= 7) {
    // Summer
    condition = 'sunny';
    temperature = 82;
    humidity = 55;
  } else if (adjustedMonth >= 2 && adjustedMonth <= 4) {
    // Spring
    condition = 'cloudy';
    temperature = 65;
    humidity = 60;
  } else if (adjustedMonth >= 8 && adjustedMonth <= 10) {
    // Fall
    condition = 'cloudy';
    temperature = 58;
    humidity = 65;
  } else {
    // Winter
    condition = Math.abs(latitude) > 35 ? 'snowy' : 'rainy';
    temperature = Math.abs(latitude) > 35 ? 35 : 50;
    humidity = 70;
  }

  return {
    temperature,
    condition,
    humidity,
    description: `Estimated ${condition} (no API key configured)`,
    icon: CONDITION_ICONS[condition],
    timestamp: new Date().toISOString(),
    location: 'Estimated',
  };
}

// ============================================================================
// DATABASE FUNCTIONS
// ============================================================================

/**
 * Save a weather snapshot alongside a daily check-in.
 */
async function saveWeatherSnapshot(
  db: StorageAdapter,
  userId: string,
  weather: WeatherData,
): Promise<void> {
  const id = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const today = new Date().toISOString().split('T')[0];

  try {
    // Check if we already have a snapshot for today
    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM weather_snapshots WHERE user_id = ? AND date = ?',
      [userId, today],
    );

    if (existing) {
      // Update existing snapshot
      await db.runAsync(
        'UPDATE weather_snapshots SET temperature = ?, condition = ?, humidity = ?, location = ? WHERE id = ?',
        [weather.temperature, weather.condition, weather.humidity, weather.location, existing.id],
      );
    } else {
      await db.runAsync(
        'INSERT INTO weather_snapshots (id, user_id, date, temperature, condition, humidity, location, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, userId, today, weather.temperature, weather.condition, weather.humidity, weather.location, new Date().toISOString()],
      );
    }
  } catch (error) {
    logger.warn('Failed to save weather snapshot', error);
  }
}

/**
 * Correlate historical mood data with weather conditions.
 * Joins weather_snapshots with daily_checkins on date to compute averages.
 */
async function correlateMoodWithWeather(
  db: StorageAdapter,
  userId: string,
): Promise<MoodWeatherCorrelation[]> {
  try {
    const rows = await db.getAllAsync<{
      condition: string;
      avg_mood: number;
      avg_craving: number;
      sample_count: number;
    }>(
      `SELECT
        ws.condition,
        AVG(CAST(dc.encrypted_mood AS REAL)) as avg_mood,
        AVG(CAST(dc.encrypted_craving AS REAL)) as avg_craving,
        COUNT(*) as sample_count
      FROM weather_snapshots ws
      INNER JOIN daily_checkins dc
        ON ws.user_id = dc.user_id AND ws.date = dc.check_in_date
      WHERE ws.user_id = ?
        AND dc.encrypted_mood IS NOT NULL
        AND dc.encrypted_mood != ''
      GROUP BY ws.condition
      HAVING COUNT(*) >= 2
      ORDER BY sample_count DESC`,
      [userId],
    );

    // Calculate overall average mood for trend comparison
    const overallAvg = rows.length > 0
      ? rows.reduce((sum, r) => sum + r.avg_mood * r.sample_count, 0) /
        rows.reduce((sum, r) => sum + r.sample_count, 0)
      : 3;

    return rows.map((row) => {
      let trend: CorrelationTrend = 'neutral';
      if (row.avg_mood > overallAvg + 0.3) {
        trend = 'positive';
      } else if (row.avg_mood < overallAvg - 0.3) {
        trend = 'negative';
      }

      return {
        condition: row.condition,
        avgMood: Math.round(row.avg_mood * 10) / 10,
        avgCraving: Math.round(row.avg_craving * 10) / 10,
        sampleSize: row.sample_count,
        trend,
      };
    });
  } catch (error) {
    logger.warn('Failed to correlate mood with weather', error);
    return [];
  }
}

/**
 * Get total number of weather data points for a user.
 */
async function getWeatherDataPointCount(
  db: StorageAdapter,
  userId: string,
): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM weather_snapshots WHERE user_id = ?',
      [userId],
    );
    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

export {
  getCurrentWeather,
  saveWeatherSnapshot,
  correlateMoodWithWeather,
  getWeatherDataPointCount,
  CONDITION_ICONS,
};

export type {
  WeatherData,
  MoodWeatherCorrelation,
  WeatherCondition,
  CorrelationTrend,
  WeatherSnapshot,
};
