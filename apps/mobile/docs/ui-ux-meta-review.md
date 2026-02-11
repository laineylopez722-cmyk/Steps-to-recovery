# UI/UX Meta Review (Whole App Surface)

Date: 2026-02-08  
Scope: All routes in `src/navigation/types.ts` that map to user-facing screens  
Primary objective: Premium visual polish without sacrificing safety/accessibility

## Method

This review is grounded in repository truth and deterministic heuristics:

1. Route inventory and risk tagging from `src/design-system/review/screen-inventory.ts`.
2. Weighted rubric scoring from `src/design-system/review/rubric.ts`.
3. Drift checks for token usage, docs-vs-code alignment, and navigation contracts.
4. Prioritized issue backlog in `src/design-system/review/backlog.ts`.

## Baseline Snapshot

- Total audited routes: **31**
- Safety-critical routes: **4**
- Typed-only routes: **0**
- Token/system footprint (file-count baseline):
  - `design-system/tokens/ds`: **19**
  - `design-system/hooks/useTheme`: **14**
  - `design-system/tokens/modern`: **17**
  - `components/ui`: **14**

## High-Confidence Findings

1. Multiple design systems are active in production paths.
   - Evidence:
     - `src/navigation/MainNavigator.tsx:35`
     - `src/features/meetings/screens/MeetingFinderScreen.tsx:11`
     - `src/design-system/components/AccessibilityHelpers.tsx:4`
2. Documentation describes modern screens that do not exist in the current tree.
   - Evidence:
     - `src/design-system/COMPLETE_UI_IMPROVEMENTS.md:78`
     - `src/design-system/UI_IMPROVEMENTS_SUMMARY.md:310`
     - `src/design-system/MODERN_UI_MIGRATION.md:146`
3. Daily reading has two implementations in separate features, route uses only one.
   - Evidence:
     - `src/navigation/MainNavigator.tsx:28`
     - `src/features/readings/screens/DailyReadingScreen.tsx:34`
     - `src/features/home/screens/DailyReadingScreen.tsx:30`

## Implemented In This Pass

1. Fixed route contract mismatch for sponsor sharing.
   - `ShareEntries` is now registered in `ProfileStackNavigator`.
   - Evidence:
     - `src/navigation/MainNavigator.tsx`
     - `src/navigation/types.ts:62`
     - `src/navigation/linking.ts:117`
2. Removed semantically invalid emergency scroll role.
   - `accessibilityRole="scrollbar"` removed from emergency screen container.
   - Evidence:
     - `src/features/emergency/screens/EmergencyScreen.tsx`

## Baseline Heuristic Scorecard

Scale: 1 (poor) to 5 (excellent), weighted by `UX_AUDIT_WEIGHTS`.

| Journey                                                         | Weighted Score | Band       | Notes                                                                |
| --------------------------------------------------------------- | -------------: | ---------- | -------------------------------------------------------------------- |
| Daily home (`HomeMain` + check-ins)                             |           3.63 | strong     | Strong emotional tone, moderate system drift.                        |
| Emergency support (`Emergency`, `BeforeYouUse`, `DangerZone`)   |           3.41 | needs-work | Safety content strong, a11y semantics and consistency need work.     |
| Journaling (`JournalList`, `JournalEditor`)                     |           3.50 | strong     | Good hierarchy, mixed component styles.                              |
| Meetings (`MeetingFinder`, `MeetingDetail`, `FavoriteMeetings`) |           3.29 | needs-work | Functional but less premium and less cohesive than home/journal.     |
| Auth + onboarding                                               |           3.43 | needs-work | Clear flow, style cohesion not fully aligned with home polish level. |
| Profile + sponsor + settings                                    |           3.15 | needs-work | Most visible consistency drift and route-contract gaps.              |

## Phased Roadmap

### Phase 1: Foundation Alignment

Objective: lock one design-system direction and remove architecture ambiguity.

- Choose canonical token/theming source for production screens.
- Publish deprecation map for alternate token imports.
- Resolve route contract mismatch (`ShareEntries`).
- Add repeatable architecture checks (`npm run audit:uiux`).

Exit criteria:

- Decision record merged.
- Token drift visible in CI/local audit output.
- Navigation type/linking/registration mismatch resolved.

### Phase 2: Flagship Flow Polish

Objective: increase quality in highest-frequency and highest-risk journeys.

- Home, Journal, Emergency, Auth, Meetings polished to one visual language.
- Shared loading/empty/error choreography.
- Shared motion choreography templates.
- Accessibility pass for labels/roles/hints/touch targets.

Exit criteria:

- Flagship routes average >= 4.2 weighted score.
- No critical a11y findings on emergency/auth routes.

### Phase 3: Surface Harmonization

Objective: bring all remaining routes to premium baseline.

- Apply standards to sponsor/settings/progress/edge routes.
- Collapse duplicate UI implementations (for example DailyReading variants).
- Reduce design-system API ambiguity by deprecating overlap.

Exit criteria:

- All routes >= 3.5 weighted score.
- No open high-severity consistency issues.

### Phase 4: Governance

Objective: preserve quality and prevent drift regressions.

- Add UI/UX checklist to PR process.
- Run monthly route-rubric review against inventory.
- Keep docs synchronized to shipped screens.

Exit criteria:

- Review process is repeatable and enforced.
- Documentation does not represent non-existent shipped states.

## Prioritized Implementation Queue

The authoritative backlog is maintained in `src/design-system/review/backlog.ts`.

Highest-priority items:

1. `UX-001` Unify token source-of-truth.
2. `UX-002` Align docs with shipped screens.
3. `UX-005` Collapse duplicate DailyReading implementations.
4. `UX-006` Standardize minimum touch target policy.
5. `UX-008` Align motion language across stacks.

## New Engineering Interfaces Added

- `src/design-system/review/types.ts`
- `src/design-system/review/rubric.ts`
- `src/design-system/review/screen-inventory.ts`
- `src/design-system/review/backlog.ts`
- `src/design-system/review/roadmap.ts`
- `src/design-system/review/index.ts`
- `scripts/audit-uiux.js`

Verification:

- `npm run test:uiux-review`
- `npm run audit:uiux`
