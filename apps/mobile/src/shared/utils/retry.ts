/**
 * Retry Utilities
 *
 * Provides retry logic for operations that may fail due to transient errors,
 * with exponential backoff and configurable retry policies.
 */

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: unknown) => boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  retryCondition: (error: unknown) => {
    // Retry on network errors, timeouts, and database locks
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('database is locked') ||
        message.includes('busy') ||
        message.includes('connection') ||
        message.includes('temporary')
      );
    }
    return false;
  },
};

/**
 * Calculate delay for exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.baseDelay * Math.pow(options.backoffFactor, attempt - 1);
  return Math.min(delay, options.maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async operation with retry logic
 *
 * @param operation - Async function to retry
 * @param options - Retry configuration
 * @returns Promise resolving to operation result
 * @throws Last error if all retry attempts fail
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => database.runAsync('INSERT ...', values),
 *   { maxAttempts: 3, baseDelay: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt or if error is not retryable
      if (attempt === config.maxAttempts || !config.retryCondition(error)) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, config);
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError;
}

/**
 * Execute an operation with timeout
 *
 * @param operation - Async function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise resolving to operation result
 * @throws TimeoutError if operation exceeds timeout
 *
 * @example
 * ```ts
 * const result = await withTimeout(
 *   () => slowDatabaseQuery(),
 *   5000 // 5 second timeout
 * );
 * ```
 */
export async function withTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    operation()
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

/**
 * Timeout error class
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Execute operation with both retry and timeout
 *
 * @param operation - Async function to execute
 * @param retryOptions - Retry configuration
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise resolving to operation result
 */
export async function withRetryAndTimeout<T>(
  operation: () => Promise<T>,
  retryOptions: RetryOptions = {},
  timeoutMs: number = 10000,
): Promise<T> {
  return withRetry(() => withTimeout(operation, timeoutMs), retryOptions);
}
