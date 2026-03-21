/**
 * Shared test wrapper utility
 *
 * Provides a reusable `QueryClientProvider` wrapper for React Query hooks
 * and components under test. Eliminates boilerplate from test files.
 *
 * **Usage**:
 * ```tsx
 * import { createTestWrapper } from '@/__tests__/utils';
 *
 * const { result } = renderHook(() => useMyHook(), {
 *   wrapper: createTestWrapper(),
 * });
 * ```
 *
 * @module __tests__/utils/createTestWrapper
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Default QueryClient options for testing.
 *
 * Disables retries, refetch-on-mount, and error logging to keep tests fast
 * and deterministic.
 */
const DEFAULT_TEST_CLIENT_OPTIONS = {
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: Infinity,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
} as const;

/**
 * Create a React wrapper component with QueryClientProvider for testing
 *
 * Each call returns a **fresh QueryClient** so tests don't share cache state.
 *
 * @param overrides - Optional QueryClient config overrides
 * @returns A React wrapper component suitable for `renderHook` / `render`
 *
 * @example
 * ```tsx
 * const { result } = renderHook(() => useJournalEntries(), {
 *   wrapper: createTestWrapper(),
 * });
 * ```
 *
 * @example Custom options
 * ```tsx
 * const wrapper = createTestWrapper({
 *   defaultOptions: { queries: { retry: 2 } },
 * });
 * ```
 */
export function createTestWrapper(
  overrides?: ConstructorParameters<typeof QueryClient>[0],
): React.FC<{ children: React.ReactNode }> {
  const queryClient = new QueryClient({
    ...DEFAULT_TEST_CLIENT_OPTIONS,
    ...overrides,
  });

  function TestWrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return TestWrapper;
}
