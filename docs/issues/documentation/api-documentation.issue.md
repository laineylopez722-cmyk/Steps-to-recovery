---
id: "DOC-002"
title: "syncService and encryption utilities lack API documentation"
category: "documentation"
severity: "medium"
status: "open"
priority: "P2"
created: "2026-03-21"
updated: "2026-03-21"
labels:
  - "jsdoc"
  - "api-docs"
  - "encryption"
  - "sync"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "S"
effort_hours: "3-5"
---

## Problem Statement

The two most frequently used and security-critical utilities in the codebase have no JSDoc
comments:

1. **`apps/mobile/src/utils/encryption.ts`** — `encryptContent()` and `decryptContent()` are
   called in every feature that stores sensitive data. The functions have no documentation
   explaining: the encryption algorithm used, what the returned format looks like (IV:ciphertext),
   error conditions, or how to handle decryption failures gracefully.

2. **`apps/mobile/src/services/syncService.ts`** — `addToSyncQueue()` and `addDeleteToSyncQueue()`
   are called after every write operation. There is no documentation explaining: the difference
   between the two functions, why `addDeleteToSyncQueue` must be called BEFORE the DELETE SQL,
   what `table_name` values are accepted, or what happens if the sync queue insert fails.

Without this documentation, every new developer must read the full implementation to understand
how to call these functions correctly. This is especially risky for the sync functions where
calling them in the wrong order causes data integrity issues.

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | All developers implementing features that store or sync data |
| How often | Every new feature implementation |
| Severity when triggered | Incorrect usage causes data not syncing or sync failures |
| Workaround available | Yes — read the full source implementation |

---

## Steps to Reproduce

N/A — this is missing documentation, not a bug.

---

## Acceptance Criteria

- [ ] `encryption.ts` has JSDoc for `encryptContent()` including:
  - Algorithm: AES-256-CBC with PBKDF2 key derivation
  - Return format: `"IV_HEX:CIPHERTEXT_HEX"` (IV is unique per call)
  - `@throws` conditions: key not found in SecureStore, empty input
  - Usage example in the JSDoc
- [ ] `encryption.ts` has JSDoc for `decryptContent()` including:
  - Expected input format (must match `encryptContent` output)
  - `@throws` conditions: malformed input, wrong key, tampered data
  - Note: returns plaintext string, never the key
- [ ] `syncService.ts` has JSDoc for `addToSyncQueue()` including:
  - Parameters: db, table_name, record_id, operation ('insert' | 'update')
  - Side effect: writes a row to sync_queue table
  - When to call: immediately after INSERT or UPDATE SQL
- [ ] `syncService.ts` has JSDoc for `addDeleteToSyncQueue()` including:
  - CRITICAL ordering note: must be called BEFORE the DELETE SQL (captures supabase_id)
  - Parameters: db, table_name, record_id, userId
  - Why: captures the Supabase record ID before the local record is deleted
- [ ] All other exported functions in both files have at minimum a one-line JSDoc description
- [ ] No TypeScript errors introduced (`npx tsc --noEmit` passes)

---

## Implementation Notes

- Follow standard JSDoc format — TypeScript already provides types, so focus on behaviour:
  ```typescript
  /**
   * Encrypts a string using AES-256-CBC with a PBKDF2-derived key stored in SecureStore.
   *
   * The returned string has the format `IV_HEX:CIPHERTEXT_HEX` where the IV is randomly
   * generated for each call (preventing pattern analysis across identical inputs).
   *
   * @param content - The plaintext string to encrypt. Must be non-empty.
   * @returns A promise resolving to the encrypted string in `IV:CIPHERTEXT` format.
   * @throws If the encryption key is not found in SecureStore (user must re-onboard).
   * @throws If `content` is an empty string.
   *
   * @example
   * const encrypted = await encryptContent("User's journal entry");
   * // Returns: "a1b2c3...:d4e5f6..."
   */
  export async function encryptContent(content: string): Promise<string>
  ```
- For `addDeleteToSyncQueue`, the BEFORE-DELETE ordering is the most critical point to document
  clearly — consider adding a code example showing correct vs incorrect usage

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | S |
| Hours estimate | 3-5 hours |
| Confidence | high |
| Rationale | Documentation-only change; main effort is reading both files carefully to document accurate behaviour |

---

## Blocked By

None.

---

## Related Documentation

- `apps/mobile/src/utils/encryption.ts` — file to document
- `apps/mobile/src/services/syncService.ts` — file to document
- `CLAUDE.md` — "Sync Queue Usage" section (good source for syncService documentation)
- `CLAUDE.md` — "Critical Security Patterns" section (good source for encryption documentation)
