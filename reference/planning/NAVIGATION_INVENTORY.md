# Navigation Inventory — Expo-Router Migration Reference

> **Usage note (2026-03-12):** Reference document for a deferred migration path. Not a current top priority; live project priorities now live in `C:\Users\H\.openclaw\workspace\to be done\02-active-priorities.md`.


> Complete inventory of all navigation patterns for Wave 2 migration planning.
> Generated: 2026-02-17 | Status: Wave 2 Ready (for migration planning)

---

## Navigator Hierarchy

```
RootNavigator (Stack)
├── AuthNavigator (Stack) — 2 screens
│   ├── Login
│   └── Signup
│
└── MainNavigator (Tab) — 37 screens
    ├── HomeStack (Stack) — 16 screens
    │   ├── HomeMain (Home tab root)
    │   ├── MorningIntention
    │   ├── EveningPulse
    │   ├── Emergency (modal)
    │   ├── DailyReading
    │   ├── ProgressDashboard
    │   ├── MeetingStats
    │   ├── Achievements
    │   ├── CravingSurf
    │   ├── BeforeYouUse (modal)
    │   ├── CrisisResources
    │   ├── SafeDialIntervention
    │   ├── DangerZone
    │   ├── Chat (AI Companion)
    │   └── Gratitude
    │
    ├── JournalStack (Stack) — 2 screens
    │   ├── JournalList
    │   └── JournalEditor
    │
    ├── StepsStack (Stack) — 3 screens
    │   ├── StepsOverview
    │   ├── StepDetail
    │   └── StepReview
    │
    ├── MeetingsStack (Stack) — 5 screens
    │   ├── MeetingFinder
    │   ├── MeetingDetail
    │   ├── FavoriteMeetings
    │   ├── MeetingStats (duplicate? verify)
    │   └── Achievements (duplicate? verify)
    │
    └── ProfileStack (Stack) — 11 screens
        ├── ProfileHome
        ├── NotificationSettings
        ├── SecuritySettings
        ├── WidgetSettings
        ├── PrivacyPolicy
        ├── TermsOfService
        ├── Sponsor
        ├── InviteSponsor
        ├── SharedEntries
        ├── ShareEntries
        └── AISettings

Total: 5 stacks, 39 screens
```

---

## Screen-by-Screen Detail

### HomeStack (16 screens)

| Route Name | Component | Navigator | Options | Params | Migration Priority |
|------------|-----------|-----------|---------|--------|-------------------|
| `HomeMain` | `HomeScreen` | HomeStack | `headerShown: false` | - | HIGH |
| `MorningIntention` | `MorningIntentionScreen` | HomeStack | `headerShown: false` | `userId` | HIGH |
| `EveningPulse` | `EveningPulseScreen` | HomeStack | `headerShown: false` | `userId` | HIGH |
| `Emergency` | `EmergencyScreen` | HomeStack | `modal`, `presentation: 'modal'` | `userId` | HIGH (safety) |
| `DailyReading` | `DailyReadingScreen` | HomeStack | `title: "Today's Reading"` | - | MEDIUM |
| `ProgressDashboard` | `ProgressDashboardScreen` | HomeStack | default | - | MEDIUM |
| `MeetingStats` | `MeetingStatsScreen` | HomeStack | default | - | LOW |
| `Achievements` | `AchievementsScreen` | HomeStack | default | - | LOW |
| `CravingSurf` | `CravingSurfScreen` | HomeStack | default | - | MEDIUM |
| `BeforeYouUse` | `BeforeYouUseScreen` | HomeStack | `modal`, `presentation: 'modal'` | - | HIGH (safety) |
| `CrisisResources` | `CrisisResourcesScreen` | HomeStack | default | - | HIGH (safety) |
| `SafeDialIntervention` | `SafeDialInterventionScreen` | HomeStack | default | `contactName`, `phoneNumber` | HIGH |
| `DangerZone` | `DangerZoneScreen` | HomeStack | default | - | MEDIUM |
| `Chat` | `ChatScreen` | HomeStack | default | - | HIGH |
| `Gratitude` | `GratitudeScreen` | HomeStack | default | - | LOW |

### JournalStack (2 screens)

| Route Name | Component | Navigator | Options | Params | Migration Priority |
|------------|-----------|-----------|---------|--------|-------------------|
| `JournalList` | `JournalListScreen` | JournalStack | default | - | HIGH |
| `JournalEditor` | `JournalEditorScreen` | JournalStack | dynamic title | `entryId?` | HIGH |

**Recommended: Migrate JournalStack FIRST (smallest, lowest risk)**

### StepsStack (3 screens)

| Route Name | Component | Navigator | Options | Params | Migration Priority |
|------------|-----------|-----------|---------|--------|-------------------|
| `StepsOverview` | `StepsOverviewScreen` | StepsStack | default | - | HIGH |
| `StepDetail` | `StepDetailScreen` | StepsStack | default | `stepNumber` | HIGH |
| `StepReview` | `StepReviewScreen` | StepsStack | default | `stepNumber` | HIGH |

### MeetingsStack (5 screens)

| Route Name | Component | Navigator | Options | Params | Migration Priority |
|------------|-----------|-----------|---------|--------|-------------------|
| `MeetingFinder` | `MeetingFinderScreen` | MeetingsStack | default | - | MEDIUM |
| `MeetingDetail` | `MeetingDetailScreen` | MeetingsStack | default | `meetingId` | MEDIUM |
| `FavoriteMeetings` | `FavoriteMeetingsScreen` | MeetingsStack | default | - | LOW |
| `MeetingStats` | `MeetingStatsScreen` | MeetingsStack | default | - | LOW |
| `Achievements` | `AchievementsScreen` | MeetingsStack | default | - | LOW |

### ProfileStack (11 screens)

| Route Name | Component | Navigator | Options | Params | Migration Priority |
|------------|-----------|-----------|---------|--------|-------------------|
| `ProfileHome` | `ProfileScreen` | ProfileStack | default | - | MEDIUM |
| `NotificationSettings` | `NotificationSettingsScreen` | ProfileStack | default | - | LOW |
| `SecuritySettings` | `SecuritySettingsScreen` | ProfileStack | default | - | LOW |
| `WidgetSettings` | `WidgetSettingsScreen` | ProfileStack | default | - | LOW |
| `PrivacyPolicy` | `PrivacyPolicyScreen` | ProfileStack | default | - | LOW |
| `TermsOfService` | `TermsOfServiceScreen` | ProfileStack | default | - | LOW |
| `Sponsor` | `SponsorScreen` | ProfileStack | default | - | MEDIUM |
| `InviteSponsor` | `InviteSponsorScreen` | ProfileStack | default | - | MEDIUM |
| `SharedEntries` | `SharedEntriesScreen` | ProfileStack | default | - | LOW |
| `ShareEntries` | `ShareEntriesScreen` | ProfileStack | default | - | LOW |
| `AISettings` | `AISettingsScreen` | ProfileStack | default | - | LOW |

---

## Navigation Call Patterns

### Pattern 1: Direct Navigation (Most Common)

```typescript
// React Navigation
navigation.navigate('ScreenName')
navigation.navigate('ScreenName', { param: value })

// Expo-Router equivalent
router.push('/screen-name')
router.push('/screen-name?param=value')
```

**Affected files:**
- `navigationUtils.ts` — 18 calls
- `navigationHelper.ts` — 12 calls
- `CustomTabBar.tsx` — 2 calls
- Various screen components (grep for pattern)

### Pattern 2: Tab Navigation with Params

```typescript
// React Navigation
navigation.navigate('MainApp', { screen: 'TabName', params: {...} })

// Expo-Router equivalent
router.push('/tab-name')
```

### Pattern 3: goBack()

```typescript
// React Navigation
navigation.goBack()

// Expo-Router equivalent
router.back()
```

### Pattern 4: Nested Stack Navigation

```typescript
// React Navigation
navigation.navigate('HomeStack', { screen: 'Emergency' })

// Expo-Router equivalent
router.push('/emergency')
```

---

## Helper Functions (navigationUtils.ts)

| Function | Current Usage | Expo-Router Mapping |
|----------|---------------|-------------------|
| `goHome()` | Navigate to HomeMain | `router.push('/')` |
| `goToJournal()` | Navigate to JournalList | `router.push('/journal')` |
| `goToJournalEditor(mode, entryId?)` | Navigate to JournalEditor | `router.push('/journal/${entryId || 'new'}')` |
| `goToMeetings()` | Navigate to MeetingFinder | `router.push('/meetings')` |
| `goToSteps()` | Navigate to StepsOverview | `router.push('/steps')` |
| `goToProfile()` | Navigate to ProfileHome | `router.push('/profile')` |
| `goToMorningIntention()` | Navigate to MorningIntention | `router.push('/morning-intention')` |
| `goToEveningPulse()` | Navigate to EveningPulse | `router.push('/evening-pulse')` |
| `goToEmergency()` | Navigate to Emergency (modal) | `router.push('/emergency')` |
| `goToDailyReading()` | Navigate to DailyReading | `router.push('/daily-reading')` |
| `goToProgressDashboard()` | Navigate to ProgressDashboard | `router.push('/progress-dashboard')` |

---

## Modal Handling

### Current Modals (presentation: 'modal')

| Screen | Trigger | Expo-Router Pattern |
|--------|---------|-------------------|
| `Emergency` | Button tap from Home | `router.push('/(auth)/emergency')` with `modal` prop |
| `BeforeYouUse` | First app launch | `router.push('/(auth)/before-you-use')` with `modal` prop |

**Expo-router modal approach:**
```typescript
// app/(auth)/emergency.tsx
import { Modal } from 'expo-router'

export default function EmergencyScreen() {
  return (
    <Modal>
      <EmergencyContent />
    </Modal>
  )
}
```

Or use route groups:
```typescript
// app/(auth)/(modal)/emergency.tsx
// app/(auth)/home.tsx
```

---

## Type Mapping

### Current Type → Expo-Router URL Pattern

| Screen | Current Param Type | URL Pattern |
|--------|-------------------|-------------|
| `JournalEditor` | `{ entryId?: string }` | `/journal/[entryId]` or `/journal/new` |
| `MeetingDetail` | `{ meetingId: string }` | `/meetings/[meetingId]` |
| `StepDetail` | `{ stepNumber: number }` | `/steps/[stepNumber]` |
| `StepReview` | `{ stepNumber: number }` | `/steps/[stepNumber]/review` |
| `SafeDialIntervention` | `{ contactName, phoneNumber }` | `/safe-dial?contact=...&phone=...` |

---

## Recommended Migration Order

1. **JournalStack** (2 screens) — Lowest risk, validates migration pattern
2. **StepsStack** (3 screens) — Core recovery UX, high-value
3. **HomeStack modal screens** (Emergency, BeforeYouUse) — Safety-critical, test first
4. **HomeStack primary screens** (Home, Morning, Evening) — Daily use
5. **MeetingsStack** (5 screens) — Medium complexity
6. **ProfileStack** (11 screens) — Settings, lower risk
7. **Full cutover** — Remove React Navigation

---

## Files Modified During Migration

### Phase 1: Create Routes

```
app/
├── _layout.tsx                    # Root layout (EXISTING)
├── (auth)/
│   ├── _layout.tsx               # Tab layout (EXISTING)
│   ├── +layout.tsx              # May need per-group layout
│   ├── index.tsx                # HomeMain
│   ├── journal/
│   │   ├── index.tsx            # JournalList
│   │   └── [entryId].tsx        # JournalEditor
│   ├── steps/
│   │   ├── index.tsx            # StepsOverview
│   │   └── [step].tsx           # StepDetail
│   └── ...
```

### Phase 2: Update Navigation Calls

**Files requiring updates:**
- `src/navigation/navigationUtils.ts` — 18 calls
- `src/utils/navigationHelper.ts` — 12 calls
- `src/navigation/CustomTabBar.tsx` — 2 calls
- `src/features/*/components/*.tsx` — scattered

### Phase 3: Remove Legacy (Phase 3 only)

- `src/navigation/MainNavigator.tsx`
- `src/navigation/RootNavigator.tsx`
- `src/navigation/AuthNavigator.tsx`
- `src/navigation/navigationRef.ts`
- `src/navigation/navigationUtils.ts`
- `src/utils/navigationHelper.ts`

---

## Testing Checklist

- [ ] Tab navigation works
- [ ] Stack navigation (push/pop) works
- [ ] Modal presentations (Emergency, BeforeYouUse) work
- [ ] Deep linking works
- [ ] Back button (Android) works
- [ ] Gesture navigation (iOS) works
- [ ] Params pass correctly
- [ ] All 39 screens render
- [ ] No regressions in crisis flows

---

## Rollback Markers

Keep until Phase 3 complete:
- `src/navigation/MainNavigator.tsx` (backup)
- `src/navigation/RootNavigator.tsx` (backup)
- Feature flag in `.env`:
  ```
  EXPO_PUBLIC_USE_EXPO_ROUTER=false
  ```
