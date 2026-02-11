/**
 * Sentry PII Sanitizer
 *
 * Strips personally identifiable information from Sentry events and breadcrumbs.
 * Recovery app data is extremely sensitive — this module ensures no PII
 * (emails, phones, UUIDs, encryption keys, journal content) ever reaches Sentry.
 *
 * @module lib/sentrySanitizer
 */

import type { Event as SentryEvent, Breadcrumb, Exception } from '@sentry/react-native';

/**
 * Regex patterns that match common PII formats
 */
const PII_PATTERNS: readonly RegExp[] = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // email addresses
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // phone numbers
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, // UUIDs
  /encryption_key|master_key|session_token|anon_key/gi, // key references
] as const;

/**
 * Sensitive field names that should always be redacted
 */
const SENSITIVE_KEYS: readonly string[] = [
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
  'plaintext',
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
] as const;

/**
 * Strip PII patterns from a string value
 */
function stripPII(value: string): string {
  let result = value;
  for (const pattern of PII_PATTERNS) {
    // Reset lastIndex for global regexps
    pattern.lastIndex = 0;
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

/**
 * Strip query parameters from URLs that might contain PII
 */
function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.search) {
      parsed.search = '';
      return `${parsed.origin}${parsed.pathname}?[QUERY_REDACTED]`;
    }
    return url;
  } catch {
    // Not a valid URL, strip PII from the raw string
    return stripPII(url);
  }
}

/**
 * Check if a string might contain sensitive data (field names or PII patterns)
 */
export function containsSensitiveData(str: string): boolean {
  const lower = str.toLowerCase();
  if (SENSITIVE_KEYS.some((key) => lower.includes(key))) return true;
  for (const pattern of PII_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(str)) return true;
  }
  return false;
}

/**
 * Check if a field key matches a sensitive field name
 */
function isSensitiveKey(fieldKey: string): boolean {
  const lower = fieldKey.toLowerCase();
  return SENSITIVE_KEYS.some((key) => lower.includes(key));
}

/**
 * Recursively sanitize a data object by redacting sensitive fields and PII patterns
 */
export function sanitizeData(
  data: Record<string, unknown>,
  depth: number = 0,
): Record<string, unknown> {
  if (depth > 10) return { _truncated: true };

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Redact sensitive keys entirely
    if (isSensitiveKey(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    if (typeof value === 'string') {
      // Fully redact values that mention sensitive field names
      if (containsSensitiveData(value)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      // Sanitize URLs with query params
      if (value.startsWith('http://') || value.startsWith('https://')) {
        sanitized[key] = sanitizeURL(value);
      } else {
        sanitized[key] = stripPII(value);
      }
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeData(value as Record<string, unknown>, depth + 1);
      continue;
    }

    if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => {
        if (typeof item === 'string') return stripPII(item);
        if (item && typeof item === 'object') {
          return sanitizeData(item as Record<string, unknown>, depth + 1);
        }
        return item;
      });
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Sanitize a Sentry event by stripping all PII
 *
 * Removes:
 * - User context (except anonymous ID tag)
 * - Email, phone, UUID patterns from all string fields
 * - Sensitive field values (journal content, encryption keys)
 * - Query parameters from URLs
 *
 * Keeps:
 * - Exception type and sanitized stack trace
 * - Device context (OS, app version)
 * - Tags and sanitized breadcrumbs
 */
export function sanitizeEvent(event: SentryEvent): SentryEvent | null {
  // Remove user context entirely — no PII should reach Sentry
  if (event.user) {
    event.user = undefined;
  }

  // Sanitize extra data
  if (event.extra) {
    event.extra = sanitizeData(event.extra as Record<string, unknown>);
  }

  // Sanitize breadcrumbs embedded in the event
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs
      .map((breadcrumb: Breadcrumb) => sanitizeBreadcrumb(breadcrumb))
      .filter((b): b is Breadcrumb => b !== null);
  }

  // Sanitize exception values (keep stack traces, strip PII from messages)
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((exception: Exception) => {
      if (exception.value) {
        exception.value = stripPII(exception.value);
      }
      // Sanitize stack frame file paths
      if (exception.stacktrace?.frames) {
        exception.stacktrace.frames = exception.stacktrace.frames.map((frame) => {
          if (frame.filename) {
            frame.filename = frame.filename
              .replace(/\/Users\/[^/]+/g, '/Users/[USER]')
              .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\[USER]');
          }
          return frame;
        });
      }
      return exception;
    });
  }

  // Sanitize tags
  if (event.tags) {
    const sanitizedTags: Record<string, string> = {};
    for (const [key, value] of Object.entries(event.tags)) {
      if (isSensitiveKey(key)) {
        sanitizedTags[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        sanitizedTags[key] = stripPII(value);
      } else {
        sanitizedTags[key] = String(value);
      }
    }
    event.tags = sanitizedTags;
  }

  // Sanitize request URL query parameters
  if (event.request?.url) {
    event.request.url = sanitizeURL(event.request.url);
  }
  if (event.request?.query_string) {
    event.request.query_string = '[REDACTED]';
  }

  return event;
}

/**
 * Sanitize a Sentry breadcrumb by stripping PII from messages and data
 *
 * Navigation breadcrumbs have their params stripped to prevent
 * entry IDs or user IDs from leaking.
 */
export function sanitizeBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  // Strip PII from message
  if (breadcrumb.message) {
    breadcrumb.message = stripPII(breadcrumb.message);
  }

  // Strip PII from breadcrumb data
  if (breadcrumb.data && typeof breadcrumb.data === 'object') {
    breadcrumb.data = sanitizeData(breadcrumb.data as Record<string, unknown>);

    // Remove navigation params that might contain entry/user IDs
    if (breadcrumb.category === 'navigation' && breadcrumb.data) {
      const navData = breadcrumb.data as Record<string, unknown>;
      if (navData.params) {
        navData.params = '[REDACTED]';
      }
    }
  }

  return breadcrumb;
}
