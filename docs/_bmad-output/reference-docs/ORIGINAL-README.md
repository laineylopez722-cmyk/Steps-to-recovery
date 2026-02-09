# Recovery Companion (Expo Router)

## Overview

Secure, offline-first 12-step companion app built with Expo Router (SDK 54), React Native 0.81, React 19, NativeWind/Tailwind, TanStack Query, Zustand, and SQLite. Features include daily check-ins, mood/pulse tracking, step work, meetings, achievements/keytags, sponsor sharing, and encrypted journals.

## Setup

```bash
npm install
npm start           # Expo dev server (choose platform)
npm run android     # Expo + Android
npm run ios         # Expo + iOS
npm run web         # Expo web dev
```

## Build

- Web (static export): `npm run build:web` (runs `expo export --platform web`)
- EAS: profiles in `eas.json` (`development`, `preview`, `production`) with `APP_ENV` injected.

## Tests

```bash
npm test            # Jest (jest-expo)
```

New tests cover encryption and sponsor sharing encode/decode.

## Environment

- `EXPO_PUBLIC_SENTRY_DSN` (optional): enable Sentry in `lib/services/errorTracking.ts`.
- `APP_ENV`: provided by EAS profiles (dev/preview/prod).
- Crypto polyfills: `polyfills.js/ts` loads `react-native-get-random-values`, `expo-standard-web-crypto`, and `base-64` so `crypto.subtle`/`atob`/`btoa` exist on native/Hermes.

## Security & Data

- Field-level encryption with AES-GCM; keys stored in `expo-secure-store` (biometric when available). See `lib/encryption`.
- SQLite storage via `expo-sqlite`; schemas/migrations in `lib/db`.
- Notifications via `expo-notifications`; permissions requested at runtime.
- Audio/journal voice uses `expo-audio`; microphone permission required.

## Platform Notes

- New Architecture enabled.
- Buffer/crypto/base64 polyfills are loaded via `polyfills.js/ts`; encryption works on native and web.
- `PromptModal` replaces `Alert.prompt` for cross-platform inputs.
- Localhost instrumentation (`127.0.0.1:7242`) only runs in `__DEV__`; production builds stay quiet.

## Scripts quick ref

- `npm start` / `npm run android` / `npm run ios` / `npm run web`
- `npm run build:web`
- `npm test`

## Troubleshooting

- If crypto errors: ensure polyfills are loaded (they are imported in `app/_layout.tsx` and `app/entry.tsx`).
- If sharing decode fails on web: verify Buffer polyfill is present (default via polyfills).
