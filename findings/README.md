# Findings Summary

## What was fixed in this pass

1. Expo runtime blocker fixed:
   - Added missing dependency `react-native-url-polyfill` in `apps/mobile/package.json`.
2. Supabase table mismatches fixed in runtime paths:
   - `apps/mobile/src/services/riskDetectionService.ts`
   - `apps/mobile/src/hooks/useSponsorInfo.ts`
3. Test reliability fixes:
   - Sentry sanitizer now redacts `plaintext` in `apps/mobile/src/lib/sentry.ts`.
   - Rewrote stale Sync indicator tests for current React Query hooks in `apps/mobile/src/features/home/components/__tests__/SyncStatusIndicator.test.tsx`.
   - Rewrote ErrorBoundary tests with stable mocks in `apps/mobile/src/components/__tests__/ErrorBoundary.test.tsx`.
4. Lint cleanup:
   - Removed unused design-system skeleton imports in `apps/mobile/src/features/steps/screens/StepDetailScreen.tsx`.
5. Fixed runtime crash from hook-order violation in database provider:
   - `apps/mobile/src/contexts/DatabaseContext.tsx`
6. Hardened root error fallback to work without `ThemeProvider`:
   - `apps/mobile/src/components/ErrorBoundary.tsx`

## What is verified working now

1. `npm -w apps/mobile run type-check` passes.
2. `npm -w apps/mobile run lint` passes with zero warnings.
3. `npm --workspace apps/mobile run test` passes:
   - 12 suites
   - 294 tests
4. `npx expo export --platform android --clear` passes.
5. `npx expo export --platform web --clear` passes.
6. Root `npx expo-doctor --verbose` passes (17/17).
7. App-level `cd apps/mobile && npx expo-doctor --verbose` passes (17/17).
8. `npx expo export --platform android --clear` passes after provider/error-boundary fixes.

## Remaining verified gaps

1. Sponsor phone/name source model is still incomplete for crisis call/text UX.
   - Current `profiles` query only guarantees `email`; `phone` is still blank in `useSponsorInfo`.
2. Background sync service still has TODO placeholders:
   - `apps/mobile/src/services/backgroundSync.ts:239`
   - `apps/mobile/src/services/backgroundSync.ts:244`
3. Native folders are now CNG-managed (removed from repo).
   - Regenerate when needed with `cd apps/mobile && npx expo prebuild --clean`.

## Documents

1. Improved reusable request prompt:
   - `findings/00-improved-request-prompt.md`
2. Expo runtime diagnosis and fixes:
   - `findings/01-expo-runtime-findings.md`
3. Code-verified audit findings by severity:
   - `findings/02-codebase-audit.md`
4. Hooks/API/services/schema inventory:
   - `findings/03-hooks-api-inventory.md`
5. Prioritized execution plan:
   - `findings/04-priority-action-plan.md`
