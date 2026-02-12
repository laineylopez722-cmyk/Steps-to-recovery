# Privacy & Security Patterns Reference

> Security patterns for Steps to Recovery — a privacy-first recovery app
> All sensitive data MUST be encrypted. No exceptions.

## Encryption Architecture

### Algorithm: AES-256-CBC + HMAC-SHA256 (Encrypt-then-MAC)
```
Key Derivation: PBKDF2 (100,000 iterations, SHA-256)
Encryption: AES-256-CBC with unique IV per operation
Integrity: HMAC-SHA256 (encrypt-then-MAC pattern)
Format: IV:ciphertext:hmac (Base64 encoded, colon-separated)
```

### Key Storage
| Platform | Storage | Backing |
|----------|---------|---------|
| iOS | expo-secure-store | iOS Keychain (hardware-backed) |
| Android | expo-secure-store | Android Keystore (hardware-backed) |
| Web | IndexedDB (encrypted) | Session token-derived key |

### What Gets Encrypted
| Data Type | Table | Encrypted Fields |
|-----------|-------|-----------------|
| Journal entries | journal_entries | encrypted_body |
| Morning check-ins | daily_checkins | encrypted_intention, encrypted_mood |
| Evening check-ins | daily_checkins | encrypted_reflection, encrypted_mood, encrypted_craving |
| Step work answers | step_work | encrypted_answer |
| Safety plan | local only | encrypted via encryptContent() |
| Sponsor shared entries | sponsor_shared_entries | encrypted_content |

### What Is NOT Encrypted (Metadata)
- User IDs, timestamps, sync status
- Check-in type (morning/evening)
- Step numbers, question numbers
- Achievement types, milestone dates

---

## Supabase Row Level Security (RLS)

### Required Pattern for ALL Tables
```sql
-- 1. Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 2. User isolation policy
CREATE POLICY "Users own their data"
  ON table_name
  FOR ALL
  USING (auth.uid() = user_id);

-- 3. Optional: Sponsor read access
CREATE POLICY "Sponsors read shared entries"
  ON shared_entries
  FOR SELECT
  USING (
    shared_with_id = auth.uid()
    OR owner_id = auth.uid()
  );
```

### Tables Requiring RLS
- journal_entries ✅
- daily_checkins ✅
- step_work ✅
- favorite_meetings ✅
- reading_reflections ✅
- weekly_reports ✅
- sponsor_connections ✅
- sponsor_shared_entries ✅
- user_profile ✅
- achievements ✅

---

## Sync Queue Security

### Pattern: Encrypted at rest, encrypted in transit
```
Local Write (plaintext) 
  → encryptContent() 
  → Store encrypted in SQLite 
  → Add to sync_queue 
  → Background sync sends encrypted blob to Supabase
  → Supabase stores encrypted blob (server cannot read)
```

### Sync Order (Prevents FK Conflicts)
1. Process DELETE operations first
2. Then INSERT/UPDATE operations
3. Each with retry (3 attempts, exponential backoff)

---

## OWASP Mobile Top 10 Mitigations

| Risk | Mitigation in This App |
|------|----------------------|
| M1: Improper Credential Usage | SecureStore for tokens, PBKDF2 for key derivation |
| M2: Inadequate Supply Chain | npm audit, lockfile pinning, Codacy scanning |
| M3: Insecure Auth/Authz | Supabase Auth + RLS, biometric local auth |
| M4: Insufficient Input Validation | Zod schemas, prepared SQL statements |
| M5: Insecure Communication | TLS (Supabase enforces HTTPS), no plain HTTP |
| M6: Inadequate Privacy Controls | E2E encryption, no server-side decryption |
| M7: Insufficient Binary Protections | ProGuard (Android), code signing (both) |
| M8: Security Misconfiguration | Config plugins, no debug in production |
| M9: Insecure Data Storage | AES-256-CBC encryption, SecureStore for keys |
| M10: Insufficient Cryptography | Industry standard (AES-256, PBKDF2 100k iter) |

---

## Logging Security

```typescript
// ✅ CORRECT: Use sanitizing logger
import { logger } from '@/utils/logger';
logger.info('Entry saved', { entryId, userId });  // Only IDs

// ❌ WRONG: Never log sensitive content
console.log('Journal:', journalText);        // Plaintext content
console.log('Key:', encryptionKey);          // Encryption key
console.error('Auth token:', sessionToken);  // Auth credential
```

## Key Rotation
- Service: `apps/mobile/src/services/keyRotationService.ts`
- Pattern: Generate new key → re-encrypt all data → store new key in SecureStore → delete old key
- Trigger: User-initiated from Security Settings

---

## Sources
- apps/mobile/src/utils/encryption.ts
- apps/mobile/src/services/syncService.ts
- apps/mobile/src/adapters/secureStorage/
- SECURITY.md
- supabase-schema.sql
