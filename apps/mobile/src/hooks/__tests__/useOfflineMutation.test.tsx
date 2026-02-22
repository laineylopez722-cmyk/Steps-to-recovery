import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import { useOfflineMutation } from '../useOfflineMutation';

const mockShowToast = jest.fn();

jest.mock('../../design-system/components/ToastProvider', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('useOfflineMutation', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });
  });

  afterEach(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
  });

  it('invalidates configured queries on success', async () => {
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(
      () =>
        useOfflineMutation<number, Error, { value: number }>({
          mutationKey: ['offline-success'],
          mutationFn: async ({ value }) => value * 2,
          invalidateQueries: [['checkins']],
          showErrorToast: false,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      const value = await result.current.mutateAsync({ value: 3 });
      expect(value).toBe(6);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['checkins'] });
  });

  it('does not invalidate configured queries on error', async () => {
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(
      () =>
        useOfflineMutation<void, Error, { id: string }>({
          mutationKey: ['offline-error'],
          mutationFn: async () => {
            throw new Error('Mutation failed');
          },
          invalidateQueries: [['stats']],
          showErrorToast: false,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await expect(result.current.mutateAsync({ id: 'b' })).rejects.toThrow('Mutation failed');
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('calls user-provided onSuccess callback', async () => {
    const onSuccess = jest.fn();

    const { result } = renderHook(
      () =>
        useOfflineMutation<string, Error, { text: string }>({
          mutationKey: ['offline-onsuccess'],
          mutationFn: async ({ text }) => text.toUpperCase(),
          onSuccess,
          showErrorToast: false,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.mutateAsync({ text: 'ok' });
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess.mock.calls[0][0]).toBe('OK');
  });
});
