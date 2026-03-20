# Steps to Recovery — Pre-PR Verification Checklist

Use this checklist before committing, opening a pull request, or merging.
Copy it into your PR description or print it for desk reference.

---

## Pre-Commit Verification

Complete every item before creating a commit.

- [ ] **Node version correct** — run `nvm use` to activate `.nvmrc` (v20.19.4)
- [ ] **Dependencies installed** — run `npm ci` from the repo root
- [ ] **Lint passes** — `npm run lint` (zero warnings in CI-blocking rules)
- [ ] **Type-check passes** — `npm run type-check` (zero TypeScript errors)
- [ ] **Tests pass** — `npm test` (all suites green)
- [ ] **No `console.log` statements** — use `logger` from `utils/logger.ts` instead
- [ ] **No `any` types** — strict TypeScript enforced; use `unknown` + type guards
- [ ] **Sensitive data encrypted** — `encryptContent()` used before any SQLite/Supabase write (if applicable)
- [ ] **Keys not in AsyncStorage** — encryption keys and tokens stored only in SecureStore
- [ ] **Sync queue updated** — `addToSyncQueue()` / `addDeleteToSyncQueue()` called for every DB mutation
- [ ] **Accessibility props present** — `accessibilityLabel`, `accessibilityRole`, `accessibilityState` on all interactive elements
- [ ] **Touch targets >= 48x48dp** — verify `minHeight`/`minWidth` on custom pressables
- [ ] **No secrets in source** — `.env`, credentials, or API keys not hardcoded

---

## Before Creating a PR

Complete every item before pushing and opening the pull request.

- [ ] **Full strict gate passes** — `npm run verify:strict`
  - Runs toolchain doctor, alias consistency check, lint, type-check, and tests
- [ ] **Encryption roundtrip verified** — if the feature stores sensitive data, run `cd apps/mobile && npm run test:encryption`
- [ ] **Doctor checks pass** — `npm run doctor:toolchain` and `npm run doctor:aliases`
- [ ] **No new TypeScript errors introduced** — diff `npx tsc --noEmit` output against main branch
- [ ] **No breaking changes introduced** — or documented with migration steps in the PR description
- [ ] **Feature works offline** — tested with airplane mode / network disabled (SQLite is source of truth)
- [ ] **Error states handled** — all async operations have try/catch with user-facing error messages
- [ ] **Loading states correct** — `accessibilityState={{ busy: true }}` while loading
- [ ] **PR title follows Conventional Commits** — e.g. `feat:`, `fix:`, `refactor:`, `test:`, `docs:`

---

## Before Merging a PR

Complete every item before approving the merge.

- [ ] **GitHub Actions all green** — CI pipeline (lint, type-check, tests, doctor checks) passes
- [ ] **Code review approved** — at least one reviewer has approved the PR
- [ ] **No unresolved review comments** — all feedback addressed or explicitly deferred
- [ ] **No TODO/FIXME in new code** — track debt in `.claude/issues/` or the Known Technical Debt table in `CLAUDE.md`
- [ ] **Secrets not committed** — `.env`, `credentials.json`, `*.key`, `*.pem` absent from diff
- [ ] **RLS policies verified** — if a new Supabase table was added, confirm `ENABLE ROW LEVEL SECURITY` + `auth.uid() = user_id` policy (see `CLAUDE.md > Supabase RLS Policies`)
- [ ] **Database migration included** — if schema changed, migration SQL is in `supabase/migrations/` or documented in PR
- [ ] **CHANGELOG updated** — entry added under `## [Unreleased]` in `CHANGELOG.md`
- [ ] **CLAUDE.md updated** — if a new pattern, architectural decision, or known issue was introduced

---

## Security-Specific Checklist

Run this additional list for any PR that touches encryption, auth, sync, or database code.

- [ ] `encryptContent()` called before every SQLite `INSERT` / `UPDATE` of sensitive columns
- [ ] `decryptContent()` called only at display time (never re-stored in plaintext)
- [ ] Encryption keys live only in `expo-secure-store` (via `secureStorage` adapter)
- [ ] No sensitive data passed to `logger.info` / `logger.error` (use `{ id }` not `{ content }`)
- [ ] Supabase `anon` key used (not `service_role` key) on the client
- [ ] RLS policy blocks cross-user reads — verified with a second test account
- [ ] Sync operations preserve end-to-end encryption (encrypted blob sent, not plaintext)

---

## Quick Command Reference

```bash
# Environment
nvm use                          # Activate pinned Node version
npm ci                           # Clean install dependencies

# Quality gates (run in order)
npm run doctor:toolchain         # Node/npm/workspace invariants
npm run doctor:aliases           # Alias map consistency
npm run lint                     # ESLint
npm run type-check               # TypeScript strict check
npm test                         # All tests

# Comprehensive (combines all of the above)
npm run verify:strict

# Encryption tests (run when touching encryption/sync/auth code)
cd apps/mobile && npm run test:encryption

# Environment validation
npm run validate-env

# Environment setup check
bash scripts/verify-setup.sh
```

---

## Remediation Quick Reference

| Symptom | Fix |
|---|---|
| Node version wrong | `nvm install 20.19.4 && nvm use` |
| npm version wrong | `npm install -g npm@11.8.0` |
| Missing `.env` | `cp apps/mobile/.env.example apps/mobile/.env` |
| Supabase URL invalid | Check format: `https://yourproject.supabase.co` |
| TypeScript errors | `cd apps/mobile && npx tsc --noEmit` for full list |
| ESLint errors | `npm run lint` — fix or add inline `// eslint-disable-next-line` with comment |
| Tests failing | `npm test -- --verbose` to identify failing suite |
| Husky hooks missing | `npm install && npx husky` from repo root |
| Encryption test fails | `cd apps/mobile && npm run test:encryption -- --verbose` |
| Sync queue growing | Check `SELECT * FROM sync_queue WHERE retry_count >= 3` |
