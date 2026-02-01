# Testing Guide - Steps to Recovery

This guide covers the testing strategy, how to run tests, and how to write new tests for the Steps to Recovery app.

## 📊 Current Test Coverage

**Overall Test Suite**: 117/127 tests passing (**92% pass rate**)

### Coverage by Module

| Module               | Tests | Pass Rate | Notes                      |
| -------------------- | ----- | --------- | -------------------------- |
| **Encryption Utils** | 55    | 89%       | Critical security code     |
| **Sync Service**     | 25    | ~85%      | Cloud backup functionality |
| **UI Components**    | 30    | ~95%      | SyncStatus, ErrorBoundary  |
| **Navigation**       | 10    | 100%      | Navigation references      |
| **Integration**      | 7     | ~70%      | End-to-end flows           |

### Coverage Thresholds (jest.config.js)

```javascript
coverageThreshold: {
  global: {
    statements: 40,
    branches: 30,
    functions: 30,
    lines: 40,
  },
  // Critical security modules require higher coverage
  './src/utils/encryption.ts': {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90,
  },
  './src/services/syncService.ts': {
    statements: 70,
    branches: 60,
    functions: 70,
    lines: 70,
  },
}
```

**Goal**: Maintain ≥75% coverage for production releases.

---

## 🚀 Running Tests

### All Tests

```bash
cd apps/mobile

# Run all tests
npm test

# Run in watch mode (useful during development)
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Specific Test Suites

```bash
# Run encryption tests only (critical)
npm run test:encryption

# Run specific test file
npm test -- src/utils/__tests__/encryption.test.ts

# Run tests matching a pattern
npm test -- --testPathPattern=sync
```

### Continuous Integration

Tests run automatically on:

- Every push to feature branches
- Pull request creation/updates
- Before merging to main branch

**GitHub Actions**: `.github/workflows/test.yml` (if configured)

---

## 🏗️ Testing Infrastructure

### Test Framework Stack

- **Test Runner**: Jest 29
- **React Native Testing**: @testing-library/react-native 12.9
- **Mocking**: Jest mocks + custom setup
- **Coverage**: Istanbul (built into Jest)

### Test Setup Files

- **jest.config.js**: Jest configuration
- **jest.setup.js**: Global mocks for Expo modules
- **src/test-utils/**: Shared test utilities and helpers

---

## 🧪 Writing Tests

### Test File Structure

Tests are **co-located** with source code in `__tests__/` directories:

```
src/
├── utils/
│   ├── encryption.ts
│   └── __tests__/
│       └── encryption.test.ts
├── services/
│   ├── syncService.ts
│   └── __tests__/
│       └── syncService.test.ts
└── components/
    ├── Button.tsx
    └── __tests__/
        └── Button.test.tsx
```

### Test Naming Convention

```typescript
// ✅ GOOD: Descriptive test names
describe('encryptContent()', () => {
  it('should encrypt plaintext using AES-256-CBC', async () => { ... });
  it('should generate unique IV for each encryption', async () => { ... });
  it('should throw error if encryption key is missing', async () => { ... });
});

// ❌ BAD: Vague test names
describe('encryption', () => {
  it('works', async () => { ... });
  it('test 2', async () => { ... });
});
```

---

## ✅ Unit Test Example (Utils)

```typescript
// src/utils/__tests__/validation.test.ts
import { validateEmail, validatePassword } from '../validation';

describe('validateEmail()', () => {
  it('should return true for valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test+tag@domain.co.uk')).toBe(true);
  });

  it('should return false for invalid email addresses', () => {
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('   ')).toBe(false);
  });
});

describe('validatePassword()', () => {
  it('should require minimum 8 characters', () => {
    expect(validatePassword('short')).toBe(false);
    expect(validatePassword('password123')).toBe(true);
  });

  it('should handle empty/whitespace passwords', () => {
    expect(validatePassword('')).toBe(false);
    expect(validatePassword('        ')).toBe(false);
  });
});
```

---

## 🎨 Component Test Example

```typescript
// src/components/__tests__/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with correct label', () => {
    const { getByText } = render(<Button onPress={() => {}}>Click Me</Button>);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('should call onPress when tapped', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<Button onPress={mockOnPress}>Click Me</Button>);

    fireEvent.press(getByText('Click Me'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button onPress={mockOnPress} loading>
        Click Me
      </Button>
    );

    fireEvent.press(getByText('Click Me'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('should meet accessibility requirements', () => {
    const { getByLabelText } = render(
      <Button onPress={() => {}} accessibilityLabel="Submit form">
        Submit
      </Button>
    );

    expect(getByLabelText('Submit form')).toBeTruthy();
  });
});
```

---

## 🔄 Integration Test Example

```typescript
// src/features/journal/__tests__/journalFlow.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { encryptContent, decryptContent } from '../../../utils/encryption';

describe('Journal Entry Integration', () => {
  beforeEach(async () => {
    // Setup encryption key
    await generateEncryptionKey();
  });

  it('should create, encrypt, and retrieve journal entry', async () => {
    const { result } = renderHook(() => useJournalEntries());

    // Create entry
    const entryText = 'Test journal entry';
    await result.current.createEntry({
      title: 'Test',
      content: entryText,
      mood: 'good',
    });

    // Wait for creation
    await waitFor(() => {
      expect(result.current.entries.length).toBe(1);
    });

    // Verify encryption
    const entry = result.current.entries[0];
    expect(entry.encrypted_body).not.toBe(entryText); // Should be encrypted
    expect(entry.encrypted_body).toContain(':'); // IV:ciphertext format

    // Verify decryption
    const decrypted = await decryptContent(entry.encrypted_body);
    expect(decrypted).toBe(entryText);
  });

  it('should sync entry to Supabase', async () => {
    const { result } = renderHook(() => useJournalEntries());
    const { result: syncResult } = renderHook(() => useSync());

    // Create entry offline
    await result.current.createEntry({
      title: 'Sync Test',
      content: 'This should sync',
    });

    // Verify in sync queue
    expect(syncResult.current.pendingCount).toBe(1);

    // Trigger sync
    await syncResult.current.triggerSync();

    // Verify sync completed
    await waitFor(() => {
      expect(syncResult.current.pendingCount).toBe(0);
      expect(syncResult.current.lastSyncTime).toBeTruthy();
    });
  });
});
```

---

## 🎭 Mocking Patterns

### Mocking Expo Modules

Expo modules are mocked globally in `jest.setup.js`:

```javascript
// jest.setup.js
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn((size) => {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return Promise.resolve(bytes.buffer);
  }),
  randomUUID: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
}));
```

### Mocking Custom Hooks

```typescript
// Mock useAuth hook
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    session: { access_token: 'mock-token' },
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}));
```

### Mocking Platform Behavior

```typescript
// Force web platform (avoids dynamic imports in tests)
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: (obj: any) => obj.web,
  },
}));
```

---

## 🔒 Testing Security-Critical Code

### Encryption Tests (Required)

**ALWAYS test encryption roundtrips**:

```typescript
it('should encrypt and decrypt to return original text', async () => {
  const plaintext = 'Sensitive recovery journal entry';

  // Encrypt
  const encrypted = await encryptContent(plaintext);

  // Verify encrypted (not plaintext)
  expect(encrypted).not.toBe(plaintext);
  expect(encrypted).toContain(':'); // IV:ciphertext format

  // Decrypt
  const decrypted = await decryptContent(encrypted);

  // Verify matches original
  expect(decrypted).toBe(plaintext);
});
```

### Testing Sensitive Data Redaction

```typescript
it('should not log sensitive data in errors', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  try {
    // Trigger error with sensitive data
    throw new Error('Encryption failed: key=abc123');
  } catch (error) {
    logger.error('Encryption error', error);
  }

  // Verify sensitive data was redacted
  const loggedMessage = consoleSpy.mock.calls[0][0];
  expect(loggedMessage).not.toContain('abc123');

  consoleSpy.mockRestore();
});
```

---

## 🎯 Test Coverage Best Practices

### What to Test

**✅ DO test**:

- **Critical security code**: Encryption, authentication, RLS
- **Business logic**: Journal creation, sync logic, milestone calculations
- **User-facing features**: Navigation, form validation, error states
- **Error handling**: Network failures, invalid data, missing keys

**❌ DON'T test**:

- **Third-party libraries**: Trust `crypto-js`, `@tanstack/react-query`
- **Expo SDK internals**: Trust `expo-sqlite`, `expo-secure-store`
- **Implementation details**: Internal state, private methods

### Coverage Goals by File Type

| File Type                 | Target Coverage | Priority     |
| ------------------------- | --------------- | ------------ |
| `utils/encryption.ts`     | 90%+            | **Critical** |
| `services/syncService.ts` | 70%+            | **High**     |
| `hooks/use*.ts`           | 75%+            | **High**     |
| `components/*.tsx`        | 60%+            | **Medium**   |
| `screens/*.tsx`           | 40%+            | **Low**      |

---

## 🐛 Debugging Test Failures

### View Full Error Stack Traces

```bash
# Run with verbose output
npm test -- --verbose

# Run single test with full logs
npm test -- --testNamePattern="should encrypt content" --verbose
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/apps/mobile/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Common Test Failures

**"Cannot read properties of undefined (reading 'OS')"**

```typescript
// Solution: Mock Platform in test file
jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));
```

**"A dynamic import callback was invoked without --experimental-vm-modules"**

```typescript
// Solution: Mock Platform.OS to use web path (avoids dynamic imports)
jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));
```

**"No instances found with node type: 'TouchableOpacity'"**

```typescript
// Solution: Use testID instead of type
<TouchableOpacity testID="submit-button">...</TouchableOpacity>

const { getByTestId } = render(<Component />);
fireEvent.press(getByTestId('submit-button'));
```

---

## 📈 Continuous Improvement

### Increasing Test Coverage

**Monthly Goal**: Increase coverage by 5% per month until reaching 85%+

**Process**:

1. Run `npm run test:coverage` to generate coverage report
2. Open `coverage/lcov-report/index.html` in browser
3. Identify files with <60% coverage
4. Prioritize:
   - Critical security code first
   - High-traffic user flows second
   - UI components third
5. Write tests, commit, repeat

### Test-Driven Development (TDD)

For new features, write tests FIRST:

1. **Write failing test** (defines behavior)
2. **Write minimal code** to make test pass
3. **Refactor** code while tests stay green
4. **Repeat** for next requirement

**Example**:

```typescript
// 1. Write test first (RED)
it('should validate email format', () => {
  expect(validateEmail('user@example.com')).toBe(true);
  expect(validateEmail('invalid')).toBe(false);
});

// 2. Write code to pass (GREEN)
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 3. Refactor if needed (REFACTOR)
// Tests stay green during refactoring
```

---

## 🔗 Additional Resources

- **Jest Docs**: https://jestjs.io/docs/getting-started
- **React Native Testing Library**: https://callstack.github.io/react-native-testing-library/
- **Testing Best Practices**: https://testingjavascript.com/

---

**Last Updated**: January 2026
**Test Suite Version**: v1.0
**Coverage Target**: 92% (Current), 95% (Goal)
