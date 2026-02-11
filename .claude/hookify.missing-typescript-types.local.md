---
name: missing-typescript-types
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.(ts|tsx)$
  - field: new_text
    operator: regex_match
    pattern: (:\s*any|function\s+\w+\([^)]*\)\s*\{|=>\s*\{|interface.*any)
---

📘 **TypeScript Strict Mode Violation**

You're adding `any` type or missing return type annotation. CLAUDE.md requires strict TypeScript.

**Why this matters:**

- `any` disables type checking - introduces bugs
- No return types make code harder to understand and maintain
- This project enforces strict mode: NO `any` allowed

**What to do:**

1. Replace `any` with specific types
2. Add explicit return types to functions
3. Use `unknown` for errors, then type guard:

**Examples:**

```typescript
// ❌ WRONG
function processEntry(data: any) {
  return data.content;
}

// ✅ CORRECT
interface JournalEntry {
  id: string;
  content: string;
  encryptedBody: string;
}

function processEntry(data: JournalEntry): string {
  return data.content;
}

// Error handling
try {
  // ...
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Operation failed', error);
}
```

Run type check: `npx tsc --noEmit`
