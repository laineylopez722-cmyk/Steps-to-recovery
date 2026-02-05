# Testing Checklist - MVP Features
**Date**: 2026-02-06  
**Status**: Ready for Testing  
**Time Required**: 1-2 hours

---

## 🎯 Testing Environment

### **Setup**:
```bash
cd apps/mobile
npx expo start
```

### **Devices**:
- [ ] iOS Simulator / Device
- [ ] Android Emulator / Device
- [ ] (Optional) Web browser

---

## ✅ Feature 1: Circular Progress Rings

### **Location**: Home Screen → Sobriety Counter

### **Tests**:
- [ ] **Render**: Rings appear with 3 nested circles
- [ ] **Animation**: Rings animate smoothly on mount (1.5s / 1s / 0.8s)
- [ ] **Colors**: Gradients show (Primary → Secondary → Accent)
- [ ] **Center Text**: Days number + "DAYS" label + time (HH:MM)
- [ ] **Milestone Badge**: "🔥 STREAK ACTIVE" shows
- [ ] **Milestone Text**: "X days until [milestone]" shows
- [ ] **Accessibility**: VoiceOver reads "X days, Y hours, Z minutes clean"
- [ ] **Performance**: No lag, smooth 60fps

### **Edge Cases**:
- [ ] Day 0 (empty rings)
- [ ] Day 365+ (rings stay at 100%)
- [ ] Midnight rollover (smooth transition)

### **Result**: ✅ ❌

---

## ✅ Feature 2: Meeting Reflections

### **Location**: Home Screen → "Check In to Meeting" Button

### **Pre-Meeting Modal Tests**:
- [ ] **Button**: "Check In to Meeting" button appears
- [ ] **Click**: Opens input for meeting name
- [ ] **Input**: Can enter meeting name
- [ ] **Submit**: "Check In" button works
- [ ] **Modal Opens**: Pre-meeting modal slides in
- [ ] **Icon**: Brain icon (🧠) with blue accent
- [ ] **Title**: "Before You Go" + meeting name
- [ ] **Mood Buttons**: 5 emoji buttons (😔 😕 😐 🙂 😊)
- [ ] **Mood Select**: Tapping selects (blue highlight)
- [ ] **Intention Field**: Can type intention
- [ ] **Hope Field**: Can type hope
- [ ] **Save Disabled**: Until intention filled
- [ ] **Save Works**: Saves to database
- [ ] **Modal Closes**: After save
- [ ] **Skip Button**: Closes without saving

### **Post-Meeting Modal Tests**:
- [ ] **Test Button**: "Test: Show Post-Meeting Modal" appears after check-in
- [ ] **Click**: Opens post-meeting modal
- [ ] **Icon**: Heart icon (❤️) with green accent
- [ ] **Title**: "How Was It?" + meeting name
- [ ] **Mood Buttons**: 5 emoji buttons
- [ ] **Mood Lift**: Shows "+X from before meeting" (if pre-mood exists)
- [ ] **Mood Lift Green**: Shows green ↑ if improved
- [ ] **Mood Lift Red**: Shows red ↓ if declined
- [ ] **Takeaway Field**: Can type key takeaway
- [ ] **Gratitude Field**: Can type gratitude
- [ ] **Will Apply Field**: Can type application
- [ ] **Save Disabled**: Until takeaway filled
- [ ] **Save Works**: Updates database
- [ ] **Modal Closes**: After save
- [ ] **Skip Button**: Works

### **Database Tests**:
- [ ] Check Supabase → `meeting_checkins` table has new row
- [ ] Check Supabase → `meeting_reflections` table has new row
- [ ] Verify `checkin_id` links correctly
- [ ] Verify RLS policies work (can't see other users' data)

### **Result**: ✅ ❌

---

## ✅ Feature 3: Crisis Checkpoint ("Before You Use")

### **Location**: Emergency Screen → "Before You Use" Card

### **Access Tests**:
- [ ] **Navigation**: Home → Emergency button works
- [ ] **Card Visible**: Red "Before You Use" card shows
- [ ] **Icon**: Pause circle icon visible
- [ ] **Description**: "Feeling a craving? Pause here first..."
- [ ] **Button**: "Start Checkpoint" button clickable
- [ ] **Opens**: Full-screen modal opens

### **Stage 1: Initial Tests**:
- [ ] **Icon**: Large pause icon (red)
- [ ] **Title**: "Before You Use"
- [ ] **Subtitle**: "Let's pause for a moment..."
- [ ] **Slider**: Craving intensity slider (1-10)
- [ ] **Slider Value**: Shows current value (e.g., "5/10")
- [ ] **Slider Move**: Draggable, updates value
- [ ] **Trigger Field**: Can type trigger description (optional)
- [ ] **Start Button**: "Start Checkpoint" works
- [ ] **Stage Advances**: Moves to Stage 2

### **Stage 2: Pause (10-Minute Timer) Tests**:
- [ ] **Timer Circle**: Large circle with countdown
- [ ] **Timer Display**: Shows MM:SS format (10:00 → 09:59)
- [ ] **Timer Counts**: Decreases every second
- [ ] **Title**: "Wait 10 Minutes"
- [ ] **Subtitle**: "Cravings peak and pass..."
- [ ] **Tips Box**: Shows 4 tips (walk, water, breathe, call)
- [ ] **Icons**: Each tip has icon (walk, water drop, air, phone)
- [ ] **Skip Button**: "Skip (not recommended)" shows
- [ ] **Skip Confirm**: Shows confirmation dialog
- [ ] **Skip Works**: Advances to Stage 3
- [ ] **Timer Complete**: Auto-advances after 10 min (or speed up for testing)

### **Stage 3: Reflect (Emotions) Tests**:
- [ ] **Icon**: Edit note icon with purple accent
- [ ] **Title**: "What Are You Feeling?"
- [ ] **Subtitle**: "Name the emotions..."
- [ ] **Emotion Chips**: 12 emotion buttons (Angry, Anxious, etc.)
- [ ] **Multi-Select**: Can select multiple emotions
- [ ] **Visual Feedback**: Selected chips turn blue
- [ ] **Journal Field**: Can type journal entry (optional)
- [ ] **Continue Button**: Works
- [ ] **Stage Advances**: Moves to Stage 4

### **Stage 4: Contact (Sponsor) Tests**:
- [ ] **Icon**: Support agent icon with green
- [ ] **Title**: "Reach Out"
- [ ] **Subtitle**: "You don't have to do this alone..."
- [ ] **Sponsor Card**: Shows sponsor name + phone (if set)
- [ ] **Call Button**: "Call Now" button
- [ ] **Text Button**: "Send Text" button
- [ ] **No Sponsor**: Shows "No sponsor set up yet" if missing
- [ ] **Final Slider**: "How's the craving now?" (1-10)
- [ ] **I Resisted Button**: Green gradient button
- [ ] **I Used Button**: Gray button below
- [ ] **Resisted Works**: Shows celebration dialog
- [ ] **Used Works**: Saves outcome
- [ ] **Modal Closes**: Returns to home

### **Database Tests**:
- [ ] Check Supabase → `crisis_checkpoints` table has new row
- [ ] Verify `outcome` field ('resisted' or 'used')
- [ ] Verify `craving_intensity` saved
- [ ] Verify `final_craving_intensity` saved
- [ ] Verify `waited_10_minutes` boolean
- [ ] Verify `emotions_identified` array
- [ ] Verify `hours_resisted` calculated

### **Result**: ✅ ❌

---

## 🚨 Critical Bugs to Watch For

### **Common Issues**:
1. **Import Errors**: "Cannot find module '@recovery/shared'"
   - Fix: Check package.json workspace references
2. **TypeScript Errors**: Component prop mismatches
   - Fix: Check navigation types, modal props
3. **Database Errors**: "relation does not exist"
   - Fix: Verify migrations ran successfully
4. **Render Errors**: "undefined is not an object"
   - Fix: Add null checks, optional chaining
5. **Navigation Errors**: "Cannot navigate to unknown screen"
   - Fix: Check navigation types match navigator screens

### **Performance Issues**:
1. **Slow Animations**: Check Reanimated worklet compilation
2. **Lag on Input**: Reduce re-renders, debounce input
3. **Memory Leaks**: Clean up timers/subscriptions in useEffect
4. **Crash on Modal Close**: Check state cleanup

---

## 📊 Success Criteria

### **Must Pass**:
- [ ] All 3 features render without crashes
- [ ] No TypeScript compilation errors
- [ ] Database saves work correctly
- [ ] Navigation flows complete successfully
- [ ] Modals open and close properly
- [ ] User input saves correctly

### **Should Pass**:
- [ ] Animations are smooth (no jank)
- [ ] Accessibility works (VoiceOver/TalkBack)
- [ ] Error handling shows friendly messages
- [ ] Skip/cancel buttons work

### **Nice to Have**:
- [ ] Perfect pixel-matching design
- [ ] Haptic feedback on interactions
- [ ] Loading states shown
- [ ] Success toasts/notifications

---

## 🐛 Bug Report Template

If you find bugs, document them:

```markdown
### Bug: [Short Description]
**Feature**: [Circular Rings / Meeting Reflections / Crisis Checkpoint]
**Severity**: [Critical / High / Medium / Low]
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Error Message**: [If any]
**Screenshot**: [If applicable]
```

---

## 🎯 Quick Test Path (15 minutes)

For quick smoke test:

1. **Open app** → Home screen loads ✅
2. **Scroll down** → Circular rings animate ✅
3. **Tap "Check In to Meeting"** → Enter name → Pre-modal shows ✅
4. **Fill pre-modal** → Save → Modal closes ✅
5. **Tap test button** → Post-modal shows → Fill → Save ✅
6. **Tap Emergency** → "Before You Use" card shows ✅
7. **Tap "Start Checkpoint"** → Full flow → "I Resisted" ✅
8. **Check Supabase** → All 3 tables have data ✅

**Time**: ~15 minutes  
**Result**: If all ✅ → MVP READY! 🚀

---

## 📝 Test Results

**Tester**: _______________________  
**Date**: _______________________  
**Device**: _______________________  
**OS Version**: _______________________  

**Overall Result**: ✅ PASS / ❌ FAIL  
**Bugs Found**: _______  
**Critical Issues**: _______  
**Ready for Beta**: YES / NO  

---

**After testing**: Report back with results! 🎉
