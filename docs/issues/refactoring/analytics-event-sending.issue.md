---
id: "REF-003"
title: "Analytics event sending is a no-op stub"
category: "refactoring"
severity: "low"
status: "open"
priority: "P3"
created: "2026-03-21"
updated: "2026-03-21"
labels:
  - "analytics"
  - "tech-debt"
  - "metrics"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "M"
effort_hours: "4-8"
---

## Problem Statement

`apps/mobile/src/utils/analytics.ts` (or similar) contains `sendEvent()` and `trackScreen()`
functions that are called throughout the app but do nothing — they are no-op stubs. This means:

1. No usage data is collected for BMAD "Measure" phase decisions
2. The function calls add noise to the codebase with no value
3. If analytics is wired up later, the event schema defined in stub calls may not match what
   the analytics provider expects

This is listed in `CLAUDE.md` Known Technical Debt as "Analytics event sending" with low priority.

The BMAD methodology this project follows explicitly requires measurement ("Build-Measure-Analyze-
Decide") — without analytics, the "Measure" phase is entirely absent.

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | Product team (no usage data), developers (dead code noise) |
| How often | All analytics calls throughout the app are silent no-ops |
| Severity when triggered | No user behaviour data for product decisions |
| Workaround available | Yes — rely on Supabase query counts as a rough proxy |

---

## Steps to Reproduce

N/A — this is a feature gap, not a bug.

---

## Acceptance Criteria

Choose one of two resolution paths:

**Option A — Wire to a real analytics provider (preferred if team has provider):**
- [ ] Analytics provider selected (Posthog recommended for privacy-first apps; no PII required)
- [ ] `analytics.ts` updated with real implementation
- [ ] All existing `sendEvent()` call sites verified to send correct event schema
- [ ] Privacy review: confirm no PII or recovery-sensitive data sent to analytics (only event names + counts)
- [ ] Analytics opt-out available in app Settings (required for App Store submission)
- [ ] No TypeScript errors introduced (`npx tsc --noEmit` passes)

**Option B — Remove the stubs (if no analytics planned near-term):**
- [ ] All `sendEvent()` and `trackScreen()` call sites removed from the codebase
- [ ] `analytics.ts` file deleted or reduced to a documented empty interface
- [ ] `CLAUDE.md` Known Technical Debt table updated to remove this entry
- [ ] No TypeScript errors introduced (`npx tsc --noEmit` passes)

---

## Implementation Notes

- Find all call sites:
  ```bash
  grep -r "sendEvent\|trackScreen\|analytics\." apps/mobile/src --include="*.ts" --include="*.tsx" -l
  ```
- For Option A, Posthog has a React Native SDK and a privacy-focused model:
  - No automatic PII capture
  - Self-hosted option available
  - Free tier sufficient for recovery app scale
  - Package: `posthog-react-native`
- Privacy constraint: Event payloads must NEVER include:
  - User content (journal text, step work answers)
  - Sobriety dates or clean time
  - Any field that could identify a user's recovery status
  - Only acceptable: event names, timestamps, screen names, feature flags

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | M |
| Hours estimate | 4-8 hours (Option A) or 1-2 hours (Option B) |
| Confidence | medium |
| Rationale | Option A requires provider setup, SDK integration, and privacy review. Option B is mechanical removal. |

---

## Blocked By

None. But Option A requires a product decision on which analytics provider to use.

---

## Related Documentation

- `CLAUDE.md` — "Known Technical Debt" table, "BMAD Methodology" section
- `apps/mobile/src/utils/analytics.ts` — file to update (confirm path with grep)
