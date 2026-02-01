/**
 * Meeting Guide API Client
 * Fetches meeting data from Meeting Guide standard API
 * @see https://github.com/code4recovery/spec
 */

import { logger } from '../../../utils/logger';
import type { MeetingGuideResponse, CachedMeeting, MeetingSearchParams } from '../types/meeting';

/**
 * Meeting Guide API base URL
 * Using AA San Jose as primary endpoint (follows Meeting Guide spec)
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
 * @param params Search parameters (lat, lng, radius)
 * @returns Array of cached meetings
 * @throws Error if API call fails after retries
 */
export async function searchMeetings(params: MeetingSearchParams): Promise<CachedMeeting[]> {
  const { latitude, longitude, radius_miles } = params;

  logger.info('Searching for meetings', {
    latitude,
    longitude,
    radius_miles,
  });

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

      const data: MeetingGuideResponse[] = await response.json();

      logger.info('Meeting search successful', {
        count: data.length,
        attempt,
      });

      // Transform API response to internal schema
      return data.map(transformMeetingGuideToInternal);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      logger.warn('Meeting search attempt failed', {
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
  logger.error('Meeting search failed', lastError);
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
    id: meeting.id,
    name: meeting.name,
    location: meeting.location,
    address: meeting.address,
    city: meeting.city,
    state: meeting.state || null,
    postal_code: meeting.postal_code || null,
    country: meeting.country || 'US',
    latitude: meeting.latitude,
    longitude: meeting.longitude,
    day_of_week: meeting.day,
    time: meeting.time || null,
    types: JSON.stringify(meeting.types || []),
    notes: meeting.notes || null,
    cached_at: now,
    cache_region: '', // Will be set by cache service
    created_at: now,
    updated_at: now,
  };
}

/**
 * Fetch with timeout
 * @param url URL to fetch
 * @param timeoutMs Timeout in milliseconds
 * @returns Response
 * @throws Error if timeout or network error
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Steps-to-Recovery-App/1.0',
      },
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
