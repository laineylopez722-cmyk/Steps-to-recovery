# Agent Code Refactoring Visual Guide

## Before Refactoring

```
┌─────────────────────────────────────────────────────────────┐
│                    17 Agent Files                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  feature-developer.md                                         │
│    ├─ Encryption code (100 lines)                            │
│    ├─ Sync queue code (30 lines)                             │
│    ├─ Accessibility code (50 lines)                          │
│    └─ TypeScript patterns (40 lines)                         │
│                                                               │
│  database-architect.md                                        │
│    ├─ RLS policy code (20 lines)                             │
│    └─ Sync queue code (30 lines)                             │
│                                                               │
│  security-auditor.md                                          │
│    ├─ Encryption code (100 lines)                            │
│    └─ RLS policy code (20 lines)                             │
│                                                               │
│  security-privacy-auditor.md                                 │
│    ├─ Encryption code (100 lines)                            │
│    └─ RLS policy code (20 lines)                             │
│                                                               │
│  accessibility-validator.md                                  │
│    └─ Accessibility code (50 lines)                          │
│                                                               │
│  testing-specialist.md                                       │
│    ├─ Encryption code (100 lines)                            │
│    └─ Sync queue code (30 lines)                             │
│                                                               │
│  documentation-agent.md                                      │
│    ├─ Encryption code (100 lines)                            │
│    └─ Accessibility code (50 lines)                          │
│                                                               │
│  swarm-coordinator.md                                        │
│    ├─ Encryption code (50 lines)                             │
│    └─ Accessibility code (50 lines)                          │
│                                                               │
│  progressive-ui-designer.md                                  │
│    └─ Accessibility code (50 lines)                          │
│                                                               │
│  token-optimization-specialist.md                            │
│    └─ Encryption code (50 lines)                             │
│                                                               │
│  + 7 other agents (no duplication)                           │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  TOTAL DUPLICATED CODE: ~940 lines                           │
└─────────────────────────────────────────────────────────────┘
```

## After Refactoring

```
┌──────────────────────────────────────────────────────────────┐
│              Shared Snippets (5 files)                        │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  encryption-patterns.md (50 lines)                             │
│    ├─ Import statements                                       │
│    ├─ Encrypting data before storage                          │
│    ├─ Decrypting data for display                             │
│    ├─ Key storage (SecureStore)                               │
│    └─ Security checklist                                      │
│                                                                │
│  rls-policy-template.md (30 lines)                             │
│    ├─ Standard user data policy                               │
│    ├─ Shared data policy                                      │
│    └─ Policy validation checklist                             │
│                                                                │
│  sync-queue-integration.md (45 lines)                          │
│    ├─ After INSERT operations                                 │
│    ├─ After UPDATE operations                                 │
│    ├─ Before DELETE operations                                │
│    └─ Best practices checklist                                │
│                                                                │
│  accessibility-requirements.md (65 lines)                      │
│    ├─ Required props for components                           │
│    ├─ Touch target sizes                                      │
│    ├─ Color contrast requirements                             │
│    ├─ Screen reader support                                   │
│    └─ Accessibility checklist                                 │
│                                                                │
│  typescript-patterns.md (60 lines)                             │
│    ├─ Component props interface                               │
│    ├─ Hook return types                                       │
│    ├─ Error handling with type guards                         │
│    ├─ TypeScript strict mode rules                            │
│    └─ Database query types                                    │
│                                                                │
└──────────────────────────────────────────────────────────────┘
                            ▲
                            │
                    References from
                            │
┌──────────────────────────────────────────────────────────────┐
│                    17 Agent Files                             │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  feature-developer.md                                          │
│    └─ References: All 5 snippets (5 lines)                    │
│                                                                │
│  database-architect.md                                         │
│    └─ References: RLS, Sync Queue (2 lines)                   │
│                                                                │
│  security-auditor.md                                           │
│    └─ References: Encryption, RLS, Sync (3 lines)             │
│                                                                │
│  security-privacy-auditor.md                                  │
│    └─ References: Encryption, RLS, Sync (3 lines)             │
│                                                                │
│  accessibility-validator.md                                   │
│    └─ References: Accessibility (1 line)                      │
│                                                                │
│  testing-specialist.md                                        │
│    └─ References: Encryption, Sync (2 lines)                  │
│                                                                │
│  documentation-agent.md                                       │
│    └─ References: All 5 snippets (5 lines)                    │
│                                                                │
│  swarm-coordinator.md                                         │
│    └─ References: All 5 snippets (5 lines)                    │
│                                                                │
│  progressive-ui-designer.md                                   │
│    └─ References: Accessibility, TypeScript (2 lines)         │
│                                                                │
│  token-optimization-specialist.md                             │
│    └─ References: Encryption, Sync, TypeScript (3 lines)      │
│                                                                │
│  + 7 other agents (no changes needed)                         │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│  TOTAL CODE: 250 lines (snippets) + 50 lines (references)     │
│            = 300 lines                                         │
└──────────────────────────────────────────────────────────────┘
```

## Benefits Visualization

```
┌────────────────────────────────────────────────────────────┐
│                    BEFORE                                   │
├────────────────────────────────────────────────────────────┤
│  Want to update encryption pattern?                         │
│  → Must update 5 different agent files                      │
│  → Risk of inconsistency                                    │
│  → Time consuming                                           │
│  → Easy to miss one file                                    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    AFTER                                    │
├────────────────────────────────────────────────────────────┤
│  Want to update encryption pattern?                         │
│  → Update 1 snippet file                                    │
│  → All 5 agents benefit immediately                         │
│  → Guaranteed consistency                                   │
│  → Fast and efficient                                       │
└────────────────────────────────────────────────────────────┘
```

## Code Metrics

```
┌──────────────────────┬──────────┬─────────┬──────────────┐
│ Metric               │ Before   │ After   │ Improvement  │
├──────────────────────┼──────────┼─────────┼──────────────┤
│ Total Lines          │ ~940     │ ~300    │ -68%         │
│ Maintenance Files    │ 17       │ 5       │ -70%         │
│ Duplication Rate     │ High     │ Zero    │ -100%        │
│ Update Complexity    │ O(n)     │ O(1)    │ Linear→Const │
└──────────────────────┴──────────┴─────────┴──────────────┘
```

## Reference Pattern Example

### Before

````markdown
## Encryption Implementation

```typescript
import { encryptContent, decryptContent } from '@/utils/encryption';

// Encrypt sensitive data before storing
const encryptedContent = await encryptContent(sensitiveData);
await db.runAsync('INSERT INTO ...');

// Decrypt when reading
const decrypted = await decryptContent(encrypted);
```
````

**Security Checklist:**

- [ ] All sensitive data encrypted with encryptContent()
- [ ] Encryption happens client-side
- [ ] Keys stored in SecureStore
      ...

````

### After
```markdown
## Encryption Implementation

> See [Encryption Patterns](../snippets/encryption-patterns.md) for implementation details.

```typescript
// See: ../snippets/encryption-patterns.md
const encryptedContent = await encryptContent(sensitiveData);
````

```

**Space saved:** ~80 lines → 3 lines (96% reduction in this section)
```
