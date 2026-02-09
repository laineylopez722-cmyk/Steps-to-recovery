# Testing Guide - Steps to Recovery

**Last Updated**: 2026-01-01
**Test Framework**: Jest + React Testing Library
**Current Coverage**: 101 tests passing

---

## Quick Start

### Run All Tests
```bash
cd apps/mobile
npm test
```

### Run Specific Test Suite
```bash
npm test encryption.test.ts    # Encryption tests only
npm test syncService.test.ts   # Sync service tests only
```

### Watch Mode (Development)
```bash
npm test:watch
```

### Coverage Report
```bash
npm test:coverage

# View HTML report
open coverage/index.html
```

---

## Test Structure

### Directory Layout
```
apps/mobile/src/
├── utils/
│   ├── encryption.ts
│   └── __tests__/
│       └── encryption.test.ts        # 57 tests (100% coverage)
├── services/
│   ├── syncService.ts
│   └── __tests__/
│       └── syncService.test.ts       # 44 tests (86% coverage)
└── test-utils/
    ├── setup.ts                      # Global test setup
    ├── setup-jest.ts                 # Mock setup
    └── mocks/
        ├── mockSupabase.ts
        ├── mockSQLite.ts
        └── fileMock.ts
```

---

## Test Coverage Goals

### Critical Modules (100% Coverage)
- ✅ **encryption.ts**: 100% (security-critical)
  - Key generation, encryption, decryption
  - Edge cases, error handling

### Integration Modules (90%+ Coverage)
- ✅ **syncService.ts**: 86% (core infrastructure)
  - Queue processing, batch operations
  - Retry logic, error handling

### UI Components (Deferred)
- ⏸️ Component tests skipped (React Native complexity)
- Manual testing in Expo Go

---

## Writing Tests

### Unit Test Example
```typescript
// src/utils/__tests__/myUtil.test.ts
import { myFunction } from '../myUtil';

describe('myFunction()', () => {
  it('should handle valid input', () => {
    const result = myFunction('test');
    expect(result).toBe('expected');
  });

  it('should throw on invalid input', () => {
    expect(() => myFunction('')).toThrow('Error message');
  });
});
```

### Integration Test Example
```typescript
// src/services/__tests__/myService.test.ts
import { mockDatabase } from '../../test-utils/mocks/mockSQLite';
import { myService } from '../myService';

describe('myService', () => {
  beforeEach(() => {
    mockDatabase.getAllAsync.mockClear();
  });

  it('should query database', async () => {
    mockDatabase.getAllAsync.mockResolvedValue([{ id: 1 }]);

    const result = await myService();

    expect(result).toHaveLength(1);
    expect(mockDatabase.getAllAsync).toHaveBeenCalled();
  });
});
```

---

## Mocking Strategy

### Expo Modules
Mocked in `src/test-utils/setup-jest.ts`:
- `expo-secure-store`
- `expo-crypto`
- `expo-sqlite`
- `@react-native-community/netinfo`

**Usage**:
```typescript
import * as SecureStore from 'expo-secure-store';

// In test
(SecureStore.getItemAsync as jest.Mock).mockResolvedValue('mock-key');
```

### Supabase Client
Mock in `src/test-utils/mocks/mockSupabase.ts`:
```typescript
import { mockSupabase } from '../../test-utils/mocks/mockSupabase';

// In test
mockSupabase.from.mockReturnThis();
mockSupabase.upsert.mockResolvedValue({ data: null, error: null });
```

### SQLite Database
Mock in `src/test-utils/mocks/mockSQLite.ts`:
```typescript
import { mockDatabase } from '../../test-utils/mocks/mockSQLite';

// In test
mockDatabase.getAllAsync.mockResolvedValue([/* rows */]);
mockDatabase.runAsync.mockResolvedValue(undefined);
```

---

## Test Patterns

### Async Functions
```typescript
it('should handle async operations', async () => {
  const promise = asyncFunction();
  await expect(promise).resolves.toBe('result');
});
```

### Error Handling
```typescript
it('should throw on error', async () => {
  mockDatabase.runAsync.mockRejectedValue(new Error('DB error'));

  await expect(myFunction()).rejects.toThrow('DB error');
});
```

### Timeouts (Long-Running Tests)
```typescript
it('should wait for backoff', async () => {
  // Test implementation
}, 15000); // 15 second timeout
```

---

## Running Tests in CI/CD

### GitHub Actions Example
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

      - name: Install dependencies
        run: npm ci
        working-directory: apps/mobile

      - name: Run tests
        run: npm test -- --coverage
        working-directory: apps/mobile

      - name: Check coverage
        run: |
          npm test -- --coverage --coverageThreshold='{"global":{"lines":50}}'
        working-directory: apps/mobile
```

---

## Test Scenarios

### Encryption Tests (57 tests)
**Coverage**: 100%

1. **Key Generation** (6 tests)
   - Generates 256-bit key
   - Stores in SecureStore
   - Uses PBKDF2 (100k iterations)
   - Random salt generation

2. **Encryption** (6 tests)
   - Encrypts plaintext successfully
   - Returns IV:ciphertext format
   - Different IVs for same input
   - Handles special characters, emojis

3. **Decryption** (6 tests)
   - Decrypts to original plaintext
   - Validates IV:ciphertext format
   - Throws on corrupted data
   - Handles long strings (>10KB)

4. **Round-Trip** (7 tests)
   - encrypt → decrypt returns original
   - Works with JSON, multiline text
   - Maintains data integrity

5. **Key Management** (4 tests)
   - hasEncryptionKey() accuracy
   - deleteEncryptionKey() removes key
   - State correct after deletion

6. **Security Properties** (5 tests)
   - Random IV for each encryption
   - AES-256-CBC mode verified
   - Different salts produce different keys

7. **Error Handling** (5 tests)
   - SecureStore errors handled
   - Invalid data format handled
   - Crypto errors handled

8. **Edge Cases** (5 tests)
   - Very long content (100KB)
   - Null bytes, whitespace
   - Rapid successive encryptions

### Sync Service Tests (44 tests)
**Coverage**: 86%

1. **Queue Management** (5 tests)
   - addToSyncQueue inserts correctly
   - UNIQUE constraint prevents duplicates
   - Retry count initialized to 0

2. **Journal Entry Sync** (10 tests)
   - Syncs new entry (generates UUID)
   - Syncs updated entry (uses supabase_id)
   - Maps encrypted fields correctly
   - Updates sync_status to 'synced'
   - Handles missing optional fields
   - Supabase errors increment retry

3. **Step Work Sync** (6 tests)
   - Maps question_number + answer to content
   - Handles is_complete boolean
   - Generates UUID for Supabase
   - Handles null answers

4. **Daily Check-in Sync** (3 tests)
   - Logs warning (schema missing)
   - Returns error message
   - Doesn't increment retry_count

5. **Queue Processing** (8 tests)
   - Empty queue returns zero counts
   - Processes items in FIFO order
   - Respects maxBatchSize (50)
   - Increments retry_count on failure
   - Removes from queue on success
   - Skips items with retry_count >= 3

6. **Error Handling** (8 tests)
   - Network errors handled
   - Invalid table_name logged
   - Missing records handled
   - Max retries (3) stops processing
   - Exponential backoff delays (1s, 2s, 4s)
   - Error messages sanitized (no PII)

7. **Batch Processing** (4 tests)
   - Processes max 50 items
   - Leaves remaining items in queue
   - Returns accurate counts
   - Multiple batches work correctly

---

## Debugging Tests

### View Test Output
```bash
npm test -- --verbose
```

### Run Single Test
```bash
npm test -- -t "should encrypt plaintext successfully"
```

### Debug in VS Code
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/apps/mobile/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "cwd": "${workspaceFolder}/apps/mobile",
  "console": "integratedTerminal"
}
```

---

## Known Issues

### Test File Type Errors
**Issue**: TypeScript errors in test files (not production code)
**Impact**: None - tests still pass
**Files Affected**:
- `SyncStatusIndicator.test.tsx` (component test - skipped)
- `syncService.test.ts` (minor type warnings)

**Resolution**: Ignored for MVP (tests passing, production code type-safe)

---

## Adding New Tests

### 1. Create Test File
```bash
# Match source file structure
src/utils/myUtil.ts → src/utils/__tests__/myUtil.test.ts
```

### 2. Import Mocks
```typescript
import { mockDatabase } from '../../test-utils/mocks/mockSQLite';
import { mockSupabase } from '../../test-utils/mocks/mockSupabase';
```

### 3. Write Tests
```typescript
describe('myFunction', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should do something', () => {
    // Test implementation
  });
});
```

### 4. Run & Verify
```bash
npm test myUtil.test.ts
```

---

## Best Practices

### DO
- ✅ Test business logic thoroughly
- ✅ Mock external dependencies (DB, network)
- ✅ Test error handling
- ✅ Use descriptive test names
- ✅ Clear mocks between tests (`beforeEach`)

### DON'T
- ❌ Test implementation details
- ❌ Write tests that depend on each other
- ❌ Mock everything (test real code when possible)
- ❌ Skip error cases
- ❌ Leave tests incomplete

---

## Test Maintenance

### Update Mocks for New Features
When adding new Expo modules:
```typescript
// Add to src/test-utils/setup-jest.ts
jest.mock('expo-new-module', () => ({
  newFunction: jest.fn(),
}));
```

### Update Coverage Thresholds
```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 75,
    functions: 75,
    lines: 75,
    statements: 75,
  },
}
```

---

## Resources

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro
- **Testing Strategy**: `_bmad-output/TESTING_STRATEGY.md`

---

## Summary

**Current Status**: 101 tests passing ✅
**Critical Coverage**: 100% encryption, 86% sync
**Recommended**: Run tests before every commit

```bash
# Pre-commit hook
npm test && git commit
```
