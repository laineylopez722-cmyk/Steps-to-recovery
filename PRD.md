# Product Requirements Document — Steps to Recovery

**Version:** 1.0  
**Last Updated:** 2026-02-13  
**Authors:** H (Founder), Claude (Technical Co-founder)  
**Status:** Living Document

---

## 1. Product Vision

**Steps to Recovery** is a privacy-first mobile companion for people working a 12-step recovery program. It replaces the patchwork of day-counter apps, generic journaling tools, and disconnected meeting finders with a single, thoughtful app that actually guides you through the work of recovery.

### What Makes This Different

Most recovery apps count days. This one does the work with you.

- **Guided step work** — not just "Step 4: Make a fearless moral inventory" but actual prompts, questions, and guided reflection for each step
- **AI companion with memory** — a friend-like AI that remembers your journey, references past entries, and provides contextual support without being a therapist
- **Crisis intervention** — real-time craving support, breathing exercises, grounding techniques, and an emergency contact system that intervenes before relapse
- **Offline-first** — works without internet because recovery doesn't wait for WiFi
- **Encrypted by default** — step work and journal entries are AES-256 encrypted on-device. We never see your data.

### Target User

Someone early in recovery (0-2 years) who is actively working a 12-step program (AA, NA, or similar). They may or may not have a sponsor. They're likely using their phone as their primary device. They might be accessing the app from a treatment facility with limited connectivity.

---

## 2. Core User Journeys

### 2.1 Daily Check-In Rhythm

**Morning Intention** → User sets an intention for the day, rates their mood (1-5), and optionally reads the daily reflection.

**Evening Pulse** → User reflects on the day, rates mood + craving level (0-10), notes gratitude, and reviews their intention.

**Why it matters:** Consistent self-awareness is the foundation of recovery. The check-in data feeds the AI companion's context and the progress dashboard.

### 2.2 Step Work

**Overview** → See all 12 steps with progress status (not started / in progress / completed). Steps unlock sequentially (though users can review completed steps).

**Step Detail** → Each step presents guided questions specific to that step. Users answer questions one at a time, can save progress, and return later. Includes program-specific guidance text and the ability to review answers.

**Step Review** → After completing a step, users can review all their answers and optionally share with their sponsor.

**Why it matters:** This is the core differentiator. No other app walks you through actual step work with guided prompts.

### 2.3 AI Companion

**Chat** → Conversational AI that knows the user's recovery context (check-in history, step progress, journal entries). Supports general conversation, step-work guidance, crisis support, and check-in reflection.

**Crisis Detection** → If the AI detects risk keywords or elevated craving language, it surfaces immediate crisis resources (hotlines, grounding exercises, emergency contacts) via a CrisisOverlay.

**Memory** → The AI extracts meaningful context from journal entries and check-ins to provide personalized, continuous support across sessions.

**Why it matters:** Many people in early recovery don't have 24/7 access to their sponsor or support network. The AI fills that gap — not as a therapist, but as a knowledgeable, caring friend.

### 2.4 Crisis & Emergency

**Emergency Screen** → One-tap access to crisis hotlines, personal emergency contacts, and the "Before You Use" intervention flow.

**Before You Use** → Full-screen guided intervention when someone is about to relapse. Breathing exercises, grounding techniques, and a "call someone" prompt. No judgment, just tools.

**Danger Zone** → Manage risky contacts and triggers. The SafeDial intervention intercepts when a user tries to call a flagged contact.

**Craving Surf** → Guided technique to ride out a craving with breathing exercises, distraction options, and a craving intensity tracker.

**Why it matters:** The moment someone is closest to relapse is when they need the most support and have the least capacity to seek it. These features need to be bulletproof, instant, and frictionless.

### 2.5 Journaling

**Journal List** → Browse and search past journal entries. Entries can be tagged, favorited, and encrypted.

**Journal Editor** → Write entries with mood tagging. Supports encrypted storage and optional sharing with sponsor.

**Why it matters:** Journaling is a core recovery practice. The entries also feed the AI companion's contextual memory.

### 2.6 Meetings

**Meeting Finder** → Search for nearby meetings by type, distance, and schedule.

**Meeting Detail** → View meeting info, check in to meetings, and write pre/post-meeting reflections.

**Favorites** → Save frequently attended meetings for quick access.

**Achievements & Stats** → Track meeting attendance streaks, unlock achievements, and view meeting statistics.

**Why it matters:** Regular meeting attendance is strongly correlated with sustained recovery. Making it easy to find and track meetings removes a friction point.

### 2.7 Progress & Insights

**Progress Dashboard** → Visual overview of recovery journey: clean time, mood trends, craving patterns, commitment calendar, and weekly reports.

**Weather & Mood Insights** — Correlation between external factors and emotional state.

**Recovery Strength Card** — Composite score based on check-in consistency, meeting attendance, step progress, and journal frequency.

**Why it matters:** Seeing progress reinforces commitment. Identifying patterns (e.g., cravings spike on Fridays) enables proactive coping.

### 2.8 Sponsor Connection

**Sponsor Screen** → Manage sponsor/sponsee relationships.

**Invite Sponsor** → Send an invitation for a sponsor to connect.

**Share Entries** → Selectively share journal entries or step work with a sponsor for guided discussion.

**Why it matters:** The sponsor-sponsee relationship is central to 12-step programs. Enabling secure, selective sharing respects both privacy and the program's structure.

---

## 3. Non-Functional Requirements

### 3.1 Privacy & Security
- All personal data (journal, step work, chat) encrypted at rest with AES-256 via expo-secure-store
- SQLite database with on-device encryption
- Biometric lock option (Face ID / fingerprint)
- No analytics that could identify recovery status
- Supabase auth with anonymous sign-up option
- Zero-knowledge architecture: server cannot read user content

### 3.2 Offline-First
- All core features must work without internet
- Check-ins, journal, step work, craving surf: fully offline
- Meeting finder: cached results + last-known data
- AI companion: graceful degradation with clear messaging when offline
- Sync when connectivity returns

### 3.3 Performance
- App launch to interactive: < 2 seconds
- Screen transitions: 60fps (native stack navigator)
- Database queries: < 100ms for common reads
- AI response start: < 2 seconds (streaming)

### 3.4 Accessibility
- Full screen reader support (VoiceOver/TalkBack)
- Minimum touch targets: 44pt
- Dynamic type support
- High contrast mode via design system
- Haptic feedback for key interactions

### 3.5 Platform Support
- Android 8+ (API 26+)
- iOS 15+ (future)
- Expo SDK 54 / React Native 0.81

---

## 4. Technical Architecture

### 4.1 Stack
| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 54, managed workflow) |
| Language | TypeScript (strict mode) |
| Navigation | React Navigation 7 (native stack + bottom tabs) |
| State | React Query + local hooks |
| Database | SQLite (expo-sqlite) + Drizzle ORM |
| Encryption | AES-256 via expo-secure-store |
| Auth | Supabase Auth |
| AI Backend | Supabase Edge Functions → OpenAI |
| Styling | Uniwind + custom design system tokens |
| Animations | react-native-reanimated 4.x |
| Error Tracking | Sentry |
| Build | EAS Build + EAS Submit |
| CI | GitHub Actions |

### 4.2 Data Model (SQLite)
- `users` — profile, sobriety date, program type, settings
- `check_ins` — morning/evening check-ins with mood/craving ratings
- `journal_entries` — encrypted journal with tags and mood
- `reading_reflections` — daily reading responses
- `contacts` — sponsor, support network, emergency contacts
- `phone_calls` — call log for accountability
- `achievements` — milestones and streaks
- `step_progress` — per-step status tracking
- `chat_conversations` — AI companion conversation threads
- `chat_messages` — encrypted message history
- `step_work_entries` — detailed step work (resentments, fears, amends, reflections)

### 4.3 AI Architecture
- **Proxy mode** (default): Mobile → Supabase Edge Function → OpenAI (free tier, usage-tracked)
- **BYOK mode**: User provides own API key for direct access
- **Context pipeline**: Check-in history + journal extracts + step progress → system prompt
- **Crisis detection**: Keyword matching + sentiment analysis → CrisisOverlay trigger
- **Streaming**: Server-sent events for real-time response display
- **Cancel**: AbortSignal threaded from UI hook → service → network layer

### 4.4 Design System
- **Base**: True black (`#0A0A0A`) background with amber (`#F59E0B`) accent
- **Tokens**: Semantic surface tokens (`surface.app`, `surface.elevated`, `surface.card`, `surface.interactive`), text tokens (`text.primary`, `text.muted`, `text.inverse`), intent tokens (primary/success/warning/danger)
- **Motion**: MD3-aligned motion tokens in `design-system/tokens/motion.ts`
- **Components**: Themed via `useDs()` hook and `DsProvider`
- **Aesthetic**: Premium, calm, focused. No glassmorphism, no rainbow palettes, no floating action buttons.

---

## 5. Navigation Structure

```
Root
├── Auth Stack
│   ├── Onboarding
│   ├── Login
│   ├── Sign Up
│   └── Forgot Password
│
└── Main Tabs
    ├── Home Stack
    │   ├── Home (dashboard)
    │   ├── Morning Intention
    │   ├── Evening Pulse
    │   ├── Emergency (modal)
    │   ├── Daily Reading
    │   ├── Progress Dashboard
    │   ├── Meeting Stats
    │   ├── Achievements
    │   ├── Challenges
    │   ├── Danger Zone
    │   ├── SafeDial Intervention (fullscreen modal)
    │   ├── Before You Use (fullscreen modal)
    │   ├── Companion Chat
    │   ├── Personal Inventory
    │   ├── Gratitude
    │   ├── Craving Surf
    │   └── Safety Plan
    │
    ├── Journal Stack
    │   ├── Journal List
    │   └── Journal Editor
    │
    ├── Steps Stack
    │   ├── Steps Overview
    │   ├── Step Detail
    │   └── Step Review
    │
    ├── Meetings Stack
    │   ├── Meeting Finder
    │   ├── Meeting Detail
    │   └── Favorite Meetings
    │
    └── Profile Stack
        ├── Profile Home
        ├── Sponsor
        ├── Invite Sponsor
        ├── Shared Entries
        ├── Share Entries
        ├── AI Settings
        ├── Notification Settings
        ├── Security Settings
        ├── Widget Settings
        ├── Privacy Policy
        └── Terms of Service
```

---

## 6. Current State (as of 2026-02-13)

### What's Built
- ✅ Full navigation structure (all screens exist and route)
- ✅ Auth flow (login, signup, forgot password, biometric)
- ✅ Home dashboard with clean time, check-in cards, quick actions
- ✅ Morning/Evening check-in flows
- ✅ Complete step work system (12 steps, guided questions, save/resume, review)
- ✅ AI companion chat with streaming, context, and crisis detection
- ✅ Journal with encryption, tagging, favorites
- ✅ Meeting finder, detail, favorites, check-in, reflections
- ✅ Emergency screen, danger zone, SafeDial intervention
- ✅ Before You Use crisis intervention flow
- ✅ Craving surf with breathing exercises
- ✅ Progress dashboard with charts and insights
- ✅ Sponsor connection and entry sharing
- ✅ Safety plan builder
- ✅ Daily readings with reflections
- ✅ Challenges system
- ✅ Gratitude journaling
- ✅ Personal inventory (Step 10)
- ✅ Design system with semantic tokens, motion, theming
- ✅ SQLite + Drizzle ORM with encrypted storage
- ✅ Sentry error tracking
- ✅ EAS build pipeline (dev + preview profiles)

### What Needs Work
- 🔧 AI companion end-to-end validation (edge function deployment, proxy mode activation)
- 🔧 Crisis screens polish (BeforeYouUse + Emergency surface refinement)
- 🔧 8 remaining component-level semantic token migrations
- 🔧 Offline behavior validation across all core flows
- 🔧 Physical device testing (APK available, tunnel tested)
- 🔧 Push notification setup
- 🔧 App Store / Play Store listing preparation
- 🔧 Onboarding flow refinement
- 🔧 Supabase secrets deployment (OPENAI_API_KEY)

---

## 7. Success Metrics (Post-Launch)

| Metric | Target | Why |
|--------|--------|-----|
| Daily check-in completion | > 60% of active users | Core engagement signal |
| Step work started | > 40% within first week | Validates core differentiator |
| Crisis feature usage | Any usage = success | Means the feature exists when needed |
| 7-day retention | > 35% | Industry benchmark for health apps |
| 30-day retention | > 20% | Long-term recovery companion signal |
| App rating | > 4.5 stars | Quality perception |
| Crash-free rate | > 99.5% | Reliability for vulnerable users |

---

## 8. Roadmap (Next 3 Months)

### Phase 1: Closed Beta (Now → Week 2)
- Get app on physical devices
- Validate AI companion end-to-end
- Crisis screens bulletproof
- Offline behavior verified
- Fix any device-specific issues

### Phase 2: Stability & Polish (Weeks 3-6)
- Onboarding flow refinement
- Push notifications working
- Performance optimization pass
- Accessibility audit
- Remaining token migrations

### Phase 3: Launch Prep (Weeks 7-10)
- Play Store listing
- Privacy policy / terms finalized
- App Store submission (iOS)
- Landing page
- Initial user feedback loop

### Phase 4: Post-Launch Iteration (Weeks 11+)
- User feedback-driven improvements
- AI companion enhancements (voice input, richer context)
- Community features (anonymous sharing, group support)
- Widget for home screen (clean time + daily intention)

---

## 9. Principles

1. **The user is vulnerable.** Every design decision respects that someone in crisis might be using this app. Speed, clarity, and reliability are non-negotiable.

2. **Privacy is the product.** We don't just protect data — we make privacy a feature. Users should feel safe writing their deepest fears into this app.

3. **Offline is the default.** Assume no internet. Design for it. Then add online features as enhancements.

4. **Progress over perfection.** Ship working software. Iterate based on real usage. Don't let perfect be the enemy of helpful.

5. **The 12 steps are the backbone.** Every feature should support or connect back to step work. This isn't a general wellness app.

---

*This is a living document. Updated as the product evolves.*
