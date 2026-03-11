# Encryption Patterns

## Import Statements

```typescript
import { encryptContent, decryptContent } from '@/utils/encryption';
import { secureStorage } from '@/adapters/secureStorage';
```

## Encrypting Data Before Storage

```typescript
// Encrypt sensitive data before storing
const sensitiveData = "User's private journal entry";
const encryptedContent = await encryptContent(sensitiveData);

await db.runAsync(
  'INSERT INTO table_name (id, user_id, encrypted_content, created_at) VALUES (?, ?, ?, ?)',
  [id, userId, encryptedContent, new Date().toISOString()],
);
```

## Decrypting Data for Display

```typescript
// Decrypt data when reading from database
const entries = await db.getAllAsync<JournalEntry>(
  'SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC',
  [userId],
);

// Decrypt entries for display
const decryptedEntries = await Promise.all(
  entries.map(async (entry) => ({
    ...entry,
    content: await decryptContent(entry.encrypted_content),
  })),
);
```

## Key Storage (CRITICAL)

```typescript
// ✅ CORRECT: Use SecureStore for encryption keys
await secureStorage.setItemAsync('encryption_key', key);

// ❌ WRONG: Never use AsyncStorage for sensitive data
// await AsyncStorage.setItem('encryption_key', key); // NEVER DO THIS
```

## Security Checklist

- [ ] All sensitive data encrypted with `encryptContent()` before storage
- [ ] Encryption happens client-side BEFORE any network call
- [ ] Each encryption generates unique IV (handled automatically)
- [ ] Keys stored ONLY in SecureStore (never AsyncStorage, Redux, or plain text)
- [ ] Never log decrypted content or encryption keys
- [ ] Encrypted data is base64-encoded (handled automatically)
