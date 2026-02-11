/**
 * Sentry Error Tracking Configuration
 *
 * Provides error tracking with automatic sensitive data sanitization.
 * All user-generated content is redacted before being sent to Sentry.
 * PII patterns (emails, phones, UUIDs) are stripped by sentrySanitizer.
 *
 * @module lib/sentry
 */

import * as Sentry from '@sentry/react-native';
import type { ErrorEvent, Breadcrumb } from '@sentry/react-native';
import Constants from 'expo-constants';
import {
  sanitizeEvent,
  sanitizeBreadcrumb,
  sanitizeData,
  containsSensitiveData,
} from './sentrySanitizer';

/**
 * Initialize Sentry with privacy-preserving configuration
 */
export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    // Use console.warn directly to avoid circular dependency with logger
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    release: Constants.expoConfig?.version,
    environment: process.env.EXPO_PUBLIC_ENV || 'development',
    debug: __DEV__,
    enabled: !__DEV__, // Only send events in production
    enableAutoSessionTracking: true,

    // Privacy: Strip ALL PII before sending
    beforeSend(event: ErrorEvent): ErrorEvent | null {
      return sanitizeEvent(event) as ErrorEvent | null;
    },

    // Privacy: Sanitize breadcrumbs as they are recorded
    beforeBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
      return sanitizeBreadcrumb(breadcrumb);
    },

    integrations: [Sentry.reactNativeTracingIntegration()],
    tracesSampleRate: 0.2,
  });
}

/**
 * Set the current user for Sentry tracking
 * Only stores user ID, no PII
 */
export function setSentryUser(userId: string | null): void {
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Capture an exception with sanitized context
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  const sanitizedContext = context ? sanitizeData(context) : {};
  Sentry.captureException(error, { extra: sanitizedContext });
}

/**
 * Add a breadcrumb with sanitized data
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  // Don't add breadcrumbs with sensitive messages
  if (containsSensitiveData(message)) {
    return;
  }

  Sentry.addBreadcrumb({
    category,
    message,
    data: data ? sanitizeData(data) : undefined,
    level: 'info',
  });
}

/**
 * Wrap the root component with Sentry error boundary
 */
export const wrapWithSentry = Sentry.wrap;
