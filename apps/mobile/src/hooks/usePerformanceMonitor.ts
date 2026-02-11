import { useEffect, useRef, useCallback, useState } from 'react';
import { InteractionManager } from 'react-native';
import { logger } from '../utils/logger';

/**
 * usePerformanceMonitor Hook
 *
 * A comprehensive hook for tracking render performance, re-renders, and detecting memory leaks.
 *
 * Features:
 * - Track component render times
 * - Detect unnecessary re-renders
 * - Memory leak detection
 * - FPS monitoring
 * - Interaction timing
 * - Long task detection
 *
 * Usage:
 * ```tsx
 * // Basic usage
 * function MyComponent() {
 *   usePerformanceMonitor('MyComponent');
 *   return <View>...</View>;
 * }
 *
 * // With re-render detection
 * function MyComponent() {
 *   const { renderCount, renderTime } = usePerformanceMonitor('MyComponent', {
 *     trackRenders: true,
 *     warnOnRerender: true,
 *   });
 *   return <View>...</View>;
 * }
 *
 * // With props tracking
 * function MyComponent(props) {
 *   usePerformanceMonitor('MyComponent', {
 *     trackProps: true,
 *     props,
 *   });
 *   return <View>...</View>;
 * }
 * ```
 */

interface PerformanceMonitorOptions {
  /** Enable render time tracking */
  trackRenderTime?: boolean;
  /** Enable re-render detection and warning */
  warnOnRerender?: boolean;
  /** Track why re-renders occurred */
  trackProps?: boolean;
  /** Props to compare for change detection */
  props?: Record<string, unknown>;
  /** Threshold for slow render warning (ms) */
  slowRenderThreshold?: number;
  /** Enable memory leak detection */
  detectMemoryLeaks?: boolean;
  /** Warn if render count exceeds this in a session */
  maxRenderCount?: number;
  /** Log level for performance messages */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

interface PerformanceMetrics {
  /** Number of renders since mount */
  renderCount: number;
  /** Time of last render in ms */
  renderTime: number;
  /** Average render time in ms */
  averageRenderTime: number;
  /** Maximum render time in ms */
  maxRenderTime: number;
  /** Timestamp of first render */
  firstRenderTime: number | null;
  /** Whether a slow render was detected */
  hasSlowRender: boolean;
  /** Current FPS if monitoring */
  currentFPS: number | null;
}

interface PerformanceActions {
  /** Reset all metrics */
  reset: () => void;
  /** Start FPS monitoring */
  startFPSMonitoring: () => void;
  /** Stop FPS monitoring */
  stopFPSMonitoring: () => void;
  /** Force a measurement */
  measure: () => number;
}

/**
 * Deep comparison of two objects
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const keysA = Object.keys(aObj);
  const keysB = Object.keys(bObj);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(aObj[key], bObj[key])) return false;
  }

  return true;
}

/**
 * Find which props changed between renders
 */
function findChangedProps(
  prevProps: Record<string, unknown> | undefined,
  currentProps: Record<string, unknown>,
): string[] {
  if (!prevProps) return Object.keys(currentProps);

  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(prevProps), ...Object.keys(currentProps)]);

  for (const key of allKeys) {
    if (!deepEqual(prevProps[key], currentProps[key])) {
      changed.push(key);
    }
  }

  return changed;
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(
  componentName: string,
  options: PerformanceMonitorOptions = {},
): PerformanceMetrics & PerformanceActions {
  const {
    trackRenderTime = true,
    warnOnRerender = false,
    trackProps = false,
    props,
    slowRenderThreshold = 16, // 60fps frame budget
    detectMemoryLeaks = false,
    maxRenderCount = 100,
    logLevel = 'debug',
  } = options;

  // Refs for tracking
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const prevPropsRef = useRef<Record<string, unknown> | undefined>(props);
  const isMountedRef = useRef(true);
  const fpsMonitorRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());

  // State for exposing metrics
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    renderTime: 0,
    averageRenderTime: 0,
    maxRenderTime: 0,
    firstRenderTime: null,
    hasSlowRender: false,
    currentFPS: null,
  });

  // Logging helper
  const log = useCallback(
    (message: string, ...args: unknown[]) => {
      switch (logLevel) {
        case 'error':
          logger.error(message, ...args);
          break;
        case 'warn':
          logger.warn(message, ...args);
          break;
        case 'info':
          logger.info(message, ...args);
          break;
        case 'debug':
        default:
          logger.debug(message, ...args);
          break;
      }
    },
    [logLevel],
  );

  // Start timing before render
  startTimeRef.current = performance.now();

  // Track render completion
  useEffect(() => {
    if (!trackRenderTime) return;

    const renderTime = performance.now() - startTimeRef.current;
    renderCountRef.current += 1;
    renderTimesRef.current.push(renderTime);

    // Keep only last 100 measurements
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current.shift();
    }

    const isFirstRender = renderCountRef.current === 1;
    const averageRenderTime =
      renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;
    const maxRenderTime = Math.max(...renderTimesRef.current);
    const isSlowRender = renderTime > slowRenderThreshold;

    // Update metrics state
    setMetrics((prev) => ({
      ...prev,
      renderCount: renderCountRef.current,
      renderTime,
      averageRenderTime,
      maxRenderTime,
      firstRenderTime: prev.firstRenderTime || (isFirstRender ? Date.now() : null),
      hasSlowRender: prev.hasSlowRender || isSlowRender,
    }));

    // Log render info
    if (isFirstRender) {
      log(`[${componentName}] First render: ${renderTime.toFixed(2)}ms`);
    } else if (warnOnRerender) {
      const changedProps = trackProps && props ? findChangedProps(prevPropsRef.current, props) : [];

      if (changedProps.length > 0 && trackProps) {
        log(
          `[${componentName}] Re-render #${renderCountRef.current}: ${renderTime.toFixed(2)}ms (changed: ${changedProps.join(', ')})`,
        );
      } else {
        log(`[${componentName}] Re-render #${renderCountRef.current}: ${renderTime.toFixed(2)}ms`);
      }
    }

    // Warn about slow renders
    if (isSlowRender) {
      logger.warn(
        `[${componentName}] Slow render detected: ${renderTime.toFixed(2)}ms (threshold: ${slowRenderThreshold}ms)`,
      );
    }

    // Warn about excessive renders
    if (renderCountRef.current > maxRenderCount) {
      logger.warn(
        `[${componentName}] Excessive renders detected: ${renderCountRef.current} (max: ${maxRenderCount})`,
      );
    }

    // Update prev props
    if (trackProps && props) {
      prevPropsRef.current = { ...props };
    }

    // Memory leak detection
    if (detectMemoryLeaks && !isFirstRender) {
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      if (memory && memory.usedJSHeapSize > 100 * 1024 * 1024) {
        // 100MB
        logger.warn(
          `[${componentName}] High memory usage detected: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        );
      }
    }

    // Cleanup check
    return () => {
      if (detectMemoryLeaks && isMountedRef.current) {
        // Component is unmounting
        isMountedRef.current = false;
      }
    };
  }, [
    componentName,
    trackRenderTime,
    warnOnRerender,
    slowRenderThreshold,
    maxRenderCount,
    detectMemoryLeaks,
    log,
    trackProps,
    props,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fpsMonitorRef.current !== null) {
        cancelAnimationFrame(fpsMonitorRef.current);
      }
      isMountedRef.current = false;

      log(`[${componentName}] Unmounted after ${renderCountRef.current} renders`);
    };
  }, [componentName, log]);

  // FPS monitoring
  const startFPSMonitoring = useCallback(() => {
    if (fpsMonitorRef.current !== null) return;

    const measureFrame = (): void => {
      frameCountRef.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastFpsTimeRef.current;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        setMetrics((prev) => ({ ...prev, currentFPS: fps }));

        if (fps < 30) {
          logger.warn(`[${componentName}] Low FPS detected: ${fps}`);
        }

        frameCountRef.current = 0;
        lastFpsTimeRef.current = currentTime;
      }

      if (isMountedRef.current) {
        fpsMonitorRef.current = requestAnimationFrame(measureFrame);
      }
    };

    fpsMonitorRef.current = requestAnimationFrame(measureFrame);
  }, [componentName]);

  const stopFPSMonitoring = useCallback(() => {
    if (fpsMonitorRef.current !== null) {
      cancelAnimationFrame(fpsMonitorRef.current);
      fpsMonitorRef.current = null;
    }
  }, []);

  // Reset metrics
  const reset = useCallback(() => {
    renderCountRef.current = 0;
    renderTimesRef.current = [];
    prevPropsRef.current = undefined;

    setMetrics({
      renderCount: 0,
      renderTime: 0,
      averageRenderTime: 0,
      maxRenderTime: 0,
      firstRenderTime: null,
      hasSlowRender: false,
      currentFPS: null,
    });

    log(`[${componentName}] Metrics reset`);
  }, [componentName, log]);

  // Manual measurement
  const measure = useCallback((): number => {
    const duration = performance.now() - startTimeRef.current;
    log(`[${componentName}] Manual measurement: ${duration.toFixed(2)}ms`);
    return duration;
  }, [componentName, log]);

  return {
    ...metrics,
    reset,
    startFPSMonitoring,
    stopFPSMonitoring,
    measure,
  };
}

/**
 * Hook to measure interaction completion time
 */
export function useInteractionTiming(
  interactionName: string,
  onComplete?: (duration: number) => void,
): { start: () => void; end: () => void } {
  const startTimeRef = useRef<number>(0);
  const interactionHandleRef = useRef<ReturnType<
    typeof InteractionManager.runAfterInteractions
  > | null>(null);

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const end = useCallback(() => {
    const _duration = performance.now() - startTimeRef.current;

    interactionHandleRef.current = InteractionManager.runAfterInteractions(() => {
      const totalDuration = performance.now() - startTimeRef.current;
      logger.debug(`[${interactionName}] Interaction completed in ${totalDuration.toFixed(2)}ms`);
      onComplete?.(totalDuration);
    });
  }, [interactionName, onComplete]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (interactionHandleRef.current !== null) {
        // Note: InteractionManager handles don't have a cancel method in RN
      }
    };
  }, []);

  return { start, end };
}

/**
 * Hook to detect long-running tasks that might block the UI
 */
export function useLongTaskDetection(
  thresholdMs: number = 100,
  onLongTask?: (duration: number, taskName: string) => void,
): { wrapTask: <T>(task: () => T, taskName?: string) => T } {
  const wrapTask = useCallback(
    <T>(task: () => T, taskName: string = 'unnamed'): T => {
      const startTime = performance.now();

      const result = task();

      const duration = performance.now() - startTime;

      if (duration > thresholdMs) {
        logger.warn(`Long task detected: ${taskName} took ${duration.toFixed(2)}ms`);
        onLongTask?.(duration, taskName);
      }

      return result;
    },
    [thresholdMs, onLongTask],
  );

  return { wrapTask };
}

/**
 * Hook to measure list rendering performance
 */
export function useListPerformance(
  listName: string,
  itemCount: number,
): {
  onScrollBegin: () => void;
  onScrollEnd: () => void;
  reportRender: (itemIndex: number) => void;
} {
  const scrollStartTimeRef = useRef<number>(0);
  const renderTimesRef = useRef<Map<number, number>>(new Map());

  const onScrollBegin = useCallback(() => {
    scrollStartTimeRef.current = performance.now();
    renderTimesRef.current.clear();
  }, []);

  const onScrollEnd = useCallback(() => {
    const totalDuration = performance.now() - scrollStartTimeRef.current;
    const renderedItems = renderTimesRef.current.size;
    const avgRenderTime =
      renderedItems > 0
        ? Array.from(renderTimesRef.current.values()).reduce((a, b) => a + b, 0) / renderedItems
        : 0;

    logger.debug(
      `[${listName}] Scroll performance: ${renderedItems}/${itemCount} items rendered ` +
        `in ${totalDuration.toFixed(2)}ms (avg: ${avgRenderTime.toFixed(2)}ms/item)`,
    );
  }, [listName, itemCount]);

  const reportRender = useCallback((itemIndex: number) => {
    renderTimesRef.current.set(itemIndex, performance.now());
  }, []);

  return {
    onScrollBegin,
    onScrollEnd,
    reportRender,
  };
}

export default usePerformanceMonitor;
