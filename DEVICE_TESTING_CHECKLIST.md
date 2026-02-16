# DEVICE_TESTING_CHECKLIST.md — Android Smoke Test

> Use this checklist to verify Steps to Recovery is ready for daily use in rehab.
> **Estimated time:** 15-20 minutes

## Pre-Test Setup

- [ ] Install latest debug APK on Android device
- [ ] Ensure device is on WiFi (for initial sync tests)
- [ ] Enable Airplane Mode for offline tests
- [ ] Enable developer options > USB debugging (optional)

---

## 1. Core App Flow

### Onboarding
- [ ] App launches without crash
- [ ] Welcome/BeforeYouUse screens render correctly
- [ ] Can scroll through crisis support info
- [ ] Can accept and proceed to login/signup

### Authentication
- [ ] Email signup works
- [ ] Can receive and enter verification code
- [ ] Profile setup completes without error
- [ ] Login with existing account works

---

## 2. Core Recovery Features

### Home Screen
- [ ] Home screen loads with greeting
- [ ] Today's check-in card is visible
- [ ] Companion card shows (if AI enabled)
- [ ] Quick actions (New Entry, Meeting Finder) are tappable

### Journal (Online + Offline)
- [ ] Can open Journal tab
- [ ] Existing journal entries load
- [ ] Can tap + to create new entry
- [ ] **Offline test:** Enable Airplane Mode → Can still create new journal entry
- [ ] **Offline test:** Entry saves locally without error
- [ ] **Offline test:** Disable Airplane Mode → Entry syncs when back online

### Check-ins (Online + Offline)
- [ ] Today's check-in appears on Home
- [ ] Can complete a check-in (mood, urges, gratitude, etc.)
- [ ] **Offline test:** Complete check-in in Airplane Mode → Saves locally
- [ ] **Offline test:** Check-in syncs after going back online

### Steps (Step Work)
- [ ] Steps tab loads correctly
- [ ] Can view step details
- [ ] Can answer step questions
- [ ] Progress rail displays correctly
- [ ] Jump chips work (if visible)

### Meetings
- [ ] Meetings tab loads
- [ ] Map/location services prompt (if enabled)
- [ ] Empty state displays correctly for non-US users
- [ ] Meeting list renders (if data available)

### Profile
- [ ] Profile tab loads user info
- [ ] Settings are accessible
- [ ] Emergency contacts display
- [ ] Crisis resources are visible

---

## 3. Crisis & Safety (CRITICAL)

### Crisis Screens
- [ ] Can access Emergency screen from Profile
- [ ] BeforeYouUse screen appears (first launch)
- [ ] Craving Surfaced screen works
- [ ] All crisis resources are tappable
- [ ] **Offline test:** All crisis screens work WITHOUT network
- [ ] Phone numbers are clickable (if supported)

### Error Boundaries
- [ ] Navigate through all 5 main tabs rapidly
- [ ] No crashes or white screens
- [ ] If an error occurs, error boundary displays gracefully

---

## 4. AI Companion (If Enabled)

### Prerequisites
- Set `EXPO_PUBLIC_AI_PROXY_ENABLED=true` in .env.local
- Ensure `OPENAI_API_KEY` is configured

### Tests
- [ ] Can open chat from Companion card
- [ ] Can send a message
- [ ] Response appears (may take 3-5 seconds)
- [ ] **Offline test:** Chat degrades gracefully (shows offline message)
- [ ] Crisis keywords trigger appropriate response

---

## 5. Navigation & UI

### Tab Bar
- [ ] All 5 tabs visible (Home, Journal, Steps, Meetings, Profile)
- [ ] Tapping tabs switches screens instantly
- [ ] Active tab indicator shows correctly

### Haptics
- [ ] Button taps trigger haptic feedback
- [ ] Haptics don't cause delays or crashes

### Screen Transitions
- [ ] Opening screens feels smooth
- [ ] Going back works (hardware back button or on-screen)
- [ ] Modals open/close correctly

---

## 6. Offline Persistence

### Test Sequence
1. Open app with WiFi on
2. Create 2 journal entries
3. Complete 1 check-in
4. Enable Airplane Mode
5. Create 1 more journal entry
6. Complete another check-in
7. **Verify:** No errors, entries saved locally
8. Disable Airplane Mode
9. **Verify:** App reconnets, entries sync in background

---

## 7. Performance & Stability

### Quick Stress Test
- [ ] Open each tab 3x rapidly
- [ ] Open/close multiple journal entries
- [ ] No memory warnings or crashes
- [ ] App stays responsive

### Battery Impact
- [ ] App doesn't drain battery excessively
- [ ] Background sync is reasonable

---

## Issue Reporting

If you encounter issues, note:
1. **What happened:** Clear description
2. **Steps to reproduce:** Exact actions taken
3. **Device:** Android version, device model
4. **Network state:** Online/Offline at time of issue
5. **Screenshots:** If helpful

---

## Pass Criteria

✅ **App is ready for rehab use if:**
- All core features (journal, check-ins, steps) work online AND offline
- Crisis screens work without network
- No crashes during smoke test
- Tab navigation is smooth and reliable
- Error boundaries prevent white screens

❌ **App is NOT ready if:**
- Any core feature crashes
- Offline persistence fails
- Crisis screens require network
- Navigation is unreliable

---

## Notes

- This checklist complements, not replaces, real-world usage testing
- Pay special attention to how the app feels at 2am, low battery, poor connectivity
- The most important test: "Would I trust this app in a vulnerable moment?"
