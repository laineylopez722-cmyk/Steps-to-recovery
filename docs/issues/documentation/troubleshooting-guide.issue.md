---
id: "DOC-003"
title: "Troubleshooting guide does not cover all common failure modes"
category: "documentation"
severity: "medium"
status: "open"
priority: "P2"
created: "2026-03-21"
updated: "2026-03-21"
labels:
  - "troubleshooting"
  - "onboarding"
  - "debugging"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "S"
effort_hours: "2-4"
---

## Problem Statement

`CLAUDE.md` has a "Troubleshooting Common Issues" section that documents 4 scenarios:
- Encryption Key Missing
- Sync Queue Growing Indefinitely
- Web Database Not Persisting
- Geofencing Not Triggering

At least 8 additional failure modes are regularly encountered but not documented, leaving
developers to diagnose them from first principles:

1. Supabase RLS denial (returns empty array, not an error — easy to misdiagnose)
2. Expo Go cache stale after config changes (`npx expo start --clear` not obvious)
3. IndexedDB version conflict on web (schema mismatch between deployments)
4. React Query cache stale after database schema change (queries return old shape)
5. Android emulator not connecting to local Metro bundler (reverse port forwarding needed)
6. iOS simulator push notifications not working (requires physical device for production APNs)
7. SecureStore returning null after app reinstall (iOS Keychain persists by default)
8. Turbo cache serving stale output after dependency change

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | All developers encountering any of the 8 undocumented failure modes |
| How often | Each failure mode is encountered weekly across the team |
| Severity when triggered | 30-120 minutes of debugging time per undocumented scenario |
| Workaround available | Yes — always solvable, just undocumented |

---

## Steps to Reproduce

N/A — this is missing documentation, not a bug.

---

## Acceptance Criteria

- [ ] `CLAUDE.md` Troubleshooting section expanded with the 8 additional scenarios listed above
- [ ] Each new scenario follows the existing format: Symptom, Fix, Prevention, Debug command
- [ ] The Supabase RLS denial scenario explicitly notes the confusing "empty array not error" behaviour
- [ ] The iOS Keychain persistence scenario notes the `kSecAttrAccessibleAfterFirstUnlock` behaviour
- [ ] React Query cache invalidation scenario includes the `queryClient.clear()` command
- [ ] Android emulator port forwarding scenario includes the `adb reverse tcp:8081 tcp:8081` command
- [ ] Each scenario tested by at least one team member to confirm it resolves the issue

---

## Implementation Notes

- Expand directly in `CLAUDE.md` under the existing "Troubleshooting Common Issues" section
- Follow this exact format for each scenario (matches existing entries):
  ```markdown
  ### [Short Symptom Title]
  **Symptom**: [What the developer observes]
  **Fix**: [Exact steps or command to resolve]
  **Prevention**: [How to avoid this in the future]
  **Debug**: [Command to confirm the diagnosis]
  ```
- For the RLS denial scenario, include this note: Supabase client does not throw on RLS denial —
  it returns an empty array. Add `count: 'exact'` to queries to distinguish "no data" from "denied".
- For the Expo Go cache scenario: `npx expo start --clear` or delete `~/.expo/` (macOS)
- For IndexedDB version conflict: bump the `DB_VERSION` constant in the IndexedDB adapter

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | S |
| Hours estimate | 2-4 hours |
| Confidence | high |
| Rationale | Documentation-only change; content is well-known to the team and just needs writing down |

---

## Blocked By

None.

---

## Related Documentation

- `CLAUDE.md` — existing Troubleshooting section to expand
- `apps/mobile/src/adapters/storage/indexeddb.ts` — IndexedDB version handling
- `apps/mobile/src/adapters/secureStorage/` — SecureStore Keychain behaviour
