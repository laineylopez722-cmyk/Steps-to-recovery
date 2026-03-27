# Code Improvement Priorities (2026-03-08)

This document prioritizes the most necessary engineering improvements observed in the current codebase, with an emphasis on correctness, security, offline reliability, and production readiness.

## 1) Complete `readingStore` implementation (Critical)

**Why this is urgent**
- Core reading flows are currently stubbed.
- Streak computation is explicitly non-functional (`calculateStreak` returns `0`).

**Evidence**
- `markAsRead`, `getReadingForDate`, `getReflectionForDate`, `calculateStreak`, and `initializeReadings` are unimplemented TODOs.

**Risk if deferred**
- User-facing feature appears complete but silently fails (incorrect streaks, missing historical retrieval).
- Analytics/product decisions based on streak data will be invalid.

**Enhancement plan**
1. Inject DB dependency into store actions (or wrap with hook that provides DB + user id).
2. Implement SQL-backed retrieval for date-based reads/reflections.
3. Implement streak calculation with SQL window/consecutive-day query (avoid O(365) loop).
4. Add table-seeding path for 365 readings + idempotency guard.
5. Add unit + integration tests for streak edge-cases (timezone boundaries, DST, leap year).

---

## 2) Replace widget bridge placeholder with real native shared-container bridge (High)

**Why this is urgent**
- Widget pipeline is still a placeholder and cannot provide true cross-process/widget reliability.

**Evidence**
- `updateWidgetData` and `refreshWidgets` still contain TODOs and MMKV placeholder behavior.

**Risk if deferred**
- Widget feature may look functional internally but fail as soon as real WidgetKit/AppWidget integration is expected.
- Difficult late-stage integration risk near release.

**Enhancement plan**
1. Add platform-native shared storage module (App Group on iOS, SharedPreferences on Android).
2. Add versioned payload schema + migration guard (`version` field).
3. Add checksum + payload size cap.
4. Emit operational metrics (`widget_write_success`, `widget_refresh_success`).

---

## 3) Reduce sync engine blast radius by decomposing `syncService` (High)

**Why this is urgent**
- Sync is mission-critical and currently concentrated in a very large service file.

**Evidence**
- `syncService.ts` is ~1,937 lines and handles mutexing, queue retries, table mapping, push/pull behavior, and error handling in one unit.

**Risk if deferred**
- Higher regression probability for any sync change.
- Harder to reason about retries/conflicts and security boundaries.

**Enhancement plan**
1. Split into modules: `sync-mutex`, `sync-retry`, `sync-push`, `sync-pull`, and per-table adapters.
2. Introduce typed `SyncTableAdapter` interface with per-table serializer/deserializer.
3. Add deterministic contract tests per adapter + queue state-machine tests.
4. Add structured failure taxonomy (`timeout`, `auth`, `rls`, `validation`, `unknown`) for targeted retries.

---

## 4) Fix memory search scalability for encrypted data (High for scale)

**Why this is urgent**
- Current search strategy decrypts all user memories and filters in-memory.

**Evidence**
- `searchMemories` intentionally fetches all rows and decrypts/filter client-side; TODO calls out future FTS optimization.

**Risk if deferred**
- O(n) decrypt + filter causes latency spikes and battery impact as entries grow.
- UX degradation likely once users accumulate large history.

**Enhancement plan**
1. Add privacy-preserving search index strategy (e.g., normalized encrypted keyword index or blind index).
2. Bound result set and paginate before decrypting full records.
3. Add perf budget test (e.g., P95 search latency with 5k records on mid-tier device).

---

## 5) Eliminate silent error swallowing on critical app startup paths (Medium-High)

**Why this is urgent**
- Multiple startup calls suppress errors with empty catches.

**Evidence**
- Startup and navigation bar configuration use `.catch(() => {})` with no telemetry.

**Risk if deferred**
- Production failures become invisible during initialization.
- Increases MTTR for startup regressions.

**Enhancement plan**
1. Replace empty catches with `logger.warn(...)` including safe metadata.
2. Track startup health breadcrumbs in Sentry.
3. Define “expected failure” vs “unexpected failure” categories per call.

---

## 6) Remove app-level `any` cast + `defaultProps` mutation on RN Text (Medium)

**Why this is urgent**
- Violates project’s strict typing guidance and relies on a brittle global mutation pattern.

**Evidence**
- `App.tsx` mutates `RNText.defaultProps` via `(RNText as any)`.

**Risk if deferred**
- Potential breakage across RN upgrades.
- Type-safety erosion at app root.

**Enhancement plan**
1. Replace global mutation with design-system `Text` wrapper + codemod rollout.
2. Enforce lint rule preventing `as any` outside test files.
3. Add smoke test ensuring typography fallback behavior remains consistent.

---

## Validation Snapshot (current baseline)

The following checks pass at the time of this audit:
- `npm run lint --workspace=apps/mobile`
- `npm run type-check --workspace=apps/mobile`
- `npm run test:encryption --workspace=apps/mobile`

Use these as baseline quality gates while implementing the above priorities.
