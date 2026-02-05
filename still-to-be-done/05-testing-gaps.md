# Testing Gaps & Coverage Analysis

**Review Date**: 2026-02-06

---

## Overview

Test coverage is **good for critical paths** (encryption, auth) but has **significant gaps** in feature logic, UI components, and integration testing.

**Overall Grade**: C+

---

## Current Test Coverage

### ✅ Excellent Coverage:
1. **Encryption Utilities** (`utils/__tests__/encryption.test.ts`)
   - 80+ test cases covering all edge cases
   - Round-trip encryption/decryption
   - MAC tampering detection
   - Error handling
   - **Coverage**: ~100%

2. **AuthContext** (`contexts/__tests__/AuthContext.test.tsx`)
   - Session loading
   - Sign in/sign up/sign out
   - Error handling
   - **Coverage**: ~85%

3. **SyncContext** (`contexts/__tests__/SyncContext.test.tsx`)
   - Basic sync operations
   - Network state handling
   - **Coverage**: ~70%

### 🟡 Partial Coverage:
1. **Design System Components**
   - Button: ✅ Tested
   - Card: ✅ Tested
   - Input: ✅ Tested
   - Other components: ❌ Not tested

2. **Feature Hooks**
   - `useCheckIns`: ✅ Tested
   - `useJournalEntries`: ❌ Not tested
   - `useStepWork`: ❌ Not tested
   - `useSponsorships`: ❌ Not tested

3. **Services**
   - `syncService`: 🟡 Basic tests exist
   - `sponsorShareService`: ❌ Not tested
   - `notificationService`: ❌ Not tested

### ❌ Missing Coverage:
1. **UI Screens** - 0% tested
2. **Feature Components** - ~5% tested
3. **Database Utilities** - Not tested
4. **Navigation** - Minimal testing
5. **Platform Adapters** - Not tested

---

## Test Files Found

```
Total test files: 12

✅ Well-Tested:
  - utils/__tests__/encryption.test.ts          (80+ cases)
  - contexts/__tests__/AuthContext.test.tsx     (comprehensive)
  - contexts/__tests__/SyncContext.test.tsx     (basic)
  
🟡 Partially Tested:
  - features/home/hooks/__tests__/useCheckIns.test.tsx
  - services/__tests__/syncService.test.ts
  - design-system/components/__tests__/Button.test.tsx
  - design-system/components/__tests__/Card.test.tsx
  - design-system/components/__tests__/Input.test.tsx
  
🟠 Minimal Testing:
  - components/__tests__/ErrorBoundary.test.tsx
  - features/home/components/__tests__/SyncStatusIndicator.test.tsx
  - lib/__tests__/sentry.test.ts
  - navigation/__tests__/navigationRef.test.ts
```

---

## Critical Testing Gaps (P0)

### 1. Sync Service Logic Untested

**File**: `services/syncService.ts` (1000+ lines)  
**Current Tests**: Basic unit tests only  
**Missing Tests**:

```typescript
// ❌ NOT TESTED:
describe('Sync Service Integration', () => {
  it('should process deletes before inserts/updates', () => {
    // CRITICAL: This prevents foreign key errors
    // No test exists!
  });

  it('should retry failed syncs with exponential backoff', () => {
    // CRITICAL: Network resilience
    // No test exists!
  });

  it('should handle concurrent sync attempts', () => {
    // CRITICAL: Race condition prevention
    // No test exists!
  });

  it('should preserve data if Supabase is down', () => {
    // CRITICAL: Offline-first guarantee
    // No test exists!
  });
});
```

**Why This Matters**:
- Sync service is critical for data integrity
- Bugs here can cause data loss or corruption
- Complex retry logic needs verification

**Recommended Tests**:
```typescript
// services/__tests__/syncService.integration.test.ts

import { processSyncQueue } from '../syncService';
import { mockDatabase } from '../../test-utils/mocks/mockDatabase';
import { mockSupabase } from '../../test-utils/mocks/mockSupabase';

describe('Sync Service Integration Tests', () => {
  let db: MockDatabase;
  let supabase: MockSupabase;

  beforeEach(() => {
    db = createMockDatabase();
    supabase = createMockSupabase();
  });

  describe('Delete-Before-Insert Logic', () => {
    it('should process deletes before inserts', async () => {
      // Add delete + insert to queue
      await addToSyncQueue(db, 'journal_entries', 'id1', 'delete');
      await addToSyncQueue(db, 'journal_entries', 'id2', 'insert');

      // Process queue
      await processSyncQueue(db);

      // Verify order: delete called before insert
      const calls = supabase.getCalls();
      expect(calls[0].method).toBe('delete');
      expect(calls[1].method).toBe('insert');
    });

    it('should handle foreign key dependencies', async () => {
      // Delete parent entry that has shared_entries children
      // Verify: shared_entries deleted first, then parent
    });
  });

  describe('Retry Logic', () => {
    it('should retry up to 3 times with exponential backoff', async () => {
      supabase.failNextNCalls(2); // Fail twice, succeed third time

      await addToSyncQueue(db, 'journal_entries', 'id1', 'insert');
      await processSyncQueue(db);

      expect(supabase.getCallCount()).toBe(3);
      // Verify: backoff delays are 1s, 2s, 4s (exponential)
    });

    it('should mark as failed after 3 retries', async () => {
      supabase.alwaysFail();

      await addToSyncQueue(db, 'journal_entries', 'id1', 'insert');
      await processSyncQueue(db);

      const item = await db.getFirstAsync(
        'SELECT * FROM sync_queue WHERE record_id = ?',
        ['id1']
      );
      expect(item.retry_count).toBe(3);
      expect(item.last_error).toBeDefined();
    });
  });

  describe('Offline Resilience', () => {
    it('should queue operations when offline', async () => {
      supabase.setOffline();

      // Create journal entry (should queue, not sync immediately)
      await createJournalEntry(db, { /* ... */ });

      const queueLength = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM sync_queue'
      );
      expect(queueLength.count).toBe(1);
    });

    it('should process queue when coming back online', async () => {
      // Add items while offline
      supabase.setOffline();
      await createJournalEntry(db, { /* ... */ });
      await createJournalEntry(db, { /* ... */ });

      // Come back online
      supabase.setOnline();
      await processSyncQueue(db);

      // Verify: queue is empty, items synced to Supabase
      const queueLength = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM sync_queue WHERE sync_status = "pending"'
      );
      expect(queueLength.count).toBe(0);
    });
  });
});
```

**Estimated Work**: 8-10 hours to write comprehensive sync tests

**Action Items**:
- [ ] Create `syncService.integration.test.ts`
- [ ] Test delete-before-insert order
- [ ] Test retry logic with exponential backoff
- [ ] Test offline/online transitions
- [ ] Test concurrent sync attempts (mutex)

---

### 2. Feature Hooks Mostly Untested

**Missing Tests**:
- `useJournalEntries.ts` - 434 lines, 0 tests
- `useStepWork.ts` - Unknown lines, 0 tests
- `useSponsorships.ts` - Unknown lines, 0 tests

**Why This Matters**:
- Hooks contain business logic (encryption, decryption, optimistic updates)
- Errors here directly impact UX (data loss, incorrect display)

**Recommended Tests**:
```typescript
// features/journal/hooks/__tests__/useJournalEntries.test.tsx

import { renderHook, waitFor } from '@testing-library/react-native';
import { useJournalEntries, useCreateJournalEntry } from '../useJournalEntries';
import { TestWrapper } from '../../../test-utils/TestWrapper';

describe('useJournalEntries', () => {
  it('should fetch and decrypt journal entries', async () => {
    const { result } = renderHook(() => useJournalEntries('user123'), {
      wrapper: TestWrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.entries).toHaveLength(3);
    expect(result.current.entries[0].body).toBe('Decrypted content');
  });

  it('should handle encryption errors gracefully', async () => {
    // Mock encryption to throw error
    mockEncryptionFailure();

    const { result } = renderHook(() => useJournalEntries('user123'), {
      wrapper: TestWrapper,
    });

    await waitFor(() => expect(result.current.error).toBeDefined());
  });
});

describe('useCreateJournalEntry', () => {
  it('should encrypt content before saving', async () => {
    const { result } = renderHook(() => useCreateJournalEntry('user123'), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.createEntry({
        title: 'My Entry',
        body: 'Secret content',
        mood: 4,
        craving: 2,
        tags: ['gratitude'],
      });
    });

    // Verify: content was encrypted before database insert
    const dbEntry = await db.getFirstAsync(
      'SELECT * FROM journal_entries ORDER BY created_at DESC LIMIT 1'
    );
    expect(dbEntry.encrypted_body).toMatch(/^[0-9a-f]+:[A-Za-z0-9+/=]+:[0-9a-f]+$/);
    expect(dbEntry.encrypted_body).not.toContain('Secret content');
  });

  it('should queue for sync after creation', async () => {
    // Test that addToSyncQueue is called
  });

  it('should update cache optimistically', async () => {
    // Test optimistic update before server response
  });
});
```

**Estimated Work**: 6-8 hours per major hook

**Action Items**:
- [ ] Test `useJournalEntries` (all CRUD operations)
- [ ] Test `useCheckIns` (already has tests, verify coverage)
- [ ] Test `useStepWork` (CRUD + encryption)
- [ ] Test `useSponsorships` (connection flow)

---

### 3. Database Migrations Untested

**Issue**: No tests for database schema migrations  
**Risk**: Schema changes could break existing databases

**Missing Tests**:
```typescript
// utils/__tests__/database.test.ts

describe('Database Migrations', () => {
  it('should initialize fresh database with all tables', async () => {
    const db = await createFreshDatabase();
    await initDatabase(db);

    // Verify all tables exist
    const tables = await db.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    const tableNames = tables.map(t => t.name);

    expect(tableNames).toContain('user_profile');
    expect(tableNames).toContain('journal_entries');
    expect(tableNames).toContain('daily_checkins');
    expect(tableNames).toContain('step_work');
    expect(tableNames).toContain('sync_queue');
  });

  it('should migrate from v1 to v2 schema', async () => {
    // Create database with v1 schema
    const db = await createDatabaseWithVersion(1);

    // Run migration to v2
    await migrateDatabase(db, 2);

    // Verify new columns/tables exist
    const schema = await db.getFirstAsync(
      "PRAGMA table_info('daily_checkins')"
    );
    expect(schema).toContainColumn('encrypted_gratitude');
  });

  it('should be idempotent (safe to run twice)', async () => {
    const db = await createFreshDatabase();
    await initDatabase(db);
    await initDatabase(db); // Run again

    // Should not crash, should not duplicate tables
    const tables = await db.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    // Verify no duplicates
  });
});
```

**Estimated Work**: 4-5 hours

**Action Items**:
- [ ] Create `database.test.ts`
- [ ] Test fresh database initialization
- [ ] Test migrations (v1 → v2, v2 → v3, etc.)
- [ ] Test idempotency (safe to run twice)

---

## Important Testing Gaps (P1)

### 4. UI Component Testing

**Current**: 3 components tested (Button, Card, Input)  
**Total**: 50+ components in codebase  
**Coverage**: ~6%

**Missing Tests**:
```typescript
// Example: JournalCard.test.tsx
describe('JournalCard', () => {
  it('should display decrypted journal entry', () => {
    const entry = {
      id: '1',
      title: 'My Entry',
      body: 'This is my journal entry',
      mood: 4,
      created_at: '2026-01-01T00:00:00Z',
    };

    const { getByText } = render(<JournalCard entry={entry} />);

    expect(getByText('My Entry')).toBeTruthy();
    expect(getByText('This is my journal entry')).toBeTruthy();
  });

  it('should handle missing title gracefully', () => {
    const entry = { /* no title */ };
    const { queryByText } = render(<JournalCard entry={entry} />);
    // Should not crash
  });

  it('should call onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <JournalCard entry={entry} onPress={onPress} />
    );

    fireEvent.press(getByTestId('journal-card'));
    expect(onPress).toHaveBeenCalledWith(entry.id);
  });
});
```

**Priority Components to Test**:
1. `JournalCard` - Displays journal entries
2. `CleanTimeTracker` - Displays sobriety time
3. `DailyCheckInCard` - Morning/evening check-ins
4. `StepTimelineCard` - Step work progress
5. `AchievementCard` - Milestone achievements

**Estimated Work**: 1-2 hours per component

**Action Items**:
- [ ] Test top 10 most-used components
- [ ] Test components with complex logic
- [ ] Add snapshot tests for visual regression

---

### 5. Screen Testing

**Current**: 0 screens tested  
**Total**: 20+ screens in app  
**Coverage**: 0%

**Why This Matters**:
- Screens tie together multiple components + hooks
- Integration points are high-risk for bugs

**Recommended Approach**: Test critical user flows

```typescript
// features/journal/__tests__/JournalFlow.test.tsx

describe('Journal Flow', () => {
  it('should create a new journal entry end-to-end', async () => {
    const { getByText, getByPlaceholderText } = render(<App />);

    // Navigate to journal
    fireEvent.press(getByText('Journal'));

    // Tap "New Entry" button
    fireEvent.press(getByText('New Entry'));

    // Fill in entry
    fireEvent.changeText(getByPlaceholderText('Title'), 'My Day');
    fireEvent.changeText(getByPlaceholderText('Body'), 'Today was good');

    // Save
    fireEvent.press(getByText('Save'));

    // Verify: Entry appears in list
    await waitFor(() => {
      expect(getByText('My Day')).toBeTruthy();
    });
  });
});
```

**Priority Screens to Test**:
1. Login flow (sign in + sign up)
2. Onboarding flow (encryption key generation)
3. Journal create/edit flow
4. Daily check-in flow
5. Step work flow

**Estimated Work**: 3-4 hours per flow

**Action Items**:
- [ ] Set up E2E testing (Detox or Maestro)
- [ ] Test critical user flows
- [ ] Add to CI/CD pipeline

---

### 6. Error Boundary Testing

**Current**: Basic test exists (`ErrorBoundary.test.tsx`)  
**Missing**: Integration with real errors

**Recommended Tests**:
```typescript
describe('ErrorBoundary', () => {
  it('should catch encryption errors', () => {
    const ThrowingComponent = () => {
      throw new EncryptionError('Key not found');
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(getByText(/encryption error/i)).toBeTruthy();
  });

  it('should show recovery options', () => {
    // Verify: User can reload or go home
  });

  it('should log to Sentry', () => {
    // Verify: Error logged to error tracking
  });
});
```

**Action Items**:
- [ ] Expand ErrorBoundary tests
- [ ] Test integration with Sentry
- [ ] Test user recovery options

---

## Testing Infrastructure Gaps

### 7. Missing Test Utilities

**Current**: Basic mocks exist  
**Missing**: Comprehensive test utilities

**Recommended Additions**:

```typescript
// test-utils/TestWrapper.tsx
export function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <AuthProvider>
        <DatabaseProvider>
          {children}
        </DatabaseProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// test-utils/factories/journalEntry.ts
export function createMockJournalEntry(overrides = {}) {
  return {
    id: generateId(),
    user_id: 'test-user',
    title: 'Test Entry',
    body: 'Test content',
    mood: 4,
    craving: 2,
    tags: [],
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// test-utils/database.ts
export async function createTestDatabase() {
  const db = await createInMemoryDatabase();
  await initDatabase(db);
  return db;
}

export async function seedDatabase(db: Database, data: SeedData) {
  // Insert test data
}
```

**Action Items**:
- [ ] Create `TestWrapper` component
- [ ] Create factory functions for test data
- [ ] Create database seeding utilities

---

### 8. CI/CD Integration

**Current**: Tests can be run locally  
**Missing**: Automated testing in CI/CD

**Recommended GitHub Actions**:
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

**Action Items**:
- [ ] Add GitHub Actions workflow
- [ ] Run tests on every PR
- [ ] Block merge if tests fail
- [ ] Upload coverage to Codecov

---

## Test Coverage Goals

### Current (Estimated):
- **Utils**: ~80% (encryption is fully tested)
- **Contexts**: ~60% (auth + sync tested)
- **Hooks**: ~10% (only useCheckIns tested)
- **Components**: ~5% (3 components tested)
- **Screens**: 0%
- **Services**: ~20% (basic sync tests only)
- **Overall**: ~30%

### Target (MVP Launch):
- **Utils**: 90%+ (maintain high coverage)
- **Contexts**: 80%+ (critical infrastructure)
- **Hooks**: 70%+ (business logic)
- **Components**: 50%+ (focus on critical components)
- **Screens**: 30%+ (focus on critical user flows)
- **Services**: 80%+ (critical for data integrity)
- **Overall**: 70%+

---

## Testing Priority Matrix

### P0 - Critical (Must Have Before Launch):
1. ✅ Encryption utils (DONE - excellent coverage)
2. 🔧 Sync service integration tests
3. 🔧 Database migration tests
4. 🔧 Critical user flow tests (journal, check-ins)

### P1 - Important (Should Have Soon):
1. Feature hook tests (useJournalEntries, useStepWork)
2. Component tests (top 10 components)
3. Error boundary tests
4. CI/CD integration

### P2 - Nice to Have (Later):
1. Visual regression tests (snapshot testing)
2. Performance tests (render time, bundle size)
3. Accessibility tests (screen reader compatibility)
4. Load tests (1000s of journal entries)

---

## Testing Checklist

### Before MVP Launch:
- [ ] Sync service integration tests (8-10 hours)
- [ ] Database migration tests (4-5 hours)
- [ ] Journal flow E2E test (3-4 hours)
- [ ] Check-in flow E2E test (3-4 hours)
- [ ] CI/CD integration (2-3 hours)
- **Total**: ~20-25 hours

### Before Full Launch:
- [ ] Feature hook tests (20-25 hours)
- [ ] Component tests (15-20 hours)
- [ ] Error boundary tests (2-3 hours)
- [ ] Performance tests (4-5 hours)
- **Total**: ~40-50 hours

---

**Bottom Line**: Test coverage is **good for critical paths** (encryption, auth) but has **major gaps** in sync service, feature hooks, and UI components. Priority should be:
1. Sync service integration tests (CRITICAL for data integrity)
2. Database migration tests (CRITICAL for schema changes)
3. Critical user flow tests (HIGH for UX confidence)
4. Feature hook tests (IMPORTANT for business logic)
