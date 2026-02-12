# React Query Patterns — Steps to Recovery

> Server state management with @tanstack/react-query v5.

## Query Key Convention

```typescript
// Hierarchical key structure
['journal-entries']                    // All entries
['journal-entries', entryId]           // Single entry
['daily-checkins', date]               // Check-ins by date
['step-work', stepNumber]              // Step work by step
['achievements']                       // All achievements
['meetings', 'favorites']             // Favorite meetings
['meetings', 'nearby', { lat, lng }]  // Nearby meetings
['sponsor', 'connections']             // Sponsor relationships
['sponsor', 'shared-entries']          // Shared entries
['weekly-report', weekId]              // Weekly report
['ai', 'chat-history']                // AI conversation
```

## Hook Pattern

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '@/contexts/DatabaseContext';
import { decryptContent, encryptContent } from '@/utils/encryption';
import { addToSyncQueue } from '@/services/syncService';
import { logger } from '@/utils/logger';

// ✅ Read hook
export function useJournalEntries(userId: string) {
  const { db, isReady } = useDatabase();

  return useQuery({
    queryKey: ['journal-entries'],
    queryFn: async (): Promise<JournalEntry[]> => {
      const rows = await db!.getAllAsync<JournalEntryRow>(
        'SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return Promise.all(
        rows.map(async (row) => ({
          ...row,
          content: await decryptContent(row.encrypted_body),
        }))
      );
    },
    enabled: !!db && isReady && !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

// ✅ Write hook with optimistic update
export function useCreateJournalEntry() {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEntryInput): Promise<string> => {
      const id = generateUUID();
      const encryptedBody = await encryptContent(input.content);

      await db!.runAsync(
        'INSERT INTO journal_entries (id, user_id, encrypted_body, ...) VALUES (?, ?, ?, ...)',
        [id, input.userId, encryptedBody, ...]
      );
      await addToSyncQueue(db!, 'journal_entries', id, 'insert');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create journal entry', { error: message });
    },
  });
}
```

## Query Client Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,         // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,     // Offline-first: don't refetch on focus
      networkMode: 'offlineFirst',     // Always use cache first
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});
```

## Offline Mutation Pattern

```typescript
// For offline-capable mutations
export function useOfflineMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  queryKey: string[],
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });
    },
    onSettled: () => {
      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
```

## Persistence (React Query Persist)

```typescript
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'REACT_QUERY_CACHE',
});

// Wrap app in PersistQueryClientProvider
```

## Testing Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

it('fetches journal entries', async () => {
  const { result } = renderHook(() => useJournalEntries('user-1'), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.data).toHaveLength(3);
});
```
