---
id: "CFG-006"
title: "Doctor scripts do not surface actionable fix instructions"
category: "configuration"
severity: "medium"
status: "fixed"
priority: "P2"
created: "2026-03-21"
updated: "2026-03-21"
fixed_date: "2026-03-21"
labels:
  - "dx"
  - "developer-experience"
  - "doctor"
  - "toolchain"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "S"
effort_hours: "2-4"
---

## Problem Statement

The `npm run doctor:toolchain` and `npm run doctor:aliases` scripts detect problems but report
them as bare pass/fail lines. When a check fails, the developer sees something like:

```
FAIL  Node version check
FAIL  Alias map: @/utils not found in jest.config.js
```

There is no explanation of what the correct value should be, which file to edit, or what
command to run to fix the problem. A developer encountering these failures for the first time
must then search CLAUDE.md, SETUP.md, or the doctor script source code itself to understand
what is expected and how to resolve it.

This issue is particularly painful for new contributors who trigger doctor failures during
setup and cannot proceed without understanding what "alias map not found in jest.config.js" means.

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | All developers, especially new contributors |
| How often | During setup and after pulling changes that modify config files |
| Severity when triggered | Blocks setup until manually diagnosed — 15-45 min |
| Workaround available | Yes — read the doctor script source to understand expected values |

---

## Steps to Reproduce

1. Introduce a deliberate alias mismatch (remove one alias from `jest.config.js`)
2. Run `npm run doctor:aliases`
3. Observe output: failure reported but no fix instruction shown

**Expected:** "FAIL Alias @/utils missing from jest.config.js. Add: '@/utils': '<rootDir>/src/utils/index.ts'"
**Actual:** "FAIL Alias map: @/utils not found in jest.config.js"

---

## Acceptance Criteria

- [ ] Every failing check outputs the expected value alongside the actual value
- [ ] Every failing check outputs the file path that needs to be changed
- [ ] Where a fix can be stated as a one-liner, the output includes it (e.g., "Add X to Y")
- [ ] Where a fix requires manual steps, the output links to the relevant CLAUDE.md section
- [ ] All checks still produce clean single-line output when passing
- [ ] Doctor exit code is non-zero when any check fails (for CI integration)
- [ ] No TypeScript errors introduced (`npx tsc --noEmit` passes)

---

## Implementation Notes

- Doctor scripts are likely in `scripts/` or under `apps/mobile/scripts/` — locate with:
  ```bash
  grep -r "doctor" package.json apps/mobile/package.json --include="*.json"
  ```
- Pattern to follow for actionable output:
  ```javascript
  function check(label, pass, actual, expected, fixHint) {
    if (pass) {
      console.log(`  PASS  ${label}`);
    } else {
      console.error(`  FAIL  ${label}`);
      console.error(`        Expected: ${expected}`);
      console.error(`        Actual:   ${actual}`);
      console.error(`        Fix:      ${fixHint}`);
    }
  }
  ```
- For the toolchain check, include the exact `nvm install X` command
- For alias checks, include the exact JSON or JS snippet to add

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | S |
| Hours estimate | 2-4 hours |
| Confidence | medium |
| Rationale | Need to read current doctor script implementation first, then enhance each check |

---

## Blocked By

CFG-004 (Node alignment) — doctor:toolchain should validate against `.nvmrc` once it exists.

---

## Related Documentation

- `CLAUDE.md` — Critical Commands table (`npm run doctor:toolchain`, `npm run doctor:aliases`)
- `CONTRIBUTING.md` — Setup and pre-commit requirements
- `SETUP.md` — Developer setup instructions
