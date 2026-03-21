# CI/CD Workflow Documentation

This document describes every GitHub Actions workflow in `.github/workflows/`, when each runs, what it does, and how to troubleshoot failures.

For secrets used by these workflows, see [SECRETS.md](SECRETS.md).
For E2E test setup, see [E2E-TESTING.md](E2E-TESTING.md).

---

## Workflow Overview

| Workflow        | File                  | Trigger                                  | Typical Duration | Purpose                             |
| --------------- | --------------------- | ---------------------------------------- | ---------------- | ----------------------------------- |
| EAS Build       | `eas-build.yml`       | Push/PR to `main` (mobile paths), manual | 15–40 min        | Lint, test, EAS cloud build         |
| E2E Tests       | `e2e.yml`             | Push/PR to `main` (mobile paths), manual | 20–45 min        | Maestro flows against a real APK    |
| Release         | `release.yml`         | `v*` tags, manual                        | 30–60 min        | Production build + store submission |
| ESLint          | `eslint.yml`          | Push/PR to `main`, weekly Friday         | 5–10 min         | Security scan via SARIF             |
| Bundle Analysis | `bundle-analysis.yml` | PRs to `main` (mobile/shared paths)      | 10–15 min        | Bundle size reporting               |
| Codacy          | `codacy.yml`          | Push/PR to `main`, weekly Thursday       | 5–10 min         | Code quality analysis               |
| CI              | `webpack.yml`         | Push/PR to `main`                        | 5–10 min         | Env validation + strict gate        |

---

## EAS Build (`eas-build.yml`)

### When it runs

- **Push to `main`**: When any file under `apps/mobile/**` or `apps/mobile/src/shared/**` changes.
- **Pull request to `main`**: On the same path filter. The `build` job is skipped on PRs — only `lint-and-typecheck` and `test` run.
- **Manual dispatch**: Via Actions → EAS Build → Run workflow. You can select the platform (`ios`, `android`, or `all`) and the build profile (`development`, `preview`, or `production`).

### Jobs

| Job                    | Runs on                      | What it does                                                                               |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| `lint-and-typecheck`   | All triggers                 | Runs `doctor:toolchain`, `doctor:aliases`, `audit:test-act`, ESLint, TypeScript type-check |
| `test`                 | All triggers                 | Runs the full Jest test suite                                                              |
| `build`                | Push to `main` + manual only | Authenticates with Expo, runs `eas build --no-wait` with the selected profile              |
| `notify-build-started` | After `build`                | Posts a build summary to the Actions run page                                              |

### Build behavior

- Automatic pushes to `main` always use the `preview` profile and build for both platforms.
- Manual dispatches allow you to choose platform and profile.
- `--no-wait` means the CI job completes as soon as the build is queued on EAS servers. Check the [Expo Dashboard](https://expo.dev/accounts/ripkdr/projects/steps-to-recovery/builds) for build status.

### Secrets required

| Secret                          | Used for                               |
| ------------------------------- | -------------------------------------- |
| `EXPO_TOKEN`                    | EAS CLI authentication                 |
| `EXPO_PUBLIC_SUPABASE_URL`      | Injected into the build environment    |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Injected into the build environment    |
| `EXPO_PUBLIC_SENTRY_DSN`        | Optional — Sentry error tracking       |
| `SENTRY_AUTH_TOKEN`             | Optional — source map upload to Sentry |

### Version pinning

`EAS_CLI_VERSION` in this workflow must stay in sync with:

- `apps/mobile/eas.json` → `cli.version`
- `.github/workflows/release.yml` → `EAS_CLI_VERSION`

If you upgrade the EAS CLI, update all three locations.

---

## E2E Tests (`e2e.yml`)

### When it runs

- **Push to `main`**: When files under `apps/mobile/**`, `apps/mobile/src/shared/**`, `.maestro/**`, or `.github/workflows/e2e.yml` change.
- **Pull request to `main`**: On the same path filter (mobile and shared only).
- **Manual dispatch**: Via Actions → E2E Tests (Maestro) → Run workflow. You can choose a specific flow or leave the field empty to run all flows.

### Jobs

| Job              | Trigger                 | What it does                                                           |
| ---------------- | ----------------------- | ---------------------------------------------------------------------- |
| `build-android`  | All triggers            | Prebuild native project, compile debug APK, upload as artifact         |
| `validate-flows` | All triggers            | Installs Maestro, dry-runs all `.yaml` flow files, checks testID count |
| `e2e-cloud`      | PRs + manual            | Downloads APK, runs tests on Maestro Cloud                             |
| `e2e-local`      | Push to `main` + manual | Starts a GitHub-hosted Android emulator, runs tests locally            |

### Maestro Cloud vs local emulator

|                   | Maestro Cloud (`e2e-cloud`)                                                                          | Local emulator (`e2e-local`)                    |
| ----------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Trigger           | PRs to `main`, manual                                                                                | Push to `main`, manual                          |
| Result visibility | Maestro Cloud dashboard + PR comments                                                                | GitHub Actions artifacts                        |
| Secrets needed    | `MAESTRO_CLOUD_API_KEY`, `MAESTRO_CLOUD_PROJECT_ID`, `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD` | `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD` |
| Speed             | Faster (cloud devices)                                                                               | Slower (emulator startup)                       |

### Secret validation

Both `e2e-cloud` and `e2e-local` include an explicit secret validation step that fails early with a human-readable error message if required secrets are missing. This prevents cryptic Maestro errors that are hard to trace back to a missing secret.

### Secrets required

| Secret                     | Required for                     |
| -------------------------- | -------------------------------- |
| `MAESTRO_CLOUD_API_KEY`    | `e2e-cloud` job                  |
| `MAESTRO_CLOUD_PROJECT_ID` | `e2e-cloud` job                  |
| `E2E_TEST_USER_EMAIL`      | Both `e2e-cloud` and `e2e-local` |
| `E2E_TEST_USER_PASSWORD`   | Both `e2e-cloud` and `e2e-local` |

### Flow files

All flows live in `apps/mobile/.maestro/flows/`. The `validate-flows` job runs `maestro test --dry-run` on every `.yaml` file to catch syntax errors without executing tests.

---

## Release (`release.yml`)

### When it runs

- **Git tag push**: Any tag matching `v*` (e.g., `v1.2.0`, `v1.2.0-beta.1`).
- **Manual dispatch**: Via Actions → Release → Run workflow. You can choose the platform and Android release track.

### Creating a release

```bash
# Bump version in apps/mobile/app.json (or let autoIncrement handle it)
git tag v1.2.0
git push --tags
```

The `production` EAS build profile has `autoIncrement: true`, so the build number increments automatically in the EAS system. You only need to manage the `version` string in `app.json` for semantic versioning.

### Jobs

| Job              | Runs on                         | What it does                                                                           |
| ---------------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| `quality-gates`  | All triggers                    | Full quality check: doctor scripts, audit, ESLint, type-check, tests, encryption tests |
| `build-android`  | Tag push + manual (all/android) | Production AAB build via EAS, submit to Play Store internal track                      |
| `build-ios`      | Tag push + manual (all/ios)     | Production IPA build via EAS, submit to TestFlight                                     |
| `create-release` | After both build jobs           | Generates changelog from git log, creates GitHub Release                               |
| `notify`         | Always (after all jobs)         | Posts a pipeline summary to the Actions run page                                       |

### Release tags and prereleases

If the tag name contains `beta` or `rc` (e.g., `v1.2.0-beta.1`), the GitHub Release is automatically marked as a prerelease.

### Secrets required

| Secret                            | Used for                         |
| --------------------------------- | -------------------------------- |
| `EXPO_TOKEN`                      | EAS CLI authentication           |
| `EXPO_PUBLIC_SUPABASE_URL`        | Build environment                |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`   | Build environment                |
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | Play Store submission            |
| `EXPO_APPLE_ID`                   | App Store Connect authentication |
| `EXPO_APPLE_TEAM_ID`              | App Store Connect authentication |
| `ASC_APP_ID`                      | App Store Connect app record     |

---

## ESLint Security Scan (`eslint.yml`)

### When it runs

- **Push to `main`**: Every push.
- **Pull request to `main`**: Every PR.
- **Scheduled**: Fridays at 01:20 UTC (`cron: '20 1 * * 5'`).

The scheduled run ensures that newly disclosed security patterns are caught even when the codebase is unchanged.

### What it does

1. Installs dependencies.
2. Runs `audit:test-act` (async act guardrail for tests).
3. Runs TypeScript type-check.
4. Runs ESLint with the `@microsoft/eslint-formatter-sarif` formatter and writes `eslint-results.sarif`.
5. Uploads the SARIF file to GitHub Code Scanning via `github/codeql-action/upload-sarif`.

Results appear in the **Security → Code scanning alerts** tab of the repository. Any rule categorized as a security issue will create a code scanning alert.

### No secrets required

This workflow uses only the built-in `GITHUB_TOKEN` (via the `upload-sarif` action) and requires the `security-events: write` permission, which is declared in the workflow.

---

## Bundle Analysis (`bundle-analysis.yml`)

### When it runs

- **Pull requests to `main`**: When files under `apps/mobile/**`, `apps/mobile/src/shared/**`, `package.json`, or `package-lock.json` change.

This workflow does not run on pushes — only on PRs so that bundle size changes are surfaced before merging.

### What it does

1. Runs `audit:test-act` and TypeScript type-check.
2. Runs `node scripts/analyze-bundle.js`, which generates `docs/BUNDLE_ANALYSIS.md`.
3. Posts the first 100 lines of that report as a comment on the PR (creates a new comment or updates an existing bot comment).
4. Appends the report to the Actions run summary.

### No secrets required

This workflow uses only the built-in `GITHUB_TOKEN` for PR commenting.

### What to look for

If a PR significantly increases the bundle size, review the analysis comment for which module caused the increase. The cold start target is sub-2 seconds, so bundle size regressions can directly affect the user experience.

---

## Codacy Security Scan (`codacy.yml`)

### When it runs

- **Push to `main`**: Every push.
- **Pull request to `main`**: Every PR.
- **Scheduled**: Thursdays at 20:22 UTC (`cron: '22 20 * * 4'`).

The scheduled run catches new tool rules against the unchanged codebase.

### What it does

1. Runs `audit:test-act` and TypeScript type-check.
2. Runs the Codacy Analysis CLI, which performs static analysis using multiple tools.
3. Generates a SARIF output file (`results.sarif`).
4. Uploads the SARIF to GitHub Code Scanning.

### Optional secret

`CODACY_PROJECT_TOKEN` is optional. Without it, the scan still runs and uploads results to GitHub Security. With it, results also appear in your Codacy dashboard.

### Secrets matrix

| Secret                 | Required | Effect without it                                                 |
| ---------------------- | -------- | ----------------------------------------------------------------- |
| `CODACY_PROJECT_TOKEN` | No       | Scan runs; results go to GitHub Security but not Codacy dashboard |

---

## CI (`webpack.yml`)

### When it runs

- **Push to `main`**: Every push.
- **Pull request to `main`**: Every PR.

### What it does

This is a lightweight validation workflow that runs without EAS credentials:

1. Installs dependencies.
2. Runs `audit:test-act`.
3. Runs TypeScript type-check.
4. Runs `npm run validate-env` to confirm environment variable format.
5. Runs `npm run verify:strict` — the full quality gate (doctor scripts + lint + type-check + tests).

This is the fastest feedback loop and the first workflow to fail if there is a type error or a failing test.

### No secrets required

Placeholder Supabase values are injected via the `env:` block in the workflow so `validate-env` passes without real credentials.

---

## Secret-to-Workflow Matrix

| Secret                            | `eas-build.yml` | `e2e.yml` | `release.yml` | `eslint.yml` | `bundle-analysis.yml` | `codacy.yml` | `webpack.yml` |
| --------------------------------- | :-------------: | :-------: | :-----------: | :----------: | :-------------------: | :----------: | :-----------: |
| `EXPO_TOKEN`                      |       Yes       |     —     |      Yes      |      —       |           —           |      —       |       —       |
| `EXPO_PUBLIC_SUPABASE_URL`        |       Yes       |     —     |      Yes      |      —       |           —           |      —       |       —       |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`   |       Yes       |     —     |      Yes      |      —       |           —           |      —       |       —       |
| `EXPO_PUBLIC_SENTRY_DSN`          |    Optional     |     —     |       —       |      —       |           —           |      —       |       —       |
| `SENTRY_AUTH_TOKEN`               |    Optional     |     —     |       —       |      —       |           —           |      —       |       —       |
| `MAESTRO_CLOUD_API_KEY`           |        —        |    Yes    |       —       |      —       |           —           |      —       |       —       |
| `MAESTRO_CLOUD_PROJECT_ID`        |        —        |    Yes    |       —       |      —       |           —           |      —       |       —       |
| `E2E_TEST_USER_EMAIL`             |        —        |    Yes    |       —       |      —       |           —           |      —       |       —       |
| `E2E_TEST_USER_PASSWORD`          |        —        |    Yes    |       —       |      —       |           —           |      —       |       —       |
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` |        —        |     —     |      Yes      |      —       |           —           |      —       |       —       |
| `EXPO_APPLE_ID`                   |        —        |     —     |      Yes      |      —       |           —           |      —       |       —       |
| `EXPO_APPLE_TEAM_ID`              |        —        |     —     |      Yes      |      —       |           —           |      —       |       —       |
| `ASC_APP_ID`                      |        —        |     —     |      Yes      |      —       |           —           |      —       |       —       |
| `CODACY_PROJECT_TOKEN`            |        —        |     —     |       —       |      —       |           —           |   Optional   |       —       |

For full instructions on obtaining and rotating each secret, see [SECRETS.md](SECRETS.md).

---

## Troubleshooting

### EAS build job is skipped on a PR

Expected behavior. The `build` job in `eas-build.yml` only runs on pushes to `main` and manual dispatches, not on PRs. Only `lint-and-typecheck` and `test` run on PRs.

### "Doctor toolchain found issues" in CI

The CI environment's Node.js version does not match the `.nvmrc` pin. The workflow uses `actions/setup-node` with `node-version-file: '.nvmrc'` to guarantee the correct version. If you see this error, it means either `.nvmrc` was changed without updating the expected version in `check-toolchain.mjs`, or the `setup-node` step failed silently.

### "Alias consistency doctor found issues" in CI

One of the four alias targets (`tsconfig.json`, `babel.config.js`, `jest.config.js`, `components.json`) drifted from the contract at `apps/mobile/config/import-aliases.json`. Update the out-of-sync file locally and push again.

### E2E `e2e-cloud` job: "All required E2E secrets are present" but Maestro Cloud still fails

- Verify `MAESTRO_CLOUD_API_KEY` is valid by running `maestro cloud --apiKey <value> --help` locally.
- Verify `MAESTRO_CLOUD_PROJECT_ID` is the correct project on [cloud.mobile.dev](https://cloud.mobile.dev).
- Check the Maestro Cloud dashboard — results appear within a few minutes of the workflow completing.

### E2E `e2e-local` job: tests pass locally but fail in CI

- The test account (`E2E_TEST_USER_EMAIL` / `E2E_TEST_USER_PASSWORD`) must exist in the production Supabase project. CI connects to the same backend as the shipped app.
- Download the `maestro-test-results` artifact from the Actions run and open the HTML report for screenshots of the failure point.

### Release job: Play Store submission fails

- Confirm `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` contains the full JSON content of the service account key file (not a file path).
- Verify the service account has "Release manager" role in Play Console.
- Confirm the app record exists in Play Console with the correct package name (`com.recovery.stepstorecovery`).

### Release job: TestFlight submission fails

- Confirm `EXPO_APPLE_ID`, `EXPO_APPLE_TEAM_ID`, and `ASC_APP_ID` are set correctly.
- `ASC_APP_ID` must be the numeric App Store Connect app ID (found in App Information), not the bundle identifier.
- Verify the app record exists in App Store Connect.

### Bundle analysis comment not posting on PR

- The `bundle-analysis.yml` workflow requires `actions/github-script` to have write access to PR comments. The built-in `GITHUB_TOKEN` provides this for non-fork PRs. Forks cannot post comments — this is a GitHub security restriction.

### Codacy scan: results not in dashboard

- `CODACY_PROJECT_TOKEN` is not set. The scan still runs and uploads to GitHub Security, but the Codacy dashboard requires the token. Add it under Settings → Secrets and variables → Actions.

---

## Related Documentation

- [SECRETS.md](SECRETS.md) — All GitHub Actions secrets with setup instructions and rotation schedule
- [E2E-TESTING.md](E2E-TESTING.md) — Maestro local setup, flow writing guide, and troubleshooting
- [../SETUP.md](../SETUP.md) — Local development environment setup
- [../CONTRIBUTING.md](../CONTRIBUTING.md) — Git workflow, code standards, PR process
