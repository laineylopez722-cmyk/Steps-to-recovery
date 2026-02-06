# Expo Runtime Findings (Code-Verified)

## Scope

- Repo: `Steps-to-recovery`
- Target: `apps/mobile` Expo app
- Method: reproduce failures, apply minimal safe fixes, re-verify with build/test commands

## Root Causes Found

## 1) Expo startup blocked by port collision (`8081`)

- Symptom reproduced:
  - `expo start` attempted to prompt for a different port in non-interactive mode.
- Cause:
  - Existing process already bound to `8081`.
- Practical effect:
  - Startup appears to fail even though project config is otherwise valid.

## 2) Runtime compile failure from missing dependency

- Symptom reproduced:
  - Metro export failed on `react-native-url-polyfill/auto` import.
- Cause:
  - `apps/mobile/src/lib/supabase.ts` imports `react-native-url-polyfill/auto`, but dependency was missing from `apps/mobile/package.json`.

## 3) Test infra drift hid additional issues

- Symptom reproduced:
  - Multiple failing suites (`sentry`, `SyncStatusIndicator`, `ErrorBoundary`) despite app bundle being exportable.
- Cause:
  - Stale tests and missing mocks for newer hook/infra behavior.

## Fixes Applied

1. Added missing dependency:
   - `apps/mobile/package.json`
   - Added `"react-native-url-polyfill": "^2.0.0"`
2. Updated runtime Supabase table references in high-impact paths:
   - `apps/mobile/src/services/riskDetectionService.ts`
   - `apps/mobile/src/hooks/useSponsorInfo.ts`
3. Updated test coverage to reflect actual app wiring:
   - `apps/mobile/src/lib/sentry.ts`
   - `apps/mobile/src/features/home/components/__tests__/SyncStatusIndicator.test.tsx`
   - `apps/mobile/src/components/__tests__/ErrorBoundary.test.tsx`
4. Removed lint debt:
   - `apps/mobile/src/features/steps/screens/StepDetailScreen.tsx`

## Verification Results

## Quality checks

1. `npm -w apps/mobile run type-check` -> PASS
2. `npm -w apps/mobile run lint` -> PASS
3. `npm --workspace apps/mobile run test` -> PASS
   - 12 suites, 294 tests

## Expo build path

1. `npx expo export --platform android --clear` -> PASS
2. `npx expo export --platform web --clear` -> PASS

## Doctor

1. Root `npx expo-doctor --verbose` -> PASS (17/17).
2. `apps/mobile` `npx expo-doctor --verbose` -> PASS (17/17).
3. Non-CNG warning resolved by moving to CNG layout:
   - Removed committed `apps/mobile/android` native folder.
   - Native projects are now generated on demand with `npx expo prebuild --clean`.

## Remaining runtime-risk items

1. Sponsor emergency phone source is not fully modeled yet (`useSponsorInfo` currently falls back to email-derived name and empty phone).
2. `backgroundSync` still has TODO placeholders.

## Relevant Expo Docs

- Expo CLI usage:
  - https://docs.expo.dev/more/expo-cli/
- Using libraries with Expo:
  - https://docs.expo.dev/workflow/using-libraries/
- Native folders / config sync behavior:
  - https://docs.expo.dev/workflow/customizing/
  - https://docs.expo.dev/workflow/continuous-native-generation/
