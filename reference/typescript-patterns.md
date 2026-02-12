# TypeScript Patterns for Steps to Recovery

> TypeScript ~5.9.3 strict mode patterns for React Native + Expo
> Source: https://www.typescriptlang.org/docs/handbook/intro.html

## Strict Mode Rules (Enforced)

```json
// tsconfig.json
{
  "strict": true,               // Enables all strict checks
  "noImplicitAny": true,        // No implicit `any`
  "strictNullChecks": true,     // null/undefined are distinct types
  "strictFunctionTypes": true,  // Strict function parameter checking
  "noUnusedLocals": false,      // Allow unused locals (dev convenience)
  "noUnusedParameters": false   // Allow unused params (dev convenience)
}
```

## Required Patterns

### 1. Explicit Return Types
```typescript
// ✅ CORRECT
export function calculateCleanDays(startDate: string): number {
  const start = new Date(startDate);
  return Math.floor((Date.now() - start.getTime()) / 86400000);
}

// ✅ CORRECT - async
export async function encryptContent(plaintext: string): Promise<string> {
  // ...
}

// ❌ WRONG - missing return type
export function calculateCleanDays(startDate: string) { ... }
```

### 2. No `any` — Use `unknown` + Type Guards
```typescript
// ✅ CORRECT
export function handleError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

// ✅ CORRECT - type guard
function isJournalEntry(obj: unknown): obj is JournalEntry {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'encrypted_body' in obj
  );
}

// ❌ WRONG
catch (error: any) { console.log(error.message); }
```

### 3. Component Props Interfaces
```typescript
// ✅ CORRECT
interface JournalCardProps {
  readonly entry: JournalEntry;
  readonly onPress: (id: string) => void;
  readonly isSelected?: boolean;
}

export function JournalCard({ entry, onPress, isSelected = false }: JournalCardProps): React.ReactElement {
  // ...
}

// ❌ WRONG - inline types or any
export function JournalCard(props: any) { ... }
```

### 4. Import Types Separately
```typescript
// ✅ CORRECT
import type { JournalEntry, CheckIn } from '@/types';
import { encryptContent } from '@/utils/encryption';

// ❌ WRONG - mixing type and value imports
import { JournalEntry, encryptContent } from '@/utils';
```

### 5. Discriminated Unions for State
```typescript
// ✅ CORRECT - for loading/error/success states
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// ✅ CORRECT - for check-in types
type CheckIn =
  | { type: 'morning'; intention: string; mood: number }
  | { type: 'evening'; reflection: string; mood: number; craving: number };
```

### 6. Branded Types for IDs
```typescript
// ✅ RECOMMENDED - prevents mixing IDs
type UserId = string & { readonly __brand: 'UserId' };
type EntryId = string & { readonly __brand: 'EntryId' };

function getEntry(entryId: EntryId): Promise<JournalEntry> { ... }

// Won't compile: getEntry(userId) — type mismatch
```

### 7. Const Assertions
```typescript
// ✅ CORRECT
export const MILESTONES = [1, 7, 14, 30, 60, 90, 180, 365] as const;
type Milestone = (typeof MILESTONES)[number]; // 1 | 7 | 14 | ...

export const CHECK_IN_TYPES = ['morning', 'evening'] as const;
type CheckInType = (typeof CHECK_IN_TYPES)[number]; // 'morning' | 'evening'
```

### 8. Utility Types
```typescript
// Partial for optional updates
type JournalUpdate = Partial<Pick<JournalEntry, 'title' | 'content' | 'mood'>>;

// Required for form validation
type RequiredCheckIn = Required<Pick<CheckIn, 'mood' | 'reflection'>>;

// Record for lookup maps
type StepQuestions = Record<number, readonly StepQuestion[]>;

// Extract/Exclude for union manipulation
type NonCrisisEvent = Exclude<AppEvent, { type: 'crisis' }>;
```

### 9. Generic Hooks Pattern
```typescript
// ✅ CORRECT - typed React Query hook
export function useEncryptedQuery<T>(
  queryKey: readonly string[],
  queryFn: () => Promise<T[]>,
  decryptField: keyof T,
): UseQueryResult<T[]> {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const items = await queryFn();
      return Promise.all(
        items.map(async (item) => ({
          ...item,
          [decryptField]: await decryptContent(item[decryptField] as string),
        })),
      );
    },
  });
}
```

### 10. Zod Schema Validation
```typescript
import { z } from 'zod';

// ✅ CORRECT - runtime validation with type inference
const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  encryptedBody: z.string().min(1),
  mood: z.number().int().min(1).max(5),
  cravingLevel: z.number().int().min(0).max(10).optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
});

type JournalEntry = z.infer<typeof JournalEntrySchema>;
```

## React 19 Specific Patterns

### No useMemo/useCallback Needed (React Compiler)
```typescript
// React 19 with compiler — automatic memoization
// ✅ Just write normal code
function ExpensiveComponent({ items }: { items: Item[] }): React.ReactElement {
  const sorted = items.sort((a, b) => a.date.localeCompare(b.date));
  const filtered = sorted.filter(item => item.isActive);
  return <FlashList data={filtered} renderItem={renderItem} />;
}
```

### use() Hook (React 19)
```typescript
// ✅ New: use() can read promises and context
import { use } from 'react';

function JournalContent({ entryPromise }: { entryPromise: Promise<JournalEntry> }): React.ReactElement {
  const entry = use(entryPromise); // Suspends until resolved
  return <Text>{entry.title}</Text>;
}
```

---

## Anti-Patterns to Avoid

| Pattern | Why Bad | Fix |
|---------|---------|-----|
| `as any` | Defeats type safety | Use proper types or `unknown` |
| `// @ts-ignore` | Hides real errors | Fix the type error properly |
| `!` (non-null assertion) | Runtime crash risk | Use optional chaining `?.` or guard |
| Default exports | Breaks tree-shaking, harder refactor | Use named exports |
| `.then()` chains | Less readable than async/await | Use `async/await` |
| `Object` type | Too broad | Use `Record<string, unknown>` |
| `Function` type | No parameter types | Use specific function signature |
