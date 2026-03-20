---
id: "CFG-004"
title: "Node.js version misaligned across local, CI, and EAS"
category: "configuration"
severity: "high"
status: "open"
priority: "P1"
created: "2026-03-21"
updated: "2026-03-21"
labels:
  - "node"
  - "ci"
  - "eas"
  - "toolchain"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "S"
effort_hours: "1-3"
---

## Problem Statement

There is no `.nvmrc` file in the repository root. GitHub Actions workflows reference Node versions
via `node-version-file: '.nvmrc'` in some places but a hardcoded version string in others.
EAS build profiles specify Node independently. The result is that local development, CI runs,
and EAS builds may all use different Node versions, causing inconsistent behaviour such as:

- Native dependency build failures in CI that pass locally
- `package-lock.json` engine warnings that are silently ignored
- `npm ci` resolving differently depending on which npm version ships with the Node version used

The CLAUDE.md states "Node.js: >=20.0.0 required" but no pinned version is enforced.

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | All developers, CI pipeline, EAS builds |
| How often | Every CI run, every new developer machine setup |
| Severity when triggered | Intermittent native build failures; inconsistent `npm ci` output |
| Workaround available | Yes — manually install Node 20 via nvm or volta |

---

## Steps to Reproduce

1. Check workflows: `grep -r "node-version" .github/workflows/` — inconsistent values found
2. Check `apps/mobile/eas.json` for the `node` field under build profiles
3. Note absence of `.nvmrc` at the repository root
4. Observe that `npm run doctor:toolchain` may pass on Node 22 but fail on Node 18

**Expected:** A single `.nvmrc` authoritative source, all workflows deriving from it
**Actual:** Multiple independent Node version specifications that can diverge

---

## Acceptance Criteria

- [ ] `.nvmrc` created at repository root with pinned Node LTS version (20.x)
- [ ] All `.github/workflows/*.yml` files updated to use `node-version-file: '.nvmrc'`
- [ ] `apps/mobile/eas.json` build profiles updated to match the pinned version
- [ ] `engines.node` field in root `package.json` matches the pinned version
- [ ] `npm run doctor:toolchain` validates the running Node version against `.nvmrc`
- [ ] README or SETUP.md updated with `nvm use` instruction
- [ ] No TypeScript errors introduced (`npx tsc --noEmit` passes)

---

## Implementation Notes

- Pin to the current LTS: `20.19.4` (verify current LTS at nodejs.org before committing)
- `.nvmrc` format is just the version number on a single line: `20.19.4`
- For volta users, also update `package.json` `"volta": { "node": "20.19.4" }` if present
- EAS build field: under each profile in `eas.json`, add `"node": "20.19.4"`
- GitHub Actions snippet:
  ```yaml
  - uses: actions/setup-node@v4
    with:
      node-version-file: '.nvmrc'
      cache: 'npm'
  ```
- Affected workflows: `release.yml`, `eas-build.yml`, `e2e.yml`, `eslint.yml`, `bundle-analysis.yml`

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | S |
| Hours estimate | 1-3 hours |
| Confidence | high |
| Rationale | Mechanical change across known files; easy to verify with grep |

---

## Blocked By

None.

---

## Related Documentation

- `.github/workflows/release.yml` — current Node version reference (line ~49)
- `.github/workflows/eas-build.yml` — separate Node version reference
- `apps/mobile/eas.json` — EAS build Node version
- `CLAUDE.md` — "Node.js: >=20.0.0 required" in Development Notes
