---
id: "DX-001"
title: "Import alias map inconsistent between tsconfig, Babel, and Jest"
category: "dx-improvements"
severity: "high"
status: "in-progress"
priority: "P1"
created: "2026-03-21"
updated: "2026-03-21"
labels:
  - "aliases"
  - "typescript"
  - "jest"
  - "babel"
  - "testing"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "S"
effort_hours: "2-4"
---

## Problem Statement

The project uses path aliases (e.g., `@/utils`, `@/components`, `@/contexts`) defined in three
separate configuration files that must be manually kept in sync:

1. `apps/mobile/tsconfig.json` — `compilerOptions.paths`
2. `apps/mobile/babel.config.js` — `module-resolver` plugin aliases
3. `apps/mobile/jest.config.js` — `moduleNameMapper` entries

The `npm run doctor:aliases` script was added to detect mismatches, but it runs as an opt-in
check, not a pre-commit requirement. In practice, aliases added to `tsconfig.json` for IDE
support are sometimes not added to `babel.config.js` (causing Expo bundler errors) or
`jest.config.js` (causing test-time import resolution failures).

The most common symptom is a test that passes when run from the IDE but fails in `npm test`
because the Jest alias map is missing an entry.

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | All developers who add new aliases or run tests |
| How often | Whenever a new alias is added or an alias is renamed |
| Severity when triggered | Tests fail with "Cannot find module '@/newAlias/...'" in Jest |
| Workaround available | Yes — add the alias to all three files manually |

---

## Steps to Reproduce

1. Add a new alias `@/hooks` to `tsconfig.json` compilerOptions.paths only
2. Use `import { useJournalEntries } from '@/hooks/useJournalEntries'` in a component
3. Run `npm run mobile` — works (Babel has existing `@/` alias that resolves)
4. Run `npm test` — fails: "Cannot find module '@/hooks/useJournalEntries'"

**Expected:** All three config files stay in sync automatically, or a pre-commit check enforces it
**Actual:** Mismatch only discovered when tests are run in CI

---

## Acceptance Criteria

- [ ] All alias entries in `tsconfig.json`, `babel.config.js`, and `jest.config.js` match exactly
- [ ] `npm run doctor:aliases` is added to the pre-commit hook so it runs before every commit
- [ ] `doctor:aliases` fails with a clear message listing which file is missing which alias
- [ ] Documentation in `CLAUDE.md` or `CONTRIBUTING.md` explains: "When adding a new alias, update all three files"
- [ ] No TypeScript errors introduced (`npx tsc --noEmit` passes)
- [ ] All existing tests pass (`npm test` in apps/mobile)

---

## Implementation Notes

- Run this to see the current state:
  ```bash
  npm run doctor:aliases 2>&1
  ```
- The three files to keep in sync:
  - `apps/mobile/tsconfig.json` — look under `compilerOptions.paths`
  - `apps/mobile/babel.config.js` — look under `plugins` > `module-resolver` > `alias`
  - `apps/mobile/jest.config.js` — look under `moduleNameMapper`
- Jest `moduleNameMapper` syntax differs from tsconfig paths — the doctor script must handle
  both the tsconfig format (`@/utils/*`) and Jest format (`^@/utils/(.*)$`)
- Pre-commit integration: add `npm run doctor:aliases` to `.husky/pre-commit` after the
  existing `npx lint-staged` call

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | S |
| Hours estimate | 2-4 hours |
| Confidence | high |
| Rationale | Fix is mechanical (align the three files); the pre-commit integration and doctor improvement are the main work |

---

## Blocked By

None.

---

## Related Documentation

- `apps/mobile/tsconfig.json` — TypeScript alias definitions
- `apps/mobile/babel.config.js` — Babel module-resolver aliases
- `apps/mobile/jest.config.js` — Jest moduleNameMapper
- `CLAUDE.md` — Critical Commands table (`npm run doctor:aliases`)
