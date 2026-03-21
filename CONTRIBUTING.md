# Contributing to Steps to Recovery

Thanks for your interest in Steps to Recovery. This project is a privacy-first recovery companion app handling sensitive personal data. Please read this guide thoroughly before contributing — the security and quality requirements are non-negotiable.

---

## Before You Start

- Read [SETUP.md](SETUP.md) and complete the setup guide.
- Read [CLAUDE.md](CLAUDE.md) for the full architecture, security patterns, and code conventions.
- Read [SECURITY.md](SECURITY.md) for the security policy and reporting instructions.

---

## Branch Strategy

This repository uses a **single-branch strategy**. There is no `develop` branch.

| Branch | Purpose                                       |
| ------ | --------------------------------------------- |
| `main` | Production-ready code. All PRs target `main`. |

**Create a feature branch from `main` and open a PR back to `main`.**

```bash
git checkout main
git pull
git checkout -b feat/your-feature-name
# ... make changes ...
git push -u origin feat/your-feature-name
# Open a PR on GitHub targeting main
```

Branch naming conventions:

| Prefix      | Use for                                    |
| ----------- | ------------------------------------------ |
| `feat/`     | New features                               |
| `fix/`      | Bug fixes                                  |
| `refactor/` | Code restructuring without behavior change |
| `test/`     | Test additions or fixes                    |
| `docs/`     | Documentation only                         |
| `chore/`    | Tooling, dependency updates, config        |

---

## Commit Messages

This repo enforces **Conventional Commits** via [commitlint](https://commitlint.js.org/) (`commitlint.config.js` extends `@commitlint/config-conventional`).

### Format

```
<type>(<optional scope>): <short description>

<optional body>

<optional footer>
```

### Types

| Type       | When to use                                              |
| ---------- | -------------------------------------------------------- |
| `feat`     | A new feature visible to users                           |
| `fix`      | A bug fix                                                |
| `refactor` | Code change with no behavior change                      |
| `test`     | Adding or fixing tests                                   |
| `docs`     | Documentation-only changes                               |
| `chore`    | Tooling, build config, dependency bumps                  |
| `perf`     | Performance improvement                                  |
| `ci`       | Changes to CI/CD workflows                               |
| `security` | Security-critical changes (encryption, RLS, key storage) |

### Examples

```
feat(journal): add mood tracking to daily check-in

fix(sync): process deletes before inserts to avoid FK conflicts

test(encryption): add roundtrip test for decryptContent

security(auth): store encryption key in SecureStore instead of AsyncStorage

chore: bump expo-sqlite to 16.0.10
```

**Rules enforced by commitlint:**

- Subject line must not end with a period.
- Subject line must be lowercase after the colon.
- Body and footer are separated from the subject by a blank line.

---

## Pre-Commit Hooks

Husky manages Git hooks via the `.husky/` directory. The hooks run automatically when you commit.

### What the hooks do

**commit-msg**: Runs `commitlint` to validate the commit message format. The commit is rejected if the message does not follow Conventional Commits.

**pre-commit**: Runs `lint-staged` on staged files, which applies ESLint and Prettier to only the files you are committing. This keeps feedback fast — you are not waiting for the entire codebase to lint.

### When hooks legitimately fail

If a hook fails, fix the reported issue before committing again. Do not use `--no-verify` as a first resort — it skips the hooks entirely and bypasses quality gates.

```bash
# Correct approach: fix the issue
npm run lint          # See full lint output
npm run format        # Auto-fix formatting
git add .             # Re-stage the fixed files
git commit -m "..."   # Commit again — hooks run again
```

### Emergency bypass (use sparingly)

`git commit --no-verify` is permitted only in genuine emergencies (e.g., reverting a broken commit on `main` that is blocking the entire team). It must never be used to skip encryption or security checks. Bypassed commits should be followed immediately by a follow-up commit that fixes the underlying issue.

---

## TypeScript Strictness

The project runs TypeScript in strict mode (`tsconfig.json` sets `"strict": true`). The type checker runs in CI and blocks merges on any error.

**Rules:**

- No `any` types. Use `unknown` and add type guards.
- All functions must have explicit return types.
- All component props must have TypeScript interfaces.
- Handle `null` and `undefined` from database query results before using them.

```typescript
// Correct
interface JournalEntryProps {
  entryId: string;
  onSave: (content: string) => Promise<void>;
}

export function JournalEntry({ entryId, onSave }: JournalEntryProps): React.ReactElement {
  // ...
}

// Wrong — never use any
export function JournalEntry({ entryId, onSave }: any) {
  // ...
}
```

**Type checking:**

```bash
# From the repo root:
npm run type-check

# From apps/mobile directly:
cd apps/mobile && npx tsc --noEmit
```

---

## ESLint Rules Overview

ESLint is configured in `apps/mobile/.eslintrc.js` (or `eslint.config.*`). Key rule categories:

| Category      | Key rules                                                                      |
| ------------- | ------------------------------------------------------------------------------ |
| TypeScript    | No `any`, explicit return types on exports                                     |
| React         | Hooks rules (exhaustive-deps), no deprecated APIs                              |
| Security      | No `console.log` (use `logger`), no hardcoded secrets                          |
| Accessibility | `@react-native-a11y` rules enforcing `accessibilityLabel`, `accessibilityRole` |
| Imports       | No unused imports, consistent ordering                                         |

Run ESLint:

```bash
# From the repo root:
npm run lint

# Mobile only:
cd apps/mobile && npx eslint src/
```

ESLint also runs in CI as a **SARIF security scan** (`.github/workflows/eslint.yml`) and uploads results to GitHub Security. Results appear in the **Security** tab of the repository.

---

## Code Standards

### Security (Non-Negotiable)

Every change that touches user data must follow these rules:

1. **Encrypt before storing.** Call `encryptContent()` from `src/utils/encryption.ts` before writing any sensitive field (journal content, mood ratings, intentions, reflections, check-in data) to SQLite or Supabase.

   ```typescript
   // Correct
   const encryptedBody = await encryptContent(journalText);
   await db.runAsync('INSERT INTO journal_entries (...) VALUES (?)', [encryptedBody]);

   // Wrong — never store plaintext
   await db.runAsync('INSERT INTO journal_entries (...) VALUES (?)', [journalText]);
   ```

2. **Keys in SecureStore only.** Never store encryption keys or session tokens in AsyncStorage, SQLite, or Supabase.

3. **Use `logger`, not `console`.** The logger at `src/utils/logger.ts` sanitizes output in production and forwards errors to Sentry without exposing sensitive data.

   ```typescript
   // Correct
   import { logger } from '@/utils/logger';
   logger.info('Entry saved', { entryId });

   // Wrong — never log sensitive content
   console.log('Saved entry:', journalText);
   ```

4. **Add writes to the sync queue.** After any SQLite insert or update, call `addToSyncQueue()`. Before any delete, call `addDeleteToSyncQueue()` first, then delete.

   ```typescript
   import { addToSyncQueue, addDeleteToSyncQueue } from '@/services/syncService';

   // Insert
   await db.runAsync('INSERT INTO journal_entries ...', [...]);
   await addToSyncQueue(db, 'journal_entries', entryId, 'insert');

   // Delete (queue BEFORE deleting to capture supabase_id)
   await addDeleteToSyncQueue(db, 'journal_entries', entryId, userId);
   await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [entryId]);
   ```

### Accessibility (Required)

All interactive components must include:

- `accessibilityLabel` — clear description of the element
- `accessibilityRole` — semantic role (`button`, `header`, `text`, etc.)
- `accessibilityState` — dynamic state (`{ disabled: isLoading }`, `{ checked: isSelected }`)
- `accessibilityHint` — additional guidance when the action is non-obvious
- Minimum touch target: `minHeight: 48, minWidth: 48`
- Color contrast ratio: 7:1 (WCAG AAA)

```typescript
<TouchableOpacity
  onPress={handleSave}
  disabled={isLoading}
  accessibilityLabel="Save journal entry"
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
  style={{ minHeight: 48, minWidth: 48 }}
>
  <Text>Save</Text>
</TouchableOpacity>
```

### Offline-First

All features must work without a network connection. SQLite is the source of truth; Supabase is a backup.

- Write to SQLite first, then queue for sync.
- Never block the UI on a network request.
- Test every new feature with airplane mode enabled.

### Error Handling

```typescript
try {
  const result = await someAsyncOperation();
  // handle success
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Operation failed', error);
  setError(message); // update UI state — do not use Alert.alert
} finally {
  setIsLoading(false); // always update loading state
}
```

---

## Testing Expectations

All changes require tests. The test suite must pass locally before opening a PR.

```bash
# Run all tests from the repo root:
npm test

# Run encryption tests (required after any crypto change):
cd apps/mobile && npm run test:encryption

# Run with coverage:
cd apps/mobile && npm run test:coverage
```

### Coverage targets

| Module                                    | Target |
| ----------------------------------------- | ------ |
| Encryption                                | 90%    |
| Sync service                              | 70%    |
| Feature hooks (e.g., `useJournalEntries`) | 90%    |
| Overall                                   | 75%    |

### Test patterns

**Hook testing** (React Native Testing Library):

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const { result } = renderHook(() => useJournalEntries(userId), {
  wrapper: createWrapper(),
});

await waitFor(() => expect(result.current.isLoading).toBe(false));
```

**Encryption roundtrip test** (required for any new encrypted field):

```typescript
it('encrypts and decrypts to the original value', async () => {
  const plaintext = 'Sensitive journal content';
  const encrypted = await encryptContent(plaintext);

  expect(encrypted).not.toBe(plaintext);
  expect(encrypted).toContain(':'); // IV:ciphertext format

  const decrypted = await decryptContent(encrypted);
  expect(decrypted).toBe(plaintext);
});
```

---

## Pre-PR Checklist

Before opening a pull request, verify:

- [ ] `npm run verify:strict` passes (runs doctor scripts, lint, type-check, and tests)
- [ ] `npm run test:encryption` passes if any crypto code changed
- [ ] All sensitive data is encrypted with `encryptContent()` before storage
- [ ] Keys stored only in SecureStore (never AsyncStorage)
- [ ] All writes are added to the sync queue
- [ ] No `console.log` or `console.error` with sensitive data (use `logger`)
- [ ] All interactive elements have `accessibilityLabel` and `accessibilityRole`
- [ ] Touch targets are at least 48x48dp
- [ ] Feature works in offline mode (airplane mode tested manually)
- [ ] TypeScript: no `any` types, all functions have explicit return types
- [ ] Error states handled gracefully (no raw `Alert.alert`, no exposed internals)

---

## Pull Request Process

### PR Template

When you open a PR, the template at `.github/pull_request_template.md` will pre-populate the description. Fill it in completely:

- **Summary**: What changed and why.
- **Tests**: Which tests were run. If E2E tests were not run, explain why.
- **Schema or encryption changes**: Call these out explicitly. Database schema changes require a corresponding Supabase SQL migration.
- **Security review**: If the change touches encryption, keys, RLS, or sync — note it.

### Review process

- PRs require at least one review before merging.
- The CI pipeline (`eas-build.yml`) must pass: lint, type-check, and tests all green.
- Security-critical changes (encryption, auth, sync, RLS) get additional review time.
- Reviewers focus on: correctness, security, accessibility, and offline behavior.

### After merge

- CI automatically triggers an EAS preview build on every push to `main`.
- Production releases require a `v*` tag (e.g., `git tag v1.2.0 && git push --tags`).
- See [.github/CI-CD.md](.github/CI-CD.md) for the full pipeline details.

---

## Related Documentation

| Document                                         | Purpose                                     |
| ------------------------------------------------ | ------------------------------------------- |
| [SETUP.md](SETUP.md)                             | First-time environment setup                |
| [CLAUDE.md](CLAUDE.md)                           | Full architecture, patterns, security rules |
| [SECURITY.md](SECURITY.md)                       | Security policy, vulnerability reporting    |
| [TESTING.md](TESTING.md)                         | Unit and integration test guide             |
| [.github/CI-CD.md](.github/CI-CD.md)             | CI/CD workflow documentation                |
| [.github/SECRETS.md](.github/SECRETS.md)         | GitHub Actions secrets reference            |
| [.github/E2E-TESTING.md](.github/E2E-TESTING.md) | Maestro E2E test setup and local runs       |
