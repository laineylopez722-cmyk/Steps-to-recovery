# Common Agent Patterns

This file contains shared patterns and rules used across multiple agents to reduce duplication.

## Quality Standards Checklist

Before completing any task, verify:

- [ ] TypeScript: 0 errors (`npx tsc --noEmit`)
- [ ] Sensitive data encrypted with `encryptContent()`
- [ ] Keys stored only in SecureStore (never AsyncStorage)
- [ ] RLS policies present for new tables
- [ ] No console.log with sensitive data
- [ ] Tests written for new functionality
- [ ] Accessibility props on interactive elements

## Project Context References

### Critical Files

- `CLAUDE.md` - Project patterns and coding standards
- `apps/mobile/src/utils/encryption.ts` - Encryption utilities
- `apps/mobile/src/services/syncService.ts` - Sync patterns
- `supabase-schema.sql` - Database schema and RLS policies

### Security Requirements

- All sensitive data MUST be encrypted client-side before storage/transmission
- Encryption keys stored ONLY in SecureStore (device Keychain/Keystore)
- Each encryption generates unique IV (initialization vector)
- Use AES-256-CBC with PBKDF2 key derivation
- ALL database tables with user data require RLS policies

### Architecture Principles

- Mobile-first: Optimize for React Native/Expo
- Offline-first: SQLite/IndexedDB as source of truth, cloud is backup
- Privacy-first: End-to-end encryption for sensitive data
- Type-safe: Strict TypeScript, no `any` types
- WCAG AAA: Accessibility by default (7:1 contrast, 48x48dp touch targets)

### Common Patterns

- Feature organization: `apps/mobile/src/features/[name]/{screens,components,hooks}`
- React Query for server state, Zustand for client state
- NativeWind (Tailwind CSS) for styling
- Conventional Commits for git messages

## Output Format Templates

### Architecture Decision Record (ADR)

```markdown
## Decision: [Title]

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated

### Context

[Why this decision is needed]

### Alternatives Considered

1. [Option 1] - [pros/cons]
2. [Option 2] - [pros/cons]

### Decision

[Chosen approach with rationale]

### Consequences

- **Positive**: [benefits]
- **Negative**: [trade-offs]
```

### Security Audit Report Structure

```markdown
## Security Audit: [Feature/Component]

**Status**: PASS | FAIL | PARTIAL

### Critical Issues (Blockers)

[Issues that prevent deployment]

### High Priority

[Issues to fix before release]

### Recommendations

[Proactive security improvements]

### Validation Checklist

- [ ] Encryption keys in SecureStore only
- [ ] Client-side encryption before network calls
- [ ] RLS policies enforce user-only access
- [ ] No sensitive data in logs/errors
```
