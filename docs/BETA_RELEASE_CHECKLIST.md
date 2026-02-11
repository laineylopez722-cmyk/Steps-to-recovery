# Beta Release Checklist

**App:** Steps to Recovery  
**Version:** 1.0.0-beta  
**Target Date:** February 2026  
**Platform:** iOS & Android

---

## Pre-Release (1 Week Before)

### Code Quality

- [ ] All unit tests passing (`npm test`)
- [ ] E2E tests passing (`npm run e2e` or Maestro Cloud)
- [ ] Test coverage >75% (`npm run test:coverage`)
- [ ] TypeScript 0 errors (`npx tsc --noEmit`)
- [ ] ESLint 0 warnings (`npm run lint`)
- [ ] Encryption tests passing (`npm run test:encryption`)

### Documentation

- [ ] Privacy Policy finalized and reviewed
- [ ] Terms of Service finalized and reviewed
- [ ] App Store listing copy prepared
- [ ] Screenshots for App Store/Play Store
- [ ] Build instructions verified

### Security

- [ ] Security audit complete
- [ ] RLS policies verified on all tables
- [ ] Encryption key rotation tested
- [ ] Data export functionality tested
- [ ] Account deletion flow tested

---

## Build Preparation (3 Days Before)

### Environment Setup

- [ ] EAS secrets configured in Expo dashboard
  - [ ] `EXPO_PUBLIC_SUPABASE_URL`
  - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `EXPO_PUBLIC_SENTRY_DSN` (optional)
- [ ] App Store Connect credentials ready
- [ ] Google Play Console service account configured

### Version Management

- [ ] Version number bumped in `app.json`
- [ ] Changelog updated
- [ ] Git tag created (`v1.0.0-beta`)

---

## Build Day

### Production Build

```bash
cd apps/mobile

# iOS Production Build
eas build --profile production --platform ios

# Android Production Build
eas build --profile production --platform android

# Or both platforms
eas build --profile production --platform all
```

- [ ] iOS build succeeds
- [ ] Android build succeeds
- [ ] Build artifacts downloaded and archived

### Store Validation

- [ ] iOS build passes App Store validation
  - [ ] No signing errors
  - [ ] No provisioning profile issues
  - [ ] No entitlement warnings
- [ ] Android build passes Play Store validation
  - [ ] AAB format correct
  - [ ] Signing certificate valid
  - [ ] No manifest errors

---

## Distribution

### TestFlight (iOS)

- [ ] Upload build to App Store Connect
- [ ] Add beta testers to TestFlight group
- [ ] Submit for TestFlight review (if required)
- [ ] Send invitations to internal testers

### Play Console (Android)

- [ ] Upload AAB to Play Console
- [ ] Create internal testing track
- [ ] Add beta testers to internal track
- [ ] Send invitations to testers

### Beta Tester Onboarding

- [ ] Welcome email prepared
- [ ] Feedback form created (Google Forms/Typeform)
- [ ] Known issues list prepared
- [ ] Support channel established (Discord/Slack)

---

## Post-Release (Week 1)

### Monitoring

- [ ] Crash reports monitored (Sentry)
- [ ] Analytics reviewed daily
- [ ] Sync errors tracked
- [ ] Performance metrics checked

### Feedback Collection

- [ ] Daily check-in with beta testers
- [ ] Bug reports triaged and prioritized
- [ ] Feature requests documented
- [ ] Testimonials collected

### Critical Bug Fixes

- [ ] P0 bugs fixed within 24 hours
- [ ] P1 bugs fixed within 72 hours
- [ ] Hotfix builds prepared if needed

---

## Sign-Off

| Role            | Name | Signature | Date |
| --------------- | ---- | --------- | ---- |
| Tech Lead       |      |           |      |
| Product Owner   |      |           |      |
| Security Review |      |           |      |
| Legal Review    |      |           |      |

---

## Emergency Contacts

- **Technical Lead:** [Contact]
- **DevOps:** [Contact]
- **Security:** [Contact]
- **Legal:** [Contact]

---

## Post-Beta Next Steps

1. Collect 2 weeks of beta feedback
2. Prioritize fixes for RC (Release Candidate)
3. Fix critical bugs
4. Prepare marketing materials
5. Plan public launch

---

_This checklist should be completed in order. Do not proceed to the next section until all items in the current section are checked off._
