# Security Issues & Vulnerabilities

**Priority**: CRITICAL  
**Review Date**: 2026-02-06

---

## 🔴 Critical Security Issues (Fix Immediately)

### 1. Console.log Usage Leaks Sensitive Data

**Severity**: CRITICAL  
**Risk**: Sensitive data exposure in production logs  
**Files Affected**:
- `apps/mobile/src/adapters/secureStorage/native.ts`

**Details**:
```typescript
// Line 36, 44, 56, 61 - Direct console.error/warn usage
console.error(`[SecureStorage] Failed to get item "${key}":`, error);
console.warn('[SecureStorage] Keystore unavailable - user may need to re-authenticate');
console.error(`[SecureStorage] Failed to set item "${key}":`, error);
console.error(`[SecureStorage] Failed to delete item "${key}":`, error);
```

**Why This Is Dangerous**:
- Production logs may contain error objects with sensitive data
- Error messages could reveal encryption key names, user IDs, or database structure
- Logs may be accessible to third parties (crash reporting, analytics)

**Recommended Fix**:
```typescript
// Replace ALL console.* with logger.* from utils/logger.ts
import { logger } from '../../utils/logger';

// Before:
console.error(`[SecureStorage] Failed to get item "${key}":`, error);

// After:
logger.error('SecureStorage failed to get item', error);  // logger sanitizes automatically
```

**Action Items**:
- [ ] Replace 4 instances in `native.ts` with `logger.error/warn`
- [ ] Grep entire codebase for `console\.(log|error|warn|info)` and verify all are in comments/examples only
- [ ] Add ESLint rule to prevent console usage: `"no-console": ["error", { allow: [] }]`

---

### 2. AsyncStorage Used for Supabase Session on Web

**Severity**: HIGH (Inherent Platform Limitation)  
**Risk**: Session token stored unencrypted in localStorage on web  
**Files Affected**:
- `apps/mobile/src/lib/supabase.ts` (lines 46, 55, 59)

**Details**:
```typescript
// Web platform MUST use AsyncStorage - SecureStore not available
if (Platform.OS === 'web') {
  return AsyncStorage.getItem(key);  // Stores in localStorage (not encrypted)
}
```

**Why This Is a Risk**:
- Web localStorage is accessible to any JavaScript on the page (XSS vulnerability)
- Browser extensions can read localStorage
- If user's machine is compromised, session tokens are visible

**Mitigation Status**: ✅ PARTIALLY MITIGATED
- This is a **known limitation** documented in comments
- Supabase uses short-lived JWT tokens (reduces risk window)
- Web encryption keys ARE protected (stored in IndexedDB with Web Crypto API)

**Recommended Improvements**:
1. Document this limitation in `SECURITY.md`:
   ```markdown
   ## Web Platform Security Limitations
   
   **Session Token Storage**: Web platform stores Supabase session tokens in 
   browser localStorage (unencrypted) due to SecureStore unavailability. 
   
   **Mitigation**:
   - Tokens are short-lived JWTs (1 hour expiry)
   - Sensitive user data (journal entries, step work) remains encrypted
   - Recommend using mobile app for maximum security
   ```

2. Add warning in web app UI:
   ```typescript
   // Show banner on first web login
   "For maximum privacy, we recommend using our mobile app. 
    Web browsers cannot provide the same level of security for your data."
   ```

3. Consider HttpOnly cookies for web sessions (requires backend changes)

**Action Items**:
- [ ] Add web security limitations to `SECURITY.md`
- [ ] Display security warning on first web login
- [ ] Investigate HttpOnly cookie support in Supabase (future improvement)

---

### 3. Missing RLS Policy Tests

**Severity**: HIGH  
**Risk**: Row-Level Security policies could have logic errors allowing cross-user data access  
**Files Affected**:
- `supabase-schema.sql` (all RLS policies)
- No test files found for RLS policies

**Details**:
The app defines comprehensive RLS policies:
```sql
-- Example: Journal entries policy
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    (is_shared = true AND auth.uid() = ANY(shared_with))
  );
```

**Why This Is a Risk**:
- Complex policies (like sponsor sharing) could have logic errors
- Policy changes could inadvertently expose data
- No automated testing means bugs only found in production

**Recommended Fix**:
Create RLS policy test suite:

```typescript
// apps/mobile/src/services/__tests__/rlsPolicies.test.ts

import { supabase } from '../../lib/supabase';

describe('RLS Policy Tests', () => {
  let user1: { id: string; session: any };
  let user2: { id: string; session: any };

  beforeAll(async () => {
    // Create test users
    user1 = await createTestUser('user1@test.com');
    user2 = await createTestUser('user2@test.com');
  });

  describe('Journal Entries', () => {
    it('should NOT allow user2 to read user1 private entries', async () => {
      // Create entry as user1
      const { data: entry } = await supabase
        .from('journal_entries')
        .insert({ user_id: user1.id, content: 'private' })
        .select()
        .single();

      // Try to read as user2 (should fail)
      const { data, error } = await supabase
        .from('journal_entries')
        .select()
        .eq('id', entry.id);

      expect(data).toHaveLength(0);  // No results returned
    });

    it('should allow sponsor to read shared entries', async () => {
      // Test shared_with sponsor access
      // ...
    });
  });

  // More tests for step_work, sponsorships, etc.
});
```

**Action Items**:
- [ ] Set up Supabase test project or use local Supabase instance
- [ ] Write RLS policy tests for all tables
- [ ] Add to CI/CD pipeline
- [ ] Document test setup in `TESTING.md`

---

## 🟡 High-Priority Security Issues

### 4. Web Encryption Master Key Derivation

**Severity**: MEDIUM (Already Fixed, Document for Audit)  
**Risk**: Previous implementation used hardcoded master key on web  
**Files Affected**:
- `apps/mobile/src/adapters/secureStorage/web.ts`

**Status**: ✅ FIXED (as of recent commit)
- Now derives master key from per-user seed (stored in IndexedDB)
- Uses PBKDF2 with random salt (100,000 iterations)
- Legacy key migration path for existing users

**Details**:
```typescript
// PREVIOUS (VULNERABLE):
const masterKey = await deriveKeyFrom('hardcoded-string');

// CURRENT (SECURE):
const seed = await this.getKeySeed();  // Random per-user seed
const masterKey = await window.crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 100000 },
  seedKeyMaterial,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

**Verification**:
- ✅ Per-user seed generated on first login
- ✅ Salt stored per-user (prevents rainbow table attacks)
- ✅ Legacy key migration for existing users
- ✅ Session-based initialization (keys cleared on logout)

**Action Items**:
- [x] Verify fix is deployed (DONE)
- [ ] Document in security audit log
- [ ] Add test coverage for key derivation

---

### 5. Potential Timing Attack in MAC Comparison

**Severity**: LOW (Already Mitigated)  
**Risk**: Timing attacks could leak information about expected MAC  
**Files Affected**:
- `apps/mobile/src/utils/encryption.ts`

**Status**: ✅ MITIGATED
```typescript
// Constant-time string comparison implemented
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
```

**Verification**:
- ✅ Used in `decryptContent()` for MAC validation
- ✅ Properly implements constant-time comparison
- ✅ Test coverage exists in `encryption.test.ts`

**No Action Required** - This is exemplary security practice.

---

### 6. Error Messages May Leak Database Structure

**Severity**: MEDIUM  
**Risk**: Error messages could reveal table names, column names, or query structure  
**Files Affected**:
- `apps/mobile/src/services/syncService.ts`
- Various feature hooks

**Example**:
```typescript
// Potentially revealing error
throw new Error(`Failed to sync journal_entries table: ${error.message}`);
```

**Recommended Fix**:
```typescript
// Sanitized error for user display
throw new Error('Failed to sync data. Please try again later.');

// Detailed error for debugging (sanitized by logger)
logger.error('Sync failed for table', { table: 'journal_entries', error });
```

**Action Items**:
- [ ] Audit all error messages for information disclosure
- [ ] Replace detailed errors with user-friendly messages
- [ ] Use logger for debugging details (auto-sanitized)

---

## 🟢 Security Best Practices (Already Implemented)

### ✅ Encryption Implementation
- **Algorithm**: AES-256-CBC (industry standard)
- **MAC**: HMAC-SHA256 (encrypt-then-MAC pattern)
- **IV**: Unique random IV per encryption
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Constant-Time Comparison**: Prevents timing attacks

### ✅ Key Storage
- **Mobile**: SecureStore (iOS Keychain, Android Keystore)
- **Web**: IndexedDB encrypted with Web Crypto API
- **Never**: AsyncStorage for encryption keys (only used for Supabase session on web)

### ✅ Row-Level Security
- All Supabase tables have RLS enabled
- Policies filter by `auth.uid() = user_id`
- Sponsor sharing has proper access controls

### ✅ Logout Cleanup
- `logoutCleanup.ts` properly clears:
  - Encryption keys (SecureStore)
  - Session data (Supabase)
  - Local database (SQLite/IndexedDB)

### ✅ Logger Sanitization
- `utils/logger.ts` automatically redacts:
  - Passwords, tokens, keys
  - Email addresses
  - Session IDs
  - Encrypted content

---

## Security Checklist for Production Launch

### Before Launch (P0):
- [ ] Fix console.log usage (4 instances)
- [ ] Verify daily check-in migration applied to Supabase
- [ ] Add RLS policy tests (at minimum for journal_entries, step_work)
- [ ] Document web security limitations in SECURITY.md
- [ ] Add security warning for web users

### Before Scale (P1):
- [ ] Comprehensive RLS policy test coverage
- [ ] Security audit error messages for info disclosure
- [ ] Penetration testing (recommend hiring external firm)
- [ ] Bug bounty program setup

### Ongoing Monitoring:
- [ ] Set up Sentry for error tracking
- [ ] Monitor for suspicious auth patterns (brute force, session hijacking)
- [ ] Regular dependency updates (npm audit)
- [ ] Quarterly security reviews

---

## Encryption Audit Summary

**Overall Grade**: A-

**Strengths**:
- ✅ Industry-standard encryption (AES-256-CBC + HMAC)
- ✅ Proper key management (SecureStore)
- ✅ Excellent test coverage (80+ test cases)
- ✅ Constant-time MAC comparison
- ✅ Unique IV per encryption

**Minor Improvements**:
- Consider ChaCha20-Poly1305 (newer, faster, authenticated encryption)
- Add key rotation mechanism (for long-term users)
- Consider hardware-backed key storage on Android (TEE/StrongBox)

---

## RLS Policy Audit Summary

**Overall Grade**: B (Good Policies, No Tests)

**Defined Policies**:
- ✅ Profiles: User can only access own profile
- ✅ Journal Entries: User can access own OR entries shared with them as sponsor
- ✅ Step Work: User can only access own step work
- ✅ Sponsorships: User can access where they are sponsor OR sponsee

**Gaps**:
- ❌ No automated tests
- ❌ Complex policies (sponsor sharing) not verified
- ❌ No monitoring for policy violations

**Recommendation**: Add RLS tests before production launch (see section 3 above).

---

## Supabase Configuration Audit

**Anon Key Exposure**: ✅ SAFE
- Supabase anon key is safe to expose in client code
- All security enforced by RLS policies
- Anon key only grants row-level filtered access

**Project Configuration**:
- ✅ RLS enabled on all tables
- ✅ Auth configured with email/password
- ✅ Policies properly filter by `auth.uid()`

**Missing**:
- [ ] MFA configuration (recommend enabling for sensitive accounts)
- [ ] Rate limiting configuration (prevent brute force)
- [ ] IP allowlisting (if applicable for admin access)

---

## Final Security Recommendations

### Immediate (This Week):
1. **Fix console.log leaks** (4 instances in `native.ts`)
2. **Verify Supabase migration applied** (daily_checkins table)
3. **Document web security limitations** (AsyncStorage for session)

### Short-Term (Next 2 Weeks):
1. **Add RLS policy tests** (minimum: journal_entries, step_work)
2. **Security audit error messages** (prevent info disclosure)
3. **Add web security warning** (UI banner on first login)

### Long-Term (Next Quarter):
1. **External penetration testing** (hire security firm)
2. **Bug bounty program** (HackerOne, Bugcrowd)
3. **Key rotation mechanism** (for long-term users)
4. **MFA support** (Supabase supports TOTP)

---

**Bottom Line**: The app has a **strong security foundation** with excellent encryption and proper key management. The console.log usage is the only CRITICAL issue. RLS policy testing is HIGH priority but can wait until after MVP launch if documented as known limitation.
