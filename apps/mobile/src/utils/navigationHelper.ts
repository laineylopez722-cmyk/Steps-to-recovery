/**
 * Navigation Helper
 *
 * Bridges expo-router-style paths to React Navigation screen names.
 * Provides backward compatibility for components written with expo-router
 * syntax while the app uses React Navigation.
 *
 * **Context**: Components were initially written with expo-router syntax,
 * but the app uses React Navigation. This helper provides backward
 * compatibility during migration.
 *
 * @module utils/navigationHelper
 */

import { useNavigationState } from '@react-navigation/native';
import type { NavigationState, PartialState, Route } from '@react-navigation/native';
import { navigationRef } from '../navigation/navigationRef';
import { logger } from './logger';

/**
 * Navigate using expo-router-style paths
 *
 * Maps expo-router-style paths to React Navigation screens.
 * Handles both static routes and dynamic routes (e.g., `/journal/123`).
 *
 * @param path - expo-router style path (e.g., '/journal', '/(tabs)/emergency')
 * @param params - Optional navigation parameters
 * @example
 * ```ts
 * navigateToPath('/journal');
 * navigateToPath('/journal/abc123', { mode: 'edit' });
 * ```
 */
export function navigateToPath(path: string, params?: Record<string, unknown>): void {
  if (!navigationRef.isReady()) {
    logger.warn('Navigation not ready, cannot navigate', { path });
    return;
  }

  // Remove leading slash and tabs group
  const cleanPath = path.replace(/^\/(tabs\/)?/, '').replace(/^\(tabs\)\//, '');

  try {
    // Map expo-router paths to React Navigation screens
    switch (cleanPath) {
      // Home tab screens
      case 'emergency':
        navigationRef.navigate('MainApp', {
          screen: 'Home',
          params: {
            screen: 'Emergency',
          },
        });
        break;

      case 'checkin':
      case 'reading':
      case 'contacts':
      case 'meetings':
      case 'my-meetings':
      case 'report':
        // These screens don't exist yet in navigation types
        // Navigate to Home tab for now
        navigationRef.navigate('MainApp', {
          screen: 'Home',
          params: {
            screen: 'HomeMain',
          },
        });
        logger.info('Screen not yet implemented, navigating to Home', { requestedPath: path });
        break;

      // Journal screens
      case 'journal':
        navigationRef.navigate('MainApp', {
          screen: 'Journal',
          params: {
            screen: 'JournalList',
          },
        });
        break;

      // Steps screens
      case 'steps':
        navigationRef.navigate('MainApp', {
          screen: 'Steps',
          params: {
            screen: 'StepsOverview',
          },
        });
        break;

      // Profile screens
      case 'profile':
      case 'sponsor':
        navigationRef.navigate('MainApp', {
          screen: 'Profile',
          params: {
            screen: 'ProfileHome',
          },
        });
        break;

      default:
        // Handle dynamic routes (e.g., /journal/123, /meetings/456)
        if (cleanPath.startsWith('journal/')) {
          const entryId = cleanPath.replace('journal/', '');
          navigationRef.navigate('MainApp', {
            screen: 'Journal',
            params: {
              screen: 'JournalEditor',
              params: { mode: 'edit', entryId },
            },
          });
        } else if (cleanPath.startsWith('my-meetings/') || cleanPath.startsWith('meetings/')) {
          // Meetings feature not yet implemented
          navigationRef.navigate('MainApp', {
            screen: 'Home',
            params: {
              screen: 'HomeMain',
            },
          });
          logger.info('Meetings feature not yet implemented', { requestedPath: path });
        } else {
          // Unknown path, navigate to Home
          navigationRef.navigate('MainApp', {
            screen: 'Home',
            params: {
              screen: 'HomeMain',
            },
          });
          logger.warn('Unknown navigation path', { path });
        }
    }
  } catch (error) {
    logger.error('Navigation error', { error, path });
    // Fallback to Home on error
    navigationRef.navigate('MainApp', {
      screen: 'Home',
      params: {
        screen: 'HomeMain',
      },
    });
  }
}

/**
 * Hook that provides expo-router compatible navigation
 *
 * Returns a router-like object compatible with expo-router's `useRouter()` hook.
 * Use this instead of expo-router's `useRouter()` when using React Navigation.
 *
 * @returns Router-like object with push, replace, back, and canGoBack methods
 * @example
 * ```ts
 * const router = useRouterCompat();
 * router.push('/journal');
 * router.back();
 * ```
 */
export function useRouterCompat() {
  return {
    push: (path: string, params?: Record<string, unknown>) => navigateToPath(path, params),
    replace: (path: string, params?: Record<string, unknown>) => navigateToPath(path, params),
    back: () => {
      if (navigationRef.canGoBack()) {
        navigationRef.goBack();
      }
    },
    canGoBack: () => navigationRef.canGoBack(),
  };
}

/**
 * Hook that provides expo-router compatible segments
 *
 * Tracks the current navigation route and returns it as path segments,
 * compatible with expo-router's `useSegments()` hook.
 *
 * @returns Array of path segments (e.g., ['home'], ['journal', 'edit'])
 * @example
 * ```ts
 * const segments = useSegmentsCompat();
 * // On Home screen: ['home']
 * // On Journal List: ['journal']
 * // On Journal Editor: ['journal', 'editor']
 * ```
 */
export function useSegmentsCompat(): string[] {
  const segments = useNavigationState((state) => {
    if (!state) return [];

    const routeSegments: string[] = [];
    let currentState: NavigationState | PartialState<NavigationState> | undefined = state;

    // Traverse the navigation state tree to build segments
    while (currentState) {
      const idx: number = currentState.index ?? 0;
      const route: Route<string> | undefined = currentState.routes[idx] as
        | Route<string>
        | undefined;

      if (!route) break;

      // Add route name to segments (convert to lowercase for consistency)
      const routeName = route.name.toLowerCase();

      // Skip 'MainApp' root navigator, only track tab and screen names
      if (routeName !== 'mainapp') {
        routeSegments.push(routeName);
      }

      // Navigate to nested state if it exists
      // Routes can have nested state for navigators
      const routeWithState = route as { state?: NavigationState | PartialState<NavigationState> };
      currentState = routeWithState.state;
    }

    return routeSegments;
  });

  return segments ?? [];
}
