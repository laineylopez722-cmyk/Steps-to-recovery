/**
 * useDebouncedValue Hook Test Suite
 *
 * Tests debounced value functionality including:
 * - Returns initial value immediately
 * - Debounces updates by specified delay
 * - Updates to latest value after delay
 * - Resets timeout on rapid changes
 */

import { renderHook, act } from '@testing-library/react-native';
import { useDebouncedValue, useDebouncedCallback, useDebouncedState } from '../useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('hello', 500));

    expect(result.current).toBe('hello');
  });

  it('should not update value before delay expires', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 500 } },
    );

    rerender({ value: 'updated', delay: 500 });

    // Value should still be initial before delay
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe('initial');
  });

  it('should update to latest value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 500 } },
    );

    rerender({ value: 'updated', delay: 500 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should reset timeout on rapid changes and only emit final value', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'first', delay: 300 } },
    );

    // Rapid changes
    rerender({ value: 'second', delay: 300 });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ value: 'third', delay: 300 });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ value: 'fourth', delay: 300 });

    // Still shows first value since no timeout has completed
    expect(result.current).toBe('first');

    // Advance past the delay from the last change
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('fourth');
  });

  it('should handle numeric values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: number; delay: number }) => useDebouncedValue(value, delay),
      { initialProps: { value: 0, delay: 200 } },
    );

    rerender({ value: 42, delay: 200 });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe(42);
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should debounce callback execution', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    const [debouncedFn] = result.current;

    act(() => {
      debouncedFn();
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should cancel pending callback', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    const [debouncedFn, cancel] = result.current;

    act(() => {
      debouncedFn();
    });

    act(() => {
      cancel();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should only fire once for rapid calls', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 200));

    const [debouncedFn] = result.current;

    act(() => {
      debouncedFn();
      debouncedFn();
      debouncedFn();
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('useDebouncedState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should provide immediate and debounced values', () => {
    const { result } = renderHook(() => useDebouncedState('initial', 300));

    const [immediate, debounced] = result.current;
    expect(immediate).toBe('initial');
    expect(debounced).toBe('initial');
  });

  it('should update immediate value immediately and debounced after delay', () => {
    const { result } = renderHook(() => useDebouncedState('initial', 300));

    act(() => {
      const setValue = result.current[2];
      setValue('updated');
    });

    // Immediate updates right away, debounced stays
    expect(result.current[0]).toBe('updated');
    expect(result.current[1]).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current[1]).toBe('updated');
  });
});
