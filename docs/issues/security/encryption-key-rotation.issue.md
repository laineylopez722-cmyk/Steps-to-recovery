---
id: "SEC-002"
title: "Encryption key rotation procedure is not documented or automated"
category: "security"
severity: "high"
status: "fixed"
priority: "P1"
created: "2026-03-21"
updated: "2026-03-21"
fixed_date: "2026-03-21"
labels:
  - "encryption"
  - "key-management"
  - "security-operations"
  - "aes-256"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "L"
effort_hours: "8-16"
---

## Problem Statement

The app uses AES-256-CBC encryption with a key derived via PBKDF2 and stored in SecureStore.
If a user's encryption key is ever compromised (e.g., device stolen, SecureStore vulnerability,
or future security disclosure), there is no documented or automated procedure to:

1. Generate a new encryption key
2. Re-encrypt all locally stored data with the new key
3. Sync the re-encrypted data to Supabase
4. Invalidate and remove the old key

Without a key rotation path, a compromised key means all historical encrypted data is permanently
exposed and there is no recovery path short of the user losing all their data.

This is especially critical for a recovery app where journal entries and step work contain
highly sensitive personal information.

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | All users with existing encrypted data |
| How often | Not currently triggered — risk exists continuously |
| Severity when triggered | Complete exposure of all historical encrypted data if key compromised |
| Workaround available | No automated path — manual data deletion only |

---

## Steps to Reproduce

N/A — this is a missing feature, not a reproducible bug.

---

## Acceptance Criteria

- [ ] Key rotation procedure documented in `SECURITY.md` with step-by-step instructions
- [ ] `rotateEncryptionKey()` function implemented in `utils/encryption.ts`
  - Generates new key
  - Decrypts all local records with old key
  - Re-encrypts with new key
  - Saves new key to SecureStore
  - Queues re-encrypted records for sync
  - Deletes old key only after successful re-encryption of all records
- [ ] Progress feedback shown to user during rotation (can take seconds on large datasets)
- [ ] Rotation is atomic — if it fails partway, old key remains valid and data is not corrupted
- [ ] Rotation function has unit tests covering: success path, partial failure recovery, large datasets
- [ ] User can trigger rotation from Settings screen (Settings > Security > Rotate Encryption Key)
- [ ] Encryption tests still pass (`npm run test:encryption` in apps/mobile)

---

## Implementation Notes

- Current key storage: `apps/mobile/src/adapters/secureStorage/` — platform-specific
- Current encryption: `apps/mobile/src/utils/encryption.ts` — AES-256-CBC with PBKDF2
- Rotation approach — read all encrypted records, decrypt, re-encrypt, write back:
  ```typescript
  export async function rotateEncryptionKey(db: StorageAdapter): Promise<void> {
    const oldKey = await secureStorage.getItemAsync('encryption_key');
    const newKey = generateNewKey();

    // Tables to rotate (all that store encrypted_* columns)
    const tables = ['journal_entries', 'step_work', 'daily_checkins', ...];

    // Re-encrypt each table's records
    for (const table of tables) {
      await rotateTableEncryption(db, table, oldKey, newKey);
    }

    // Only save new key after all records re-encrypted
    await secureStorage.setItemAsync('encryption_key', newKey);
    await deleteOldKey();
  }
  ```
- Risk: If the process is interrupted mid-way, records encrypted with both keys will exist.
  Handle by keeping old key until all records are confirmed re-encrypted.
- Web platform: key is stored differently (IndexedDB encrypted with session token) — the
  rotation procedure must handle both platforms
- Performance: For large datasets, run re-encryption in batches of 50 records with progress updates

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | L |
| Hours estimate | 8-16 hours |
| Confidence | medium |
| Rationale | Core implementation is straightforward but edge cases (partial failure, both platforms, large datasets) add significant complexity |

---

## Blocked By

None.

---

## Related Documentation

- `apps/mobile/src/utils/encryption.ts` — current encryption implementation
- `apps/mobile/src/adapters/secureStorage/` — key storage abstraction
- `SECURITY.md` — security practices and audit history
- `CLAUDE.md` — "Encryption Implementation" and "Critical Security Patterns" sections
- `supabase-schema.sql` — table schemas for all encrypted columns
