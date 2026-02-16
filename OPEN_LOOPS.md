# OPEN_LOOPS.md — February 16, 2026

## In Progress
- Device validation prep (blocked by EAS free tier, local dev only)

## Pending

### High Priority
- [ ] Verify app loads on device
- [ ] Test offline journal entries
- [ ] Test offline check-ins
- [ ] Validate crisis screens work without network
- [ ] Test meeting finder empty state (non-US users)

### Medium Priority
- [ ] PowerSync offline sync evaluation
- [ ] AI companion reliability testing

### Lower Priority
- [ ] Accessibility audit beyond Profile tab
- [ ] Performance profiling on lower-end devices
- [ ] Battery impact analysis (background sync)

## Blocked
- EAS free tier exhausted until Mar 01 (cannot build for device testing via cloud)
- Local builds available but limited to debugging on connected device

## Done This Week
- ✅ 346fa2b safety: add per-screen error boundaries to all 39 screens
- ✅ 5d418f6 fix: make haptics error-safe
- ✅ ba242ae fix: improve meeting finder empty state for non-US users
- ✅ 384e157 fix: wire meeting attendance into weekly reports
- ✅ 3073830 docs: add WAVE2_PLAN.md for expo-router migration planning
- ✅ 5ab4233 docs: add DEVICE_TESTING_CHECKLIST.md for rehab validation
