# Code Quality & Refactoring Opportunities

**Review Date**: 2026-02-06

---

## Overview

Overall code quality is **very good** with strong TypeScript usage, clear architecture, and consistent patterns. However, there are several opportunities for cleanup and refactoring.

**Overall Grade**: A-

---

## 🟡 High-Priority Refactoring

### 1. Duplicate Card Components

**Issue**: Multiple Card component implementations across the codebase  
**Impact**: Maintenance burden, inconsistent UI, bundle size bloat

**Files**:
- `apps/mobile/src/components/ui/Card.tsx` - RN Primitives-based card
- `apps/mobile/src/design-system/components/Card.tsx` - Custom design system card
- `apps/mobile/src/components/ui/legacy-card.tsx` - Old implementation

**Analysis**:
```bash
# Found 3 different Card implementations
- ui/Card.tsx: Uses @rn-primitives (shadcn-style)
- design-system/Card.tsx: Custom implementation with iOS styling
- ui/legacy-card.tsx: Deprecated component (still referenced?)
```

**Recommendation**:
1. Choose ONE card component as source of truth:
   - **Option A**: Use `design-system/Card.tsx` (custom, iOS-styled)
   - **Option B**: Use `ui/Card.tsx` (RN primitives, cross-platform)

2. Migrate all usages to chosen component
3. Delete unused implementations
4. Add deprecation warning to old components

**Migration Path**:
```typescript
// 1. Audit all Card usages
grep -r "import.*Card" apps/mobile/src/

// 2. Create migration script
// scripts/migrate-card-components.ts

// 3. Update all imports to use single source
// 4. Run tests to verify no breakage
// 5. Delete old files
```

**Action Items**:
- [ ] Decide on canonical Card component
- [ ] Create migration checklist
- [ ] Update all imports (estimate: 20-30 files)
- [ ] Delete duplicate implementations
- [ ] Update Storybook (if exists)

---

### 2. Inconsistent Error Handling Patterns

**Issue**: No consistent pattern for error handling across the codebase  
**Impact**: Difficult to debug, inconsistent UX, potential crashes

**Patterns Found**:

**Pattern 1: Throw errors**
```typescript
// utils/encryption.ts
if (!key) throw new Error('Encryption key not found');
```

**Pattern 2: Return null**
```typescript
// adapters/secureStorage/native.ts
async getItemAsync(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    return null;  // Silently fails
  }
}
```

**Pattern 3: Log and swallow**
```typescript
// Some components
try {
  await operation();
} catch (error) {
  logger.error('Operation failed', error);
  // No user feedback!
}
```

**Recommended Standard**:

```typescript
// For utility functions: Throw with specific error types
export class EncryptionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'EncryptionError';
  }
}

// For hooks: Return error state
export function useJournalEntries() {
  return useQuery({
    // ...
    onError: (error) => {
      logger.error('Failed to fetch entries', error);
      // React Query handles error state automatically
    }
  });
}

// For UI components: Show user-friendly error
const handleSave = async () => {
  try {
    await saveEntry();
  } catch (error) {
    const message = error instanceof EncryptionError
      ? 'Failed to save entry. Please check your encryption key.'
      : 'An unexpected error occurred. Please try again.';
    setError(message);  // Display to user
  }
};
```

**Action Items**:
- [ ] Define error handling standards in `CONTRIBUTING.md`
- [ ] Create custom error classes (`EncryptionError`, `SyncError`, `DatabaseError`)
- [ ] Refactor inconsistent patterns (estimate: 50+ files)
- [ ] Add error boundary for React components

---

### 3. Missing TypeScript Return Types

**Issue**: Some functions missing explicit return types  
**Impact**: Harder to refactor, type inference can be surprising

**Examples**:
```typescript
// ❌ Missing return type
async function decryptJournalEntry(entry: JournalEntry) {
  // TypeScript infers return type, but explicit is better
}

// ✅ Explicit return type
async function decryptJournalEntry(
  entry: JournalEntry
): Promise<JournalEntryDecrypted> {
  // Clear contract
}
```

**Action Items**:
- [ ] Enable `@typescript-eslint/explicit-function-return-type` rule
- [ ] Add return types to all exported functions
- [ ] Use `tsc --noEmit` to catch missing types

---

## 🟠 Medium-Priority Refactoring

### 4. Large Hook Files (Code Smell)

**Issue**: Some hooks are 500+ lines and handle multiple concerns  
**Files**:
- `features/home/hooks/useCheckIns.ts` - 468 lines
- `features/journal/hooks/useJournalEntries.ts` - 434 lines

**Recommendation**: Split into smaller, focused hooks

**Before**:
```typescript
// useCheckIns.ts - 468 lines
export function useTodayCheckIns() { /* ... */ }
export function useCreateCheckIn() { /* ... */ }
export function useUpdateCheckIn() { /* ... */ }
export function useDeleteCheckIn() { /* ... */ }
export function useStreak() { /* ... */ }
```

**After**:
```typescript
// features/home/hooks/checkIns/index.ts
export { useTodayCheckIns } from './useTodayCheckIns';
export { useCreateCheckIn } from './useCreateCheckIn';
export { useUpdateCheckIn } from './useUpdateCheckIn';
export { useDeleteCheckIn } from './useDeleteCheckIn';

// features/home/hooks/checkIns/useStreak.ts (separate concern)
export { useStreak } from './useStreak';
```

**Benefits**:
- Easier to test individual concerns
- Clearer separation of responsibilities
- Smaller file sizes (easier to review)

**Action Items**:
- [ ] Split large hook files (useCheckIns, useJournalEntries)
- [ ] Ensure no circular dependencies
- [ ] Update imports in consuming components

---

### 5. Magic Numbers and Hardcoded Values

**Issue**: Configuration values hardcoded throughout codebase  
**Impact**: Hard to change, easy to introduce inconsistencies

**Examples**:
```typescript
// syncService.ts
const NETWORK_TIMEOUT_MS = 30000;
const MAX_RETRY_COUNT = 3;
const BASE_BACKOFF_MS = 1000;

// useJournalEntries.ts
staleTime: 5 * 60 * 1000,  // 5 minutes
gcTime: 24 * 60 * 60 * 1000,  // 24 hours
```

**Recommendation**: Centralize configuration

```typescript
// config/constants.ts
export const SYNC_CONFIG = {
  NETWORK_TIMEOUT_MS: 30000,
  MAX_RETRY_COUNT: 3,
  BASE_BACKOFF_MS: 1000,
} as const;

export const CACHE_CONFIG = {
  STALE_TIME_MS: 5 * 60 * 1000,     // 5 minutes
  GC_TIME_MS: 24 * 60 * 60 * 1000,  // 24 hours
} as const;

// Usage
import { SYNC_CONFIG } from '@/config/constants';
const timeout = SYNC_CONFIG.NETWORK_TIMEOUT_MS;
```

**Action Items**:
- [ ] Create `config/constants.ts`
- [ ] Extract magic numbers from codebase
- [ ] Document configuration values
- [ ] Add type safety (`as const`)

---

### 6. Inconsistent Naming Conventions

**Issue**: Mix of naming styles across codebase  
**Impact**: Harder to search, less professional

**Examples**:
```typescript
// ❌ Inconsistent
const checkInKeys = { /* ... */ };      // camelCase
const journalKeys = { /* ... */ };      // camelCase
const MILESTONES = [1, 7, 14, 30];      // SCREAMING_SNAKE_CASE

// ❌ File naming
useCheckIns.ts        // camelCase
useJournalEntries.ts  // camelCase
SyncContext.tsx       // PascalCase
```

**Recommended Standards**:
```typescript
// Query keys: camelCase objects
export const checkInKeys = { all: ['checkins'] };
export const journalKeys = { all: ['journals'] };

// Constants: SCREAMING_SNAKE_CASE
export const MILESTONE_DAYS = [1, 7, 14, 30, 60, 90, 180, 365];

// File names:
// - Hooks: camelCase (useCheckIns.ts)
// - Components: PascalCase (CheckInCard.tsx)
// - Utilities: camelCase (encryption.ts)
// - Types: camelCase (types.ts)
```

**Action Items**:
- [ ] Document naming conventions in `CONTRIBUTING.md`
- [ ] Standardize existing files (low priority, can wait)

---

## 🟢 Minor Improvements

### 7. Dead Code / Commented Code

**Found**:
```typescript
// OLD APPROACH (commented but not removed)
// const oldMethod = () => { ... }

// TODO: Remove this after migration
// Legacy code that should be deleted
```

**Recommendation**:
- Delete commented code (Git history preserves it)
- Remove TODO comments older than 3 months
- Use feature flags for gradual migrations

**Action Items**:
- [ ] Search for `// TODO` older than 3 months
- [ ] Search for commented function definitions
- [ ] Delete or document with tracking issue

---

### 8. Inconsistent Import Ordering

**Found**: No consistent import order  
**Example**:
```typescript
// ❌ Random order
import { useDatabase } from '../../../contexts/DatabaseContext';
import { generateId } from '../../../utils/id';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

// ✅ Consistent order
import React from 'react';                                    // 1. React
import { useQuery } from '@tanstack/react-query';             // 2. External libs
import { useDatabase } from '../../../contexts/DatabaseContext'; // 3. Internal (alphabetical)
import { generateId } from '../../../utils/id';
```

**Recommendation**:
```typescript
// Use eslint-plugin-import for automatic sorting
{
  "import/order": ["error", {
    "groups": [
      "builtin",    // Node built-ins
      "external",   // npm packages
      "internal",   // @/ imports
      "parent",     // ../
      "sibling",    // ./
      "index"       // ./index
    ],
    "alphabetize": { "order": "asc" }
  }]
}
```

**Action Items**:
- [ ] Add `eslint-plugin-import` to devDependencies
- [ ] Configure import order rules
- [ ] Run `eslint --fix` to auto-sort

---

### 9. Type Imports vs Value Imports

**Found**: Mix of `import type` and regular imports  
**Issue**: Type-only imports should use `import type` for better tree-shaking

**Examples**:
```typescript
// ❌ Regular import for types
import { JournalEntry } from '@recovery/shared/src/types/database';

// ✅ Explicit type import
import type { JournalEntry } from '@recovery/shared/src/types/database';
```

**Recommendation**:
Enable TypeScript compiler option:
```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true  // Forces explicit type imports
  }
}
```

**Action Items**:
- [ ] Enable `verbatimModuleSyntax` in tsconfig.json
- [ ] Fix type imports throughout codebase (TypeScript will error)

---

## Performance Optimization Opportunities

### 10. Memoization Opportunities

**Issue**: Some expensive computations could be memoized

**Example**:
```typescript
// features/home/hooks/useCleanTime.ts
export function useCleanTime() {
  const { user } = useAuth();
  
  // ❌ Computed on every render (even if user unchanged)
  const cleanTime = useMemo(() => {
    if (!user?.sobriety_start_date) return null;
    const start = new Date(user.sobriety_start_date);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    return {
      days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
      hours: Math.floor(diffMs / (1000 * 60 * 60)) % 24,
      minutes: Math.floor(diffMs / (1000 * 60)) % 60,
    };
  }, [user]);  // ✅ Already memoized, good!
}
```

**Analysis**: Most hooks already use `useMemo` correctly. No major issues found.

---

### 11. Bundle Size Optimization

**Recommendation**: Analyze bundle to find bloat

```bash
# Install bundle analyzer
npm install --save-dev @rnx-kit/metro-plugin-cyclic-dependencies-detector

# Analyze bundle
npx react-native-bundle-visualizer
```

**Common Culprits**:
- `moment.js` (if used) → Use `date-fns` instead
- `lodash` (if used) → Import specific functions
- Unused dependencies in package.json

**Action Items**:
- [ ] Run bundle analyzer
- [ ] Check for duplicate dependencies (`npm dedupe`)
- [ ] Remove unused dependencies

---

## Code Organization Improvements

### 12. Barrel Exports (index.ts files)

**Status**: ✅ GOOD - Most features have proper barrel exports

**Example**:
```typescript
// features/journal/hooks/index.ts
export {
  useJournalEntries,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
  journalKeys,
} from './useJournalEntries';
```

**Recommendation**: Continue this pattern for new features

---

### 13. Consistent File Structure

**Current Structure**: ✅ GOOD - Feature-based organization

```
features/
  journal/
    components/     # Feature-specific components
    hooks/          # Feature-specific hooks
    screens/        # Feature screens
    types/          # Feature-specific types (if needed)
```

**Recommendation**: Maintain this structure for new features

---

## Testing Improvements (Related to Code Quality)

### 14. Test File Naming

**Found**: Inconsistent test file locations

```
__tests__/          # Some tests in __tests__ folders
*.test.ts           # Some tests next to source files
```

**Recommendation**: Choose ONE pattern

**Option A**: Co-locate tests
```
useCheckIns.ts
useCheckIns.test.ts
```

**Option B**: Separate __tests__ folders
```
hooks/
  useCheckIns.ts
  __tests__/
    useCheckIns.test.ts
```

**Current Mix**: Both patterns exist, which is confusing

**Action Items**:
- [ ] Standardize on one pattern (recommend co-location for hooks/utils)
- [ ] Update jest config to match pattern
- [ ] Document in CONTRIBUTING.md

---

## Documentation Improvements

### 15. Missing JSDoc Comments

**Issue**: Many utility functions lack JSDoc comments  
**Impact**: Harder to understand without reading implementation

**Example**:
```typescript
// ❌ No documentation
export async function addToSyncQueue(
  db: StorageAdapter,
  table: string,
  recordId: string,
  operation: 'insert' | 'update'
): Promise<void> {
  // Implementation
}

// ✅ With JSDoc
/**
 * Add a record to the sync queue for background synchronization
 * 
 * @param db - Storage adapter instance
 * @param table - Table name (e.g. 'journal_entries')
 * @param recordId - Local record ID to sync
 * @param operation - Type of operation ('insert' or 'update')
 * @throws {Error} If database write fails
 * @example
 * ```ts
 * await addToSyncQueue(db, 'journal_entries', entryId, 'insert');
 * ```
 */
export async function addToSyncQueue(
  db: StorageAdapter,
  table: string,
  recordId: string,
  operation: 'insert' | 'update'
): Promise<void> {
  // Implementation
}
```

**Action Items**:
- [ ] Add JSDoc to all public API functions
- [ ] Use TSDoc standard (@param, @returns, @throws, @example)
- [ ] Generate API docs with TypeDoc (optional)

---

## Refactoring Priority List

### Immediate (This Week):
1. ✅ Fix console.log usage (already covered in security)
2. 🔄 Standardize error handling (define patterns)
3. 🔄 Add missing TypeScript return types

### Short-Term (Next 2 Weeks):
1. Consolidate Card components (choose one implementation)
2. Extract magic numbers to constants file
3. Split large hook files (useCheckIns, useJournalEntries)

### Medium-Term (Next Month):
1. Add JSDoc comments to public APIs
2. Standardize test file naming
3. Bundle size analysis + optimization

---

## Code Quality Metrics

**Current State**:
- TypeScript Strict Mode: ✅ Enabled
- No `any` types: ✅ Clean (0 found)
- Consistent patterns: 🟡 Mostly consistent, some gaps
- Test coverage: 🟡 ~30% (estimated, need to run coverage report)
- Documentation: 🟠 Sparse JSDoc comments

**Target State**:
- TypeScript Strict Mode: ✅ Enabled
- No `any` types: ✅ Enforced
- Consistent patterns: ✅ 100% following style guide
- Test coverage: 🎯 70%+
- Documentation: 🎯 JSDoc for all public APIs

---

**Bottom Line**: Code quality is **very good** overall. The main improvements are:
1. Consolidate duplicate components (Card)
2. Standardize error handling patterns
3. Add JSDoc comments for public APIs
4. Split large hook files

These are **nice-to-haves** rather than critical issues.
