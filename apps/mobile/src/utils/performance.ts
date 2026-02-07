import { InteractionManager } from 'react-native';
import { logger } from './logger';

/**
 * Performance Monitoring Utilities
 *
 * Provides tools for measuring and monitoring app performance:
 * - Component render time tracking
 * - Screen transition timing
 * - Interaction completion tracking
 * - Memory usage monitoring (where available)
 * - FPS monitoring helpers
 *
 * Usage:
 * ```tsx
 * // In a component
 * useEffect(() => {
 *   const endTracking = trackRenderTime('MyComponent');
 *   return () => endTracking();
 * }, []);
 *
 * // Track async operation
 * const duration = await measureAsync('fetchData', async () => {
 *   return await fetchData();
 * });
 * ```
 */

// Store for active performance measurements
const activeMeasurements = new Map<string, number>();

/**
 * Track component render time
 * Returns a function to call when component unmounts or render completes
 */
export function trackRenderTime(componentName: string): () => void {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;

    // Only log slow renders (> 16ms for 60fps, > 33ms for 30fps)
    if (duration > 16) {
      logger.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`);
    } else {
      logger.debug(`Render: ${componentName} took ${duration.toFixed(2)}ms`);
    }
  };
}

/**
 * Measure async operation duration
 */
export async function measureAsync<T>(
  operationName: string,
  operation: () => Promise<T>,
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await operation();
    const duration = performance.now() - startTime;

    logger.debug(`Async operation: ${operationName} took ${duration.toFixed(2)}ms`);

    // Warn about slow operations
    if (duration > 1000) {
      logger.warn(`Slow async operation: ${operationName} took ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`Async operation failed: ${operationName} after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Measure sync operation duration
 */
export function measureSync<T>(operationName: string, operation: () => T): T {
  const startTime = performance.now();

  try {
    const result = operation();
    const duration = performance.now() - startTime;

    logger.debug(`Sync operation: ${operationName} took ${duration.toFixed(2)}ms`);

    // Warn about slow operations on JS thread
    if (duration > 100) {
      logger.warn(
        `Heavy sync operation: ${operationName} took ${duration.toFixed(2)}ms. Consider offloading to async.`,
      );
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`Sync operation failed: ${operationName} after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Start a performance measurement
 * Use in conjunction with endMeasurement
 */
export function startMeasurement(measurementName: string): void {
  activeMeasurements.set(measurementName, performance.now());
}

/**
 * End a performance measurement and log the result
 */
export function endMeasurement(measurementName: string): number {
  const startTime = activeMeasurements.get(measurementName);

  if (startTime === undefined) {
    logger.warn(`No active measurement found for: ${measurementName}`);
    return 0;
  }

  const duration = performance.now() - startTime;
  activeMeasurements.delete(measurementName);

  logger.debug(`Measurement: ${measurementName} took ${duration.toFixed(2)}ms`);

  return duration;
}

/**
 * Run a task after all interactions/animations complete
 * Useful for deferring non-critical work
 */
export function runAfterInteractions<T>(task: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    InteractionManager.runAfterInteractions(() => {
      try {
        const result = task();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Create a debounced function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Create a throttled function for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Hook-compatible performance marker
 * Use this to mark significant events in component lifecycle
 */
export function markPerformance(eventName: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(eventName);
    logger.debug(`Performance mark: ${eventName}`);
  }
}

/**
 * Measure between two performance marks
 */
export function measureBetweenMarks(
  measureName: string,
  startMark: string,
  endMark: string,
): number | null {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(measureName, startMark, endMark);

      // Get the measurement
      const entries = performance.getEntriesByName(measureName);
      const duration = entries[entries.length - 1]?.duration;

      if (duration !== undefined) {
        logger.debug(`Performance measure: ${measureName} = ${duration.toFixed(2)}ms`);
        return duration;
      }
    } catch (error) {
      logger.warn(`Failed to measure performance: ${measureName}`, error);
    }
  }
  return null;
}

/**
 * Clear all performance marks and measures
 */
export function clearPerformanceMetrics(): void {
  if (typeof performance !== 'undefined') {
    performance.clearMarks?.();
    performance.clearMeasures?.();
  }
  activeMeasurements.clear();
}

// Performance budget thresholds (in milliseconds)
const PERFORMANCE_BUDGETS = {
  componentRender: 16, // 60fps frame budget
  screenTransition: 300, // Screen transition should feel instant
  asyncOperation: 1000, // Async operations should complete quickly
  listScroll: 16, // List scrolling must be 60fps
};

/**
 * Check if duration meets performance budget
 */
export function checkPerformanceBudget(
  metricName: keyof typeof PERFORMANCE_BUDGETS,
  duration: number,
): { withinBudget: boolean; budget: number; overBy: number } {
  const budget = PERFORMANCE_BUDGETS[metricName];
  const withinBudget = duration <= budget;
  const overBy = withinBudget ? 0 : duration - budget;

  if (!withinBudget) {
    logger.warn(
      `Performance budget exceeded for ${metricName}: ${duration.toFixed(2)}ms ` +
        `(budget: ${budget}ms, over by: ${overBy.toFixed(2)}ms)`,
    );
  }

  return { withinBudget, budget, overBy };
}

/**
 * Get memory usage information (if available)
 */
export function getMemoryInfo(): {
  usedJSHeapSize: number | null;
  totalJSHeapSize: number | null;
  jsHeapSizeLimit: number | null;
} {
  const memory = (
    performance as unknown as {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    }
  ).memory;

  if (memory) {
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }

  return {
    usedJSHeapSize: null,
    totalJSHeapSize: null,
    jsHeapSizeLimit: null,
  };
}

/**
 * Log current memory usage
 */
export function logMemoryUsage(): void {
  const memory = getMemoryInfo();

  if (memory.usedJSHeapSize !== null) {
    const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
    const totalMB = memory.totalJSHeapSize
      ? (memory.totalJSHeapSize / 1024 / 1024).toFixed(2)
      : 'N/A';
    const limitMB = memory.jsHeapSizeLimit
      ? (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
      : 'N/A';

    logger.debug(`Memory usage: ${usedMB}MB / ${totalMB}MB (limit: ${limitMB}MB)`);
  } else {
    logger.debug('Memory info not available');
  }
}

/**
 * Monitor memory usage and warn if high
 */
export function monitorMemoryUsage(thresholdPercent: number = 80): void {
  const memory = getMemoryInfo();

  if (memory.usedJSHeapSize !== null && memory.jsHeapSizeLimit !== null) {
    const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    if (usagePercent > thresholdPercent) {
      logger.warn(`High memory usage detected: ${usagePercent.toFixed(1)}%`);
    }
  }
}
