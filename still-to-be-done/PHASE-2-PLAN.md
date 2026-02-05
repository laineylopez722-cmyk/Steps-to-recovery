# Phase 2 Execution Plan - New Features Implementation
**Created**: 2026-02-06 07:00 GMT+11  
**Goal**: Implement all new feature ideas + extract learnings from competitor site  
**Estimated Time**: 30-40 hours (15-20 hours with parallelization)

---

## 🎯 Feature Prioritization Matrix

### **Tier 1: MVP Features** (Build Now - 20-25 hours)
High impact, moderate effort, leverages existing code

1. **JFT Daily Reading** ⭐⭐⭐⭐⭐ (4-6 hours)
   - Core spiritual content feature
   - High engagement driver
   - Leverages existing journal system

2. **Meeting Check-Ins & Achievements** ⭐⭐⭐⭐⭐ (6-8 hours)
   - Gamification for "90 in 90"
   - Leverages existing geofencing
   - High retention driver

3. **Meeting Reflection Prompts** ⭐⭐⭐⭐ (2-3 hours)
   - Pre-meeting prep + post-meeting debrief
   - Enhances meeting value
   - Quick to build (journal integration)

4. **"Before You Use" Checkpoint** ⭐⭐⭐⭐⭐ (5-6 hours)
   - Potentially life-saving
   - Crisis intervention feature
   - Unique value proposition

### **Tier 2: Post-Launch** (Build After MVP - 15-20 hours)
High impact, higher effort

5. **Anonymous Daily Encouragement** ⭐⭐⭐⭐⭐ (6-8 hours)
   - Community building
   - Requires moderation system
   - Backend queue needed

6. **Craving Distraction Game** ⭐⭐⭐⭐ (8-10 hours)
   - Unique differentiator
   - Requires game development
   - High polish needed

7. **Phone a Friend Panic Button** ⭐⭐⭐⭐ (4-5 hours)
   - Crisis support enhancement
   - Builds on emergency toolkit
   - Permission handling needed

### **Tier 3: Future Versions** (Nice-to-Have)
Lower priority, longer timeline

8. Recovery Twin Matching
9. Craving Weather Forecast (ML)
10. Gratitude Jar
11. Recovery Resume Export
12. Dry Places Location Tracker
13. See Your Future Timeline
14. Sponsor Toolkit
15. Voice Notes Community

---

## 📋 Execution Plan - Tier 1 Features

### **Phase 2A: Content & Gamification** (Parallel - 6-8 hours)

#### **Stream A1: JFT Daily Reading** 🤖 SUB-AGENT
**Agent**: `jft-reading-builder`  
**Time**: 4-6 hours

**Tasks**:
1. Research daily reading sources:
   - NA's "Just For Today" (365 readings)
   - AA's "Daily Reflections" 
   - License-free alternatives
   
2. Create daily reading API/service:
   - `packages/shared/constants/dailyReadings.ts`
   - Date-based reading retrieval
   - Rotation logic for year-round content

3. Build HomeScreen card:
   - "Today's Reading" card on HomeScreenModern
   - Beautiful typography (reading is sacred)
   - "Reflect" button → opens journal with reading as prompt
   - "Share in meeting" bookmark feature

4. Journal integration:
   - Pre-fill journal with reading text
   - Tag as "JFT Reflection"
   - Track reflection streak

**Deliverables**:
- `dailyReadings.ts` with 365+ readings
- HomeScreen JFT card component
- Journal integration
- Documentation

---

#### **Stream A2: Meeting Check-Ins & Achievements** 🤖 SUB-AGENT
**Agent**: `meeting-checkin-builder`  
**Time**: 6-8 hours

**Tasks**:
1. Enhance Meeting model:
   - Add `check_ins` table (user_id, meeting_id, timestamp, location)
   - Track total meetings attended
   - Track streaks (consecutive days, 90 in 90)

2. Check-in mechanisms:
   - **Geofence trigger**: Auto-detect when near meeting
   - **Manual check-in**: With location verification
   - **QR code scan**: Optional for meetings that provide codes

3. Achievement system:
   - Define achievements:
     - "First Meeting" (1 meeting)
     - "Committed" (7 consecutive days)
     - "30 in 30" (30 days)
     - "90 in 90" (90 days)
     - "Centurion" (100 total meetings)
     - "One Year Strong" (365 days streak)
   - Achievement unlock notifications
   - Badge display in profile

4. UI Components:
   - Check-in button on MeetingFinderScreen
   - Achievement gallery screen
   - Stats dashboard (meetings attended, current streak)
   - Progress toward next achievement

**Deliverables**:
- `check_ins` table + RLS policies
- Check-in service + hooks
- Achievement engine
- 3 new screens (check-in, achievements, stats)
- Documentation

---

### **Phase 2B: Crisis Support & Reflection** (Sequential - 7-9 hours)

#### **Task B1: Meeting Reflection Prompts** (2-3 hours)
**Owner**: Main agent

**Implementation**:
1. Pre-meeting card:
   - Shows 1 hour before meeting (from favorites or calendar)
   - Prompts: "What do I want to share?", "What am I grateful for?"
   - Quick journal button

2. Post-meeting card:
   - Shows after check-in
   - Prompts: "What stood out?", "What did I learn?", "Numbers I got"
   - Quick reflection (3 prompts, each 1-3 sentences)

3. Database:
   - `meeting_reflections` table
   - Links to meeting check-in
   - Encrypted content

**Files**:
- `apps/mobile/src/features/meetings/components/MeetingPrepCard.tsx`
- `apps/mobile/src/features/meetings/components/MeetingDebriefModal.tsx`

---

#### **Task B2: "Before You Use" Checkpoint** (5-6 hours)
**Owner**: Main agent

**Implementation**:
1. Dedicated screen accessible from:
   - Home screen card: "Having a hard time?"
   - Emergency toolkit
   - Direct link user can bookmark

2. Intervention flow (7 steps):
   ```
   Step 1: "Are you sure?" → 10-click confirmation (delay tactic)
   Step 2: Show user's "why I got sober" photos/notes
   Step 3: "Call sponsor now?" → One-tap call
   Step 4: "What's really wrong?" → Guided journal
   Step 5: "Just wait 20 minutes" → Timer + distraction game
   Step 6: "How are you feeling now?" → Check-in
   Step 7: Save as "close call" entry for review with sponsor
   ```

3. Setup:
   - User adds "why I got sober" content during onboarding
   - Photos, notes, voice memos
   - Emergency contacts

4. Analytics:
   - Track close calls (pattern analysis)
   - Show user: "You've resisted X times"

**Files**:
- `apps/mobile/src/features/emergency/screens/BeforeYouUseScreen.tsx`
- `apps/mobile/src/features/emergency/hooks/useCloseCallTracking.ts`

---

### **Phase 2C: Competitor Research** (2-3 hours)

#### **Task C1: Access & Document Competitor Site** 
**Owner**: Main agent (manual)

**Steps**:
1. Access https://12-step-companion.vercel.app/
2. Complete onboarding flow
3. Explore all screens:
   - Dashboard layout
   - Journal features
   - Meeting finder
   - Step work
   - Sponsor connection
   - Any unique features

4. Document findings:
   - `docs/COMPETITOR-ANALYSIS.md`
   - Screenshots (if possible)
   - UX patterns worth adopting
   - Features we're missing
   - Features we do better

5. Identify quick wins:
   - Navigation patterns
   - Visual design elements
   - Micro-interactions
   - Copy/messaging

**Deliverable**: Competitor analysis report with actionable recommendations

---

## 🚀 Parallelization Strategy

### **Simultaneous Work Streams**:

```
┌─────────────────────────────────────────────────┐
│ WEEK 1: Tier 1 MVP Features                    │
├─────────────────────────────────────────────────┤
│ Day 1 (Today):                                  │
│  ├─ Stream A1: JFT Reading [SUB-AGENT] ────────┼─> 4-6h
│  ├─ Stream A2: Meeting Check-ins [SUB-AGENT] ──┼─> 6-8h
│  └─ Main: Competitor Research ─────────────────┼─> 2-3h
│                                                 │
│ Day 2:                                          │
│  ├─ Main: Review sub-agent work ───────────────┼─> 2h
│  ├─ Main: Meeting Reflection Prompts ──────────┼─> 2-3h
│  └─ Main: Before You Use Checkpoint ───────────┼─> 5-6h
│                                                 │
│ Day 3:                                          │
│  ├─ Main: Integration testing ─────────────────┼─> 3-4h
│  ├─ Main: Polish & bug fixes ──────────────────┼─> 2-3h
│  └─ Main: Documentation update ────────────────┼─> 1-2h
└─────────────────────────────────────────────────┘
```

**Estimated Completion**: 3 days for Tier 1 features

---

## 📊 Success Criteria

### **Definition of Done - Tier 1**:
- [ ] JFT reading displays daily on home screen
- [ ] Users can reflect on reading via journal
- [ ] Meeting check-ins work (manual + geofence)
- [ ] Achievements unlock and display
- [ ] Pre/post meeting reflection prompts work
- [ ] "Before You Use" checkpoint accessible and functional
- [ ] All features have accessibility props
- [ ] Documentation complete
- [ ] No P0 bugs

### **Ready for Beta When**:
- [ ] All Tier 1 features complete
- [ ] Competitor analysis informs final polish
- [ ] E2E tests covering new flows
- [ ] Manual QA passed

---

## 🔄 Phase 2D: Tier 2 Features (Post-Launch)

These will be implemented after MVP launch, based on user feedback:

### **Week 2-3 Roadmap**:
1. Anonymous Daily Encouragement (6-8h)
2. Craving Distraction Game (8-10h)
3. Phone a Friend Panic Button (4-5h)

### **Month 2 Roadmap**:
4. Recovery Twin Matching
5. Gratitude Jar
6. Sponsor Toolkit enhancements

---

## 🎯 Immediate Next Actions

**RIGHT NOW** (spawn sub-agents):
1. ✅ Spawn `jft-reading-builder` sub-agent
2. ✅ Spawn `meeting-checkin-builder` sub-agent
3. ⏳ Main agent: Access competitor site and document

**AFTER SUB-AGENTS COMPLETE** (~6-8 hours):
1. Review and integrate JFT reading feature
2. Review and integrate meeting check-ins
3. Build meeting reflection prompts (2-3h)
4. Build "Before You Use" checkpoint (5-6h)

**DAY 3**:
1. Integration testing
2. Bug fixes
3. Documentation
4. Prepare for beta testing

---

## 📈 Impact Projection

### **User Engagement**:
- **JFT Reading**: +40% daily active users (spiritual content is sticky)
- **Meeting Check-ins**: +60% meeting attendance tracking
- **Achievements**: +35% retention (gamification works)
- **Before You Use**: Potentially prevents relapses (immeasurable value)

### **Competitive Advantage**:
These features combined create something unique:
- **Content** (JFT) + **Community** (encouragement) + **Crisis support** (checkpoint)
- No competitor has all three
- Positions app as comprehensive recovery companion

---

## 🚨 Risk Mitigation

### **Risk 1: Daily Reading Copyright**
- **Mitigation**: Use license-free content or write original
- **Fallback**: Curated quotes from public domain sources

### **Risk 2: Geofencing Battery Drain**
- **Mitigation**: Smart polling (only near known meeting locations)
- **Fallback**: Manual check-in only

### **Risk 3: Feature Creep**
- **Mitigation**: Strict tier system, ship Tier 1 first
- **Fallback**: Cut Tier 2 features if timeline slips

---

## 📝 Status Tracking

Track in `EXECUTION-STATUS.md`:

**Phase 2A (Tier 1 - Content & Gamification)**:
- [ ] JFT Daily Reading (4-6h) 🤖 SUB-AGENT
- [ ] Meeting Check-Ins (6-8h) 🤖 SUB-AGENT

**Phase 2B (Tier 1 - Crisis & Reflection)**:
- [ ] Meeting Reflection (2-3h)
- [ ] Before You Use (5-6h)

**Phase 2C (Research)**:
- [ ] Competitor Analysis (2-3h)

**Phase 2D (Tier 2 - Post-Launch)**:
- [ ] Anonymous Encouragement (6-8h)
- [ ] Craving Game (8-10h)
- [ ] Panic Button (4-5h)

**Progress**: 0/8 Tier 1 tasks, 0/3 Tier 2 tasks

---

**Total Time to Ship**:
- **Optimistic**: 15-18 hours (with perfect parallelization)
- **Realistic**: 20-25 hours (with reviews and fixes)
- **Timeline**: 3-4 days of focused work

**Then**: Beta testing → Production launch → Tier 2 features based on feedback

Ready to execute! 🚀
