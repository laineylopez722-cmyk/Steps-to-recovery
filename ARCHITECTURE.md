# ARCHITECTURE.md — Steps to Recovery

> System architecture reference for autonomous development. Read this before making structural changes.

## Monorepo Layout

```
Steps-to-recovery/
├── apps/
│   └── mobile/              # React Native + Expo app
│       ├── android/         # Native Android project (prebuild)
│       ├── src/             # All application source
│       └── app.json         # Expo config
├── packages/
│   └── shared/              # Shared types, constants, services
│       ├── constants/       # stepPrompts.ts (12-step questions)
│       └── src/             # Exports: types, services, step helpers
├── supabase/
│   ├── functions/           # Edge functions (ai-chat)
│   └── migrations/          # SQL migrations
├── PRD.md                   # Product requirements
└── ARCHITECTURE.md          # This file
```

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | React Native + Expo SDK 54 | Custom dev client (not Expo Go — native modules required) |
| Language | TypeScript (strict) | Zero `any` policy |
| Navigation | React Navigation 7 (native stack) | Tab navigator + per-tab stacks |
| Database | SQLite via expo-sqlite + Drizzle ORM | All data local-first, AES-256 encrypted |
| Auth | Supabase Auth | Email signup (anonymous auth available but not enabled) |
| Backend | Supabase (Postgres + Edge Functions) | Edge functions for AI proxy |
| AI | OpenAI via Supabase edge function | Proxied through `ai-chat` function |
| Styling | Design system tokens + `useThemedStyles` | No Tailwind/NativeWind in components |
| Animations | react-native-reanimated ~4.1.1 | NOT framer-motion |
| Build | EAS (cloud) or local Gradle | EAS free tier cycles — local builds as fallback |

## Source Structure (`apps/mobile/src/`)

```
src/
├── adapters/          # Platform abstractions (crypto, storage)
├── components/        # Shared UI components (legacy — migrating to design-system)
├── config/            # App configuration
├── constants/         # App-level constants
├── contexts/          # React contexts (AuthContext, etc.)
├── data/              # Static data
├── db/                # Database: client.ts, schema.ts, index.ts
├── design-system/     # Design tokens, primitives, themed components
│   ├── components/    # Button, Card, Text, TextArea, Modal, etc.
│   ├── hooks/         # useTheme, useThemedStyles, useDs
│   ├── primitives/    # Action (pressable), Surface
│   ├── tokens/        # colors, typography, spacing, radius
│   └── DsProvider.tsx # Design system context provider
├── features/          # Feature modules (see below)
├── hooks/             # Shared hooks
├── lib/               # Third-party wrappers
├── navigation/        # Navigator definitions, types, linking
├── providers/         # App-level providers
├── services/          # Business logic services
├── store/             # State management
├── test-utils/        # Test helpers
├── types/             # Shared type definitions
└── utils/             # Utility functions (haptics, formatting, etc.)
```

## Feature Modules (`src/features/`)

Each feature is self-contained with its own components, hooks, screens, and services.

| Feature | Files | Purpose |
|---------|-------|---------|
| **ai-companion** | 65 | AI chat with memory, prompts, quick actions |
| **steps** | 38 | 12-step work: overview, detail, single-question view, review |
| **meetings** | 28 | Meeting finder with filters, map, details |
| **progress** | 22 | Progress dashboard, milestones, insights |
| **home** | 14 | Home screen with hero card, shortcuts, check-in cards |
| **emergency** | 13 | Emergency screen, close calls, risky contacts |
| **sponsor** | 13 | Sponsor management |
| **settings** | 8 | App settings |
| **craving-surf** | 8 | Craving surf guided exercise |
| **safety-plan** | 7 | Personal safety plan |
| **journal** | 7 | Journal entries |
| **challenges** | 6 | Recovery challenges |
| **auth** | 5 | Login/signup |
| **crisis** | 4 | BeforeYouUse timer screen |
| **inventory** | 4 | Personal inventory |
| **gratitude** | 4 | Gratitude list |
| **onboarding** | 2 | First-run onboarding |
| **readings** | 2 | Daily readings |
| **profile** | 1 | User profile |

## Database

**Engine:** SQLite (expo-sqlite) with Drizzle ORM.

**Tables:**
- `users` — profile, sobriety date, settings
- `check_ins` — morning/evening check-ins (mood, intention, reflection)
- `journal_entries` — encrypted journal with tags, mood, favorites
- `reading_reflections` — daily reading responses
- `contacts` — sponsor/support network
- `phone_calls` — call log to support contacts
- `step_work_answers` — answers to 12-step questions
- `close_calls` — close call incidents with outcome tracking
- `risky_contacts` — contacts to avoid (dealer, trigger person)
- `ai_conversations` / `ai_messages` — AI chat history
- `ai_memory_extractions` — extracted memories from journal/check-ins
- `challenges` — recovery challenges
- `gratitude_entries` — gratitude list

**Migrations:** Numbered v1–v19, run on app startup. All in `db/` directory.

**Encryption:** AES-256 for sensitive fields (journal content, check-in text). Keys derived from user auth.

## Navigation

```
RootNavigator
├── AuthNavigator (unauthenticated)
│   ├── Login
│   └── Signup
└── MainNavigator (authenticated)
    └── TabNavigator
        ├── HomeStack
        │   ├── Home
        │   ├── DailyReading
        │   ├── ProgressDashboard
        │   └── MorningIntention / EveningPulse
        ├── JournalStack
        │   ├── JournalList
        │   └── JournalEntry
        ├── StepsStack
        │   ├── StepsOverview
        │   ├── StepDetail (single-question view)
        │   └── StepReview
        ├── MeetingsStack
        │   ├── MeetingFinder
        │   └── MeetingDetail
        └── ProfileStack
            ├── Profile
            ├── Settings
            └── SafetyPlan
```

Modal/overlay screens: Emergency, BeforeYouUse, CravingSurf, AICompanion.

## Design System

### Token Architecture

All visual values come from the design system (`DsProvider`):

```
ds.colors.*          — raw color palette
ds.semantic.*        — context-aware tokens
  .surface.app       — screen background (#0A0A0A)
  .surface.card      — card backgrounds
  .surface.interactive — buttons, inputs
  .text.primary      — main text
  .text.secondary    — supporting text
  .text.onDark       — text on accent/dark backgrounds
  .intent.primary.*  — accent colors (amber #F59E0B)
ds.typography.*      — font sizes, weights, line heights
ds.space.*           — spacing scale
ds.radius.*          — border radius scale
ds.sizes.*           — touch targets, icons
```

### Styling Pattern

```tsx
// Always use useThemedStyles for stylesheets
const styles = useThemedStyles(createStyles);
const ds = useDs();

const createStyles = (ds: DS) => ({
  container: {
    backgroundColor: ds.semantic.surface.card,
    borderRadius: ds.radius.lg,
    padding: ds.space[4],
  },
}) as const;
```

**Rules:**
- Never use raw hex colors in components
- Never use `theme.colors.background` or `theme.colors.text` (legacy — fully migrated)
- Use `ds.semantic.*` for all new code
- True black background: `#0A0A0A`, accent amber: `#F59E0B`

## AI Companion

### Architecture

```
User message
  → useAIChat hook
    → AI service layer
      → Supabase edge function (ai-chat)
        → OpenAI API
          → Response streamed back
```

### Key Files
- `features/ai-companion/hooks/useAIChat.ts` — main chat hook
- `features/ai-companion/services/` — AI service, memory extraction
- `features/ai-companion/prompts/` — system prompts, context building
- `supabase/functions/ai-chat/index.ts` — edge function proxy

### Environment
- `EXPO_PUBLIC_AI_PROXY_ENABLED` — enables AI proxy (defaults to disabled)
- `OPENAI_API_KEY` — set in Supabase secrets (not in app)

### Principles
- AI voice: friend, not therapist
- No repetitive over-validation
- Reference user history when helpful
- Detect crisis keywords → surface immediate support options
- All messages stored locally in SQLite

## Crisis Flow

**Priority: someone's life may depend on these features.**

Three crisis-related screens:
1. **EmergencyScreen** — immediate support: call sponsor, crisis hotline, emergency contacts
2. **BeforeYouUseScreen** — 5-minute timer before proceeding (harm reduction)
3. **CravingSurfScreen** — guided mindfulness exercise for riding out cravings

All must work **fully offline**. No network calls in the critical path.

## Build & Deploy

### Local Build (current)
```bash
cd apps/mobile
JAVA_HOME="C:\Program Files\Microsoft\jdk-17.0.17.10-hotspot"
npx react-native run-android
# or: cd android && ./gradlew assembleDebug
```

**JDK 17 required** — JDK 21/25 break the React Native Gradle plugin.

### EAS Build
```bash
eas build --platform android --profile preview
```
Free tier: limited builds per month. Resets monthly.

### APK Location
`android/app/build/outputs/apk/debug/app-debug.apk`

## Testing

```bash
npx tsc --noEmit          # Type check (must pass before every commit)
npx jest                  # Unit tests
npx expo-doctor           # SDK health check (17/17 should pass)
```

## Key Decisions

See `DECISIONS.md` for the full log. Critical ones:

- **Offline-first**: All data in local SQLite. Supabase is optional sync layer.
- **No Expo Go**: Native modules (expo-sqlite, expo-crypto) require custom dev client.
- **Single-question UX**: Step work shows one question at a time with prev/next navigation. Not a scrolling list.
- **Semantic tokens only**: All components use `ds.semantic.*` — no legacy `theme.colors.*`.
- **Fire-and-forget haptics**: Never `await` haptics before `onPress` callbacks.
- **No framer-motion**: Using react-native-reanimated for all animations.
- **Headers scroll with content**: Never use fixed headers above FlatList — use `ListHeaderComponent`.

## Autonomous Development Guidelines

When working without H:
1. Follow `PRD.md` priorities
2. Fix bugs, improve tests, polish UI
3. **No new features** without H's input
4. **No external deploys** or outreach
5. Small, focused, green commits only
6. Run `tsc --noEmit` before every commit
7. Keep daily logs in `memory/YYYY-MM-DD.md`
8. Update the live workspace trackers (`to be done/01-current-state.md` and `02-active-priorities.md`) with blockers
9. If something feels risky, document it and wait
