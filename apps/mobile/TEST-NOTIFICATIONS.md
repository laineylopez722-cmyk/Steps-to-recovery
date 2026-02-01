# Notification Deep Linking - Testing Guide

## Story 3.2.1: Notification Deep Linking

### What Was Implemented

✅ **Enhanced navigation handler** - Supports nested screens with dot notation (e.g., `Home.MorningIntention`)
✅ **Parameter passing** - Notifications can pass data to screens (stepNumber, entryId, etc.)
✅ **Cold start support** - App handles notifications that launch it from closed state
✅ **Backwards compatibility** - Old string-based notifications still work
✅ **Type safety** - Full TypeScript support with proper types

### Files Changed

**NEW:**

- `apps/mobile/src/types/notifications.ts` - Type definitions
- `apps/mobile/src/navigation/__tests__/navigationRef.test.ts` - Unit tests

**MODIFIED:**

- `apps/mobile/src/navigation/navigationRef.ts` - Enhanced navigation logic
- `apps/mobile/src/contexts/NotificationContext.tsx` - Cold start handler
- `apps/mobile/src/services/notificationService.ts` - Updated payloads
- `apps/mobile/src/navigation/types.ts` - Added stack param lists

---

## Manual Testing Instructions

### Prerequisites

1. Start the development server:

```bash
cd apps/mobile
npm start
```

2. Launch on device/emulator:

```bash
# iOS
npm run ios

# Android
npm run android
```

---

## Test Case 1: Morning Check-In Notification

**Expected Behavior:** Tapping notification navigates to MorningIntentionScreen

**Steps:**

1. Open app
2. Navigate to: Profile → Notification Settings
3. Enable "Morning Check-In" notifications
4. Set time to 1 minute from current time
5. Save settings
6. **Wait for notification to appear**
7. **Tap the notification**

**✅ Success Criteria:**

- App opens to MorningIntentionScreen (not just Home tab)
- User can immediately start their morning check-in

---

## Test Case 2: Evening Check-In Notification

**Expected Behavior:** Tapping notification navigates to EveningPulseScreen

**Steps:**

1. Open app
2. Navigate to: Profile → Notification Settings
3. Enable "Evening Check-In" notifications
4. Set time to 1 minute from current time
5. Save settings
6. **Wait for notification to appear**
7. **Tap the notification**

**✅ Success Criteria:**

- App opens to EveningPulseScreen (not just Home tab)
- User can immediately start their evening reflection

---

## Test Case 3: Milestone Notification

**Expected Behavior:** Tapping notification navigates to HomeScreen with celebration

**Steps:**

1. Open app
2. Check your current clean time in Profile
3. If you're close to a milestone (1, 7, 14, 30 days), wait for automatic notification
4. **Alternative:** Use developer tools to schedule test milestone notification
5. **Tap the notification**

**✅ Success Criteria:**

- App opens to HomeScreen
- User sees their clean time tracker prominently

---

## Test Case 4: Cold Start (App Closed)

**Expected Behavior:** App launches and navigates to correct screen when tapped from notification

**Steps:**

1. Open app
2. Schedule a morning or evening notification for 1 minute from now
3. **Close app completely** (swipe away from recent apps)
4. **Wait for notification to appear**
5. **Tap the notification from lock screen**

**✅ Success Criteria:**

- App launches (cold start)
- After ~1 second, navigates to MorningIntention or EveningPulse screen
- No crash, no stuck on splash screen

---

## Test Case 5: App in Background

**Expected Behavior:** App returns to foreground and navigates to correct screen

**Steps:**

1. Open app
2. Schedule notification for 1 minute from now
3. **Press home button** (don't close app, just background it)
4. **Wait for notification to appear**
5. **Tap the notification**

**✅ Success Criteria:**

- App returns to foreground
- Navigates to correct screen
- Smooth transition, no delays

---

## Test Case 6: Invalid Screen (Error Handling)

**Expected Behavior:** App falls back to Home tab gracefully

**Steps:**

1. Use developer tools to send notification with invalid screen name
2. Tap notification

**✅ Success Criteria:**

- App doesn't crash
- Falls back to Home tab
- Error is logged but not shown to user

---

## Test Case 7: Legacy Format (Backwards Compatibility)

**Expected Behavior:** Old string-based notifications still work

**Steps:**

1. If you have old notifications scheduled (before this update)
2. Tap them

**✅ Success Criteria:**

- Old notifications navigate correctly
- No errors or crashes
- Smooth migration to new format

---

## Developer Testing Tools

### Send Test Notification (Console)

```javascript
// In React Native debugger console:

// Test morning check-in
Notifications.scheduleNotificationAsync({
  content: {
    title: '🌅 Good Morning!',
    body: 'Test notification',
    data: {
      screen: 'Home.MorningIntention',
      type: 'morning-checkin',
    },
  },
  trigger: null, // Send immediately
});

// Test evening check-in
Notifications.scheduleNotificationAsync({
  content: {
    title: '🌙 Evening Check-In',
    body: 'Test notification',
    data: {
      screen: 'Home.EveningPulse',
      type: 'evening-checkin',
    },
  },
  trigger: null,
});

// Test milestone
Notifications.scheduleNotificationAsync({
  content: {
    title: '🏆 30 Days!',
    body: 'Test milestone',
    data: {
      screen: 'Home',
      params: { days: 30 },
      type: 'milestone',
    },
  },
  trigger: null,
});
```

---

## Verification Checklist

- [ ] Morning notification → MorningIntentionScreen ✓
- [ ] Evening notification → EveningPulseScreen ✓
- [ ] Milestone notification → HomeScreen ✓
- [ ] Cold start navigation works ✓
- [ ] Background navigation works ✓
- [ ] Invalid screens fall back to Home ✓
- [ ] Legacy format still works ✓
- [ ] No TypeScript errors ✓
- [ ] No runtime errors ✓
- [ ] Logging shows correct navigation events ✓

---

## Expected Log Output

When notifications work correctly, you should see logs like:

```
[INFO] Notification tapped { title: "Good Morning!", data: { screen: "Home.MorningIntention", type: "morning-checkin" } }
[INFO] Navigated from notification { screen: "Home.MorningIntention", params: {} }
```

For cold start:

```
[INFO] App launched from notification { title: "Good Morning!" }
[INFO] Navigated from notification { screen: "Home.MorningIntention", params: {} }
```

For errors:

```
[WARN] Navigation not ready, cannot handle notification
[ERROR] Error navigating from notification { error: ..., screen: "InvalidScreen" }
```

---

## Troubleshooting

**Notifications not appearing?**

- Check notification permissions in device settings
- Verify notifications are enabled in app settings
- Check if Do Not Disturb is enabled

**Navigation not working?**

- Check logs for navigation errors
- Verify screen names match exactly (case-sensitive)
- Ensure navigation is ready (should wait ~1 second after cold start)

**App crashes?**

- Check logs for stack traces
- Verify notification payload structure
- Check TypeScript errors with `npx tsc --noEmit`

**Cold start not working?**

- Increase wait time in NotificationContext (currently 1 second)
- Check if getLastNotificationResponse() returns data
- Verify app permissions

---

## Success Metrics

✅ **All 7 test cases pass**
✅ **No crashes or errors**
✅ **Smooth user experience**
✅ **Logging shows correct navigation**
✅ **TypeScript compiles without errors**

---

## Next Steps (Optional Enhancements)

1. **Add more notification types:**
   - Journal reminders → `Journal.Editor` with `mode: 'create'`
   - Step reminders → `Steps.Detail` with `stepNumber`

2. **Add deep link URL scheme:**
   - Configure `app.json` with URL scheme
   - Enable iOS Universal Links
   - Enable Android App Links

3. **Add analytics:**
   - Track which notifications users tap
   - Measure conversion rates
   - A/B test notification content

4. **Improve cold start time:**
   - Reduce 1-second delay
   - Use navigation ready listener
   - Optimize app startup

---

**Testing completed by:** ****\_\_\_\_****

**Date:** ****\_\_\_\_****

**Results:** ****\_\_\_\_****
