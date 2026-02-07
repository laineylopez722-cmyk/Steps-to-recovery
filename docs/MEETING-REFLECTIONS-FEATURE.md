# Meeting Reflections - Pre/Post Prompts Feature

**Feature**: Meeting intention setting and post-meeting reflection  
**Status**: ✅ Complete  
**Implementation Time**: 2 hours (service + UI)

---

## 🎯 Overview

Helps users maximize value from meeting attendance through structured reflection:

- **Pre-meeting**: Set intention, mood baseline, hopes
- **Post-meeting**: Capture takeaways, mood change, gratitude, application plans
- **Mood lift tracking**: Visual feedback on emotional benefit

---

## 🏗️ Architecture

### **Service Layer**

**File**: `apps/mobile/src/services/meetingReflectionService.ts`

**Functions**:

```typescript
// Pre-meeting
savePreMeetingReflection(userId, checkinId, prompts)

// Post-meeting
savePostMeetingReflection(userId, checkinId, prompts)

// Query
getReflectionForCheckin(userId, checkinId)
getAllReflections(userId)
hasReflection(userId, checkinId)

// Analysis
calculateMoodLift(reflection): number | null

// Prompts
getRandomPrePrompt(): string
getRandomPostPrompt(): string
```

---

### **UI Components**

#### **PreMeetingReflectionModal**

**File**: `apps/mobile/src/features/meetings/components/PreMeetingReflectionModal.tsx`

**Props**:

```typescript
{
  visible: boolean;
  userId: string;
  checkinId: string;
  meetingName: string;
  onClose: () => void;
  onComplete: () => void;
}
```

**Fields**:

- Mood (1-5 emoji buttons: 😔 😕 😐 🙂 😊)
- Intention (text input, randomized prompt)
- Hope (text input)

**Validation**: Requires intention (other fields optional)

---

#### **PostMeetingReflectionModal**

**File**: `apps/mobile/src/features/meetings/components/PostMeetingReflectionModal.tsx`

**Props**:

```typescript
{
  visible: boolean;
  userId: string;
  checkinId: string;
  meetingName: string;
  preMood?: number;  // For mood lift calculation
  onClose: () => void;
  onComplete: () => void;
}
```

**Fields**:

- Mood (1-5 emoji buttons)
- Key takeaway (text input, randomized prompt)
- Gratitude (text input)
- Will apply (text input - actionable item)

**Mood Lift**:

- If `preMood` provided, shows visual indicator:
  - **Green ↑**: Mood improved (+1 to +4)
  - **Red ↓**: Mood declined (-1 to -4)
  - **Hidden**: No change (0)

**Validation**: Requires key takeaway (other fields optional)

---

## 🎨 Design

### **Visual Style**:

- Glassmorphic modals
- Emoji mood selectors (56x56 circles)
- Pre-meeting: Blue accent (🧠 psychology icon)
- Post-meeting: Green accent (❤️ favorite icon)
- Smooth slide-in animation (400ms)

### **Mood Buttons**:

```
😔     😕     😐     🙂     😊
1      2      3      4      5
Low ←               → Great
```

### **Mood Lift Indicator** (Post-meeting):

```
┌──────────────────────────────┐
│  📈 +2 from before meeting   │  ← Green if positive
└──────────────────────────────┘

┌──────────────────────────────┐
│  📉 -1 from before meeting   │  ← Red if negative
└──────────────────────────────┘
```

---

## 🗄️ Database Schema

**Table**: `meeting_reflections`

```sql
CREATE TABLE meeting_reflections (
  id UUID PRIMARY KEY,
  user_id UUID → auth.users,
  checkin_id UUID → meeting_checkins (UNIQUE),

  -- Pre-meeting
  pre_intention TEXT,
  pre_mood INTEGER (1-5),
  pre_hope TEXT,

  -- Post-meeting
  post_key_takeaway TEXT,
  post_mood INTEGER (1-5),
  post_gratitude TEXT,
  post_will_apply TEXT,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Indexes**:

- `user_id, created_at DESC`
- `checkin_id`

**RLS**: Users can only access own reflections

---

## 🔄 User Flow

### **Pre-Meeting Flow**:

```
1. User taps "Check In" at meeting
2. Pre-meeting modal appears
3. Rate current mood (1-5)
4. Answer: "What do you hope to get from this meeting?"
5. Answer: "What would make this meaningful?"
6. Tap "Save & Go"
7. Reflection saved with checkin_id
8. Modal closes → Meeting check-in continues
```

### **Post-Meeting Flow**:

```
1. User marks "Meeting Ended" (or auto-trigger after 2h)
2. Post-meeting modal appears
3. Rate current mood (1-5)
4. See mood lift indicator (if pre-mood exists)
5. Answer: "What's one thing you'll remember?"
6. Answer: "What are you grateful for?"
7. Answer: "What will you apply this week?"
8. Tap "Save Reflection"
9. Reflection updated (same checkin_id)
10. Modal closes → Potential achievement unlock
```

---

## 📊 Prompt Variations

### **Pre-Meeting Prompts** (Random):

- "What do you hope to get from this meeting?"
- "What's on your mind as you arrive?"
- "What intention are you setting for this meeting?"
- "What would make this meeting valuable for you?"

### **Post-Meeting Prompts** (Random):

- "What's one thing you'll remember from today?"
- "What resonated most with you?"
- "What was your biggest takeaway?"
- "What spoke to you today?"

**Purpose**: Prevents prompt fatigue, keeps experience fresh

---

## ♿ Accessibility

### **Modal Structure**:

- Full screen reader support
- Emoji buttons have text labels
- Text inputs have descriptive labels
- Skip button always available

### **Keyboard Navigation**:

- Tab order: Mood → Intention → Hope → Save/Skip
- Enter key submits form

### **Screen Reader Announcements**:

```
Pre-meeting:
"Before You Go modal. Set an intention for Thursday Night Meeting.
Current mood: 3 out of 5. Intention field. Required."

Post-meeting:
"How Was It modal. Reflect on Thursday Night Meeting.
Current mood: 4 out of 5. Mood improved by 1 from before meeting.
Key takeaway field. Required."
```

---

## 🎯 Integration Points

### **When to Show Modals**:

**Pre-Meeting**:

- Show when user checks in at meeting location
- Show when user taps "I'm at a meeting" button
- Skip if already completed for this checkin

**Post-Meeting**:

- Auto-show 2 hours after check-in
- Show when user taps "End Meeting"
- Show on next app open after meeting end time
- Skip if already completed for this checkin

### **Integration Code**:

```typescript
import { PreMeetingReflectionModal } from '../features/meetings/components/PreMeetingReflectionModal';
import { PostMeetingReflectionModal } from '../features/meetings/components/PostMeetingReflectionModal';

// In meeting check-in screen
const [showPreModal, setShowPreModal] = useState(false);
const [showPostModal, setShowPostModal] = useState(false);

const handleCheckin = async () => {
  // Create meeting checkin
  const checkin = await createMeetingCheckin(...);

  // Show pre-meeting modal
  setShowPreModal(true);
};

const handleEndMeeting = () => {
  // Show post-meeting modal
  setShowPostModal(true);
};

return (
  <>
    <PreMeetingReflectionModal
      visible={showPreModal}
      userId={userId}
      checkinId={currentCheckin.id}
      meetingName={currentCheckin.meeting_name}
      onClose={() => setShowPreModal(false)}
      onComplete={() => {
        setShowPreModal(false);
        // Continue to meeting screen
      }}
    />

    <PostMeetingReflectionModal
      visible={showPostModal}
      userId={userId}
      checkinId={currentCheckin.id}
      meetingName={currentCheckin.meeting_name}
      preMood={reflection?.pre_mood}
      onClose={() => setShowPostModal(false)}
      onComplete={() => {
        setShowPostModal(false);
        // Check for achievements
        checkMeetingAchievements(userId);
      }}
    />
  </>
);
```

---

## 📈 Analytics & Insights

### **Mood Trends**:

```typescript
// Calculate average mood lift
const reflections = await getAllReflections(userId);
const moodLifts = reflections.map((r) => calculateMoodLift(r)).filter((lift) => lift !== null);

const avgMoodLift = moodLifts.reduce((sum, l) => sum + l, 0) / moodLifts.length;

// Result: "Meetings improve your mood by +1.8 on average"
```

### **Common Themes**:

- Track most common words in intentions
- Track gratitude patterns
- Track action items (will apply)

### **Completion Rate**:

- % of meetings with pre-reflection
- % of meetings with post-reflection
- % with both (full reflection)

---

## 🧪 Testing

### **Manual Tests**:

- [x] Pre-modal opens on meeting check-in
- [x] Mood buttons select correctly
- [x] Text inputs accept multiline
- [x] Save disabled until intention filled
- [x] Skip button closes modal without saving
- [x] Post-modal shows mood lift correctly
- [x] Mood lift hidden when pre-mood missing
- [x] VoiceOver/TalkBack announces correctly

### **Edge Cases**:

- [x] Network error during save (shows alert)
- [x] Missing checkin_id (validation error)
- [x] Modal shown twice (checks existing reflection)
- [x] Very long text input (scrollable)

---

## 🚀 Future Enhancements

### **Potential Additions**:

- [ ] Voice input for reflections (accessibility)
- [ ] Photo attachment (meeting notes, speaker)
- [ ] Share reflection with sponsor
- [ ] Reflection history view (timeline)
- [ ] Insights dashboard (mood trends, themes)
- [ ] Reminder notifications ("Reflect on last meeting?")

---

## 📱 Platform Support

| Platform | Status      | Notes                          |
| -------- | ----------- | ------------------------------ |
| iOS      | ✅ Tested   | Native emoji rendering         |
| Android  | ✅ Tested   | Material design compliant      |
| Web      | ⚠️ Untested | Should work (modal compatible) |

---

## 🎯 Competitive Advantage

### **12-Step Companion** (Competitor):

- No pre/post meeting reflection
- Basic meeting attendance tracking only

### **Steps to Recovery** (Ours):

- ✅ Pre-meeting intention setting
- ✅ Post-meeting reflection
- ✅ Mood lift visualization
- ✅ Randomized prompts (prevents fatigue)
- ✅ Gratitude tracking
- ✅ Actionable takeaways

**Result**: We help users get MORE VALUE from meetings 💎

---

## ✅ Success Criteria

- ✅ Modals render correctly
- ✅ Pre-meeting saves to database
- ✅ Post-meeting updates same record
- ✅ Mood lift calculates correctly
- ✅ Prompts randomize on each open
- ✅ Skip button works without error
- ✅ Full accessibility support
- ✅ Glassmorphic design matches app

---

**Status**: ✅ **PRODUCTION-READY**

**Built**: 2026-02-06  
**Time**: 2 hours  
**Quality**: Polished UI + service layer complete ✨
