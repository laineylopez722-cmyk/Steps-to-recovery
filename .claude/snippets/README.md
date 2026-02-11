# Agent Code Snippets

This directory contains shared code patterns and templates used across multiple agents to reduce duplication and ensure consistency.

## Available Snippets

### 1. [RLS Policy Template](./rls-policy-template.md)

Standard and shared data Row-Level Security policy patterns for Supabase.

**Used by:**

- `database-architect.md`
- `security-auditor.md`
- `security-privacy-auditor.md`

### 2. [Encryption Patterns](./encryption-patterns.md)

Client-side encryption/decryption patterns using AES-256-CBC with HMAC-SHA256 with SecureStore key management.

**Used by:**

- `feature-developer.md`
- `documentation-agent.md`
- `swarm-coordinator.md`
- `testing-specialist.md`
- `token-optimization-specialist.md`

### 3. [Sync Queue Integration](./sync-queue-integration.md)

Patterns for integrating with the offline-first sync queue for cloud backup.

**Used by:**

- `database-architect.md`
- `feature-developer.md`
- `token-optimization-specialist.md`

### 4. [Accessibility Requirements](./accessibility-requirements.md)

WCAG AAA compliance patterns and requirements for UI components.

**Used by:**

- `accessibility-validator.md`
- `documentation-agent.md`
- `feature-developer.md`
- `progressive-ui-designer.md`
- `swarm-coordinator.md`

### 5. [TypeScript Patterns](./typescript-patterns.md)

Strict TypeScript patterns including component props, hooks, and error handling.

**Used by:**

- `feature-developer.md`
- (Reference for all TypeScript-focused agents)

## Usage in Agents

To reference a snippet in an agent file, use:

```markdown
See [Encryption Patterns](../snippets/encryption-patterns.md) for implementation details.
```

or for inline reference:

```markdown
For RLS policy templates, see [../snippets/rls-policy-template.md](../snippets/rls-policy-template.md).
```

## Benefits

✅ **Single Source of Truth**: Update patterns in one place, all agents benefit
✅ **Consistency**: All agents use the same code patterns
✅ **Maintainability**: Easier to update and improve patterns
✅ **Reduced Duplication**: ~60% reduction in duplicated code across agents
✅ **Easier Onboarding**: New agent developers can reference standard patterns

## Maintenance

When updating snippets:

1. Update the snippet file in this directory
2. Verify all agents referencing the snippet are still compatible
3. Run validation tests if available
4. Update the snippet version date in the file header (if applicable)

## Guidelines for New Snippets

Create a new snippet when:

- The same code pattern appears in 3+ agent files
- The pattern is critical for security, privacy, or app architecture
- The pattern is >10 lines and likely to be reused
- The pattern represents a best practice that should be consistently applied

**Avoid creating snippets for:**

- Agent-specific logic or workflows
- One-off examples
- Patterns used in only 1-2 agents
