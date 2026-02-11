/**
 * Standardized Hook Error Handler
 *
 * Provides consistent error handling patterns for hooks
 * to replace inconsistent try/catch patterns across the codebase.
 */
import { logger } from './logger';

/**
 * Handle an error in a hook with consistent logging and state management.
 *
 * @param error - The caught error
 * @param context - Description of what operation failed
 * @param setError - Optional state setter for error message
 * @returns Formatted error message string
 */
export function handleHookError(
  error: unknown,
  context: string,
  setError?: (message: string | null) => void,
): string {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  logger.error(`Hook error: ${context}`, error instanceof Error ? error : new Error(message));

  if (setError) {
    setError(message);
  }

  return message;
}

/**
 * Wrap an async operation with standardized error handling.
 * Use in hooks to avoid repetitive try/catch boilerplate.
 *
 * @param operation - The async operation to execute
 * @param context - Description for error logging
 * @param options - Optional callbacks for loading state and error state
 * @returns The result of the operation, or undefined on error
 */
export async function withHookErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  options?: {
    setLoading?: (loading: boolean) => void;
    setError?: (error: string | null) => void;
    onError?: (error: unknown) => void;
  },
): Promise<T | undefined> {
  const { setLoading, setError, onError } = options ?? {};

  try {
    setLoading?.(true);
    setError?.(null);
    const result = await operation();
    return result;
  } catch (error: unknown) {
    handleHookError(error, context, setError);
    onError?.(error);
    return undefined;
  } finally {
    setLoading?.(false);
  }
}
