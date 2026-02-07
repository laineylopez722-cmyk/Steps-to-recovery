# Build & Run Guide - Final Testing

**Date**: 2026-02-06  
**Status**: Ready to build & test  
**Time**: 10-15 minutes

---

## 🚀 Quick Start (Development Build)

### **Option 1: Expo Dev Client** (Fastest)

```bash
cd C:\Users\h\Documents\github\steps-to-recovery\apps\mobile

# Start Expo
npx expo start

# Then press:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - Scan QR with Expo Go app on physical device
```

**Pros**: Fast, hot reload  
**Cons**: Some native features may not work

---

### **Option 2: Development Build** (Recommended)

```bash
cd C:\Users\h\Documents\github\steps-to-recovery\apps\mobile

# iOS (requires Mac + Xcode)
npx expo run:ios

# Android (requires Android Studio)
npx expo run:android

# Or for physical device:
npx expo run:ios --device
npx expo run:android --device
```

**Pros**: Full native features  
**Cons**: Slower build time (~5-10 min first time)

---

## 📱 Testing on Physical Device

### **iOS (TestFlight - Best for Beta)**:

1. **Build**:

   ```bash
   eas build --platform ios --profile preview
   ```

2. **Upload to TestFlight**:
   - Follow Expo EAS prompts
   - Apple will review (~24h)

3. **Invite Testers**:
   - App Store Connect → TestFlight
   - Add internal testers (instant)
   - Add external testers (after review)

### **Android (Internal Testing)**:

1. **Build**:

   ```bash
   eas build --platform android --profile preview
   ```

2. **Download APK** from Expo dashboard

3. **Install**:
   - Transfer APK to device
   - Enable "Install from Unknown Sources"
   - Tap APK to install

---

## 🐛 Troubleshooting

### **Common Build Errors**:

#### **Error: "Cannot find module '@recovery/shared'"**

**Fix**:

```bash
cd C:\Users\h\Documents\github\steps-to-recovery
npm install
cd apps/mobile
npm install
```

#### **Error: "Worklet compilation error"**

**Fix**:

```bash
# Clear Metro cache
npx expo start -c
```

#### **Error: "Unable to resolve module"**

**Fix**:

```bash
# Clear all caches
rm -rf node_modules
rm -rf apps/mobile/node_modules
npm install
cd apps/mobile
npm install
npx expo start --clear
```

#### **TypeScript Errors**:

**Fix**:

```bash
cd apps/mobile
npx tsc --noEmit
# Review errors, fix imports/types
```

---

## ✅ Pre-Flight Checklist

Before building:

- [ ] All migrations run in Supabase
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Dependencies installed (`npm install`)
- [ ] Expo CLI up to date (`npx expo --version`)
- [ ] Device connected / emulator running

---

## 🎯 Testing Path

**After app launches**:

1. **Home Screen** (2 min):
   - Circular rings animate ✅
   - Check-in button shows ✅
   - Daily reading card shows ✅

2. **Meeting Check-In** (3 min):
   - Tap "Check In to Meeting"
   - Enter meeting name
   - Pre-modal shows → Fill → Save
   - Post-modal test button → Fill → Save

3. **Crisis Checkpoint** (5 min):
   - Tap Emergency button
   - Tap "Before You Use"
   - Go through all 4 stages
   - Complete with "I Resisted"

4. **Database Verification** (2 min):
   - Open Supabase → Table Editor
   - Check `meeting_checkins` → Row exists ✅
   - Check `meeting_reflections` → Row exists ✅
   - Check `crisis_checkpoints` → Row exists ✅

**Total**: ~12 minutes

---

## 📊 Success Metrics

### **App Launches**: ✅ ❌

### **No Crashes**: ✅ ❌

### **All Features Work**: ✅ ❌

### **Database Saves**: ✅ ❌

### **Animations Smooth**: ✅ ❌

---

## 🎉 If Everything Works

**Congratulations!** 🚀

You've successfully built:

- **Circular Progress Rings** (premium UX)
- **Meeting Reflections** (value maximization)
- **Crisis Checkpoint** (life-saving intervention)

**Next Steps**:

1. Beta testing with real users
2. Gather feedback
3. Iterate & polish
4. PUBLIC LAUNCH! 🎊

---

## 📝 Quick Commands Reference

```bash
# Start dev server
npx expo start

# Clear cache
npx expo start --clear

# iOS simulator
npx expo run:ios

# Android emulator
npx expo run:android

# Check TypeScript
npx tsc --noEmit

# Install deps
npm install

# Update Expo
npx expo install expo@latest

# EAS Build
eas build --platform ios
eas build --platform android
```

---

**Ready to test!** Run `npx expo start` and let's see it in action! 💪
