# Maestro E2E Testing Setup

This directory contains Maestro end-to-end tests for the Steps to Recovery app.

## Prerequisites

1. Install Maestro CLI:

   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

2. For Windows, use WSL or the Windows installer from:
   https://maestro.mobile.dev/getting-started/installing-maestro

## Running Tests

### iOS Simulator

```bash
maestro test maestro/
```

### Android Emulator

```bash
maestro test maestro/
```

### Specific Test File

```bash
maestro test maestro/flows/onboarding.yaml
```

## Test Structure

```
maestro/
├── flows/
│   ├── onboarding.yaml      # Onboarding flow tests
│   ├── auth.yaml            # Authentication tests
│   ├── journal.yaml         # Journal entry tests
│   └── checkin.yaml         # Daily check-in tests
├── config.yaml              # Maestro configuration
└── README.md                # This file
```

## Writing Tests

Maestro uses YAML syntax. Example:

```yaml
appId: com.stepstorecovery.app
---
- launchApp
- tapOn: 'Sign In'
- inputText:
    id: 'email-input'
    text: 'test@example.com'
- tapOn: 'Continue'
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run Maestro Tests
  uses: mobile-dev-inc/action-maestro-cloud@v1
  with:
    api-key: ${{ secrets.MAESTRO_CLOUD_API_KEY }}
    app-file: app-release.apk
```

## Resources

- [Maestro Documentation](https://maestro.mobile.dev/)
- [Maestro YAML Reference](https://maestro.mobile.dev/reference/yaml-syntax)
