---
id: "CFG-002"
title: "npm run web script has circular/broken delegation"
category: "configuration"
severity: "critical"
status: "open"
priority: "P0"
created: "2026-03-21"
updated: "2026-03-21"
labels:
  - "npm-scripts"
  - "web"
  - "expo"
  - "monorepo"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "XS"
effort_hours: "0.5-1"
---

## Problem Statement

The root `package.json` `scripts.web` entry at line 37 has a circular or broken delegation.
Running `npm run web` from the repository root either:
- Calls itself recursively (circular delegation), resulting in an infinite loop and eventual
  stack overflow, or
- Delegates to a workspace script that does not exist or has incorrect arguments

This prevents any developer from starting the Expo web target using the documented command
(`npm run web`). The `apps/mobile` workspace likely has a working `web` script but it is not
correctly surfaced at the root level.

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | All developers trying to run the web target |
| How often | Every time `npm run web` is run from the repository root |
| Severity when triggered | Infinite loop or immediate error — web target completely inaccessible |
| Workaround available | Yes — run `cd apps/mobile && npm run web` directly |

---

## Steps to Reproduce

1. From the repository root, run: `npm run web`
2. Observe: infinite loop (script calls itself) or error like "script not found"
3. Ctrl+C to interrupt

**Expected:** Expo web dev server starts in `apps/mobile`
**Actual:** Circular delegation or error

---

## Acceptance Criteria

- [ ] `npm run web` from the repository root starts the Expo web server without error
- [ ] The script delegates correctly to `apps/mobile` workspace:
  ```json
  "web": "npm run web --workspace=apps/mobile"
  ```
- [ ] The delegated script in `apps/mobile/package.json` exists and runs `expo start --web`
- [ ] `CLAUDE.md` "Common Development Commands" section updated to confirm `npm run web` works
- [ ] No TypeScript errors introduced (`npx tsc --noEmit` passes)

---

## Implementation Notes

- Check root `package.json` line 37 (or search for the `web` script):
  ```bash
  grep -n '"web"' package.json
  ```
- Common cause: the root script was written as `"web": "npm run web"` (calls itself) instead of
  `"web": "npm run web --workspace=apps/mobile"`
- Verify `apps/mobile/package.json` has a `web` script:
  ```bash
  grep '"web"' apps/mobile/package.json
  ```
- If the `apps/mobile` `web` script is also missing, add it:
  ```json
  "web": "expo start --web"
  ```
- Consistent with the existing pattern used by `npm run mobile` and `npm run android`

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | XS |
| Hours estimate | 0.5-1 hour |
| Confidence | high |
| Rationale | One-line fix in package.json; straightforward to verify |

---

## Blocked By

None.

---

## Related Documentation

- `package.json` — root scripts (line ~37)
- `apps/mobile/package.json` — workspace scripts
- `CLAUDE.md` — "Common Development Commands" section
