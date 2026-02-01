# Android Production Readiness Session

## Session Date: 2026-01-31

## Objective

Ensure Steps to Recovery app runs correctly on Android/Expo and is production-ready.

---

## Audit Results Summary

**Overall Score:** 8.2/10 - Good for MVP, needs fixes before Play Store

### What's Working

- Expo SDK 54 + React 19 properly configured
- Hermes + New Architecture enabled
- AES-256-CBC encryption complete
- SQLite + IndexedDB storage adapters
- Sync service with retry logic
- Notification scheduling (in lib/notifications.ts)
- All core features: Auth, Journal, Steps, Check-ins
- Adaptive icons in all densities
- EAS production build config ready

### Issues Found: 15 Total

| Severity | Count |
| -------- | ----- |
| Critical | 3     |
| High     | 5     |
| Medium   | 4     |
| Low      | 3     |

---

## Fixes Applied

### Phase 1: Critical Config (COMPLETED)

1. **Package Name Mismatch** ✅
   - Fixed: Root `app.json` now uses `com.recovery.stepstorecovery`
   - Previously had `com.ripkdr.stepstorecovery` causing conflicts

2. **Privacy Policy URL** ✅
   - Added: `privacyPolicyUrl` to `apps/mobile/app.json`
   - Placeholder: `https://stepstorecovery.app/privacy`
   - User must update before Play Store submission

3. **Notification Channel ID** ✅
   - Fixed: app.json now uses `"defaultChannel": "default"`
   - Matches the channel created in `lib/notifications.ts:134`

4. **Notification Stubs Removed** ✅
   - Deleted: `apps/mobile/src/notifications/index.ts`
   - Was orphaned stub file with TODO comments
   - Real implementation is in `lib/notifications.ts` and `services/notificationService.ts`

### Phase 2: High Priority Runtime (IN PROGRESS)

5. **SecureStore Error Handling** - PENDING
   - File: `apps/mobile/src/adapters/secureStorage/native.ts`
   - Issue: No try-catch, can fail after device restart

6. **DatabaseContext Error Handling** - PENDING
   - File: `apps/mobile/src/contexts/DatabaseContext.tsx`
   - Issue: Dynamic import lacks timeout, can cause ANR

7. **Background Location Permission** - PENDING
   - File: `apps/mobile/src/features/meetings/hooks/useUserLocation.ts`
   - Issue: Only requests foreground, geofencing needs background

8. **BackHandler for Android** - PENDING
   - Issue: No hardware back button handling
   - Risk: Unexpected app closure

### Phase 3: Medium Priority Polish (PENDING)

9. **ProGuard Rules** - PENDING
   - File: `apps/mobile/android/app/proguard-rules.pro`
   - Missing: Expo modules, Supabase, crypto rules

10. **StatusBar Config** - PENDING
    - File: `apps/mobile/App.tsx`
    - Issue: No translucent/background for edge-to-edge

11. **FlatList Optimization** - PENDING
    - File: `apps/mobile/src/features/steps/screens/StepDetailScreen.tsx`
    - Missing: initialNumToRender, maxToRenderPerBatch

12. **Keyboard Avoiding** - PENDING
    - Files: Auth screens, journal screens
    - Issue: Fixed offset doesn't account for gesture nav

---

## Key File Locations

### Configuration

- Root config: `app.json`
- Mobile config: `apps/mobile/app.json`
- EAS config: `apps/mobile/eas.json`
- ProGuard: `apps/mobile/android/app/proguard-rules.pro`

### Notifications (Real Implementation)

- Permission/Handler: `apps/mobile/src/lib/notifications.ts`
- Scheduling: `apps/mobile/src/services/notificationService.ts`
- Context: `apps/mobile/src/contexts/NotificationContext.tsx`
- Types: `apps/mobile/src/types/notifications.ts`

### Security Critical

- SecureStore: `apps/mobile/src/adapters/secureStorage/native.ts`
- Encryption: `apps/mobile/src/utils/encryption.ts`
- Database: `apps/mobile/src/contexts/DatabaseContext.tsx`

### Navigation

- Root: `apps/mobile/src/navigation/RootNavigator.tsx`
- Main: `apps/mobile/src/navigation/MainNavigator.tsx`

---

## User Decisions

- **Package Name:** `com.recovery.stepstorecovery`
- **Privacy Policy:** Placeholder (user will update later)
- **Build Method:** EAS Build only
- **Fix Scope:** All issues (Critical + High + Medium)
- **Test Devices:** Physical Android + Emulator available

---

## Verification Commands

```bash
cd apps/mobile

# TypeScript check
npx tsc --noEmit

# Encryption tests
npm run test:encryption

# Dev build
npm run android

# EAS preview
eas build --platform android --profile preview
```

---

## Completed Fixes (All 12 Items)

### Phase 1: Critical Config (4/4 DONE)

1. ✅ Package name standardized to `com.recovery.stepstorecovery`
2. ✅ Privacy policy URL placeholder added
3. ✅ Notification channel ID aligned to `default`
4. ✅ Orphaned notification stubs removed

### Phase 2: High Priority Runtime (4/4 DONE)

5. ✅ SecureStore error handling with graceful degradation
6. ✅ DatabaseContext timeout + error handling (10s timeout)
7. ✅ Background location permission request added (`requestBackgroundPermission()`)
8. ✅ BackHandler added to RootNavigator for Android

### Phase 3: Medium Priority Polish (4/4 DONE)

9. ✅ Comprehensive ProGuard rules for all libraries
10. ✅ StatusBar + navigation bar configuration for Android
11. ✅ FlatList optimizations (Android-specific tuning)
12. ✅ Keyboard avoiding behavior with dynamic offset hook

## New Files Created

- `apps/mobile/src/hooks/useKeyboardOffset.ts` - Dynamic keyboard offset for Android
- `.claude/session-context/README.md` - Context folder documentation

## Files Modified

- `app.json` (root) - Package name fix
- `apps/mobile/app.json` - Privacy URL + notification channel
- `apps/mobile/android/app/proguard-rules.pro` - Comprehensive rules
- `apps/mobile/App.tsx` - StatusBar + navigation bar config
- `apps/mobile/src/adapters/secureStorage/native.ts` - Error handling
- `apps/mobile/src/contexts/DatabaseContext.tsx` - Timeout + error handling
- `apps/mobile/src/navigation/RootNavigator.tsx` - BackHandler
- `apps/mobile/src/features/meetings/hooks/useUserLocation.ts` - Background permission
- `apps/mobile/src/features/steps/screens/StepDetailScreen.tsx` - FlatList optimization
- `apps/mobile/src/features/auth/screens/LoginScreen.tsx` - Keyboard config
- `apps/mobile/src/features/auth/screens/SignUpScreen.tsx` - Keyboard config
- `apps/mobile/src/features/auth/screens/ForgotPasswordScreen.tsx` - Keyboard config

## Next Steps

1. Run TypeScript check: `npx tsc --noEmit`
2. Run encryption tests: `npm run test:encryption`
3. Test Android build: `npm run android`
4. Manual testing on device/emulator
