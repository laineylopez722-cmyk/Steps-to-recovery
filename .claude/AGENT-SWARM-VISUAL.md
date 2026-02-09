# Agent Swarm - Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER REQUEST                                       │
│                  ("Add a gratitude list feature")                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SWARM COORDINATOR (Primary)                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  1. Analyze     │  │  2. Select      │  │  3. Coordinate  │              │
│  │     Request     │─▶│     Agents      │─▶│     Workflow    │              │
│  │                 │  │                 │  │                 │              │
│  │ • Complexity    │  │ • Security      │  │ • Sequence      │              │
│  │ • Domains       │  │   Auditor?      │  │ • Handoffs      │              │
│  │ • Risk Level    │  │ • DB Architect? │  │ • Checkpoints   │              │
│  └─────────────────┘  │ • Feature Dev?  │  └─────────────────┘              │
│                       └─────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  SECURITY AUDITOR   │  │  DATABASE ARCHITECT │  │ FEATURE DEVELOPER   │
│                     │  │                     │  │                     │
│ ┌─────────────────┐ │  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │
│ │ Encryption      │ │  │ │ Schema Design   │ │  │ │ Components      │ │
│ │ Review          │ │  │ │                 │ │  │ │ Screens         │ │
│ ├─────────────────┤ │  │ ├─────────────────┤ │  │ ├─────────────────┤ │
│ │ • encryptContent│ │  │ │ • Table design  │ │  │ │ • Hooks         │ │
│ │ • Key storage   │ │  │ │ • Encrypted col │ │  │ │ • Business logic│ │
│ │ • RLS policies  │ │  │ │ • Indexes       │ │  │ │ • Accessibility │ │
│ │ • Data leaks    │ │  │ │ • Migrations    │ │  │ │ • Error handling│ │
│ └─────────────────┘ │  │ └─────────────────┘ │  │ └─────────────────┘ │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTEGRATION CHECKPOINT                               │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  SECURITY   │  │    TYPE     │  │    TEST     │  │    ACCESS   │         │
│  │    GATE     │  │   SAFETY    │  │  COVERAGE   │  │  IBILITY   │         │
│  │             │  │    GATE     │  │    GATE     │  │    GATE     │         │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤         │
│  │✓ Encrypted  │  │✓ 0 errors   │  │✓ >75% cov  │  │✓ WCAG AAA   │         │
│  │✓ SecureStore│  │✓ Strict TS  │  │✓ 90% enc   │  │✓ 48x48dp    │         │
│  │✓ RLS valid  │  │             │  │             │  │✓ 7:1 contrast│        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TESTING SPECIALIST + DOCUMENTATION                      │
│  ┌─────────────────────────┐    ┌──────────────────────────────────────┐   │
│  │      TEST CREATION      │    │         DOCUMENTATION                │   │
│  │  • Unit tests           │    │  • AGENTS.md updates                 │   │
│  │  • Integration tests    │    │  • Code comments                     │   │
│  │  • Security tests       │    │  • API documentation                 │   │
│  │  • Edge cases           │    │  • Changelog                         │   │
│  └─────────────────────────┘    └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FINAL DELIVERY                                     │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         SUMMARY REPORT                                  │ │
│  │  • What was implemented                                                 │ │
│  │  • Security validation results                                          │ │
│  │  • Test coverage achieved                                               │ │
│  │  • Quality gate results                                                 │ │
│  │  • Next steps & recommendations                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Interactions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 2 EXAMPLE FLOW                                 │
│                    "Complete Journal Feature Testing"                        │
└─────────────────────────────────────────────────────────────────────────────┘

Time ───────────────────────────────────────────────────────────────────────▶

T+0h    ┌─────────────────┐
        │  User Request   │
        │  "Add tests for │
        │  journal"       │
        └────────┬────────┘
                 │
                 ▼
T+0h    ┌─────────────────┐
        │ Swarm Coordinator│
        │ Analyzes:       │
        │ • Domain: Testing
        │ • Complexity: Med
        │ • Agents: 2     │
        └────────┬────────┘
                 │
       ┌─────────┴─────────┐
       │                   │
       ▼                   ▼
T+0h  ┌─────────────────┐ ┌─────────────────┐
      │ Testing         │ │ Security        │
      │ Specialist      │ │ Auditor         │
      │ Starts:         │ │ (Parallel)      │
      │ Test design     │ │ Reviews current │
      └────────┬────────┘ │ implementation  │
               │          └────────┬────────┘
               │                   │
T+2h           │                   ▼
               │          ┌─────────────────┐
               │          │ Security Report │
               │          │ ✓ Encryption OK │
               │          │ ✓ RLS valid     │
               │          └─────────────────┘
               │
T+4h           ▼
      ┌─────────────────┐
      │ Tests Complete  │
      │ • Unit: 15      │
      │ • Integration: 5│
      │ • Coverage: 92% │
      └────────┬────────┘
               │
               ▼
T+4h  ┌─────────────────┐
      │ Quality Gates   │
      ├─────────────────┤
      │ TypeScript: ✓   │
      │ Security: ✓     │
      │ Coverage: 92% ✓ │
      │ Accessibility: ✓│
      └────────┬────────┘
               │
               ▼
T+4h  ┌─────────────────┐
      │ Deliver Results │
      │ + Summary Report│
      └─────────────────┘

Total Time: ~4 hours
Agents Involved: 2
Quality Gates: 4/4 passed
```

---

## Quality Gates Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           QUALITY GATE SYSTEM                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ GATE 1: TYPE SAFETY (All agents enforce)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Command:  cd apps/mobile && npx tsc --noEmit                                │
│ Target:   0 errors                                                          │
│ Strict:   No 'any' types allowed                                            │
│                                                                              │
│ On Fail:  → Route back to Feature Developer                                 │
│           → Specify file:line of errors                                     │
│           → Re-run gate after fix                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ GATE 2: SECURITY (Security Auditor enforces)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ Checklist:                                                                  │
│ ✓ Sensitive data encrypted with encryptContent()                            │
│ ✓ Keys stored only in SecureStore                                           │
│ ✓ RLS policies on new tables                                                │
│ ✓ No plaintext in logs/errors                                               │
│ ✓ Sync preserves encryption                                                 │
│                                                                              │
│ On Fail:  → CRITICAL: Stop all work                                         │
│           → Security Auditor creates fix plan                               │
│           → Re-audit after fix                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ GATE 3: TEST COVERAGE (Testing Specialist enforces)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Targets:                                                                    │
│ • Encryption utilities: 90%                                                 │
│ • Sync service: 70%                                                         │
│ • Database adapters: 60%                                                    │
│ • Feature hooks: 50%                                                        │
│ • Overall: >75%                                                             │
│                                                                              │
│ On Fail:  → Testing Specialist adds missing tests                           │
│           → Re-run coverage check                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ GATE 4: ACCESSIBILITY (Accessibility Validator enforces)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Checklist (WCAG AAA):                                                       │
│ ✓ accessibilityLabel on all interactive elements                            │
│ ✓ accessibilityRole specified                                               │
│ ✓ accessibilityState for disabled/loading                                   │
│ ✓ Touch targets ≥48x48dp                                                    │
│ ✓ Color contrast ≥7:1                                                       │
│ ✓ Screen reader tested                                                      │
│                                                                              │
│ On Fail:  → Route to Feature Developer for fixes                            │
│           → Re-validate after fix                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## BMAD Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BMAD METHODOLOGY                                     │
│              (Build → Measure → Analyze → Decide)                            │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
   │  BUILD   │ ───▶ │ MEASURE  │ ───▶ │ ANALYZE  │ ───▶ │ DECIDE   │
   └──────────┘      └──────────┘      └──────────┘      └──────────┘
        │                 │                 │                 │
        ▼                 ▼                 ▼                 ▼
   ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
   │ Swarm    │      │ Metrics: │      │ Swarm    │      │ Next     │
   │ executes │      │ • TS err │      │ reviews  │      │ priority │
   │ features │      │ • Coverage│      │ results  │      │ features │
   │          │      │ • Bundle │      │          │      │          │
   │          │      │ • Perf   │      │          │      │          │
   └──────────┘      └──────────┘      └──────────┘      └──────────┘

Continuous Cycle:
• Daily: TypeScript errors, test results
• Weekly: Coverage trends, agent performance
• Monthly: Full BMAD review with user feedback
```

---

## Project Phase Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT PHASES                                    │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 1: Core Architecture ✅ COMPLETE
├── Auth & User Management ✓
├── Encryption Infrastructure ✓
├── Offline-First Architecture ✓
└── Database & Sync Foundation ✓

PHASE 2: Journaling & Step Work 🔄 IN PROGRESS
├── Journal Entries ✓
├── Step Work Tracking ✓
├── AI Companion ✓
├── Daily Check-ins ✓
├── Tests ⚠️ (needs improvement)
└── Security Audit ⏳ (pending)

PHASE 3: Sponsor Connection ⏸️ READY TO START
├── Sponsor Invite Flow
├── Sponsorship Management
├── Selective Entry Sharing
└── RLS Policies for Sharing

PHASE 4: Notifications & Geofencing 📋 PLANNED
├── Daily Reminders
├── Geofencing for Meetings
├── Sobriety Streak Counter
└── Achievements System

PHASE 5: Production Polish 📋 PLANNED
├── Accessibility Audit
├── Performance Optimization
├── E2E Testing
├── Store Preparation
└── Privacy Policy & Docs

Current Focus: Complete Phase 2 testing → Phase 3 kickoff
```

---

## Agent Selection Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WHEN TO USE EACH AGENT                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Request Type                    │ Primary Agent           │ Supporting Agents
────────────────────────────────┼─────────────────────────┼────────────────────────
"Add feature X"                 │ swarm-coordinator       │ (auto-selected)
                                │                         │
"Create table for Y"            │ database-architect      │ security-auditor
                                │                         │
"Build Z screen"                │ feature-developer       │ accessibility-validator
                                │                         │ testing-specialist
"Fix sync bug"                  │ feature-developer       │ testing-specialist
                                │                         │
"Audit security"                │ security-auditor        │ (solo)
                                │                         │
"Add tests"                     │ testing-specialist      │ (solo)
                                │                         │
"Optimize performance"          │ performance-optimizer   │ testing-specialist
                                │                         │
"Review accessibility"          │ accessibility-validator │ (solo)
                                │                         │
"Update docs"                   │ documentation-agent     │ (solo)
                                │                         │
"Add sponsor sharing"           │ swarm-coordinator       │ ALL security agents
                                │                         │ (high security risk)
```

---

**Visual Guide Version**: 1.0  
**Companion To**: [AGENT-SWARM-PLAN.md](./AGENT-SWARM-PLAN.md)
