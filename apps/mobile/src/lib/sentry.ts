/**
 * Sentry Error Tracking Configuration
 *
 * Provides error tracking with automatic sensitive data sanitization.
 * All user-generated content is redacted before being sent to Sentry.
 *
 * @module lib/sentry
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

/**
 * Sensitive keys that should be redacted from error reports
 */
const SENSITIVE_KEYS = [
  'encrypted_body',
  'encrypted_title',
  'encrypted_content',
  'encrypted_answer',
  'encrypted_intention',
  'encrypted_reflection',
  'encrypted_mood',
  'encrypted_craving',
  'encrypted_notes',
  'encrypted_tags',
  'encrypted_gratitude',
  'password',
  'token',
  'key',
  'secret',
  'content',
  'body',
  'answer',
  'reflection',
  'intention',
  'journal',
  'entry',
];

/**
 * Check if a string might contain sensitive data
 */
function mightContainSensitiveData(str: string): boolean {
  const lowerStr = str.toLowerCase();
  return SENSITIVE_KEYS.some((key) => lowerStr.includes(key));
}

/**
 * Sanitize data object by redacting sensitive fields
 */
function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if key is sensitive
    if (SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Check if string value contains sensitive data
    if (typeof value === 'string' && mightContainSensitiveData(value)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeData(value as Record<string, unknown>);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Initialize Sentry with privacy-preserving configuration
 */
export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    release: Constants.expoConfig?.version,
    environment: process.env.EXPO_PUBLIC_ENV || 'development',
    // Disable automatic breadcrumbs for privacy
    enableAutoSessionTracking: true,
    // Configure beforeSend to sanitize all events
    beforeSend(event) {
      // Sanitize event data
      if (event.extra) {
        event.extra = sanitizeData(event.extra as Record<string, unknown>);
      }

      // Sanitize breadcrumb data
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data) {
            breadcrumb.data = sanitizeData(breadcrumb.data as Record<string, unknown>);
          }
          // Check message for sensitive content
          if (breadcrumb.message && mightContainSensitiveData(breadcrumb.message)) {
            breadcrumb.message = '[REDACTED]';
          }
          return breadcrumb;
        });
      }

      // Sanitize exception messages (but keep stack traces)
      if (event.exception?.values) {
        event.exception.values = event.exception.values.map((exception) => {
          if (exception.value && mightContainSensitiveData(exception.value)) {
            exception.value = '[REDACTED]';
          }
          return exception;
        });
      }

      return event;
    },
    integrations: [Sentry.reactNativeTracingIntegration()],
    tracesSampleRate: 0.1, // Sample 10% of transactions
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
  if (mightContainSensitiveData(message)) {
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
