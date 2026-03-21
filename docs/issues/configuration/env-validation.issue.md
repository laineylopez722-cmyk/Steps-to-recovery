---
id: "CFG-003"
title: "Environment variable validation missing at startup"
category: "configuration"
severity: "high"
status: "fixed"
priority: "P1"
created: "2026-03-21"
updated: "2026-03-21"
fixed_date: "2026-03-21"
labels:
  - "env"
  - "startup"
  - "developer-experience"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "S"
effort_hours: "2-4"
---

## Problem Statement

The app starts silently when `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` are
missing from the `.env` file. Instead of a clear error, developers see cryptic network errors
like "TypeError: Cannot read property 'from' of undefined" or a blank Supabase response,
with no indication that the root cause is a missing environment variable.

The existing `scripts/validate-env.js` is an opt-in script that must be run manually. It is
not called during `npm start`, `npm run mobile`, or as a postinstall hook. New developers
routinely waste 30-60 minutes debugging before discovering the `.env` file is missing.

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | All new developers, developers switching machines |
| How often | Every fresh environment setup |
| Severity when triggered | Blocks development until diagnosed — 30-60 min debugging |
| Workaround available | Yes — run `npm run validate-env` manually or read SETUP.md carefully |

---

## Steps to Reproduce

1. Clone the repository on a clean machine
2. Run `npm install`
3. Run `npm run mobile` without creating `apps/mobile/.env`
4. Observe: App starts, auth screen appears, then generic network errors appear when trying to sign in
5. No indication that environment variables are missing

**Expected:** Clear startup error listing the missing variables with setup instructions
**Actual:** Generic network errors with no actionable guidance

---

## Acceptance Criteria

- [ ] Validation runs automatically before the app starts (integrate into startup or postinstall)
- [ ] Missing variables produce an error message naming each missing variable
- [ ] Error message includes the path to `.env.example` and instructions to copy it
- [ ] Validation checks for placeholder values (e.g., `your-project.supabase.co` still present)
- [ ] Validation is skipped gracefully in CI environments where vars come from secrets
- [ ] No TypeScript errors introduced (`npx tsc --noEmit` passes)
- [ ] `scripts/validate-env.js` is updated or replaced with the new logic

---

## Implementation Notes

- The existing script is at `scripts/validate-env.js` — enhance rather than replace
- For Expo, the best integration point is the `postinstall` script in `apps/mobile/package.json`
  or a custom Expo plugin that runs at bundle time
- Alternatively, validate at the top of `apps/mobile/src/lib/supabase.ts` where Supabase is
  initialised — throw a descriptive error if vars are empty strings
- Use `process.env.EXPO_PUBLIC_SUPABASE_URL` — Expo replaces these at bundle time
- For CI: check for a `CI=true` environment variable to suppress interactive messages
- Example pattern from the validation side:
  ```javascript
  const REQUIRED = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'];
  const missing = REQUIRED.filter(k => !process.env[k]);
  if (missing.length) {
    console.error('Missing required environment variables:', missing.join(', '));
    console.error('Copy apps/mobile/.env.example to apps/mobile/.env and fill in values.');
    process.exit(1);
  }
  ```

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | S |
| Hours estimate | 2-4 hours |
| Confidence | high |
| Rationale | Script enhancement + integration point change. No UI changes needed. |

---

## Blocked By

None.

---

## Related Documentation

- `scripts/validate-env.js` — existing validation script to enhance
- `apps/mobile/.env.example` — template for required variables
- `SETUP.md` — environment setup instructions
- `CLAUDE.md` — "Environment Setup" section
