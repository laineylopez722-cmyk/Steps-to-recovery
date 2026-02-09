# Agent Swarm Index

**Quick Links:**
- [Quick Start Guide](./SWARM-QUICKSTART.md)
- [Complete Swarm Plan](./AGENT-SWARM-PLAN.md)
- [CLAUDE.md Updates](../CLAUDE.md)

---

## 🎯 Start Here

**New to the Agent Swarm?** Read the [Quick Start Guide](./SWARM-QUICKSTART.md) first.

**Want full details?** Read the [Complete Swarm Plan](./AGENT-SWARM-PLAN.md).

**Ready to use?** Just describe what you want to build - the **Swarm Coordinator** handles the rest.

---

## 📁 File Structure

```
.claude/
├── AGENT-SWARM-INDEX.md          # This file - master index
├── AGENT-SWARM-PLAN.md           # Complete swarm architecture
├── SWARM-QUICKSTART.md           # Quick start guide
│
├── agents/                       # Agent definitions
│   ├── swarm-coordinator.md      # PRIMARY - Route all requests here
│   ├── security-auditor.md       # Security validation
│   ├── database-architect.md     # Schema & migrations
│   ├── feature-developer.md      # Implementation
│   ├── testing-specialist.md     # Test creation
│   ├── performance-optimizer.md  # Performance tuning
│   └── accessibility-validator.md # Accessibility compliance
│
├── skills/                       # Specialized knowledge
│   ├── expo-encryption-patterns/
│   ├── supabase-offline-sync/
│   ├── recovery-app-ui/
│   ├── react-native-privacy/
│   ├── test-encryption/
│   └── recovery-feature-scaffold/
│
└── commands/                     # BMAD workflow commands
    └── bmad-*.md
```

---

## 🤖 Agent Reference

### Primary Agent

| Agent | File | Purpose | When to Use |
|-------|------|---------|-------------|
| **swarm-coordinator** | [agents/swarm-coordinator.md](./agents/swarm-coordinator.md) | Meta-orchestrator | **ALL requests** |

### Specialized Agents (Auto-Selected)

| Agent | File | Specialty | Auto-Trigger |
|-------|------|-----------|--------------|
| security-auditor | [agents/security-auditor.md](./agents/security-auditor.md) | Encryption, RLS, keys | Data/storage changes |
| database-architect | [agents/database-architect.md](./agents/database-architect.md) | Schema, migrations, RLS | New tables/columns |
| feature-developer | [agents/feature-developer.md](./agents/feature-developer.md) | Components, hooks, screens | Feature implementation |
| testing-specialist | [agents/testing-specialist.md](./agents/testing-specialist.md) | Tests, coverage, mocks | Post-implementation |
| performance-optimizer | [agents/performance-optimizer.md](./agents/performance-optimizer.md) | Cold start, bundles | Performance issues |
| accessibility-validator | [agents/accessibility-validator.md](./agents/accessibility-validator.md) | WCAG AAA compliance | UI components |

---

## 🔄 Common Workflows

### 1. New Feature Development

```
User: "Add a gratitude list feature"
    ↓
Swarm Coordinator
    ↓
├─ Database Architect: Schema design
├─ Feature Developer: Implementation
├─ Security Auditor: Security validation
├─ Testing Specialist: Test coverage
└─ Documentation Agent: Docs update
```

**Duration**: 2-4 days  
**Output**: Complete, tested, documented feature

### 2. Bug Fix

```
User: "Fix journal sync not working"
    ↓
Swarm Coordinator
    ↓
├─ Feature Developer: Diagnose & fix
└─ Testing Specialist: Regression test
```

**Duration**: 1-2 hours  
**Output**: Fixed code + regression test

### 3. Security Audit

```
User: "Audit the encryption implementation"
    ↓
Swarm Coordinator
    ↓
Security Auditor (comprehensive)
```

**Duration**: 2-4 hours  
**Output**: Detailed security report

### 4. Performance Optimization

```
User: "Optimize app cold start"
    ↓
Swarm Coordinator
    ↓
├─ Performance Optimizer: Analysis & fixes
└─ Testing Specialist: Performance tests
```

**Duration**: 1-2 days  
**Output**: Optimized code + benchmarks

---

## 📊 Quality Gates

Every swarm execution enforces:

| Gate | Command | Target |
|------|---------|--------|
| Type Safety | `npx tsc --noEmit` | 0 errors |
| Security | Security Auditor review | No vulnerabilities |
| Tests | Jest coverage | >75% overall, 90% encryption |
| Accessibility | WCAG AAA checklist | All interactive elements |

---

## 📋 Development Phases

### Current Phase: Phase 2 (Journaling & Step Work)

**Status**: Infrastructure complete, needs testing & polish

| Task | Priority | Assigned Agents |
|------|----------|-----------------|
| Encryption test coverage (90%) | HIGH | Testing Specialist |
| Security audit | HIGH | Security Auditor |
| Memory store optimization | MEDIUM | Performance Optimizer |
| Documentation updates | MEDIUM | Documentation Agent |

### Next Phase: Phase 3 (Sponsor Connection)

**Prerequisites**: Phase 2 complete + security audit pass

| Feature | Complexity | Agents Required |
|---------|-----------|-----------------|
| Sponsor invite flow | Medium | Feature Developer, Security Auditor |
| Selective entry sharing | High | Security Auditor (lead), Database Architect |
| RLS policies for sharing | Medium | Database Architect, Security Auditor |

---

## 🎓 Skills Library

Specialized knowledge for common patterns:

| Skill | Purpose |
|-------|---------|
| [expo-encryption-patterns](./skills/expo-encryption-patterns/SKILL.md) | AES-256 encryption implementation |
| [supabase-offline-sync](./skills/supabase-offline-sync/SKILL.md) | Queue-based sync architecture |
| [recovery-app-ui](./skills/recovery-app-ui/SKILL.md) | Recovery-specific UI components |
| [react-native-privacy](./skills/react-native-privacy/SKILL.md) | Privacy & security patterns |
| [test-encryption](./skills/test-encryption/SKILL.md) | Encryption testing patterns |
| [recovery-feature-scaffold](./skills/recovery-feature-scaffold/SKILL.md) | Complete feature scaffolding |

---

## 🛡️ Security-First Rules

### Automatic Security Triggers

These changes **always** include Security Auditor:

- Modification to `encryption.ts` or `secureStorage/`
- New tables with user data
- New columns storing text/content
- Sync service modifications
- Sponsor/sharing features
- Auth flow changes

### Security Checklist

- [ ] All sensitive data encrypted with `encryptContent()`
- [ ] Keys stored only in SecureStore (never AsyncStorage)
- [ ] RLS policies on all user data tables
- [ ] No plaintext in logs or error messages
- [ ] Sync preserves encryption end-to-end

---

## 📞 Support

### Getting Help

1. **Check the Quick Start**: [SWARM-QUICKSTART.md](./SWARM-QUICKSTART.md)
2. **Review the Plan**: [AGENT-SWARM-PLAN.md](./AGENT-SWARM-PLAN.md)
3. **Ask the Swarm Coordinator**: Describe your issue

### Common Issues

| Issue | Solution |
|-------|----------|
| Results not as expected | Be more specific in your request |
| Need to stop/revert | Say "Stop the current swarm task" |
| Want to review first | Say "Show me the plan before implementing" |

---

## 📈 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| TypeScript Errors | 0 | Maintain 0 |
| Test Coverage | Partial | >75% |
| Security Issues | 0 critical | Maintain 0 |
| Cold Start | TBD | <2s |
| Bundle Size | TBD | <5MB |

---

## 🚀 Quick Commands

```bash
# Start development
npm run mobile

# Run tests
npm test

# Type check
npx tsc --noEmit

# Encryption tests
cd apps/mobile && npm run test:encryption

# Coverage report
cd apps/mobile && npm run test:coverage
```

---

## 📝 Updates & Maintenance

| Date | Change |
|------|--------|
| 2026-02-09 | Agent Swarm v1.0 created |
| | Added Swarm Coordinator |
| | Added Database Architect |
| | Added Feature Developer |
| | Updated CLAUDE.md |

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-09  
**Maintained By**: Agent Swarm

---

> **Remember**: This is a recovery app for vulnerable users. Privacy and security are non-negotiable. The Agent Swarm is designed to maintain these standards autonomously.
