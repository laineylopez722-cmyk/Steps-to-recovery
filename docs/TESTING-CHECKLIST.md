# Testing Checklist - Steps to Recovery App

**Version**: 1.0  
**Last Updated**: 2026-02-06  
**Target Platforms**: iOS 15+, Android 12+

---

## Pre-Testing Setup

- [ ] Fresh install on physical device (not just simulator)
- [ ] Clear app data between test runs
- [ ] Test on both iOS and Android
- [ ] Enable screen reader for accessibility tests
- [ ] Test with airplane mode for offline scenarios
- [ ] Have Supabase dashboard open for backend verification

---

## 1. Authentication & Onboarding

### Sign Up Flow
- [ ] Can create account with email/password
- [ ] Password validation works (min 8 chars)
- [ ] Email validation works (valid format required)
- [ ] Error shown for existing email
- [ ] Account created in Supabase `profiles` table
- [ ] Encryption key generated and stored in SecureStore
- [ ] User redirected to onboarding after signup

### Login Flow
- [ ] Can login with valid credentials
- [ ] Error shown for invalid credentials
- [ ] "Remember me" persists session across app restarts
- [ ] Session restored on cold start (no re-login required)

### Onboarding
- [ ] Clean date picker works
- [ ] Program selection (AA/NA/CA/etc.) saves correctly
- [ ] Can skip optional steps
- [ ] Data saves to profile table
- [ ] User redirected to home screen after completion

### Logout
- [ ] Logout clears session
- [ ] Logout cleanup removes local data (per settings)
- [ ] User redirected to login screen
- [ ] Cannot access protected screens after logout

---

## 2. Home Screen & Navigation

### Home Screen Display
- [ ] Clean time displays correctly (days/hours/minutes)
- [ ] Morning intention card shown before noon
- [ ] Evening pulse card shown after 6 PM
- [ ] Quick actions (journal, steps, meetings) navigate correctly
- [ ] Emergency FAB button always visible and accessible

### Navigation
- [ ] Bottom tab bar shows all main sections
- [ ] Tab icons highlight correctly for active screen
- [ ] Back navigation works on all screens
- [ ] Deep links work (if applicable)

---

## 3. Journal Features

### Create Entry
- [ ] Can create new journal entry via FAB or home screen
- [ ] Title field (optional) works
- [ ] Body field (required) works
- [ ] Mood slider (1-5) works
- [ ] Craving slider (1-5) works
- [ ] Tags can be added (comma-separated or pills)
- [ ] Date picker allows backdating entries
- [ ] Entry saves successfully
- [ ] Entry encrypted before storage (verify DB has encrypted blob)
- [ ] Entry appears in list immediately (optimistic update)

### Edit Entry
- [ ] Can tap entry to edit
- [ ] All fields pre-populated correctly
- [ ] Changes save successfully
- [ ] Updated entry reflects in list
- [ ] Last modified timestamp updates

### Delete Entry
- [ ] Swipe-to-delete works (or context menu)
- [ ] Confirmation dialog shown
- [ ] Entry removed from list
- [ ] Entry deleted from local DB
- [ ] Deletion synced to Supabase

### List View
- [ ] Entries sorted by date (newest first)
- [ ] Search filters entries correctly (title, body, tags)
- [ ] Scroll performance smooth with 50+ entries
- [ ] Empty state shown when no entries
- [ ] Pull-to-refresh works

### Offline Mode
- [ ] Can create entries while offline
- [ ] Entries queue for sync (check sync_queue table)
- [ ] Entries sync when network restored
- [ ] No duplicate entries created

---

## 4. Daily Check-Ins

### Morning Intention
- [ ] Prompted before noon (or via home card)
- [ ] Can set gratitude items (3 prompts)
- [ ] Can set daily intention
- [ ] Mood slider works
- [ ] Saves successfully
- [ ] Encrypted in database

### Evening Pulse
- [ ] Prompted after 6 PM (or via home card)
- [ ] Can reflect on gratitude
- [ ] Can review intention completion
- [ ] Mood slider works
- [ ] Craving slider works
- [ ] Saves successfully

### Streak Tracking
- [ ] Streak increments for consecutive days
- [ ] Streak resets if day missed
- [ ] Streak displayed on home screen
- [ ] Milestone achievements trigger (1, 7, 30, 90, 365 days)

---

## 5. Step Work

### Steps Overview
- [ ] All 12 steps listed
- [ ] Current step highlighted
- [ ] Progress indicator shows completion %
- [ ] Can tap step to view detail

### Step Detail
- [ ] Step description displayed
- [ ] Questions load correctly for Step 1 (35+ questions)
- [ ] Questions grouped into sections
- [ ] Can type answers in text areas
- [ ] Answers auto-save (debounced)
- [ ] Answers encrypted in database
- [ ] Progress bar updates as questions answered

### Step Review
- [ ] Can review all answers for a step
- [ ] Can mark step as "complete"
- [ ] Completion date saved
- [ ] Completion triggers achievement

---

## 6. Emergency Toolkit

### Crisis Hotlines
- [ ] All 3 hotlines displayed (988, SAMHSA, Crisis Text Line)
- [ ] Tap-to-call works for phone numbers
- [ ] SMS link works for Crisis Text Line
- [ ] Descriptions are clear and calming

### Breathing Exercise
- [ ] Box breathing circle animation works
- [ ] Can tap to start/pause
- [ ] 4 cycles complete correctly (4s each phase)
- [ ] Instructions clear
- [ ] Haptic feedback on tap (if enabled)

### Grounding Techniques
- [ ] 5-4-3-2-1 technique displayed clearly
- [ ] Color-coded steps readable
- [ ] Text is calming and supportive

### Immediate Actions
- [ ] All 6 action items displayed
- [ ] Checkmarks visible (decorative)
- [ ] Text is actionable

---

## 7. Sponsor Connection (When Implemented)

### Connect to Sponsor
- [ ] Can search for sponsor by email/phone
- [ ] Can send sponsorship request
- [ ] Request appears in sponsor's inbox
- [ ] Notification sent to sponsor

### Accept/Decline Request
- [ ] Sponsor can accept request
- [ ] Sponsor can decline request
- [ ] Both parties notified of result

### Share Journal Entry
- [ ] Share button visible on journal entries
- [ ] Share confirmation modal appears
- [ ] Entry shared with sponsor
- [ ] "Shared" badge appears on entry

### Sponsor Dashboard
- [ ] Sponsor sees list of sponsees
- [ ] Shared entries visible in dashboard
- [ ] Can read shared entry (read-only)
- [ ] Unread badge for new shares

---

## 8. Meeting Finder

### Search Meetings
- [ ] Current location detected (with permission)
- [ ] Search radius slider works
- [ ] Meetings load from API
- [ ] Meeting cards display: name, time, distance, type

### Filter Meetings
- [ ] Can filter by meeting type (AA/NA/CA)
- [ ] Can filter by day of week
- [ ] Filters apply correctly

### Meeting Details
- [ ] Can tap meeting to see details
- [ ] Address displayed with map (optional)
- [ ] Call-in info shown (if online meeting)
- [ ] Directions link works (Google Maps/Apple Maps)

### Favorites (When Implemented)
- [ ] Can favorite a meeting
- [ ] Favorites persist across sessions
- [ ] Can view favorites list

---

## 9. Profile & Settings

### Profile View
- [ ] Avatar displayed (or initials)
- [ ] Clean time displayed
- [ ] Program displayed (AA/NA/etc.)
- [ ] Clean date editable
- [ ] Profile updates save correctly

### Settings
- [ ] Notifications toggle works
- [ ] Reminder times can be set
- [ ] Theme toggle works (light/dark)
- [ ] Privacy settings accessible
- [ ] Logout button works

---

## 10. Sync & Offline Mode

### Initial Sync
- [ ] Data syncs on first login (pull from cloud)
- [ ] Loading states shown during sync
- [ ] Errors handled gracefully

### Background Sync
- [ ] Data syncs in background (when app backgrounded)
- [ ] Sync queue processes correctly (deletes, then inserts, then updates)
- [ ] Retry logic works for failed syncs (up to 3 attempts)

### Conflict Resolution
- [ ] Last-write-wins for same record (by updated_at)
- [ ] No data loss on conflicts
- [ ] User not prompted for trivial conflicts

### Offline Creation
- [ ] All CRUD operations work offline
- [ ] Items queued in sync_queue table
- [ ] Queue processes when online
- [ ] No duplicates created

---

## 11. Security & Encryption

### Data at Rest
- [ ] Journal entries encrypted in SQLite (verify blob is not plaintext)
- [ ] Step work answers encrypted
- [ ] Daily check-ins encrypted
- [ ] Encryption key stored in SecureStore (not AsyncStorage)

### Data in Transit
- [ ] Network requests use HTTPS
- [ ] Supabase connection uses TLS
- [ ] Auth tokens not logged to console

### Authentication
- [ ] Session tokens expire after inactivity (check Supabase config)
- [ ] RLS policies enforced (cannot read other users' data)
- [ ] Cannot access API endpoints without valid token

### Privacy
- [ ] No analytics tracking without consent
- [ ] No sensitive data in logs (check logger usage)
- [ ] User can export/delete data (GDPR compliance)

---

## 12. Accessibility (Screen Reader Testing)

### iOS VoiceOver
- [ ] Can navigate entire app with VoiceOver
- [ ] All buttons have clear labels
- [ ] Form inputs have labels and hints
- [ ] Headings announced correctly
- [ ] Errors announced to user
- [ ] Loading states announced

### Android TalkBack
- [ ] Can navigate entire app with TalkBack
- [ ] All interactive elements focusable
- [ ] Focus order logical
- [ ] Gestures work correctly
- [ ] Announcements clear

### Visual Accessibility
- [ ] Text meets WCAG AA contrast ratios (4.5:1)
- [ ] Touch targets ≥48x48dp
- [ ] Text resizable (respect system font size)
- [ ] No critical info conveyed by color alone

---

## 13. Performance

### App Launch
- [ ] Cold start <2 seconds on mid-range device
- [ ] Splash screen shown during load
- [ ] No white flash on dark mode

### List Scrolling
- [ ] Journal list scrolls smoothly (60fps)
- [ ] Step questions list scrolls smoothly
- [ ] No frame drops with 100+ entries

### Memory Usage
- [ ] App uses <150MB RAM (typical usage)
- [ ] No memory leaks (monitor over 10 min session)

### Battery
- [ ] App doesn't drain battery in background
- [ ] Location services only active during meeting search

---

## 14. Error Handling

### Network Errors
- [ ] Offline banner shown when network unavailable
- [ ] Actions queue for later (don't fail)
- [ ] User notified when sync fails after 3 retries

### Validation Errors
- [ ] Form validation messages clear
- [ ] Errors appear inline near field
- [ ] Can correct error and resubmit

### Crash Recovery
- [ ] App doesn't crash on invalid data
- [ ] Crash reports sent to Sentry (if configured)
- [ ] User can recover from crash (no data loss)

---

## 15. Edge Cases

### Empty States
- [ ] First-time user sees helpful empty states
- [ ] Empty states have clear call-to-action

### Long Content
- [ ] Long journal entries render correctly (1000+ words)
- [ ] Long answers in step work don't break UI
- [ ] Text wraps appropriately

### Date/Time Edge Cases
- [ ] App works across midnight (check-in streaks)
- [ ] Timezone changes handled correctly
- [ ] Daylight Saving Time transitions work

### Data Limits
- [ ] Can handle 1000+ journal entries
- [ ] Can handle 100+ sponsorships (when implemented)
- [ ] Search remains fast with large datasets

---

## Test Environments

### iOS
- [ ] iPhone 13/14/15 (iOS 17+)
- [ ] iPad (iPadOS 17+)
- [ ] Simulator (for quick iteration)

### Android
- [ ] Pixel 6/7/8 (Android 13+)
- [ ] Samsung Galaxy S23 (OneUI)
- [ ] Emulator (for quick iteration)

---

## Regression Testing

Run this checklist:
- Before each release
- After major feature additions
- After dependency updates
- After fixing P0/P1 bugs

---

## Bug Reporting Template

When filing bugs, include:

```
**Environment**
- Device: [e.g., iPhone 14 Pro]
- OS Version: [e.g., iOS 17.2]
- App Version: [e.g., 1.0.0-beta.3]

**Steps to Reproduce**
1. Go to '...'
2. Tap on '...'
3. See error

**Expected Behavior**
[What should happen]

**Actual Behavior**
[What actually happens]

**Screenshots**
[If applicable]

**Logs**
[Console output or crash logs]
```

---

## Sign-Off

Before marking testing complete:

- [ ] All P0 (critical) tests pass
- [ ] 90%+ of P1 (important) tests pass
- [ ] No known crashes
- [ ] Security checklist complete
- [ ] Accessibility spot-check complete
- [ ] Performance acceptable
- [ ] Documentation updated

**Tested By**: _______________  
**Date**: _______________  
**Version**: _______________  
**Ready for Beta**: ☐ Yes  ☐ No (see issues)
