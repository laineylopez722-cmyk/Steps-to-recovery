# Meeting Check-Ins & Achievements - Test Plan

## 🧪 Testing Strategy

This test plan covers functional, integration, accessibility, and user experience testing for the meeting check-ins and achievements feature.

## ✅ Database Testing

### Migration Verification
- [ ] Migration runs successfully without errors
- [ ] All tables created: `meeting_checkins`, `achievements`
- [ ] All indexes created successfully
- [ ] RLS policies enabled and working
- [ ] Triggers created and active
- [ ] RPC functions created successfully

### Test Queries
```sql
-- Verify tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('meeting_checkins', 'achievements');

-- Verify RLS policies
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('meeting_checkins', 'achievements');

-- Verify RPC functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%meeting%' OR routine_name LIKE '%90%');

-- Verify trigger
SELECT tgname FROM pg_trigger 
WHERE tgname = 'trigger_check_achievement_unlocks';
```

### RLS Testing
```sql
-- Test as authenticated user
SET request.jwt.claim.sub = 'user-uuid-here';

-- Should see own check-ins only
SELECT * FROM meeting_checkins WHERE user_id = 'user-uuid-here';

-- Should see own achievements only
SELECT * FROM achievements WHERE user_id = 'user-uuid-here';

-- Should NOT see other users' data
SELECT * FROM meeting_checkins WHERE user_id != 'user-uuid-here';
-- Expected: 0 rows
```

## ✅ Service Layer Testing

### meetingCheckInService.ts

#### checkInToMeeting()
- [ ] Successfully creates check-in with all fields
- [ ] Returns check-in data and new achievements
- [ ] Handles missing optional fields (notes, location)
- [ ] Enforces unique constraint (one per meeting per day)
- [ ] Returns null on error

#### getMeetingCheckIns()
- [ ] Returns user's check-ins ordered by date desc
- [ ] Respects limit parameter
- [ ] Returns empty array if no check-ins
- [ ] Returns empty array on error

#### calculateStreak()
- [ ] Returns 0 for new user
- [ ] Returns correct streak for consecutive days
- [ ] Resets streak after missing day
- [ ] Handles edge cases (timezone boundaries)

#### calculateTotal()
- [ ] Returns count of unique days with meetings
- [ ] Returns 0 for new user
- [ ] Counts multiple meetings in same day as 1

#### check90In90Progress()
- [ ] Returns correct structure for new user
- [ ] Calculates days completed correctly
- [ ] Calculates days remaining correctly
- [ ] Sets isComplete = true when 90 reached
- [ ] Calculates start and target dates correctly

#### hasCheckedInToday()
- [ ] Returns false for no check-ins today
- [ ] Returns true if checked in today
- [ ] Respects timezone boundaries

#### hasCheckedInToMeetingToday()
- [ ] Returns false for new meeting
- [ ] Returns true if checked in to specific meeting today
- [ ] Respects unique constraint

## ✅ Hook Testing (React Query)

### useMeetingCheckIns()
- [ ] Fetches check-ins on mount
- [ ] Updates when checkIn mutation succeeds
- [ ] Invalidates related queries after check-in
- [ ] Returns correct stats (totalMeetings, currentStreak)
- [ ] Handles loading state correctly
- [ ] Handles error state correctly

### useAchievements()
- [ ] Fetches unlocked achievements
- [ ] Combines with achievement definitions
- [ ] Calculates progress for locked achievements
- [ ] Returns correct unlockedCount
- [ ] Updates when new achievements unlock

### use90In90Progress()
- [ ] Fetches 90-in-90 progress
- [ ] Calculates percentComplete correctly
- [ ] Determines isOnTrack correctly
- [ ] Provides motivational messages
- [ ] Updates after check-in

### useTodayCheckIn()
- [ ] Returns false initially
- [ ] Returns true after checking in
- [ ] Respects cache

### useMeetingCheckInStatus()
- [ ] Returns false for unchecked meeting
- [ ] Returns true for checked meeting
- [ ] Handles meetingId changes

## ✅ Component Testing

### CheckInModal
- [ ] Displays when visible prop is true
- [ ] Shows meeting details correctly
- [ ] Accepts optional notes (max 500 chars)
- [ ] Shows character count
- [ ] Shows impact preview
- [ ] Calls onConfirm with notes
- [ ] Shows success animation
- [ ] Closes after success
- [ ] Handles loading state
- [ ] Can be cancelled
- [ ] Keyboard avoids content

### AchievementUnlockModal
- [ ] Displays when visible prop is true
- [ ] Shows correct achievement details
- [ ] Plays celebration animation
- [ ] Triggers haptic feedback
- [ ] Shows shine effect
- [ ] Share button works
- [ ] View All button works
- [ ] Close button works
- [ ] Confetti animation displays

## ✅ Screen Testing

### MeetingStatsScreen
- [ ] Loads all data on mount
- [ ] Shows correct total meetings
- [ ] Shows correct current streak
- [ ] Shows correct longest streak
- [ ] Shows 90-in-90 progress correctly
- [ ] Shows progress bar animation
- [ ] Shows motivational message
- [ ] Shows status badges correctly
- [ ] Shows achievement preview (first 4)
- [ ] Shows recent check-ins (last 10)
- [ ] Shows empty state when no check-ins
- [ ] Refresh control works
- [ ] Navigate back works
- [ ] Navigate to Achievements works
- [ ] Achievement modal opens on tap

### AchievementsScreen
- [ ] Loads all achievements
- [ ] Shows correct unlock count
- [ ] Shows progress bar correctly
- [ ] Filter tabs work (All/Unlocked/Locked)
- [ ] Shows correct filtered achievements
- [ ] Unlocked achievements show date
- [ ] Unlocked achievements have shine effect
- [ ] Locked achievements show progress
- [ ] Locked achievements are grayed out
- [ ] Tapping unlocked achievement opens modal
- [ ] Tapping locked achievement does nothing
- [ ] Refresh control works
- [ ] Navigate back works
- [ ] Shows empty state for filters

### MeetingFinderScreenModern (Updated)
- [ ] Check-in button appears on each meeting
- [ ] Tapping check-in opens modal
- [ ] Check-in modal shows correct meeting
- [ ] Confirming check-in works
- [ ] Success animation plays
- [ ] Achievement modal opens if unlocked
- [ ] Check-ins list updates after check-in
- [ ] Button disabled if already checked in (optional)
- [ ] Shows "Checked In" badge if already checked (optional)

## ✅ Integration Testing

### End-to-End Flow: First Check-In
1. User opens Meeting Finder
2. User taps "Check In" on a meeting
3. Modal opens with meeting details
4. User adds optional notes
5. User taps "Confirm Check-In"
6. Loading state shows
7. Success animation plays
8. Achievement modal opens ("First Step")
9. Celebration animation plays
10. User taps "Continue"
11. Meeting list updates
12. Navigate to Stats screen
13. See 1 total meeting, 0 streak (need tomorrow for streak)
14. See "First Step" achievement unlocked

### End-to-End Flow: Building a Streak
1. Check in day 1 ✓
2. Check in day 2 ✓ → Streak = 1
3. Check in day 3 ✓ → Streak = 2
4. ...
5. Check in day 8 ✓ → Streak = 7 → "Week Strong" unlocked!
6. Achievement modal appears
7. Navigate to Achievements screen
8. See 2 achievements unlocked
9. See progress toward 30-in-30

### End-to-End Flow: 90-in-90 Challenge
1. User checks in to first meeting → Challenge starts
2. Stats screen shows: "1 / 90 days"
3. User checks in over 30 days → "30 in 30" unlocked
4. Progress bar shows 33% complete
5. User checks in over 90 days → "90 in 90" unlocked!
6. Epic celebration modal
7. isComplete = true
8. Badge shows "Complete! 🎉"

### Edge Cases
- [ ] Multiple meetings same day → Counts as 1 day
- [ ] Check in after midnight → New day
- [ ] Timezone changes → Handled correctly
- [ ] Break in streak → Streak resets
- [ ] Database trigger failure → Graceful handling
- [ ] Network error during check-in → Retry/queue
- [ ] Offline mode → Queue for sync

## ✅ Accessibility Testing

### Screen Reader (VoiceOver/TalkBack)
- [ ] All buttons have proper labels
- [ ] All buttons have roles
- [ ] All buttons have hints
- [ ] All form inputs have labels
- [ ] All images have descriptions or are marked decorative
- [ ] Reading order is logical
- [ ] Focus order is logical
- [ ] Headings properly marked
- [ ] Lists properly announced

### Navigation
- [ ] Tab navigation works in modals
- [ ] Focus trapped in modals
- [ ] Focus returns after modal close
- [ ] All interactive elements focusable
- [ ] Visual focus indicators

### States
- [ ] Disabled states announced
- [ ] Selected states announced
- [ ] Loading states announced
- [ ] Error states announced

### Text
- [ ] Minimum contrast ratios met (WCAG AA)
- [ ] Text scalable
- [ ] Text doesn't overlap at 200%

## ✅ Performance Testing

### Load Times
- [ ] Stats screen loads < 1s
- [ ] Achievements screen loads < 1s
- [ ] Check-in modal opens instantly
- [ ] Achievement modal opens instantly

### Animations
- [ ] All animations 60fps
- [ ] No jank on scroll
- [ ] Smooth progress bar animation
- [ ] Smooth modal transitions

### Data Loading
- [ ] Query caching works
- [ ] Pagination for large lists (future)
- [ ] Optimistic updates (consider)

## ✅ User Experience Testing

### Emotional Response
- [ ] Check-in feels rewarding
- [ ] Achievement unlock feels special
- [ ] Progress tracking is motivating
- [ ] UI is encouraging, not punishing
- [ ] Streak loss handled with empathy

### Usability
- [ ] Check-in flow is fast (< 5 seconds)
- [ ] Stats are easy to understand
- [ ] Progress is clearly visualized
- [ ] Achievements are discoverable
- [ ] Navigation is intuitive

### Copy & Messaging
- [ ] Motivational messages are encouraging
- [ ] Achievement names are memorable
- [ ] Descriptions are clear
- [ ] Error messages are helpful
- [ ] Empty states guide next action

## ✅ Security Testing

### Row-Level Security
- [ ] Users can only see their own check-ins
- [ ] Users can only see their own achievements
- [ ] Users can only insert their own data
- [ ] No SQL injection vulnerabilities
- [ ] API keys properly secured

### Data Validation
- [ ] Input sanitization on notes field
- [ ] Date validation
- [ ] User ID validation
- [ ] Meeting ID validation
- [ ] Constraint violations handled gracefully

## 🚨 Critical Path Tests

These MUST pass before release:

1. ✅ User can check in to a meeting
2. ✅ Check-in appears in stats immediately
3. ✅ Streak calculates correctly
4. ✅ Achievements unlock at correct milestones
5. ✅ 90-in-90 progress tracks correctly
6. ✅ No duplicate check-ins allowed
7. ✅ RLS prevents data leakage
8. ✅ All accessibility requirements met

## 📊 Test Results Template

```markdown
## Test Run: [Date]
**Tester**: [Name]
**Environment**: [Dev/Staging/Prod]
**Platform**: [iOS/Android]
**Version**: [App Version]

### Summary
- Total Tests: X
- Passed: Y
- Failed: Z
- Blocked: W

### Failures
1. [Test Name]
   - Expected: [Description]
   - Actual: [Description]
   - Severity: [Critical/High/Medium/Low]
   - Steps to Reproduce: [Steps]

### Notes
[Any observations, suggestions, or concerns]
```

## 🎯 Success Criteria

Feature is ready for release when:
- [ ] All critical path tests pass
- [ ] No high-severity bugs
- [ ] All accessibility requirements met
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] User testing feedback positive
- [ ] Documentation complete

---

**Testing is care. Test thoroughly, release confidently.** ✅
