# Troubleshooting

## App fails on startup

- Ensure `apps/mobile/.env` exists and includes:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Run `npm run validate-env` from the repo root.

## "Encryption key not found"

- The encryption key is created during onboarding.
- If the key was deleted, encrypted data cannot be recovered by design.

## Sync not working

- Verify network connectivity.
- Confirm the user is authenticated.
- Check that items were added to the sync queue (`sync_queue` table).

## Tests failing due to env vars

- Provide dummy values for required env vars:
  - `EXPO_PUBLIC_SUPABASE_URL=https://example.supabase.co`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY=test-anon-key`

## Workspace `tsc` cannot be found

- Symptom:
  - `npm run type-check --workspace=apps/mobile` fails with missing `.../node_modules/typescript/bin/tsc`.
- Fix:
  - Reinstall with npm from the repo root: `npm install`
  - Validate toolchain invariants: `npm run doctor:toolchain`
  - Use strict gate to confirm: `npm run verify:strict`

## Expo dev server issues

- Clear cache: `cd apps/mobile && npm run clean`
- Restart with `npm start`

## Android build failures

- Ensure Android SDK and environment are configured.
- Delete build artifacts:
  - `cd apps/mobile && npm run clean`

## iOS build failures

- Ensure Xcode and CocoaPods are installed.
- Run `cd apps/mobile && npx pod-install` (macOS only)
