/**
 * Meeting Finder Types
 * Supports AA, NA, and other 12-step program meetings
 */

/**
 * Meeting Guide API response format (standardized schema)
 * This is the external API format that we transform to internal CachedMeeting
 */
export interface MeetingGuideResponse {
  id: string;
  name: string;
  slug: string;
  day: number; // 0-6 (Sunday-Saturday), null for daily meetings
  time: string; // HH:MM format (24-hour)
  end_time?: string;
  location: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: number;
  longitude: number;
  region?: string;
  types: string[]; // Meeting type codes (see MeetingType)
  notes?: string;
  updated: string; // ISO timestamp
}

/**
 * Cached meeting (stored locally in SQLite/IndexedDB)
 * Public data - NO encryption required
 */
export interface CachedMeeting {
  id: string;
  name: string;
  location: string;
  address: string;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  latitude: number;
  longitude: number;
  day_of_week: number | null; // 0=Sunday, 6=Saturday, null=daily
  time: string | null; // HH:MM format
  types: string; // JSON stringified array of MeetingType codes
  notes: string | null;
  cached_at: string; // ISO timestamp
  cache_region: string; // "lat,lng,radius" for cache invalidation
  created_at: string;
  updated_at: string;
}

/**
 * Favorite meeting (user's saved meetings)
 * Encrypted - reveals user behavior
 */
export interface FavoriteMeeting {
  id: string;
  user_id: string;
  meeting_id: string; // References CachedMeeting.id
  encrypted_notes: string | null; // User's personal notes (encrypted)
  notification_enabled: number; // 0 or 1 (SQLite boolean)
  created_at: string;
  sync_status: 'pending' | 'synced' | 'failed';
  supabase_id: string | null;
}

/**
 * Meeting with favorite status and distance (for display)
 */
export interface MeetingWithDetails extends CachedMeeting {
  is_favorite: boolean;
  distance_miles: number | null;
  personal_notes?: string; // Decrypted notes if favorited
}

/**
 * Last search location cache
 */
export interface MeetingSearchCache {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  radius_miles: number;
  last_updated: string;
}

/**
 * Meeting type codes (AA/NA standard)
 */
export type MeetingType =
  | 'O' // Open (anyone can attend)
  | 'C' // Closed (alcoholics/addicts only)
  | 'BB' // Big Book study
  | '12x12' // 12 Steps and 12 Traditions
  | 'SP' // Speaker meeting
  | 'D' // Discussion
  | 'W' // Women only
  | 'M' // Men only
  | 'Y' // Young people
  | 'LGBTQ' // LGBTQ
  | 'BE' // Beginners
  | 'ST' // Step meeting
  | 'LIT' // Literature study
  | 'MED' // Meditation
  | 'X' // Wheelchair accessible
  | 'ASL' // American Sign Language
  | 'S'; // Spanish language

/**
 * Day of week for filtering
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Time of day for filtering
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'late_night';

/**
 * Meeting search filters
 */
export interface MeetingFilters {
  day_of_week: DayOfWeek | null;
  time_of_day: TimeOfDay | null;
  meeting_types: MeetingType[];
  max_distance_miles: number;
}

/**
 * Search location (from user's current position or manual address)
 */
export interface SearchLocation {
  latitude: number;
  longitude: number;
  address?: string; // Human-readable address (if from geocoding)
}

/**
 * Meeting API search parameters
 */
export interface MeetingSearchParams {
  latitude: number;
  longitude: number;
  radius_miles: number;
}

/**
 * Cache region identifier
 * Used to invalidate stale cached meetings
 */
export interface CacheRegion {
  latitude: number;
  longitude: number;
  radius_miles: number;
}

/**
 * Helper function to check if a meeting matches filters
 */
export function meetingMatchesFilters(meeting: CachedMeeting, filters: MeetingFilters): boolean {
  // Day filter
  if (filters.day_of_week !== null && meeting.day_of_week !== filters.day_of_week) {
    return false;
  }

  // Time of day filter
  if (filters.time_of_day !== null && meeting.time) {
    const hour = parseInt(meeting.time.split(':')[0], 10);
    const matchesTime =
      (filters.time_of_day === 'morning' && hour >= 5 && hour < 12) ||
      (filters.time_of_day === 'afternoon' && hour >= 12 && hour < 17) ||
      (filters.time_of_day === 'evening' && hour >= 17 && hour < 22) ||
      (filters.time_of_day === 'late_night' && (hour >= 22 || hour < 5));

    if (!matchesTime) {
      return false;
    }
  }

  // Meeting type filter
  if (filters.meeting_types.length > 0) {
    try {
      const meetingTypes = JSON.parse(meeting.types) as string[];
      const hasMatchingType = filters.meeting_types.some((filterType) =>
        meetingTypes.includes(filterType),
      );
      if (!hasMatchingType) {
        return false;
      }
    } catch {
      // Invalid JSON in types field
      return false;
    }
  }

  return true;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Format time from 24-hour to 12-hour format
 */
export function formatMeetingTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format day of week
 */
export function formatDayOfWeek(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'Daily';
}

/**
 * Get human-readable meeting type label
 */
export function getMeetingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    O: 'Open',
    C: 'Closed',
    BB: 'Big Book',
    '12x12': '12 & 12',
    SP: 'Speaker',
    D: 'Discussion',
    W: 'Women',
    M: 'Men',
    Y: 'Young People',
    LGBTQ: 'LGBTQ',
    BE: 'Beginners',
    ST: 'Step Meeting',
    LIT: 'Literature',
    MED: 'Meditation',
    X: 'Wheelchair Accessible',
    ASL: 'ASL',
    S: 'Spanish',
  };
  return labels[type] || type;
}
