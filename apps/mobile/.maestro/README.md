# E2E Tests for Steps to Recovery

Canonical Maestro assets now live in `apps/mobile/.maestro/`.

> Migration note: `apps/mobile/maestro/` was removed. Move any local references to `.maestro/` paths.

## Quick Start

```bash
# Install Maestro
curl -fsSL "https://get.maestro.mobile.dev" | bash

# Run all critical-path flows
cd apps/mobile
maestro test .maestro/flows/onboarding.yaml
maestro test .maestro/flows/login.yaml
maestro test .maestro/flows/daily-checkin.yaml
maestro test .maestro/flows/journal.yaml

# Validate every flow file
for flow in .maestro/flows/*.yaml; do
  maestro test --dry-run "$flow"
done
```

## Directory Structure

```text
.maestro/
├── config.yaml
├── .env.example
├── README.md
└── flows/
    ├── _run-all.yaml
    ├── auth.yaml
    ├── checkin.yaml
    ├── crisis-detection.yaml
    ├── daily-checkin.yaml
    ├── day1-core-safety.yaml
    ├── day2-daily-workflows.yaml
    ├── day3-network-sync.yaml
    ├── day4-stability.yaml
    ├── journal.yaml
    ├── login.yaml
    ├── offline-sync.yaml
    ├── onboarding.yaml
    └── step-work.yaml
```

## Flow Groups

- **Critical path:** onboarding, login, daily-checkin, journal, step-work, offline-sync, crisis-detection.
- **Extended validation suites:** day1-core-safety, day2-daily-workflows, day3-network-sync, day4-stability.
- **Compatibility helpers:** auth, checkin.

## Environment Variables

Create `apps/mobile/.maestro/.env` from the example file:

```bash
cp apps/mobile/.maestro/.env.example apps/mobile/.maestro/.env
```

Required:

```bash
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPass123!
```

## CI/CD

CI uses `apps/mobile/.maestro` as the Maestro workspace in `.github/workflows/e2e.yml`.
