# Deployment Guide - Steps to Recovery

**Last Updated**: 2026-01-01
**Target Platform**: iOS & Android
**Build System**: EAS (Expo Application Services)

---

## Prerequisites

### Required Accounts
1. **Expo Account**: https://expo.dev
   - Sign up for free
   - Install EAS CLI: `npm install -g eas-cli`
   - Login: `eas login`

2. **Supabase Project**: https://supabase.com
   - Project already created: `cc789e98-8c7f-4bf1-9125-23e0b83b8f00`
   - Database schema deployed ✅

3. **Apple Developer** (iOS only): $99/year
   - https://developer.apple.com
   - Enrolled in Apple Developer Program

4. **Google Play Console** (Android only): $25 one-time
   - https://play.google.com/console

### Local Development Tools
- Node.js 18+ (LTS)
- npm or yarn
- Git
- Expo Go app (for testing)

---

## Environment Setup

### 1. Clone & Install
```bash
cd C:\Users\laine\Steps-to-recovery
cd apps/mobile
npm install
```

### 2. Environment Variables
Create `.env` file in `apps/mobile/`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Security**: Never commit `.env` to git (already in `.gitignore`)

### 3. Verify Configuration
```bash
# Check app.json
cat app.json | grep -A 3 "android\|ios"

# Expected:
# "android": { "package": "com.recovery.stepstorecovery" }
# "ios": { "bundleIdentifier": "com.recovery.stepstorecovery" }
```

---

## Supabase Setup

### 1. Deploy Schema (If Not Already Done)
```sql
-- Run in Supabase SQL Editor
-- File: supabase-schema.sql

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,  -- Encrypted
  content TEXT NOT NULL,  -- Encrypted
  mood TEXT,  -- Encrypted
  tags TEXT[],  -- Encrypted array
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own entries"
  ON journal_entries
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Repeat for step_work, daily_checkins (if added)
```

### 2. Get API Credentials
1. Go to Supabase Dashboard → Project Settings → API
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Update Environment Variables
```bash
# apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=<your-project-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## Build Configuration

### 1. EAS Project Setup
```bash
cd apps/mobile

# Initialize EAS (if not done)
eas init

# Link to existing project (already configured)
# Project ID: cc789e98-8c7f-4bf1-9125-23e0b83b8f00
```

### 2. Configure Build Profiles
File: `eas.json` (already configured)
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

---

## Building for Android

### 1. Development Build (Internal Testing)
```bash
cd apps/mobile
eas build --platform android --profile preview
```
**Output**: APK file downloadable from Expo dashboard
**Install**: Download APK → transfer to device → install

### 2. Production Build (Play Store)
```bash
eas build --platform android --profile production
```

**First-time Setup**:
- EAS will prompt for keystore creation
- Choose "Let EAS handle it" (recommended)
- Keystore stored securely in Expo

**Output**: AAB (Android App Bundle) ready for Play Store

### 3. Submit to Play Store
```bash
eas submit --platform android --latest
```

**Requirements**:
- Google Play Console account ($25)
- App listing complete (screenshots, description, privacy policy)
- Content rating questionnaire
- First submission requires manual upload via console

---

## Building for iOS

### 1. Apple Developer Setup
**Required**:
1. Apple Developer account ($99/year)
2. App ID: `com.recovery.stepstorecovery`
3. Distribution certificate
4. Provisioning profile

**EAS handles this automatically**:
```bash
eas credentials
```

### 2. Production Build (App Store)
```bash
eas build --platform ios --profile production
```

**Output**: IPA file ready for App Store Connect

### 3. Submit to App Store
```bash
eas submit --platform ios --latest
```

**Requirements**:
- App Store Connect listing
- Screenshots (5.5", 6.5", 12.9" screens)
- Privacy policy URL
- Age rating: 12+ (recovery content)
- App Review submission

---

## Testing Builds

### 1. Internal Testing (TestFlight/Internal)
```bash
# iOS - TestFlight
eas build --platform ios --profile preview
eas submit --platform ios --latest

# Android - Internal Testing
eas build --platform android --profile preview
# Upload AAB to Play Console → Internal Testing
```

### 2. Install on Physical Device
```bash
# After build completes
eas build:list

# Download APK/IPA from Expo dashboard
# iOS: Install via TestFlight
# Android: Install APK directly
```

### 3. Verify Critical Flows
- [ ] Sign up → onboarding complete
- [ ] Create journal entry → verify encryption
- [ ] Offline → create entry → go online → verify sync
- [ ] Daily check-in (morning/evening)
- [ ] Emergency support screen loads
- [ ] App doesn't crash on errors (ErrorBoundary)

---

## Post-Deployment

### 1. Monitor Errors
**Sentry Setup** (if configured):
```bash
# Add SENTRY_DSN to environment
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Errors will auto-report to Sentry
```

### 2. User Feedback
- Monitor app store reviews
- Set up support email
- Track crash reports

### 3. Update Deployment
```bash
# Increment version in app.json
{
  "version": "1.0.1"
}

# Build new version
eas build --platform all --profile production

# Submit updates
eas submit --platform all --latest
```

---

## Troubleshooting

### Build Fails: "Missing credentials"
```bash
# Re-configure credentials
eas credentials

# Clear and rebuild
eas build:configure
eas build --platform android --profile production --clear-cache
```

### Build Succeeds, App Crashes on Launch
1. Check environment variables in build
2. Verify Supabase credentials
3. Check error logs in Sentry/Expo dashboard
4. Test in development build first

### Sync Not Working in Production
1. Verify Supabase URL/key in build
2. Check RLS policies in Supabase
3. Test with `console.log` in dev build
4. Check network connectivity

### App Rejected by App Store
**Common Issues**:
- Missing privacy policy URL
- No age rating
- Screenshots incorrect size
- Permissions not explained (location, notifications)

**Fix**: Update app.json metadata, rebuild, resubmit

---

## Build Commands Cheatsheet

```bash
# Development
npm start                          # Expo Go development
eas build --profile development    # Custom dev client

# Preview (Internal Testing)
eas build --platform android --profile preview
eas build --platform ios --profile preview

# Production (App Stores)
eas build --platform all --profile production
eas submit --platform all --latest

# Utilities
eas build:list                     # View build history
eas build:cancel                   # Cancel running build
eas credentials                    # Manage certificates
eas update                         # OTA update (if enabled)
```

---

## Security Checklist

Before production deployment:

- [ ] Environment variables not committed to git
- [ ] Supabase RLS policies enabled and tested
- [ ] Encryption keys stored in SecureStore only
- [ ] Error logs don't expose sensitive data
- [ ] Sentry DSN configured (optional but recommended)
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Age gate implemented (13+)

---

## Cost Estimate

### One-Time
- Apple Developer: $99/year
- Google Play Console: $25 (lifetime)

### Monthly (Estimated)
- Supabase Free Tier: $0 (up to 500 MB database)
- Supabase Pro: $25/month (unlimited database)
- Sentry Free: $0 (up to 5K events/month)
- EAS Builds: Free tier available (limited builds/month)

**Total**: $124-$149 first year, $24-$124/year after

---

## Support

**Build Issues**: Expo Discord (https://chat.expo.dev)
**Supabase Issues**: Supabase Discord (https://discord.supabase.com)
**App Store Issues**: Apple Developer Forums

**Project Documentation**: `_bmad-output/PROJECT_STATUS.md`
