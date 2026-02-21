/**
 * Meeting Guide API Client
 * Fetches meeting data from TSML-compatible feeds (Meeting Guide spec)
 * @see https://github.com/code4recovery/spec
 *
 * Primary data source: TSML API service (aggregates multiple feeds)
 * Fallback: Direct AA San Jose endpoint
 */

import { logger } from '../../../utils/logger';
import { fetchWithTimeout, sleep } from '../../../utils/network';
import type { MeetingGuideResponse, CachedMeeting, MeetingSearchParams } from '../types/meeting';
import { fetchTSMLMeetings } from '../../../services/meetingApiService';

/**
 * Meeting Guide API base URL (legacy single-feed fallback)
 */
const MEETING_GUIDE_API_BASE = 'https://aasanjose.org/api/meetings';

/**
 * Retry configuration for API calls
 */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Search for meetings near a location
 * Uses TSML multi-feed service as primary source, falls back to legacy endpoint
 * @param params Search parameters (lat, lng, radius)
 * @returns Array of cached meetings
 * @throws Error if all sources fail
 */
export async function searchMeetings(params: MeetingSearchParams): Promise<CachedMeeting[]> {
  const { latitude, longitude, radius_miles } = params;

  logger.info('Searching for meetings', {
    latitude,
    longitude,
    radius_miles,
  });

  // Try TSML multi-feed service first
  try {
    const tsmlMeetings = await fetchTSMLMeetings(params);

    logger.info('TSML meeting search successful', {
      count: tsmlMeetings.length,
    });

    return tsmlMeetings;
  } catch (tsmlError) {
    logger.warn('TSML service failed, falling back to legacy endpoint', {
      error: tsmlError instanceof Error ? tsmlError.message : 'Unknown error',
    });
  }

  // Fallback: legacy single-endpoint search
  return searchMeetingsLegacy(params);
}

/**
 * Legacy single-endpoint meeting search (fallback)
 * @param params Search parameters
 * @returns Array of cached meetings
 * @throws Error if API call fails after retries
 */
async function searchMeetingsLegacy(params: MeetingSearchParams): Promise<CachedMeeting[]> {
  const { latitude, longitude, radius_miles } = params;
  let lastError: Error | null = null;

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `${MEETING_GUIDE_API_BASE}?lat=${latitude}&lng=${longitude}&distance=${radius_miles}`,
        REQUEST_TIMEOUT_MS,
      );

      if (!response.ok) {
        let errorMessage = `API responded with status ${response.status}`;
        switch (response.status) {
          case 400:
            errorMessage = 'Invalid search parameters';
            break;
          case 401:
            errorMessage = 'API authentication failed';
            break;
          case 403:
            errorMessage = 'API access forbidden';
            break;
          case 404:
            errorMessage = 'Meeting search service not found';
            break;
          case 429:
            errorMessage = 'Too many requests, please try again later';
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = 'Meeting search service is temporarily unavailable';
            break;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type') || '';
      const rawBody = await response.text();

      if (!contentType.toLowerCase().includes('application/json')) {
        throw new Error('Meeting search service returned a non-JSON response');
      }

      let data: unknown;
      try {
        data = JSON.parse(rawBody);
      } catch {
        throw new Error('Meeting search service returned invalid JSON');
      }

      if (!Array.isArray(data)) {
        throw new Error('Meeting search service returned an unexpected payload');
      }

      logger.info('Legacy meeting search successful', {
        count: data.length,
        attempt,
      });

      // Transform API response to internal schema
      return data
        .filter((item): item is MeetingGuideResponse => !!item && typeof item === 'object')
        .map(transformMeetingGuideToInternal);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      logger.warn('Legacy meeting search attempt failed', {
        attempt,
        maxRetries: MAX_RETRIES,
        error: lastError.message,
      });

      // Don't retry on final attempt
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  const errorMessage = `Failed to fetch meetings after ${MAX_RETRIES} attempts: ${lastError?.message}`;
  logger.warn('Meeting search failed after retries', {
    error: lastError?.message,
    retries: MAX_RETRIES,
  });
  throw new Error(errorMessage);
}

/**
 * Transform Meeting Guide API format to internal CachedMeeting format
 * @param meeting Meeting Guide API response
 * @returns CachedMeeting for local storage
 */
function transformMeetingGuideToInternal(meeting: MeetingGuideResponse): CachedMeeting {
  const now = new Date().toISOString();

  return {
    id: String(meeting.id || `meeting-${now}`),
    name: meeting.name?.trim() || 'Unnamed meeting',
    location: meeting.location?.trim() || 'Location details unavailable',
    address: meeting.address?.trim() || 'Address unavailable',
    city: meeting.city?.trim() || 'City unavailable',
    state: meeting.state || null,
    postal_code: meeting.postal_code || null,
    country: meeting.country || 'US',
    latitude: Number.isFinite(meeting.latitude) ? meeting.latitude : 0,
    longitude: Number.isFinite(meeting.longitude) ? meeting.longitude : 0,
    day_of_week: typeof meeting.day === 'number' ? meeting.day : null,
    time: meeting.time || null,
    types: JSON.stringify(Array.isArray(meeting.types) ? meeting.types : []),
    notes: meeting.notes || null,
    cached_at: now,
    cache_region: '', // Will be set by cache service
    created_at: now,
    updated_at: now,
  };
}

/**
 * Validate coordinates
 * @param latitude Latitude (-90 to 90)
 * @param longitude Longitude (-180 to 180)
 * @returns true if valid
 */
export function validateCoordinates(latitude: number, longitude: number): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    // Avoid exact 0,0 coordinates (likely invalid GPS)
    !(latitude === 0 && longitude === 0)
  );
}


