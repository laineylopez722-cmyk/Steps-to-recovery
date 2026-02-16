# WAVE2_PLAN.md — Expo-Router Migration Plan

> Planning document for migrating from React Navigation to expo-router.
> Status: **PLANNED** | Priority: Post-device-validation
> Created: 2026-02-16

## Context

**Current state:** React Navigation 7 with tab + native-stack navigators (~39 screens, 74 nav calls)

**Goal state:** File-based routing with expo-router for improved navigation performance and simpler navigation code

## Current Navigation Structure

```
MainNavigator (TabNavigator)
├── HomeStack (16 screens)
├── JournalStack (2 screens)
├── StepsStack (3 screens)
├── MeetingsStack (3 screens)
└── ProfileStack (11 screens)
```

**Total:** 5 stacks, 39 screens, 74 navigation calls across the codebase.

## Migration Strategy: Incremental

Given the app size and risk tolerance, **incremental migration** is recommended over big-bang:

### Phase 1: Parallel Routes (Low Risk)
1. Create `/app` directory structure alongside existing navigators
2. Add expo-router with a single test route
3. Verify expo-router works in isolation
4. No changes to existing navigation

### Phase 2: Route-by-Route Migration (Medium Risk)
1. Migrate one stack at a time (start with smallest: JournalStack - 2 screens)
2. Update navigation calls for migrated screens only
3. Keep unmigrated screens on React Navigation
4. Test thoroughly before moving to next stack

### Phase 3: Full Cutover (High Risk)
1. Remove React Navigation dependencies
2. Update all remaining navigation calls
3. Remove legacy navigator files

## Directory Structure Target

```
src/
├── app/                          # expo-router file-based routing
│   ├── _layout.tsx               # Root layout with providers
│   ├── (auth)/                   # Authenticated routes (group)
│   │   ├── _layout.tsx          # Tab bar layout
│   │   ├── index.tsx            # Home screen
│   │   ├── journal/
│   │   │   ├── _layout.tsx      # Journal stack layout
│   │   │   ├── index.tsx        # JournalList
│   │   │   └── [entryId].tsx     # JournalEditor
│   │   ├── steps/
│   │   ├── meetings/
│   │   └── profile/
│   ├── (modal)/                  # Modal routes
│   │   ├── emergency.tsx
│   │   └── crisis/
│   └── (public)/                # Unauthenticated routes
│       ├── login.tsx
│       └── signup.tsx
├── navigation/                   # Keep until full migration
│   └── MainNavigator.tsx        # Will be removed in Phase 3
└── ...
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Navigation regressions | High | Incremental migration; test each stack |
| Deep linking breakage | High | Maintain parallel config; test thoroughly |
| Animation/gesture differences | Medium | Test thoroughly; expo-router supports native stack |
| Context provider changes | Medium | Move providers to root layout early |
| Performance regression | Low | expo-router generally faster |

## Rollback Plan

1. Keep MainNavigator.tsx until Phase 3 complete
2. Feature flag to toggle between navigation systems
3. Git branch for migration (merge after full testing)
4. Local APK testing before Mar 01 EAS reset

## Estimated Effort

| Phase | Effort | Duration |
|-------|--------|----------|
| Phase 1: Setup | 2-4 hours | 1 day |
| Phase 2: Per stack | 4-8 hours/stack | 1-2 weeks |
| Phase 3: Cutover | 4-8 hours | 1-2 days |

**Total estimated:** 3-4 weeks of focused work

## Pre-Migration Checklist

- [ ] Research expo-router best practices for React Native
- [ ] Verify expo-router compatibility with current expo version (SDK 54)
- [ ] Test deep linking configuration
- [ ] Review all navigation calls (74 total)
- [ ] Audit screen options (headers, gestures, presentations)
- [ ] Plan modal handling (Emergency, BeforeYouUse, etc.)

## Post-Migration Benefits

1. **Simpler code:** File-based routing eliminates navigator boilerplate
2. **Better performance:** Native navigation primitives
3. **Easier maintenance:** No nested navigator definitions
4. **Improved DX:** Dynamic routes are first-class
5. **Better SSR support:** If web support is added later

## Dependencies to Add

```bash
npx expo install expo-router
npx expo install expo-linking
npx expo install expo-system-ui
npx expo install expo-document-provider
```

## Navigation Calls to Update (74 total)

Will need to search/replace:
- `navigation.navigate('ScreenName')` → `router.push('/screen-name')`
- `navigation.goBack()` → `router.back()`
- `navigation.navigate('Screen', { params })` → `router.push('/screen?param=value')`

## Decision: Wait for Device Validation

**This migration should NOT begin until:**
1. Device validation complete (H can use app in rehab)
2. All stability issues resolved
3. EAS free tier resets (Mar 01) for cloud build testing

**Current priority remains:** Device validation and stability hardening.
