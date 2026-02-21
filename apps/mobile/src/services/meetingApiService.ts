/**
 * TSML Meeting API Service
 * Aggregates meeting data from multiple TSML-compatible feeds (Meeting Guide spec)
 * @see https://github.com/code4recovery/spec
 *
 * The TSML API publishes flat JSON arrays per data source.
 * This service fetches from multiple feeds and performs client-side
 * distance filtering since the spec has no server-side geo-search.
 */

import { logger } from '../utils/logger';
import { fetchWithTimeout, sleep } from '../utils/network';
import type { CachedMeeting, MeetingSearchParams } from '../features/meetings/types/meeting';
import { calculateDistance } from '../features/meetings/types/meeting';

/**
 * TSML feed response format (Meeting Guide spec)
 * @see https://github.com/code4recovery/spec#specification
 */
export interface TSMLMeeting {
  name: string;
  slug: string;
  day?: number | number[];
  time?: string;
  end_time?: string;
  location?: string;
  address?: string;
  formatted_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: string; // "lat,lng" or "lat1,lng1,lat2,lng2"
  region?: string;
  regions?: string[];
  types?: string[];
  notes?: string;
  location_notes?: string;
  group?: string;
  group_notes?: string;
  updated?: string;
  url?: string;
  conference_url?: string;
  conference_phone?: string;
  approximate?: string;
  entity?: string;
}

/**
 * A TSML-compatible data feed endpoint
 */
interface TSMLFeedSource {
  name: string;
  url: string;
  fellowship: string;
}

/**
 * Known TSML-compatible feed endpoints
 * These follow the Meeting Guide spec and return JSON arrays of meetings
 */
const TSML_FEED_SOURCES: TSMLFeedSource[] = [
  {
    name: 'AA San Jose',
    url: 'https://aasanjose.org/api/meetings',
    fellowship: 'aa',
  },
  {
    name: 'AA Palo Alto',
    url: 'https://sheets.code4recovery.org/storage/12Ga8uwMG4WJ8pZ_SEU7vNETp_aQZ-2yNVsYDFqIwHyE.json',
    fellowship: 'aa',
  },
];

const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Fetch meetings from all TSML-compatible feeds and filter by location
 * @param params Search parameters (lat, lng, radius)
 * @returns Array of meetings within radius, sorted by distance
 */
export async function fetchTSMLMeetings(params: MeetingSearchParams): Promise<CachedMeeting[]> {
  const { latitude, longitude, radius_miles } = params;

  logger.info('Fetching TSML meetings', { latitude, longitude, radius_miles });

  // Fetch from all sources in parallel
  const feedResults = await Promise.allSettled(
    TSML_FEED_SOURCES.map((source) => fetchFeed(source)),
  );

  // Collect all successfully fetched meetings
  const allMeetings: CachedMeeting[] = [];
  let successCount = 0;

  for (let i = 0; i < feedResults.length; i++) {
    const result = feedResults[i];
    const source = TSML_FEED_SOURCES[i];

    if (result.status === 'fulfilled') {
      successCount++;
      allMeetings.push(...result.value);
    } else {
      logger.warn('TSML feed fetch failed', {
        source: source.name,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      });
    }
  }

  if (successCount === 0 && allMeetings.length === 0) {
    logger.warn('All TSML feeds failed, using fallback data');
    return filterByDistance(getFallbackMeetings(), latitude, longitude, radius_miles);
  }

  logger.info('TSML feeds fetched', {
    successCount,
    totalSources: TSML_FEED_SOURCES.length,
    totalMeetings: allMeetings.length,
  });

  // Filter by distance and sort
  return filterByDistance(allMeetings, latitude, longitude, radius_miles);
}

/**
 * Get a single meeting by ID from cached/fetched data
 * @param id Meeting ID (slug)
 * @param allMeetings Array of meetings to search
 * @returns Meeting or null
 */
export function getMeetingById(id: string, allMeetings: CachedMeeting[]): CachedMeeting | null {
  return allMeetings.find((m) => m.id === id) ?? null;
}

/**
 * Get meetings near a location (convenience wrapper)
 * @param latitude User latitude
 * @param longitude User longitude
 * @param radiusMiles Search radius in miles (default 10)
 * @returns Array of nearby meetings sorted by distance
 */
export async function getNearbyMeetings(
  latitude: number,
  longitude: number,
  radiusMiles: number = 10,
): Promise<CachedMeeting[]> {
  return fetchTSMLMeetings({
    latitude,
    longitude,
    radius_miles: radiusMiles,
  });
}

/**
 * Fetch a single TSML feed with retry logic
 */
async function fetchFeed(source: TSMLFeedSource): Promise<CachedMeeting[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(source.url, REQUEST_TIMEOUT_MS);

      if (!response.ok) {
        throw new Error(`Feed ${source.name} returned status ${response.status}`);
      }

      const rawBody = await response.text();
      let data: unknown;

      try {
        data = JSON.parse(rawBody);
      } catch {
        throw new Error(`Feed ${source.name} returned invalid JSON`);
      }

      if (!Array.isArray(data)) {
        throw new Error(`Feed ${source.name} returned non-array payload`);
      }

      return data
        .filter((item): item is TSMLMeeting => isValidTSMLMeeting(item))
        .flatMap((item) => transformTSMLMeeting(item, source.fellowship));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch feed ${source.name}`);
}

/**
 * Validate that an object looks like a TSML meeting
 */
function isValidTSMLMeeting(item: unknown): item is TSMLMeeting {
  if (!item || typeof item !== 'object') return false;
  const meeting = item as Record<string, unknown>;
  return typeof meeting.name === 'string' && typeof meeting.slug === 'string';
}

/**
 * Transform a TSML meeting to the internal CachedMeeting format
 * A single TSML meeting with multiple days becomes multiple CachedMeeting entries
 */
function transformTSMLMeeting(meeting: TSMLMeeting, fellowship: string): CachedMeeting[] {
  const now = new Date().toISOString();
  const coords = parseCoordinates(meeting);
  const address = parseAddress(meeting);

  // Handle day as array (meeting occurs on multiple days)
  const days: (number | null)[] = Array.isArray(meeting.day)
    ? meeting.day
    : typeof meeting.day === 'number'
      ? [meeting.day]
      : [null];

  return days.map((day, index) => {
    const id = days.length > 1 ? `${meeting.slug}-${index}` : meeting.slug;

    return {
      id,
      name: meeting.name.trim(),
      location: meeting.location?.trim() || meeting.group?.trim() || 'Location unavailable',
      address: address.street,
      city: address.city,
      state: address.state,
      postal_code: address.postalCode,
      country: address.country,
      latitude: coords.latitude,
      longitude: coords.longitude,
      day_of_week: day,
      time: meeting.time || null,
      types: JSON.stringify(meeting.types ?? []),
      notes: buildNotes(meeting, fellowship),
      cached_at: now,
      cache_region: '',
      created_at: now,
      updated_at: meeting.updated ? new Date(meeting.updated).toISOString() : now,
    };
  });
}

/**
 * Parse coordinates from TSML meeting
 * Supports: latitude/longitude fields, coordinates string, or formatted_address geocoding
 */
function parseCoordinates(meeting: TSMLMeeting): { latitude: number; longitude: number } {
  // Direct lat/lng fields
  if (
    typeof meeting.latitude === 'number' &&
    typeof meeting.longitude === 'number' &&
    Number.isFinite(meeting.latitude) &&
    Number.isFinite(meeting.longitude)
  ) {
    return { latitude: meeting.latitude, longitude: meeting.longitude };
  }

  // Coordinates string ("lat,lng" or "lat1,lng1,lat2,lng2" for bounding box)
  if (typeof meeting.coordinates === 'string' && meeting.coordinates.length > 0) {
    const parts = meeting.coordinates.split(',').map((s) => parseFloat(s.trim()));

    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      if (parts.length === 4 && parts.every(Number.isFinite)) {
        // Bounding box: use center point
        return {
          latitude: (parts[0] + parts[2]) / 2,
          longitude: (parts[1] + parts[3]) / 2,
        };
      }
      return { latitude: parts[0], longitude: parts[1] };
    }
  }

  return { latitude: 0, longitude: 0 };
}

/**
 * Parse address from TSML meeting
 * Supports both individual fields and formatted_address
 */
function parseAddress(meeting: TSMLMeeting): {
  street: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
} {
  if (meeting.address || meeting.city) {
    return {
      street: meeting.address?.trim() || 'Address unavailable',
      city: meeting.city?.trim() || 'City unavailable',
      state: meeting.state || null,
      postalCode: meeting.postal_code || null,
      country: meeting.country || 'US',
    };
  }

  // Parse formatted_address (e.g. "670 E Meadow Dr, Palo Alto, CA 94306, USA")
  if (meeting.formatted_address) {
    const parts = meeting.formatted_address.split(',').map((s) => s.trim());

    if (parts.length >= 3) {
      const stateZipParts = parts[parts.length - 2].trim().split(/\s+/);
      return {
        street: parts.slice(0, parts.length - 2).join(', '),
        city: parts.length >= 4 ? parts[parts.length - 3] : parts[0],
        state: stateZipParts[0] || null,
        postalCode: stateZipParts[1] || null,
        country: parts[parts.length - 1] || 'US',
      };
    }

    return {
      street: meeting.formatted_address,
      city: 'City unavailable',
      state: null,
      postalCode: null,
      country: 'US',
    };
  }

  return {
    street: 'Address unavailable',
    city: 'City unavailable',
    state: null,
    postalCode: null,
    country: 'US',
  };
}

/**
 * Build notes string from TSML meeting fields
 */
function buildNotes(meeting: TSMLMeeting, fellowship: string): string | null {
  const parts: string[] = [];

  if (fellowship) {
    parts.push(`Fellowship: ${fellowship.toUpperCase()}`);
  }

  if (meeting.notes) {
    parts.push(meeting.notes);
  }

  if (meeting.location_notes) {
    parts.push(meeting.location_notes);
  }

  if (meeting.conference_url) {
    parts.push(`Online: ${meeting.conference_url}`);
  }

  if (meeting.conference_phone) {
    parts.push(`Phone: ${meeting.conference_phone}`);
  }

  return parts.length > 0 ? parts.join('\n') : null;
}

/**
 * Filter meetings by distance from a point and sort by proximity
 */
function filterByDistance(
  meetings: CachedMeeting[],
  latitude: number,
  longitude: number,
  radiusMiles: number,
): CachedMeeting[] {
  return meetings
    .map((meeting) => {
      // Skip meetings without valid coordinates
      if (meeting.latitude === 0 && meeting.longitude === 0) {
        return null;
      }

      const distance = calculateDistance(latitude, longitude, meeting.latitude, meeting.longitude);

      if (distance > radiusMiles) {
        return null;
      }

      return { meeting, distance };
    })
    .filter((entry): entry is { meeting: CachedMeeting; distance: number } => entry !== null)
    .sort((a, b) => a.distance - b.distance)
    .map(({ meeting }) => meeting);
}

/**
 * Fallback meetings for when all API feeds are unavailable
 * Contains a small set of well-known meeting locations across major US cities
 */
function getFallbackMeetings(): CachedMeeting[] {
  const now = new Date().toISOString();

  const fallbackData: Array<{
    id: string;
    name: string;
    location: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    lat: number;
    lng: number;
    day: number;
    time: string;
    types: string[];
  }> = [
    {
      id: 'fallback-nyc-1',
      name: 'Perry Street Workshop',
      location: 'Perry Street Workshop',
      address: '46 Perry St',
      city: 'New York',
      state: 'NY',
      postalCode: '10014',
      lat: 40.7352,
      lng: -74.0003,
      day: 1,
      time: '18:30',
      types: ['O', 'D'],
    },
    {
      id: 'fallback-nyc-2',
      name: 'Mustard Seed Group',
      location: 'Jan Hus Church',
      address: '351 E 74th St',
      city: 'New York',
      state: 'NY',
      postalCode: '10021',
      lat: 40.7694,
      lng: -73.9568,
      day: 0,
      time: '10:30',
      types: ['O', 'SP'],
    },
    {
      id: 'fallback-la-1',
      name: 'Courage to Change',
      location: 'West Hollywood Recovery Center',
      address: '626 N Robertson Blvd',
      city: 'West Hollywood',
      state: 'CA',
      postalCode: '90069',
      lat: 34.0838,
      lng: -118.3844,
      day: 2,
      time: '19:00',
      types: ['O', 'D'],
    },
    {
      id: 'fallback-chi-1',
      name: 'Lincoln Park Group',
      location: 'Lincoln Park Alano Club',
      address: '2100 N Seminary Ave',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60614',
      lat: 41.9206,
      lng: -87.6538,
      day: 3,
      time: '20:00',
      types: ['C', 'D'],
    },
    {
      id: 'fallback-sf-1',
      name: 'Fellowship of the Spirit',
      location: 'Central Office',
      address: '1821 Sacramento St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94109',
      lat: 37.7909,
      lng: -122.4262,
      day: 4,
      time: '12:00',
      types: ['O', 'BB'],
    },
    {
      id: 'fallback-sj-1',
      name: 'Primary Purpose',
      location: 'Alano Club of San Jose',
      address: '1122 Fair Ave',
      city: 'San Jose',
      state: 'CA',
      postalCode: '95122',
      lat: 37.3337,
      lng: -121.8464,
      day: 5,
      time: '19:30',
      types: ['C', 'ST'],
    },
  ];

  return fallbackData.map((item) => ({
    id: item.id,
    name: item.name,
    location: item.location,
    address: item.address,
    city: item.city,
    state: item.state,
    postal_code: item.postalCode,
    country: 'US',
    latitude: item.lat,
    longitude: item.lng,
    day_of_week: item.day,
    time: item.time,
    types: JSON.stringify(item.types),
    notes: 'Fellowship: AA\nNote: This is cached fallback data. Pull to refresh for live listings.',
    cached_at: now,
    cache_region: '',
    created_at: now,
    updated_at: now,
  }));
}



