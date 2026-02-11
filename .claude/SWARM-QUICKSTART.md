# Agent Swarm Quick Start Guide

## 🚀 How to Use the Agent Swarm

The Agent Swarm provides autonomous, coordinated development for the Steps to Recovery app. Here's how to work with it:

---

## Basic Usage

### For Any Development Request

Simply describe what you want to build, fix, or improve. The **Swarm Coordinator** will automatically:

1. Analyze your request
2. Select appropriate specialized agents
3. Coordinate their work
4. Deliver results

### Example Requests

```
"Add a gratitude list feature where users can write daily gratitudes"
```

```
"Fix the TypeScript error in useJournalEntries hook"
```

```
"Create tests for the encryption utilities"
```

```
"Design the database schema for sponsor sharing"
```

---

## Agent Reference

### Primary Agent (Always Start Here)

| Agent                 | Description                              | When to Use      |
| --------------------- | ---------------------------------------- | ---------------- |
| **swarm-coordinator** | Meta-orchestrator, routes to specialists | **ALL requests** |

### Specialized Agents (Auto-Selected)

| Agent                       | Specialty                      | Auto-Triggered By      |
| --------------------------- | ------------------------------ | ---------------------- |
| **security-auditor**        | Encryption, RLS, key storage   | Data changes, auth     |
| **database-architect**      | Schema, migrations, RLS        | New tables/columns     |
| **feature-developer**       | Components, hooks, screens     | Feature implementation |
| **testing-specialist**      | Tests, coverage, mocks         | Post-implementation    |
| **performance-optimizer**   | Cold start, rendering, bundles | Performance issues     |
| **accessibility-validator** | WCAG AAA, screen readers       | UI components          |
| **documentation-agent**     | Docs, comments, guides         | Documentation needs    |

---

## Development Workflows

### Workflow 1: New Feature

```
User: "Add a daily gratitude feature"
    ↓
Swarm Coordinator
    ↓
├── Database Architect: Design schema with encryption
├── Feature Developer: Build screens and hooks
├── Security Auditor: Validate encryption & RLS
├── Testing Specialist: Add tests
└── Documentation Agent: Update docs
    ↓
Quality Gates (TypeScript, Security, Tests)
    ↓
Complete ✅
```

### Workflow 2: Bug Fix

```
User: "Journal entries not saving"
    ↓
Swarm Coordinator
    ↓
├── Feature Developer: Diagnose and fix
├── Testing Specialist: Add regression test
└── Security Auditor: Verify encryption intact
    ↓
Complete ✅
```

### Workflow 3: Security Review

```
User: "Review the sponsor sharing implementation"
    ↓
Swarm Coordinator
    ↓
Security Auditor (comprehensive review)
    ↓
Detailed audit report with findings
    ↓
Complete ✅ (or route to fixes)
```

---

## Quality Gates

Every swarm execution automatically enforces:

| Gate              | Requirement                   | Enforced By             |
| ----------------- | ----------------------------- | ----------------------- |
| **Type Safety**   | `npx tsc --noEmit` = 0 errors | All agents              |
| **Security**      | Encryption, RLS, SecureStore  | Security Auditor        |
| **Tests**         | Coverage targets met          | Testing Specialist      |
| **Accessibility** | WCAG AAA compliance           | Accessibility Validator |

---

## Common Tasks

### Add a New Table

```
"I need a table for storing user affirmations"
```

Agents: Database Architect → Security Auditor → Feature Developer

### Build a Screen

```
"Create a screen for viewing achievement history"
```

Agents: Feature Developer → Accessibility Validator → Testing Specialist

### Fix a Bug

```
"Fix the sync queue not processing deletes"
```

Agents: Feature Developer → Testing Specialist → Security Auditor

### Optimize Performance

```
"The app is slow to start, optimize cold start"
```

Agents: Performance Optimizer → Testing Specialist

### Add Tests

```
"Add tests for the daily check-in feature"
```

Agents: Testing Specialist

### Security Audit

```
"Audit all encryption implementations"
```

Agents: Security Auditor

---

## Communication Tips

### Be Specific

✅ **Good**: "Create a gratitude list screen with add/edit/delete, encrypted storage, and daily reminders"

❌ **Vague**: "Add gratitude stuff"

### Include Context

✅ **Good**: "The sponsor sharing needs to allow users to share specific journal entries with their sponsor, not all entries"

### Reference Existing Code

✅ **Good**: "Follow the same pattern as journal entries in useJournalEntries.ts"

---

## Expected Timelines

| Task Type                | Typical Duration | Agents Involved |
| ------------------------ | ---------------- | --------------- |
| Simple bug fix           | 1-2 hours        | 1-2             |
| New component            | 2-4 hours        | 2-3             |
| New feature              | 1-3 days         | 3-5             |
| Complex feature          | 3-5 days         | 4-6             |
| Security audit           | 2-4 hours        | 1-2             |
| Performance optimization | 1-2 days         | 1-2             |

---

## Monitoring Progress

The Swarm Coordinator will provide:

1. **Initial Plan**: Which agents are involved and why
2. **Progress Updates**: At major milestones
3. **Quality Results**: TypeScript, security, test results
4. **Final Summary**: What was accomplished

---

## Troubleshooting

### If Results Don't Meet Expectations

1. **Be more specific** in your request
2. **Reference existing code** you want to match
3. **Clarify requirements** that may have been misunderstood

### If You Need to Stop/Revert

```
"Stop the current swarm task"
"Revert the changes from the last swarm run"
```

### If You Want Human Review

```
"Have the swarm create a plan but don't implement yet"
"Show me what the swarm would do before starting"
```

---

## File Locations

### Agent Definitions

```
.claude/agents/
├── swarm-coordinator.md      # Primary orchestrator
├── security-auditor.md       # Security reviews
├── database-architect.md     # Schema design
├── feature-developer.md      # Implementation
├── testing-specialist.md     # Test creation
├── performance-optimizer.md  # Performance
└── accessibility-validator.md # Accessibility
```

### Planning Documents

```
.claude/
├── AGENT-SWARM-PLAN.md       # Complete swarm plan
├── SWARM-QUICKSTART.md       # This file
└── skills/                   # Specialized skill guides
```

---

## Next Steps

1. **Start Simple**: Try a small request first to see how the swarm works
2. **Review the Plan**: Read `AGENT-SWARM-PLAN.md` for full details
3. **Iterate**: Use feedback to refine future requests

---

**Remember**: The swarm is designed to handle complexity while maintaining security and quality. Let it do the coordination - you just describe what you want built.
