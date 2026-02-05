# Steps to Recovery - Execution Plan to MVP
**Created**: 2026-02-06  
**Target**: Complete all critical features for MVP launch  
**Estimated Total Time**: 20-25 hours (3-4 days with parallelization)

---

## Phase 1: Quick Wins (Hours 1-3)
**Goal**: Knock out fast, high-value items  
**Strategy**: Sequential execution by main agent

### Task 1.1: Testing Checklist ✅ (1 hour)
- **Deliverable**: `docs/TESTING-CHECKLIST.md`
- **Contents**:
  - Manual QA test cases for all features
  - Critical user flows (signup → journal → check-in → steps)
  - Accessibility testing steps (VoiceOver/TalkBack)
  - Security testing (encryption verification)
  - Offline mode testing
  - Sync testing

### Task 1.2: Project Documentation Update (1 hour)
- **Deliverable**: Updated `README.md` and `PROJECT_STATUS.md`
- **Contents**:
  - Current feature status (75% → 90%)
  - Setup instructions verification
  - Architecture overview
  - Recent improvements (accessibility, security fixes)

### Task 1.3: Web App Research (1 hour)
- **Deliverable**: `docs/COMPETITIVE-FEATURES.md`
- **Action**: 
  - Access https://12-step-companion.vercel.app/
  - Complete onboarding flow
  - Document all features, screens, UX patterns
  - Identify gaps in our app vs. theirs
  - Extract useful patterns (dashboard layout, meeting finder, sponsor connection UI)

---

## Phase 2: Content Development (Hours 4-9)
**Goal**: Complete step questions and polish existing content  
**Strategy**: Sub-agent for step questions (parallelizable)

### Task 2.1: Step 2-12 Questions 📝 (4-6 hours)
- **Agent**: `step-questions-writer`
- **Deliverable**: Updated `packages/shared/constants/stepPrompts.ts`
- **Requirements**:
  - Follow existing Step 1 format (35+ questions in 4 sections)
  - Each step needs:
    - Overview section
    - Guided questions (10-15 per step)
    - Reflection prompts (5-8 per step)
    - Action items (3-5 per step)
  - Total: ~400-500 questions across Steps 2-12
  - Reference: AA Big Book, NA Step Working Guide
- **Quality Check**: Questions must be:
  - Trauma-informed
  - Non-judgmental
  - Progressive (build on previous steps)
  - Actionable

### Task 2.2: Meeting Finder Polish (2 hours)
- **Files**: 
  - `apps/mobile/src/features/meetings/screens/MeetingFinderScreen.tsx`
  - `apps/mobile/src/features/meetings/hooks/useMeetings.ts`
- **Todo**:
  - ✅ API integration (already done)
  - ❌ Add favorites functionality (save/unsave meetings)
  - ❌ Meeting details screen (directions, call-in info)
  - ❌ Location permissions handling
  - ❌ Filter by meeting type (AA/NA/CA/etc.)

---

## Phase 3: Sponsor Sharing UI (Hours 10-16)
**Goal**: Complete the core differentiating feature  
**Strategy**: Dedicated sub-agent (complex UI work)

### Task 3.1: Journal Share Button 📤 (2-3 hours)
- **Agent**: `sponsor-sharing-ui`
- **Files**: 
  - `apps/mobile/src/features/journal/screens/JournalListScreenModern.tsx`
  - `apps/mobile/src/features/journal/screens/JournalEditorScreenModern.tsx`
- **Todo**:
  - Add "Share with Sponsor" button to journal entry context menu
  - Create share confirmation modal
  - Hook up to existing `sponsorShareService.ts`
  - Show success/error feedback
  - Add "Shared" badge to shared entries in list

### Task 3.2: Sponsor Dashboard (3-4 hours)
- **Files**: 
  - `apps/mobile/src/features/sponsor/screens/SponsorScreen.tsx`
  - New: `SharedEntriesDashboard.tsx`
- **Todo**:
  - Create sponsor dashboard screen
  - List all sponsorships (active + pending)
  - Show shared entries from sponsees
  - Entry detail modal (read-only)
  - Reply/comment functionality (optional for MVP)
  - Badge for unread shared entries

### Task 3.3: Sponsor Connection Flow (1-2 hours)
- **Files**: 
  - `apps/mobile/src/features/sponsor/screens/ConnectSponsorScreen.tsx`
  - `apps/mobile/src/features/sponsor/screens/InviteSponsorScreen.tsx`
- **Todo**:
  - Polish existing screens
  - Add sponsor search (by email or phone)
  - Invite via SMS/email
  - Accept/decline sponsorship requests
  - Notification when request received

---

## Phase 4: Testing & Polish (Hours 17-20)
**Goal**: Ensure quality and catch bugs  
**Strategy**: Mix of automated tests and manual QA

### Task 4.1: E2E Test Suite (8-10 hours)
- **Agent**: `test-writer`
- **Deliverable**: 
  - `apps/mobile/__tests__/e2e/` directory
  - Tests using Detox or Maestro
- **Coverage**:
  - Auth flow (signup → login → logout)
  - Journal CRUD (create → edit → delete)
  - Daily check-ins (morning → evening)
  - Step work (view steps → answer questions → save)
  - Sponsor sharing (share entry → view as sponsor)
  - Offline mode (create while offline → sync when online)
- **Priority**: High-value flows only for MVP

### Task 4.2: Accessibility Audit (2 hours)
- **Action**: Manual testing with VoiceOver/TalkBack
- **Screens**: All Modern screens (already have props, need verification)
- **Checklist**:
  - Navigation flows work with screen reader
  - Forms are accessible
  - Error messages announced
  - Loading states communicated
  - Buttons have clear labels

### Task 4.3: Security Audit (2 hours)
- **Action**: Manual security testing
- **Checklist**:
  - Encryption working (verify with network intercept)
  - SecureStore used for keys
  - No console.log of sensitive data
  - RLS policies enforced (try cross-user access)
  - Auth tokens properly secured

---

## Phase 5: Feature Extraction from Competitor (Hours 21-23)
**Goal**: Identify and implement quick-win features from reference app  
**Strategy**: Based on research from Task 1.3

### Task 5.1: Implement Missing Features (2-3 hours)
- **Based on**: Findings from https://12-step-companion.vercel.app/
- **Potential Features**:
  - Dashboard layout improvements
  - Progress visualization (charts, graphs)
  - Achievement badges
  - Daily quote/meditation
  - Meeting reminders
  - Sponsor quick-dial
  - Crisis mode enhancements

### Task 5.2: UX Polish (1-2 hours)
- **Action**: Apply learnings from competitor
- **Focus**:
  - Navigation patterns
  - Color schemes for recovery context
  - Micro-interactions
  - Onboarding flow
  - Empty states

---

## Phase 6: Documentation & Handoff (Hours 24-25)
**Goal**: Prepare for beta testing and launch

### Task 6.1: User Documentation (1 hour)
- **Deliverable**: `docs/USER-GUIDE.md`
- **Contents**:
  - Getting started
  - Core features walkthrough
  - Privacy & security explanation
  - Troubleshooting
  - FAQ

### Task 6.2: Deployment Prep (1 hour)
- **Checklist**:
  - ✅ Supabase migrations applied
  - ✅ Environment variables documented
  - ❌ App store metadata (screenshots, description)
  - ❌ Privacy policy
  - ❌ Terms of service
  - ❌ Crash reporting (Sentry setup)
  - ❌ Analytics (Expo Insights configuration)

---

## Parallelization Strategy

### Parallel Track A (Main Agent)
1. Testing checklist (1h)
2. Documentation update (1h)
3. Web research (1h)
4. Meeting finder polish (2h)
5. Manual testing (4h)
6. Final documentation (2h)

### Parallel Track B (step-questions-writer)
1. Research step guidelines (1h)
2. Write Steps 2-4 questions (2h)
3. Write Steps 5-8 questions (2h)
4. Write Steps 9-12 questions (1.5h)
5. Quality review (0.5h)

### Parallel Track C (sponsor-sharing-ui)
1. Journal share button + modal (3h)
2. Sponsor dashboard (3h)
3. Connection flow polish (1h)

### Parallel Track D (test-writer)
1. Setup E2E framework (1h)
2. Auth + Journal tests (3h)
3. Check-ins + Steps tests (3h)
4. Sponsor sharing tests (2h)
5. Offline mode tests (1h)

**Total Parallel Time**: ~12-15 hours (instead of 25 sequential)

---

## Dependencies & Order

```
Phase 1 (Sequential) → START HERE
  ↓
Phase 2 & 3 (Parallel)
  ├─ Step Questions (Track B)
  ├─ Sponsor Sharing (Track C)
  └─ Meeting Finder (Track A)
  ↓
Phase 4 (Parallel after Phase 3)
  ├─ E2E Tests (Track D) - wait for Sponsor Sharing
  └─ Manual Testing (Track A)
  ↓
Phase 5 (After Research Complete)
  └─ Implement Competitor Features
  ↓
Phase 6 (Final)
  └─ Documentation & Deploy Prep
```

---

## Success Criteria

### MVP Complete When:
- ✅ All P0 critical fixes done (COMPLETED)
- ✅ Emergency toolkit accessible (COMPLETED)
- ⏳ Step 2-12 questions defined
- ⏳ Sponsor sharing fully functional
- ⏳ Meeting finder polished
- ⏳ E2E tests covering critical paths
- ⏳ Manual QA passed
- ⏳ Accessibility verified

### Definition of Done:
- App can be submitted to TestFlight/Google Play Beta
- 10-20 beta testers can use all core features
- No P0 bugs remaining
- All security requirements met
- Documentation complete

---

## Risk Mitigation

### Risk 1: Step Questions Quality
- **Mitigation**: Review by someone with recovery experience
- **Fallback**: Use Step 1 format as template, keep simple

### Risk 2: E2E Tests Take Too Long
- **Mitigation**: Focus on top 5 critical flows only
- **Fallback**: Manual testing checklist instead

### Risk 3: Sponsor Sharing Complexity
- **Mitigation**: Start with read-only dashboard, defer comments
- **Fallback**: Simplify to just "share entry" + "view shared"

### Risk 4: Browser Access Issues
- **Mitigation**: Use web_fetch and manual inspection
- **Fallback**: Skip competitor research if blocked

---

## Next Steps (Immediate)

1. **START**: Execute Phase 1 (Testing Checklist + Docs)
2. **SPAWN**: step-questions-writer sub-agent (Task 2.1)
3. **SPAWN**: sponsor-sharing-ui sub-agent (Task 3.1-3.3)
4. **CONTINUE**: Main agent tackles Meeting Finder + Manual Testing
5. **SPAWN**: test-writer sub-agent (Task 4.1) - after sponsor UI done

**Estimated completion**: 12-15 hours with parallelization (vs. 25 hours sequential)

---

## Status Tracking

Track progress in `.fix-progress.md` under new section:
- Phase 1: [0/3] tasks
- Phase 2: [0/2] tasks
- Phase 3: [0/3] tasks
- Phase 4: [0/3] tasks
- Phase 5: [0/2] tasks
- Phase 6: [0/2] tasks

**Overall**: 0/15 tasks complete (0%)
