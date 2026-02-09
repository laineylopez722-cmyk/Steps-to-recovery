# Recovery Companion - Phase Prompts
## Task-Specific Prompts for BMAD Development

---

## How to Use This Document

These prompts are designed to be copied and used when asking Claude (or Cursor)
to help with specific tasks. Each prompt includes context and constraints to
ensure consistent, high-quality outputs that follow project standards.

**Usage Pattern:**
1. Find the relevant phase/task section
2. Copy the prompt template
3. Fill in any `[VARIABLES]`
4. Submit to Claude/Cursor

---

## Phase 0: Discovery & Assessment

### 0.1 UX Audit Prompt

Use this when you need to evaluate the current app state:

```
I need you to perform a UX audit of the Recovery Companion app.

Focus areas:
1. Critical path timing (how long to reach emergency, check-in, journal)
2. Friction points in user flows
3. Cognitive load per screen (count decisions required)
4. Navigation clarity
5. Accessibility gaps

For each finding, rate severity as:
- 🔴 Critical (affects safety or core function)
- 🟡 Moderate (impacts daily use)
- 🟢 Minor (polish issue)

Output format:
1. Executive summary (3-5 key findings)
2. Detailed findings table
3. Recommended fixes prioritized by impact/effort

Remember: This is a recovery app. "Critical" means anything that could 
prevent someone in crisis from getting help quickly.
```

### 0.2 Feature Audit Prompt

Use this to evaluate whether features should stay or go:

```
Evaluate the following feature for the Recovery Companion app: [FEATURE_NAME]

Assessment criteria:
1. Does it address a core recovery need?
2. Does it align with "progress not perfection" philosophy?
3. Could it cause harm (shame, pressure, comparison)?
4. Is it the simplest solution to the need?
5. Would removing it hurt the core experience?

Answer each with:
- YES/NO
- Brief explanation (1-2 sentences)

Final recommendation: KEEP / SIMPLIFY / REMOVE / MOVE TO BACKLOG

If REMOVE: Explain what would replace the need (if anything)
If SIMPLIFY: Describe the simpler version
```

### 0.3 Privacy Compliance Check

Use this to verify a feature respects privacy:

```
Verify privacy compliance for: [FEATURE/SCREEN NAME]

Check each:
- [ ] Does it make any network calls? (List them if yes)
- [ ] Does it store data? (Where and what?)
- [ ] Is sensitive data encrypted? (Which fields?)
- [ ] Are there any analytics events? (Should be zero)
- [ ] Does it require account/login? (Should be no)
- [ ] Does it work offline? (Must be yes)

If ANY check fails, explain:
1. What specifically violates privacy
2. How to fix it
3. If it cannot be fixed, recommend removing the feature
```

---

## Phase 1: Foundation & Privacy

### 1.1 Implement Data Export

```
Implement the data export feature for Recovery Companion.

Requirements:
1. Export all user data as JSON file
2. Include: profile, journal entries, check-ins, milestones, 
   meetings, vault items, capsules, settings
3. Decrypt all encrypted content before export (user owns their data)
4. Use expo-sharing to present share sheet
5. Add export button to Settings screen

File location: lib/export/index.ts
Settings update: app/settings/index.tsx

Export format:
{
  "exportedAt": "ISO-8601 timestamp",
  "appVersion": "1.0.0",
  "profile": { ... },
  "journalEntries": [ ... ],
  "dailyCheckins": [ ... ],
  "milestones": [ ... ],
  "meetingLogs": [ ... ],
  "vaultItems": [ ... ],
  "timeCapsules": [ ... ],
  "settings": { ... }
}

Include error handling and loading states.
Follow existing patterns in the codebase.
```

### 1.2 Implement Data Deletion

```
Implement the data deletion feature with proper confirmation.

Requirements:
1. User must type "DELETE" to confirm
2. Clear all SQLite tables
3. Clear SecureStore encryption key
4. Reset app state (all Zustand stores)
5. Navigate to onboarding

UI flow:
1. Button: "Delete All Data" (red, at bottom of Settings)
2. Modal: "This will permanently delete all your recovery data"
3. Text input: "Type DELETE to confirm"
4. Button: Disabled until "DELETE" typed correctly
5. Loading state during deletion
6. Navigate to onboarding after complete

Locations:
- lib/db/client.ts: Add clearDatabase() function
- lib/store/*.ts: Add reset() to each store
- app/settings/index.tsx: Add deletion UI

This is a destructive action. Be thorough with confirmation.
```

### 1.3 Add Accessibility Labels

```
Add accessibility labels to: [SCREEN_NAME]

For each interactive element, add:
- accessibilityLabel (what it is)
- accessibilityRole (button, link, text, etc.)
- accessibilityHint (what happens when activated)
- accessibilityState (if applicable: disabled, checked, etc.)

For grouped content:
- accessible={true} on the container
- accessibilityLabel describing the group

Example:
<TouchableOpacity
  accessibilityLabel="Add journal entry"
  accessibilityRole="button"
  accessibilityHint="Opens the journal entry form"
  onPress={...}
>

List every interactive element you find and the labels you're adding.
If an element already has labels, note it and move on.
```

---

## Phase 2: Core UX Improvements

### 2.1 Implement Journal Search

```
Add search functionality to the journal list.

Requirements:
1. Search bar at top of journal screen (app/(tabs)/journal.tsx)
2. Search content and emotion tags
3. Debounce input (300ms) to prevent excessive queries
4. Show "No results" empty state when search has no matches
5. Clear button to reset search
6. Preserve search when navigating back from entry

Implementation:
1. Add searchQuery to journalStore
2. Create filtered entries selector
3. Add SearchInput component (or use existing)
4. Update FlatList to use filtered data

Performance: Search should complete in <500ms even with 1000+ entries.
Use useMemo for the filtered list.

Follow NativeWind patterns for styling.
Include accessibility labels on search input.
```

### 2.2 Add Simple Mood Trend Chart

```
Create a simple mood trend visualization for the Progress screen.

Requirements:
1. Line chart showing mood over last 30 days
2. X-axis: dates (show every 7th day label)
3. Y-axis: mood 1-10
4. Use check-in data (dailyCheckins table)
5. Show "Not enough data" if <7 check-ins

Design:
- Height: ~200px
- Colors: Use purple gradient for the line
- Background: Semi-transparent grid lines
- Points: Small dots on data points

Location: components/progress/SimpleTrendChart.tsx
Usage: app/(tabs)/progress.tsx

NO external charting libraries. Use react-native-svg for drawing.
Keep it simple - this is not an analytics dashboard.

Include accessibility:
- accessibilityLabel="Mood trend chart for the last 30 days"
- accessibilityHint describing the general trend if possible
```

### 2.3 Improve Crisis Access

```
Improve emergency resource access across the app.

Current problem: Emergency is 3+ taps away.
Target: Under 5 seconds from any screen.

Implementation:
1. Add CrisisButton FAB component (floating action button)
   - Position: bottom-right, above tab bar
   - Color: red/emergency
   - Icon: phone or help icon
   - Tapping navigates to /emergency

2. Add CrisisButton to root _layout.tsx
   - Should appear on all screens except:
     - Lock screen
     - Onboarding
     - The emergency screen itself

3. Update Tools screen
   - Move Emergency Resources to position 0 (first item)
   - Make it visually distinct (larger or different color)

Component location: components/common/CrisisButton.tsx

Include:
- accessibilityLabel="Get emergency help"
- accessibilityRole="button"
- accessibilityHint="Opens crisis resources and support hotlines"
```

---

## Phase 3: Simplification

### 3.1 Tools Screen Reorganization

```
Reorganize the Tools screen into tiered sections.

Current: 8 tools in flat grid
Goal: 3 tiers with progressive disclosure

Tier 1: Always Visible (Crisis & Daily)
- 🆘 Emergency Resources (position 0, visually distinct)
- 🧘 Breathing Exercises
- 🔐 Motivation Vault

Tier 2: Regular Recovery (collapsible, default expanded)
- 📖 Step Work Guide
- 📍 Meeting Tracker
- 💬 Daily Affirmations

Tier 3: Advanced (collapsible, default collapsed)
- 🎯 Trigger Scenarios
- 💌 Time Capsule

Implementation:
1. Create ToolsSection component (collapsible)
2. Update app/(tabs)/tools.tsx with new layout
3. Persist collapse state in settings store

Design:
- Section headers with chevron indicating expand/collapse
- Smooth animation for expand/collapse (300ms)
- Tier 1 items slightly larger

Accessibility:
- accessibilityRole="group" on sections
- accessibilityState={{ expanded: isExpanded }}
```

### 3.2 Copy Review

```
Review and update all user-facing copy in: [SCREEN/COMPONENT]

For each piece of text, evaluate:
1. Is it compassionate? (no shame, no pressure)
2. Is it clear? (no jargon, no ambiguity)
3. Is it necessary? (can it be shorter or removed?)

Flag anything that:
- Uses "you should" or "don't forget"
- Mentions streaks in a punitive way
- Could make someone feel guilty
- Uses gamification language (points, badges, unlock)

Provide before/after for each change:
BEFORE: "You haven't journaled in 5 days. Don't give up!"
AFTER: "Your journal is here when you're ready."

List screens/components that need attention.
```

---

## Phase 4: Polish & Production

### 4.1 Performance Optimization

```
Optimize performance for: [SCREEN/COMPONENT]

Checks to perform:
1. Unnecessary re-renders (use React DevTools)
2. Large lists without FlatList virtualization
3. Inline functions in render (should be useCallback)
4. Missing keys in lists
5. Heavy computations without useMemo
6. Store subscriptions too broad

For each issue found:
- Describe the problem
- Show the fix
- Explain the performance impact

Targets:
- Screen load: <2 seconds
- List scroll: 60 FPS
- Interactions: <100ms response
- No jank during animations
```

### 4.2 Error Handling Audit

```
Audit error handling in: [MODULE/FEATURE]

For each async operation:
1. Is it wrapped in try/catch?
2. Is the error logged appropriately?
3. Is there a user-facing error message?
4. Does the UI recover gracefully?

Check for:
- Database operations
- Encryption/decryption
- File operations
- Biometric authentication

Error message requirements:
- User-friendly (no technical jargon)
- Actionable (what can they do?)
- Not alarming (their data is safe)

Example:
BAD: "SQLite error: UNIQUE constraint failed"
GOOD: "We couldn't save this entry. Please try again."
```

### 4.3 Accessibility Audit

```
Perform comprehensive accessibility audit of: [SCREEN]

Test with screen reader:
1. Can you navigate the entire screen?
2. Are all interactive elements announced?
3. Is the reading order logical?
4. Are images described?
5. Are form errors announced?

Check:
- [ ] All TouchableOpacity have accessibilityLabel
- [ ] All TextInput have accessibilityLabel
- [ ] All images have accessibilityLabel or are marked decorative
- [ ] Color is not the only indicator of state
- [ ] Touch targets are at least 44x44 points
- [ ] Focus order is logical

For each issue:
- Element description
- What's missing
- The fix
```

---

## Feature-Specific Prompts

### Add New Journal Type

```
Add a new journal type: [TYPE_NAME]

Example types: 'freeform', 'step-work', 'meeting-reflection', 'daily-checkin'

Steps:
1. Add type to JournalType union in lib/types.ts
2. Add prompts/template to lib/constants/journalPrompts.ts
3. Update journal entry form to handle new type
4. Update journal list to filter/display new type
5. Add appropriate icon for type

If the type requires additional fields:
- Update database schema (add migration)
- Update JournalEntry interface
- Update journalStore

Follow existing patterns in the codebase.
```

### Add New Tool

```
Add a new tool to the Tools screen: [TOOL_NAME]

Tool specification:
- Name: [TOOL_NAME]
- Icon: [ICON_FROM_LUCIDE]
- Description: [SHORT_DESCRIPTION]
- Tier: [1/2/3]
- Screen location: app/[path].tsx

Steps:
1. Create screen file (if new screen needed)
2. Add to Tools screen grid
3. Add navigation
4. Add to appropriate tier

If it requires data storage:
- Design the schema
- Create store or add to existing
- Handle encryption if sensitive

If it requires notifications:
- Use expo-notifications
- Local only (no server)
- User must opt-in

Follow project UX principles throughout.
```

### Implement Milestone

```
Implement milestone: [MILESTONE_NAME]

Milestone types: 'time-based', 'step-completion', 'personal', 'meeting'

For time-based milestones:
1. Add to lib/constants/milestones.ts
2. Create reflection prompt
3. Handle achievement detection in useSobriety hook
4. Show notification when achieved
5. Create celebration UI

For personal milestones:
1. Allow user to define title
2. Allow user to add reflection
3. Store in milestones table
4. Show in timeline

Celebration UI should:
- Use keytag imagery (if applicable)
- Prompt for reflection
- Be celebratory but not gamified
- Preserve even after relapse

Follow UX-PRINCIPLES.md for all messaging.
```

---

## Debugging Prompts

### Debug Privacy Issue

```
I found a potential privacy issue in: [LOCATION]

Describe what I saw: [DESCRIPTION]

Help me verify:
1. Is any data being transmitted off-device?
2. Is sensitive data being logged?
3. Is data being stored unencrypted?
4. Are there any analytics calls?

Show me how to:
1. Trace the data flow
2. Find where the issue originates
3. Fix it properly

This is a privacy-first app. Any data leaving the device (except
user-initiated export) is a critical bug.
```

### Debug Encryption Issue

```
Encryption issue: [DESCRIPTION]

What I expected: [EXPECTED]
What happened: [ACTUAL]

Help me debug:
1. Is the encryption key being generated correctly?
2. Is the key being stored/retrieved from SecureStore?
3. Is the encryption function working?
4. Is the decryption function working?
5. Is the data being stored as encrypted or plain?

Relevant files:
- lib/encryption/index.ts
- lib/db/client.ts

Show me how to add logging (temporarily) to trace the issue.
Remember to tell me to remove the logging before shipping.
```

### Debug Store Issue

```
State management issue in: [STORE_NAME]

What I expected: [EXPECTED]
What happened: [ACTUAL]

Help me debug:
1. Is the state being updated correctly?
2. Is the component subscribing to the right slice?
3. Is there a race condition?
4. Is persistence working (if applicable)?

Show me:
1. How to add console.logs to trace state changes
2. How to verify the database is in sync
3. The fix once we identify the issue
```

---

## Quick Reference Prompts

### Before Starting Any Feature

```
Before I implement [FEATURE], help me verify:

1. What phase is this feature? (P0/P1/P2/P3)
2. Does it respect privacy? (no network, encrypted if sensitive)
3. Does the UX follow compassionate design principles?
4. What's the simplest implementation?
5. Are there accessibility requirements?

If any of these raise concerns, let me know before I start coding.
```

### Code Review Request

```
Please review this code for Recovery Companion:

[PASTE CODE]

Check for:
1. TypeScript strict mode compliance (no 'any')
2. NativeWind styling (not StyleSheet)
3. Zustand patterns (selector-based subscription)
4. Encryption of sensitive data
5. Accessibility labels on interactive elements
6. Error handling with user-friendly messages
7. Compassionate copy (no shame language)
8. Privacy compliance (no network calls)

For each issue, show me the fix.
```

### Quick Accessibility Fix

```
Add accessibility to this component:

[PASTE COMPONENT CODE]

Add:
- accessibilityLabel to all interactive elements
- accessibilityRole as appropriate
- accessibilityHint for non-obvious actions
- accessibilityState for stateful elements
- accessible={true} for semantic grouping

Return the complete updated component.
```

---

## Emergency Prompts

### Something's Broken in Production

```
🚨 URGENT: [DESCRIPTION OF ISSUE]

This is affecting users. Help me:
1. Understand what's happening
2. Find a quick fix or workaround
3. Roll back if necessary

Information:
- Error message: [IF ANY]
- Affected screen: [SCREEN]
- Steps to reproduce: [STEPS]

Prioritize:
1. User safety (can they access emergency resources?)
2. Data safety (is their data at risk?)
3. Functionality (can they use the app?)

Give me the fastest path to resolution.
```

### Data Recovery

```
A user needs to recover data: [SITUATION]

Options to explore:
1. Can we recover from local backup?
2. Is the encryption key still in SecureStore?
3. Is the SQLite file intact?
4. Can we export what's recoverable?

Remember: We don't have server backups (privacy-first).
All data is on-device only.

Help me guide the user through recovery options.
```

---

*Last Updated: December 2025*
*Document Version: 1.0*

