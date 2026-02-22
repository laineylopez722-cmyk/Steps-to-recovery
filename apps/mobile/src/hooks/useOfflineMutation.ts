import {
  useMutation,
  useQueryClient,
  onlineManager,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query';
import { useCallback } from 'react';
import { logger } from '../utils/logger';
import { useToast } from '../design-system/components/ToastProvider';

/**
 * Options for optimistic updates
 */
interface OptimisticUpdateOptions<TData, TVariables> {
  /**
   * Query keys to optimistically update
   */
  queryKeys: QueryKey[];

  /**
   * Function to generate optimistic data
   * Receives current data and variables, returns updated data
   */
  updateFn: (currentData: TData | undefined, variables: TVariables) => TData | undefined;
}

/**
 * Extended mutation options with optimistic update support
 */
interface OfflineMutationOptions<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> extends Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  'onMutate' | 'onError' | 'onSettled'
> {
  /**
   * Optimistic update configuration
   * When provided, the UI will update immediately before the server responds
   */
  optimisticUpdate?: OptimisticUpdateOptions<TData, TVariables>;

  /**
   * Query keys to invalidate after successful mutation
   */
  invalidateQueries?: QueryKey[];

  /**
   * Whether to show error toast on failure (defaults to true)
   */
  showErrorToast?: boolean;
}

/**
 * Hook for mutations with offline support and optimistic updates
 *
 * This hook wraps React Query's useMutation with:
 * - Automatic optimistic updates (immediate UI feedback)
 * - Rollback on error
 * - Query invalidation on success
 * - Offline queueing (mutations execute when back online)
 *
 * @example
 * ```typescript
 * const { mutate, isPending } = useOfflineMutation({
 *   mutationFn: createCheckIn,
 *   optimisticUpdate: {
 *     queryKeys: [['checkins']],
 *     updateFn: (current, variables) => [...current, variables],
 *   },
 *   invalidateQueries: [['checkins'], ['stats']],
 * });
 * ```
 */
export function useOfflineMutation<TData = unknown, TError = Error, TVariables = void>(
  options: OfflineMutationOptions<TData, TError, TVariables>,
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const {
    optimisticUpdate,
    invalidateQueries,
    showErrorToast = true,
    onSuccess: userOnSuccess,
    ...mutationOptions
  } = options;

  const mutation = useMutation<
    TData,
    TError,
    TVariables,
    { previousData: Map<QueryKey, TData | undefined> }
  >({
    ...mutationOptions,

    // Optimistic update - modify cache before mutation executes
    onMutate: async (variables) => {
      const previousData = new Map<QueryKey, TData | undefined>();

      if (!optimisticUpdate) {
        return { previousData };
      }

      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await Promise.all(
        optimisticUpdate.queryKeys.map((queryKey) => queryClient.cancelQueries({ queryKey })),
      );

      // Snapshot previous values and apply optimistic updates
      optimisticUpdate.queryKeys.forEach((queryKey) => {
        const currentData = queryClient.getQueryData<TData>(queryKey);
        previousData.set(queryKey, currentData);

        const optimisticData = optimisticUpdate.updateFn(currentData, variables);
        if (optimisticData !== undefined) {
          queryClient.setQueryData(queryKey, optimisticData);
        }
      });

      return { previousData };
    },

    // On error, roll back to previous values
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      if (showErrorToast) {
        logger.error('Mutation failed', error);
        const message = error instanceof Error ? error.message : 'Operation failed';
        showToast(message, 'error', { duration: 4000 });
      }
    },

    // Invalidate related queries only after successful mutation
    onSuccess: (data, variables, onMutateResult, mutationContext) => {
      userOnSuccess?.(data, variables, onMutateResult, mutationContext);

      // Invalidate specified queries to ensure data consistency
      if (invalidateQueries) {
        invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // Also invalidate optimistic update queries to be safe
      if (optimisticUpdate) {
        optimisticUpdate.queryKeys.forEach((queryKey) => {
          // Only invalidate if we haven't already
          const alreadyInvalidating = invalidateQueries?.some(
            (key) => JSON.stringify(key) === JSON.stringify(queryKey),
          );
          if (!alreadyInvalidating) {
            queryClient.invalidateQueries({ queryKey });
          }
        });
      }
    },
  });

  // Wrap mutate to provide better logging
  const mutate = useCallback(
    (variables: TVariables) => {
      logger.info('Starting offline mutation', { mutationKey: mutationOptions.mutationKey });
      mutation.mutate(variables);

      if (!onlineManager.isOnline()) {
        showToast('Saved offline — will sync when connected', 'info', { duration: 3000 });
      }
    },
    [mutation, mutationOptions.mutationKey, showToast],
  );

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      logger.info('Starting offline mutation (async)', {
        mutationKey: mutationOptions.mutationKey,
      });

      if (!onlineManager.isOnline()) {
        showToast('Saved offline — will sync when connected', 'info', { duration: 3000 });
      }

      return mutation.mutateAsync(variables);
    },
    [mutation, mutationOptions.mutationKey, showToast],
  );

  return {
    ...mutation,
    mutate,
    mutateAsync,
  };
}

/**
 * Hook to get the count of pending (offline) mutations
 * Useful for showing "unsynced changes" indicator
 */
export function usePendingMutationCount(): number {
  const queryClient = useQueryClient();

  // Get all mutations from the cache
  const mutationCache = queryClient.getMutationCache();
  const mutations = mutationCache.getAll();

  // Count pending mutations (those waiting for network)
  const pendingCount = mutations.filter((mutation) => mutation.state.status === 'pending').length;

  return pendingCount;
}

/**
 * Hook to check if there are any pending mutations
 */
export function useHasPendingMutations(): boolean {
  return usePendingMutationCount() > 0;
}

/**
 * Manually trigger sync of pending mutations
 * Call this from "Pull to refresh" or manual sync buttons
 */
export function useSyncPendingMutations() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    const mutationCache = queryClient.getMutationCache();
    const pendingMutations = mutationCache
      .getAll()
      .filter((mutation) => mutation.state.status === 'pending');

    if (pendingMutations.length === 0) {
      logger.info('No pending mutations to sync');
      return 0;
    }

    logger.info(`Syncing ${pendingMutations.length} pending mutations`);
    await queryClient.resumePausedMutations();
    return pendingMutations.length;
  }, [queryClient]);
}
