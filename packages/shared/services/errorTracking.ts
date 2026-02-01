/**
 * Error Tracking Service
 *
 * A centralized error tracking service that can be integrated with Sentry
 * or other error monitoring solutions. Provides a consistent API for error
 * reporting across the application.
 *
 * **Privacy Note**: This service is designed to respect user privacy and
 * does not send sensitive recovery data (journal entries, step work, etc.)
 * to error tracking services.
 *
 * To enable Sentry:
 * 1. Install: `npx expo install @sentry/react-native`
 * 2. Set up Sentry project at https://sentry.io
 * 3. Add `EXPO_PUBLIC_SENTRY_DSN` to your environment variables
 * 4. Uncomment the Sentry initialization below
 *
 * @module services/errorTracking
 */

// Uncomment when Sentry is installed:
// import * as Sentry from '@sentry/react-native';
import React from 'react';

/**
 * Context information for error tracking
 */
export interface ErrorContext {
  /** Component or module name where error occurred */
  component?: string;
  /** Action being performed when error occurred */
  action?: string;
  /** User ID (anonymous, no PII) */
  userId?: string;
  /** Additional context data (must not contain sensitive information) */
  extra?: Record<string, unknown>;
}

/**
 * Breadcrumb data for error tracking
 */
export interface BreadcrumbData {
  /** Category of the breadcrumb (e.g., 'navigation', 'user', 'database') */
  category: string;
  /** Message describing the event */
  message: string;
  /** Severity level */
  level?: 'debug' | 'info' | 'warning' | 'error';
  /** Additional data (must not contain sensitive information) */
  data?: Record<string, unknown>;
}

/**
 * Initialize error tracking service
 *
 * Call this once in your app entry point (e.g., `_layout.tsx` or `App.tsx`).
 * If Sentry DSN is not configured, error tracking will be disabled gracefully.
 *
 * @example
 * ```ts
 * // In App.tsx or _layout.tsx
 * useEffect(() => {
 *   initializeErrorTracking();
 * }, []);
 * ```
 */
export function initializeErrorTracking(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    if (__DEV__) {
      console.log('[ErrorTracking] Sentry DSN not configured. Error tracking disabled.');
      console.log('[ErrorTracking] To enable, set EXPO_PUBLIC_SENTRY_DSN in your environment.');
    }
    return;
  }

  // Uncomment when Sentry is installed:
  // Sentry.init({
  //   dsn,
  //   environment: __DEV__ ? 'development' : 'production',
  //   debug: __DEV__,
  //   enableAutoSessionTracking: true,
  //   sessionTrackingIntervalMillis: 30000,
  //   // Performance monitoring
  //   tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  //   // Enable native crash reporting
  //   enableNativeCrashHandling: true,
  //   // Attach screenshots on error (mobile only)
  //   attachScreenshot: true,
  //   // Privacy: Don't send PII by default
  //   sendDefaultPii: false,
  //   // Filter out sensitive data
  //   beforeSend(event) {
  //     // Remove any sensitive recovery data from breadcrumbs
  //     if (event.breadcrumbs) {
  //       event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
  //         if (breadcrumb.data) {
  //           // Filter out any journal content, step work answers, etc.
  //           const filteredData = { ...breadcrumb.data };
  //           delete filteredData.journalContent;
  //           delete filteredData.stepAnswer;
  //           delete filteredData.reflection;
  //           delete filteredData.gratitude;
  //           breadcrumb.data = filteredData;
  //         }
  //         return breadcrumb;
  //       });
  //     }
  //     return event;
  //   },
  // });

  console.log('[ErrorTracking] Error tracking initialized');
}

/**
 * Capture an exception and send to error tracking service
 *
 * Use this to report errors that occur during app execution.
 * The error will be logged and sent to the configured error tracking service.
 *
 * @param error - The error object to capture
 * @param context - Optional context about where/why the error occurred
 * @example
 * ```ts
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureException(error as Error, {
 *     component: 'JournalScreen',
 *     action: 'saveEntry',
 *   });
 * }
 * ```
 */
export function captureException(error: Error, context?: ErrorContext): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('[ErrorTracking] Exception:', errorMessage, context);

  // Uncomment when Sentry is installed:
  // Sentry.captureException(error, {
  //   tags: {
  //     component: context?.component,
  //     action: context?.action,
  //   },
  //   extra: context?.extra,
  //   user: context?.userId ? { id: context.userId } : undefined,
  // });
}

/**
 * Capture a message (non-error) and send to error tracking service
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext,
): void {
  console.log(`[ErrorTracking] ${level.toUpperCase()}: ${message}`, context);

  // Uncomment when Sentry is installed:
  // Sentry.captureMessage(message, {
  //   level,
  //   tags: {
  //     component: context?.component,
  //     action: context?.action,
  //   },
  //   extra: context?.extra,
  // });
}

/**
 * Add a breadcrumb for debugging context
 */
export function addBreadcrumb(data: BreadcrumbData): void {
  // Uncomment when Sentry is installed:
  // Sentry.addBreadcrumb({
  //   category: data.category,
  //   message: data.message,
  //   level: data.level || 'info',
  //   data: data.data,
  // });
}

/**
 * Set user context for error reports
 * Note: We only set anonymous user ID, no PII
 */
export function setUserContext(userId: string): void {
  // Uncomment when Sentry is installed:
  // Sentry.setUser({ id: userId });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext(): void {
  // Uncomment when Sentry is installed:
  // Sentry.setUser(null);
}

/**
 * Set a tag for filtering errors
 */
export function setTag(key: string, value: string): void {
  // Uncomment when Sentry is installed:
  // Sentry.setTag(key, value);
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string): { finish: () => void } {
  // Uncomment when Sentry is installed:
  // const transaction = Sentry.startTransaction({ name, op });
  // return {
  //   finish: () => transaction.finish(),
  // };

  // Fallback when Sentry is not installed
  const startTime = Date.now();
  return {
    finish: () => {
      const duration = Date.now() - startTime;
      console.log(`[ErrorTracking] Transaction "${name}" (${op}) took ${duration}ms`);
    },
  };
}

/**
 * Wrap a component with error boundary
 * Use this for critical components
 */
class SimpleErrorBoundary extends React.Component<
  { fallback?: React.ReactNode; children?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback?: React.ReactNode; children?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown): void {
    console.error('[ErrorTracking] Error boundary caught error:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? React.createElement(ErrorFallback);
    }
    return this.props.children ?? null;
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
): React.ComponentType<P> {
  // Uncomment when Sentry is installed:
  // return Sentry.withErrorBoundary(Component, {
  //   fallback: fallback || <ErrorFallback />,
  // });

  // Fallback when Sentry is not installed - wrap in a simple boundary
  const WithBoundary: React.ComponentType<P> = (props: P) =>
    React.createElement(
      SimpleErrorBoundary,
      { fallback: fallback ?? React.createElement(ErrorFallback) },
      React.createElement(Component, props),
    );

  WithBoundary.displayName = `WithErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  return WithBoundary;
}

/**
 * Error boundary fallback component
 */
export function ErrorFallback(): React.ReactElement {
  // Basic fallback UI - can be improved as needed
  return React.createElement(
    'div',
    { style: { padding: 24, textAlign: 'center', color: '#a00' } },
    React.createElement('h2', null, 'Something went wrong.'),
    React.createElement('p', null, 'An unexpected error has occurred. Please try again later.'),
  );
}

/**
 * Log navigation events for debugging
 */
export function logNavigation(routeName: string, params?: Record<string, unknown>): void {
  addBreadcrumb({
    category: 'navigation',
    message: `Navigated to ${routeName}`,
    level: 'info',
    data: params,
  });
}

/**
 * Log user actions for debugging
 */
export function logUserAction(action: string, details?: Record<string, unknown>): void {
  addBreadcrumb({
    category: 'user',
    message: action,
    level: 'info',
    data: details,
  });
}

/**
 * Log database operations for debugging
 */
export function logDatabaseOperation(operation: string, table: string, success: boolean): void {
  addBreadcrumb({
    category: 'database',
    message: `${operation} on ${table}`,
    level: success ? 'info' : 'error',
    data: { operation, table, success },
  });
}
