# Security & Encryption Patterns — Steps to Recovery

> End-to-end encryption architecture and security reference.

## Encryption Architecture

```
User Input → encryptContent(plaintext) → AES-256-CBC encrypted blob → Store locally
                                                                        ↓
                                                                   addToSyncQueue()
                                                                        ↓
User Display ← decryptContent(blob) ← Read from SQLite ← Sync from Supabase (encrypted)
```

## AES-256-CBC Implementation

### Key Derivation
- Algorithm: PBKDF2 with SHA-256
- Salt: Unique per user (stored in SecureStore)
- Iterations: 100,000+
- Key length: 256 bits

### Encryption Format
```
IV:Ciphertext (Base64)
```
- Each encryption generates a unique 16-byte IV
- Prevents pattern analysis across entries

### Core Functions (src/utils/encryption.ts)

```typescript
// Encrypt sensitive data before storage
export async function encryptContent(plaintext: string): Promise<string>;

// Decrypt for display
export async function decryptContent(encrypted: string): Promise<string>;

// Key management
export async function generateEncryptionKey(): Promise<string>;
export async function getEncryptionKey(): Promise<string | null>;
```

## SecureStore Usage (src/adapters/secureStorage/)

### Platform Behavior
| Platform | Backend | Max Size |
|----------|---------|----------|
| iOS | Keychain | 2048 bytes |
| Android | Keystore | 2048 bytes |
| Web | IndexedDB (encrypted with session token) | No limit |

### Keys Stored
- `encryption_key` — Master encryption key
- `session_token` — Supabase auth session
- `biometric_enabled` — Biometric lock preference

### Web Fallback Pattern
```typescript
import { Platform } from 'react-native';

const secureGet = Platform.OS === 'web'
  ? (key: string) => webSecureStorage.getItem(key)  // Encrypted IndexedDB
  : (key: string) => SecureStore.getItemAsync(key);  // Keychain/Keystore
```

## Sensitive Data Tables

| Table | Encrypted Fields | RLS Required |
|-------|-----------------|--------------|
| journal_entries | encrypted_body, encrypted_title | ✅ |
| daily_checkins | encrypted_intention, encrypted_reflection, encrypted_mood, encrypted_craving | ✅ |
| step_work | encrypted_responses | ✅ |
| sponsor_shared_entries | encrypted_content | ✅ |
| risky_contacts | phone_number, name | ✅ |

## Supabase RLS Policies

### Standard User Data Policy
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own data"
  ON table_name FOR ALL
  USING (auth.uid() = user_id);
```

### Sponsor Sharing Policy
```sql
CREATE POLICY "Sponsors can read shared entries"
  ON journal_entries FOR SELECT
  USING (
    id IN (
      SELECT entry_id FROM sponsor_shared_entries
      WHERE shared_with_id = auth.uid()
    )
  );
```

## Security Checklist (Every PR)

- [ ] All sensitive data encrypted with `encryptContent()` before storage
- [ ] Encryption keys stored in SecureStore only
- [ ] RLS policies on all new Supabase tables
- [ ] No `console.log()` with sensitive data — use `logger`
- [ ] Sync operations preserve encryption end-to-end
- [ ] Error messages don't expose internal structure
- [ ] Web fallbacks for SecureStore APIs
- [ ] GDPR: Data export includes all user data
- [ ] GDPR: Data deletion removes all user data

## Key Rotation Service (src/services/keyRotationService.ts)

- Periodic key rotation with re-encryption of all data
- Old key retained temporarily for decrypt-only
- Rotation triggers sync to cloud with new encryption

## Logout Cleanup

On logout, must clear:
1. Encryption keys from SecureStore
2. Session token from SecureStore
3. All local SQLite data
4. React Query cache
5. Zustand stores
6. Sync queue
