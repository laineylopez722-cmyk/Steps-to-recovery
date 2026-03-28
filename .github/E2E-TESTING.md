# E2E Testing Guide

End-to-end tests for Steps to Recovery use [Maestro](https://maestro.mobile.dev/). Tests run against a real Android APK with a real Supabase backend using a dedicated test account.

This guide covers running tests locally and understanding how they run in CI/CD.


> **Canonical path:** Maestro assets are standardized under `apps/mobile/.maestro/`.
> The legacy `apps/mobile/maestro/` directory has been removed; update any local scripts/bookmarks accordingly.

---

## Test Flows

All flow files live in `apps/mobile/.maestro/flows/`.

| Flow | File | What it tests |
|---|---|---|
| Onboarding | `onboarding.yaml` | Sign up, sobriety date, complete onboarding |
| Login | `login.yaml` | Existing user authentication |
| Daily check-in | `daily-checkin.yaml` | Morning intention + evening pulse |
| Journal | `journal.yaml` | Create, edit, search entries |
| Step work | `step-work.yaml` | 12-step progress tracking |
| Offline sync | `offline-sync.yaml` | Offline writes sync correctly on reconnect |
| Crisis detection | `crisis-detection.yaml` | Safety overlay and emergency resources |
| Day 1 core safety | `day1-core-safety.yaml` | Emergency + crisis + offline smoke validation |
| Day 2 workflows | `day2-daily-workflows.yaml` | Core daily recovery workflows |
| Day 3 network/sync | `day3-network-sync.yaml` | Offline/online transition resilience |
| Day 4 stability | `day4-stability.yaml` | Stability and performance regression checks |

---

## Local Setup

### 1. Install Maestro

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
# Restart your terminal, then verify:
maestro --version
```

Maestro requires Java 11+. Install via `brew install --cask temurin` (macOS) or your system package manager.

### 2. Set Up the Test Environment File

Maestro flows read credentials from a local environment file.

```bash
# Copy the example file
cp apps/mobile/.maestro/.env.example apps/mobile/.maestro/.env

# Edit the file with real values
# apps/mobile/.maestro/.env
```

Required values in `apps/mobile/.maestro/.env`:

```
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=YourTestPassword123!
```

Optional values (use defaults from `.env.example` if not set):

```
TEST_INTENTION=Stay present and focused on recovery
TEST_GRATITUDE=Grateful for another day clean
TEST_REFLECTION=Today was a good day
```

**Do not commit `apps/mobile/.maestro/.env`** — it is already in `.gitignore`.

### 3. Create the Test Supabase Account

The test user must exist in your Supabase project before running any flows that include login.

1. Go to your [Supabase dashboard](https://supabase.com/dashboard) → Authentication → Users
2. Click "Invite user" (or "Add user")
3. Use the same email and password you put in `.maestro/.env`
4. This account should contain no real recovery data

### 4. Build the Debug APK

Maestro runs against an installed APK, not the Expo dev server.

```bash
cd apps/mobile

# Generate native project files
npx expo prebuild --platform android

# Build the debug APK
cd android
./gradlew assembleDebug

# APK location:
# apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### 5. Install the APK on an Emulator or Device

```bash
# Start an Android emulator (if not already running)
# Use Android Studio → Device Manager, or:
emulator -avd <your-avd-name> -no-snapshot-load

# Install the APK
adb install -r apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### 6. Run Tests

```bash
cd apps/mobile

# Run all flows
maestro test .maestro/flows/onboarding.yaml
maestro test .maestro/flows/login.yaml
maestro test .maestro/flows/daily-checkin.yaml
maestro test .maestro/flows/journal.yaml
maestro test .maestro/flows/crisis-detection.yaml

# Run a single flow
maestro test .maestro/flows/login.yaml

# Validate flow syntax without executing (dry run)
maestro test --dry-run .maestro/flows/login.yaml

# Validate all flows
for flow in .maestro/flows/*.yaml; do
  echo "Validating $flow..."
  maestro test --dry-run "$flow"
done
```

### 7. View Test Results

Results are saved to `~/.maestro/tests/`. Open the HTML report:

```bash
open ~/.maestro/tests/$(ls -t ~/.maestro/tests/ | head -1)/report.html
```

---

## CI/CD Setup

### How It Works

The `e2e.yml` workflow has three jobs:

| Job | Trigger | What it does |
|---|---|---|
| `build-android` | All pushes and PRs to `main` | Builds the debug APK, uploads as artifact |
| `e2e-cloud` | PRs to `main` and manual dispatch | Runs tests on Maestro Cloud using the artifact |
| `e2e-local` | Pushes to `main` and manual dispatch | Runs tests on a GitHub-hosted Android emulator |
| `validate-flows` | All triggers | Validates YAML syntax of all flow files |

### Required GitHub Secrets

Before E2E tests can run in CI, the following secrets must be configured in GitHub (Settings → Secrets and variables → Actions):

| Secret | Required for | Description |
|---|---|---|
| `MAESTRO_CLOUD_API_KEY` | `e2e-cloud` job | API key for Maestro Cloud |
| `MAESTRO_CLOUD_PROJECT_ID` | `e2e-cloud` job | Project ID on Maestro Cloud |
| `E2E_TEST_USER_EMAIL` | `e2e-local` job | Email of the dedicated test Supabase account |
| `E2E_TEST_USER_PASSWORD` | `e2e-local` job | Password for the test account |

See [.github/SECRETS.md](SECRETS.md) for detailed instructions on how to obtain each of these.

### Supabase Connection in CI

The E2E test APK is built without injecting `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` as GitHub secrets — the values are embedded into the debug build via the local Expo configuration. If the build step needs these values at APK build time, add them to the `Build Android Debug APK` step environment in `e2e.yml` following the same pattern used in `eas-build.yml`.

### Running a Specific Flow Manually

1. Go to the repository → Actions → E2E Tests (Maestro)
2. Click "Run workflow"
3. Select the flow from the dropdown (leave empty to run all flows)
4. Click "Run workflow"

---

## Writing New Flows

### Flow Structure

All flows follow the Maestro YAML format. Refer to the [Maestro documentation](https://maestro.mobile.dev/reference) for the full API.

```yaml
appId: com.recovery.stepstorecovery
---
- launchApp
- tapOn:
    id: "login-button"
- inputText:
    id: "email-input"
    text: ${TEST_USER_EMAIL}
- inputText:
    id: "password-input"
    text: ${TEST_USER_PASSWORD}
- tapOn:
    id: "submit-button"
- assertVisible:
    id: "home-screen"
```

### Adding testID Props

Maestro targets elements by their `testID` prop. When adding a new interactive element that needs E2E coverage, add a `testID`:

```tsx
<TouchableOpacity
  testID="login-button"
  accessibilityLabel="Log in"
  accessibilityRole="button"
  onPress={handleLogin}
>
  <Text>Log In</Text>
</TouchableOpacity>
```

The `validate-flows` CI job checks that at least 10 `testID` attributes exist in the codebase. When adding a new screen, ensure testIDs are in place before writing the flow.

### Environment Variables in Flows

Use `${VARIABLE_NAME}` syntax in flows. Maestro reads values from:

- `apps/mobile/.maestro/.env` (local runs)
- GitHub secrets passed as environment variables (CI runs via the `env:` block in `e2e.yml`)

---

## Troubleshooting

### "App not found" or "Cannot connect to device"

```bash
# Verify the emulator is running
adb devices

# Reinstall the APK
adb install -r apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk

# Restart Maestro
maestro kill-server
```

### "Element not found" in a flow

- Confirm the `testID` attribute is present in the component
- Use `maestro studio` to interactively inspect the running app
- Add a `waitForAnimationToEnd` step before asserting on animated elements

### Flow passes locally but fails in CI

- Confirm the `E2E_TEST_USER_EMAIL` and `E2E_TEST_USER_PASSWORD` secrets are set correctly in GitHub
- Check whether the test account exists in the production Supabase project (CI runs against the production Supabase URL)
- Review the uploaded Maestro test results artifact in the Actions run for screenshots of the failure point

### Maestro Cloud results not appearing

- Verify `MAESTRO_CLOUD_API_KEY` and `MAESTRO_CLOUD_PROJECT_ID` are set in GitHub secrets
- Check Maestro Cloud dashboard for the project — runs appear within a few minutes of the workflow completing

---

## Related Documentation

- [SECRETS.md](SECRETS.md) — All GitHub Actions secrets with setup instructions
- [TESTING.md](../TESTING.md) — Unit and integration test guide
- [DEPLOYMENT.md](../DEPLOYMENT.md) — Build and release process
- [apps/mobile/.maestro/README.md](../apps/mobile/.maestro/README.md) — Maestro configuration reference
