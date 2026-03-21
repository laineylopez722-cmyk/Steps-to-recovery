---
id: "REF-001"
title: "Offline mutations have no user-facing feedback toast"
category: "refactoring"
severity: "medium"
status: "fixed"
priority: "P2"
created: "2026-03-21"
updated: "2026-03-21"
fixed_date: "2026-03-21"
labels:
  - "offline"
  - "ux"
  - "toast"
  - "sync"
  - "tech-debt"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "M"
effort_hours: "4-6"
---

## Problem Statement

`useOfflineMutation` performs local SQLite writes and queues the operation for background sync.
However, it provides no user-facing feedback that:

1. The save was successful (even when offline)
2. The save will sync to the cloud when connectivity is restored

Without this feedback, users in offline mode (which is common during recovery — e.g., in a
meeting with no signal, at an in-patient facility) cannot tell whether their journal entry
or step work was actually saved. They may tap "Save" multiple times, creating duplicate entries.

This is listed in `CLAUDE.md` Known Technical Debt as "Toast notification for offline mutation"
with medium priority.

For a recovery app where users may be journaling during a craving episode, trust in data
persistence is especially important.

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | All users in offline mode (common scenario) |
| How often | Every time a write operation occurs while offline |
| Severity when triggered | User uncertainty about data persistence; potential duplicate entries |
| Workaround available | No — user has no way to confirm save without this feedback |

---

## Steps to Reproduce

1. Put device in airplane mode
2. Open the app (offline mode)
3. Write a journal entry and tap "Save"
4. Observe: No success indication; user cannot tell if save occurred

**Expected:** Toast or banner: "Saved locally. Will sync when you're back online."
**Actual:** No feedback shown

---

## Acceptance Criteria

- [ ] On successful offline write, a toast appears: "Saved. Will sync when online."
- [ ] On successful online write (synced immediately), a toast appears: "Saved and synced."
- [ ] Toast is non-blocking (does not require user dismissal)
- [ ] Toast is accessible: `accessibilityLiveRegion="polite"` so screen readers announce it
- [ ] Toast disappears automatically after 3 seconds
- [ ] Toast is not shown when the app is backgrounded (write happens silently)
- [ ] The toast component is reusable — used consistently across journal, step work, and check-in writes
- [ ] No TypeScript errors introduced (`npx tsc --noEmit` passes)
- [ ] Encryption tests still pass (`npm run test:encryption` in apps/mobile)

---

## Implementation Notes

- Location of the mutation: `apps/mobile/src/` — search for `useOfflineMutation` to find the file
- Check if a Toast/Snackbar component already exists in `apps/mobile/src/design-system/components/`
  before creating a new one
- If creating a new Toast component, follow the design system pattern in
  `apps/mobile/src/design-system/components/`
- The toast can be triggered via a Zustand store (to avoid prop drilling):
  ```typescript
  // apps/mobile/src/store/toastStore.ts
  interface ToastState {
    message: string | null;
    show: (message: string) => void;
    clear: () => void;
  }
  ```
- The SyncContext already knows whether the device is online — use `useSyncContext().isOnline`
  to determine which message to show
- Accessibility: use `accessibilityLiveRegion="polite"` on the Toast container so VoiceOver
  and TalkBack announce it without interrupting the user's current focus

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | M |
| Hours estimate | 4-6 hours |
| Confidence | medium |
| Rationale | Toast component creation or integration + state management + accessibility + tests across multiple write points |

---

## Blocked By

None.

---

## Related Documentation

- `CLAUDE.md` — "Known Technical Debt" table (useOfflineMutation.ts, medium priority)
- `apps/mobile/src/design-system/components/` — existing UI components to check for Toast
- `apps/mobile/src/contexts/SyncContext.tsx` — online/offline state
- `CLAUDE.md` — "Accessibility Requirements" (live regions, touch targets)
