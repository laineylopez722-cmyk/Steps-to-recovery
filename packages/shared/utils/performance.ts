/**
 * Performance Utilities
 *
 * Utilities for optimizing app performance including:
 * - Memoization helpers
 * - Debouncing and throttling
 * - Image optimization
 * - List rendering optimization
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { logger } from './logger';

/**
 * Debounce a function call
 * Useful for search inputs, form validation, etc.
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update the callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay],
  );
}

/**
 * Throttle a function call
 * Useful for scroll handlers, resize events, etc.
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number,
): T {
  const lastRan = useRef(Date.now());
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRan.current >= limit) {
        callbackRef.current(...args);
        lastRan.current = Date.now();
      }
    }) as T,
    [limit],
  );
}

/**
 * Memoize expensive computations with a simple cache
 */
export function memoize<T extends (...args: unknown[]) => unknown>(fn: T, maxCacheSize = 100): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args) as ReturnType<T>;

    // Evict oldest entry if cache is full
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }

    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Hook for lazy loading data
 * Only loads when component is visible/mounted
 */
export function useLazyLoad<T>(
  loadFn: () => Promise<T>,
  dependencies: unknown[] = [],
): { data: T | null; isLoading: boolean; error: Error | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loadFn();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, reload: load };
}

/**
 * Calculate optimal batch size for list rendering
 * Based on device memory and screen size
 */
export function getOptimalBatchSize(itemHeight: number, screenHeight: number): number {
  // Render enough items to fill ~2 screens
  const itemsPerScreen = Math.ceil(screenHeight / itemHeight);
  return Math.min(itemsPerScreen * 2, 50); // Cap at 50 for memory
}

/**
 * Get window size for FlatList virtualization
 */
export function getWindowSize(itemHeight: number, screenHeight: number): number {
  // Keep ~5 screens worth of items in memory
  const itemsPerScreen = Math.ceil(screenHeight / itemHeight);
  return itemsPerScreen * 5;
}

/**
 * Optimize list key extractor
 * Returns a stable key based on item id or index
 */
export function createKeyExtractor<T extends { id: string }>(
  idField: keyof T = 'id',
): (item: T, index: number) => string {
  return (item: T, index: number) => {
    return (item[idField] as string) || `item-${index}`;
  };
}

/**
 * Format date efficiently with caching
 */
const dateFormatCache = new Map<string, string>();

export function formatDateCached(
  date: Date | string,
  format: 'short' | 'long' | 'time' = 'short',
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const cacheKey = `${dateObj.getTime()}-${format}`;

  if (dateFormatCache.has(cacheKey)) {
    return dateFormatCache.get(cacheKey)!;
  }

  let formatted: string;
  switch (format) {
    case 'short':
      formatted = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      break;
    case 'long':
      formatted = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      break;
    case 'time':
      formatted = dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      break;
  }

  // Limit cache size
  if (dateFormatCache.size > 1000) {
    dateFormatCache.clear();
  }

  dateFormatCache.set(cacheKey, formatted);
  return formatted;
}

/**
 * Batch database operations for better performance
 */
export async function batchDatabaseOperations<T>(
  operations: (() => Promise<T>)[],
  batchSize = 10,
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((op) => op()));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Preload images for smoother rendering
 */
export async function preloadImages(imageUrls: string[]): Promise<void> {
  // In React Native, we'd use Image.prefetch
  // This is a placeholder for the concept
  await Promise.all(
    imageUrls.map((url) => {
      return new Promise<void>((resolve) => {
        // Image.prefetch(url).then(() => resolve()).catch(() => resolve());
        resolve();
      });
    }),
  );
}

/**
 * Performance monitoring helper
 */
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  if (process.env.NODE_ENV === 'development' && duration > 16) {
    // Warn if operation takes longer than one frame (16ms)
    logger.warn(`${name} took ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Async performance monitoring helper
 */
export async function measurePerformanceAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (process.env.NODE_ENV === 'development' && duration > 100) {
    // Warn if async operation takes longer than 100ms
    logger.warn(`${name} took ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Check if we're in a low memory situation
 * Note: This is a simplified check - real implementation would use
 * native modules or Expo's device info
 */
export function isLowMemory(): boolean {
  // Placeholder - would need native module to check actual memory
  return false;
}

/**
 * Reduce render quality for low-end devices
 */
export function getAdaptiveQuality(): 'low' | 'medium' | 'high' {
  if (isLowMemory()) {
    return 'low';
  }
  // Could add more checks here (device tier, battery level, etc.)
  return 'high';
}
