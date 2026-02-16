# FOCUS.md — February 16, 2026

## Priority: Device Validation & Stability
H entering rehab ~1 week. App must be stable, reliable, and ready for daily use.

## Current Status
- ✅ TypeScript: 0 errors
- ✅ Wave 1 stack migration: Complete
- ✅ Working tree: Clean
- ⚠️ EAS free tier: Exhausted until Mar 01
- ⚠️ Wave 2 (expo-router): Pending

## Top Priority Slices

### 1. Device Validation Prep
- Verify all 39 screens render correctly
- Test offline flows (journal, check-ins, step work)
- Validate crisis screens work without network
- Test haptic feedback across device

### 2. Stability Hardening
- Monitor for any MMKV async/sync issues post-migration
- Check error boundary coverage on all screens
- Verify sync queue handles offline → online transitions

### 3. Wave 2 Planning (expo-router)
- Plan migration strategy for 39 screens, 74 nav calls
- Consider incremental migration vs. big-bang approach
- Document risks and rollback plan

## Execution Mode
- No new features
- Follow PRD.md priorities
- Small, focused commits
- Verify tsc clean before every commit
