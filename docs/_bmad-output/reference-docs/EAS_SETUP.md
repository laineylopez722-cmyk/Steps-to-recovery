# EAS Build Setup Guide

Before you can build and deploy Recovery Companion, you need to configure EAS (Expo Application Services).

## Prerequisites

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```

## Configuration Steps

### 1. Initialize EAS Project

Run the following command in the `twelve-step-companion` directory:

```bash
eas init
```

This will:
- Create/link an EAS project
- Generate a unique `projectId`

### 2. Update app.json

After running `eas init`, update these placeholders in `app.json`:

| Placeholder | Location | How to Get Value |
|-------------|----------|------------------|
| `REPLACE_WITH_EAS_PROJECT_ID` | `expo.extra.eas.projectId` | Automatically set by `eas init`, or find in [Expo Dashboard](https://expo.dev) |
| `REPLACE_WITH_EXPO_USERNAME` | `expo.owner` | Your Expo account username |

### 3. Update eas.json (Optional)

For App Store/Play Store submission, update `eas.json`:

| Field | Description |
|-------|-------------|
| `submit.production.ios.appleId` | Your Apple ID email |
| `submit.production.ios.ascAppId` | App Store Connect App ID |
| `submit.production.android.serviceAccountKeyPath` | Path to Google Play service account JSON |

## Building

### Development Build
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Preview Build (Internal Testing)
```bash
eas build --profile preview --platform all
```

### Production Build
```bash
eas build --profile production --platform all
```

## Submitting

### iOS App Store
```bash
eas submit --platform ios
```

### Google Play Store
```bash
eas submit --platform android
```

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Expo Dashboard](https://expo.dev)

