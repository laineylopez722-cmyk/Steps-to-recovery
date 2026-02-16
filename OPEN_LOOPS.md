# OPEN_LOOPS.md — February 16, 2026

## In Progress
- Device validation prep (blocked by EAS free tier, local dev only)
- Offline AI fallback testing (checklist enhanced, pending device test)

## Pending

### High Priority
- [ ] Verify app loads on device (local dev)
- [ ] Test offline journal entries (local dev)
- [ ] Test offline check-ins (local dev)
- [ ] Validate crisis screens work without network (local dev)
- [ ] Test AI offline fallback on device (checklist ready)
- [ ] Test meeting finder empty state (non-US users) - ✅ done

### Medium Priority
- ✅ AI companion reliability testing (11e81f6) - added try/catch guards to memory extraction paths
- ✅ PowerSync offline sync evaluation (38d3558)

### Lower Priority
- [ ] Performance profiling on lower-end devices
- [ ] Battery impact analysis (background sync)
- ✅ Accessibility audit completed (verified all 39 screens have proper accessibility patterns)
- ✅ Sync queue offline→online transition handling reviewed and improved

## Blocked
- EAS free tier exhausted until Mar 01 (cannot build for device testing via cloud)
- Local builds available but limited to debugging on connected device

## Done This Week
- ✅ 346fa2b safety: add per-screen error boundaries to all 39 screens
- ✅ 5d418f6 fix: make haptics error-safe
- ✅ ba242ae fix: improve meeting finder empty state for non-US users
- ✅ 384e157 fix: wire meeting attendance into weekly reports
- ✅ 3073830 docs: add WAVE2_PLAN.md for expo-router migration planning
- ✅ 5ab4233 docs: add DEVICE_TESTING_CHECKLIST.md for rehab validation (re-created 2026-02-16)
- ✅ 67f9996 fix: exclude permanently failed items from pending sync count
- ✅ 38d3558 docs: PowerSync offline sync evaluation (Phase 2 prep)
- ✅ 022127a docs: enhance DEVICE_TESTING_CHECKLIST with manual test steps
- ✅ 48780f2 feat(expo-router): Phase 1 - parallel routes setup
- ✅ 7253a5e docs: add LOCAL DEV QUICK START to DEVICE_TESTING_CHECKLIST (2026-02-17)
- ✅ 5d7b6c6 docs: add NAVIGATION_INVENTORY.md for expo-router migration (2026-02-17)
- ✅ 7b072d2 docs: add PRIORITY TESTING ORDER to DEVICE_TESTING_CHECKLIST (2026-02-17)
