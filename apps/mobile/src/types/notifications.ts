/**
 * Notification Deep Linking Types
 *
 * Type definitions for notification payloads that support
 * deep linking to nested screens with parameters.
 */

/**
 * Notification deep link payload structure
 * Supports nested navigation and screen parameters
 */
export interface NotificationPayload {
  // Navigation target (format: 'Tab' or 'Tab.Screen')
  screen: NotificationScreen;

  // Optional parameters for screens that need them
  params?: NotificationParams;

  // Notification metadata for categorization
  type: NotificationType;

  // Index signature for compatibility with expo-notifications Record<string, unknown>
  [key: string]: unknown;
}

/**
 * Screen identifiers for deep linking
 * Format: 'Tab' for top-level tabs, 'Tab.Screen' for nested screens
 */
export type NotificationScreen =
  // Home stack screens
  | 'Home'
  | 'Home.MorningIntention'
  | 'Home.EveningPulse'
  | 'Home.Emergency'

  // Journal stack screens
  | 'Journal'
  | 'Journal.Editor'

  // Steps stack screens
  | 'Steps'
  | 'Steps.Detail'

  // Profile stack screens
  | 'Profile'
  | 'Profile.Sponsor'
  | 'Profile.SharedEntries'
  | 'Profile.NotificationSettings';

/**
 * Parameters for screens that require them
 * All fields are optional - screens should handle undefined gracefully
 */
export interface NotificationParams {
  // Journal editor parameters
  entryId?: string;
  mode?: 'create' | 'edit';

  // Step detail parameters
  stepNumber?: number;

  // Shared entries parameters
  connectionId?: string;

  // Milestone parameters
  days?: number;
}

/**
 * Notification types for categorization and analytics
 */
export type NotificationType =
  | 'morning-checkin'
  | 'evening-checkin'
  | 'daily-reading'
  | 'gratitude-reminder'
  | 'encouragement'
  | 'milestone'
  | 'journal-reminder'
  | 'step-reminder'
  | 'test';
