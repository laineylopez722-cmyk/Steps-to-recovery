# Testing Strategy - Steps to Recovery

**Epic 2**: Testing & Quality Assurance
**Status**: In Progress
**Target Coverage**: 75% global, 100% for security-critical modules

---

## Testing Philosophy

### Priorities
1. **Security First**: 100% coverage for encryption (user data protection)
2. **Critical Path**: 90%+ coverage for sync service (data integrity)
3. **User Experience**: 95%+ for UI components (prevent regressions)
4. **Foundation**: 80%+ for hooks and utilities

### Testing Pyramid
```
        /\
       /E2E\         4h - Optional (Detox/Maestro)
      /------\
     /Component\     6h - UI behavior + accessibility
    /----------\
   /Integration\    6h - Sync flows, hooks, contexts
  /--------------\
 /  Unit Tests   \  4h - Utils, encryption, helpers
/------------------\
```

---

## Test Infrastructure

### Dependencies
```json
{
  "@testing-library/react-native": "^12.4.0",
  "@testing-library/jest-native": "^5.4.3",
  "jest-expo": "^51.0.0",
  "@testing-library/react-hooks": "^8.0.1"
}
```

### Configuration
**jest.config.js**:
- Preset: `jest-expo`
- Transform: Ignore React Native node_modules
- Setup files: jest-native matchers
- Coverage thresholds:
  - Global: 75%
  - encryption.ts: 100%
  - syncService.ts: 90%
  - Components: 95%

---

## Unit Tests (Story 2.2)

### Target: `src/utils/encryption.ts`
**Coverage Requirement**: 100% (security-critical)

**Test Cases**:
1. **Key Generation** (5 tests)
   - ✅ Generates 256-bit key
   - ✅ Stores in SecureStore
   - ✅ Uses PBKDF2 (100k iterations)
   - ✅ Salt generation
   - ✅ Returns valid key string

2. **Encryption** (7 tests)
   - ✅ Encrypts plaintext successfully
   - ✅ Returns IV:ciphertext format
   - ✅ Different IVs for same input
   - ✅ Handles empty strings
   - ✅ Handles special characters
   - ✅ Handles emojis
   - ✅ Throws error if no key

3. **Decryption** (6 tests)
   - ✅ Decrypts to original plaintext
   - ✅ Validates IV:ciphertext format
   - ✅ Throws on invalid format
   - ✅ Throws on corrupted data
   - ✅ Throws if no key exists
   - ✅ Handles long strings (>10KB)

4. **Round-trip** (3 tests)
   - ✅ encrypt → decrypt returns original
   - ✅ Works with complex JSON
   - ✅ Maintains data integrity

5. **Key Management** (4 tests)
   - ✅ hasEncryptionKey() accuracy
   - ✅ deleteEncryptionKey() removes key
   - ✅ Post-delete state correct
   - ✅ getEncryptionKey() returns null after delete

**Total**: 25 test cases

### Target: `src/utils/logger.ts`
**Coverage Requirement**: 80%

**Test Cases**:
1. **Development Mode**
   - Calls console.error for errors
   - Calls console.warn for warnings
   - Calls console.log for info/debug
   - Includes data in logs

2. **Production Mode**
   - No console output
   - TODO: Sentry integration

**Total**: 6 test cases

---

## Integration Tests (Story 2.3)

### Target: `src/services/syncService.ts`
**Coverage Requirement**: 90%

**Test Cases**:

1. **Queue Processing** (8 tests)
   - ✅ Empty queue returns zero counts
   - ✅ Processes items in FIFO order
   - ✅ Respects maxBatchSize (50)
   - ✅ Increments retry_count on failure
   - ✅ Removes from queue on success
   - ✅ Skips items with retry_count >= 3
   - ✅ Returns accurate sync counts
   - ✅ Handles mixed success/failure

2. **Journal Entry Sync** (10 tests)
   - ✅ Syncs new entry (generates UUID)
   - ✅ Syncs updated entry (uses supabase_id)
   - ✅ Maps encrypted_body → content
   - ✅ Maps encrypted_title → title
   - ✅ Maps encrypted_mood → mood
   - ✅ Maps encrypted_tags → tags array
   - ✅ Updates sync_status to 'synced'
   - ✅ Stores supabase_id locally
   - ✅ Handles missing optional fields
   - ✅ Supabase error increments retry

3. **Step Work Sync** (6 tests)
   - ✅ Maps question_number + answer to content
   - ✅ Handles is_complete boolean conversion
   - ✅ Updates sync_status
   - ✅ Generates UUID
   - ✅ Handles null answers
   - ✅ Supabase error increments retry

4. **Daily Check-in Sync** (3 tests)
   - ✅ Logs warning (schema missing)
   - ✅ Returns error message
   - ✅ Doesn't increment retry_count

5. **Error Handling** (8 tests)
   - ✅ Network error increments retry
   - ✅ Invalid table_name logs error
   - ✅ Missing record returns error
   - ✅ Supabase RLS violation handled
   - ✅ Max retries (3) stops processing
   - ✅ Exponential backoff delays (1s, 2s, 4s)
   - ✅ Error messages sanitized (no PII)
   - ✅ Failed items remain in queue

6. **Batch Processing** (4 tests)
   - ✅ Processes max 50 items
   - ✅ Leaves remaining items in queue
   - ✅ Returns accurate counts
   - ✅ Multiple batches work correctly

7. **Add to Queue** (5 tests)
   - ✅ Inserts new queue item
   - ✅ UNIQUE constraint prevents duplicates
   - ✅ Generates unique queue ID
   - ✅ Sets retry_count to 0
   - ✅ Stores operation type correctly

**Total**: 44 test cases

### Target: `src/contexts/SyncContext.tsx`
**Coverage Requirement**: 85%

**Test Cases**:

1. **State Management** (6 tests)
   - Initial state correct
   - triggerSync updates isSyncing
   - Updates lastSyncTime on success
   - Updates pendingCount from database
   - Stores error on failure
   - clearError removes error

2. **Network Detection** (5 tests)
   - Detects online state
   - Detects offline state
   - Updates isOnline on change
   - Triggers sync when coming online
   - Doesn't sync when going offline

3. **Background Sync** (4 tests)
   - Syncs every 5 minutes (when online)
   - Skips sync when offline
   - Skips sync when already syncing
   - Cleans up interval on unmount

4. **Foreground Sync** (3 tests)
   - Syncs when app foregrounded
   - Skips if offline
   - Skips if already syncing

**Total**: 18 test cases

---

## Component Tests (Story 2.4)

### Target: `src/features/home/components/SyncStatusIndicator.tsx`
**Coverage Requirement**: 95%

**Test Cases**:

1. **Visual States** (5 tests)
   - ✅ Offline: gray cloud icon, "Offline" text
   - ✅ Syncing: spinner, "Syncing..." text
   - ✅ Error: red alert icon, "Sync Error"
   - ✅ Pending: orange upload icon, "{count} Pending"
   - ✅ Synced: green check icon, "Synced"

2. **Time Formatting** (6 tests)
   - < 1 min → "Just now"
   - 5 mins → "5m ago"
   - 30 mins → "30m ago"
   - 2 hours → "2h ago"
   - 3 days → "3d ago"
   - null → "Never"

3. **User Interactions** (5 tests)
   - Tap online → calls triggerSync()
   - Tap offline → no action (disabled)
   - Tap syncing → no action (disabled)
   - Tap error → calls triggerSync() (retry)
   - activeOpacity provides feedback

4. **Pending Count** (3 tests)
   - Shows "1 Pending" (singular)
   - Shows "5 Pending" (plural)
   - Shows "Synced" when 0

5. **Real-time Updates** (4 tests)
   - pendingCount change updates label
   - isOnline change updates icon
   - isSyncing toggles spinner
   - error change updates state

**Total**: 23 test cases

### Target: Other Components
**Coverage Requirement**: 80%

- CleanTimeTracker (12 tests)
- DailyCheckInCard (10 tests)
- QuickActions (8 tests)

---

## E2E Tests (Story 2.5 - Optional)

### Tool: Detox or Maestro
**Coverage**: Critical user flows only

**Test Flows**:
1. **Onboarding → First Journal Entry**
   - Sign up
   - Complete onboarding
   - Create journal entry
   - Verify encryption
   - Verify sync

2. **Daily Check-in Flow**
   - Morning check-in
   - Evening check-in
   - View streak

3. **Sync Flow**
   - Create entry offline
   - Go online
   - Verify auto-sync
   - Check Supabase

**Estimated Effort**: 4 hours (if time permits)

---

## Mocking Strategy

### Expo Modules
```typescript
// expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// expo-sqlite
jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => mockDatabase,
}));

// expo-crypto
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(),
  randomUUID: jest.fn(),
}));

// @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
}));
```

### Supabase Client
```typescript
// src/test-utils/mocks/mockSupabase.ts
export const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
};
```

### SQLite Database
```typescript
// src/test-utils/mocks/mockSQLite.ts
export const mockDatabase = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
  execAsync: jest.fn(),
};
```

---

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - name: Check coverage
        run: |
          npm test -- --coverage --coverageThreshold='{"global":{"lines":75}}'
```

### Coverage Enforcement
- Pull requests blocked if coverage < 75%
- Critical files (encryption) require 100%
- Coverage reports in PR comments

---

## Success Metrics

### Quantitative
- ✅ Global coverage ≥ 75%
- ✅ encryption.ts coverage = 100%
- ✅ syncService.ts coverage ≥ 90%
- ✅ All tests pass
- ✅ No flaky tests

### Qualitative
- ✅ Tests are maintainable
- ✅ Tests document behavior
- ✅ Fast execution (<2 min total)
- ✅ Clear error messages
- ✅ Easy to add new tests

---

## Timeline

| Story | Effort | Dependencies | Status |
|-------|--------|--------------|--------|
| 2.1: Infrastructure | 4h | None | 🔄 In Progress |
| 2.2: Unit Tests | 4h | 2.1 complete | 🔄 In Progress |
| 2.3: Integration Tests | 6h | 2.1 complete | 🔄 In Progress |
| 2.4: Component Tests | 6h | 2.1 complete | 🔄 In Progress |
| 2.5: E2E (Optional) | 4h | All above | ⏸️ Deferred |

**Total**: 20 hours (24h if E2E included)

---

## Risk Mitigation

### Risk 1: Mocking Complexity
**Issue**: Expo modules difficult to mock
**Mitigation**: Use jest.mock with documented patterns
**Fallback**: Minimal mocking, focus on business logic

### Risk 2: Flaky Tests
**Issue**: Async operations, timing issues
**Mitigation**: Use waitFor, proper cleanup
**Monitoring**: Track flaky test rate

### Risk 3: Low Coverage
**Issue**: Hard-to-test edge cases
**Mitigation**: Start with happy paths, add edge cases iteratively
**Acceptance**: 75% is acceptable for MVP

---

## Next Steps After Epic 2

1. **Integrate with CI/CD** - GitHub Actions workflow
2. **Coverage Badges** - Add to README.md
3. **Test in PR Reviews** - Require tests for new features
4. **Monitor Flakiness** - Track and fix unreliable tests
5. **Expand Coverage** - Target 85% over time

---

**Last Updated**: 2025-12-31
**Status**: Epic 2 in progress (4 agents working in parallel)
**Expected Completion**: End of Day 1
