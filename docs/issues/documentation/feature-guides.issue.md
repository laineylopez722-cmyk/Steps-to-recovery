---
id: "DOC-001"
title: "Feature implementation guides missing for achievements, geofencing, and search"
category: "documentation"
severity: "high"
status: "fixed"
priority: "P1"
created: "2026-03-21"
updated: "2026-03-21"
fixed_date: "2026-03-21"
labels:
  - "guides"
  - "achievements"
  - "geofencing"
  - "search"
  - "onboarding"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "M"
effort_hours: "6-10"
---

## Problem Statement

`CLAUDE.md` lists feature implementation guides in `.claude/` for journal, steps, sponsor,
notifications, and challenges. However, several significant features lack guides entirely:

1. **Achievements and Milestones** — The milestone detection pattern and achievement types are
   documented in `CLAUDE.md` but there is no `.claude/AchievementsClaude.md` guide covering
   the full implementation: database schema, hook patterns, UI components, and edge cases.

2. **Meeting Geofencing** — `CLAUDE.md` documents the geofencing code pattern but not the
   operational reality: background permission request flow, platform differences (iOS "Always"
   vs Android background permission), TaskManager registration lifecycle, and testing approach.

3. **Encrypted Full-Text Search** — The app supports search in journal entries but there is
   no guide explaining how encrypted FTS works, the trade-off between decrypt-all and indexed
   approaches, the `useMemoryStore` FTS pattern, or performance limits.

Without these guides, developers implementing related features must reverse-engineer existing
code, leading to inconsistent patterns and duplicated effort.

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | Developers implementing or extending these three feature areas |
| How often | Every time a developer touches achievements, geofencing, or search |
| Severity when triggered | 2-4 hours of reverse-engineering per feature area |
| Workaround available | Yes — read the source code directly |

---

## Steps to Reproduce

N/A — this is missing documentation, not a bug.

---

## Acceptance Criteria

- [ ] `.claude/AchievementsClaude.md` created covering:
  - Database schema for the `achievements` table
  - Hook pattern for `useAchievements` and `useCleanTime`
  - Milestone detection logic (MILESTONES array, isMilestone check)
  - Achievement types (clean_time, journal_streak, meeting_attendance, step_completion)
  - Badge UI component usage
  - Edge cases (sobriety date reset, timezone handling for "days" calculation)

- [ ] `.claude/GeofencingClaude.md` created covering:
  - Permission request flow (foreground first, then background)
  - Platform differences (iOS "Always" vs Android ACCESS_BACKGROUND_LOCATION)
  - TaskManager.defineTask pattern and registration lifecycle
  - Geofence registration, update, and teardown
  - Testing geofencing without physical device movement (Xcode Simulator location simulation)
  - Known limitations (iOS background mode restrictions, battery impact)

- [ ] `.claude/SearchClaude.md` created covering:
  - How encrypted FTS works currently (decrypt-all, then in-memory search)
  - useMemoryStore pattern and when to use it
  - Performance characteristics and the 1000-entry threshold
  - Future path to indexed encrypted FTS if needed
  - Search UI patterns and debouncing

- [ ] All three guides follow the existing guide structure (AppCoreClaude.md, JournalingClaude.md as reference)
- [ ] CLAUDE.md updated to reference the three new guides in the Reference Documentation table

---

## Implementation Notes

- Reference guide structure from `.claude/JournalingClaude.md` and `.claude/ChallengesClaude.md`
- For achievements, the relevant source files are in `apps/mobile/src/features/challenges/`
  and `apps/mobile/src/features/home/` (clean time tracker)
- For geofencing, the NotificationsClaude.md guide has partial coverage — the new guide should
  expand on the geofencing-specific sections
- For search, look at `apps/mobile/src/features/journal/` hooks for the current FTS approach
- Keep guides concise: aim for 200-400 lines each, not comprehensive API docs

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | M |
| Hours estimate | 6-10 hours |
| Confidence | medium |
| Rationale | 3 guides x ~2-3 hours each; main effort is reading source code and distilling patterns |

---

## Blocked By

None.

---

## Related Documentation

- `.claude/ChallengesClaude.md` — existing challenges/streaks guide (closest to achievements)
- `.claude/NotificationsClaude.md` — existing notifications guide (covers geofencing partially)
- `CLAUDE.md` — "Achievements & Milestones", "Notifications & Background Tasks" sections
- `apps/mobile/src/features/challenges/` — challenges feature source
- `apps/mobile/src/features/journal/` — journal feature source (for search patterns)
