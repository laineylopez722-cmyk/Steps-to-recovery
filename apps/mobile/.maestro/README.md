# E2E Tests for Steps to Recovery

This directory contains end-to-end tests using [Maestro](https://maestro.mobile.dev).

## Quick Start

```bash
# Install Maestro
curl -fsSL "https://get.maestro.mobile.dev" | bash

# Run all tests
maestro test flows/

# Run specific flow
maestro test flows/onboarding.yaml

# Validate flow syntax
maestro test --dry-run flows/onboarding.yaml
```

## Directory Structure

```
.maestro/
├── config.yaml           # Global Maestro configuration
├── README.md             # This file
└── flows/                # Test flows
    ├── _run-all.yaml     # Master test suite
    ├── onboarding.yaml   # New user onboarding
    ├── login.yaml        # Existing user login
    ├── daily-checkin.yaml # Morning/evening check-ins
    ├── journal.yaml      # Journal CRUD operations
    ├── step-work.yaml    # 12-step program
    └── offline-sync.yaml # Offline/online sync
```

## Test Flows

### 1. Onboarding (`onboarding.yaml`)

Tests the new user signup and onboarding flow.

**Prerequisites:** None (uses fresh app state)

**Key Steps:**

1. Launch app with cleared state
2. Navigate to Sign Up
3. Fill registration form
4. Complete onboarding slides
5. Verify main app loaded

### 2. Login (`login.yaml`)

Tests existing user authentication.

**Prerequisites:** Test user account exists

**Environment Variables:**

- `TEST_USER_EMAIL` - Existing user email
- `TEST_USER_PASSWORD` - Existing user password

### 3. Daily Check-in (`daily-checkin.yaml`)

Tests the recovery check-in feature.

**Prerequisites:** User is logged in

**Key Steps:**

1. Submit morning intention
2. Save gratitude
3. Complete evening reflection
4. Verify progress updated

### 4. Journal (`journal.yaml`)

Tests encrypted journal functionality.

**Prerequisites:** User is logged in

**Key Steps:**

1. Navigate to Journal tab
2. Create new entry
3. Verify encryption
4. Edit entry
5. Search entries

### 5. Step Work (`step-work.yaml`)

Tests 12-step program progress tracking.

**Prerequisites:** User is logged in

**Key Steps:**

1. Navigate to Steps tab
2. Select a step
3. Answer reflection questions
4. Save progress

### 6. Offline Sync (`offline-sync.yaml`)

Tests offline-first sync architecture.

**Prerequisites:** User is logged in

**Key Steps:**

1. Create entry while offline
2. Verify local persistence
3. Trigger sync
4. Verify sync completion

## Environment Variables

Create a `.env` file in `.maestro/` for local testing:

```bash
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPass123!
```

Or pass inline:

```bash
maestro test -e TEST_EMAIL=user@test.com flows/login.yaml
```

## testID Reference

### Auth Screens

| Element               | testID                          |
| --------------------- | ------------------------------- |
| Login email input     | `login-email-input`             |
| Login password input  | `login-password-input`          |
| Login submit button   | `login-submit-button`           |
| Signup email input    | `signup-email-input`            |
| Signup password input | `signup-password-input`         |
| Signup confirm input  | `signup-confirm-password-input` |
| Signup submit button  | `signup-submit-button`          |

### Home Screen

| Element               | testID                     |
| --------------------- | -------------------------- |
| Home screen container | `home-screen`              |
| Sync status indicator | `sync-status-indicator`    |
| Sync pending          | `sync-pending-indicator`   |
| Sync completed        | `sync-completed-indicator` |
| Sync offline          | `sync-offline-indicator`   |
| Sync error            | `sync-error-indicator`     |

### Journal

| Element       | testID                  |
| ------------- | ----------------------- |
| Title input   | `journal-title-input`   |
| Content input | `journal-content-input` |
| Save button   | `journal-save-button`   |
| Search input  | `journal-search-input`  |
| Clear search  | `clear-search-button`   |

## Adding New Tests

1. **Create flow file:** `flows/my-feature.yaml`
2. **Add testIDs** to components being tested
3. **Write test** using Maestro YAML syntax
4. **Validate:** `maestro test --dry-run flows/my-feature.yaml`
5. **Run locally:** `maestro test flows/my-feature.yaml`
6. **Update this README** with new test documentation

## Best Practices

### Prefer testIDs over text

```yaml
# ✅ Good
- tapOn:
    id: 'submit-button'

# ⚠️ Okay but fragile
- tapOn: 'Submit'
```

### Use appropriate waits

```yaml
# For animations
- waitForAnimationToEnd

# For network requests
- extendedWaitUntil:
    visible: 'Content loaded'
    timeout: 15000
```

### Handle conditional flows

```yaml
- runFlow:
    when:
      visible: 'Optional Modal'
    commands:
      - tapOn: 'Dismiss'
```

### Clear state between tests

```yaml
- launchApp:
    clearState: true
```

## CI/CD Integration

E2E tests run automatically via GitHub Actions:

- **PR checks:** Run critical flows on Maestro Cloud
- **Main branch:** Run full suite on emulator
- **Manual trigger:** Run specific flow via workflow dispatch

See `.github/workflows/e2e.yml` for details.

## Troubleshooting

### Test fails locally but not in CI

- Check Metro bundler is running
- Verify testIDs match exactly
- Try with `clearState: true`

### Element not found

- Add wait: `waitForAnimationToEnd`
- Check testID in component
- Use `extendedWaitUntil` with timeout

### Flaky tests

- Add `retryTapIfNoChange: true`
- Disable animations in dev build
- Add explicit waits

## Resources

- [Maestro Documentation](https://maestro.mobile.dev)
- [Maestro YAML Reference](https://maestro.mobile.dev/api-reference/commands)
- [React Native Testing Guide](https://reactnative.dev/docs/testing-overview)
