# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Steps to Recovery** is a privacy-first 12-step recovery companion mobile app built with React Native/Expo. The app emphasizes end-to-end encryption, offline-first architecture, and secure sponsor connections.

**Core Philosophy**: Privacy-first, offline-first, security-first. All sensitive data must be encrypted before storage or transmission.

**Development Methodology**: BMAD (Build-Measure-Analyze-Decide) - Iterative development with focus on user feedback and continuous improvement.

**Current Status**: Phase 4 Complete. Phase 5 in progress (AI Companion & Advanced Features).

**Supabase Project**: `tbiunmmvfbakwlzykpwq`

---

## Quick Reference

### Critical Commands

| Command                                     | Purpose                             |
| ------------------------------------------- | ----------------------------------- |
| `npm run mobile`                            | Start Expo dev server               |
| `npm test`                                  | Run all tests                       |
| `cd apps/mobile && npm run test:encryption` | Run encryption tests (**CRITICAL**) |
| `npx tsc --noEmit`                          | Type check without building         |

### Security Checklist (Before Every PR)

- [ ] All sensitive data encrypted with `encryptContent()`
- [ ] Keys stored in SecureStore only (never AsyncStorage)
- [ ] RLS policies verified on new tables
- [ ] No console.log with sensitive data
- [ ] Sync operations preserve encryption end-to-end

## 🐝 Agent Swarm (NEW - Recommended)

**For all development requests, use the coordinated Agent Swarm.**

The Agent Swarm provides autonomous, multi-agent development with built-in quality gates:

```
User Request → Swarm Coordinator → Specialized Agents → Quality Gates → Results
```

### Quick Start

**For any task, simply describe what you want:**

- "Add a gratitude list feature"
- "Fix the sync issue in journal entries"
- "Create tests for encryption"
- "Optimize cold start performance"

The **Swarm Coordinator** will automatically select and coordinate the right agents.

### Agent Swarm Documentation

| Document                      | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `.claude/AGENT-SWARM-PLAN.md` | Complete swarm architecture and roadmap |
| `.claude/SWARM-QUICKSTART.md` | How to use the swarm                    |
| `.claude/agents/`             | Individual agent definitions            |

### Swarm Agents

| Agent                     | Specialty                         | Activation                         |
| ------------------------- | --------------------------------- | ---------------------------------- |
| `swarm-coordinator`       | **PRIMARY** - Routes all requests | Always start here                  |
| `security-auditor`        | Encryption, RLS, key storage      | Auto-triggered for data changes    |
| `database-architect`      | Schema, migrations, RLS           | Auto-triggered for DB changes      |
| `feature-developer`       | Components, hooks, screens        | Auto-triggered for features        |
| `testing-specialist`      | Tests, coverage, mocks            | Auto-triggered post-implementation |
| `performance-optimizer`   | Cold start, rendering, bundles    | Auto-triggered for perf issues     |
| `accessibility-validator` | WCAG AAA compliance               | Auto-triggered for UI              |

---

### Legacy Individual Agents (Still Available)

| Agent                             | When to Use                                          |
| --------------------------------- | ---------------------------------------------------- |
| `architecture-decision-authority` | Before new features (now handled by swarm)           |
| `token-optimization-specialist`   | For 8+ file tasks (swarm auto-optimizes)             |
| `project-orchestrator`            | Complex coordination (use swarm-coordinator instead) |

### MCP Servers (run `/mcp` to check status)

- **Supabase**: Database queries, RLS testing (requires OAuth)
- **Memory**: Persist architectural decisions across sessions
- **Filesystem**: Advanced file operations
- **Git**: Advanced git operations (if installed)

---

## Common Development Commands

### Development

```bash
# Start mobile app development server
npm run mobile
# Or: cd apps/mobile && npm start

# Start Android emulator
npm run android

# Start iOS simulator (macOS only)
npm run ios

# Start web app (future)
npm run web
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode (in apps/mobile)
cd apps/mobile && npm run test:watch

# Run with coverage
cd apps/mobile && npm run test:coverage

# Test encryption utilities specifically
cd apps/mobile && npm run test:encryption
```

### Building

```bash
# Build mobile app
cd apps/mobile && npx expo export
```

### Linting & Type Checking

```bash
# Lint all packages
npm run lint

# Type check (in apps/mobile)
cd apps/mobile && npx tsc --noEmit
```

### Environment Setup

```bash
# Required: Create .env file in apps/mobile/
# Must include:
EXPO_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Setup

```bash
# Apply database schema (first time only)
# 1. Go to Supabase SQL Editor
# 2. Run files from supabase/migrations/ in filename order
# 3. Verify RLS policies are enabled on all sync tables
# 4. Confirm core tables exist (profiles, journal_entries, daily_checkins)

# IMPORTANT: keep local and cloud schema in sync.
# Use ordered files under supabase/migrations/ as the source of truth.

# Supabase MCP (optional - for Claude Code integration)
# Project Reference: tbiunmmvfbakwlzykpwq
# MCP URL: https://mcp.supabase.com/mcp?project_ref=tbiunmmvfbakwlzykpwq
# See Supabase MCP documentation for authentication instructions
```

---

## Enhanced Development Workflow (Complex Tasks)

**When to Use**: Multi-file changes (8+ files), security-critical code, new features, architectural changes

**Skip for**: Single-file edits, typo fixes, simple bug fixes, documentation updates

### Pre-Implementation Phase

#### 1. Intelligent Approach Determination

- Analyze task requirements thoroughly
- Identify 2-3 possible implementation approaches
- Evaluate trade-offs (complexity, security, performance, maintainability)
- Select optimal approach with clear justification
- Document decision rationale

#### 2. Challenge Your Reasoning (Pre-Plan)

Ask yourself:

- What could go wrong with this approach?
- Edge cases not considered?
- Does this violate project patterns (CLAUDE.md)?
- Security implications (encryption, RLS, key storage)?
- Performance implications (sub-2s cold start requirement)?
- Accessibility implications (WCAG AAA compliance)?

**If issues found**: Revise plan before proceeding
**If no issues**: Continue to standards verification

#### 3. Verify Current Standards (Web Search Required)

**Priority Documentation Sources**:

1. **React Native/Expo**: reactnative.dev, docs.expo.dev (for SDK 54 patterns)
2. **Supabase**: supabase.com/docs (for auth, RLS, real-time)
3. **Security**: OWASP, encryption best practices, privacy standards
4. **Recovery UX**: 12-step program guidelines, crisis intervention patterns

**Search Pattern**:

```
"[Technology] [Feature] best practices 2026"
"Expo SDK 54 [Feature] implementation"
"Supabase RLS [Pattern] current standard"
"Recovery app [Feature] UX standards"
```

**If current standard differs from plan**:

- Auto-update to current standard
- Document reason: "Updated to [Standard] per [Source]"

### Implementation Phase

Follow all patterns in CLAUDE.md:

- Encryption-first for sensitive data (`encryptContent()` before storage)
- Offline-first with SQLite/IndexedDB as source of truth
- TypeScript strict mode (no `any`)
- Accessibility props on all interactive elements

**Token Optimization** (for large tasks):

- Use parallel tool calls for independent files
- Grep before Read for files >100 lines
- Delegate to specialized agents when appropriate
- Use tables/checklists instead of prose explanations

### Post-Implementation Phase

#### 4. Challenge Your Implementation (Post-Code Review)

Critically review the implementation:

- Does code solve the original problem?
- Security vulnerabilities introduced (encryption, keys, RLS)?
- Edge cases handled correctly?
- Accessibility requirements met (WCAG AAA)?
- TypeScript types correct (no `any`)?
- Error handling comprehensive?

**If issues found**: Fix immediately before testing
**If no issues**: Proceed to testing

#### 5. Testing & Validation (Required)

**Security-Critical Code** (encryption, auth, sync, RLS):

```bash
# Run encryption tests
cd apps/mobile && npm run test:encryption

# Invoke security-auditor agent for comprehensive audit
# Then manually test encrypt → decrypt roundtrip
# Verify keys stored in SecureStore (not AsyncStorage)
```

**Sync Code**:

- Test offline mode (airplane mode, network disconnected)
- Verify sync queue order (deletes processed before inserts/updates)
- Test retry logic (simulate network interruption)
- Verify RLS policies (no cross-user data access)

**UI Code**:

```bash
# Invoke accessibility-validator agent for WCAG AAA compliance
# Test with screen reader (VoiceOver on iOS, TalkBack on Android)
# Test with 200% font scaling
# Verify touch targets ≥48x48dp
# Check color contrast ≥7:1 (AAA standard)
```

**All Code**:

```bash
# Run related tests
npm test -- --findRelatedTests

# Type check (no errors allowed)
npx tsc --noEmit

# Manual smoke test in Expo Go
npm run mobile
```

### Workflow Decision Tree

```
Is task complex? (8+ files, security-critical, new feature, architectural change)
├─ YES → Use Enhanced Workflow
│   ├─ 1. Determine best approach (2-3 options evaluated)
│   ├─ 2. Challenge reasoning (pre-plan validation)
│   ├─ 3. Verify current standards (web search required)
│   ├─ 4. Implement with token optimization
│   ├─ 5. Challenge implementation (post-code review)
│   └─ 6. Test & validate (comprehensive, required)
│
└─ NO → Use Standard Workflow
    ├─ Implement directly
    ├─ Basic testing (related tests)
    └─ Type check
```

---

## Token Optimization Patterns

**When to Optimize**: Multi-file tasks (8+ files), approaching token limit (>150k used), repetitive patterns

### High-Impact Techniques

| Technique               | When to Use               | Token Savings            | Example                                                     |
| ----------------------- | ------------------------- | ------------------------ | ----------------------------------------------------------- |
| **Parallel Reads**      | 3+ independent files      | ~2,000 per batch         | `Read(file1) + Read(file2) + Read(file3)` in single message |
| **Grep-First Strategy** | Files >100 lines          | ~2,500 per 500-line file | `Grep(pattern) → Read(targeted lines)` instead of full file |
| **Agent Delegation**    | Complex specialized tasks | 50-60% reduction         | Use `security-auditor` vs manual audit (70% savings)        |
| **Compressed Output**   | Explanatory responses     | 60% on prose             | Tables/checklists vs paragraph explanations                 |
| **Pattern Extraction**  | CLAUDE.md references      | ~500 per reference       | Quote directly (max 10 lines) vs "see CLAUDE.md"            |

### Common Query Library

**Encryption Usage**:

```bash
Grep: "encryptContent|decryptContent"
  --glob="**/*.{ts,tsx}"
  --output_mode="files_with_matches"
```

**Sync Queue Operations**:

```bash
Grep: "addToSyncQueue|addDeleteToSyncQueue"
  --glob="**/features/**/*.ts"
  --output_mode="content"
  -A=5 -B=5
```

**React Query Hooks**:

```bash
Grep: "useQuery|useMutation"
  --glob="**/hooks/*.{ts,tsx}"
  --output_mode="files_with_matches"
```

**Security-Critical Files**:

```bash
Grep: "SecureStore|encryption|decrypt"
  --glob="**/utils/*.ts"
  --output_mode="content"
```

**Database Operations**:

```bash
Grep: "db\\.runAsync|db\\.getAllAsync"
  --glob="**/contexts/*.tsx"
  --output_mode="content"
  -C=3
```

### Agent Delegation Decision Matrix

| Task Type                | Token Cost (Manual) | Recommended Agent               | Token Savings |
| ------------------------ | ------------------- | ------------------------------- | ------------- |
| Security audit           | ~10,000             | security-auditor                | ~7,000 (70%)  |
| Encryption testing       | ~8,000              | testing-specialist              | ~5,500 (69%)  |
| Performance analysis     | ~6,000              | performance-optimizer           | ~3,500 (58%)  |
| Accessibility review     | ~5,000              | accessibility-validator         | ~3,000 (60%)  |
| Complex feature planning | ~12,000             | architecture-decision-authority | ~7,000 (58%)  |
| Multi-agent coordination | ~15,000             | project-orchestrator            | ~8,000 (53%)  |

**Delegation Threshold**: If manual work >5,000 tokens, strongly consider agent delegation.

### When to Use Token-Optimization-Specialist Agent

**High-Priority Scenarios**:

- Starting task with 8+ files to modify
- Current conversation >150,000 tokens used
- Repetitive pattern emerges (same query 3+ times)
- Agent-optimizer identifies token inefficiency

**Low-Priority Scenarios** (skip):

- Simple 1-3 file edits (overhead not worth it)
- Abundant token budget (<50,000 used)
- Urgent bug fixes (speed > efficiency)
- Exploratory research (breadth over precision)

### Token Budget Examples

| Scenario                               | Before Optimization | After Optimization   | Savings |
| -------------------------------------- | ------------------- | -------------------- | ------- |
| Multi-file encryption audit (10 files) | 15,000 tokens       | 6,000 tokens         | 60%     |
| Sync service debugging                 | 12,000 tokens       | 5,000 tokens         | 58%     |
| New feature implementation (8 files)   | 20,000 tokens       | 11,000 tokens        | 45%     |
| Security audit (manual)                | 10,000 tokens       | 3,000 tokens (agent) | 70%     |

**Overall Expected Reduction**: 40-60% on complex tasks through systematic optimization.

---

## Architecture Overview

### 1. Encryption-First Data Flow

**Critical Pattern**: All sensitive data (journal entries, step work, check-ins) follows this flow:

```
User Input → Encrypt (encryptContent) → Store in SQLite/IndexedDB → Queue for Sync → Encrypt Again → Send to Supabase
                                                                                      ↓
User Display ← Decrypt (decryptContent) ← Fetch from Local DB ← Decrypt ← Fetch from Supabase (encrypted blob)
```

**Key Files**:

- `apps/mobile/src/utils/encryption.ts` - AES-256-CBC encryption with PBKDF2 key derivation
- `apps/mobile/src/adapters/secureStorage/` - Platform-specific secure key storage (Keychain/Keystore on mobile, IndexedDB on web)

**Rules**:

- NEVER store unencrypted sensitive data anywhere
- Encryption keys stored ONLY in SecureStore (never AsyncStorage, SQLite, or Supabase)
- Each encryption generates a unique IV (prevents pattern analysis)
- Use `encryptContent()` and `decryptContent()` from `utils/encryption.ts`

### 2. Offline-First with Platform-Agnostic Storage

The app uses a **StorageAdapter pattern** to abstract SQLite (mobile) and IndexedDB (web):

```
Feature Code
    ↓
DatabaseContext (provides StorageAdapter)
    ↓
Platform Detection
    ├─ Mobile: SQLiteProvider (expo-sqlite) → apps/mobile/src/adapters/storage/sqlite.ts
    └─ Web: IndexedDB adapter → apps/mobile/src/adapters/storage/indexeddb.ts
```

**Key Files**:

- `apps/mobile/src/contexts/DatabaseContext.tsx` - Platform-agnostic database provider
- `apps/mobile/src/adapters/storage/` - Storage adapter implementations
- `apps/mobile/src/utils/database.ts` - Schema initialization and migrations

**Database Schema**:

- `user_profile` - User metadata
- `journal_entries` - Encrypted journal entries (local-first)
- `daily_checkins` - Morning intentions & evening reflections (encrypted)
- `step_work` - 12-step work progress (encrypted)
- `achievements` - Milestone tracking
- `sync_queue` - Pending operations for cloud sync

### 3. Background Sync Architecture

**Pattern**: Queue-based eventual consistency with Supabase

```
Local Write → Add to sync_queue → Background Worker → Process Queue → Upsert to Supabase → Mark as synced
                                        ↓
                                  Retry Logic (3 attempts with exponential backoff)
                                        ↓
                                  Deletes BEFORE Inserts/Updates (avoid FK conflicts)
```

**Key Files**:

- `apps/mobile/src/contexts/SyncContext.tsx` - Manages sync lifecycle, network state, periodic sync
- `apps/mobile/src/services/syncService.ts` - Queue processing, retry logic, batch operations

**Sync Triggers**:

1. **Automatic**: Every 5 minutes when online
2. **App foreground**: When app returns from background
3. **Network reconnection**: When device comes online
4. **Manual**: User-triggered sync

**Important**: Deletes are processed BEFORE inserts/updates to avoid foreign key conflicts.

**Conflict Resolution**: Last-write-wins strategy for MVP (no complex merge logic yet).

### 4. Context Architecture

The app uses four primary contexts that work together:

```
AuthContext (apps/mobile/src/contexts/AuthContext.tsx)
    ├─ Manages Supabase authentication
    ├─ Initializes SecureStore with session token
    └─ Triggers cleanup on logout

DatabaseContext (apps/mobile/src/contexts/DatabaseContext.tsx)
    ├─ Provides platform-specific StorageAdapter
    ├─ Initializes database schema
    └─ Waits for auth before exposing db

SyncContext (apps/mobile/src/contexts/SyncContext.tsx)
    ├─ Monitors network state (NetInfo on mobile, navigator.onLine on web)
    ├─ Processes sync queue in background
    ├─ Clears database on user logout
    └─ Handles retry logic for failed syncs

NotificationContext (apps/mobile/src/contexts/NotificationContext.tsx)
    ├─ Manages push notification permissions
    ├─ Schedules daily reminders
    └─ Handles notification responses
```

**Initialization Order**: AuthContext → DatabaseContext → SyncContext → NotificationContext

### 5. Feature-Based Organization

The codebase is organized by **feature**, not by technical layer:

```
apps/mobile/src/
├── features/
│   ├── ai-companion/    # AI-powered recovery insights
│   ├── auth/          # Login, signup, onboarding
│   ├── craving-surf/    # Urge surfing exercises
│   ├── crisis/          # Crisis intervention tools
│   ├── emergency/       # Emergency contacts & resources
│   ├── gratitude/       # Gratitude list tracking
│   ├── home/          # Dashboard, clean time tracker, check-ins
│   ├── inventory/       # Personal inventory (Step 4/10)
│   ├── journal/       # Encrypted journaling
│   ├── meetings/        # Meeting finder & check-ins
│   ├── onboarding/      # First-time user setup
│   ├── profile/       # User settings
│   ├── progress/        # Recovery progress dashboard
│   ├── readings/        # Daily recovery readings
│   ├── safety-plan/     # Personal safety plan
│   ├── settings/        # App settings & preferences
│   ├── sponsor/       # Sponsor connections
│   └── steps/         # 12-step work tracking
├── components/        # Shared UI components
├── config/            # Widget configuration
├── constants/         # App constants
├── contexts/          # React contexts (Auth, Database, Sync, Notification)
├── data/              # Static data
├── db/                # Drizzle ORM schema and client
├── navigation/        # React Navigation setup
├── lib/              # Third-party integrations (Supabase, notifications)
├── providers/         # QueryProvider
├── store/             # Zustand stores
├── utils/            # Utilities (encryption, logging, validation)
├── adapters/         # Platform abstraction (storage, secureStorage)
└── design-system/    # iOS-style design tokens & components
```

**Each feature** contains:

- `screens/` - Screen components
- `components/` - Feature-specific components
- `hooks/` - Feature-specific hooks (e.g., `useJournalEntries`, `useStepWork`)

**Feature-Specific Patterns**:

- **Home**: Clean time tracker, daily check-ins (morning intentions, evening pulse)
- **Journal**: Encrypted entries with mood/craving tracking, tags, search
- **Steps**: 12-step work with guided questions (Step 1 has 10-15 simplified questions)
- **Sponsor**: One-to-one sponsorship with selective entry sharing
- **Emergency**: Crisis toolkit, breathing exercises, safety plan
- **Achievements**: Milestone badges (1, 7, 14, 30, 60, 90, 180, 365 days)

### 6. Design System

The app uses an **iOS-style design system** with design tokens. Styling uses **uniwind** (Tailwind CSS for React Native) with design tokens from `design-system/tokens/`. Use `cn()` helper from `lib/utils.ts` for conditional classes.

**Key Files**:

- `apps/mobile/src/design-system/tokens/colors.ts` - Semantic color system
- `apps/mobile/src/design-system/tokens/typography.ts` - Text styles
- `apps/mobile/src/design-system/tokens/spacing.ts` - Spacing scale
- `apps/mobile/src/design-system/components/` - Reusable UI components (Button, Card, Input, Badge, etc.)

**Components**: All follow iOS Human Interface Guidelines with accessibility built-in.

## React Query Patterns

The app uses **@tanstack/react-query** for server state management:

```typescript
// ✅ CORRECT: Use React Query for data fetching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useJournalEntries() {
  const { db } = useDatabase();

  return useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const entries = await db.getAllAsync<JournalEntry>(
        'SELECT * FROM journal_entries ORDER BY created_at DESC',
      );
      // Decrypt entries for display
      return Promise.all(
        entries.map(async (entry) => ({
          ...entry,
          content: await decryptContent(entry.encrypted_body),
        })),
      );
    },
    enabled: !!db,
  });
}

// Mutations update cache optimistically
export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });
}
```

**Query Key Patterns**:

- `['journal-entries']` - All journal entries
- `['journal-entries', entryId]` - Single entry
- `['daily-checkins', date]` - Check-ins by date
- `['step-work', stepNumber]` - Step work by step
- `['achievements']` - User achievements

## Critical Security Patterns

### Encryption Implementation

```typescript
// ✅ CORRECT: Encrypt before saving to local DB
const encryptedBody = await encryptContent(journalText);
await db.runAsync(
  'INSERT INTO journal_entries (id, user_id, encrypted_body, ...) VALUES (?, ?, ?, ...)',
  [id, userId, encryptedBody, ...]
);

// ❌ WRONG: Never store plaintext sensitive data
await db.runAsync(
  'INSERT INTO journal_entries (id, body, ...) VALUES (?, ?, ...)',
  [id, journalText, ...] // NEVER DO THIS
);
```

### Secure Key Storage

```typescript
// ✅ CORRECT: Use SecureStore for encryption keys and tokens
import { secureStorage } from '../adapters/secureStorage';
await secureStorage.setItemAsync('encryption_key', key);

// ❌ WRONG: Never use AsyncStorage for sensitive data
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('encryption_key', key); // NEVER DO THIS
```

### Logging Sensitive Data

```typescript
// ✅ CORRECT: Use logger (auto-sanitizes in production)
import { logger } from '../utils/logger';
logger.info('Journal entry saved', { entryId, userId });

// ❌ WRONG: Never log sensitive content
console.log('Saved entry:', journalText); // NEVER DO THIS
console.error('Encryption key:', key); // NEVER DO THIS
```

### Supabase RLS Policies

All Supabase tables MUST have Row-Level Security enabled:

```sql
-- Example RLS policy for journal_entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own journal entries"
  ON journal_entries
  FOR ALL
  USING (auth.uid() = user_id);

-- Sponsor sharing requires additional policy
CREATE POLICY "Sponsors can read shared entries"
  ON journal_entries
  FOR SELECT
  USING (
    id IN (
      SELECT entry_id FROM shared_entries
      WHERE shared_with_id = auth.uid()
    )
  );
```

**RLS Policy Pattern**: Always filter by `auth.uid() = user_id` for user data tables.

### Security Audit History

**Recent Security Fixes** (2026-01-01):

- Fixed hardcoded web encryption master key (now derived from session token)
- Implemented complete logout cleanup (encryption keys + session + database)
- Added defense-in-depth for .env protection
- Ensured Supabase anon key is safe to expose (RLS + client-side encryption)

## TypeScript Strictness

**Enforced Rules**:

- ❌ NO `any` types allowed
- ✅ All functions MUST have explicit return types
- ✅ All component props MUST have TypeScript interfaces
- ✅ Use `unknown` for errors, then type guard

```typescript
// ✅ CORRECT
interface JournalEntryProps {
  entryId: string;
  onSave: (content: string) => Promise<void>;
}

export function JournalEntry({ entryId, onSave }: JournalEntryProps): React.ReactElement {
  // ...
}

// ❌ WRONG
export function JournalEntry({ entryId, onSave }: any) {
  // Never use 'any'
}
```

## Accessibility Requirements

ALL interactive components MUST include:

- `accessibilityLabel` (required)
- `accessibilityRole` (required)
- `accessibilityState` (when disabled/loading)
- `accessibilityHint` (when action is non-obvious)

```typescript
// ✅ CORRECT
<Button
  onPress={handleSave}
  accessibilityLabel="Save journal entry"
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
>
  Save
</Button>
```

## Error Handling Pattern

```typescript
// Standard try/catch pattern
try {
  const result = await someAsyncOperation();
  // Handle success
} catch (error) {
  // Type guard for Error
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Operation failed', error);
  // Update UI state (don't use Alert)
  setError(message);
} finally {
  setLoading(false); // Always update loading state
}
```

## Sync Queue Usage

When creating/updating/deleting records:

```typescript
import { addToSyncQueue, addDeleteToSyncQueue } from '../services/syncService';

// After INSERT
await db.runAsync('INSERT INTO journal_entries (...) VALUES (...)', [...]);
await addToSyncQueue(db, 'journal_entries', entryId, 'insert');

// After UPDATE
await db.runAsync('UPDATE journal_entries SET ... WHERE id = ?', [...]);
await addToSyncQueue(db, 'journal_entries', entryId, 'update');

// BEFORE DELETE (captures supabase_id)
await addDeleteToSyncQueue(db, 'journal_entries', entryId, userId);
await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [entryId]);
```

## Daily Check-Ins Pattern

The app has **morning intentions** and **evening pulse** check-ins:

```typescript
// Morning Check-In Fields
interface MorningCheckIn {
  check_in_type: 'morning';
  encrypted_intention: string; // User's intention for the day
  encrypted_mood: string; // 1-5 mood rating
}

// Evening Check-In Fields
interface EveningCheckIn {
  check_in_type: 'evening';
  encrypted_reflection: string; // Day reflection/wins/challenges
  encrypted_mood: string; // 1-5 mood rating
  encrypted_craving: string; // 0-10 craving intensity
}

// Both stored in daily_checkins table with check_in_date
```

**Check-In Flow**:

1. User opens app in morning → prompted for intention
2. User opens app in evening → prompted for reflection
3. Streak tracking: consecutive days with both check-ins completed

## Achievements & Milestones

**Milestone Days**: 1, 7, 14, 30, 60, 90, 180, 365 days clean

```typescript
// Milestone detection pattern
export function useCleanTime() {
  const { user } = useAuth();

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
  }, [user]);

  return cleanTime;
}

// Check for milestone achievements
const MILESTONES = [1, 7, 14, 30, 60, 90, 180, 365];
const isMilestone = MILESTONES.includes(cleanTime.days);
```

**Achievement Types**:

- `clean_time` - Sobriety milestones
- `journal_streak` - Consecutive days journaling
- `meeting_attendance` - Meeting participation
- `step_completion` - Completing steps

## Notifications & Background Tasks

### Permission Request Pattern

```typescript
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

// Request notification permissions (on first relevant action)
async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Request location permissions (for geofencing)
async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return false;

  // For geofencing, need background permission
  const bgStatus = await Location.requestBackgroundPermissionsAsync();
  return bgStatus.status === 'granted';
}
```

### Geofencing Setup

```typescript
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

const GEOFENCE_TASK = 'geofence-task';

// Define background task
TaskManager.defineTask(GEOFENCE_TASK, ({ data, error }) => {
  if (error) {
    logger.error('Geofence task error', error);
    return;
  }

  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType;
    region: Location.GeofencingRegion;
  };

  if (eventType === Location.GeofencingEventType.Enter) {
    // Schedule notification when entering meeting location
    Notifications.scheduleNotificationAsync({
      content: {
        title: "You're near a meeting!",
        body: `${region.identifier} - Stay strong!`,
      },
      trigger: null, // Immediate
    });
  }
});

// Register geofences
async function registerMeetingGeofence(meeting: {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}) {
  await Location.startGeofencingAsync(GEOFENCE_TASK, [
    {
      identifier: meeting.name,
      latitude: meeting.latitude,
      longitude: meeting.longitude,
      radius: 100, // 100 meters
      notifyOnEnter: true,
      notifyOnExit: true,
    },
  ]);
}
```

### Daily Reminder Scheduling

```typescript
// Schedule daily journaling reminder
async function scheduleDailyReminder(hour: number, minute: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to reflect',
      body: 'How was your day? Log a journal entry.',
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}
```

## Sponsor Sharing Pattern

**Sharing Flow**:

1. User selects journal entry to share
2. Confirmation dialog: "Share with [Sponsor Name]?"
3. Entry added to `shared_entries` table
4. Sponsor can read (but not edit) shared entry
5. User can unshare at any time

```typescript
// Share entry with sponsor
async function shareEntryWithSponsor(
  db: StorageAdapter,
  entryId: string,
  sponsorId: string,
  userId: string,
) {
  // Verify sponsorship exists and is accepted
  const sponsorship = await db.getFirstAsync<{ status: string }>(
    'SELECT status FROM sponsorships WHERE sponsee_id = ? AND sponsor_id = ? AND status = "accepted"',
    [userId, sponsorId],
  );

  if (!sponsorship) {
    throw new Error('No active sponsorship found');
  }

  // Add to shared_entries
  const shareId = generateUUID();
  await db.runAsync(
    'INSERT INTO shared_entries (id, entry_id, owner_id, shared_with_id, created_at) VALUES (?, ?, ?, ?, ?)',
    [shareId, entryId, userId, sponsorId, new Date().toISOString()],
  );

  // Queue for sync
  await addToSyncQueue(db, 'shared_entries', shareId, 'insert');
}
```

**RLS for Shared Entries**: See "Supabase RLS Policies" section above.

## Project Structure

Single-app structure (shared code lives inside mobile app):

```
Steps-to-recovery/
├── apps/
│   ├── mobile/          # Expo React Native app (MVP focus)
│   │   └── src/
│   │       └── shared/  # Shared types, constants, utils, stores
│   └── web/             # Expo web target (shared codebase, not a separate Next.js app)
└── eslint.config.js     # Root ESLint configuration
```

**Shared Code**: Import shared types/constants/stores from `@/shared` (alias for `apps/mobile/src/shared/`)

## Important Anti-Patterns to Avoid

1. ❌ **Never** store unencrypted sensitive data in SQLite, Supabase, or AsyncStorage
2. ❌ **Never** use AsyncStorage for tokens or encryption keys (use SecureStore)
3. ❌ **Never** use default exports (breaks tree-shaking, harder to refactor)
4. ❌ **Never** log full error objects (may contain sensitive data)
5. ❌ **Never** skip accessibility props (WCAG AAA required)
6. ❌ **Never** use `.then()` chains (use async/await)
7. ❌ **Never** use bare console.log/error (use logger from `utils/logger.ts`)

## Common Edge Cases

- **Offline mode**: All features must work offline - SQLite is source of truth
- **Encryption key missing**: Redirect to onboarding to generate new key
- **Supabase RLS denies**: Show graceful error (don't expose DB structure)
- **Date handling**: Use ISO strings consistently (timestamps stored as TEXT in SQLite)
- **Background sync conflicts**: Last-write-wins for MVP (no conflict resolution)
- **React 19 + Expo 54**: This codebase uses React 19, which is compatible with Expo SDK 54

## Testing

**Test Files**: Co-located with source code in `__tests__/` directories

### Unit Tests

```bash
# Run all tests
cd apps/mobile
npm test

# Run with coverage
npm run test:coverage

# Test encryption (critical)
npm run test:encryption

# Component tests in watch mode
npm run test:watch

# Run specific test file
npm test -- useJournalEntries
```

**Test Coverage Targets**:

| Module        | Target | Current |
| ------------- | ------ | ------- |
| Encryption    | 90%    | 94%     |
| Sync Service  | 70%    | 75%     |
| Journal Hooks | 90%    | 96%     |
| **Overall**   | 75%    | 75%+    |

**Test Coverage Focus**:

- Encryption/decryption functions (CRITICAL)
- Sync service logic
- React Query hooks (useJournalEntries, etc.)
- Database migrations
- Error boundaries

### E2E Tests (Maestro)

End-to-end tests are in `apps/mobile/.maestro/flows/`:

```bash
# Install Maestro
curl -fsSL "https://get.maestro.mobile.dev" | bash

# Run all E2E tests
cd apps/mobile
maestro test .maestro/flows/

# Run specific flow
maestro test .maestro/flows/onboarding.yaml
maestro test .maestro/flows/login.yaml
maestro test .maestro/flows/journal.yaml
maestro test .maestro/flows/daily-checkin.yaml

# Validate flow syntax
maestro test --dry-run .maestro/flows/onboarding.yaml
```

**E2E Test Flows**:

| Flow           | Description                                       | File                 |
| -------------- | ------------------------------------------------- | -------------------- |
| Onboarding     | Sign up → Set sobriety date → Complete onboarding | `onboarding.yaml`    |
| Login          | Existing user authentication                      | `login.yaml`         |
| Daily Check-in | Morning intention + Evening pulse                 | `daily-checkin.yaml` |
| Journal        | Create → Edit → Search entries                    | `journal.yaml`       |
| Step Work      | 12-step progress tracking                         | `step-work.yaml`     |
| Offline Sync   | Offline → Online sync test                        | `offline-sync.yaml`  |

**CI/CD**: E2E tests run automatically via GitHub Actions (`.github/workflows/e2e.yml`)

### Writing Tests

**Hook Testing Pattern** (React Native Testing Library):

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
jest.mock('../../../../contexts/DatabaseContext', () => ({
  useDatabase: () => ({ db: mockDb, isReady: true }),
}));

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Test hook
const { result } = renderHook(() => useJournalEntries(userId), {
  wrapper: createWrapper(),
});

await waitFor(() => expect(result.current.isLoading).toBe(false));
```

**Encryption Testing**:

```typescript
it('should encrypt and decrypt to return original text', async () => {
  const plaintext = 'Sensitive recovery journal entry';
  const encrypted = await encryptContent(plaintext);

  // Verify encrypted (not plaintext)
  expect(encrypted).not.toBe(plaintext);
  expect(encrypted).toContain(':'); // IV:ciphertext format

  // Decrypt and verify
  const decrypted = await decryptContent(encrypted);
  expect(decrypted).toBe(plaintext);
});
```

## Git Workflow

**Commit Format**: Conventional commits

```
feat: add journal entry sharing
fix: resolve sync queue deadlock
refactor: extract encryption logic
test: add coverage for step work hooks
```

**Commit Signatures**: Use GPG signing

**Co-authoring**: Include `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`

## Key Dependencies

- **Expo SDK**: ~54.0.0 (new architecture enabled)
- **React**: 19.1.0
- **React Native**: 0.81.5
- **TypeScript**: ~5.9.3 (strict mode enabled)
- **Supabase**: ^2.93.3
- **expo-sqlite**: ~16.0.10 (mobile storage)
- **expo-secure-store**: ~15.0.8 (encryption key storage)
- **@tanstack/react-query**: ^5.90.15 (server state)
- **zustand**: ^5.0.9 (client state)
- **crypto-js**: ^4.2.0 (AES-256-CBC encryption)
- **drizzle-orm**: ^0.45.1 (type-safe ORM layer)
- **uniwind**: ^1.3.0 (Tailwind CSS for React Native)
- **@shopify/flash-list**: 2.0.2 (performant list rendering)
- **zod**: ^4.3.6 (schema validation)
- **react-hook-form**: ^7.71.1 (form management)

## Platform-Specific Considerations

### Mobile (iOS/Android)

- Uses `expo-sqlite` for offline storage
- Uses `expo-secure-store` for encryption keys (device Keychain/Keystore)
- Uses `@react-native-community/netinfo` for network detection
- Uses React Native AppState for foreground/background detection

### Web

- Uses IndexedDB for offline storage
- Uses IndexedDB for secure key storage (encrypted with session token)
- Uses `navigator.onLine` + online/offline events for network detection
- Uses document `visibilitychange` for foreground/background detection

## Reference Documentation

### Core Documentation

- **Setup Guide**: `SETUP.md` - Complete setup and installation
- **Security Doc**: `SECURITY.md` - Security practices, key rotation, audit history
- **Architecture**: `docs/_bmad-output/planning-artifacts/architecture.md` - Detailed technical architecture

### Feature Implementation Guides (.claude/)

- `AppCoreClaude.md` - Core app structure, navigation, theming
- `OnboardingClaude.md` - Authentication & onboarding flow
- `JournalingClaude.md` - Encrypted journaling implementation
- `StepWorkClaude.md` - 12-step work tracking with guided questions
- `SponsorClaude.md` - Sponsor connections and selective sharing
- `NotificationsClaude.md` - Local notifications, geofencing, background tasks
- `ChallengesClaude.md` - Streaks, milestones, achievements

### Supabase Integration

- `supabase/migrations/*.sql` - Ordered cloud schema + RLS migrations

### Planning Artifacts (docs/\_bmad-output/planning-artifacts/)

- `prd.md` - Product requirements document
- `epics-and-stories.md` - User stories and epics
- `research/` - Domain research on recovery apps and privacy patterns

## Development Notes

- **Node.js**: >=20.0.0 required
- **Package Manager**: npm (workspaces configured)
- **Hot Reload**: Expo Fast Refresh enabled
- **Platform**: Develop on mobile-first, web is secondary target
- **IDE**: Configure TypeScript strict mode in your editor

## Performance Guidelines

- **Cold Start Target**: Sub-2-second load time (critical for emergency access during cravings)
- **List Rendering**: Use FlashList (@shopify/flash-list) for >10 items (NOT ScrollView)
- **Re-render Optimization**: Use React.memo + useCallback for heavy components
- **Database Operations**: Batch SQLite operations in transactions
- **Image Loading**: Lazy load, optimize sizes
- **Code Splitting**: Use React.lazy for feature screens

## Accessibility Standards

**Target**: WCAG AAA compliance (users may be in vulnerable states)

**Required for ALL Components**:

- `accessibilityLabel` - Clear description
- `accessibilityRole` - Semantic role (button, header, etc.)
- `accessibilityState` - Dynamic state (disabled, checked, busy)
- `accessibilityHint` - Additional guidance when action is non-obvious

**Additional Requirements**:

- Minimum touch target: 48x48dp
- Color contrast ratio: 7:1 (AAA)
- Support screen readers (TalkBack, VoiceOver)
- Support font scaling (up to 200%)

## BMAD Methodology

This project follows **Build-Measure-Analyze-Decide** methodology:

1. **Build**: Implement features iteratively, starting with MVP
2. **Measure**: Gather user feedback, monitor usage, track metrics
3. **Analyze**: Identify patterns, pain points, opportunities
4. **Decide**: Prioritize next features based on data

**Practical Application**:

- Start with simplest implementation (Step 1 only, not all 12 steps)
- Get user feedback before building complex features
- Iterate based on actual usage patterns
- Don't over-engineer for hypothetical requirements

## Troubleshooting Common Issues

### Encryption Key Missing

**Symptom**: App shows onboarding screen even when logged in
**Fix**: Encryption key was deleted. User must complete onboarding again (generates new key)
**Prevention**: Ensure logout cleanup doesn't run during normal app restart

### Sync Queue Growing Indefinitely

**Symptom**: `sync_queue` table has thousands of rows
**Fix**: Check network connectivity, verify Supabase credentials, check RLS policies
**Debug**: Query `SELECT * FROM sync_queue WHERE retry_count >= 3` to see failed items

### Web Database Not Persisting

**Symptom**: Data disappears on page reload (web only)
**Fix**: Check browser IndexedDB is enabled, verify session token is being stored
**Debug**: Check `secureStorage.initializeWithSession()` is called in AuthContext

### Geofencing Not Triggering

**Symptom**: No notifications when near meeting locations
**Fix**: Verify background location permission granted (not just "while using")
**Platform**: iOS requires "Always" permission, Android needs ACCESS_BACKGROUND_LOCATION
**Debug**: Check TaskManager logs for geofence events

### TypeScript Strict Mode Errors

**Symptom**: Build fails with type errors
**Fix**: Never use `any`, add explicit return types, handle null/undefined
**Common**: Database query results can be undefined, always check before using

## Build Process

### Environment Setup

Create `apps/mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SENTRY_DSN=optional-sentry-dsn
```

### EAS Build Profiles

| Profile              | Use Case               | Distribution         |
| -------------------- | ---------------------- | -------------------- |
| `development`        | Local development      | Internal (simulator) |
| `development-device` | Device testing         | Internal (physical)  |
| `preview`            | QA testing             | Internal testing     |
| `production`         | App Store / Play Store | Public stores        |

### Build Commands

```bash
cd apps/mobile

# Development builds
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview builds (for QA)
eas build --profile preview --platform ios
eas build --profile preview --platform android

# Production builds
eas build --profile production --platform ios
eas build --profile production --platform android

# Build all platforms
eas build --profile production --platform all
```

### Store Submission

```bash
# Submit iOS to App Store Connect
eas submit --platform ios --latest

# Submit Android to Play Console
eas submit --platform android --latest

# Submit both
eas submit --platform all --latest
```

### EAS Secrets Management

```bash
# Create secrets for production
cd apps/mobile

eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL \
  --value "https://your-project.supabase.co"

eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value "your-anon-key"

# List secrets
eas secret:list

# Delete secret
eas secret:delete --name SECRET_NAME
```

### Pre-Build Checklist

- [ ] `npm test` - All tests passing
- [ ] `npm run type-check` - 0 TypeScript errors
- [ ] `npm run lint` - 0 ESLint warnings
- [ ] `npm run doctor:toolchain` - Node/npm/workspace scripts verified
- [ ] `npm run doctor:aliases` - Alias maps consistent across tsconfig/Babel/Jest
- [ ] `npm run verify:strict` - Full strict gate passes locally
- [ ] `.env` file properly configured
- [ ] Version bumped in `package.json` and `app.json`
- [ ] Changelog updated
- [ ] EAS secrets configured (for production)

See the Pre-Build Checklist above for detailed steps.

---

## Sync Conflict Resolution

**Strategy**: Last-write-wins (MVP). The most recent `updated_at` timestamp wins during upsert.

**Sync Order**: Deletes are processed BEFORE inserts/updates to avoid foreign key conflicts.

**Synced Tables** (8 total): `journal_entries`, `step_work`, `daily_checkins`, `favorite_meetings`, `reading_reflections`, `weekly_reports`, `sponsor_connections`, `sponsor_shared_entries`

**Known Limitation**: No merge-level conflict resolution. If two devices edit the same record offline, the last sync wins and the other edit is lost. Future work: implement vector clocks or CRDT for critical data.

---

## Known Technical Debt

| Item                                        | Location                  | Priority |
| ------------------------------------------- | ------------------------- | -------- |
| Toast notification for offline mutation     | `useOfflineMutation.ts`   | Medium   |
| FTS optimization for >1000 encrypted items  | `useMemoryStore.ts`       | Medium   |
| Remote config integration for runtime theme | `runtime-theme/`          | Medium   |
| AI extraction refinement                    | `memoryExtractor.ts`      | Medium   |
| Share entry feature                         | `JournalEditorScreen.tsx` | Low      |
| Delete entry feature                        | `JournalEditorScreen.tsx` | Low      |
| Refetch implementation                      | `DailyReadingCard.tsx`    | Low      |
| Analytics event sending                     | `analytics.ts`            | Low      |
| Migrate motion token names                  | `motion.ts`               | Low      |

---

**Remember**: This is a recovery app handling sensitive personal data. Privacy and security are paramount. When in doubt, encrypt first, ask questions later.

**Support Mission**: Build with empathy. Users may be in crisis when they open this app. Every feature should be supportive, non-judgmental, and quick to access.
