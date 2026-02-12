# Steps to Recovery — App Completion & Enhancement Plan

> Generated from comprehensive research of Expo SDK 54 docs, React Native Directory,
> TypeScript handbook, and full codebase audit on 2026-02-12.

## Current State Assessment

| Category | Completeness | Notes |
|----------|-------------|-------|
| Features Implemented | 90% | 18/18 feature modules exist |
| Screens & Navigation | 95% | 50+ screens, Expo Router configured |
| Hooks & State Mgmt | 95% | Comprehensive React Query + Zustand |
| Design System | 100% | 50+ components, MD3 tokens, animations |
| Database Schema | 100% | 13+ tables with RLS policies |
| Services & Utils | 85% | 20 services, 19 utils |
| Data Population | 60% | **GAP**: Placeholder content in readings, step questions |
| Crypto & Security | 70% | **GAP**: Sponsor encryption stubs, key rotation testing |
| AI Integration | 40% | **GAP**: 33 AI services scaffolded but need provider |
| Testing | 50% | **GAP**: Partial coverage, needs expansion |
| **Overall** | **~82%** | Clear path to production |

## Phase 1: Critical Gaps (Must-Fix for Launch)

### 1.1 Data Population
- **Daily Readings**: Replace placeholder content in `src/data/dailyReadings.ts` with 365 days of original recovery-focused readings
- **12-Step Questions**: Complete question bank in `src/features/steps/data/stepQuestions.ts` for all 12 steps (currently has TODOs)
- **Crisis Slogans/Prayers**: Populate constants marked TODO in crisis/emergency features

### 1.2 Sponsor Encryption Completion
- Implement tweetnacl-js for sponsor-to-sponsee key exchange
- Complete crypto stubs in sponsor sharing service
- Test encrypt/decrypt roundtrip for shared entries

### 1.3 AI Provider Integration
- Connect AI service layer to actual provider (OpenAI/Anthropic/local)
- Implement rate limiting and cost tracking
- Add graceful degradation when offline (pre-cached responses)
- Test crisis detection pipeline end-to-end

### 1.4 Test Coverage Expansion
- Encryption tests: Maintain 90%+ coverage
- Sync service tests: Target 70%+ coverage
- Hook tests: Cover all critical hooks (check-ins, meetings, sponsor)
- E2E: Validate all Maestro flows pass

## Phase 2: Enhancement & Hardening

### 2.1 SQLCipher Integration
- Enable `useSQLCipher: true` in expo-sqlite config plugin
- Database-level encryption as defense-in-depth layer
- Test migration path from unencrypted to encrypted DB

### 2.2 Background Sync Improvements
- Add expo-background-fetch for periodic sync when app is backgrounded
- Implement conflict detection logging (prep for future CRDT)
- Add sync progress UI indicator
- Test sync with 1000+ queue items

### 2.3 Notification Enhancements
- Migrate to new `SchedulableTriggerInputTypes` (SDK 54 pattern)
- Add notification categories for quick actions
- Implement smart notification timing (based on user patterns)
- Test push notifications in development build

### 2.4 Geofencing for Meetings
- Complete geofence registration for saved meeting locations
- Background task for enter/exit events
- iOS background location mode configuration
- Test with simulated locations

### 2.5 Biometric Lock Improvements
- Add expo-local-authentication config plugin for FaceID permission
- Implement app lock timeout settings (1 min, 5 min, 15 min)
- Biometric re-auth for viewing sensitive entries
- Handle biometric enrollment changes

### 2.6 Widget Bridge (iOS)
- Uncomment and implement native iOS widget communication
- Clean time widget for home screen
- Daily check-in status widget
- Next meeting reminder widget

## Phase 3: Polish & Production Readiness

### 3.1 Performance Optimization
- Cold start profiling and optimization (target <2s)
- FlashList migration for any remaining FlatList usage
- Image optimization with expo-image blurhash placeholders
- Bundle size analysis and code splitting
- SQLite query optimization with indexes

### 3.2 OTA Updates Setup
- Configure EAS Update with proper runtime versioning
- Implement update checking UI in settings
- Test update flow end-to-end
- Add code signing for update security

### 3.3 Error Tracking
- Configure Sentry with proper DSN
- Add breadcrumbs for critical user flows
- Performance monitoring for key screens
- Crash-free rate dashboard

### 3.4 Accessibility Audit
- Full VoiceOver walkthrough (iOS)
- Full TalkBack walkthrough (Android)
- 200% font scaling test on all screens
- Color contrast verification with tools
- Focus order verification
- Screen reader announcement testing

### 3.5 App Store Preparation
- Privacy policy and terms of service
- App Store screenshots and metadata
- Play Store listing and metadata
- Version bump and changelog
- EAS Build production profiles
- EAS Submit configuration

## Phase 4: Post-Launch Enhancements

### 4.1 Advanced Features
- CRDT-based conflict resolution for sync
- End-to-end encrypted sponsor messaging
- Community features (anonymous sharing)
- Mood prediction using ML models
- Voice journaling with transcription

### 4.2 Platform Expansion
- Apple Watch companion (clean time widget)
- Android Wear companion
- PWA enhancements for web
- iPad optimized layout

## Reference Docs Created

| File | Purpose |
|------|---------|
| `reference/expo-sdk-54-api-reference.md` | All Expo SDK 54 APIs used |
| `reference/expo-router-patterns.md` | File-based routing patterns |
| `reference/typescript-strict-patterns.md` | TS 5.9 strict mode patterns |
| `reference/security-encryption-patterns.md` | E2E encryption architecture |
| `reference/performance-guide.md` | Performance budgets & optimization |
| `reference/accessibility-wcag-aaa.md` | WCAG AAA compliance guide |
| `reference/offline-sync-architecture.md` | Sync queue architecture |
| `reference/react-query-patterns.md` | React Query v5 patterns |

## Key Research Findings

### Expo SDK 54 Opportunities
1. **SQLCipher**: Database-level encryption available via config plugin (not currently enabled)
2. **FTS5**: Full-text search enabled by default — optimize encrypted search
3. **expo-image**: Should replace all RN Image components for better perf
4. **Notification triggers**: New typed trigger system in SDK 54
5. **Background fetch**: Available for periodic sync

### React Native 0.81 + New Architecture
- New Architecture enabled (`newArchEnabled: true`) ✅
- Hermes JS engine ✅
- React 19.1.0 with React Compiler support
- Turbo Modules for native interop

### Security Improvements Available
1. SQLCipher for defense-in-depth database encryption
2. Code signing for OTA updates
3. Certificate pinning for Supabase connections
4. Biometric-gated key access for sensitive operations
