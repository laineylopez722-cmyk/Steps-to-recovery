# Device Testing Checklist — Steps to Recovery

> Comprehensive validation checklist for rehab deployment.
> Use this checklist before H enters rehab to ensure app reliability.
> Status: **DRAFT** | Last updated: 2026-02-16

---

## Pre-Rehab Validation

### ✅ Core Functionality
- [ ] App loads successfully on Android device
- [ ] Login/signup flow works
- [ ] User session persists after app restart
- [ ] All 39 screens render without crashes
- [ ] Bottom tab navigation works reliably

### ✅ Offline-First Core Flows
- [ ] Create journal entry offline → syncs when online
- [ ] View journal entries offline
- [ ] Complete morning check-in offline → syncs when online
- [ ] Complete evening check-in offline → syncs when online
- [ ] View step work questions offline
- [ ] Save step work answers offline → syncs when online
- [ ] Favorite a meeting offline
- [ ] View favorite meetings offline

### ✅ Crisis & Safety
- [ ] Emergency screen opens (no network required)
- [ ] Crisis resources display without network
- [ ] Crisis detection triggers on risk keywords
- [ ] Sponsor contact accessible without network
- [ ] Safety plan loads offline

### ✅ AI Companion
- [ ] AI chat opens and responds (network required)
- [ ] Context from journal entries loads
- [ ] Context from check-ins loads
- [ ] Context from step work loads
- [ ] Conversation history persists
- [ ] AI handles gracefully when offline (clear messaging)

### ✅ Network Transitions
- [ ] Create content offline → auto-syncs when back online
- [ ] Sync status indicator updates correctly
- [ ] Offline indicator shows when no network
- [ ] Graceful handling of slow/unreliable network

---

## Daily Use Scenarios

### Morning Routine
1. Open app → Verify today loads
2. Complete morning check-in
3. Review step work for the day
4. View meeting schedule
5. AI companion check-in

### Throughout Day
1. Quick journal entry
2. Meeting favorites/notes
3. Evening reflection/check-in
4. AI companion conversation

### Evening/Sleep
1. Review daily progress
2. Weekly report generation works
3. Sponsor communication
4. Gratitude entry

---

## Known Limitations (Expected Behavior)

### Non-Blocking
- AI companion requires network (offline fallback is informational message only)
- Meeting finder requires network (cached data only)
- Real-time sync requires network connection
- Push notifications require network

### Workarounds if Issues Occur
1. Force-close and reopen app if sync stalls
2. Toggle airplane mode to trigger sync retry
3. Pull-to-refresh on journal/check-in lists
4. Re-login if session becomes stuck

---

## Quick Verification (5 Minutes)

Run through this quick verification before rehab:

1. [ ] Open app → Home screen loads
2. [ ] Open Journal → Create entry → Save
3. [ ] Open Steps → View current step
4. [ ] Open Meetings → Verify cached data loads
5. [ ] Open Profile → Settings accessible
6. [ ] AI chat responds to greeting
7. [ ] Toggle airplane mode on → Verify offline indicator
8. [ ] Toggle airplane mode off → Verify sync resumes

---

## Post-Deployment Monitoring

### Watch For
- Sync failures in logs
- Crash reports (ErrorBoundary catches these)
- AI timeout errors (expected behavior offline)
- Battery drain (background sync)

### Emergency Contacts
- **H's sponsor**: Available via Crisis screen
- **Crisis resources**: Pre-loaded in app
- **Technical issues**: Contact during scheduled check-ins

---

## Test Accounts

| Account | Purpose |
|---------|---------|
| Primary test user | Daily validation |
| Fresh signup test | Onboarding flow |
| Offline test user | Content created offline |

---

## Version Info

- **App version**: Check in Profile → About
- **Build date**: Check in Profile → About
- **Last tested**: [DATE]
- **Tester**: [NAME]
