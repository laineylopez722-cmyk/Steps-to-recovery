# GitHub Actions Secrets Guide

All secrets referenced by CI/CD workflows. Configure in **Settings → Secrets and variables → Actions**.

## Required Secrets

| Secret | Used In | Description | How to Obtain |
|---|---|---|---|
| `EXPO_TOKEN` | `eas-build.yml`, `release.yml` | Expo access token for EAS CLI | [expo.dev/accounts/…/settings/access-tokens](https://expo.dev/accounts) → Create token |
| `EXPO_PUBLIC_SUPABASE_URL` | `eas-build.yml`, `release.yml` | Supabase project URL | Supabase dashboard → Settings → API → Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eas-build.yml`, `release.yml` | Supabase public anon key | Supabase dashboard → Settings → API → `anon` key |
| `EXPO_PUBLIC_SENTRY_DSN` | `eas-build.yml` | Sentry Data Source Name | Sentry → Project Settings → Client Keys (DSN) |
| `SENTRY_AUTH_TOKEN` | `eas-build.yml` | Sentry auth token for source maps | Sentry → Settings → Auth Tokens |
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | `release.yml` | Google Play service account JSON path | Google Cloud Console → Service Accounts → Create key |
| `EXPO_APPLE_ID` | `release.yml` | Apple ID for App Store Connect | Your Apple developer email address |
| `EXPO_APPLE_TEAM_ID` | `release.yml` | Apple Developer Team ID | Apple Developer portal → Membership → Team ID |
| `ASC_APP_ID` | `release.yml` | App Store Connect App ID | App Store Connect → App → General → Apple ID |

## Optional / Testing Secrets

| Secret | Used In | Description |
|---|---|---|
| `MAESTRO_CLOUD_API_KEY` | `e2e.yml` | Maestro Cloud API key for E2E tests |
| `MAESTRO_CLOUD_PROJECT_ID` | `e2e.yml` | Maestro Cloud project ID |
| `E2E_TEST_USER_EMAIL` | `e2e.yml` | Test user email for E2E flows |
| `E2E_TEST_USER_PASSWORD` | `e2e.yml` | Test user password for E2E flows |
| `CODACY_PROJECT_TOKEN` | `codacy.yml` | Codacy project token for code analysis |

## Feature Flags

| Secret | Used In | Description |
|---|---|---|
| `SKIP_CRITICAL_ISSUES_GATE` | `release.yml` | Set to `true` to bypass critical issues gate (emergency only) |

## Setup Checklist

1. Create a Supabase project and copy URL + anon key
2. Create an Expo account and generate an access token
3. (Optional) Set up Sentry for error monitoring
4. (iOS) Configure Apple Developer credentials
5. (Android) Create a Google Play service account
6. (E2E) Set up Maestro Cloud and test user credentials
