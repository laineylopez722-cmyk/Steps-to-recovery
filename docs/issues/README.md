# Issues Tracking System

A lightweight, file-based issue tracker for the Steps-to-Recovery codebase. Issues are discovered during audits, development, and code review — tracked here so nothing falls through the cracks.

---

## Quick Links

| Resource | Path |
|---|---|
| Master tracker | [_tracker.yaml](./_tracker.yaml) |
| Category definitions | [_categories.yaml](./_categories.yaml) |
| New issue template | [TEMPLATE.issue.md](./TEMPLATE.issue.md) |
| Configuration issues | [configuration/](./configuration/) |
| Security issues | [security/](./security/) |
| Database issues | [database/](./database/) |
| Documentation issues | [documentation/](./documentation/) |
| DX improvement issues | [dx-improvements/](./dx-improvements/) |
| Refactoring issues | [refactoring/](./refactoring/) |

---

## Folder Structure

```
.claude/issues/
├── README.md                          # This file — index and usage guide
├── _categories.yaml                   # Category taxonomy and severity matrix
├── _tracker.yaml                      # Master index of all open/in-progress issues
├── TEMPLATE.issue.md                  # Copy this when creating a new issue
│
├── configuration/                     # Environment, build, tooling, scripts
│   ├── env-validation.issue.md
│   ├── node-alignment.issue.md
│   └── doctor-scripts.issue.md
│
├── security/                          # Encryption, RLS, key storage, auth
│   ├── rls-policy-validation.issue.md
│   └── encryption-key-rotation.issue.md
│
├── database/                          # Schema, migrations, sync, queries
│   ├── drizzle-migrations.issue.md
│   └── sync-queue-edge-cases.issue.md
│
├── documentation/                     # Guides, API docs, examples
│   ├── feature-guides.issue.md
│   ├── api-documentation.issue.md
│   └── troubleshooting-guide.issue.md
│
├── dx-improvements/                   # Developer experience, tooling, CI/CD
│   ├── alias-validation.issue.md
│   └── test-setup-simplification.issue.md
│
└── refactoring/                       # Code quality, tech debt, performance
    ├── offline-mutation-toast.issue.md
    ├── motion-token-migration.issue.md
    └── analytics-event-sending.issue.md
```

---

## How to Add a New Issue

1. Copy `TEMPLATE.issue.md` to the appropriate category folder:
   ```bash
   cp .claude/issues/TEMPLATE.issue.md .claude/issues/configuration/my-issue.issue.md
   ```

2. Fill in the YAML frontmatter — every field matters:
   - `id` — follow the pattern `CAT-NNN` (e.g., `CFG-007`, `SEC-005`)
   - `severity` — see severity guide in `_categories.yaml`
   - `priority` — P0 (critical/block release) through P3 (nice-to-have)

3. Write a clear Problem Statement and concrete Acceptance Criteria.

4. Add the issue to `_tracker.yaml`:
   - Add to the appropriate category section under `issues:`
   - Add to the `by_priority` index
   - Update `metadata.total_issues` and status counts

5. Commit with a conventional commit message:
   ```
   docs(issues): add CFG-007 env validation issue
   ```

---

## Issue Template Explanation

Each `.issue.md` file has two parts:

**YAML Frontmatter** (between `---` delimiters) — machine-readable metadata:

| Field | Purpose |
|---|---|
| `id` | Unique identifier (`CAT-NNN`) |
| `title` | Short, specific, action-oriented title |
| `category` | One of the six categories in `_categories.yaml` |
| `severity` | `critical`, `high`, `medium`, or `low` |
| `status` | `open`, `in-progress`, `blocked`, `fixed`, or `deferred` |
| `priority` | `P0` through `P3` |
| `created` | ISO date when issue was first filed (`YYYY-MM-DD`) |
| `updated` | ISO date when issue was last changed |
| `labels` | Free-form tags for filtering |
| `assignee` | GitHub username or `unassigned` |
| `github_issue` | GitHub issue number if one exists, otherwise `null` |
| `blocked_by` | List of issue IDs this depends on |
| `effort` | T-shirt size: `XS`, `S`, `M`, `L`, `XL` |
| `effort_hours` | Estimated range in hours |

**Markdown Body** — human-readable detail:
- Problem Statement — what is broken or missing and why it matters
- Current Impact — who is affected and how severely
- Steps to Reproduce — exact steps (omit if not applicable)
- Acceptance Criteria — checklist of done conditions
- Implementation Notes — hints, references, gotchas
- Effort Estimate — T-shirt + hours + rationale
- Blocked By — any upstream dependencies
- Related Documentation — links to code, docs, GitHub

---

## Issue Lifecycle

```
open
 │
 ├──> in-progress   (someone is actively working on it)
 │        │
 │        ├──> fixed      (merged and verified)
 │        └──> blocked    (waiting on dependency or external factor)
 │                 │
 │                 └──> in-progress   (unblocked, resumed)
 │
 └──> deferred     (intentionally postponed — add deferral reason)
```

**Rules:**
- Only move to `fixed` after the fix is merged to `main` and verified.
- Add a `fixed_date` field when closing an issue.
- `deferred` requires a comment explaining why and a target revisit date.
- Do not delete issue files — they serve as a historical record.

---

## Status Management

| Status | Meaning | Who Changes It |
|---|---|---|
| `open` | Identified, not yet assigned | Anyone |
| `in-progress` | Actively being worked | Developer picking it up |
| `blocked` | Stalled on external factor | Developer hitting blocker |
| `fixed` | Merged and verified in `main` | Developer who merged |
| `deferred` | Intentionally postponed | Tech lead / team decision |

When you change status, always update the `updated` field, then regenerate the tracker summary blocks (`metadata.counts` and `by_status`) so they match the issue entries in `_tracker.yaml`.

### Tracker update checklist (required)

1. Edit the issue entry under `issues:` in `docs/issues/_tracker.yaml`.
2. Update `metadata.last_updated` to today's date (`YYYY-MM-DD`).
3. Recalculate:
   - `metadata.total_issues`
   - `metadata.counts.*`
   - `by_status.*.count`
   - `by_status.*.issues`
4. Run the validator:
   ```bash
   npm run check:issue-tracker
   ```
5. Commit only when validation passes.

---

## Integration with GitHub

**When to create a GitHub issue:**
- Severity is `critical` or `high` AND it needs cross-team visibility
- The issue requires a PR from an external contributor
- It is a bug report from a user or QA

**When to keep it only here:**
- Internal tech debt the team is already aware of
- Issues discovered during audit that will be addressed in planned sprints
- Documentation gaps with no external impact

**Template for converting to a GitHub issue:**
```markdown
## Context
Tracked internally as `[ISSUE-ID]` in `.claude/issues/[category]/[file].issue.md`.

## Problem
[Copy Problem Statement from issue file]

## Acceptance Criteria
[Copy Acceptance Criteria checklist from issue file]

## Effort Estimate
[Copy effort estimate]
```

---

## Reviewing and Closing Issues

When a fix is merged:

1. Update the issue file:
   ```yaml
   status: fixed
   updated: YYYY-MM-DD
   fixed_date: YYYY-MM-DD
   ```

2. Add a brief note at the bottom of the Markdown body:
   ```markdown
   ## Resolution
   Fixed in PR #NNN. [Brief description of what was done.]
   ```

3. Update `_tracker.yaml`:
   - Move the ID from `by_status.open` (or `in-progress`) to `by_status.fixed`
   - Decrement `metadata.counts.open` and increment `metadata.counts.fixed`

4. If there is a linked GitHub issue, close it with a reference to the PR.

---

## Monthly Review Process

On the first Monday of each month, run the following checks:

### 1. Find aging issues
```bash
# Issues open for more than 30 days (adjust date)
grep -r "status: open" .claude/issues/ --include="*.md" -l

# Issues in-progress for more than 14 days
grep -r "status: in-progress" .claude/issues/ --include="*.md" -l
```

### 2. Check for unresolved critical issues
```bash
grep -r "severity: critical" .claude/issues/ --include="*.md" -l | \
  xargs grep -l "status: open"
```

### 3. Update the tracker aging section
Review `.claude/issues/_tracker.yaml` under `aging:` and update dates.

### 4. Triage deferred issues
Review all `status: deferred` issues and decide: promote to `open`, extend deferral, or archive.

### 5. Review sprint capacity
Confirm `in-progress` issues are still actively worked. Move stalled items back to `open`.

---

## Running Validation

The release workflow (`release.yml`) will fail if any issue has `severity: critical` and `status: open`. To check locally before pushing:

```bash
# Check for open critical issues (will print filenames if any exist)
grep -r "severity: critical" .claude/issues/ --include="*.md" -l | \
  xargs grep -l "status: open" 2>/dev/null && \
  echo "WARNING: Open critical issues will block release" || \
  echo "No open critical issues — release gate will pass"
```

Use the tracker consistency validator to ensure summary blocks match the issue entries:

```bash
npm run check:issue-tracker
```

This command fails if:
- `metadata.total_issues` does not match the number of issues under `issues:`
- `metadata.counts.*` does not match issue statuses
- `by_status.*.count` or `by_status.*.issues` is stale or inconsistent

CI also runs this check in `.github/workflows/issue-tracker-validation.yml` for issue-tracker changes.

---

## Anti-Patterns to Avoid

- **Do not** use this system for feature requests — use GitHub Issues for those.
- **Do not** mark an issue `fixed` until the fix is merged to `main` (not just a branch).
- **Do not** create vague issues like "improve performance" — be specific about what, where, and why.
- **Do not** skip updating `_tracker.yaml` — it is the single source of truth for counts.
- **Do not** hard-delete issue files — move them to a `_archive/` folder if needed.
- **Do not** log sensitive data (encryption keys, tokens, user content) in issue descriptions.

---

## Related Documentation

| Document | Purpose |
|---|---|
| `CLAUDE.md` | Full development guide, patterns, security requirements |
| `.claude/CONFIGURATION-FIX-PLAN.md` | Source audit that generated the initial issue list |
| `SECURITY.md` | Security practices and audit history |
| `.github/workflows/release.yml` | Release pipeline with critical-issue quality gate |
| `CONTRIBUTING.md` | Git workflow, branch strategy, commit format |
