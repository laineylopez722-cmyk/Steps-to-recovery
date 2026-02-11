/**
 * Secure Logger Utility
 *
 * Provides secure logging with automatic data sanitization to prevent
 * sensitive information from appearing in logs or error tracking services.
 *
 * **Security Features**:
 * - Automatically redacts sensitive fields (encrypted content, keys, tokens)
 * - Sanitizes error stack traces
 * - Redacts long strings and hex values (likely encrypted data)
 * - Development vs production logging modes
 *
 * **Usage**: Always use this logger instead of console.log/error to ensure
 * sensitive recovery data is never logged.
 *
 * @module utils/logger
 * @example
 * ```ts
 * import { logger } from '@/utils/logger';
 *
 * logger.info('User action', { userId, action: 'save' }); // Safe
 * logger.error('Encryption failed', error); // Error sanitized
 * ```
 */

const isDevelopment = process.env.EXPO_PUBLIC_ENV === 'development';

/**
 * List of sensitive field names that should be redacted from logs
 *
 * Any field matching these names (case-insensitive) will be replaced
 * with '[REDACTED]' in log output.
 */
const SENSITIVE_FIELDS = new Set([
  'encrypted_title',
  'encrypted_body',
  'encrypted_answer',
  'encrypted_mood',
  'encrypted_craving',
  'encrypted_tags',
  'encrypted_intention',
  'encrypted_reflection',
  'title',
  'body',
  'answer',
  'content',
  'reflection',
  'intention',
  'password',
  'token',
  'key',
  'secret',
  'iv',
  'salt',
]);

/**
 * Sanitize data to remove sensitive information before logging
 *
 * Recursively processes objects and arrays, redacting:
 * - Fields matching SENSITIVE_FIELDS
 * - Long strings (>100 chars, likely encrypted content)
 * - Hex strings (32+ chars, likely keys/IVs)
 * - Nested sensitive data
 *
 * @param data - Data to sanitize
 * @param depth - Recursion depth (prevents infinite loops)
 * @returns Sanitized data safe for logging
 * @internal
 */
function sanitizeData(data: unknown, depth: number = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]';

  // Null, undefined, primitives
  if (data === null || data === undefined) return data;
  if (typeof data === 'boolean' || typeof data === 'number') return data;

  // Strings
  if (typeof data === 'string') {
    // Redact long strings (likely encrypted data or sensitive content)
    if (data.length > 100) {
      return `[REDACTED_STRING_${data.length}_CHARS]`;
    }
    // Redact hex strings that look like keys/IVs (32+ hex characters)
    if (/^[0-9a-f]{32,}$/i.test(data)) {
      return `[REDACTED_HEX_${data.length}_CHARS]`;
    }
    return data;
  }

  // Arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  // Objects
  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) continue;

      const value = (data as Record<string, unknown>)[key];

      // Check if field name is sensitive
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Check if key contains sensitive keywords
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('encrypted') ||
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret')
      ) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Recursively sanitize nested objects
      sanitized[key] = sanitizeData(value, depth + 1);
    }

    return sanitized;
  }

  return data;
}

/**
 * Sanitize error objects to remove sensitive stack trace information
 *
 * Removes file paths that might contain usernames and redacts
 * sensitive patterns from error messages.
 *
 * @param error - Error object to sanitize
 * @returns Sanitized error object
 * @internal
 */
function sanitizeError(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return sanitizeData(error);
  }

  return {
    name: error.name,
    message: error.message
      .replace(/encrypted_\w+/g, '[ENCRYPTED_FIELD]')
      .replace(/[0-9a-f]{32,}/gi, '[HASH]')
      .replace(/"[^"]{50,}"/g, '[LONG_STRING]'),
    // Only include stack in development
    ...(isDevelopment && {
      stack: error.stack
        ?.split('\n')
        .map((line) => {
          // Redact file paths that might contain usernames
          return line
            .replace(/\/Users\/[^/]+/g, '/Users/[USER]')
            .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\[USER]');
        })
        .join('\n'),
    }),
  };
}

/**
 * Secure logger with automatic data sanitization
 *
 * All logging methods automatically sanitize data before output.
 * In production, logs are minimal to reduce exposure.
 */
export const logger = {
  /**
   * Log an error
   *
   * @param message - Error message
   * @param error - Optional error object (will be sanitized)
   * @example
   * ```ts
   * try {
   *   await riskyOperation();
   * } catch (error) {
   *   logger.error('Operation failed', error);
   * }
   * ```
   */
  error: (message: string, error?: unknown): void => {
    const sanitized = error ? sanitizeError(error) : undefined;

    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, sanitized);
    } else {
      // Production: log without details and send to Sentry with sanitization
      console.error(`[ERROR] ${message}`);

      // Sentry integration (automatically sanitized by sentry.ts beforeSend)
      if (typeof error === 'object' && error !== null) {
        try {
          const { captureException: sentryCaptureException } = require('../lib/sentry');
          sentryCaptureException(error instanceof Error ? error : new Error(message), sanitized);
        } catch {
          // Sentry not configured or failed, silently continue
        }
      }
    }
  },

  /**
   * Log a warning
   *
   * @param message - Warning message
   * @param data - Optional data (will be sanitized)
   */
  warn: (message: string, data?: unknown): void => {
    const sanitized = sanitizeData(data);

    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, sanitized);
    }

    // Add Sentry breadcrumb for warnings (sanitized by sentry beforeBreadcrumb)
    try {
      const { addBreadcrumb: sentryAddBreadcrumb } = require('../lib/sentry');
      sentryAddBreadcrumb('logger', message, sanitized as Record<string, unknown> | undefined);
    } catch {
      // Sentry not configured, silently continue
    }
  },

  /**
   * Log informational message
   *
   * @param message - Info message
   * @param data - Optional data (will be sanitized)
   */
  info: (message: string, data?: unknown): void => {
    const sanitized = sanitizeData(data);

    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.log(`[INFO] ${message}`, sanitized);
    }

    // Add Sentry breadcrumb for info (sanitized by sentry beforeBreadcrumb)
    try {
      const { addBreadcrumb: sentryAddBreadcrumb } = require('../lib/sentry');
      sentryAddBreadcrumb('logger', message, sanitized as Record<string, unknown> | undefined);
    } catch {
      // Sentry not configured, silently continue
    }
  },

  /**
   * Log debug message (development only)
   *
   * @param message - Debug message
   * @param data - Optional data (will be sanitized)
   */
  debug: (message: string, data?: unknown): void => {
    const sanitized = sanitizeData(data);

    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${message}`, sanitized);
    }
  },
};
