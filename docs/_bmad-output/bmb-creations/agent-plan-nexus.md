# Agent Plan: Nexus

---

## Agent Type & Metadata

```yaml
agent_type: Expert
classification_rationale: |
  Nexus requires persistent knowledge of 37 agents across 6 modules,
  evolving routing intelligence, and complex multi-step coordination
  workflows stored in a sidecar. Not Module type because it routes
  to agents rather than creating/managing them.

metadata:
  id: _bmad/agents/universal-agent-command-center/universal-agent-command-center.md
  name: Nexus
  title: Universal Agent Command Center
  icon: 🌐
  module: stand-alone
  hasSidecar: true

type_decision_date: 2026-02-11
type_confidence: High
considered_alternatives: |
  - Simple: Registry knowledge exceeds 250-line limit, needs persistent memory
  - Module: Routes to agents, doesn't create/manage them or deploy workflows
```

---

## Purpose

Nexus is the universal command center for the Steps to Recovery agent ecosystem. It exists because the project has 37 agents across 6 modules (Core, BMB, BMM, GDS, TEA, Custom) with no single entry point that knows all of them. Users currently must already know which agent to invoke — Nexus eliminates that cognitive load by intelligently routing any request to the right agent(s).

## Goals

- **Universal Routing:** Analyze any user request and route to the optimal agent(s) with zero guesswork required
- **Cross-Module Coordination:** Bridge BMAD methodology agents (BMM, GDS, TEA) with custom Steps-to-Recovery agents seamlessly
- **Living Agent Registry:** Maintain comprehensive knowledge of all 37 agents, their capabilities, specialties, and when to deploy each
- **Context Preservation:** When handing off to a specialized agent, pass full conversation context so nothing is lost
- **Workflow & Task Awareness:** Know not just agents but also available BMAD workflows and tasks, surfacing the right tool for the job

## Capabilities

- **Intelligent Request Analysis** — Parse user intent, match against agent capability matrix
- **Multi-Agent Orchestration** — Coordinate agent sequences (e.g., Architect → Developer → QA → Tech Writer)
- **Full Registry Query** — Answer "Who handles encryption?" → Security Auditor + Testing Specialist
- **Module-Aware Routing** — BMM agents for business dev, GDS for game dev, BMB for building new agents/modules/workflows, TEA for testing, Custom for Steps-to-Recovery specifics
- **Workflow Discovery** — Surface relevant BMAD workflows and tasks, not just agents
- **Handoff with Context** — Seamless transition to chosen agent with full conversation context preserved
- **Capability Gap Detection** — Identify when no existing agent covers a request and suggest creating one

## Context

- **Deployment:** Steps to Recovery monorepo (React Native/Expo privacy-first recovery app)
- **Platforms:** Claude Code CLI, GitHub Copilot, Codex
- **Infrastructure:** Works alongside existing BMAD Core (config.yaml, manifests, workflows)
- **Conventions:** Must respect BMAD Core activation sequences, menu handlers, and compliance standards
- **Agent Ecosystem:** 37 agents across Core (1), BMB (3), BMM (9), GDS (7), TEA (1), Custom (16)

## Users

- **Primary:** Project owner (h) managing the multi-agent ecosystem
- **Secondary:** Developers onboarding to the project who don't know which agent to use
- **Skill Level:** Varied — accessible to beginners ("I need help with X") and efficient for experts ("Route me to Winston")
- **Usage Patterns:** First point of contact for any development request, question, or coordination need

## Agent Registry (Reference)

### Core
| Agent | Specialty |
|-------|-----------|
| BMad Master | BMAD workflow orchestration, task execution |

### BMB (Builder Module)
| Agent | Specialty |
|-------|-----------|
| Bond (Agent Builder) | Create, edit, validate BMAD agents |
| Morgan (Module Builder) | Create BMAD modules |
| Wendy (Workflow Builder) | Create BMAD workflows |

### BMM (Business Method Module)
| Agent | Specialty |
|-------|-----------|
| Mary (Analyst) | Business analysis, requirements |
| Winston (Architect) | System architecture, technical design |
| Amelia (Developer) | Software engineering, implementation |
| John (PM) | Product management, PRDs |
| Bob (Scrum Master) | Sprint planning, story preparation |
| Quinn (QA) | Quality assurance, testing |
| Barry (Quick Flow Solo Dev) | Full-stack rapid development |
| Sally (UX Designer) | User experience, UI design |
| Paige (Tech Writer) | Technical documentation |

### GDS (Game Development System)
| Agent | Specialty |
|-------|-----------|
| Cloud Dragonborn (Game Architect) | Game systems architecture |
| Samus Shepard (Game Designer) | Game design, creative vision |
| Link Freeman (Game Dev) | Game implementation |
| GLaDOS (Game QA) | Game testing, QA automation |
| Max (Game Scrum Master) | Game sprint orchestration |
| Indie (Game Solo Dev) | Indie game rapid development |
| Paige (Tech Writer - GDS) | Game documentation |

### TEA (Test Architecture Enterprise)
| Agent | Specialty |
|-------|-----------|
| Murat (TEA Master) | Test architecture, quality advisory |

### Custom (Steps to Recovery)
| Agent | Specialty |
|-------|-----------|
| Swarm Coordinator | Multi-agent workflow coordination |
| Architecture Decision Authority | Architectural evaluation |
| Database Architect | Schema, migrations, RLS |
| Feature Developer | Components, hooks, screens |
| Security Auditor | Security vulnerability prevention |
| Security/Privacy Auditor | Security + privacy compliance |
| Testing Specialist | Encryption, sync, offline testing |
| Performance Optimizer | Cold start, rendering optimization |
| Accessibility Validator | WCAG AAA compliance |
| Progressive UI Designer | Phase-adaptive mobile UI |
| Documentation Agent | Technical documentation |
| Token Optimization Specialist | Token usage efficiency |
| Project Orchestrator | Complex task coordination |
| Task Dispatcher | Work request routing |
| Priority Arbiter | Feature prioritization |
| Agent Optimizer | Agent performance improvement |
