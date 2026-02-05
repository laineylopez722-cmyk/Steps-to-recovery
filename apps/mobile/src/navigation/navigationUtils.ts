import { CommonActions, StackActions } from '@react-navigation/native';
import { logger } from '../utils/logger';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Navigation Utilities
 * 
 * Provides centralized navigation helpers for programmatic navigation.
 * 
 * @example
 * ```tsx
 * import { navigationRef, goBack } from './navigation/navigationUtils';
 * 
 * // Go back
 * goBack();
 * ```
 */

// Navigation reference for use outside React components
export const navigationRef = {
  current: null as NavigationContainerRef<RootStackParamList> | null,
};

/**
 * Set the navigation container reference
 * Call this in your root navigation component
 */
export function setNavigationRef(
  ref: NavigationContainerRef<RootStackParamList> | null
): void {
  navigationRef.current = ref;
}

/**
 * Navigate to a screen
 * Note: Use type assertion for screen names to avoid complex type issues
 */
export function navigate(
  name: string,
  params?: Record<string, unknown>
): void {
  if (navigationRef.current) {
    // Use type assertion to avoid complex navigation type issues
    (navigationRef.current.navigate as (name: string, params?: Record<string, unknown>) => void)(name, params);
    logger.debug('Navigation: navigate', { name, params });
  } else {
    logger.warn('Navigation: Navigation ref not set');
  }
}

/**
 * Navigate to nested screen
 */
export function navigateNested(
  parent: string,
  screen: string,
  params?: Record<string, unknown>
): void {
  navigate(parent, { screen, params });
}

/**
 * Navigate to Main App (after login)
 */
export function navigateToMainApp(): void {
  navigate('MainApp');
}

/**
 * Navigate to Auth flow
 */
export function navigateToAuth(screen?: 'Login' | 'SignUp' | 'ForgotPassword'): void {
  if (screen) {
    navigate('Auth', { screen });
  } else {
    navigate('Auth');
  }
}

/**
 * Navigate to a specific tab in the main navigator
 */
export function navigateToMainTab(
  tab: string,
  params?: Record<string, unknown>
): void {
  navigate('MainApp', { screen: tab, params });
}

// Feature navigation helpers
export const featureNavigation = {
  goHome(): void { navigateToMainTab('Home'); },
  goToJournal(): void { navigateToMainTab('Journal'); },
  goToJournalEditor(mode: 'create' | 'edit' = 'create', entryId?: string): void {
    navigateToMainTab('Journal', { screen: 'JournalEditor', params: { mode, entryId } });
  },
  goToSteps(): void { navigateToMainTab('Steps'); },
  goToStepDetail(stepNumber: number): void {
    navigateToMainTab('Steps', { screen: 'StepDetail', params: { stepNumber } });
  },
  goToMeetings(): void { navigateToMainTab('Meetings'); },
  goToMeetingDetail(meetingId: string): void {
    navigateToMainTab('Meetings', { screen: 'MeetingDetail', params: { meetingId } });
  },
  goToProfile(): void { navigateToMainTab('Profile'); },
  goToSponsor(): void { navigateToMainTab('Profile', { screen: 'Sponsor' }); },
  goToMorningIntention(): void { navigateToMainTab('Home', { screen: 'MorningIntention' }); },
  goToEveningPulse(): void { navigateToMainTab('Home', { screen: 'EveningPulse' }); },
  goToEmergency(): void { navigateToMainTab('Home', { screen: 'Emergency' }); },
  goToDailyReading(): void { navigateToMainTab('Home', { screen: 'DailyReading' }); },
  goToProgressDashboard(): void { navigateToMainTab('Home', { screen: 'ProgressDashboard' }); },
};

// Auth navigation helpers
export const authNavigation = {
  goToLogin(): void { navigateToAuth('Login'); },
  goToSignUp(): void { navigateToAuth('SignUp'); },
  goToForgotPassword(): void { navigateToAuth('ForgotPassword'); },
  goToMainApp(): void { navigateToMainApp(); },
  logout(): void { navigateToAuth('Login'); },
};

/**
 * Push a screen onto the stack
 */
export function push(
  name: string,
  params?: Record<string, unknown>
): void {
  if (navigationRef.current) {
    navigationRef.current.dispatch(StackActions.push(name, params));
    logger.debug('Navigation: push', { name, params });
  } else {
    logger.warn('Navigation: Navigation ref not set');
  }
}

/**
 * Replace current screen with new one
 */
export function replace(
  name: string,
  params?: Record<string, unknown>
): void {
  if (navigationRef.current) {
    navigationRef.current.dispatch(StackActions.replace(name, params));
    logger.debug('Navigation: replace', { name, params });
  } else {
    logger.warn('Navigation: Navigation ref not set');
  }
}

/**
 * Go back to previous screen
 */
export function goBack(): void {
  if (navigationRef.current) {
    if (navigationRef.current.canGoBack()) {
      navigationRef.current.goBack();
      logger.debug('Navigation: goBack');
    } else {
      logger.warn('Navigation: Cannot go back');
    }
  } else {
    logger.warn('Navigation: Navigation ref not set');
  }
}

/**
 * Pop to top of stack
 */
export function popToTop(): void {
  if (navigationRef.current) {
    navigationRef.current.dispatch(StackActions.popToTop());
    logger.debug('Navigation: popToTop');
  } else {
    logger.warn('Navigation: Navigation ref not set');
  }
}

/**
 * Pop n screens from stack
 */
export function pop(count: number = 1): void {
  if (navigationRef.current) {
    navigationRef.current.dispatch(StackActions.pop(count));
    logger.debug('Navigation: pop', { count });
  } else {
    logger.warn('Navigation: Navigation ref not set');
  }
}

/**
 * Reset navigation state
 */
export function reset(state: Parameters<typeof CommonActions.reset>[0]): void {
  if (navigationRef.current) {
    navigationRef.current.dispatch(CommonActions.reset(state));
    logger.debug('Navigation: reset');
  } else {
    logger.warn('Navigation: Navigation ref not set');
  }
}

/**
 * Check if can go back
 */
export function canGoBack(): boolean {
  return navigationRef.current?.canGoBack() ?? false;
}

/**
 * Get current route name
 */
export function getCurrentRoute(): string | undefined {
  return navigationRef.current?.getCurrentRoute()?.name;
}

/**
 * Check if currently on a specific screen
 */
export function isCurrentScreen(name: string): boolean {
  return getCurrentRoute() === name;
}

/**
 * Navigate to screen only if not already there
 */
export function navigateIfNotCurrent(
  name: string,
  params?: Record<string, unknown>
): void {
  if (getCurrentRoute() !== name) {
    navigate(name, params);
  } else {
    logger.debug('Navigation: Already on screen', { name });
  }
}

// Deep link handling
export const deepLinkNavigation = {
  handleDeepLink(url: string): void {
    logger.info('Handling deep link', { url });
    
    try {
      const parsed = new URL(url);
      const path = parsed.pathname;

      switch (path) {
        case '/home':
          featureNavigation.goHome();
          break;
        case '/journal':
          featureNavigation.goToJournal();
          break;
        case '/journal/create':
          featureNavigation.goToJournalEditor('create');
          break;
        case '/meetings':
          featureNavigation.goToMeetings();
          break;
        case '/steps':
          featureNavigation.goToSteps();
          break;
        case '/profile':
          featureNavigation.goToProfile();
          break;
        case '/checkin/morning':
          featureNavigation.goToMorningIntention();
          break;
        case '/checkin/evening':
          featureNavigation.goToEveningPulse();
          break;
        case '/emergency':
          featureNavigation.goToEmergency();
          break;
        case '/reading':
          featureNavigation.goToDailyReading();
          break;
        case '/progress':
          featureNavigation.goToProgressDashboard();
          break;
        default: {
          // Try to extract ID from path
          const journalMatch = path.match(/\/journal\/(.+)/);
          if (journalMatch) {
            featureNavigation.goToJournalEditor('edit', journalMatch[1]);
            return;
          }

          const meetingMatch = path.match(/\/meetings\/(.+)/);
          if (meetingMatch) {
            featureNavigation.goToMeetingDetail(meetingMatch[1]);
            return;
          }

          const stepMatch = path.match(/\/steps\/(\d+)/);
          if (stepMatch) {
            featureNavigation.goToStepDetail(parseInt(stepMatch[1], 10));
            return;
          }

          logger.warn('Unknown deep link path', { path });
        }
      }
    } catch (error) {
      logger.error('Failed to handle deep link', { url, error });
    }
  },
};

// Export all utilities
export default {
  setNavigationRef,
  navigate,
  navigateNested,
  navigateToMainApp,
  navigateToAuth,
  navigateToMainTab,
  featureNavigation,
  authNavigation,
  push,
  replace,
  goBack,
  pop,
  popToTop,
  reset,
  canGoBack,
  getCurrentRoute,
  isCurrentScreen,
  navigateIfNotCurrent,
  deepLinkNavigation,
};
