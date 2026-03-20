# GitHub Actions Secrets Reference

This document describes every secret used across the CI/CD workflows for Steps to Recovery. All secrets are stored at the **repository level** in GitHub (Settings → Secrets and variables → Actions).

For EAS-specific secrets stored in the Expo dashboard, see [DEPLOYMENT.md](../DEPLOYMENT.md#eas-secrets-for-production-builds).

---

## Quick Reference Table

| Secret Name | Required | Used In | Purpose |
|---|---|---|---|
| `EXPO_TOKEN` | Yes | `eas-build.yml`, `release.yml` | Authenticates EAS CLI with Expo account |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | `eas-build.yml`, `release.yml` | Supabase project URL injected at build time |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | `eas-build.yml`, `release.yml` | Supabase public anon key injected at build time |
| `EXPO_PUBLIC_SENTRY_DSN` | No | `eas-build.yml` | Sentry error tracking DSN |
| `SENTRY_AUTH_TOKEN` | No | `eas-build.yml` | Uploads source maps to Sentry |
| `MAESTRO_CLOUD_API_KEY` | Yes (E2E CI) | `e2e.yml` | Authenticates with Maestro Cloud for remote test runs |
| `MAESTRO_CLOUD_PROJECT_ID` | Yes (E2E CI) | `e2e.yml` | Identifies project on Maestro Cloud |
| `E2E_TEST_USER_EMAIL` | Yes (E2E CI) | `e2e.yml` | Test account email used in E2E login flows |
| `E2E_TEST_USER_PASSWORD` | Yes (E2E CI) | `e2e.yml` | Test account password used in E2E login flows |
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | Yes (Android release) | `release.yml` | Service account for Play Store submission |
| `EXPO_APPLE_ID` | Yes (iOS release) | `release.yml` | Apple ID email for App Store Connect |
| `EXPO_APPLE_TEAM_ID` | Yes (iOS release) | `release.yml` | Apple Developer Team ID |
| `ASC_APP_ID` | Yes (iOS release) | `release.yml` | App Store Connect numeric app ID |
| `CODACY_PROJECT_TOKEN` | No | `codacy.yml` | Enables authenticated Codacy analysis |

---

## Secret Details

### EXPO_TOKEN

**Purpose**: Authenticates the EAS CLI so it can trigger builds and access your Expo project without interactive login.

**Required by**: `eas-build.yml` (build job), `release.yml` (build-android, build-ios jobs)

**How to obtain**:
1. Go to [expo.dev](https://expo.dev) and sign in
2. Click your avatar (top right) → Account settings
3. Navigate to "Access tokens"
4. Click "Create token"
5. Name it (e.g., `github-actions`) and copy the value

**Validation**: Run `EXPO_TOKEN=<value> eas whoami` locally. It should print your username without prompting for a password.

---

### EXPO_PUBLIC_SUPABASE_URL

**Purpose**: The base URL for your Supabase project. Injected into the EAS build environment so the app can reach the API.

**Required by**: `eas-build.yml` (build job), `release.yml` (build-android, build-ios jobs)

**How to obtain**:
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and open the project
2. Navigate to Settings → API
3. Copy the value under "Project URL"

**Format**: `https://<project-ref>.supabase.co`

**Validation**: The value must start with `https://` and end with `.supabase.co`. The `validate-env.js` script checks this format locally.

---

### EXPO_PUBLIC_SUPABASE_ANON_KEY

**Purpose**: The public (anon) key for Supabase. Safe to include in the app bundle because all data access is protected by Row-Level Security (RLS) policies. Injected at build time.

**Required by**: `eas-build.yml` (build job), `release.yml` (build-android, build-ios jobs)

**How to obtain**:
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and open the project
2. Navigate to Settings → API
3. Copy the value under "Project API keys" → `anon` / `public`

**Security note**: This key is intentionally public. It cannot bypass RLS. Never use the `service_role` key in the app or in these secrets.

**Validation**: The value is a long JWT string (three base64 segments separated by dots).

---

### EXPO_PUBLIC_SENTRY_DSN

**Purpose**: Tells the Sentry SDK where to send error reports. Optional — the app builds and runs without it, but production errors will not be reported.

**Required by**: `eas-build.yml` (build job, optional)

**How to obtain**:
1. Go to [sentry.io](https://sentry.io) and sign in
2. Navigate to Settings → Projects → Steps to Recovery (or create a new React Native project)
3. Navigate to Settings → Client Keys (DSN)
4. Copy the DSN value

**Format**: `https://<key>@<org>.ingest.sentry.io/<project-id>`

**Validation**: Leave blank to disable Sentry. If provided, it must be a valid `https://` URL to a Sentry ingest endpoint.

---

### SENTRY_AUTH_TOKEN

**Purpose**: Allows the Sentry Expo plugin to upload JavaScript source maps during EAS builds. Without this, production stack traces will be minified and difficult to debug.

**Required by**: `eas-build.yml` (build job, optional)

**How to obtain**:
1. Go to [sentry.io](https://sentry.io) → Settings → Auth Tokens
2. Click "Create New Token"
3. Grant scopes: `project:write`, `org:read`
4. Copy the token

**Validation**: Sentry CLI will fail silently during the build if this token is invalid. Check EAS build logs for Sentry upload errors.

---

### MAESTRO_CLOUD_API_KEY

**Purpose**: Authenticates uploads to Maestro Cloud so E2E test results can be viewed remotely in pull requests.

**Required by**: `e2e.yml` (e2e-cloud job)

**How to obtain**:
1. Sign up at [cloud.mobile.dev](https://cloud.mobile.dev)
2. Go to Settings → API Keys
3. Generate a new key and copy it

**Validation**: Run `maestro cloud --apiKey <value> --help` locally to verify the key is accepted.

---

### MAESTRO_CLOUD_PROJECT_ID

**Purpose**: Identifies which Maestro Cloud project receives the test results. Paired with `MAESTRO_CLOUD_API_KEY`.

**Required by**: `e2e.yml` (e2e-cloud job)

**How to obtain**:
1. Sign in to [cloud.mobile.dev](https://cloud.mobile.dev)
2. Open your project
3. The project ID appears in the URL: `cloud.mobile.dev/projects/<project-id>`

**Format**: A UUID or short identifier string.

---

### E2E_TEST_USER_EMAIL

**Purpose**: Email address of a dedicated test Supabase account. Used by Maestro flows to perform the login flow without touching real user data.

**Required by**: `e2e.yml` (e2e-local job, `TEST_USER_EMAIL` env var)

**How to set up**:
1. Create a dedicated test user in your Supabase project (Authentication → Users → Invite user)
2. Use a non-production email (e.g., `e2e-test@yourdomain.com`)
3. Set the secret to this email address

**Security note**: This account should have no real recovery data. It exists solely for automated testing. Do not reuse a real user account.

---

### E2E_TEST_USER_PASSWORD

**Purpose**: Password for the dedicated E2E test account. Paired with `E2E_TEST_USER_EMAIL`.

**Required by**: `e2e.yml` (e2e-local job, `TEST_USER_PASSWORD` env var)

**How to set up**:
1. Set a strong password (minimum 12 characters, mixed case, numbers, symbols) when creating the test account
2. Store the same password as this secret

**Security note**: Rotate this password if the test account is ever compromised. Update both the Supabase account and this secret simultaneously.

---

### GOOGLE_SERVICE_ACCOUNT_KEY_PATH

**Purpose**: Path to a Google Cloud service account JSON file that authorizes EAS to submit Android builds to the Play Store on your behalf.

**Required by**: `release.yml` (build-android job, Play Store submission step)

**How to obtain**:
1. Follow the guide at https://github.com/expo/fyi/blob/main/creating-google-service-account.md
2. In Google Cloud Console, create a service account with "Release manager" role in Play Console
3. Download the JSON key file
4. In GitHub Actions, upload the JSON content as a secret (not the file path — set the secret value to the full JSON content)
5. In the workflow, the value is written to a temp file before being passed to EAS

**Format**: Full JSON object starting with `{"type": "service_account", ...}`

**Validation**: EAS will report "Google credentials not found" during submission if this is missing or malformed.

---

### EXPO_APPLE_ID

**Purpose**: Your Apple ID email address. Used by EAS submit to authenticate with App Store Connect for iOS submission.

**Required by**: `release.yml` (build-ios job, TestFlight submission step)

**How to obtain**: This is the email address associated with your Apple Developer account.

**Format**: A valid email address (e.g., `developer@yourcompany.com`)

---

### EXPO_APPLE_TEAM_ID

**Purpose**: Your Apple Developer Team ID. Required when submitting iOS builds if you belong to multiple teams.

**Required by**: `release.yml` (build-ios job, TestFlight submission step)

**How to obtain**:
1. Go to [developer.apple.com](https://developer.apple.com)
2. Sign in and navigate to Account → Membership
3. Copy the "Team ID" value (10-character alphanumeric string)

**Format**: 10-character string (e.g., `ABCDE12345`)

---

### ASC_APP_ID

**Purpose**: The numeric App Store Connect app identifier. Tells EAS which app record to submit the build to.

**Required by**: `release.yml` (build-ios job, TestFlight submission step)

**How to obtain**:
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Open the app record for Steps to Recovery
3. Navigate to App Information
4. Copy the "Apple ID" (a numeric value, e.g., `1234567890`)

**Format**: Numeric string only (no dashes or letters)

---

### CODACY_PROJECT_TOKEN

**Purpose**: Authenticates the Codacy Analysis CLI so results are associated with your Codacy project dashboard. Without it, the scan still runs but results are not uploaded to your account.

**Required by**: `codacy.yml` (codacy-security-scan job)

**How to obtain**:
1. Go to [app.codacy.com](https://app.codacy.com) and sign in
2. Navigate to your repository → Settings → Integrations → Project API
3. Copy the "Project token"

**Validation**: The Codacy scan will still produce a SARIF file for GitHub Security without this token. It is only needed to populate the Codacy dashboard.

---

## Adding a Secret to GitHub

1. Go to the repository on GitHub
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Enter the name exactly as listed above (case-sensitive)
5. Paste the value and click "Add secret"

Secrets cannot be viewed after creation. To update a secret, click the pencil icon and enter the new value.

---

## Secret Rotation Schedule

| Secret | Rotation Frequency | Reason |
|---|---|---|
| `EXPO_TOKEN` | Annually or on team member departure | Long-lived access token |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | On security incident only | Public key, rotated in Supabase dashboard |
| `SENTRY_AUTH_TOKEN` | Annually | Standard token hygiene |
| `MAESTRO_CLOUD_API_KEY` | Annually | Standard token hygiene |
| `E2E_TEST_USER_PASSWORD` | Quarterly | Test account password hygiene |
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | Annually or on team member departure | Store submission credentials |
| Apple credentials | On team member departure | Apple account access |

---

## Related Documentation

- [DEPLOYMENT.md](../DEPLOYMENT.md) — Build and release process, EAS secrets setup
- [.github/E2E-TESTING.md](E2E-TESTING.md) — E2E test setup and local Maestro configuration
- [SETUP.md](../SETUP.md) — Local development environment setup
- [scripts/setup-eas-secrets.sh](../scripts/setup-eas-secrets.sh) — Script to configure EAS project-level secrets
