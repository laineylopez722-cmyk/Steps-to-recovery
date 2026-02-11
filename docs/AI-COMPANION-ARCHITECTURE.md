# AI Recovery Companion - Technical Architecture

> **Orchestration Document** - Master plan for BMAD (Build-Modular-Agents-Docs) implementation

## Overview

Building the AI Recovery Companion as defined in AI-COMPANION-VISION.md. This document details the technical architecture, module breakdown, and implementation order.

---

## Current State Analysis

### Existing Infrastructure ✅

| Component         | Status   | Location                           |
| ----------------- | -------- | ---------------------------------- |
| Memory Store Hook | Complete | `hooks/useMemoryStore.ts`          |
| Risk Detection    | Complete | `services/riskDetectionService.ts` |
| Database Schema   | Partial  | `db/schema.ts`                     |
| Journal System    | Complete | `features/journal/`                |
| Check-in System   | Complete | `components/home/`                 |
| Step Progress     | Basic    | `stepProgress` table               |
| Encryption        | Complete | `utils/encryption.ts`              |

### Gaps to Fill

1. **Chat System** - No AI chat infrastructure
2. **AI Service** - No API integration layer
3. **Context Assembly** - No conversation context builder
4. **Step Work Interactive** - Basic tracking only, no guided work
5. **Proactive Engine** - Risk detection exists, no proactive outreach
6. **Chat UI** - No chat interface components

---

## Module Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  ChatScreen  │  ChatBubble  │  QuickActions  │  CrisisOverlay   │
└──────────────┴──────────────┴────────────────┴──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       FEATURE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│            features/ai-companion/                                │
│  ├── hooks/                                                      │
│  │   ├── useAIChat.ts          # Main chat hook                 │
│  │   ├── useChatHistory.ts     # Message persistence            │
│  │   └── useContextAssembly.ts # Build AI context               │
│  ├── services/                                                   │
│  │   ├── aiService.ts          # API calls (OpenAI/Claude)      │
│  │   ├── memoryExtractor.ts    # Extract facts from messages    │
│  │   ├── contextBuilder.ts     # Assemble personalized context  │
│  │   └── proactiveEngine.ts    # Trigger proactive outreach     │
│  ├── prompts/                                                    │
│  │   ├── base.ts               # Core recovery companion prompt │
│  │   ├── stepWork.ts           # Step-specific prompts          │
│  │   └── crisis.ts             # Crisis detection/response      │
│  └── types/                                                      │
│      └── index.ts              # Type definitions               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  db/                                                             │
│  ├── schema.ts      + chatMessages, chatConversations           │
│  ├── migrations/      New tables                                │
│  └── client.ts        Drizzle client                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Schema Extensions

### New Tables

```typescript
// Chat Conversations
export const chatConversations = sqliteTable('chat_conversations', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  title: text('title'),
  type: text('type').notNull(), // 'general' | 'step_work' | 'crisis' | 'check_in'
  stepNumber: integer('step_number'), // If step work conversation
  status: text('status').default('active'), // 'active' | 'archived'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Chat Messages
export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => chatConversations.id),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  isEncrypted: integer('is_encrypted', { mode: 'boolean' }).default(true),
  metadata: text('metadata'), // JSON: tokens, model, etc.
  createdAt: text('created_at').notNull(),
});

// Step Work Entries (detailed work, not just progress)
export const stepWorkEntries = sqliteTable('step_work_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  stepNumber: integer('step_number').notNull(),
  entryType: text('entry_type').notNull(), // 'resentment' | 'fear' | 'amend' | 'reflection'
  data: text('data').notNull(), // Encrypted JSON
  status: text('status').default('draft'), // 'draft' | 'complete' | 'discussed'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
```

---

## AI Service Design

### Provider Abstraction

```typescript
// services/aiService.ts
interface AIProvider {
  chat(messages: Message[], options: ChatOptions): Promise<StreamResponse>;
  embed(text: string): Promise<number[]>; // For semantic search
}

const providers = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
};

export function getAIService(): AIProvider {
  const provider = getConfig('aiProvider') || 'anthropic';
  return providers[provider];
}
```

### Context Assembly

```typescript
// services/contextBuilder.ts
export async function buildContext(userId: string, conversationType: string): Promise<string> {
  const [memorySummary, recentMessages, currentStep, sobrietyDays, recentCheckIns] =
    await Promise.all([
      getMemorySummary(userId),
      getRecentMessages(userId, 10),
      getCurrentStep(userId),
      getSobrietyDays(userId),
      getRecentCheckIns(userId, 7),
    ]);

  return assembleContextString({
    memorySummary,
    recentMessages,
    currentStep,
    sobrietyDays,
    recentCheckIns,
    conversationType,
  });
}
```

---

## Implementation Phases

### Phase 1: Foundation (Agent 1 - Schema + Core)

- [ ] Extend `schema.ts` with chat tables
- [ ] Create migration
- [ ] Create `features/ai-companion/` structure
- [ ] Type definitions
- [ ] Basic AI service abstraction

### Phase 2: Chat System (Agent 2 - Chat)

- [ ] `useAIChat.ts` hook
- [ ] `useChatHistory.ts` hook
- [ ] Message persistence with encryption
- [ ] Streaming response handling

### Phase 3: Intelligence (Agent 3 - AI)

- [ ] System prompts (base, step work, crisis)
- [ ] Context builder
- [ ] Memory extraction from chat
- [ ] Crisis detection

### Phase 4: UI (Agent 4 - UI)

- [ ] ChatScreen component
- [ ] ChatBubble component
- [ ] ChatInput component
- [ ] QuickActions component
- [ ] Typing indicator
- [ ] Crisis overlay

### Phase 5: Step Work (Agent 5 - Steps)

- [ ] 4th step inventory builder
- [ ] 8th/9th step amends tracker
- [ ] Step-specific prompts
- [ ] Interactive worksheets

### Phase 6: Integration (Conductor - Me)

- [ ] Wire everything together
- [ ] Navigation integration
- [ ] Test flows
- [ ] Polish

---

## Quality Gates

Each agent's work goes through the **Code Reviewer Agent** before merge:

1. **Type Safety** - No `any`, proper interfaces
2. **Error Handling** - Graceful failures, user feedback
3. **Security** - All sensitive data encrypted
4. **Performance** - No blocking calls, proper memoization
5. **Consistency** - Matches existing code style
6. **Documentation** - JSDoc on exports

---

## Agent Assignments

| Agent     | Focus              | Deliverables                             |
| --------- | ------------------ | ---------------------------------------- |
| Architect | Schema + Structure | Extended schema, folder structure, types |
| Chat      | Chat System        | Hooks, services for chat persistence     |
| AI        | Intelligence       | Prompts, context, memory extraction      |
| UI        | Components         | Chat UI, crisis overlay                  |
| Steps     | Step Work          | Interactive step tools                   |
| Reviewer  | Quality            | Code improvements on each file           |

---

## Success Criteria

- [ ] User can have a conversation with AI companion
- [ ] AI references user's past context (memories)
- [ ] Messages are encrypted at rest
- [ ] Crisis mentions trigger appropriate response
- [ ] Streaming responses work smoothly
- [ ] Step work guides are interactive
- [ ] Proactive nudges fire appropriately

---

_This document is the single source of truth for implementation._
