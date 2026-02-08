/**
 * Meeting Cache Service
 * Handles local storage of meeting data for offline access
 * Public data - NO encryption required
 */

import type { StorageAdapter } from '../../../adapters/storage';
import { logger } from '../../../utils/logger';
import type { CachedMeeting, CacheRegion } from '../types/meeting';

/**
 * Cache time-to-live (TTL) in days
 * Meeting data is refreshed weekly to catch schedule changes
 */
const CACHE_TTL_DAYS = 7;

/**
 * Maximum meetings to cache per region
 * Prevents unbounded growth of cached data
 */
const MAX_CACHED_MEETINGS_PER_REGION = 500;

/**
 * Cache meetings in local database
 * @param db Storage adapter
 * @param meetings Meetings to cache
 * @param cacheRegion Cache region identifier (lat,lng,radius)
 */
export async function cacheMeetings(
  db: StorageAdapter,
  meetings: CachedMeeting[],
  cacheRegion: string,
): Promise<void> {
  // Limit meetings to cache before transaction (for logging after)
  const meetingsToCache = meetings.slice(0, MAX_CACHED_MEETINGS_PER_REGION);

  try {
    logger.info('Caching meetings', {
      count: meetings.length,
      cacheRegion,
    });

    await db.withTransactionAsync(async () => {
      // Delete old meetings in this cache region
      await db.runAsync('DELETE FROM cached_meetings WHERE cache_region = ?', [cacheRegion]);

      // Insert new meetings
      for (const meeting of meetingsToCache) {
        await db.runAsync(
          `INSERT OR REPLACE INTO cached_meetings (
            id, name, location, address, city, state, postal_code, country,
            latitude, longitude, day_of_week, time, types, notes,
            cached_at, cache_region, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            meeting.id,
            meeting.name,
            meeting.location,
            meeting.address,
            meeting.city,
            meeting.state,
            meeting.postal_code,
            meeting.country,
            meeting.latitude,
            meeting.longitude,
            meeting.day_of_week,
            meeting.time,
            meeting.types,
            meeting.notes,
            meeting.cached_at,
            cacheRegion,
            meeting.created_at,
            meeting.updated_at,
          ],
        );
      }
    });

    logger.info('Meetings cached successfully', {
      count: meetingsToCache.length,
      cacheRegion,
    });
  } catch (error) {
    logger.warn('Failed to cache meetings', error);
    throw error;
  }
}

/**
 * Get cached meetings from local database
 * @param db Storage adapter
 * @param cacheRegion Cache region identifier (lat,lng,radius)
 * @returns Array of cached meetings
 */
export async function getCachedMeetings(
  db: StorageAdapter,
  cacheRegion: string,
): Promise<CachedMeeting[]> {
  try {
    const meetings = await db.getAllAsync<CachedMeeting>(
      'SELECT * FROM cached_meetings WHERE cache_region = ? ORDER BY name ASC',
      [cacheRegion],
    );

    logger.info('Retrieved cached meetings', {
      count: meetings.length,
      cacheRegion,
    });

    return meetings;
  } catch (error) {
    logger.warn('Failed to get cached meetings', error);
    return [];
  }
}

/**
 * Get a single meeting by ID
 * @param db Storage adapter
 * @param meetingId Meeting ID
 * @returns Cached meeting or null
 */
export async function getCachedMeetingById(
  db: StorageAdapter,
  meetingId: string,
): Promise<CachedMeeting | null> {
  try {
    const meeting = await db.getFirstAsync<CachedMeeting>(
      'SELECT * FROM cached_meetings WHERE id = ?',
      [meetingId],
    );

    return meeting;
  } catch (error) {
    logger.warn('Failed to get meeting by ID', error);
    return null;
  }
}

/**
 * Check if cache is stale (older than TTL)
 * @param db Storage adapter
 * @param cacheRegion Cache region identifier
 * @returns true if cache should be refreshed
 */
export async function isCacheStale(db: StorageAdapter, cacheRegion: string): Promise<boolean> {
  try {
    const result = await db.getFirstAsync<{ cached_at: string }>(
      'SELECT cached_at FROM cached_meetings WHERE cache_region = ? ORDER BY cached_at DESC LIMIT 1',
      [cacheRegion],
    );

    if (!result) {
      // No cached data for this region
      return true;
    }

    const cachedDate = new Date(result.cached_at);
    const now = new Date();
    const daysSinceCached = (now.getTime() - cachedDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceCached >= CACHE_TTL_DAYS;
  } catch (error) {
    logger.warn('Failed to check cache staleness', error);
    // Assume stale on error (will trigger refresh)
    return true;
  }
}

/**
 * Clear old cache entries (housekeeping)
 * Removes cache older than TTL
 * @param db Storage adapter
 */
export async function clearStaleCache(db: StorageAdapter): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CACHE_TTL_DAYS);

    await db.runAsync('DELETE FROM cached_meetings WHERE cached_at < ?', [
      cutoffDate.toISOString(),
    ]);

    logger.info('Cleared stale cache entries', {
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    logger.warn('Failed to clear stale cache', error);
  }
}

/**
 * Generate cache region identifier
 * @param region Cache region (lat, lng, radius)
 * @returns Cache region string (e.g., "37.7749,-122.4194,10")
 */
export function generateCacheRegionKey(region: CacheRegion): string {
  return `${region.latitude.toFixed(4)},${region.longitude.toFixed(4)},${region.radius_miles}`;
}

/**
 * Parse cache region key back to CacheRegion object
 * @param cacheRegionKey Cache region string
 * @returns CacheRegion object or null if invalid
 */
export function parseCacheRegionKey(cacheRegionKey: string): CacheRegion | null {
  try {
    const parts = cacheRegionKey.split(',');
    if (parts.length !== 3) {
      return null;
    }

    return {
      latitude: parseFloat(parts[0]),
      longitude: parseFloat(parts[1]),
      radius_miles: parseInt(parts[2], 10),
    };
  } catch (error) {
    logger.warn('Failed to parse cache region key', error);
    return null;
  }
}

/**
 * Get all cached meetings (for favorites/offline view)
 * @param db Storage adapter
 * @returns Array of all cached meetings
 */
export async function getAllCachedMeetings(db: StorageAdapter): Promise<CachedMeeting[]> {
  try {
    const meetings = await db.getAllAsync<CachedMeeting>(
      'SELECT * FROM cached_meetings ORDER BY name ASC',
    );

    return meetings;
  } catch (error) {
    logger.warn('Failed to get all cached meetings', error);
    return [];
  }
}

