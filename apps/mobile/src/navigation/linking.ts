import type { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { logger } from '../utils/logger';
import type * as types from './types';

/**
 * Deep Linking Configuration
 *
 * Handles navigation via deep links from:
 * - Push notifications
 * - External apps
 * - Universal links (iOS) / App Links (Android)
 *
 * URL Schemes:
 * - recoveryapp:// (custom scheme)
 * - https://recovery.app/ (universal links)
 *
 * Supported Paths:
 * - /home - Home screen
 * - /journal - Journal list
 * - /journal/create - Create new journal entry
 * - /journal/:id - Journal entry detail
 * - /meetings - Meeting finder
 * - /meetings/:id - Meeting detail
 * - /steps - Steps overview
 * - /steps/:number - Step detail
 * - /profile - User profile
 * - /checkin/morning - Morning check-in
 * - /checkin/evening - Evening check-in
 * - /emergency - Emergency screen
 * - /reading - Daily reading
 * - /progress - Progress dashboard
 */

// Prefixes for deep linking
const PREFIXES = [Linking.createURL('/'), 'recoveryapp://', 'https://recovery.app'];

/**
 * Deep link configuration for React Navigation
 */
export const linking: LinkingOptions<types.RootStackParamList> = {
  prefixes: PREFIXES,

  // Configure how to handle incoming links
  config: {
    // Screen mapping for paths
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          SignUp: 'signup',
          ForgotPassword: 'forgot-password',
        },
      },
      Onboarding: 'onboarding',
      MainApp: {
        screens: {
          Home: {
            screens: {
              HomeMain: 'home',
              MorningIntention: 'checkin/morning',
              EveningPulse: 'checkin/evening',
              Emergency: 'emergency',
              DailyReading: 'reading',
              ProgressDashboard: 'progress',
            } as Record<string, string>,
          },
          Journal: {
            screens: {
              JournalList: 'journal',
              JournalEditor: {
                path: 'journal/:mode/:entryId?',
                parse: {
                  mode: (mode: string) => mode as 'create' | 'edit',
                },
              },
            } as Record<
              string,
              string | { path: string; parse: Record<string, (value: string) => unknown> }
            >,
          },
          Steps: {
            screens: {
              StepsOverview: 'steps',
              StepDetail: {
                path: 'steps/:stepNumber',
                parse: {
                  stepNumber: (num: string) => parseInt(num, 10),
                },
              },
              StepReview: {
                path: 'steps/:stepNumber/review',
                parse: {
                  stepNumber: (num: string) => parseInt(num, 10),
                },
              },
            } as Record<
              string,
              string | { path: string; parse: Record<string, (value: string) => unknown> }
            >,
          },
          Meetings: {
            screens: {
              MeetingFinder: 'meetings',
              MeetingDetail: {
                path: 'meetings/:meetingId',
              },
              FavoriteMeetings: 'meetings/favorites',
            } as Record<string, string | { path: string }>,
          },
          Profile: {
            screens: {
              ProfileHome: 'profile',
              Sponsor: 'profile/sponsor',
              InviteSponsor: 'profile/sponsor/invite',
              SharedEntries: 'profile/sponsor/shared/:connectionId',
              ShareEntries: 'profile/sponsor/share/:entryId?',
              NotificationSettings: 'profile/settings/notifications',
              WidgetSettings: 'profile/settings/widget',
            } as Record<string, string>,
          },
        } as Record<string, unknown>,
      },
    },
  },

  // Custom function to handle incoming links
  getInitialURL: async () => {
    // Check if app was opened from a deep link
    const url = await Linking.getInitialURL();

    if (url) {
      logger.info('App opened via deep link', { url });
    }

    return url;
  },

  // Subscribe to incoming links while app is running
  subscribe: (listener) => {
    // Listen for incoming links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      logger.info('Deep link received while app running', { url });
      listener(url);
    });

    return () => {
      // Clean up subscription
      subscription.remove();
    };
  },
};

/**
 * Handle push notification deep links
 * Called when user taps on a notification
 */
export function handleNotificationDeepLink(data: Record<string, unknown>): string | null {
  const screen = data.screen as string | undefined;
  const params = data.params as Record<string, unknown> | undefined;

  if (!screen) {
    logger.warn('Notification missing screen data', { data });
    return null;
  }

  // Build deep link URL based on notification type
  switch (screen) {
    case 'HomeMain':
      if (params?.milestone) {
        return `recoveryapp://home?milestone=${params.milestone}`;
      }
      return 'recoveryapp://home';

    case 'MorningIntention':
      return 'recoveryapp://checkin/morning';

    case 'EveningPulse':
      return 'recoveryapp://checkin/evening';

    case 'Emergency':
      return 'recoveryapp://emergency';

    case 'JournalEditor':
      if (params?.mode && params?.entryId) {
        return `recoveryapp://journal/edit/${params.entryId}`;
      }
      return 'recoveryapp://journal/create';

    case 'JournalList':
      return 'recoveryapp://journal';

    case 'MeetingDetail':
      if (params?.meetingId) {
        return `recoveryapp://meetings/${params.meetingId}`;
      }
      return 'recoveryapp://meetings';

    case 'MeetingFinder':
      return 'recoveryapp://meetings';

    case 'StepsOverview':
      return 'recoveryapp://steps';

    case 'StepDetail':
      if (params?.stepNumber) {
        return `recoveryapp://steps/${params.stepNumber}`;
      }
      return 'recoveryapp://steps';

    case 'ProfileHome':
      return 'recoveryapp://profile';

    case 'Sponsor':
      return 'recoveryapp://profile/sponsor';

    case 'DailyReading':
      return 'recoveryapp://reading';

    case 'ProgressDashboard':
      return 'recoveryapp://progress';

    default:
      logger.warn('Unknown notification screen', { screen });
      return null;
  }
}

/**
 * Create a shareable deep link for content
 */
export function createShareableLink(
  type: 'journal' | 'meeting' | 'step' | 'reading',
  id?: string | number,
): string {
  const baseUrl = 'https://recovery.app';

  switch (type) {
    case 'journal':
      return id ? `${baseUrl}/journal/edit/${id}` : `${baseUrl}/journal`;
    case 'meeting':
      return id ? `${baseUrl}/meetings/${id}` : `${baseUrl}/meetings`;
    case 'step':
      return id ? `${baseUrl}/steps/${id}` : `${baseUrl}/steps`;
    case 'reading':
      return `${baseUrl}/reading`;
    default:
      return baseUrl;
  }
}

/**
 * Create a sponsor invitation link
 */
export function createSponsorInvitationLink(invitationCode: string): string {
  return `https://recovery.app/profile/sponsor/invite/${invitationCode}`;
}

/**
 * Parse a deep link URL and extract relevant information
 */
export function parseDeepLink(url: string): {
  type: string;
  path: string;
  params: Record<string, string>;
} | null {
  try {
    const parsed = Linking.parse(url);

    if (!parsed.path) {
      return null;
    }

    return {
      type: parsed.hostname || 'app',
      path: parsed.path,
      params: (parsed.queryParams as Record<string, string>) || {},
    };
  } catch (error) {
    logger.error('Failed to parse deep link', { url, error });
    return null;
  }
}

/**
 * Check if a URL can be opened by the app
 */
export async function canOpenURL(url: string): Promise<boolean> {
  try {
    return await Linking.canOpenURL(url);
  } catch (error) {
    logger.error('Error checking URL', { url, error });
    return false;
  }
}

/**
 * Open an external URL
 */
export async function openExternalURL(url: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      logger.warn('URL not supported', { url });
      return false;
    }

    await Linking.openURL(url);
    return true;
  } catch (error) {
    logger.error('Error opening URL', { url, error });
    return false;
  }
}

/**
 * Open app settings
 */
export async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch (error) {
    logger.error('Error opening app settings', { error });
  }
}
