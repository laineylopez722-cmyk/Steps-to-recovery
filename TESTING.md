# Testing Guide - Steps to Recovery

This guide covers the testing strategy, how to run tests, and how to write new tests for the Steps to Recovery app.

## 🧪 Test Types Overview

| Test Type             | Framework                           | Purpose                                      | Location                              |
| --------------------- | ----------------------------------- | -------------------------------------------- | ------------------------------------- |
| **Unit Tests**        | Jest + React Native Testing Library | Test individual functions, hooks, components | `**/__tests__/*.test.ts`              |
| **Integration Tests** | Jest + React Native Testing Library | Test feature interactions                    | `src/features/**/__tests__/*.test.ts` |
| **E2E Tests**         | Maestro                             | Test complete user flows                     | `.maestro/flows/*.yaml`               |

---

## 📊 Current Test Coverage

**Overall Test Suite**: Run `npm test` from `apps/mobile` to get current pass counts. _(Numbers change as tests are added/fixed.)_

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
- **React Native Testing**: @testing-library/react-native ^13.3.3
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

**Monthly Goal**: Increase coverage by 5% per month until reaching 75%+ overall

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

---

## 🎭 E2E Testing with Maestro

We use [Maestro](https://maestro.mobile.dev) for end-to-end testing. Maestro is a modern, YAML-based mobile UI testing framework that is fast, reliable, and easy to write.

### Why Maestro?

- **Declarative YAML syntax** - No code required for test flows
- **Smart waiting** - Automatically waits for animations and network requests
- **Fast execution** - Parallel execution and intelligent retries
- **Cross-platform** - Works with both iOS and Android
- **Great React Native support** - Understands RN component hierarchy

### Installation

#### macOS

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

#### Linux

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
export PATH="$PATH:$HOME/.maestro/bin"
```

#### Windows

```powershell
# Using PowerShell
$progressPreference = 'silentlyContinue'
Invoke-WebRequest -Uri "https://get.maestro.mobile.dev" -OutFile "install.ps1"
.\install.ps1
```

Verify installation:

```bash
maestro --version
```

### Running E2E Tests Locally

#### Prerequisites

1. **Build the app** (development build required)

```bash
cd apps/mobile
npx expo prebuild

# Android
npx expo run:android

# iOS (macOS only)
npx expo run:ios
```

2. **Start Metro bundler**

```bash
npm start
```

#### Run All E2E Tests

```bash
cd apps/mobile
npm run e2e
```

#### Run Specific Test Flows

```bash
# Onboarding flow
npm run e2e:onboarding

# Login flow
npm run e2e:login

# Daily check-in flow
npm run e2e:checkin

# Journal flow
npm run e2e:journal

# Step work flow
npm run e2e:steps

# Offline/online sync flow
npm run e2e:sync
```

#### Validate Test Flows (Syntax Check)

```bash
npm run e2e:validate
```

### Critical Path E2E Tests

#### 1. Onboarding Flow (`onboarding.yaml`)

Tests the complete new user journey:

```
Sign Up → Email verification → Onboarding screens → Main app
```

**Key assertions:**

- Sign up form validation
- Onboarding slides display correctly
- Progress indicators work
- Navigation to main app completes

#### 2. Login Flow (`login.yaml`)

Tests existing user authentication:

```
Launch app → Enter credentials → Navigate to main app
```

**Key assertions:**

- Login form accepts valid credentials
- Error messages for invalid credentials
- Navigation to home screen
- Session persistence

#### 3. Daily Check-in Flow (`daily-checkin.yaml`)

Tests the daily recovery check-in feature:

```
Home → Morning Intention → Save → Evening Pulse → Save
```

**Key assertions:**

- Check-in forms load
- Intention and gratitude inputs work
- Evening reflection saves
- Progress indicator updates (1/2 → 2/2)

#### 4. Journal Flow (`journal.yaml`)

Tests encrypted journaling functionality:

```
Journal tab → New Entry → Write content → Save → Edit → Verify
```

**Key assertions:**

- Entry creation with title and body
- Encryption/decryption works
- Entry appears in list
- Search functionality
- Edit and save updates

#### 5. Step Work Flow (`step-work.yaml`)

Tests 12-step program progress:

```
Steps tab → Select Step → Answer questions → Save progress
```

**Key assertions:**

- Step overview loads
- Individual step navigation
- Question responses save
- Progress indicators update

#### 6. Offline/Online Sync (`offline-sync.yaml`)

Tests offline-first architecture:

```
Create entry (offline) → Go online → Verify sync
```

**Key assertions:**

- Entries created offline persist locally
- Sync queue shows pending items
- Manual sync triggers upload
- Sync status indicators update

### Writing E2E Tests

#### Basic Flow Structure

```yaml
appId: com.recovery.stepstorecovery
tags:
  - feature-name
  - critical

---
# Launch app
- launchApp:
    clearState: true # Clear app data before test

# Wait for animations
- waitForAnimationToEnd

# Assert element is visible
- assertVisible: 'Welcome Back'

# Tap on element
- tapOn: 'Sign Up'

# Input text
- tapOn:
    id: 'signup-email-input'
- inputText: 'test@example.com'

# Extended wait with timeout
- extendedWaitUntil:
    visible: 'Clean Time'
    timeout: 30000
```

#### Using testIDs

Always prefer `testID` over text for element selection:

```yaml
# ✅ Good - reliable
- tapOn:
    id: 'login-submit-button'

# ⚠️ Okay - but text may change
- tapOn: 'Log In'

# ❌ Bad - brittle, relies on position
- tapOn:
    point: '50%,50%'
```

#### Adding testIDs to Components

```tsx
// React Native component with testID
<Button
  title="Save Entry"
  onPress={handleSave}
  testID="journal-save-button"
  accessibilityLabel="Save journal entry"
/>

// Input with testID
<TextInput
  value={title}
  onChangeText={setTitle}
  testID="journal-title-input"
  accessibilityLabel="Journal entry title"
/>
```

#### Conditional Flows

Use `runFlow` with `when` for conditional logic:

```yaml
# Check if onboarding is needed
- runFlow:
    when:
      visible: 'Welcome to Recovery'
    commands:
      - tapOn: 'Continue'
      - tapOn: 'I Understand'
      - tapOn: 'Get Started'
```

#### Environment Variables

Use env vars for test data:

```yaml
env:
  TEST_EMAIL: 'test@example.com'
  TEST_PASSWORD: 'TestPass123!'
---
- tapOn:
    id: 'email-input'
- inputText: '${TEST_EMAIL}'
```

Pass env vars when running:

```bash
maestro test -e TEST_EMAIL=user@test.com flow.yaml
```

### E2E Best Practices

1. **Use clear test names**

   ```yaml
   # Good
   name: "Journal Entry Creation Flow"

   # Bad
   name: "Test 1"
   ```

2. **Add tags for filtering**

   ```yaml
   tags:
     - critical # Must pass before release
     - smoke # Quick sanity check
     - regression # Full test suite
   ```

3. **Take screenshots on key steps**

   ```yaml
   - takeScreenshot: onboarding-complete
   ```

4. **Use appropriate wait strategies**

   ```yaml
   # For animations
   - waitForAnimationToEnd

   # For network requests
   - extendedWaitUntil:
       visible: 'Content loaded'
       timeout: 15000
   ```

5. **Clean up after tests**
   ```yaml
   - launchApp:
       clearState: true # Resets app state
   ```

### E2E Test Configuration

#### Maestro Config (`apps/mobile/.maestro/config.yaml`)

```yaml
appId: com.recovery.stepstorecovery
timeout: 15000 # Default timeout in ms

animations:
  enabled: true # Wait for animations

screenshots:
  onFailure: true # Auto-screenshot on failure
```

### CI/CD Integration

E2E tests run automatically on:

- Pull requests (via Maestro Cloud)
- Push to main (via self-hosted emulator)
- Manual workflow dispatch

See `.github/workflows/e2e.yml` for configuration.

#### Running E2E in CI

The CI workflow:

1. Builds debug APK
2. Starts Android emulator
3. Installs Maestro
4. Runs test flows
5. Uploads results and screenshots

### Troubleshooting E2E Tests

#### Element Not Found

```
Assertion failed: Element not found: "Login"
```

**Solution:**

- Add `waitForAnimationToEnd` before assertion
- Use `extendedWaitUntil` with timeout
- Check testID exists in component

#### Test Flakiness

**Solutions:**

- Use `retryTapIfNoChange: true`
- Add explicit waits for async operations
- Disable animations in test builds

```yaml
- tapOn:
    text: 'Submit'
    retryTapIfNoChange: true
```

#### Metro Bundler Issues

**Solution:** Ensure Metro is running before tests:

```bash
npm start &  # Start in background
maestro test flow.yaml
```

#### Screenshots and Logs

Maestro automatically saves:

- Screenshots on failure: `~/.maestro/tests/`
- Device logs: `maestro logs`

View results:

```bash
# List test runs
maestro test results

# View specific run
maestro test results <run-id>
```

### E2E Test Checklist

Before adding new E2E tests:

- [ ] Add testIDs to all interactive elements
- [ ] Test flow works manually first
- [ ] Use appropriate wait strategies
- [ ] Add tags for filtering
- [ ] Include assertions for success state
- [ ] Test on both iOS and Android
- [ ] Validate with `maestro test --dry-run`

---

**Last Updated**: February 2026
**Test Suite Version**: v1.1
**Coverage Target**: 75%+ overall, 90% for encryption (see CLAUDE.md)
**E2E Tests**: 6 critical flows
