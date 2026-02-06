# Codebase Audit (Implementation-Verified)

This audit is based on executable code/config and command output, not Markdown docs.

## Resolved in this pass

## R1) Supabase table mismatches fixed

Resolved references:

- `daily_check_ins` -> `daily_checkins`
- `shared_journal_entries` -> `sponsor_shared_entries`
- `sponsor_relationships` -> `sponsorships`

Updated files:

- `apps/mobile/src/services/riskDetectionService.ts`
- `apps/mobile/src/hooks/useSponsorInfo.ts`

Verification:

- `rg -n "daily_check_ins|shared_journal_entries|sponsor_relationships" apps/mobile/src` returns no matches.

## R2) Failing test suites fixed

Updated:

- `apps/mobile/src/lib/sentry.ts`
- `apps/mobile/src/features/home/components/__tests__/SyncStatusIndicator.test.tsx`
- `apps/mobile/src/components/__tests__/ErrorBoundary.test.tsx`

Verification:

- `npm --workspace apps/mobile run test` passes (12 suites, 294 tests).

## R3) Lint warning cleanup

Updated:

- `apps/mobile/src/features/steps/screens/StepDetailScreen.tsx`

Verification:

- `npm -w apps/mobile run lint` passes with zero warnings.

## Remaining High/Medium Findings

## H1) Sponsor phone source-of-truth is still missing

- `useSponsorInfo` now queries valid tables but cannot reliably populate sponsor phone from current schema:
  - `apps/mobile/src/hooks/useSponsorInfo.ts`
- Crisis flows still expect sponsor phone for call/text UX:
  - `apps/mobile/src/hooks/useEmergencyAccess.ts:236`
  - `apps/mobile/src/features/crisis/screens/BeforeYouUseScreen.tsx:366`

Impact:

- Sponsor quick-call/text can still degrade to "No phone number saved."

## H2) Background sync implementation has TODO placeholders

- `apps/mobile/src/services/backgroundSync.ts:239`
- `apps/mobile/src/services/backgroundSync.ts:244`

Impact:

- Service behavior may drift from actual auth/db architecture and stay partially implemented.

## M1) User-facing TODOs still present in crisis/journal flows

- `apps/mobile/src/features/crisis/screens/BeforeYouUseScreen.tsx:156`
- `apps/mobile/src/features/crisis/screens/BeforeYouUseScreen.tsx:165`
- `apps/mobile/src/features/journal/screens/JournalListScreen.tsx:74`

## M2) Expo workflow warning resolved

- `npx expo-doctor --verbose` now passes 17/17 in both root and `apps/mobile`.
- Native folder warning was resolved by removing committed `apps/mobile/android` and standardizing on CNG regeneration.

## Verified Strengths

1. Encryption path remains robust and heavily tested:
   - `apps/mobile/src/utils/encryption.ts`
   - `npm -w apps/mobile run test:encryption` and full suite pass.
2. Offline-first DB and migration model is implemented:
   - `apps/mobile/src/utils/database.ts`
3. Queue-based sync service includes batching/retries/backoff:
   - `apps/mobile/src/services/syncService.ts`
