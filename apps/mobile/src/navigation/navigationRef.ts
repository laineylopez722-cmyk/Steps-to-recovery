/**
 * Navigation Ref
 * Provides navigation outside of React components (e.g., for notification handling)
 */

import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import type { RootStackParamList, MainTabParamList } from './types';
import type { NotificationPayload, NotificationScreen } from '../types/notifications';
import { logger } from '../utils/logger';

// Create a navigation ref that can be accessed anywhere
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Navigate to a specific screen
 * Use this for navigation from outside of React components
 */
export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.navigate({
        name,
        params,
      }),
    );
  }
}

/**
 * Navigate to a main tab
 * Handles nested navigation to tabs within MainApp
 */
export function navigateToTab(tabName: keyof MainTabParamList) {
  if (navigationRef.isReady()) {
    // Navigate to MainApp with the specific tab
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'MainApp',
        params: {
          screen: tabName,
        },
      }),
    );
  }
}

/**
 * Check if navigation is ready
 */
export function isNavigationReady(): boolean {
  return navigationRef.isReady();
}

/**
 * Navigate based on notification payload
 * Supports nested navigation and screen parameters
 *
 * @param payload - Full notification payload or legacy screen string
 */
export function navigateFromNotification(
  payload: NotificationPayload | NotificationScreen | string | undefined,
): void {
  if (!payload) {
    navigateToTab('Home');
    return;
  }

  // Handle legacy string format (backwards compatibility)
  if (typeof payload === 'string') {
    navigateFromLegacyScreen(payload);
    return;
  }

  // Extract screen and params from payload
  const { screen, params } = payload;

  // Parse screen identifier (format: 'Tab' or 'Tab.Screen')
  const [tab, nestedScreen] = screen.split('.') as [string, string | undefined];

  if (!navigationRef.isReady()) {
    logger.warn('Navigation not ready, cannot handle notification');
    return;
  }

  try {
    // Navigate to nested screen within tab
    if (nestedScreen) {
      navigationRef.dispatch(
        CommonActions.navigate({
          name: 'MainApp',
          params: {
            screen: tab,
            params: {
              screen: nestedScreen,
              params: params || {},
            },
          },
        }),
      );
    } else {
      // Navigate to top-level tab
      navigateToTab(tab as keyof MainTabParamList);
    }

    logger.info('Navigated from notification', { screen, params });
  } catch (error) {
    logger.error('Error navigating from notification', { error, screen, params });
    // Fallback to home on error
    navigateToTab('Home');
  }
}

/**
 * Legacy navigation handler for backwards compatibility
 * Supports old notification format with simple string screen names
 */
function navigateFromLegacyScreen(screen: string): void {
  switch (screen) {
    case 'journal':
      navigateToTab('Journal');
      break;
    case 'checkin':
    case 'MorningIntention':
    case 'EveningPulse':
      navigateToTab('Home');
      break;
    case 'steps':
      navigateToTab('Steps');
      break;
    case 'home':
      navigateToTab('Home');
      break;
    case 'profile':
      navigateToTab('Profile');
      break;
    case 'meeting':
      navigateToTab('Home'); // Meetings accessed from home
      break;
    case 'reading':
    case 'daily-reading':
      navigateToTab('Home'); // Daily reading on home
      break;
    case 'gratitude':
    case 'gratitude-reminder':
      navigateToTab('Journal'); // Gratitude through journal
      break;
    case 'encouragement':
      navigateToTab('Home');
      break;
    default:
      navigateToTab('Home');
  }
}
