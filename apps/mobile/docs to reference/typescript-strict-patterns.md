# TypeScript Strict Patterns — Steps to Recovery

> TypeScript 5.9 strict mode patterns for this project.

## Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": false,
    "noUncheckedIndexedAccess": true
  }
}
```

## Enforced Rules

### 1. No `any` Type — Ever
```typescript
// ❌ WRONG
function processData(data: any): any { ... }

// ✅ CORRECT
function processData(data: unknown): ProcessedResult { ... }
function processData<T extends Record<string, unknown>>(data: T): ProcessedResult { ... }
```

### 2. Explicit Return Types on All Functions
```typescript
// ❌ WRONG
function getUser(id: string) { ... }
const handlePress = () => { ... }

// ✅ CORRECT
function getUser(id: string): Promise<User | null> { ... }
const handlePress = (): void => { ... }
```

### 3. Interface for All Component Props
```typescript
// ❌ WRONG
export function Card({ title, onPress }) { ... }

// ✅ CORRECT
interface CardProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}
export function Card({ title, onPress, disabled }: CardProps): React.ReactElement { ... }
```

### 4. Error Handling with Type Guards
```typescript
// ❌ WRONG
catch (error) {
  console.log(error.message);
}

// ✅ CORRECT
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Operation failed', { error: message });
}
```

### 5. Null Safety
```typescript
// ❌ WRONG
const user = getUser();
console.log(user.name); // May be null

// ✅ CORRECT
const user = getUser();
if (!user) {
  logger.warn('User not found');
  return null;
}
console.log(user.name);
```

### 6. Discriminated Unions for State
```typescript
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };
```

### 7. Branded Types for IDs
```typescript
type UserId = string & { readonly __brand: 'UserId' };
type EntryId = string & { readonly __brand: 'EntryId' };

function createUserId(id: string): UserId {
  return id as UserId;
}
```

### 8. Const Assertions for Literals
```typescript
const MILESTONES = [1, 7, 14, 30, 60, 90, 180, 365] as const;
type Milestone = (typeof MILESTONES)[number];
```

### 9. Utility Types
```typescript
// Pick specific fields
type JournalSummary = Pick<JournalEntry, 'id' | 'title' | 'created_at'>;

// Make all optional
type PartialUpdate = Partial<JournalEntry>;

// Readonly for immutable data
type ReadonlyEntry = Readonly<JournalEntry>;

// Record for maps
type StepProgress = Record<number, { completed: boolean; date: string }>;
```

### 10. Zod for Runtime Validation
```typescript
import { z } from 'zod';

const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  encrypted_body: z.string(),
  mood: z.number().int().min(1).max(5),
  created_at: z.string().datetime(),
});

type JournalEntry = z.infer<typeof JournalEntrySchema>;
```
