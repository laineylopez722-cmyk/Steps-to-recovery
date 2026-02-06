# Priority Action Plan

## Completed in this pass

1. Fixed Expo dependency/runtime blocker (`react-native-url-polyfill`).
2. Normalized broken Supabase table references in sponsor/risk paths.
3. Restored test health for affected suites and validated full suite pass.
4. Cleared current lint warning debt.
5. Moved mobile app to CNG-style native workflow by removing committed `apps/mobile/android`.

## Immediate Next (highest impact)

1. Define sponsor contact source-of-truth for crisis call/text.
   - Decide where sponsor phone/name lives (extend `profiles` vs dedicated sponsor contact table).
   - Update `useSponsorInfo` + crisis screens/hooks to read from that canonical source.
2. Finish `backgroundSync` TODO placeholders.
   - `apps/mobile/src/services/backgroundSync.ts:239`
   - `apps/mobile/src/services/backgroundSync.ts:244`
3. Wire remaining user-facing TODOs in crisis/journal flows.

## Near-Term Reliability

1. Enforce CNG workflow in team runbooks:
   - Use `cd apps/mobile && npx expo prebuild --clean` when native regeneration is required.
2. Add CI guardrail for table-name parity.
   - Detect `.from('<table>')` usage and compare against SQL migrations.
3. Keep current React Navigation stack as baseline.
   - Evaluate Expo Router only as an explicit migration track after runtime stability is locked.

## Security/Quality Hardening

1. Add contract tests for sponsor and risk features.
   - Validate query assumptions against current table/column shapes.
2. Add focused tests for sponsor phone fallback behavior.
   - Explicitly assert crisis UX for missing phone.

## Acceptance Criteria for “Running As It Should”

1. `expo start` and both exports run without unresolved module errors.
2. `type-check`, `lint`, and full test suite pass.
3. No app code references non-existent Supabase tables.
4. Sponsor quick call/text is backed by a verified data model.
5. No TODO placeholders remain in production-critical service paths.
