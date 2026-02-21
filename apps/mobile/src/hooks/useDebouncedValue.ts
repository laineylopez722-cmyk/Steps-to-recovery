/**
 * Debounced Value Hook
 *
 * Returns a debounced version of a value that only updates after
 * the specified delay has passed without changes.
 *
 * **Use Cases**:
 * - Search input debouncing
 * - Auto-save with delay
 * - API request throttling
 * - Form validation
 *
 * @example
 * ```ts
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebouncedValue(searchTerm, 300);
 *
 * // API call only fires after 300ms of no typing
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     searchMeetings(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Basic debounced value hook
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback hook
 *
 * Returns a debounced version of a callback that only executes
 * after the specified delay has passed since the last call.
 *
 * @param callback - The callback to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced callback and cancel function
 *
 * @example
 * ```ts
 * const [debouncedSave, cancelSave] = useDebouncedCallback(
 *   async (content: string) => {
 *     await saveJournalEntry(content);
 *   },
 *   1000
 * );
 *
 * // Auto-save on content change
 * useEffect(() => {
 *   debouncedSave(content);
 *   return () => cancelSave();
 * }, [content]);
 * ```
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number,
): [T, () => void] {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      cancel();
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay, cancel],
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return cancel;
  }, [cancel]);

  return [debouncedCallback, cancel];
}

/**
 * Debounced state hook
 *
 * Like useState, but with debounced updates. Useful for controlled inputs
 * where you need immediate local state but debounced external updates.
 *
 * @param initialValue - Initial state value
 * @param delay - Debounce delay in milliseconds
 * @returns [immediateValue, debouncedValue, setValue]
 *
 * @example
 * ```ts
 * const [text, debouncedText, setText] = useDebouncedState('', 500);
 *
 * // text updates immediately (for input display)
 * // debouncedText updates after 500ms (for API calls)
 * <TextInput value={text} onChangeText={setText} />
 * ```
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number,
): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebouncedValue(value, delay);

  return [value, debouncedValue, setValue];
}

/**
 * Throttled value hook
 *
 * Unlike debounce, throttle ensures the value updates at most once
 * per delay period (updates immediately then waits).
 *
 * @param value - The value to throttle
 * @param delay - Minimum delay between updates in milliseconds
 * @returns Throttled value
 *
 * @example
 * ```ts
 * const scrollY = useScrollY();
 * const throttledScrollY = useThrottledValue(scrollY, 100);
 * // Updates at most every 100ms during scroll
 * ```
 */
export function useThrottledValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdatedRef = useRef<number>(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdatedRef.current;

    if (timeSinceLastUpdate >= delay) {
      // Enough time has passed, update immediately
      setThrottledValue(value);
      lastUpdatedRef.current = now;
    } else {
      // Schedule update for remaining time
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setThrottledValue(value);
        lastUpdatedRef.current = Date.now();
      }, delay - timeSinceLastUpdate);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return throttledValue;
}
