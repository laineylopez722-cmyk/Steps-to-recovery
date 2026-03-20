---
# YAML Frontmatter — fill in every field before committing
# See _categories.yaml for allowed values for each field.

id: "CAT-NNN"                   # e.g. CFG-007, SEC-005, DB-002
title: "Short, specific, action-oriented title"
category: "configuration"       # configuration | security | database | documentation | dx-improvements | refactoring
severity: "medium"              # critical | high | medium | low
status: "open"                  # open | in-progress | blocked | fixed | deferred
priority: "P2"                  # P0 (release blocker) | P1 (current sprint) | P2 (next sprint) | P3 (backlog)
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
labels:                         # Free-form tags for filtering
  - "tag-one"
  - "tag-two"
assignee: "unassigned"          # GitHub username or 'unassigned'
github_issue: null              # GitHub issue number if one exists, otherwise null
blocked_by: []                  # List of issue IDs this depends on, e.g. [CFG-001, SEC-002]
effort: "M"                     # XS (<1h) | S (1-3h) | M (3-8h) | L (8-16h) | XL (>16h)
effort_hours: "3-8"             # Estimated range as a string, e.g. "3-8"

# Only set these when closing the issue:
# fixed_date: "YYYY-MM-DD"
# deferral_reason: "One-line reason for deferral"
# deferral_revisit: "YYYY-MM-DD"
---

## Problem Statement

> Describe what is broken or missing and why it matters. Be specific — name files, functions,
> tables, or workflow steps. A good problem statement answers: "What is wrong?" and "Why does it matter?"

[Describe the problem here.]

---

## Current Impact

> Who is affected, how severely, and how often?

| Dimension | Impact |
|---|---|
| Who is affected | [developers / end users / CI pipeline / etc.] |
| How often | [every commit / every build / daily / weekly / etc.] |
| Severity when triggered | [blocks work / slows work / minor annoyance] |
| Workaround available | [yes — describe it / no] |

---

## Steps to Reproduce

> Omit this section if the issue is not a bug (e.g., missing documentation).

1. [Step one]
2. [Step two]
3. [Observe the problem]

**Expected:** [What should happen]
**Actual:** [What actually happens]

---

## Acceptance Criteria

> These are the done conditions. Every item must be checkable — avoid vague criteria.

- [ ] [Specific, verifiable outcome one]
- [ ] [Specific, verifiable outcome two]
- [ ] [Tests added or updated to cover the change]
- [ ] [Documentation updated if applicable]
- [ ] No TypeScript errors introduced (`npx tsc --noEmit` passes)
- [ ] Encryption tests still pass (`npm run test:encryption` in apps/mobile)

---

## Implementation Notes

> Hints, references to relevant files, approach suggestions, and known gotchas.
> Do not write full implementation details here — just enough to unblock the person picking this up.

- Relevant file: `apps/mobile/src/[path/to/file].ts`
- Related pattern: See [pattern name] in `CLAUDE.md` under [section]
- Known gotcha: [Describe anything that is non-obvious]

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | [XS / S / M / L / XL] |
| Hours estimate | [N-M hours] |
| Confidence | [high / medium / low] |
| Rationale | [Brief reason for the estimate] |

---

## Blocked By

> List any issue IDs or external dependencies that must be resolved first.
> If none, write "None."

None.

---

## Related Documentation

> Links to relevant files, CLAUDE.md sections, external docs, or GitHub issues.

- [Relevant CLAUDE.md section or file reference]
- [Link to related issue if applicable]
