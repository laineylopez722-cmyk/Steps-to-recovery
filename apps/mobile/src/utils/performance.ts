import { InteractionManager, type EventSubscription } from 'react-native';
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
 * - Cold start measurement
 * - Database initialization tracking
 * - Performance metrics reporting
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
 *
 * // Measure cold start
 * measureColdStart();
 *
 * // Measure screen load
 * measureScreenLoad('HomeScreen');
 * ```
 */

// Store for active performance measurements
const activeMeasurements = new Map<string, number>();

// Store for performance metrics history
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  type: 'render' | 'async' | 'sync' | 'screen' | 'database' | 'cold_start';
  metadata?: Record<string, unknown>;
}

const metricsHistory: PerformanceMetric[] = [];
const MAX_METRICS_HISTORY = 100;

// Cold start tracking
let coldStartTime: number | null = null;
let isColdStartComplete = false;

// Screen load tracking
const screenLoadTimes = new Map<string, number>();

// Database initialization tracking
let databaseInitStartTime: number | null = null;
let databaseInitEndTime: number | null = null;

/**
 * Add metric to history
 */
function addMetric(metric: PerformanceMetric): void {
  metricsHistory.push(metric);

  // Keep only last N metrics
  if (metricsHistory.length > MAX_METRICS_HISTORY) {
    metricsHistory.shift();
  }
}

/**
 * Track component render time
 * Returns a function to call when component unmounts or render completes
 */
export function trackRenderTime(componentName: string): () => void {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;

    addMetric({
      name: componentName,
      duration,
      timestamp: Date.now(),
      type: 'render',
    });

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

    addMetric({
      name: operationName,
      duration,
      timestamp: Date.now(),
      type: 'async',
    });

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

    addMetric({
      name: operationName,
      duration,
      timestamp: Date.now(),
      type: 'sync',
    });

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
 * Measure app cold start time
 * Call this at app launch and when app becomes interactive
 */
export function measureColdStart(): void {
  if (isColdStartComplete) {
    return; // Only measure once
  }

  if (coldStartTime === null) {
    // First call - mark start
    coldStartTime = performance.now();
    logger.debug('Cold start measurement began');
  } else {
    // Second call - calculate duration
    const duration = performance.now() - coldStartTime;
    isColdStartComplete = true;

    addMetric({
      name: 'cold_start',
      duration,
      timestamp: Date.now(),
      type: 'cold_start',
    });

    // Check against budget (2 seconds target)
    if (duration > 3000) {
      logger.error(`Cold start too slow: ${duration.toFixed(2)}ms (target: <2000ms)`);
    } else if (duration > 2000) {
      logger.warn(`Cold start slow: ${duration.toFixed(2)}ms (target: <2000ms)`);
    } else {
      logger.info(`Cold start: ${duration.toFixed(2)}ms ✅`);
    }
  }
}

/**
 * Measure screen load time
 * Call when screen mounts and when content is ready
 */
export function measureScreenLoad(screenName: string, stage: 'start' | 'end' = 'start'): void {
  const key = `screen_${screenName}`;

  if (stage === 'start') {
    screenLoadTimes.set(key, performance.now());
    logger.debug(`Screen load started: ${screenName}`);
  } else {
    const startTime = screenLoadTimes.get(key);
    if (startTime) {
      const duration = performance.now() - startTime;
      screenLoadTimes.delete(key);

      addMetric({
        name: `screen_${screenName}`,
        duration,
        timestamp: Date.now(),
        type: 'screen',
      });

      // Check against budget (300ms target)
      if (duration > 500) {
        logger.warn(
          `Screen load slow: ${screenName} took ${duration.toFixed(2)}ms (target: <300ms)`,
        );
      } else {
        logger.debug(`Screen load: ${screenName} took ${duration.toFixed(2)}ms`);
      }
    }
  }
}

/**
 * Measure database initialization time
 */
export function measureDatabaseInit(stage: 'start' | 'end' = 'start'): void {
  if (stage === 'start') {
    databaseInitStartTime = performance.now();
    logger.debug('Database initialization started');
  } else if (databaseInitStartTime !== null) {
    databaseInitEndTime = performance.now();
    const duration = databaseInitEndTime - databaseInitStartTime;

    addMetric({
      name: 'database_init',
      duration,
      timestamp: Date.now(),
      type: 'database',
    });

    if (duration > 1000) {
      logger.warn(`Database init slow: ${duration.toFixed(2)}ms`);
    } else {
      logger.info(`Database init: ${duration.toFixed(2)}ms ✅`);
    }
  }
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
  coldStart: 2000, // App cold start target
  databaseInit: 500, // Database initialization target
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

/**
 * Report all collected performance metrics
 */
export function reportPerformanceMetrics(): {
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    averageRenderTime: number;
    averageScreenLoadTime: number;
    slowestOperation: PerformanceMetric | null;
    coldStartTime: number | null;
  };
} {
  const renderMetrics = metricsHistory.filter((m) => m.type === 'render');
  const screenMetrics = metricsHistory.filter((m) => m.type === 'screen');

  const averageRenderTime =
    renderMetrics.length > 0
      ? renderMetrics.reduce((sum, m) => sum + m.duration, 0) / renderMetrics.length
      : 0;

  const averageScreenLoadTime =
    screenMetrics.length > 0
      ? screenMetrics.reduce((sum, m) => sum + m.duration, 0) / screenMetrics.length
      : 0;

  const slowestOperation =
    metricsHistory.length > 0
      ? metricsHistory.reduce((slowest, current) =>
          current.duration > slowest.duration ? current : slowest,
        )
      : null;

  const report = {
    metrics: [...metricsHistory],
    summary: {
      totalMetrics: metricsHistory.length,
      averageRenderTime,
      averageScreenLoadTime,
      slowestOperation,
      coldStartTime:
        isColdStartComplete && coldStartTime !== null ? performance.now() - coldStartTime : null,
    },
  };

  logger.info('Performance Report:', {
    totalMetrics: report.summary.totalMetrics,
    averageRenderTime: `${averageRenderTime.toFixed(2)}ms`,
    averageScreenLoadTime: `${averageScreenLoadTime.toFixed(2)}ms`,
    slowestOperation: slowestOperation
      ? `${slowestOperation.name} (${slowestOperation.duration.toFixed(2)}ms)`
      : 'N/A',
  });

  return report;
}

/**
 * Setup periodic memory monitoring
 */
export function setupMemoryMonitoring(intervalMs: number = 30000): () => void {
  const intervalId = setInterval(() => {
    monitorMemoryUsage(85);
    logMemoryUsage();
  }, intervalMs);

  return () => clearInterval(intervalId);
}

/**
 * Measure function execution time (decorator pattern)
 */
export function measureFunction<T extends (...args: unknown[]) => unknown>(
  fn: T,
  fnName: string = fn.name,
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    const startTime = performance.now();

    const result = fn(...args);

    // Handle both sync and async functions
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime;
        logger.debug(`Function ${fnName} took ${duration.toFixed(2)}ms`);
      }) as ReturnType<T>;
    } else {
      const duration = performance.now() - startTime;
      logger.debug(`Function ${fnName} took ${duration.toFixed(2)}ms`);
      return result as ReturnType<T>;
    }
  };
}

/**
 * Frame rate monitoring
 */
export class FrameRateMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private isRunning = false;
  private rafId: number | null = null;
  private onFPSUpdate: (fps: number) => void;

  constructor(onFPSUpdate: (fps: number) => void) {
    this.onFPSUpdate = onFPSUpdate;
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.frameCount = 0;
    this.lastTime = performance.now();

    const measureFrame = (): void => {
      if (!this.isRunning) return;

      this.frameCount++;
      const currentTime = performance.now();
      const elapsed = currentTime - this.lastTime;

      // Update FPS every second
      if (elapsed >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / elapsed);
        this.onFPSUpdate(fps);
        this.frameCount = 0;
        this.lastTime = currentTime;
      }

      this.rafId = requestAnimationFrame(measureFrame);
    };

    this.rafId = requestAnimationFrame(measureFrame);
  }

  stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }
}
