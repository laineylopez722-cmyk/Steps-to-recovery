# Security Audit — 2026-03-28 (RLS + SecureStore + Logging)

## Scope

This audit operationalizes the remaining security tasks from:

- `docs/issues/security/rls-policy-validation.issue.md`

Audit date: **2026-03-28**.

---

## 1) RLS Policy Validation (Synced Tables)

### Synced tables in scope

From the issue and sync path review:

1. `journal_entries`
2. `step_work`
3. `daily_checkins`
4. `favorite_meetings`
5. `reading_reflections`
6. `weekly_reports`
7. `sponsor_connections`
8. `sponsor_shared_entries`

### Validation method

- Static SQL audit of tracked migrations in `supabase/migrations/`.
- Backfill migration added for baseline policy coverage where policy definitions were not codified in migrations for legacy tables.

### Results

| Table | RLS enabled | CRUD policies (`auth.uid() = user_id`) | Notes |
|---|---|---|---|
| `journal_entries` | ✅ | ✅ (via 2026-03-28 backfill migration) | Legacy table policy now codified in-repo |
| `step_work` | ✅ | ✅ (via 2026-03-28 backfill migration) | Legacy table policy now codified in-repo |
| `daily_checkins` | ✅ | ✅ | Verified in migration |
| `favorite_meetings` | ✅ | ✅ | Verified in migration |
| `reading_reflections` | ✅ | ✅ | Verified in migration |
| `weekly_reports` | ✅ | ✅ | Verified in migration |
| `sponsor_connections` | ✅ | ✅ | Verified in migration |
| `sponsor_shared_entries` | ✅ | ✅ owner CRUD + ✅ sponsor SELECT | Added sponsor-side SELECT policy in 2026-03-28 migration |

### Change made

Added migration:

- `supabase/migrations/20260328000000_validate_synced_table_rls.sql`

This migration:

- Enables RLS for `journal_entries` and `step_work` (idempotent).
- Adds missing CRUD policies for both tables if absent.
- Adds sponsor-side read policy for `sponsor_shared_entries` through `sponsor_connections` when `status = 'connected'`.

---

## 2) SecureStore Usage Audit

### Method

Repository scan for:

- direct `SecureStore` usage
- `secureStorage` adapter usage
- token/key/session handling and accidental plain-text persistence paths

### Findings

- Sensitive runtime data (encryption key, PIN/settings, secure preferences) is stored via `SecureStore`/secure adapter paths.
- No new plain-text token writes were found in app storage layers in audited paths.
- **Leakage risk found in logs**: secure key identifiers were included in log messages/metadata in some error/success paths.

### Remediation completed

- Removed secure key names from native secure storage adapter logs.
- Removed secure key identifiers from generic `useSecureValue` hook logs.

---

## 3) Sensitive Logging Audit (Services/Hooks/Error Paths)

### Method

Pattern scan for:

- `console.*`
- `logger.*`
- contexts where notification payloads, keys, tokens, and user identifiers were logged

### Risky log paths remediated

- `NotificationContext`: stopped logging raw notification `body` and payload `data`; replaced with boolean flags.
- `pushTokenService`: removed user ID from success logs.
- `riskDetectionService`: removed user ID from analysis/error/notification logs.
- `useSecureValue` and native secure storage adapter: removed key identifiers from log payloads/messages.

### Residual posture

- Sanitized logger remains in place and continues field-level redaction.
- Sensitive payload surface area reduced at call sites to avoid accidental data disclosure before sanitization.

---

## 4) Release Checklist Linkage

Linked this audit from:

- `docs/BUILD_CHECKLIST.md` (new security audit gate with required links)

---

## Evidence Commands (executed)

```bash
rg -n "CREATE POLICY|ENABLE ROW LEVEL SECURITY|daily_checkins|favorite_meetings|reading_reflections|weekly_reports|sponsor_connections|sponsor_shared_entries" supabase/migrations/*.sql
rg -n "journal_entries|step_work" --glob '*.sql'
rg -n "SecureStore|secureStorage|localStorage\.setItem\(|AsyncStorage|token" apps/mobile/src
rg -n "console\.(log|error|warn|info|debug)|logger\.(info|warn|error|debug)\(" apps/mobile/src
```
