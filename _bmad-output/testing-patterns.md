# Testing Patterns Reference

_Testing conventions, patterns, and gotchas for Steps-to-Recovery._

---

## Test Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Jest | ^29.7.0 | Test runner |
| jest-expo | ~54.0.17 | Expo preset |
| @testing-library/react-native | ^13.3.3 | Component/hook testing |
| react-test-renderer | ^19.1.0 | React 19 compatible renderer |

---

## Test Structure

### Co-Located Tests
```
src/utils/
├── encryption.ts
└── __tests__/
    └── encryption.test.ts

src/features/journal/hooks/
├── useJournalEntries.ts
└── __tests__/
    └── useJournalEntries.test.tsx
```

### Run Commands
```bash
cd apps/mobile && npx jest --runInBand        # All tests
npm run test:watch                              # Watch mode
npm run test:coverage                           # With coverage
npm run test:encryption                         # Encryption only (CRITICAL)
npm test -- useJournalEntries                   # Specific file
npm test -- --findRelatedTests src/path/file.ts # Related tests
```

**Important**: `--runInBand` required (prevents resource contention with mocks)

---

## Coverage Thresholds

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| encryption.ts | 90% | 85% | 90% | 90% |
| syncService.ts | 70% | 60% | 70% | 70% |
| AuthContext.tsx | 70% | 60% | 70% | 70% |
| SyncContext.tsx | 70% | 60% | 70% | 70% |
| **Overall target** | 75% | - | - | - |

---

## Encryption Testing (CRITICAL)

### ALWAYS Test Roundtrip
```typescript
it('should encrypt and decrypt to return original text', async () => {
  const plaintext = 'Sensitive recovery journal entry';
  const encrypted = await encryptContent(plaintext);

  // Verify encrypted format
  expect(encrypted).not.toBe(plaintext);
  const parts = encrypted.split(':');
  expect(parts).toHaveLength(3);          // iv:ciphertext:mac
  expect(parts[0]).toHaveLength(32);       // IV = 16 bytes = 32 hex chars
  expect(parts[2]).toHaveLength(64);       // HMAC-SHA256 = 64 hex chars

  // Verify roundtrip
  const decrypted = await decryptContent(encrypted);
  expect(decrypted).toBe(plaintext);
});
```

### Test Unique IVs
```typescript
it('should generate unique IV per encryption', async () => {
  const text = 'same input';
  const enc1 = await encryptContent(text);
  const enc2 = await encryptContent(text);
  expect(enc1).not.toBe(enc2);  // Different IVs → different output
});
```

### Test MAC Validation
```typescript
it('should reject tampered ciphertext', async () => {
  const encrypted = await encryptContent('test');
  const [iv, ciphertext, mac] = encrypted.split(':');
  const tampered = `${iv}:TAMPERED${ciphertext}:${mac}`;
  await expect(decryptContent(tampered)).rejects.toThrow();
});
```

---

## Hook Testing Pattern

### Standard Pattern
```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
jest.mock('@/contexts/DatabaseContext', () => ({
  useDatabase: () => ({ db: mockDb, isReady: true }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

it('should load entries', async () => {
  const { result } = renderHook(() => useJournalEntries(userId), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.data).toHaveLength(2);
});
```

### Mutation Testing
```typescript
it('should create entry', async () => {
  const { result } = renderHook(() => useCreateJournalEntry(), {
    wrapper: createWrapper(),
  });

  await act(async () => {
    await result.current.mutateAsync({ content: 'test' });
  });

  expect(mockDb.runAsync).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO journal_entries'),
    expect.any(Array),
  );
});
```

---

## React 19 Gotchas

### Timer Pattern (CRITICAL)
```typescript
// ✅ CORRECT: Function call FIRST, then advance timers
await act(async () => {
  await sendMessage('hello');
  jest.advanceTimersByTime(100);
  await Promise.resolve();
});

// ❌ WRONG: Advancing timers before function call
jest.advanceTimersByTime(100);
await act(async () => { await sendMessage('hello'); });
```

### Error Mock Pattern
```typescript
// ✅ CORRECT: async function that throws
mockFn.mockImplementation(async () => {
  throw new Error('Network error');
});

// ❌ WRONG: mockRejectedValue can cause "unmounted test renderer" cascading failures
mockFn.mockRejectedValue(new Error('Network error'));
```

### act() Wrapping
- Wrap ALL async state updates in `await act(async () => {})`
- React 19 is stricter about act() boundaries
- Missing act() → "Can't access .root on unmounted test renderer" errors

---

## Mocking Conventions

### Auto-Mocked in jest.setup.js
| Module | Mock Type |
|--------|-----------|
| expo-secure-store | Returns stored values from Map |
| expo-crypto | Returns predictable random bytes |
| expo-sqlite | No-op database |
| expo-notifications | Permission stubs |
| expo-audio | No-op recorder |
| @sentry/react-native | No-op capture |
| @react-native-community/netinfo | isConnected: true |
| uuid | Returns 'test-uuid-...' |
| react-native-css-interop | No-op JSX runtime |

### Manual Mocks in Test Files
```typescript
// Context mocking
jest.mock('@/contexts/DatabaseContext', () => ({
  useDatabase: () => ({ db: mockDb, isReady: true }),
}));

// Supabase chaining
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: {...}, error: null }),
};

// Logger
jest.mock('@/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
```

---

## Babel Transform Pattern

```javascript
// babel.config.js — CRITICAL for Jest
exclude: [
  /node_modules\/(?!(jest-)?react-native(-[^/]*)?|@react-native(-[^/]*)?|expo(-[^/]*)?|...)/
]
```

**Key**: `expo(-[^/]*)?` pattern matches `expo`, `expo-modules-core`, `expo-sqlite`, etc. Without this, Jest cannot transform Expo packages.

---

## Test Utilities

### Available in jest.setup.js
```typescript
globalThis.testUtils.flushPromises()  // Resolve all pending promises
globalThis.testUtils.mockDate(date)   // Mock Date constructor
```

### Cleanup (automatic)
- `clearAllMocks()` in afterEach
- `clearAllTimers()` in afterEach
- `jest.useRealTimers()` should be called in afterEach when using fake timers

---

## What to Test vs Skip

### ✅ DO Test
- Encryption roundtrips (CRITICAL)
- Hook data fetching & mutations
- Sync queue operations
- Error handling & edge cases
- Navigation flows
- Form validation

### ❌ DON'T Test
- Third-party library internals (crypto-js, React Query)
- Expo SDK internals (expo-sqlite, expo-secure-store)
- React Native core components
- Implementation details (internal state)
