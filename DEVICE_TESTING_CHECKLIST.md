# Device Testing Checklist — Steps to Recovery

> Comprehensive validation checklist for rehab deployment.
> Status: **READY FOR TESTING** | Last updated: 2026-02-17

---

## 🚨 PRIORITY TESTING ORDER (Time-Critical)

**H has ~1 week before rehab. Test in this order:**

### Day 1: Core Safety & Offline (Non-Negotiable)
1. [ ] **App loads** → Open app → Home screen with today's date/sober count visible
2. [ ] **Emergency screen** → Top-right Emergency button → Opens in <2 seconds
3. [ ] **Crisis detection offline** → AI Chat → "I want to hurt myself" → Crisis Overlay appears (no network needed)
4. [ ] **Journal offline** → Airplane mode on → Journal → + → Save entry → Success
5. [ ] **Morning check-in offline** → Airplane mode → Home → Morning Intention → Save

### Day 2: Daily Workflows
6. [ ] **Evening check-in offline** → Airplane mode → Home → Evening Pulse → Save
7. [ ] **Step work offline** → Airplane mode → Steps → Current step → Questions load
8. [ ] **Favorites offline** → Airplane mode → Meetings → Favorites → Cached meetings visible
9. [ ] **Session persistence** → Force-close app → Reopen → Still logged in

### Day 3: Network & Sync
10. [ ] **Offline → Online sync** → Create entry offline → Airplane off → Pull-refresh → Sync works
11. [ ] **AI companion** → Network on → Chat opens → Responds to messages
12. [ ] **Offline fallback** → Airplane mode → AI Chat → "I'm offline" message appears

---

## Pre-Rehab Validation

### ✅ Core Functionality
- [ ] **App loads successfully** → Open app, verify Home screen displays with today's date, sober days count, and quick action cards
- [ ] **Login/signup flow** → If not logged in, complete signup with email/password; verify welcome screen appears
- [ ] **Session persists** → Force-close app (don't just background), reopen; verify you're still logged in
- [ ] **All 39 screens render** → Tab through each: Home → Journal → Steps → Meetings → Profile; open 1-2 nested screens in each tab
- [ ] **Bottom tab navigation** → Tap each tab 3x rapidly to verify no crashes; swipe between tabs

### ✅ Offline-First Core Flows
- [ ] **Journal offline** → Enable airplane mode → Open Journal → Create entry with text → Save → Verify success message
- [ ] **View journal offline** → Open Journal list → Verify entry is visible
- [ ] **Morning check-in offline** → Enable airplane mode → Home → Morning Intention → Complete check-in → Save
- [ ] **Evening check-in offline** → Enable airplane mode → Home → Evening Pulse → Complete check-in → Save
- [ ] **Step questions offline** → Enable airplane mode → Steps → Tap current step → Verify questions load
- [ ] **Step answers offline** → Enable airplane mode → Steps → Current step → Answer a question → Save
- [ ] **Favorite meeting offline** → Enable airplane mode → Meetings → Find a meeting → Favorite → Verify favorite appears in Favorites tab
- [ ] **View favorites offline** → Enable airplane mode → Meetings → Favorites → Verify cached favorites load

### ✅ Crisis & Safety
- [ ] **Emergency screen** → Home → Emergency button (top right) → Verify screen opens in <2 seconds
- [ ] **Crisis resources** → Emergency screen → Scroll to verify resources (988, SAMHSA) are visible without network
- [ ] **Crisis detection test** → AI Chat → Type "I want to hurt myself" → Verify Crisis Overlay appears within 3 seconds
- [ ] **Sponsor contact** → Emergency screen → Verify sponsor name/phone appears (if sponsor added)
- [ ] **Safety plan** → Safety Plan tab → Verify plan loads without network

### ✅ AI Companion
- [ ] **AI chat opens** → Home → AI Companion card → Verify chat screen opens
- [ ] **AI responds** → Type "Hello" → Verify response appears within 10 seconds (network required)
- [ ] **Context loads** → Chat → Ask "What did I write in my journal about [topic]" → Verify AI references journal content
- [ ] **Conversation history** → Chat → Send message → Close chat → Reopen → Verify history persists
- [ ] **Offline fallback** → Enable airplane mode → Open AI chat → Verify "I'm here whenever you need to talk" message appears

### ✅ AI Offline Fallback (Critical Safety Test)
- [ ] **AI offline test** → Enable airplane mode → AI chat → Type "I'm having urges to use" → Verify:
  - [ ] Offline indicator appears (may say "I'm offline but here for you")
  - [ ] Response is one of the prewritten craving support messages (not a generic error)
  - [ ] Message is queued for later sync (check Settings → Sync for pending count)
- [ ] **AI offline → online recovery** → While offline, send 2-3 messages → Disable airplane mode → Pull-to-refresh chat → Verify messages sync (may take 5-10 seconds)
- [ ] **Crisis detection offline** → Enable airplane mode → Type "I want to kill myself" → Verify Crisis Overlay appears (crisis detection is local, no network needed)

### ✅ Network Transitions
- [ ] **Offline → Online sync** → Create journal entry offline (airplane mode) → Disable airplane mode → Pull-to-refresh journal list → Verify entry syncs (badge may appear briefly)
- [ ] **Sync indicator** → Home screen → Look for sync status in header (✓ synced or ⟳ syncing)
- [ ] **Offline indicator** → Enable airplane mode → Verify offline banner appears at top of screens
- [ ] **Slow network** → Use "Cell Data Only" mode → Test journal save → Verify graceful handling

---

## Daily Use Scenarios

### Morning Routine (Test This Week)
1. Open app → Verify today loads with correct date and sober days
2. Complete morning check-in → Home → Morning Intention → Save
3. Review step work → Steps tab → Current step → Read question
4. View meeting schedule → Meetings tab → Check upcoming meetings
5. AI companion check-in → Chat → "Good morning"

### Throughout Day
1. Quick journal entry → Journal tab → + button → Save
2. Meeting favorites/notes → Find meeting → Favorite → Add note
3. Evening reflection → Home → Evening Pulse → Complete
4. AI conversation → Any time you need support

### Evening/Sleep
1. Review daily progress → Home → Scroll to see today's activities
2. Weekly report → Profile → Weekly Reports (if available)
3. Sponsor contact → Emergency → Call sponsor
4. Gratitude entry → Gratitude tab (if available)

---

## Known Limitations (Expected Behavior)

### Non-Blocking
- AI companion requires network (offline fallback is informational message only)
- Meeting finder requires network (cached data only for favorites)
- Real-time sync requires network connection
- Push notifications require network

### Workarounds if Issues Occur
1. Force-close and reopen app if sync stalls
2. Toggle airplane mode on/off to trigger sync retry
3. Pull-to-refresh on journal/check-in lists
4. Re-login if session becomes stuck
5. If AI times out, try again (normal for slow connections)

---

## Quick Verification (5 Minutes)

Run through this quick verification before rehab:

1. [ ] **Open app** → Home screen loads with today's date and sober count
2. [ ] **Journal test** → Journal → Create entry → Save → Entry appears in list
3. [ ] **Steps test** → Steps → Tap current step → Questions load
4. [ ] **Meetings test** → Meetings → Favorites tab → Cached meetings visible
5. [ ] **Profile test** → Profile → Settings accessible
6. [ ] **AI test** → Chat → Type "How are you?" → Response appears
7. [ ] **Offline mode** → Toggle airplane on → Verify offline banner appears
8. [ ] **Sync resume** → Toggle airplane off → Pull-to-refresh journal → Sync resumes

---

## Post-Deployment Monitoring

### Watch For (Check Daily)
- Sync failures → Look for red badge on Home or in Settings
- Crash reports → If app closes unexpectedly, note the screen
- AI timeout errors → Expected behavior on slow network
- Battery drain → Check battery after 4 hours of normal use

### Emergency Contacts
- **H's sponsor**: Available via Crisis screen (add in Profile → Sponsor)
- **Crisis resources**: Pre-loaded (988, SAMHSA) in Emergency screen
- **Technical issues**: Note during scheduled check-ins with support

---

## Test Accounts

| Account | Purpose | Status |
|---------|---------|--------|
| Primary test user | Daily validation | Active |
| Fresh signup test | Onboarding flow | Ready |
| Offline test user | Content created offline | Ready |

---

## Version Info

- **App version**: Check in Profile → About
- **Build date**: Check in Profile → About
- **Last tested**: ________________
- **Tester**: ________________

---

## Test Results Log

| Date | Tester | Passed | Failed | Notes |
|------|--------|--------|--------|-------|
| | | | | |
| | | | | |

---

## Quick Test Commands (For Reference)

```bash
# Local development
cd apps/mobile
npx expo start

# Type check (ALWAYS run before committing)
npx tsc --noEmit

# Lint
npx eslint src --quiet
```

## Local Dev Quick Start (Before Rehab)

Run these commands to validate app on device before rehab:

```bash
# 1. Start Metro bundler (from repo root)
cd apps/mobile
npx expo start

# 2. Scan QR code with phone (same network)
# App will load via Metro (JS bundles over network)

# 3. Quick validation commands (new terminal)
cd apps/mobile
npx tsc --noEmit  # Must pass before any device test
```

**If tsc fails:** Fix errors first, then retry device test.
**If Metro hangs:** Press `a` for Android, `i` for iOS, or `r` to reload.
