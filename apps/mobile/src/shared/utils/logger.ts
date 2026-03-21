/**
 * Secure Logger Utility for Shared Package
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
 * import { logger } from '@/shared/utils/logger';
 *
 * logger.info('User action', { userId, action: 'save' }); // Safe
 * logger.error('Encryption failed', error); // Error sanitized
 * ```
 */

const getIsDevelopment = (): boolean => {
  try {
    return (
      process?.env?.EXPO_PUBLIC_ENV === 'development' || process?.env?.NODE_ENV === 'development'
    );
  } catch {
    return false;
  }
};

const isDevelopment = getIsDevelopment();

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
  'encrypted_takeaways',
  'encrypted_learned',
  'encrypted_quote',
  'encrypted_notes',
  'encrypted_share',
  'title',
  'body',
  'answer',
  'content',
  'reflection',
  'intention',
  'takeaways',
  'learned',
  'quote',
  'notes',
  'share',
  'password',
  'token',
  'key',
  'secret',
  'iv',
  'salt',
  'authorization',
  'cookie',
  'session',
  'apikey',
  'api_key',
  'private_key',
  'privatekey',
]);

/**
 * Keywords that indicate a field contains sensitive data
 */
const SENSITIVE_KEYWORDS = ['encrypted', 'password', 'token', 'secret', 'credential', 'auth'];

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
function sanitizeData(data: unknown, depth = 0): unknown {
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
    // Redact base64 strings that look like encoded secrets (44+ chars)
    if (/^[A-Za-z0-9+/]{44,}={0,2}$/.test(data)) {
      return `[REDACTED_BASE64_${data.length}_CHARS]`;
    }
    return data;
  }

  // Arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  // Objects
  if (typeof data === 'object') {
    // Handle circular references
    const seen = new WeakSet();
    if (seen.has(data as object)) {
      return '[CIRCULAR]';
    }
    seen.add(data as object);

    const sanitized: Record<string, unknown> = {};

    for (const key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) continue;

      const value = (data as Record<string, unknown>)[key];
      const lowerKey = key.toLowerCase();

      // Check if field name is sensitive
      if (SENSITIVE_FIELDS.has(lowerKey)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Check if key contains sensitive keywords
      if (SENSITIVE_KEYWORDS.some((keyword) => lowerKey.includes(keyword))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Recursively sanitize nested objects
      sanitized[key] = sanitizeData(value, depth + 1);
    }

    return sanitized;
  }

  // Functions and other types
  if (typeof data === 'function') {
    return '[FUNCTION]';
  }

  if (typeof data === 'symbol') {
    return '[SYMBOL]';
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

  const sanitizedMessage = error.message
    .replace(/encrypted_\w+/g, '[ENCRYPTED_FIELD]')
    .replace(/[0-9a-f]{32,}/gi, '[HASH]')
    .replace(/"[^"]{50,}"/g, '[LONG_STRING]')
    .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [TOKEN]');

  const result: Record<string, unknown> = {
    name: error.name,
    message: sanitizedMessage,
  };

  // Only include stack in development
  if (isDevelopment && error.stack) {
    result.stack = error.stack
      .split('\n')
      .map((line) => {
        // Redact file paths that might contain usernames
        return line
          .replace(/\/Users\/[^/]+/g, '/Users/[USER]')
          .replace(/\/home\/[^/]+/g, '/home/[USER]')
          .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\[USER]');
      })
      .join('\n');
  }

  // Include cause if present (ES2022+)
  if ('cause' in error && error.cause !== undefined) {
    result.cause = sanitizeError(error.cause);
  }

  return result;
}

/**
 * Format log output consistently
 */
function formatLogArgs(message: string, data?: unknown): unknown[] {
  if (data === undefined) {
    return [message];
  }
  return [message, data];
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
    const timestamp = new Date().toISOString();
    const sanitized = error !== undefined ? sanitizeError(error) : undefined;

    if (isDevelopment) {
      console.error(`[ERROR] [${timestamp}] ${message}`, ...formatLogArgs('', sanitized).slice(1));
    } else {
      // Production: log with timestamp but without sensitive details
      console.error(`[ERROR] [${timestamp}] ${message}`);
    }
  },

  /**
   * Log a warning
   *
   * @param message - Warning message
   * @param data - Optional data (will be sanitized)
   */
  warn: (message: string, data?: unknown): void => {
    if (!isDevelopment) return;

    const timestamp = new Date().toISOString();
    const sanitized = data !== undefined ? sanitizeData(data) : undefined;
    console.warn(`[WARN] [${timestamp}] ${message}`, ...formatLogArgs('', sanitized).slice(1));
  },

  /**
   * Log informational message
   *
   * @param message - Info message
   * @param data - Optional data (will be sanitized)
   */
  info: (message: string, data?: unknown): void => {
    if (!isDevelopment) return;

    const timestamp = new Date().toISOString();
    const sanitized = data !== undefined ? sanitizeData(data) : undefined;
    console.log(`[INFO] [${timestamp}] ${message}`, ...formatLogArgs('', sanitized).slice(1));
  },

  /**
   * Log debug message (development only)
   *
   * @param message - Debug message
   * @param data - Optional data (will be sanitized)
   */
  debug: (message: string, data?: unknown): void => {
    if (!isDevelopment) return;

    const timestamp = new Date().toISOString();
    const sanitized = data !== undefined ? sanitizeData(data) : undefined;
    console.debug(`[DEBUG] [${timestamp}] ${message}`, ...formatLogArgs('', sanitized).slice(1));
  },

  /**
   * Log a trace message with full stack (development only)
   *
   * @param message - Trace message
   * @param data - Optional data (will be sanitized)
   */
  trace: (message: string, data?: unknown): void => {
    if (!isDevelopment) return;

    const timestamp = new Date().toISOString();
    const sanitized = data !== undefined ? sanitizeData(data) : undefined;
    console.trace(`[TRACE] [${timestamp}] ${message}`, ...formatLogArgs('', sanitized).slice(1));
  },
};
