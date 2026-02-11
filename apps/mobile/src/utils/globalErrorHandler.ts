/**
 * Global Error Handler
 * Catches unhandled promise rejections and uncaught exceptions
 * that escape React error boundaries.
 */
import { logger } from './logger';

// Try to import Sentry dynamically
let captureException: ((error: unknown) => void) | null = null;
try {
   
  const Sentry = require('@sentry/react-native');
  captureException = Sentry.captureException;
} catch {
  // Sentry not available
}

/**
 * Initialize global error handlers
 * Call this once during app startup, before any other code runs.
 */
export function initGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections
  // ErrorUtils is a React Native global for handling JS errors
  const originalHandler = (globalThis as Record<string, unknown>).ErrorUtils
    ? (
        (globalThis as Record<string, unknown>).ErrorUtils as {
          getGlobalHandler: () => (error: Error, isFatal?: boolean) => void;
          setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
        }
      ).getGlobalHandler()
    : null;

  if ((globalThis as Record<string, unknown>).ErrorUtils) {
    (
      (globalThis as Record<string, unknown>).ErrorUtils as {
        setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
      }
    ).setGlobalHandler((error: Error, isFatal?: boolean) => {
      logger.error('Unhandled error', { message: error.message, isFatal });
      if (captureException) {
        captureException(error);
      }
      // Call original handler to preserve default RN behavior
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }

  logger.info('Global error handlers initialized');
}
