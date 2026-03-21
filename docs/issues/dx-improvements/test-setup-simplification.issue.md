---
id: "DX-002"
title: "Test setup requires repetitive QueryClient wrapper boilerplate"
category: "dx-improvements"
severity: "medium"
status: "fixed"
priority: "P2"
created: "2026-03-21"
updated: "2026-03-21"
fixed_date: "2026-03-21"
labels:
  - "testing"
  - "react-query"
  - "boilerplate"
  - "test-utilities"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "S"
effort_hours: "2-3"
---

## Problem Statement

Every hook test file in the codebase duplicates the same `createWrapper()` function:

```typescript
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
```

This boilerplate appears in at minimum: `useJournalEntries.test.ts`, `useStepWork.test.ts`,
`useDailyCheckins.test.ts`, and is expected in every new hook test. The repetition means:

1. If the wrapper pattern needs to change (e.g., adding a new context provider), it must be
   updated in every test file
2. New test authors copy the wrong version of the wrapper (with stale options)
3. Test files are longer and harder to scan when the first 20 lines are infrastructure, not tests

`CLAUDE.md` documents this pattern in the "Writing Tests" section but does not note that it
should be centralised.

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | All developers writing hook tests |
| How often | Every new hook test file created |
| Severity when triggered | Minor — tests still work; just creates maintenance debt |
| Workaround available | Yes — copy the boilerplate from an existing test |

---

## Steps to Reproduce

N/A — this is a code quality issue, not a bug.

---

## Acceptance Criteria

- [ ] A shared `createTestWrapper()` utility is created at `apps/mobile/src/__tests__/utils/createTestWrapper.tsx`
- [ ] The utility accepts optional additional providers (e.g., for tests that need AuthContext mock)
- [ ] At least 3 existing test files are updated to use the shared utility
- [ ] New tests documented in `CLAUDE.md` "Writing Tests" section reference the shared utility
- [ ] The utility is exported from `apps/mobile/src/__tests__/utils/index.ts` for clean imports
- [ ] No TypeScript errors introduced (`npx tsc --noEmit` passes)
- [ ] All tests still pass after the refactor (`npm test` in apps/mobile)

---

## Implementation Notes

- Proposed utility location: `apps/mobile/src/__tests__/utils/createTestWrapper.tsx`
- Proposed implementation:
  ```typescript
  import React from 'react';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

  interface WrapperOptions {
    additionalProviders?: React.ComponentType<{ children: React.ReactNode }>[];
  }

  export function createTestWrapper(options: WrapperOptions = {}) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    return function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
      let wrapped = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

      // Wrap with additional providers in reverse order (innermost first)
      for (const Provider of [...(options.additionalProviders ?? [])].reverse()) {
        wrapped = <Provider>{wrapped}</Provider>;
      }

      return wrapped;
    };
  }
  ```
- Note `gcTime: 0` — important for tests to prevent stale cache between test cases
- Usage in test files:
  ```typescript
  import { createTestWrapper } from '@/__tests__/utils';
  const { result } = renderHook(() => useJournalEntries(userId), {
    wrapper: createTestWrapper(),
  });
  ```

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | S |
| Hours estimate | 2-3 hours |
| Confidence | high |
| Rationale | Implementation is straightforward; the effort is in updating existing test files and verifying nothing breaks |

---

## Blocked By

DX-001 (alias validation) — once aliases are confirmed consistent, the import path `@/__tests__/utils` will work reliably.

---

## Related Documentation

- `CLAUDE.md` — "Writing Tests" section, "Hook Testing Pattern"
- `apps/mobile/src/features/journal/hooks/__tests__/` — existing test files to refactor
- `apps/mobile/src/features/steps/hooks/__tests__/` — existing test files to refactor
