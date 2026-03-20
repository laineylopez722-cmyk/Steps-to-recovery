---
id: "REF-002"
title: "Motion token names need migration to new naming convention"
category: "refactoring"
severity: "low"
status: "open"
priority: "P3"
created: "2026-03-21"
updated: "2026-03-21"
labels:
  - "design-system"
  - "motion"
  - "tokens"
  - "tech-debt"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "S"
effort_hours: "2-4"
---

## Problem Statement

`apps/mobile/src/design-system/tokens/motion.ts` uses legacy token names that predate the
updated design system naming convention. Components that reference these old names will break
if the token file is cleaned up without a migration.

This is listed in `CLAUDE.md` Known Technical Debt as "Migrate motion token names" with low
priority. Without migration, there is ongoing risk that:

1. New components built against the new naming convention cannot use old token names
2. A future design system update that removes old token names will cause runtime errors
3. The inconsistency makes it harder for designers to communicate with developers about
   animation timings

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | Developers working on animated components |
| How often | When creating new animated components or updating existing ones |
| Severity when triggered | Potential naming confusion; future token removal will cause runtime errors |
| Workaround available | Yes — reference old names directly or read motion.ts to find the correct name |

---

## Steps to Reproduce

N/A — this is a code quality issue, not a bug.

---

## Acceptance Criteria

- [ ] `motion.ts` audited: all current token names documented
- [ ] New naming convention established (e.g., `motion.duration.fast` instead of `motion.fastDuration`)
  and documented in `CLAUDE.md` or design system README
- [ ] All components using old motion token names identified via grep:
  ```bash
  grep -r "motion\." apps/mobile/src --include="*.tsx" --include="*.ts" -l
  ```
- [ ] All identified components updated to use new token names
- [ ] Old token names removed from `motion.ts` (or kept as deprecated aliases with a comment)
- [ ] No runtime animation errors after migration (manual test of all animated screens)
- [ ] No TypeScript errors introduced (`npx tsc --noEmit` passes)

---

## Implementation Notes

- Token file: `apps/mobile/src/design-system/tokens/motion.ts`
- Approach: Add new names alongside old names, update all consumers, then remove old names
  in a follow-up commit (reduces merge conflict risk)
- The naming convention should follow the pattern used in `colors.ts` and `spacing.ts` if
  they already use a consistent nested structure (e.g., `colors.text.primary`)
- For animated components, look in:
  - `apps/mobile/src/design-system/components/`
  - `apps/mobile/src/features/` — any component using `Animated` or `react-native-reanimated`

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | S |
| Hours estimate | 2-4 hours |
| Confidence | medium |
| Rationale | Depends on how many components reference motion tokens — grep will tell us |

---

## Blocked By

None.

---

## Related Documentation

- `apps/mobile/src/design-system/tokens/motion.ts` — file to migrate
- `apps/mobile/src/design-system/tokens/colors.ts` — reference for naming convention
- `CLAUDE.md` — "Known Technical Debt" table, "Design System" section
