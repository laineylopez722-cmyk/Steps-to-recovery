# Epics and Stories - Steps to Recovery
## Phase 2 Implementation

**Generated:** 2025-12-31
**Based On:** prd.md + architecture.md + PHASE0_VALIDATION.md
**Status:** Ready for Implementation

---

## Epic Overview

Based on the Phase 0 validation finding that **the app is 85% feature-complete**, the remaining work focuses on:

1. **Epic 1: Offline-First Sync Infrastructure** (CRITICAL PATH) - 14 hours
2. **Epic 2: Testing & Quality Assurance** - 24 hours
3. **Epic 3: Push Notifications** - 8 hours
4. **Epic 4: Production Configuration** - 6 hours
5. **Epic 5: Documentation & Deployment** - 6 hours

**Total Estimated Effort**: 58 hours (~2 weeks full-time, 6 weeks part-time)

---

# Epic 1: Offline-First Sync Infrastructure

**Priority**: P0 (CRITICAL - blocks production release)
**Dependencies**: Supabase schema deployed ✅
**Estimated Effort**: 14 hours
**Goal**: Implement real Supabase sync to enable cloud backup while maintaining offline-first architecture

## Story 1.1: Create SyncService Core

**User Story**:
As a user, I want my journal entries and progress automatically backed up to the cloud so I don't lose my data if I lose my device.

**Description**:
Create `apps/mobile/src/services/syncService.ts` with functions to process the sync queue and upload encrypted data to Supabase.

**Acceptance Criteria**:
- [x] `processSyncQueue()` function processes all pending items from sync_queue table
- [x] `syncJournalEntry(id)` encrypts and uploads single journal entry to Supabase
- [x] `syncDailyCheckIn(id)` encrypts and uploads single check-in
- [x] `syncStepWork(id)` encrypts and uploads single step answer
- [x] Batch processing implemented (max 50 items per batch to avoid rate limits)
- [x] Retry logic implemented (max 3 attempts with exponential backoff: 1s, 2s, 4s)
- [x] Privacy-safe error logging (no sensitive data in logs)
- [x] Updates local sync_status from 'pending' to 'synced' on success
- [x] Handles network errors gracefully without data loss

**Technical Implementation**:
```typescript
// apps/mobile/src/services/syncService.ts

import { supabase } from '../lib/supabase';
import { encryptContent } from '../utils/encryption';
import { logger } from '../utils/logger';

interface SyncQueueItem {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'insert' | 'update' | 'delete';
  created_at: string;
}

export async function processSyncQueue(userId: string): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  // 1. Fetch pending items from sync_queue (limit 50)
  // 2. Group by table_name
  // 3. For each group, call appropriate sync function
  // 4. Handle errors, track successes
  // 5. Return summary
}

export async function syncJournalEntry(
  entryId: string,
  userId: string,
  retryCount = 0
): Promise<boolean> {
  try {
    // 1. Fetch entry from local SQLite
    // 2. Verify it's encrypted (title/body should contain ':')
    // 3. Upsert to Supabase journal_entries
    // 4. On success, update local sync_status = 'synced'
    // 5. Remove from sync_queue
    return true;
  } catch (error) {
    logger.error('Sync failed', { entryId, attempt: retryCount + 1 });
    if (retryCount < 3) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount)));
      return syncJournalEntry(entryId, userId, retryCount + 1);
    }
    return false;
  }
}

// Similar functions for syncDailyCheckIn(), syncStepWork()
```

**Testing Plan**:
1. Create 3 journal entries offline (airplane mode)
2. Verify 3 items in sync_queue
3. Enable network
4. Call `processSyncQueue(userId)`
5. Verify entries in Supabase journal_entries table
6. Verify local sync_status = 'synced'
7. Verify sync_queue empty

**Files to Create**:
- `apps/mobile/src/services/syncService.ts` (new, ~300 lines)

**Files to Reference**:
- `apps/mobile/src/utils/encryption.ts` (existing - use encryptContent)
- `apps/mobile/src/lib/supabase.ts` (existing - Supabase client)
- `apps/mobile/src/utils/database.ts` (existing - SQLite schema)

**Estimated Time**: 4 hours

---

## Story 1.2: Enhance SyncContext with Real Implementation

**User Story**:
As a user, I want to see sync status and manually trigger sync so I know my data is backed up.

**Description**:
Replace placeholder SyncContext with real sync orchestration that calls syncService and tracks sync state.

**Acceptance Criteria**:
- [x] `triggerSync()` calls `syncService.processSyncQueue()`
- [x] `isSyncing` state updates during sync operation
- [x] `lastSyncTime` timestamp updates on successful sync
- [x] `pendingCount` reflects number of items in sync_queue
- [x] `error` state captures and displays sync failures
- [x] Background sync every 5 minutes when app is active
- [x] Foreground sync when app returns from background
- [x] Respects network status (no sync when offline)
- [x] Cleanup listeners on unmount

**Technical Implementation**:
```typescript
// apps/mobile/src/contexts/SyncContext.tsx

import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { processSyncQueue } from '../services/syncService';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const { session } = useAuth();

  // Network status listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return unsubscribe;
  }, []);

  // AppState listener for foreground sync
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && isOnline && !isSyncing) {
        triggerSync();
      }
    });
    return () => subscription.remove();
  }, [isOnline, isSyncing]);

  // Periodic sync (every 5 minutes)
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      if (!isSyncing) triggerSync();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isOnline, isSyncing]);

  const triggerSync = useCallback(async () => {
    if (!session?.user?.id || !isOnline) return;

    setIsSyncing(true);
    setError(null);

    try {
      const result = await processSyncQueue(session.user.id);
      setLastSyncTime(new Date());
      setPendingCount(0);
      logger.info('Sync completed', { synced: result.synced });
    } catch (err) {
      setError('Sync failed. Will retry automatically.');
      logger.error('Sync error', { error: err });
    } finally {
      setIsSyncing(false);
    }
  }, [session, isOnline]);

  // ... rest of context
}
```

**Dependencies**:
- Story 1.1 must be complete (syncService.ts exists)
- Install: `npm install @react-native-community/netinfo`

**Testing Plan**:
1. Create 3 journal entries offline
2. Verify `pendingCount = 3`
3. Enable network
4. Tap "Sync Now" button
5. Verify `isSyncing = true` during sync
6. Verify `lastSyncTime` updates
7. Verify `pendingCount = 0` after sync
8. Background app → Foreground → Verify auto-sync triggered

**Files to Modify**:
- `apps/mobile/src/contexts/SyncContext.tsx` (replace lines 30-45 placeholder logic)

**Estimated Time**: 3 hours

---

## Story 1.3: Add Sync Status UI Indicator

**User Story**:
As a user, I want to see if my data is synced or pending so I know my progress is backed up.

**Description**:
Create SyncStatusIndicator component showing sync state in home screen header.

**Acceptance Criteria**:
- [x] Shows "Synced" with green checkmark when pendingCount = 0 and lastSyncTime < 1 hour ago
- [x] Shows "Pending sync (X)" with yellow dot when pendingCount > 0
- [x] Shows "Syncing..." with spinner when isSyncing = true
- [x] Shows "Sync error" with red warning icon when error !== null
- [x] Shows "Offline" with gray cloud icon when !isOnline
- [x] Tappable to trigger manual sync
- [x] Displays last sync time in human-readable format ("2 min ago")
- [x] Accessible (screen reader announces status)

**Technical Implementation**:
```typescript
// apps/mobile/src/features/home/components/SyncStatusIndicator.tsx

export function SyncStatusIndicator() {
  const { isSyncing, lastSyncTime, pendingCount, error, isOnline, triggerSync } = useSync();

  const getStatus = () => {
    if (!isOnline) return { icon: 'cloud-offline', color: 'gray', text: 'Offline' };
    if (isSyncing) return { icon: 'sync', color: 'blue', text: 'Syncing...' };
    if (error) return { icon: 'alert', color: 'red', text: 'Sync error' };
    if (pendingCount > 0) return { icon: 'clock', color: 'orange', text: `Pending (${pendingCount})` };
    return { icon: 'check-circle', color: 'green', text: 'Synced' };
  };

  const status = getStatus();
  const lastSyncText = lastSyncTime ? formatDistanceToNow(lastSyncTime) : 'Never';

  return (
    <TouchableOpacity onPress={triggerSync} accessibilityLabel={`Sync status: ${status.text}`}>
      <View style={styles.container}>
        <Icon name={status.icon} size={20} color={status.color} />
        <Text style={styles.text}>{status.text}</Text>
        <Text style={styles.subtitle}>{lastSyncText}</Text>
      </View>
    </TouchableOpacity>
  );
}
```

**Testing Plan**:
1. View home screen with network enabled → See "Synced" with timestamp
2. Create entry offline → See "Pending sync (1)"
3. Tap indicator → See "Syncing..."
4. After sync → See "Synced" with updated timestamp
5. Disable network → See "Offline"

**Files to Create**:
- `apps/mobile/src/features/home/components/SyncStatusIndicator.tsx` (new, ~150 lines)

**Files to Modify**:
- `apps/mobile/src/features/home/screens/HomeScreen.tsx` (add <SyncStatusIndicator /> to header)

**Estimated Time**: 2 hours

---

## Story 1.4: Implement Background Sync

**User Story**:
As a user, I want my data to sync automatically without me having to remember, so my backup is always current.

**Description**:
Add AppState listener and periodic sync interval to SyncContext.

**Acceptance Criteria**:
- [x] Sync triggers when app comes to foreground (after being backgrounded)
- [x] Sync triggers every 5 minutes when app is active
- [x] Sync only when online (NetInfo check)
- [x] Listeners cleaned up on unmount (no memory leaks)
- [x] No sync if already syncing (prevent concurrent syncs)

**Technical Implementation**:
Already covered in Story 1.2 above (AppState + setInterval)

**Dependencies**:
- Story 1.2 must be complete

**Testing Plan**:
1. Create journal entry
2. Press home button (background app)
3. Wait 5 seconds
4. Reopen app (foreground)
5. Verify sync triggered automatically
6. Check Supabase → Entry present

**Files to Modify**:
- `apps/mobile/src/contexts/SyncContext.tsx` (add AppState + interval listeners - already in Story 1.2)

**Estimated Time**: 2 hours (included in Story 1.2)

---

## Story 1.5: Implement Conflict Resolution

**User Story**:
As a user, if I edit the same entry on two devices, I want the most recent version to be kept so I don't lose my latest thoughts.

**Description**:
Add conflict resolution logic using last-write-wins strategy based on updated_at timestamps.

**Acceptance Criteria**:
- [x] Compare local.updated_at vs remote.updated_at
- [x] Keep version with newer updated_at timestamp
- [x] Handle deletions (track in sync_queue with operation='delete')
- [x] Download remote changes for data recovery (if remote newer)
- [x] No data loss on conflicts
- [x] User notified of conflicts via toast (optional)
- [x] Conflict resolution logged (without sensitive data)

**Technical Implementation**:
```typescript
// In syncService.ts

async function syncJournalEntry(entryId: string, userId: string) {
  // 1. Fetch local entry
  const local = await getLocalEntry(entryId);

  // 2. Try to fetch remote entry
  const { data: remote } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', entryId)
    .single();

  // 3. Conflict resolution
  if (remote) {
    const localTime = new Date(local.updated_at).getTime();
    const remoteTime = new Date(remote.updated_at).getTime();

    if (remoteTime > localTime) {
      // Remote is newer - download and update local
      await updateLocalEntry(entryId, remote);
      logger.info('Conflict resolved: remote newer', { entryId });
      return true;
    }
  }

  // 4. Local is newer or no remote - upload
  await supabase
    .from('journal_entries')
    .upsert({
      id: local.id,
      user_id: userId,
      title: local.title, // Already encrypted
      content: local.body, // Already encrypted
      mood: local.mood,
      tags: local.tags,
      created_at: local.created_at,
      updated_at: local.updated_at
    });

  return true;
}
```

**Testing Plan**:
1. Create entry on device A
2. Sync to cloud
3. Manually edit in Supabase (update updated_at to future time)
4. Edit locally on device A (older timestamp)
5. Trigger sync
6. Verify: Remote version kept (newer timestamp wins)

**Files to Modify**:
- `apps/mobile/src/services/syncService.ts` (add conflict resolution to sync functions)

**Estimated Time**: 3 hours

---

# Epic 2: Testing & Quality Assurance

**Priority**: P1 (Required for production)
**Dependencies**: Epic 1 complete
**Estimated Effort**: 24 hours
**Goal**: Achieve 75%+ test coverage and prevent regressions

## Story 2.1: Set Up Testing Infrastructure

**User Story**:
As a developer, I want a test framework configured so I can write and run tests efficiently.

**Acceptance Criteria**:
- [x] Jest configured for React Native
- [x] React Native Testing Library installed
- [x] Test setup file created with global mocks
- [x] Mock utilities for Supabase client
- [x] Mock utilities for SQLite
- [x] Mock utilities for SecureStore
- [x] Can run `npm test` successfully

**Technical Implementation**:
```bash
cd apps/mobile
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo
```

```javascript
// apps/mobile/jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/test-utils/setup.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test-utils/**'
  ],
  coverageThresholds: {
    global: {
      statements: 75,
      branches: 70,
      functions: 75,
      lines: 75
    }
  }
};
```

**Files to Create**:
- `apps/mobile/jest.config.js`
- `apps/mobile/src/test-utils/setup.ts`
- `apps/mobile/src/test-utils/mocks/mockSupabase.ts`
- `apps/mobile/src/test-utils/mocks/mockSQLite.ts`
- `apps/mobile/src/test-utils/mocks/mockSecureStore.ts`

**Estimated Time**: 4 hours

---

## Story 2.2: Write Unit Tests for Utils

**User Story**:
As a developer, I want utils tested so encryption and validation are reliable.

**Acceptance Criteria**:
- [x] encryption.ts: encryptContent/decryptContent roundtrip tests
- [x] validation.ts: email, password validation tests
- [x] logger.ts: no sensitive data logged tests
- [x] Coverage >80% for utils

**Files to Create**:
- `apps/mobile/src/utils/__tests__/encryption.test.ts`
- `apps/mobile/src/utils/__tests__/validation.test.ts`
- `apps/mobile/src/utils/__tests__/logger.test.ts`

**Estimated Time**: 4 hours

---

## Story 2.3: Write Integration Tests for Hooks

**User Story**:
As a developer, I want hooks tested so CRUD operations are reliable.

**Acceptance Criteria**:
- [x] useJournalEntries: Create, Read, Update, Delete tests
- [x] useCheckIns: Morning/evening check-in tests
- [x] useStepWork: Step answer save/retrieve tests
- [x] Verify encryption used in all hooks
- [x] Verify sync_status set correctly

**Files to Create**:
- `apps/mobile/src/features/journal/hooks/__tests__/useJournalEntries.test.ts`
- `apps/mobile/src/features/home/hooks/__tests__/useCheckIns.test.ts`
- `apps/mobile/src/features/steps/hooks/__tests__/useStepWork.test.ts`

**Estimated Time**: 6 hours

---

## Story 2.4: Write Component Tests

**User Story**:
As a developer, I want UI components tested so accessibility and interactions work.

**Acceptance Criteria**:
- [x] Button: rendering, onPress, accessibility tests
- [x] Input: validation, error display tests
- [x] LoadingSpinner: display tests
- [x] JournalCard: display, navigation tests

**Files to Create**:
- `apps/mobile/src/components/__tests__/Button.test.tsx`
- `apps/mobile/src/components/__tests__/Input.test.tsx`
- `apps/mobile/src/features/journal/screens/__tests__/JournalListScreen.test.tsx`

**Estimated Time**: 6 hours

---

## Story 2.5: E2E Testing Setup (Optional)

**User Story**:
As a developer, I want end-to-end tests for critical user flows.

**Acceptance Criteria**:
- [x] Maestro CLI installed
- [x] Test flows created: journal flow, check-in flow
- [x] Tests run on Expo Go

**Estimated Time**: 4 hours (optional)

---

# Epic 3: Push Notifications

**Priority**: P2 (High value for retention)
**Dependencies**: None
**Estimated Effort**: 8 hours
**Goal**: Daily check-in reminders to increase engagement

## Story 3.1: Configure Notification Permissions

**User Story**:
As a user, I want to grant notification permissions so I can receive check-in reminders.

**Acceptance Criteria**:
- [x] Permission request flow implemented
- [x] Permission status checking
- [x] Expo push token retrieved
- [x] Notification handlers registered (foreground, background, tap)
- [x] User can enable/disable in settings

**Files to Create**:
- `apps/mobile/src/lib/notifications.ts`

**Estimated Time**: 2 hours

---

## Story 3.2: Implement Local Notifications

**User Story**:
As a user, I want daily reminders for morning and evening check-ins so I build a habit.

**Acceptance Criteria**:
- [x] Schedule morning reminder (default 9 AM, customizable)
- [x] Schedule evening reminder (default 9 PM, customizable)
- [x] Can disable notifications
- [x] Test notification button works
- [x] Notifications persist across app restarts

**Files to Create**:
- `apps/mobile/src/services/notificationService.ts`
- `apps/mobile/src/features/settings/screens/NotificationSettingsScreen.tsx`

**Estimated Time**: 4 hours

---

## Story 3.3: Implement Milestone Notifications

**User Story**:
As a user, I want to be celebrated when I hit milestones so I stay motivated.

**Acceptance Criteria**:
- [x] Milestones detected: 1, 7, 14, 30, 60, 90, 180, 365 days
- [x] Notification sent on milestone day
- [x] In-app celebration modal shown
- [x] No duplicate notifications

**Files to Modify**:
- `apps/mobile/src/features/home/hooks/useCleanTime.ts`

**Estimated Time**: 2 hours

---

# Epic 4: Production Configuration

**Priority**: P2 (Required for deployment)
**Dependencies**: Epic 1 complete
**Estimated Effort**: 6 hours
**Goal**: Production-ready configuration

## Story 4.1: Add Error Boundary

**User Story**:
As a user, if the app crashes, I want to see a helpful message and retry button.

**Acceptance Criteria**:
- [x] ErrorBoundary component wraps app
- [x] Shows fallback UI on crash
- [x] Logs errors without sensitive data
- [x] Retry button works

**Files to Create**:
- `apps/mobile/src/components/ErrorBoundary.tsx`

**Estimated Time**: 2 hours

---

## Story 4.2: Fix Configuration Mismatches

**User Story**:
As a developer, I want consistent configuration for reliable builds.

**Acceptance Criteria**:
- [x] Package name consistent across configs
- [x] Release keystore generated
- [x] build.gradle updated with release config

**Files to Modify**:
- `android/app/build.gradle`

**Estimated Time**: 2 hours

---

## Story 4.3: Add Performance Monitoring

**User Story**:
As a developer, I want to track app performance to optimize user experience.

**Acceptance Criteria**:
- [x] Expo Analytics configured
- [x] Tracking: app_open, screen_view, journal_created, check_in_completed
- [x] No PII tracked

**Files to Modify**:
- `apps/mobile/app.json` (add expo-insights plugin)

**Estimated Time**: 2 hours

---

# Epic 5: Documentation & Deployment

**Priority**: P3 (Nice to have)
**Dependencies**: All epics complete
**Estimated Effort**: 6 hours
**Goal**: Production deployment ready

## Story 5.1: Update PROJECT_STATUS.md

**User Story**:
As a team member, I want accurate status documentation to understand what's done.

**Acceptance Criteria**:
- [x] Phase 2 marked as 100% complete
- [x] Phase 3/4 status updated
- [x] Known issues documented

**Estimated Time**: 1 hour

---

## Story 5.2: Create DEPLOYMENT.md

**User Story**:
As a developer, I want deployment instructions to release the app.

**Acceptance Criteria**:
- [x] EAS Build instructions
- [x] Environment variables documented
- [x] Store submission process outlined

**Estimated Time**: 2 hours

---

## Story 5.3: Create TESTING.md

**User Story**:
As a developer, I want testing documentation to run and write tests.

**Acceptance Criteria**:
- [x] How to run tests
- [x] How to write new tests
- [x] Mocking patterns documented

**Estimated Time**: 1 hour

---

## Story 5.4: Record Demo Video

**User Story**:
As a stakeholder, I want to see the app in action to understand the user experience.

**Acceptance Criteria**:
- [x] 10-minute walkthrough video
- [x] Covers: sign up, journaling, check-ins, sync, emergency
- [x] Uploaded or included in project

**Estimated Time**: 2 hours

---

## Implementation Sequence

### Week 1: Sync Infrastructure (Critical Path)
- Day 1-2: Stories 1.1, 1.2 (SyncService + SyncContext)
- Day 3: Story 1.3 (Sync UI)
- Day 4: Story 1.5 (Conflict Resolution)
- Day 5: Story 2.1 (Test Infrastructure)

### Week 2: Testing & Quality
- Day 1: Story 2.2 (Unit Tests)
- Day 2-3: Story 2.3 (Integration Tests)
- Day 4: Story 2.4 (Component Tests)
- Day 5: Epic 3 (Notifications)

### Week 3: Production Polish
- Day 1: Epic 4 (Production Config)
- Day 2: Epic 5 (Documentation)
- Day 3-5: Bug fixes, polish, deployment

---

## Sprint Velocity Assumptions

- **Full-time (8 hrs/day)**: 2-3 weeks
- **Part-time (10 hrs/week)**: 6 weeks
- **Includes**: Code review, testing, documentation

## Dependencies Graph

```
Epic 1 (Sync) → Epic 2 (Testing) → Epic 4 (Production)
       ↓
Epic 3 (Notifications) → Epic 4 (Production)
       ↓
Epic 5 (Documentation)
```

## Risk Mitigation

**Risk 1: Sync data loss**
- Mitigation: SQLite is source of truth, sync is backup only
- Never delete local data during sync

**Risk 2: Test coverage low**
- Mitigation: Set coverage threshold to 75% minimum
- Block merges if coverage drops

**Risk 3: Notification permissions denied**
- Mitigation: App works fully without notifications
- Graceful degradation

---

## Success Metrics

**Epic 1 Complete**:
- ✅ Data syncs to Supabase
- ✅ No data loss in conflict scenarios
- ✅ Sync status visible to user

**Epic 2 Complete**:
- ✅ >75% code coverage
- ✅ All critical paths tested
- ✅ No regression bugs

**Epic 3 Complete**:
- ✅ Users receive check-in reminders
- ✅ Milestone celebrations trigger
- ✅ >60% users enable notifications

**Epic 4 Complete**:
- ✅ App doesn't crash on errors
- ✅ Can build release APK
- ✅ Performance metrics tracked

**Epic 5 Complete**:
- ✅ Documentation accurate and complete
- ✅ Deployment process documented
- ✅ Demo video showcases features

---

## Next Actions

1. **Immediate**: Start Epic 1, Story 1.1 (Create SyncService)
2. **Create**: Sprint tracking file with sprint-planning workflow
3. **Review**: Prioritize stories with team
4. **Begin**: Implementation following dev-story workflow

---

**Document Status**: Complete and ready for sprint planning
**Total Stories**: 19 stories across 5 epics
**Ready for**: Implementation using `/bmad:bmm:workflows:dev-story`
