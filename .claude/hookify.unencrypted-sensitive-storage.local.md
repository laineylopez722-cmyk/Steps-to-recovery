---
name: unencrypted-sensitive-storage
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.(ts|tsx)$
  - field: new_text
    operator: regex_match
    pattern: (AsyncStorage|localStorage|sessionStorage)\.setItem\(.*?(password|key|token|secret|credential|encryption|API_KEY|journal|entry|reflec)
---

🔒 **CRITICAL SECURITY: Unencrypted Sensitive Storage**

You're storing sensitive data in unencrypted storage (AsyncStorage/localStorage)!

**Why this is CRITICAL:**
- AsyncStorage is NOT secure - data is readable plaintext
- Encryption keys MUST be stored in SecureStore only
- User journal entries, check-ins, and step work MUST be encrypted before ANY storage
- This violates the encryption-first principle and OWASP standards

**What to do:**
1. **For encryption keys:** Use SecureStore only
   ```typescript
   import { secureStorage } from '../adapters/secureStorage';
   await secureStorage.setItemAsync('encryption_key', key);
   ```

2. **For sensitive data:** Encrypt FIRST, then store
   ```typescript
   import { encryptContent } from '../utils/encryption';
   const encrypted = await encryptContent(journalText);
   await db.runAsync('INSERT INTO journal_entries (encrypted_body) VALUES (?)', [encrypted]);
   ```

3. **For non-sensitive:** Only non-sensitive app state can use AsyncStorage
   - Theme preference, language, UI state only
   - NOT user data, NOT credentials

**Reference:** See CLAUDE.md "Critical Security Patterns" section.
