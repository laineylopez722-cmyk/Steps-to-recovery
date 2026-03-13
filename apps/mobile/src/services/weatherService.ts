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
import { decryptContent } from '../utils/encryption';
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
        [
          id,
          userId,
          today,
          weather.temperature,
          weather.condition,
          weather.humidity,
          weather.location,
          new Date().toISOString(),
        ],
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
    // Fetch raw rows and decrypt mood/craving values client-side
    // (encrypted_mood and encrypted_craving are ciphertext, not numeric)
    const rows = await db.getAllAsync<{
      condition: string;
      encrypted_mood: string;
      encrypted_craving: string;
    }>(
      `SELECT
        ws.condition,
        dc.encrypted_mood,
        dc.encrypted_craving
      FROM weather_snapshots ws
      INNER JOIN daily_checkins dc
        ON ws.user_id = dc.user_id AND ws.date = dc.check_in_date
      WHERE ws.user_id = ?
        AND dc.encrypted_mood IS NOT NULL
        AND dc.encrypted_mood != ''`,
      [userId],
    );

    // Decrypt and group by condition
    const conditionData: Record<string, { moods: number[]; cravings: number[] }> = {};
    for (const row of rows) {
      try {
        const mood = parseFloat(await decryptContent(row.encrypted_mood));
        const craving = row.encrypted_craving
          ? parseFloat(await decryptContent(row.encrypted_craving))
          : 0;
        if (isNaN(mood)) continue;

        if (!conditionData[row.condition]) {
          conditionData[row.condition] = { moods: [], cravings: [] };
        }
        conditionData[row.condition].moods.push(mood);
        conditionData[row.condition].cravings.push(isNaN(craving) ? 0 : craving);
      } catch {
        // Skip entries that fail to decrypt
      }
    }

    // Filter conditions with at least 2 samples and compute averages
    const results = Object.entries(conditionData)
      .filter(([, data]) => data.moods.length >= 2)
      .map(([condition, data]) => ({
        condition,
        avgMood: data.moods.reduce((s, v) => s + v, 0) / data.moods.length,
        avgCraving: data.cravings.reduce((s, v) => s + v, 0) / data.cravings.length,
        sampleSize: data.moods.length,
      }))
      .sort((a, b) => b.sampleSize - a.sampleSize);

    // Calculate overall average mood for trend comparison
    const totalMoods = results.reduce((sum, r) => sum + r.avgMood * r.sampleSize, 0);
    const totalSamples = results.reduce((sum, r) => sum + r.sampleSize, 0);
    const overallAvg = totalSamples > 0 ? totalMoods / totalSamples : 3;

    return results.map((row) => {
      let trend: CorrelationTrend = 'neutral';
      if (row.avgMood > overallAvg + 0.3) {
        trend = 'positive';
      } else if (row.avgMood < overallAvg - 0.3) {
        trend = 'negative';
      }

      return {
        condition: row.condition,
        avgMood: Math.round(row.avgMood * 10) / 10,
        avgCraving: Math.round(row.avgCraving * 10) / 10,
        sampleSize: row.sampleSize,
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
async function getWeatherDataPointCount(db: StorageAdapter, userId: string): Promise<number> {
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
