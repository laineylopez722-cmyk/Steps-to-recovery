# Missing Features & Implementation Gaps

**Review Date**: 2026-02-06  
**Source**: CLAUDE.md, README.md, and plan.txt

---

## Overview

The app is in **Phase 2** (Journaling & Step Work) according to PROJECT_STATUS.md. Many Phase 3, 4, and 5 features are partially implemented but incomplete.

**Overall Completeness**: ~60% of MVP features implemented

---

## Phase 1: Core Architecture ✅ COMPLETE

### Implemented Features:
- ✅ Authentication (email/password)
- ✅ Database initialization (SQLite + IndexedDB)
- ✅ Encryption utilities
- ✅ Sync queue architecture
- ✅ Offline-first with React Query
- ✅ Platform-agnostic adapters

**Status**: Phase 1 is COMPLETE and working well.

---

## Phase 2: Journaling & Step Work 🟡 PARTIAL

### ✅ Fully Implemented:
1. **Journal Entries**
   - ✅ Create/Read/Update/Delete operations
   - ✅ Encryption (title, body, mood, craving, tags)
   - ✅ Offline-first with React Query
   - ✅ Optimistic updates
   - ✅ Sync queue integration
   - ✅ Test coverage (`useJournalEntries.ts` has comprehensive hooks)

2. **Daily Check-Ins**
   - ✅ Morning intentions
   - ✅ Evening reflections
   - ✅ Mood and craving tracking
   - ✅ Streak calculation
   - ✅ Encrypted storage
   - ✅ Test coverage (`useCheckIns.test.tsx`)

3. **Step Work Tracking**
   - ✅ Database schema (step_work table)
   - ✅ Hooks (`useStepWork.ts`)
   - ✅ Screens (StepsOverviewScreen, StepDetailScreen)
   - ✅ Encryption

### 🟡 Partially Implemented:
1. **Step Work Questions**
   - ✅ Step 1 questions defined in code
   - ❌ Questions for Steps 2-12 not defined
   - **Location**: Need to create step question data
   - **Priority**: HIGH - Core MVP feature

2. **Journal Search**
   - ✅ Database schema supports tags
   - ❌ Search UI not implemented
   - ❌ Tag filtering not implemented
   - **Priority**: MEDIUM - Nice-to-have for MVP

3. **Journal Entry Sharing (with Sponsor)**
   - ✅ Database schema (`shared_entries` table)
   - ✅ Service functions (`sponsorShareService.ts`)
   - ❌ UI flow incomplete
   - ❌ Share button not in journal list
   - **Priority**: HIGH - Core Phase 3 feature mentioned in roadmap

---

## Phase 3: Sponsor Connection 🟠 INCOMPLETE

### ✅ Database Layer Complete:
- ✅ `sponsorships` table with RLS policies
- ✅ `shared_entries` table
- ✅ Sync service integration

### 🟡 Business Logic Partial:
- ✅ Hooks: `useSponsorships.ts`, `useSponsorConnections.ts`, `useSponsorSharedEntries.ts`
- ✅ Service: `sponsorShareService.ts`
- 🟡 Share workflow implemented but UI incomplete

### ❌ UI Missing:
- ✅ Screens exist: ConnectSponsorScreen, InviteSponsorScreen, ShareEntriesScreen
- ❌ Integration with journal list (share button)
- ❌ Sponsor dashboard (view shared entries)
- ❌ Notification when sponsee shares entry
- **Priority**: HIGH - Core differentiation feature

**Estimated Work**: 2-3 days to complete UI integration

---

## Phase 4: Notifications & Geofencing 🟠 PARTIAL

### ✅ Foundation Complete:
- ✅ Notification permissions (expo-notifications)
- ✅ NotificationContext.tsx
- ✅ Background task setup (expo-task-manager)

### 🟡 Partially Implemented:
1. **Local Notifications**
   - ✅ Daily journaling reminder (code exists)
   - ✅ Check-in reminders
   - ❌ Milestone celebrations (achievement unlocked)
   - ❌ Craving cooldown reminder (after logging high craving)

2. **Geofencing**
   - ✅ Meeting geofence setup code
   - ✅ Background location permissions
   - ❌ Not tested on physical devices
   - ❌ No UI to manage geofences
   - **Risk**: Geofencing is battery-intensive and may not work reliably

3. **Smart Notifications (JITAI)**
   - ✅ Hook: `useJitai.ts` (Just-In-Time Adaptive Interventions)
   - ❌ No ML model or logic for triggering
   - ❌ No context-aware notifications
   - **Priority**: LOW - Can be Phase 5 feature

**Estimated Work**: 3-5 days for full notification + geofencing implementation

---

## Phase 5: Polish & Features 🔴 MOSTLY MISSING

### ✅ Achievements & Milestones:
- ✅ Database schema
- ✅ Milestone constants (`milestones.ts`)
- ✅ Hook: `useAchievements.ts`
- ✅ Components: `AchievementCard.tsx`, `KeytagWall.tsx`
- ❌ Achievement unlock logic not triggered
- ❌ Celebration animations incomplete
- **Priority**: MEDIUM - Nice MVP feature

### 🟡 Meeting Finder:
- ✅ Meeting Guide API integration (`meetingGuideApi.ts`)
- ✅ Meeting cache service (`meetingCacheService.ts`)
- ✅ Nearby meetings hook (`useNearbyMeetings.ts`)
- ✅ Screens: MeetingFinderScreen, MeetingDetailScreen
- 🟡 Favorite meetings partially implemented
- ❌ Meeting filters incomplete
- ❌ Meeting search by type (AA, NA, etc.)
- **Priority**: MEDIUM - Nice-to-have for MVP

### ❌ Emergency Toolkit:
- ✅ Screen: EmergencyScreen.tsx
- ❌ Breathing exercise component incomplete
- ❌ Emergency contacts quick-dial
- ❌ Crisis resources list
- ❌ Safety plan feature
- **Priority**: HIGH - Critical for recovery app

### ❌ Progress Dashboard:
- ✅ Screen: ProgressDashboardScreen.tsx
- ✅ Hook: `useRecoveryAnalytics.ts`
- ❌ Charts/visualizations incomplete
- ❌ Mood trend analysis
- ❌ Craving pattern detection
- **Priority**: MEDIUM - Nice analytics feature

### ❌ Daily Readings:
- ✅ Data: `dailyReadings.ts` (sample data)
- ✅ Screen: DailyReadingScreen.tsx
- ❌ Readings content incomplete (only samples)
- ❌ Reflection feature incomplete
- ❌ Bookmark/favorite readings
- **Priority**: LOW - Can be added later

---

## Features Mentioned in Docs But Not Implemented

### From README.md:
1. **Gamification**
   - ❌ Badges/trophies (only basic achievements)
   - ❌ Streak animations
   - ❌ Progress celebration confetti (component exists but not integrated)

2. **Export/Backup**
   - ❌ Export journal to PDF
   - ❌ Local backup to device
   - ❌ Encrypted export for transfer

3. **Accessibility**
   - ❌ Screen reader support (props missing on most components)
   - ❌ High contrast mode
   - ❌ Font scaling tested

### From CLAUDE.md:
1. **Offline Meeting Map**
   - ❌ Map view of nearby meetings
   - ❌ Meeting directions
   - **Note**: Meeting finder partially implemented, map view missing

2. **Crisis Detection**
   - ❌ High craving streak → Auto-suggest emergency contacts
   - ❌ Pattern detection (triggers, times, situations)
   - **Note**: Could use JITAI hook for this

3. **Sponsor Notifications**
   - ❌ Notify sponsor when sponsee shares entry
   - ❌ Notify sponsor if sponsee hasn't checked in for X days
   - **Note**: Push notification infrastructure exists, logic missing

---

## Database Schema Gaps

### Missing Tables (Mentioned in plan.txt):
1. ❌ `emergency_contacts` - Quick-dial contacts for crisis
2. ❌ `safety_plans` - Personalized safety plans
3. ❌ `trigger_log` - Track relapse triggers
4. ❌ `gratitude_log` - Daily gratitude entries (separate from check-ins)

### Existing Tables Not Fully Utilized:
1. 🟡 `achievements` table - Exists but achievement unlock logic incomplete
2. 🟡 `cached_meetings` - Populated but not all filters implemented
3. 🟡 `favorite_meetings` - Table exists, UI incomplete

---

## Priority Feature Matrix

### P0 - Must Have for MVP Launch:
1. ✅ Authentication (DONE)
2. ✅ Journal entries (DONE)
3. ✅ Daily check-ins (DONE)
4. ✅ Step work tracking (DONE)
5. 🟡 **Step work questions** (Steps 2-12 questions missing)
6. 🟡 **Emergency toolkit** (Screen exists, features incomplete)
7. 🟡 **Sponsor connection** (Backend done, UI incomplete)

### P1 - Should Have Soon:
1. 🟡 Journal search & tags
2. 🟡 Achievement unlocks
3. 🟡 Milestone celebrations
4. 🟡 Meeting finder (mostly done, filters incomplete)
5. 🟡 Progress dashboard (analytics hooks exist, UI incomplete)

### P2 - Nice to Have Later:
1. ❌ Daily readings (content)
2. ❌ Geofencing (risky, battery-intensive)
3. ❌ Smart notifications (JITAI)
4. ❌ Export/backup features
5. ❌ Crisis detection patterns

---

## Recommended MVP Scope

To launch a **minimal viable product**, focus on:

### Core Features (Already 80% Done):
- ✅ Authentication
- ✅ Journal entries
- ✅ Daily check-ins
- ✅ Step work tracking
- 🔧 **Complete**: Step work questions (Steps 1-12)
- 🔧 **Complete**: Emergency toolkit basics

### Nice-to-Have (Can Launch Without):
- Sponsor connection (Phase 3)
- Geofencing (Phase 4)
- Smart notifications (Phase 5)
- Progress analytics (Phase 5)

### Launch Strategy:
1. **Week 1**: Complete step work questions + emergency toolkit
2. **Week 2**: Beta testing with 10-20 users
3. **Week 3**: Bug fixes, accessibility improvements
4. **Week 4**: Production launch (minimal features)
5. **Month 2-3**: Add sponsor connection, meeting finder, achievements

---

## Feature Implementation Checklist

### High Priority (P0):
- [ ] Define questions for Steps 2-12
  - **File**: Create `constants/stepQuestions.ts`
  - **Format**: Similar to Step 1 questions in StepDetailScreen
  - **Estimate**: 2-3 hours

- [ ] Complete emergency toolkit
  - [ ] Breathing exercise component (use existing BreathingCircle)
  - [ ] Emergency contacts quick-dial
  - [ ] Crisis resources list (hotlines, websites)
  - **Estimate**: 4-6 hours

- [ ] Complete sponsor sharing UI
  - [ ] Add share button to journal list
  - [ ] Implement share confirmation dialog
  - [ ] Sponsor dashboard to view shared entries
  - **Estimate**: 6-8 hours

### Medium Priority (P1):
- [ ] Implement achievement unlock logic
  - [ ] Trigger on milestone days
  - [ ] Trigger on streak milestones
  - [ ] Show celebration modal
  - **Estimate**: 4-5 hours

- [ ] Complete meeting finder filters
  - [ ] Filter by meeting type (AA, NA, CA, etc.)
  - [ ] Filter by time of day
  - [ ] Filter by accessibility needs
  - **Estimate**: 3-4 hours

- [ ] Journal search implementation
  - [ ] Search bar in JournalListScreen
  - [ ] Filter by tags
  - [ ] Filter by mood/craving
  - **Estimate**: 4-5 hours

### Low Priority (P2):
- [ ] Daily readings content
  - [ ] Source readings from public domain (Just For Today, 24 Hours A Day)
  - [ ] Create data file with 365 readings
  - **Estimate**: 8-10 hours (content sourcing)

- [ ] Export/backup features
  - [ ] Export journal as PDF
  - [ ] Export as encrypted JSON
  - **Estimate**: 6-8 hours

---

## Feature Dependencies

**Blocker Relationships**:
```
Emergency Toolkit (P0)
  └─> No dependencies, can build now

Step Work Questions (P0)
  └─> No dependencies, can build now

Sponsor Sharing UI (P0)
  ├─> Backend complete ✅
  └─> Just needs UI integration

Achievement Unlocks (P1)
  ├─> Requires milestone detection ✅ (already exists in useCleanTime)
  └─> Just needs trigger logic

Geofencing (P2)
  ├─> Requires location permissions ✅
  ├─> Requires background task ✅
  └─> Needs physical device testing (can't test in simulator)

Smart Notifications (P2)
  ├─> Requires notification permissions ✅
  ├─> Requires pattern detection logic ❌
  └─> Needs ML model or heuristics ❌
```

---

## Estimation Summary

**To MVP Launch** (Minimal Features):
- Step work questions: 2-3 hours
- Emergency toolkit: 4-6 hours
- Testing & bug fixes: 8-10 hours
- **Total**: 14-19 hours (~2-3 days)

**To Full Phase 3** (Sponsor Connection):
- Sponsor sharing UI: 6-8 hours
- Testing: 4-5 hours
- **Total**: 10-13 hours (~1.5-2 days)

**To Full Phase 4** (Notifications):
- Notification logic: 4-5 hours
- Geofencing testing: 6-8 hours (needs physical devices)
- **Total**: 10-13 hours (~1.5-2 days)

**To Full Phase 5** (Polish):
- Achievement unlocks: 4-5 hours
- Meeting finder polish: 3-4 hours
- Progress dashboard: 8-10 hours
- Daily readings content: 8-10 hours
- **Total**: 23-29 hours (~3-4 days)

**Overall to Full MVP**: ~6-10 days of focused development

---

## Recommendations

### For Immediate Launch (Minimal MVP):
1. ✅ Use existing features (journal, check-ins, step work tracking)
2. 🔧 Add Step work questions (2-3 hours)
3. 🔧 Complete emergency toolkit (4-6 hours)
4. 🧪 Beta test with 10-20 users
5. 🚀 Launch with limited feature set

### For Full MVP (Within 1 Month):
1. Add sponsor connection (6-8 hours)
2. Add achievement unlocks (4-5 hours)
3. Polish meeting finder (3-4 hours)
4. Comprehensive testing
5. Accessibility audit + fixes

### For Future Versions (Post-Launch):
- Phase 3+: Smart notifications, geofencing
- Phase 4: Progress analytics, pattern detection
- Phase 5: Daily readings, export features, gamification

---

**Bottom Line**: The app is **60% complete** for minimal MVP. With 2-3 days of focused work on step questions and emergency toolkit, it could launch. For a more complete experience, add 1-2 weeks for sponsor connection and polish.
