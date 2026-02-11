# Feature Map Reference

_Complete map of all features, screens, hooks, components, and services in Steps-to-Recovery._

---

## Feature Directory (`apps/mobile/src/features/`)

### 1. AI Companion (`ai-companion/`)
AI-powered recovery assistant with conversational interface.

**Screens**: AISettingsScreen
**Components**: ChatScreen, ChatInput, ChatBubble, ChatSkeleton, ConversationList, QuickActions, InventoryBuilder, DailyReview, CrisisOverlay, AmendsTracker
**Hooks**: useAIChat, useChatHistory, useStepWork
**Services**: aiService, contextBuilder, memoryExtractor
**Prompts**: base, crisis, stepWork

---

### 2. Auth (`auth/`)
Authentication and user management.

**Screens**: LoginScreen, SignUpScreen, OnboardingScreen, ForgotPasswordScreen
**Components**: BiometricPrompt

---

### 3. Crisis (`crisis/`)
Crisis intervention resources.

**Screens**: BeforeYouUseScreen

---

### 4. Emergency (`emergency/`)
Emergency contacts and Safe Dial protection.

**Screens**: EmergencyScreen, DangerZoneScreen, SafeDialInterventionScreen
**Components**: RiskyContactCard, CloseCallInsights, AddRiskyContactModal
**Hooks**: useSafeDialProtection

---

### 5. Home (`home/`)
Main dashboard with clean time tracker and daily check-ins.

**Screens**: HomeScreen, MorningIntentionScreen, EveningPulseScreen
**Components**: CleanTimeTracker, DailyCheckInCard, QuickActions, SyncStatusIndicator, RiskAlertCard
**Hooks**: useCleanTime, useCheckIns

---

### 6. Journal (`journal/`)
Encrypted journaling with mood/craving tracking.

**Screens**: JournalListScreen, JournalEditorScreen
**Components**: JournalCard, ShareEntryModal
**Hooks**: useJournalEntries
**Utils**: memoryExtraction

---

### 7. Meetings (`meetings/`)
12-step meeting finder and attendance tracking.

**Screens**: MeetingFinderScreen, MeetingDetailScreen, FavoriteMeetingsScreen, MeetingStatsScreen, AchievementsScreen
**Components**: MeetingCard, MeetingFilters, CheckInModal, PreMeetingReflectionModal, PostMeetingReflectionModal, AchievementUnlockModal
**Hooks**: useNearbyMeetings, useMeetingSearch, useMeetingCheckIns, useFavoriteMeetings, useUserLocation, useAchievements, use90In90Progress
**Services**: meetingGuideApi, meetingCacheService
**Types**: meeting.ts

---

### 8. Onboarding (`onboarding/`)
Initial app setup flow.

**Components**: OnboardingFlow

---

### 9. Profile (`profile/`)
User profile management.

**Screens**: ProfileScreen

---

### 10. Progress (`progress/`)
Recovery analytics and dashboards.

**Screens**: ProgressDashboardScreen
**Hooks**: useRecoveryAnalytics

---

### 11. Readings (`readings/`)
Daily spiritual/recovery readings.

**Screens**: DailyReadingScreen

---

### 12. Settings (`settings/`)
App settings and preferences.

**Screens**: NotificationSettingsScreen, NotificationPreferencesScreen, DataExportScreen

---

### 13. Sponsor (`sponsor/`)
Sponsor connection and entry sharing.

**Screens**: SponsorScreen, ConnectSponsorScreen, InviteSponsorScreen, ShareEntriesScreen, SharedEntriesScreen
**Components**: SponsorshipsList, SharedEntryCard
**Hooks**: useSponsorships, useSponsorConnections, useSponsorSharedEntries

---

### 14. Steps (`steps/`)
12-step work tracking with guided questions.

**Screens**: StepsOverviewScreen, StepDetailScreen, StepReviewScreen
**Components**: StepDetailScreenContent, StepDetailMainContent, StepDetailHeaderCard, StepDetailQuestionsList, StepQuestionCard, StepQuestionCounter, StepSectionHeader, StepGuidanceCard, StepPrivacyInfoCard, StepLockedState, StepDetailLoadingState, StepDetailErrorState
**Hooks** (32 total): useStepWork, useStepAnswersState, useStepAnswerSave, useStepScreenAnimation, useStepQuestionNavigation, useStepGuidanceToggle, useStepDetailScreenSetup, useStepDetailOrchestration, useStepDetailData, useStepDetailNavigation, useStepDetailNavigationActions, useStepDetailRouteParams, useStepDetailMeta, useStepDetailRenderModel, useStepDetailDisplayState, useStepDetailDerivedState, useStepDetailContentState, useStepDetailContentPayload, useStepDetailContentContext, useStepDetailFlowContext, useStepDetailInteractions, useStepDetailQuestionFlow, useStepDetailToastState, useStepDetailScreenContentProps, useStepDetailMainContentModel, useStepDetailMainContentProps, useStepDetailMainInteractionsModel, useCurrentUserId, useScreenBackgroundColor
**Utils**: stepAnswers, stepListConfig, stepListItems, stepViewability

---

## Shared Components (`apps/mobile/src/components/`)

| Component | Purpose |
|-----------|---------|
| ErrorBoundary | Global error boundary |
| LoadingSpinner | Loading indicator |
| MilestoneCelebrationModal | Achievement celebration |
| CircularProgressRing | Progress visualization |
| QuickMeetingCheckIn | Quick check-in widget |
| Slider | Custom slider component |

### UI Components (`components/ui/`)
Shared design system primitives (Button, Card, Input, Text, etc.)

---

## Shared Hooks (`apps/mobile/src/hooks/`) — 35 hooks

| Hook | Purpose |
|------|---------|
| useAuth | Auth context shortcut |
| useAppState | App foreground/background |
| useAppLifecycle | App lifecycle events |
| useAchievements | Achievement tracking |
| useAudioRecorder | Voice recording |
| useAutoSave | Debounced auto-save |
| useBreathingExercise | Guided breathing |
| useCheckin | Check-in operations |
| useContacts | Contact access |
| useCravingTracker | Craving intensity tracking |
| useDebouncedValue | Debounced state |
| useEmergencyAccess | Emergency screen access |
| useFormValidation | Form validation (Zod) |
| useHaptics | Haptic feedback |
| useJitai | Just-in-time interventions |
| useJournal | Journal operations |
| useKeyboard | Keyboard state |
| useKeyboardOffset | Keyboard offset animation |
| useMeetingReminder | Meeting notifications |
| useMeetings | Meeting data |
| useMemoryStore | AI memory system |
| useNotifications | Push notifications |
| useOfflineMutation | Offline-aware mutations |
| usePerformanceMonitor | Performance tracking |
| usePhoneCalls | Phone call tracking |
| usePinEntry | PIN authentication |
| useReading | Daily readings |
| useReadingDatabase | Reading DB operations |
| useRegularMeetings | Regular meeting schedule |
| useRiskDetection | Risk pattern detection |
| useSecureValue | SecureStore access |
| useSobriety | Sobriety tracking |
| useSponsorInfo | Sponsor information |

---

## Services (`apps/mobile/src/services/`) — 9 services

| Service | Purpose |
|---------|---------|
| syncService | Sync queue processing, retry, batching |
| backgroundSync | Background fetch integration |
| notificationService | Push notification management |
| sponsorShareService | Entry sharing with sponsors |
| safeDialService | Safe Dial call interception |
| riskDetectionService | Risk pattern analysis |
| meetingCheckInService | Meeting attendance tracking |
| meetingReflectionService | Pre/post meeting reflections |
| crisisCheckpointService | Crisis intervention tracking |

---

## Navigation (`apps/mobile/src/navigation/`)

| File | Purpose |
|------|---------|
| RootNavigator | Entry point — routes to Auth or Main |
| AuthNavigator | Auth flow (Login → SignUp → ForgotPassword) |
| MainNavigator | Bottom tabs (Home, Journal, Steps, Meetings, More) |
| types.ts | Navigation type definitions |
| navigationRef.ts | Global navigation reference |
| navigationUtils.ts | Navigation helper functions |
| linking.ts | Deep linking configuration |

### Navigation Structure
```
RootNavigator
├── AuthNavigator (unauthenticated)
│   ├── Login
│   ├── SignUp
│   ├── ForgotPassword
│   └── Onboarding
└── MainNavigator (authenticated)
    ├── Home Tab
    │   ├── HomeScreen
    │   ├── MorningIntentionScreen
    │   └── EveningPulseScreen
    ├── Journal Tab
    │   ├── JournalListScreen
    │   └── JournalEditorScreen
    ├── Steps Tab
    │   ├── StepsOverviewScreen
    │   ├── StepDetailScreen
    │   └── StepReviewScreen
    ├── Meetings Tab
    │   ├── MeetingFinderScreen
    │   ├── MeetingDetailScreen
    │   └── FavoriteMeetingsScreen
    └── More Tab
        ├── ProfileScreen
        ├── SettingsScreens
        ├── SponsorScreens
        ├── EmergencyScreens
        └── ProgressDashboard
```

---

## Contexts (`apps/mobile/src/contexts/`)

| Context | Provider | Hook | Purpose |
|---------|----------|------|---------|
| AuthContext | AuthProvider | useAuth | Supabase auth, session |
| DatabaseContext | DatabaseProvider | useDatabase | Platform-agnostic DB |
| SyncContext | SyncProvider | useSync | Offline sync lifecycle |
| NotificationContext | NotificationProvider | useNotifications | Push permissions |

**Init Order**: Auth → Database → Sync → Notifications

---

## Stores (`apps/mobile/src/store/`)

| Store | Purpose |
|-------|---------|
| useReadingStore | Daily reading tracking (Zustand) |
| useRegularMeetingStore | Meeting schedules (Zustand) |

---

## Key Utility Files

| File | Purpose |
|------|---------|
| `utils/encryption.ts` | AES-256-CBC encryption/decryption |
| `utils/database.ts` | Schema init, migrations |
| `utils/logger.ts` | Secure logging with redaction |
| `utils/validation.ts` | Input validation |
| `utils/performance.ts` | Performance monitoring |
| `utils/biometrics.ts` | Biometric authentication |
| `utils/haptics.ts` | Haptic feedback |
| `utils/logoutCleanup.ts` | Secure logout cleanup |
| `utils/platform.ts` | Platform detection |
| `lib/utils.ts` | cn() helper (clsx + twMerge) |
| `adapters/storage/` | StorageAdapter (SQLite/IndexedDB) |
| `adapters/secureStorage/` | SecureStore (native/web) |
