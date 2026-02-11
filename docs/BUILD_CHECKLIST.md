# Build Checklist

Pre-build verification checklist for Steps to Recovery mobile app.

---

## Pre-Build Verification

### Code Quality

- [ ] `npm test` - All tests passing
- [ ] `npm run type-check` - 0 TypeScript errors
- [ ] `npm run lint` - 0 ESLint warnings
- [ ] `npm run format:check` - Code properly formatted

### Environment

- [ ] `.env` file exists in `apps/mobile/`
- [ ] `EXPO_PUBLIC_SUPABASE_URL` is set
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `EXPO_PUBLIC_SENTRY_DSN` is set (optional)

### Version

- [ ] `version` in `package.json` is correct
- [ ] `version` in `app.json` matches
- [ ] Changelog updated
- [ ] Git commit tagged

---

## Build Commands

### Development Build

```bash
cd apps/mobile
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Preview Build

```bash
cd apps/mobile
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

### Production Build

```bash
cd apps/mobile
eas build --profile production --platform ios
eas build --profile production --platform android
```

---

## Post-Build Verification

### iOS

- [ ] Build artifact downloaded
- [ ] App installs on device
- [ ] Launch screen displays
- [ ] Authentication works
- [ ] Journal entry creates
- [ ] Sync completes

### Android

- [ ] Build artifact downloaded
- [ ] APK/AAB installs on device
- [ ] Launch screen displays
- [ ] Authentication works
- [ ] Journal entry creates
- [ ] Sync completes

---

## Store Submission

### App Store

- [ ] Screenshots prepared (5.5", 6.5", iPad)
- [ ] App description written
- [ ] Keywords selected
- [ ] Privacy policy URL set
- [ ] Support URL set

### Play Store

- [ ] Screenshots prepared (phone, tablet)
- [ ] Feature graphic created
- [ ] App description written
- [ ] Privacy policy URL set
- [ ] Content rating completed
