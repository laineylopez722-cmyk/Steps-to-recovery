# Epics and Stories - Steps to Recovery
## Phases 3-6 Implementation Plan

**Generated:** 2026-01-01
**Based On:** sprint-status.md (Phase 2 Complete) + PRD.md + TODO Analysis
**Status:** Ready for Implementation
**BMAD Method:** Ultrathink Analysis Applied

---

## Executive Summary

With Phase 2 **production-ready** (101 tests passing, core features complete), this document outlines the roadmap from MVP to full-featured recovery companion. Each phase is designed to:

1. **Not break existing code** - Additive changes with backward compatibility
2. **Deliver user value incrementally** - Each phase is independently shippable
3. **Follow BMAD principles** - Clear stories, acceptance criteria, dependencies
4. **Prioritize privacy** - Every feature maintains zero-knowledge encryption

---

## Current State Analysis

### Completed (Phase 2 MVP)
- Authentication & Encryption (AES-256-CBC)
- Offline-First Sync Infrastructure (101 tests)
- Journaling (full CRUD, encrypted)
- Daily Check-ins (morning/evening)
- Clean Time Tracker with Milestones
- Emergency Support (crisis hotlines, breathing exercises)
- Steps Overview (progress tracking)
- Push Notifications (local reminders)
- Error Boundaries & Production Config

### Known Gaps (Technical Debt)
| Gap | Location | Impact | Priority |
|-----|----------|--------|----------|
| Sponsor feature incomplete | `SponsorScreen.tsx:106,173` | Feature missing | P1 |
| Notification navigation | `NotificationContext.tsx:99` | UX friction | P2 |
| Time picker for reminders | `NotificationSettingsScreen.tsx:200,224` | Customization limited | P2 |
| Daily check-ins not syncing | Supabase schema | Data loss risk | P0 |
| Delete operations not synced | syncService.ts | Data inconsistency | P1 |
| Sentry not integrated | `logger.ts:137` | No production monitoring | P2 |
| One-way sync only | syncService.ts | Multi-device unsupported | P3 |

---

## Phase 3: Production Polish & Gap Filling

**Priority**: P0 (CRITICAL - Technical Debt Resolution)
**Estimated Effort**: 18 hours
**Goal**: Fix all known gaps, achieve true production-readiness
**Risk Level**: LOW (additive changes, no breaking changes)

### Epic 3.1: Complete Sync Infrastructure

**Why First?** Data integrity is foundational. Users will lose trust if check-ins don't sync or deletes don't propagate.

#### Story 3.1.1: Add daily_checkins Table to Supabase

**User Story**: As a user, I want my daily check-ins backed up to the cloud so I don't lose my morning intentions and evening reflections.

**Acceptance Criteria**:
- [ ] Create `daily_checkins` table in Supabase with RLS
- [ ] Add RLS policy: `user_id = auth.uid()`
- [ ] Schema matches local SQLite structure
- [ ] Test: Create check-in offline → sync → verify in Supabase
- [ ] Update documentation with new schema

**Technical Implementation**:
```sql
-- Add to supabase-schema.sql
CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  check_in_type TEXT NOT NULL CHECK (check_in_type IN ('morning', 'evening')),
  check_in_date DATE NOT NULL,
  encrypted_intention TEXT,
  encrypted_reflection TEXT,
  encrypted_mood TEXT,
  encrypted_craving TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  client_id TEXT UNIQUE
);

ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their check-ins" ON daily_checkins
  FOR ALL USING (auth.uid() = user_id);
```

**Files to Modify**:
- `supabase-schema.sql` (add table)
- `apps/mobile/src/services/syncService.ts` (add syncDailyCheckIn function)

**Estimated Time**: 2 hours

---

#### Story 3.1.2: Implement Delete Sync Operations

**User Story**: As a user, when I delete a journal entry on my device, I want it deleted from cloud backup too.

**Acceptance Criteria**:
- [ ] Store `supabase_id` before local deletion
- [ ] Add delete operation to sync_queue with supabase_id
- [ ] syncService processes delete operations
- [ ] Supabase RLS allows DELETE for owner
- [ ] Test: Delete entry locally → sync → verify removed from Supabase
- [ ] Handle case: entry never synced (skip remote delete)

**Technical Implementation**:
```typescript
// In syncService.ts - add new function
export async function syncDeleteOperation(
  tableName: string,
  supabaseId: string,
  userId: string
): Promise<boolean> {
  if (!supabaseId) {
    // Entry was never synced to cloud - nothing to delete
    return true;
  }

  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', supabaseId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Delete sync failed', { tableName, supabaseId });
    return false;
  }
}
```

**Files to Modify**:
- `apps/mobile/src/services/syncService.ts` (add delete handling)
- `apps/mobile/src/features/journal/hooks/useJournalEntries.ts` (capture supabase_id before delete)

**Estimated Time**: 3 hours

---

#### Story 3.1.3: Enhance Sync Queue with Operation Types

**User Story**: As a developer, I want the sync queue to properly track insert/update/delete operations so each syncs correctly.

**Acceptance Criteria**:
- [ ] sync_queue.operation properly set for all operations
- [ ] processSyncQueue routes to correct sync function by operation type
- [ ] Delete operations processed before inserts (avoid foreign key issues)
- [ ] Logging shows operation type for debugging

**Technical Implementation**:
```typescript
// Enhanced processSyncQueue
export async function processSyncQueue(userId: string): Promise<SyncResult> {
  const queue = await getSyncQueueItems(userId);

  // Process deletes first to avoid conflicts
  const deletes = queue.filter(q => q.operation === 'delete');
  const upserts = queue.filter(q => q.operation !== 'delete');

  for (const item of deletes) {
    await syncDeleteOperation(item.table_name, item.supabase_id, userId);
  }

  for (const item of upserts) {
    // Existing insert/update logic
  }
}
```

**Estimated Time**: 2 hours

---

### Epic 3.2: Notification Enhancements

#### Story 3.2.1: Implement Notification Deep Linking

**User Story**: As a user, when I tap a notification, I want to go directly to the relevant screen.

**Acceptance Criteria**:
- [ ] Morning reminder → Opens Morning Intention screen
- [ ] Evening reminder → Opens Evening Pulse screen
- [ ] Milestone notification → Opens Home with celebration modal
- [ ] Works when app is in background or killed
- [ ] Graceful fallback to Home if route invalid

**Technical Implementation**:
```typescript
// In NotificationContext.tsx
const handleNotificationResponse = (response: NotificationResponse) => {
  const data = response.notification.request.content.data;

  switch (data.type) {
    case 'morning_checkin':
      navigation.navigate('MorningIntention');
      break;
    case 'evening_checkin':
      navigation.navigate('EveningPulse');
      break;
    case 'milestone':
      navigation.navigate('Home', { showCelebration: true });
      break;
    default:
      navigation.navigate('Home');
  }
};
```

**Files to Modify**:
- `apps/mobile/src/contexts/NotificationContext.tsx` (line 99 TODO)
- `apps/mobile/src/services/notificationService.ts` (add data payloads)

**Estimated Time**: 2 hours

---

#### Story 3.2.2: Add Time Picker for Notification Settings

**User Story**: As a user, I want to customize when I receive check-in reminders.

**Acceptance Criteria**:
- [ ] Time picker UI for morning reminder (default 9:00 AM)
- [ ] Time picker UI for evening reminder (default 9:00 PM)
- [ ] Selected times persist across app restarts
- [ ] Scheduled notifications update when time changes
- [ ] Accessible time picker (screen reader support)

**Technical Implementation**:
```typescript
// Use @react-native-community/datetimepicker
import DateTimePicker from '@react-native-community/datetimepicker';

const [morningTime, setMorningTime] = useState(new Date().setHours(9, 0));
const [showMorningPicker, setShowMorningPicker] = useState(false);

// In render
{showMorningPicker && (
  <DateTimePicker
    value={new Date(morningTime)}
    mode="time"
    is24Hour={false}
    onChange={(event, date) => {
      setShowMorningPicker(false);
      if (date) {
        setMorningTime(date.getTime());
        rescheduleNotification('morning', date);
      }
    }}
  />
)}
```

**Dependencies**:
- Install: `npx expo install @react-native-community/datetimepicker`

**Files to Modify**:
- `apps/mobile/src/features/settings/screens/NotificationSettingsScreen.tsx` (lines 200, 224)

**Estimated Time**: 3 hours

---

### Epic 3.3: Production Monitoring

#### Story 3.3.1: Integrate Sentry Error Tracking

**User Story**: As a developer, I want to receive error reports from production so I can fix crashes quickly.

**Acceptance Criteria**:
- [ ] Sentry SDK initialized in App.tsx
- [ ] Errors from ErrorBoundary sent to Sentry
- [ ] Sensitive data scrubbed from error reports
- [ ] Source maps uploaded for readable stack traces
- [ ] Test: Trigger error → verify appears in Sentry dashboard

**Technical Implementation**:
```typescript
// In App.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  beforeSend(event) {
    // Scrub sensitive data
    if (event.request?.data) {
      event.request.data = '[REDACTED]';
    }
    return event;
  },
});

// In logger.ts (line 137)
if (!__DEV__ && Sentry) {
  Sentry.captureException(sanitizeError(error));
}
```

**Dependencies**:
- Already configured in app.json, just needs DSN

**Files to Modify**:
- `apps/mobile/src/utils/logger.ts` (integrate Sentry)
- `App.tsx` (initialize Sentry)
- `.env` (add EXPO_PUBLIC_SENTRY_DSN)

**Estimated Time**: 2 hours

---

### Epic 3.4: Complete Sponsor Feature UI

#### Story 3.4.1: Implement Sponsor Invitation Flow

**User Story**: As a sponsee, I want to invite my sponsor to connect so we can share my progress.

**Acceptance Criteria**:
- [ ] "Invite Sponsor" button generates unique invite code
- [ ] Invite code shareable via text/email
- [ ] Sponsor can enter code to connect
- [ ] Connection stored locally (Phase 5 will add cloud sync)
- [ ] Graceful handling if sponsor declines/code expires

**Technical Notes**:
This is UI-only for Phase 3. Full encrypted sharing comes in Phase 5.

**Files to Modify**:
- `apps/mobile/src/features/sponsor/screens/SponsorScreen.tsx` (line 106)

**Estimated Time**: 2 hours

---

#### Story 3.4.2: Create Shared Entries View (Placeholder)

**User Story**: As a sponsee, I want to see which entries I've shared with my sponsor.

**Acceptance Criteria**:
- [ ] "Shared Entries" section visible when sponsor connected
- [ ] Shows placeholder: "Sharing feature coming soon"
- [ ] UI structure ready for Phase 5 implementation
- [ ] No breaking changes to existing journal structure

**Files to Modify**:
- `apps/mobile/src/features/sponsor/screens/SponsorScreen.tsx` (line 173)

**Estimated Time**: 1 hour

---

## Phase 3 Implementation Sequence

**Week 1: Sync Completion** (7 hours)
- Day 1: Story 3.1.1 (daily_checkins table)
- Day 2: Story 3.1.2 (delete sync)
- Day 3: Story 3.1.3 (operation types)

**Week 2: Notifications & Monitoring** (7 hours)
- Day 1: Story 3.2.1 (deep linking)
- Day 2: Story 3.2.2 (time picker)
- Day 3: Story 3.3.1 (Sentry integration)

**Week 3: Sponsor UI** (4 hours)
- Day 1: Story 3.4.1 (invitation flow)
- Day 1: Story 3.4.2 (shared entries placeholder)

---

## Phase 4: Step Work Deep Dive

**Priority**: P1 (HIGH - Core Feature Expansion)
**Estimated Effort**: 24 hours
**Goal**: Transform Step 1 overview into comprehensive step work experience
**Risk Level**: MEDIUM (new screens, new database operations)

### Epic 4.1: Step 1 Full Questionnaire

#### Story 4.1.1: Create Step Work Question Bank

**User Story**: As a user working Step 1, I want access to all reflection questions so I can do thorough step work.

**Acceptance Criteria**:
- [ ] 15 questions for Step 1 (curated from AA literature)
- [ ] Questions stored in constants file (not database)
- [ ] Each question has: number, text, category (powerlessness/unmanageability)
- [ ] Questions match PRD specifications

**Technical Implementation**:
```typescript
// packages/shared/src/constants/stepQuestions.ts
export const STEP_1_QUESTIONS = [
  {
    number: 1,
    category: 'powerlessness',
    text: 'When did you first realize your substance use was a problem?',
    guidance: 'Be specific about the moment or period when you recognized the issue.',
  },
  {
    number: 2,
    category: 'powerlessness',
    text: 'What attempts have you made to control your using? What happened?',
    guidance: 'List specific strategies you tried and their outcomes.',
  },
  // ... 13 more questions
];
```

**Estimated Time**: 2 hours

---

#### Story 4.1.2: Create Step Work Editor Screen

**User Story**: As a user, I want to answer step work questions one at a time with my responses encrypted.

**Acceptance Criteria**:
- [ ] Single question displayed at a time
- [ ] Large text area for freeform answers
- [ ] Progress indicator: "Question 3 of 15"
- [ ] Navigation: Previous, Next, Save & Exit
- [ ] Answers encrypted before storage
- [ ] Auto-save draft every 30 seconds
- [ ] Resume from last answered question

**Technical Implementation**:
```typescript
// apps/mobile/src/features/steps/screens/StepWorkEditorScreen.tsx
export function StepWorkEditorScreen({ route }: Props) {
  const { stepNumber } = route.params;
  const questions = STEP_1_QUESTIONS;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');

  const saveAnswer = async () => {
    const encrypted = await encryptContent(answer);
    await saveStepWorkAnswer(stepNumber, currentIndex + 1, encrypted);
  };

  // Auto-save draft
  useEffect(() => {
    const timer = setInterval(saveAnswer, 30000);
    return () => clearInterval(timer);
  }, [answer]);
}
```

**Files to Create**:
- `apps/mobile/src/features/steps/screens/StepWorkEditorScreen.tsx`

**Estimated Time**: 6 hours

---

#### Story 4.1.3: Create Step Work Review Screen

**User Story**: As a user, I want to review all my Step 1 answers so I can discuss them with my sponsor.

**Acceptance Criteria**:
- [ ] All 15 questions displayed with user's answers
- [ ] Answers decrypted for display
- [ ] Edit button on each answer → navigates to editor at that question
- [ ] Progress summary: "12 of 15 questions answered"
- [ ] Mark step as complete when all questions answered

**Files to Create**:
- `apps/mobile/src/features/steps/screens/StepWorkReviewScreen.tsx`

**Estimated Time**: 4 hours

---

#### Story 4.1.4: Add Step Work Export (Encrypted PDF)

**User Story**: As a user, I want to export my Step 1 answers as a PDF to share with my sponsor.

**Acceptance Criteria**:
- [ ] "Export to PDF" button on review screen
- [ ] PDF contains all questions and answers
- [ ] PDF is encrypted with user's key (optional password)
- [ ] Share sheet allows sending via message/email
- [ ] No unencrypted data leaves device

**Dependencies**:
- Install: `npx expo install expo-print expo-sharing`

**Estimated Time**: 4 hours

---

### Epic 4.2: Steps 2-12 Preview

#### Story 4.2.1: Create Locked Steps View

**User Story**: As a user, I want to see what Steps 2-12 contain so I'm motivated to continue.

**Acceptance Criteria**:
- [ ] Steps 2-12 shown with lock icon
- [ ] Each step shows: title, description, "X questions"
- [ ] Tapping locked step shows modal: "Coming in next update"
- [ ] AA step text displayed (properly attributed)

**Estimated Time**: 3 hours

---

#### Story 4.2.2: Add Step Completion Achievements

**User Story**: As a user, I want to earn achievements for completing step work.

**Acceptance Criteria**:
- [ ] "Step 1 Started" achievement (when first question answered)
- [ ] "Step 1 Completed" achievement (when all questions answered)
- [ ] Achievement modal with confetti
- [ ] Achievements visible in Settings → Achievements

**Estimated Time**: 2 hours

---

### Epic 4.3: useStepWork Hook

#### Story 4.3.1: Create Step Work Data Hook

**User Story**: As a developer, I want a reusable hook for step work CRUD operations.

**Acceptance Criteria**:
- [ ] useStepWork hook with: getAnswers, saveAnswer, completeStep
- [ ] Integrates with sync queue
- [ ] Handles encryption/decryption
- [ ] Returns loading/error states
- [ ] Unit tested

**Technical Implementation**:
```typescript
// apps/mobile/src/features/steps/hooks/useStepWork.ts
export function useStepWork(stepNumber: number) {
  const { session } = useAuth();
  const { db } = useDatabase();

  const getAnswers = useQuery({
    queryKey: ['stepWork', stepNumber],
    queryFn: async () => {
      const answers = await db.getAllAsync(
        'SELECT * FROM step_work WHERE step_number = ? AND user_id = ?',
        [stepNumber, session?.user?.id]
      );
      return Promise.all(answers.map(async (a) => ({
        ...a,
        answer: await decryptContent(a.encrypted_answer),
      })));
    },
  });

  const saveAnswer = useMutation({
    mutationFn: async ({ questionNumber, answer }) => {
      const encrypted = await encryptContent(answer);
      await db.runAsync(
        `INSERT OR REPLACE INTO step_work
         (id, user_id, step_number, question_number, encrypted_answer, updated_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [uuid(), session?.user?.id, stepNumber, questionNumber, encrypted, new Date().toISOString()]
      );
      await addToSyncQueue('step_work', 'upsert', ...);
    },
  });

  return { answers: getAnswers.data, saveAnswer, isLoading: getAnswers.isLoading };
}
```

**Estimated Time**: 3 hours

---

## Phase 5: Sponsor Connections

**Priority**: P2 (MEDIUM - Social Feature)
**Estimated Effort**: 32 hours
**Goal**: Enable secure, encrypted communication between sponsee and sponsor
**Risk Level**: HIGH (cryptographic key exchange, new data flows)

### Epic 5.1: Secure Sponsor Pairing

#### Story 5.1.1: Generate Secure Invite Code

**User Story**: As a sponsee, I want to generate a secure invite code that only my sponsor can use.

**Acceptance Criteria**:
- [ ] Generate cryptographically random 8-character code
- [ ] Code expires after 24 hours
- [ ] Code single-use (invalidated after first use)
- [ ] Code stored locally until used
- [ ] No sensitive data in code itself

**Ultrathink Security Analysis**:
```
THREAT: Invite code interception
MITIGATION: Code is just identifier, actual key exchange happens after pairing

THREAT: Brute force code guessing
MITIGATION: 8 alphanumeric chars = 2.8 trillion combinations + 24hr expiry + rate limiting

THREAT: Code reuse
MITIGATION: Mark as consumed immediately upon first use
```

**Estimated Time**: 4 hours

---

#### Story 5.1.2: Implement Sponsor Connection Flow

**User Story**: As a sponsor, I want to enter an invite code to connect with my sponsee.

**Acceptance Criteria**:
- [ ] Enter code screen with validation
- [ ] Verify code matches existing invite
- [ ] Exchange public keys for encrypted sharing
- [ ] Store connection in local database
- [ ] Both devices confirm connection

**Technical Deep Dive**:
```typescript
// Key exchange using asymmetric encryption
// 1. Sponsee generates keypair, stores private key in SecureStore
// 2. Sponsee shares public key with invite code (Base64 encoded)
// 3. Sponsor generates their keypair
// 4. Sponsor encrypts their public key with sponsee's public key
// 5. Connection established - both can encrypt messages for each other
```

**Estimated Time**: 8 hours

---

### Epic 5.2: Encrypted Entry Sharing

#### Story 5.2.1: Select Entries to Share

**User Story**: As a sponsee, I want to choose which journal entries to share with my sponsor.

**Acceptance Criteria**:
- [ ] Multi-select mode in journal list
- [ ] "Share with Sponsor" action
- [ ] Entries re-encrypted with sponsor's public key
- [ ] Original entries unchanged
- [ ] Shared status indicator on entries

**Estimated Time**: 6 hours

---

#### Story 5.2.2: View Shared Entries (Sponsor)

**User Story**: As a sponsor, I want to view entries my sponsee has shared with me.

**Acceptance Criteria**:
- [ ] "Sponsees" tab shows connected sponsees
- [ ] Each sponsee shows shared entries
- [ ] Entries decrypted with sponsor's private key
- [ ] Read-only view (sponsor cannot edit)
- [ ] Pull-to-refresh for new shared entries

**Estimated Time**: 6 hours

---

### Epic 5.3: Sponsor Communication

#### Story 5.3.1: Add Comments to Shared Entries

**User Story**: As a sponsor, I want to leave supportive comments on shared entries.

**Acceptance Criteria**:
- [ ] Comment input on shared entry view
- [ ] Comments encrypted with sponsee's public key
- [ ] Sponsee sees comments in their journal
- [ ] Notification when sponsor comments

**Estimated Time**: 8 hours

---

## Phase 6: Analytics & Insights

**Priority**: P3 (LOW - Enhancement)
**Estimated Effort**: 20 hours
**Goal**: Help users identify patterns and track progress visually
**Risk Level**: LOW (read-only analysis of existing data)

### Epic 6.1: Mood Analytics Dashboard

#### Story 6.1.1: Create Analytics Screen

**User Story**: As a user, I want to see my mood patterns over time so I can identify triggers.

**Acceptance Criteria**:
- [ ] Line chart showing mood over past 30 days
- [ ] Craving intensity overlay
- [ ] Average mood indicator
- [ ] Trend detection (improving/declining/stable)
- [ ] All data stays on device (not synced)

**Technical Notes**:
```typescript
// Use Victory Native for charts
import { VictoryLine, VictoryChart, VictoryTheme } from 'victory-native';

// Query check-ins for chart data
const moodData = checkIns.map(c => ({
  x: new Date(c.created_at),
  y: decryptContent(c.encrypted_mood),
}));
```

**Dependencies**:
- Install: `npx expo install victory-native react-native-svg`

**Estimated Time**: 8 hours

---

#### Story 6.1.2: Trigger Pattern Analysis

**User Story**: As a user, I want to see which tags correlate with high cravings.

**Acceptance Criteria**:
- [ ] Bar chart showing tags vs average craving level
- [ ] Highlight "high-risk" tags (avg craving > 7)
- [ ] Based on journal entry tags
- [ ] Privacy: Analysis runs locally only

**Estimated Time**: 4 hours

---

### Epic 6.2: Progress Reports

#### Story 6.2.1: Generate Weekly Progress Report

**User Story**: As a user, I want a weekly summary of my recovery progress.

**Acceptance Criteria**:
- [ ] Auto-generate every Sunday
- [ ] Shows: clean days, check-in streak, journal count, mood trend
- [ ] Saved locally, viewable in app
- [ ] Optional: Share as image (no sensitive content)

**Estimated Time**: 4 hours

---

#### Story 6.2.2: Milestone Celebration History

**User Story**: As a user, I want to see all milestones I've achieved.

**Acceptance Criteria**:
- [ ] Timeline view of milestones
- [ ] Shows: date earned, milestone type
- [ ] Shareable milestone cards
- [ ] Accessible: Screen reader announces achievements

**Estimated Time**: 4 hours

---

## Dependency Graph

```
Phase 3 (Production Polish)
    ├── Story 3.1.1 (daily_checkins table)
    │       └── Story 3.1.2 (delete sync) depends on schema
    │               └── Story 3.1.3 (operation types)
    ├── Story 3.2.1 (notification deep linking)
    │       └── Story 3.2.2 (time picker)
    └── Story 3.3.1 (Sentry) - independent

Phase 4 (Step Work)
    ├── Story 4.1.1 (question bank) - FIRST
    │       └── Story 4.1.2 (editor) depends on questions
    │               └── Story 4.1.3 (review) depends on editor
    │                       └── Story 4.1.4 (export) depends on review
    ├── Story 4.3.1 (hook) - can parallel with editor
    └── Story 4.2.1-2 (locked steps, achievements) - independent

Phase 5 (Sponsor)
    ├── Story 5.1.1 (invite code) - FIRST
    │       └── Story 5.1.2 (connection flow)
    │               └── Story 5.2.1 (select entries)
    │                       └── Story 5.2.2 (view shared)
    │                               └── Story 5.3.1 (comments)

Phase 6 (Analytics)
    └── All stories independent, can run in parallel
```

---

## Risk Assessment & Mitigation

### High Risk

**Risk 1: Key Exchange Security (Phase 5)**
- **Likelihood**: Medium
- **Impact**: Critical (compromises encryption)
- **Mitigation**:
  - Use proven library (TweetNaCl.js via tweetnacl-sealedbox-js)
  - Security audit before release
  - Key exchange over TLS only
  - Test on multiple devices before launch

**Risk 2: Sync Conflicts with Deletes (Phase 3)**
- **Likelihood**: Medium
- **Impact**: High (data inconsistency)
- **Mitigation**:
  - Process deletes first in sync queue
  - Soft-delete first, hard-delete on sync confirmation
  - Log all sync operations for debugging

### Medium Risk

**Risk 3: Step Work Data Loss**
- **Likelihood**: Low
- **Impact**: High (user loses important reflections)
- **Mitigation**:
  - Auto-save every 30 seconds
  - Confirm before navigating away from unsaved work
  - Multiple SQLite transactions (no single point of failure)

**Risk 4: Analytics Performance**
- **Likelihood**: Medium
- **Impact**: Medium (slow UI)
- **Mitigation**:
  - Limit chart data to 30 days
  - Memoize expensive calculations
  - Use Web Workers if needed (Expo supports)

### Low Risk

**Risk 5: Notification Deep Linking Edge Cases**
- **Likelihood**: Low
- **Impact**: Low (user lands on wrong screen)
- **Mitigation**:
  - Fallback to Home screen
  - Test on iOS and Android

---

## Success Metrics

### Phase 3 Success Criteria
- [ ] Zero data loss on sync (including deletes)
- [ ] All TODOs in codebase resolved
- [ ] Sentry capturing errors in production
- [ ] Notifications deep link correctly

### Phase 4 Success Criteria
- [ ] >25% of users start Step 1 questionnaire
- [ ] >15% of users complete all 15 questions
- [ ] PDF export works on iOS and Android
- [ ] Auto-save prevents data loss

### Phase 5 Success Criteria
- [ ] Key exchange completes in <5 seconds
- [ ] Shared entries readable by sponsor only
- [ ] Zero security vulnerabilities in audit
- [ ] <1% of pairing attempts fail

### Phase 6 Success Criteria
- [ ] Charts render in <500ms
- [ ] Users check analytics 2+ times/week
- [ ] Progress reports auto-generate correctly

---

## Recommended Implementation Order

### Sprint 1 (2 weeks): Phase 3 - Production Polish
- **Goal**: Fix all technical debt, achieve true production-readiness
- **Stories**: 3.1.1 → 3.1.2 → 3.1.3 → 3.2.1 → 3.2.2 → 3.3.1 → 3.4.1 → 3.4.2
- **Deliverable**: Production deployment with full sync + monitoring

### Sprint 2 (3 weeks): Phase 4 - Step Work
- **Goal**: Transform step overview into full step work experience
- **Stories**: 4.1.1 → 4.3.1 → 4.1.2 → 4.1.3 → 4.1.4 → 4.2.1 → 4.2.2
- **Deliverable**: Complete Step 1 experience with export

### Sprint 3 (4 weeks): Phase 5 - Sponsor Connections
- **Goal**: Enable secure sponsor-sponsee communication
- **Stories**: 5.1.1 → 5.1.2 → 5.2.1 → 5.2.2 → 5.3.1
- **Deliverable**: Full sponsor connection and sharing

### Sprint 4 (2 weeks): Phase 6 - Analytics
- **Goal**: Provide insights and progress visualization
- **Stories**: 6.1.1 → 6.1.2 → 6.2.1 → 6.2.2
- **Deliverable**: Complete analytics dashboard

---

## Code Integrity Principles

To ensure we don't break existing code:

1. **Additive Only**: New features add screens/hooks, don't modify core logic
2. **Feature Flags**: New features can be disabled if issues arise
3. **Type Safety**: All new code uses TypeScript strict mode
4. **Test Coverage**: New features include unit tests (target 80%)
5. **Backward Compatibility**: Database migrations only add columns, never remove
6. **Incremental Rollout**: EAS Updates for gradual deployment

---

## Next Steps

1. **Immediate**: Start Phase 3, Story 3.1.1 (daily_checkins table)
   - Command: Create Supabase migration for daily_checkins

2. **Create**: Update sprint-status.md for Phase 3 sprint

3. **Review**: Prioritize stories with stakeholder

4. **Begin**: Implementation following BMAD dev-story workflow

---

**Document Status**: Complete and ready for implementation
**Total Stories**: 22 stories across 4 phases
**Total Estimated Effort**: 94 hours (~6-8 weeks full-time)
**Ready for**: Sprint planning with `/bmad:bmm:workflows:dev-story`
