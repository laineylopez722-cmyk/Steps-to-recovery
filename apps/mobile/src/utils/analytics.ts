/**
 * Analytics and Performance Monitoring
 *
 * Provides privacy-safe event tracking and analytics.
 * Currently uses development logging only - ready for production
 * analytics service integration (e.g., Sentry).
 *
 * **Privacy**: No PII (personally identifiable information) is tracked.
 * Only anonymous usage events and feature usage patterns.
 *
 * @module utils/analytics
 */

import { logger } from './logger';

/**
 * Track a user event
 *
 * Logs an anonymous event for analytics. No PII is included.
 *
 * @param eventName - Name of the event to track
 * @param properties - Optional event properties (must not contain PII)
 * @example
 * ```ts
 * trackEvent('button_clicked', { buttonId: 'save_journal' });
 * ```
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>): void {
  if (__DEV__) {
    logger.info(`Event: ${eventName}`, properties);
  }

  // TODO: Send to analytics service in production
  // Sentry.captureMessage(eventName, { extra: properties });
}

/**
 * Track screen views
 *
 * @param screenName - Name of the screen being viewed
 * @example
 * ```ts
 * useEffect(() => {
 *   trackScreen('JournalList');
 * }, []);
 * ```
 */
export function trackScreen(screenName: string): void {
  trackEvent('screen_view', { screen: screenName });
}

/**
 * Track app lifecycle events
 *
 * @param event - Lifecycle event type
 * @example
 * ```ts
 * trackAppEvent('app_open');
 * ```
 */
export function trackAppEvent(event: 'app_open' | 'app_background' | 'app_foreground'): void {
  trackEvent(event);
}

/**
 * Track feature usage
 *
 * Tracks when users interact with key features. No sensitive data is included.
 *
 * @param feature - Feature being used
 * @example
 * ```ts
 * await saveJournalEntry();
 * trackFeatureUsage('journal_created');
 * ```
 */
export function trackFeatureUsage(
  feature: 'journal_created' | 'check_in_completed' | 'step_work_saved' | 'sync_triggered',
): void {
  trackEvent(feature);
}
