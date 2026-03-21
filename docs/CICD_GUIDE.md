# CI/CD Workflow Guide

## Overview

The project uses GitHub Actions with 4 workflows. All are defined in `.github/workflows/`.

## Workflows

### 1. `eas-build.yml` — EAS Build

**Trigger**: `workflow_dispatch` (manual), or called by `release.yml`

**Purpose**: Build Android/iOS binaries via Expo Application Services.

**Steps**:
1. Checkout + install dependencies
2. Run lint, type-check, and tests
3. Build via `eas build` with specified profile and platform

**Required Secrets**: `EXPO_TOKEN`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`

---

### 2. `release.yml` — Release Pipeline

**Trigger**: `workflow_dispatch` with version/platform inputs

**Purpose**: Full release pipeline from quality gates to store submission.

**Steps**:
1. **Critical Issues Gate** — Checks `_tracker.yaml` for open P0 issues (skippable via `SKIP_CRITICAL_ISSUES_GATE`)
2. **Quality Gates** — Lint, type-check, tests
3. **Android Build & Submit** — Via EAS, submits to Google Play
4. **iOS Build & Submit** — Via EAS, submits to App Store Connect
5. **GitHub Release** — Creates release with changelog

**Required Secrets**: All secrets from `eas-build.yml` plus `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`, `EXPO_APPLE_ID`, `EXPO_APPLE_TEAM_ID`, `ASC_APP_ID`

---

### 3. `e2e.yml` — End-to-End Tests

**Trigger**: Push to `main`, pull requests to `main`

**Purpose**: Run Maestro E2E test flows against Android builds.

**Modes**:
- **Cloud mode**: Uses Maestro Cloud (preferred for CI)
- **Local mode**: Emulator-based fallback

**Required Secrets**: `MAESTRO_CLOUD_API_KEY`, `MAESTRO_CLOUD_PROJECT_ID`, `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`

---

### 4. `codacy.yml` — Code Analysis

**Trigger**: Push to `main`, pull requests

**Purpose**: Static analysis via Codacy.

**Required Secrets**: `CODACY_PROJECT_TOKEN`

---

## Adding a New Workflow

1. Create `.github/workflows/<name>.yml`
2. Document required secrets in `docs/GITHUB_SECRETS.md`
3. Update this guide
4. Test with `workflow_dispatch` before adding triggers
