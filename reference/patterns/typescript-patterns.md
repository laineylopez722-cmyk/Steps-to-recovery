# TypeScript Patterns

## Component Props Interface

```typescript
interface ComponentNameProps {
  prop1: string;
  prop2: number;
  onAction?: () => void; // Optional callbacks
  children?: React.ReactNode; // For children
}

export function ComponentName({
  prop1,
  prop2,
  onAction,
  children,
}: ComponentNameProps): React.ReactElement {
  // Component implementation
}
```

## Hook Return Types

```typescript
interface UseFeatureReturn {
  data: DataType[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFeature(): UseFeatureReturn {
  // Hook implementation
}
```

## Error Handling with Type Guards

```typescript
try {
  const result = await someAsyncOperation();
  // Handle success
} catch (error) {
  // Type guard for Error objects
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Operation failed', error);
  setError(message);
} finally {
  setLoading(false);
}
```

## TypeScript Strict Mode Rules

- ✅ All functions MUST have explicit return types
- ✅ All component props MUST have TypeScript interfaces
- ✅ Use `unknown` for errors, then type guard
- ❌ NO `any` types allowed
- ❌ NO implicit returns
- ❌ NO default exports

```typescript
// ✅ CORRECT: Explicit types
export function saveEntry(content: string): Promise<void> {
  return db.runAsync('...');
}

// ❌ WRONG: No return type, any type
export function saveEntry(content: any) {
  return db.runAsync('...');
}
```

## Database Query Types

```typescript
// Define database row types
interface JournalEntry {
  id: string;
  user_id: string;
  encrypted_content: string;
  created_at: string;
  updated_at: string;
}

// Use with database queries
const entries = await db.getAllAsync<JournalEntry>(
  'SELECT * FROM journal_entries WHERE user_id = ?',
  [userId],
);
```

## TypeScript Checklist

- [ ] All functions have explicit return types
- [ ] All component props have interfaces
- [ ] No `any` types used
- [ ] Error handling uses type guards
- [ ] Named exports (no default exports)
- [ ] Database queries use typed interfaces
- [ ] Strict mode enabled in tsconfig.json
