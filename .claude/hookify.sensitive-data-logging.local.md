---
name: sensitive-data-logging
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.(ts|tsx|js|jsx)$
  - field: new_text
    operator: regex_match
    pattern: console\.(log|error|warn|info)\(.*?(password|key|token|secret|credential|encryption|API_KEY|PRIVATE_KEY)
---

🔒 **SECURITY WARNING: Sensitive Data Logging**

You're adding console.log that might expose sensitive data (passwords, keys, tokens, credentials).

**Why this is critical:**

- Sensitive data in console logs can leak to Sentry/monitoring services
- Never log encryption keys, API tokens, or session credentials
- This violates the privacy-first principle of the recovery app
- User trust is compromised if data exposure occurs

**What to do:**

- Use `logger.debug()` instead (auto-sanitizes in production)
- Only log sanitized metadata: `{ userId, entryId }` not `{ content, encryptionKey }`
- Remove before committing
- Check `.utils/logger.ts` for the safe logging utility

**Example:**

```typescript
// ❌ WRONG
console.log('Encryption key:', encryptionKey);
console.error('User data:', userData);

// ✅ CORRECT
import { logger } from '../utils/logger';
logger.debug('Encryption initialized', { userId });
logger.error('Database error', { errorCode: error.code });
```

See CLAUDE.md Security section for details.
