# Security Fix Migration Guide

**Date**: 2026-02-09
**Commit**: Security audit fixes (Phase A)

## Summary of Changes

This document describes critical security fixes applied to the codebase and any required migration steps.

## Fixed Issues

### Issue 1: Chat Messages Column Naming Convention ✅ FIXED

**Problem**: The `chat_messages` table used column name `content` instead of the required `encrypted_content` convention from CLAUDE.md security standards.

**Fix Applied**:
- Updated schema in `useChatHistory.ts` (line 126)
- Updated schema in `db/client.ts` (line 150)
- Updated INSERT query (line 306)
- Updated SELECT query (line 367)
- Updated MessageRow interface (already correct at line 27)

**Migration Required**: YES (if existing chat data exists)

#### Migration SQL (Run if users have existing chat data):

```sql
-- Rename column to follow encryption-first naming convention
ALTER TABLE chat_messages RENAME COLUMN content TO encrypted_content;
```

**Note**: SQLite ALTER TABLE RENAME COLUMN is supported since SQLite 3.25.0 (2018). Expo uses SQLite 3.45+ so this is safe.

**Alternative (if ALTER not available)**:
```sql
-- Create new table with correct schema
CREATE TABLE chat_messages_new (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
);

-- Copy data
INSERT INTO chat_messages_new (id, conversation_id, role, encrypted_content, metadata, created_at)
SELECT id, conversation_id, role, content, metadata, created_at FROM chat_messages;

-- Drop old table and rename
DROP TABLE chat_messages;
ALTER TABLE chat_messages_new RENAME TO chat_messages;

-- Recreate index
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
```

---

### Issue 2: Console Logging with Sensitive Data ✅ FIXED

**Problem**: Multiple files used `console.error()` with raw error objects, risking sensitive data leakage (journal content, chat messages, step work answers, encryption keys in stack traces).

**Files Fixed**:
1. `useChatHistory.ts`: 10 instances (lines 134, 157, 222, 245, 268, 336, 370, 377, 402)
2. `useStepWork.ts`: 6 instances (lines 87, 125, 153, 182, 202, 387)
3. `useAIChat.ts`: 2 instances (lines 418, 522)
4. `JournalEditorScreen.tsx`: 2 instances (lines 143, 146)

**Fix Applied**:
- All `console.*` calls replaced with `logger.*` from `utils/logger.ts`
- Logger automatically sanitizes sensitive fields (encrypted_*, password, token, etc.)
- Error objects are now passed as second parameter (auto-sanitized)

**Migration Required**: NO (code-only fix)

---

### Issue 3: Missing RLS Policies Documentation ✅ FIXED

**Problem**: Chat tables lacked documentation about sync behavior and RLS requirements.

**Investigation Result**: Chat tables (`chat_conversations`, `chat_messages`) are **NOT** synced to Supabase. They are SQLite/IndexedDB-only for maximum privacy.

**Fix Applied**:
- Added security documentation to `useChatHistory.ts` header
- Added comment to `db/client.ts` schema: "SQLite-only, never synced to Supabase"
- NO RLS policies needed (chat data never leaves device)

**Migration Required**: NO (documentation-only)

---

## Verification Checklist

✅ All chat schemas use `encrypted_content` column name
✅ All queries reference `encrypted_content` (not `content`)
✅ Zero `console.*` calls in `src/features/` directory
✅ All error logging uses secure `logger` utility
✅ Chat tables documented as local-only (no sync)
✅ TypeScript compiles (no NEW errors introduced)

---

## Security Impact

**Before Fixes**:
- Column naming violated encryption-first convention (audit risk)
- Console logs could leak journal entries, chat messages, step work
- Unclear if chat data synced (potential RLS vulnerability)

**After Fixes**:
- All sensitive data clearly marked as encrypted in schema
- All error logging sanitized (no sensitive data leakage)
- Chat privacy model documented (SQLite-only, no cloud sync)

---

## Rollout Plan

1. **Development**: Apply fixes immediately (this commit)
2. **Testing**: Verify encryption still works, no data loss
3. **Production**:
   - Deploy schema change (column rename)
   - Monitor for migration errors
   - Verify logs no longer contain sensitive data

---

## Future Considerations

1. **Column Rename Migration**: Consider adding automatic migration in `runMigrations()` function
2. **Logger Enforcement**: Add ESLint rule to prevent console.* in features/
3. **RLS Policy Audit**: Run full audit on all Supabase tables (beyond chat)

---

## Related Files

- Security standards: `CLAUDE.md`
- Security audit: commit `af52224`
- Comprehensive plan: `C:\Users\h\.claude\plans\agent-swarm-results-comprehensive.md`
- Logger utility: `apps/mobile/src/utils/logger.ts`
