# Integration Guide - Wiring New Features

**Status**: Implementation guide for connecting features to navigation  
**Time Required**: 2-3 hours  
**Date**: 2026-02-06

---

## 🎯 Overview

This guide shows how to integrate the 3 new features into the main app:

1. **Circular Progress Rings** - Already integrated ✅
2. **Meeting Reflections** - Wire into meeting check-in flow
3. **Crisis Checkpoint** - Add to navigation and emergency toolkit

---

## ✅ 1. Circular Progress Rings (Complete)

**Status**: Already integrated into `HomeScreenModern.tsx`

**Location**: Home screen sobriety counter  
**No additional work needed** ✅

---

## 📋 2. Meeting Reflections Integration

### **A. Create Meeting Check-in Hook**

**File**: `apps/mobile/src/features/meetings/hooks/useMeetingCheckin.ts`

```typescript
import { useState } from 'react';
import { createMeetingCheckin } from '../services/meetingCheckinService';

export function useMeetingCheckin(userId: string) {
  const [isChecking, setIsChecking] = useState(false);
  const [currentCheckin, setCurrentCheckin] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkin = async (meetingName: string, location?: string) => {
    setIsChecking(true);
    setError(null);

    try {
      const result = await createMeetingCheckin(userId, {
        meeting_name: meetingName,
        location,
        meeting_type: 'NA', // or dynamic
      });

      if (result.success && result.checkin) {
        setCurrentCheckin(result.checkin);
        return { success: true, checkin: result.checkin };
      } else {
        setError(result.error || 'Failed to check in');
        return { success: false };
      }
    } catch (err) {
      setError('Unexpected error');
      return { success: false };
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkin,
    currentCheckin,
    isChecking,
    error,
  };
}
```

---

### **B. Update Meeting Finder Screen**

**File**: `apps/mobile/src/features/meetings/screens/MeetingFinderScreen.tsx` (or wherever meeting check-in happens)

**Add imports**:

```typescript
import { useState } from 'react';
import { PreMeetingReflectionModal } from '../components/PreMeetingReflectionModal';
import { PostMeetingReflectionModal } from '../components/PostMeetingReflectionModal';
import { useMeetingCheckin } from '../hooks/useMeetingCheckin';
```

**Add state**:

```typescript
const [showPreModal, setShowPreModal] = useState(false);
const [showPostModal, setShowPostModal] = useState(false);
const { checkin, currentCheckin, isChecking } = useMeetingCheckin(userId);
```

**Update check-in handler**:

```typescript
const handleCheckin = async (meetingName: string, location?: string) => {
  const result = await checkin(meetingName, location);

  if (result.success && result.checkin) {
    // Show pre-meeting reflection modal
    setShowPreModal(true);
  }
};
```

**Add modals to JSX** (before closing tag):

```typescript
return (
  <View>
    {/* ... existing meeting finder UI ... */}

    {/* Pre-Meeting Reflection Modal */}
    {currentCheckin && (
      <PreMeetingReflectionModal
        visible={showPreModal}
        userId={userId}
        checkinId={currentCheckin.id}
        meetingName={currentCheckin.meeting_name}
        onClose={() => setShowPreModal(false)}
        onComplete={() => {
          setShowPreModal(false);
          // Continue to meeting details or home
          navigation.goBack();
        }}
      />
    )}

    {/* Post-Meeting Reflection Modal */}
    {currentCheckin && (
      <PostMeetingReflectionModal
        visible={showPostModal}
        userId={userId}
        checkinId={currentCheckin.id}
        meetingName={currentCheckin.meeting_name}
        preMood={currentCheckin.pre_mood} // If available
        onClose={() => setShowPostModal(false)}
        onComplete={() => {
          setShowPostModal(false);
          // Check for achievements
          navigation.navigate('Achievements' as never);
        }}
      />
    )}
  </View>
);
```

---

### **C. Add "End Meeting" Button**

**Option 1: Timer-based** (Auto-show post-modal after 2 hours):

```typescript
useEffect(() => {
  if (currentCheckin && !currentCheckin.completed_at) {
    const timer = setTimeout(
      () => {
        // Show post-meeting modal after 2 hours
        setShowPostModal(true);
      },
      2 * 60 * 60 * 1000,
    ); // 2 hours

    return () => clearTimeout(timer);
  }
}, [currentCheckin]);
```

**Option 2: Manual button**:

```typescript
<GradientButton
  title="End Meeting"
  onPress={() => setShowPostModal(true)}
  accessibilityLabel="End meeting and reflect"
/>
```

**Option 3: On next app open** (check for ended meetings):

```typescript
// In HomeScreen or App.tsx
useEffect(() => {
  checkPendingMeetings();
}, []);

const checkPendingMeetings = async () => {
  const meetings = await getActiveMeetingCheckins(userId);

  for (const meeting of meetings) {
    const hoursSinceCheckin =
      (Date.now() - new Date(meeting.checked_in_at).getTime()) / (1000 * 60 * 60);

    if (hoursSinceCheckin > 2) {
      // Show post-meeting modal
      setPendingMeeting(meeting);
      setShowPostModal(true);
      break; // One at a time
    }
  }
};
```

---

## 🚨 3. Crisis Checkpoint Integration

### **A. Add to Navigation**

**File**: `apps/mobile/src/navigation/RootNavigator.tsx` (or similar)

**Add import**:

```typescript
import { BeforeYouUseScreen } from '../features/crisis/screens/BeforeYouUseScreen';
```

**Add route**:

```typescript
<Stack.Screen
  name="BeforeYouUse"
  component={BeforeYouUseScreen}
  options={{
    headerShown: false,
    presentation: 'modal', // Full-screen modal
  }}
/>
```

---

### **B. Add to Emergency Toolkit**

**File**: `apps/mobile/src/features/emergency/screens/EmergencyToolkitScreen.tsx` (or wherever emergency tools are)

**Add button**:

```typescript
<Pressable
  style={styles.crisisButton}
  onPress={() => navigation.navigate('BeforeYouUse' as never)}
  accessibilityLabel="Before You Use - Crisis checkpoint"
  accessibilityRole="button"
>
  <View style={styles.crisisIcon}>
    <MaterialIcons name="pause-circle-filled" size={32} color={darkAccent.error} />
  </View>
  <View style={styles.crisisContent}>
    <Text style={styles.crisisTitle}>Before You Use</Text>
    <Text style={styles.crisisSubtitle}>
      Pause and work through this moment
    </Text>
  </View>
  <MaterialIcons name="arrow-forward" size={24} color={darkAccent.text.secondary} />
</Pressable>
```

**Style**:

```typescript
crisisButton: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: spacing[4],
  backgroundColor: 'rgba(239,68,68,0.1)',
  borderRadius: radius.lg,
  borderWidth: 2,
  borderColor: darkAccent.error,
  gap: spacing[3],
},
crisisIcon: {
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: 'rgba(239,68,68,0.15)',
  alignItems: 'center',
  justifyContent: 'center',
},
crisisContent: {
  flex: 1,
},
crisisTitle: {
  ...typography.h3,
  color: darkAccent.error,
  marginBottom: spacing[1],
},
crisisSubtitle: {
  ...typography.body,
  color: darkAccent.text.secondary,
},
```

---

### **C. Add Quick Access Button to Home Screen**

**File**: `apps/mobile/src/features/home/screens/HomeScreenModern.tsx`

**Add button below sobriety counter**:

```typescript
{/* Crisis Checkpoint Quick Access */}
<Animated.View entering={FadeInUp.delay(200).duration(600)}>
  <Pressable
    style={styles.crisisQuickAccess}
    onPress={() => navigation.navigate('BeforeYouUse' as never)}
    accessibilityLabel="Before You Use - Crisis help"
    accessibilityRole="button"
  >
    <MaterialIcons name="pause-circle-filled" size={24} color={darkAccent.error} />
    <Text style={styles.crisisQuickAccessText}>
      Feeling a craving? Pause here first.
    </Text>
    <MaterialIcons name="arrow-forward" size={20} color={darkAccent.error} />
  </Pressable>
</Animated.View>
```

**Style**:

```typescript
crisisQuickAccess: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: spacing[3],
  backgroundColor: 'rgba(239,68,68,0.1)',
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: 'rgba(239,68,68,0.3)',
  gap: spacing[2],
  marginBottom: spacing[4],
},
crisisQuickAccessText: {
  ...typography.body,
  color: darkAccent.error,
  flex: 1,
  fontWeight: '600',
},
```

---

## 🧭 4. Navigation Type Safety

**File**: `apps/mobile/src/types/navigation.ts` (or similar)

**Add new screen types**:

```typescript
export type RootStackParamList = {
  // ... existing screens
  BeforeYouUse: { userId: string };
  MeetingReflection: {
    checkinId: string;
    meetingName: string;
    type: 'pre' | 'post';
  };
};
```

---

## 🧪 5. Testing Checklist

### **Meeting Reflections**:

- [ ] Pre-meeting modal shows on check-in
- [ ] Mood buttons select correctly (1-5)
- [ ] Save button disabled until intention filled
- [ ] Skip button closes without saving
- [ ] Post-meeting modal shows after 2h (or on manual trigger)
- [ ] Mood lift calculates correctly
- [ ] Mood lift hidden when pre-mood missing
- [ ] Both modals save to database

### **Crisis Checkpoint**:

- [ ] Accessible from emergency toolkit
- [ ] Accessible from home screen quick button
- [ ] Stage 1: Craving intensity slider works
- [ ] Stage 2: 10-minute timer counts down
- [ ] Stage 3: Emotion chips multi-select works
- [ ] Stage 4: Sponsor quick-dial opens phone/messages
- [ ] "I Resisted" saves outcome correctly
- [ ] "I used" saves outcome correctly
- [ ] Back button prompts "Are you sure?"

### **Navigation**:

- [ ] All screens accessible via navigation
- [ ] Modal presentation works (full-screen)
- [ ] Back navigation doesn't lose state
- [ ] TypeScript types work (no errors)

---

## 📦 6. Missing Dependencies Check

Run these commands to check for missing packages:

```bash
cd apps/mobile
npm list @react-native-community/slider
npm list react-native-svg
npm list react-native-reanimated
```

**If missing, install**:

```bash
npm install @react-native-community/slider
npm install react-native-svg
npm install react-native-reanimated
```

**Then rebuild**:

```bash
npx expo prebuild --clean
npx expo run:ios  # or run:android
```

---

## 🚀 7. Build & Test

### **Development Build**:

```bash
cd apps/mobile
npx expo start
```

### **Physical Device Test**:

```bash
# iOS
npx expo run:ios --device

# Android
npx expo run:android --device
```

### **Key Things to Test**:

1. Pre-meeting modal shows and saves
2. Post-meeting modal shows after meeting
3. Crisis checkpoint full flow works
4. Sponsor quick-dial opens phone
5. Circular rings animate smoothly
6. No TypeScript errors
7. No runtime crashes

---

## 📝 8. Migration Checklist

Before testing, ensure these migrations are run:

- [x] `CONSOLIDATED-MIGRATION-FIXED.sql` (8 tables) ✅ You ran this
- [ ] `20260206000003_crisis_checkpoints.sql` (crisis table) ⏳ Run this now

**How to verify migrations ran**:

1. Go to Supabase → Table Editor
2. Check these tables exist:
   - `crisis_checkpoints` ✅
   - `meeting_reflections` ✅
   - `meeting_checkins` ✅

---

## ✅ Success Criteria

**Integration complete when**:

- [ ] Meeting reflections accessible from meeting check-in
- [ ] Crisis checkpoint accessible from 2 places (home + emergency)
- [ ] All TypeScript errors resolved
- [ ] App builds and runs without crashes
- [ ] All 3 features tested end-to-end
- [ ] Database saves work correctly

---

## 🎯 Priority Order

**Do this order for fastest results**:

1. **Crisis checkpoint navigation** (20 min) - Biggest impact, simplest integration
2. **Meeting reflection wiring** (1h) - More complex, needs check-in flow
3. **Testing & polish** (1h) - Device testing, bug fixes

---

**Total Time**: 2-3 hours  
**Difficulty**: Medium  
**Impact**: Completes MVP! 🚀

---

Let me know when migrations are done and I'll help with the code integration!
