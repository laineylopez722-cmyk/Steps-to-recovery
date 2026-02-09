---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
inputDocuments: ['project-context.md', 'plan.txt', 'PROJECT_STATUS.md', 'domain-privacy-first-12-step-recovery-apps-research-2025-12-31.md']
workflowType: 'prd'
lastStep: 11
documentCounts:
  brief: 0
  research: 1
  projectDocs: 3
  context: 1
prdComplete: true
---

# Product Requirements Document - Steps to Recovery
## Phase 2: Journaling & Step Work Features

**Author:** laine
**Date:** 2025-12-31
**Status:** Complete
**Version:** 2.0

---

## Executive Summary

### Vision

Steps to Recovery is a **privacy-first, offline-first 12-step recovery companion** designed to support individuals in early recovery (Days 0-90) with a focus on the critical first 30 days. Unlike competitors that prioritize social features or monetization, our app embodies AA traditions while providing modern, evidence-based digital support.

### Strategic Positioning

**Market Opportunity:** $1.24-6.46B addiction recovery app market growing at 17-19% CAGR (2024-2033), **3x faster than traditional treatment**.

**Unmet Niche:** Privacy-first + comprehensive step work + AA tradition compliance
- **NO competitors combine:** Zero-knowledge encryption + full 12-step guidance without commercialization
- **12 Step Toolkit** (450k users) criticized for ads violating AA traditions
- **I Am Sober/Nomo** lack structured step work
- **Sober Grid's** geo-location conflicts with privacy

**Our Positioning:** *"More private than HIPAA apps, more complete than free apps, more ethical than commercial apps."*

**Revenue Model:** 100% free with voluntary donations (like AA's "passing the basket")
- All features always free, no paywalls
- Optional donations after milestones (7 days clean, Step 1 completion)
- Transparent about costs (~$50/month)
- Community-supported, AA Tradition 7 compliant

### Phase 2 Scope

**Target User:** Days 0-30 recovery phase (where 97% of users abandon apps)

**Core Problem:** New recovery members need daily structure, emergency support, and progress tracking—but are overwhelmed by complexity and distrust cloud-based privacy.

**Solution:** Simplified MVP focused on **5 core retention drivers**:
1. Frictionless onboarding with 30-second tutorial
2. Clean time tracker with milestone celebrations
3. Daily check-in ritual (morning intention + evening pulse check)
4. Encrypted journaling with mood/craving tracking
5. Emergency crisis support toolkit

**Strategic Deferrals (Phase 3+):**
- Full 12-step bank (all 804 questions across 12 steps)
- AI Sponsor chat
- Mood analytics dashboard
- Community/social features
- Points/rewards redemption

**Rationale:** Research shows Day 0-30 users need **simplicity + habits + crisis support**, not advanced features.

### Success Metrics

Phase 2 is successful if we achieve:

| Metric | Target | Industry Benchmark | Multiple |
|--------|--------|-------------------|----------|
| **Day 7 Retention** | ≥ 15% | 6.89% (iOS) | **2.2x** |
| **Day 30 Retention** | ≥ 8% | 3.10% (iOS) | **2.6x** |
| **Daily Check-In Rate** | ≥ 60% | N/A | N/A |
| **Crash Rate** | < 1% | Industry std | Standard |
| **Feature Satisfaction** | 4.5+/5.0 | N/A | N/A |

**Qualitative Success:**
- User feedback: "Most private recovery app I've used"
- User feedback: "Respects AA traditions"
- Zero privacy incidents

---

## 1. Product Context

### 1.1 Problem Statement

**User Pain Points (Validated):**

1. **Privacy Anxiety:**
   - Fear of sensitive data (journal entries, step work) being breached
   - Distrust of cloud-based apps after high-profile health data leaks
   - Need for anonymity in recovery journey

2. **Overwhelming Complexity:**
   - Existing apps overwhelm new users with 67 questions per step
   - Feature bloat drives 97% abandonment within 30 days
   - Days 0-30 users need simplicity, not comprehensive tools

3. **AA Tradition Conflicts:**
   - Ads and subscriptions in 12 Step Toolkit criticized as violating Tradition 7 (self-supporting)
   - Commercial recovery apps feel exploitative to users in crisis

4. **Crisis Moment Vulnerability:**
   - Cravings strike without warning
   - Need immediate, offline-accessible emergency tools
   - Sober Grid's "Burning Desire" button validates this need (top-rated feature)

5. **Lack of Structure:**
   - First 30 days are chaotic without meeting routines
   - Need daily rituals to replace substance use patterns
   - Missing: Morning intention setting + evening reflection loop

### 1.2 Target Users

**Primary Persona: "Early Recovery Sarah"**
- **Recovery Stage:** Days 0-30 clean/sober
- **Age:** 28-45
- **Tech Comfort:** Moderate (uses smartphone daily)
- **Recovery Program:** AA/NA member or considering 12-step
- **Pain Points:**
  - Anxiety about privacy (works in professional job)
  - Needs daily structure to replace drinking/using patterns
  - Fears cravings when alone or offline (no meeting access)
  - Wants step work guidance but feels overwhelmed by full workbook
- **Goals:**
  - Make it through today without using
  - Build daily sobriety routine
  - Track progress to see how far they've come
  - Have emergency support when triggered
- **Behaviors:**
  - Checks phone frequently throughout day
  - Attends 1-2 meetings per week (wants more structure on off-days)
  - Journals sporadically (when emotions are intense)
  - Hesitant to share details with sponsor yet (trust building)

**Secondary Persona: "Continuous Recovery Marcus"**
- **Recovery Stage:** 31-90 days (for Phase 3 validation)
- **Age:** 35-55
- **Tech Comfort:** High
- **Recovery Program:** Active AA/NA member with sponsor
- **Pain Points:**
  - Wants deeper step work but needs privacy
  - Looking for insights into triggers and patterns
  - Desires community but values anonymity
- **Goals:**
  - Complete all 12 steps with thorough reflection
  - Identify relapse warning signs through pattern analysis
  - Give back by sponsoring others (future)
- **Behaviors:**
  - Daily journaling routine established
  - Attends 3-5 meetings weekly
  - Actively working steps with sponsor
  - Uses app for private reflection between meetings

### 1.3 User Journey (Phase 2 Focus)

**Day 0-7: Crisis Stabilization**
- Install app → Onboarding (name + recovery date)
- Interactive tutorial → "Tap here for daily check-in", "Emergency button always accessible"
- First daily check-in → Morning intention: "Just for today..."
- Crisis moment → Emergency support: Crisis lines, breathing exercises, safety plan
- Evening reflection → Pulse check: "How was your day?" (mood slider)
- Milestone celebration → "24 Hours Clean" achievement

**Day 8-14: Habit Formation**
- Daily check-in streak → Notification: "You're on a 7-day streak!"
- First journal entry → Encrypted with unique IV (explain privacy)
- Explore Step 1 → "Admitted we were powerless..." (10-15 simplified questions)
- Emergency use → "Burning Desire" moment successfully navigated with breathing exercise

**Day 15-30: Progress & Reflection**
- Complete Step 1 → Badge awarded + reflection prompt
- Consistent journaling → Notice mood patterns emerging
- Milestone → "30 Days Clean" achievement (major celebration in UI)
- Consider Step 2 → Prompt to continue OR focus on journaling/check-ins

**Phase 3 Transition (Day 31+):**
- Unlock mood analytics dashboard
- Access full step work (Steps 2-12 with all questions)
- Connect with fellowship (contacts, sponsor)
- AI insights (optional)

### 1.4 Competitive Analysis

**Direct Competitors:**

| App | Privacy | Offline | Step Work | Cost | Weakness |
|-----|---------|---------|-----------|------|----------|
| **I Am Sober** | ❌ Cloud | ❌ | ❌ | Free+Premium | No encryption, no step work |
| **Nomo** | ✅ Private | ❌ | ❌ | Free | Simple journaling only, no step work |
| **Sober Grid** | ❌ Geo-social | ❌ | ❌ | $3.99/mo | Geo-location = privacy violation |
| **12 Step Toolkit** | ⚠️ Offline (2025) | ✅ | ✅ | Free+Ads | **Ads violate AA Tradition 7**, commercialized |
| **Steps to Recovery** | ✅✅ Zero-knowledge | ✅✅ SQLite | ✅✅ No ads | Free | **Unmet combination** |

**Competitive Advantages:**

1. **Privacy-First Architecture:**
   - AES-256-CBC encryption with unique IVs
   - PBKDF2 key derivation (100k iterations)
   - Zero-knowledge: Supabase sees encrypted blobs only
   - Offline-first: SQLite primary, cloud optional

2. **AA Tradition Compliance:**
   - No ads, no subscriptions (violates Tradition 7)
   - Free forever (12-step principles: freely give what was freely given)
   - No commercialization of recovery

3. **Evidence-Based Simplification:**
   - Step 1 only (10-15 questions vs. full 67)
   - Focus on Days 0-30 retention drivers
   - Daily check-in loop (habit formation)

4. **Emergency Support:**
   - Crisis toolkit accessible offline
   - Breathing exercises, safety plan
   - No reliance on community (when alone/ashamed)

---

## 2. Detailed Requirements

### 2.1 Functional Requirements

#### FR-1: Onboarding & Setup

**FR-1.1: Initial Onboarding Flow**
- **Priority:** P0 (must-have)
- **User Story:** As a new user, I want a simple onboarding so I can start using the app within 30 seconds.
- **Acceptance Criteria:**
  - Step 1: Nickname input (not required to be real name)
  - Step 2: Recovery start date (calendar picker with "Today" quick select)
  - Step 3: Privacy value props displayed:
    - "100% Private - Your data is encrypted"
    - "No sign-up required"
    - "Works offline"
  - Step 4: Interactive 30-second tutorial:
    - "Tap here for daily check-in" → Highlights check-in button
    - "Emergency button always accessible" → Shows emergency button
    - "Your journal is encrypted - even we can't read it" → Explains privacy
  - Total time: ≤ 60 seconds from install to home screen
  - Accessibility: WCAG AAA compliant (screen reader support, high contrast)

**FR-1.2: Encryption Key Generation**
- **Priority:** P0
- **User Story:** As a new user, my encryption key is automatically generated so my data is secure from the start.
- **Acceptance Criteria:**
  - On first launch, generate random 256-bit encryption key via expo-crypto
  - Derive key using PBKDF2 with random salt (100,000 iterations)
  - Store derived key in SecureStore (NEVER in SQLite/AsyncStorage)
  - Store salt in SecureStore for key recovery (if device remains same)
  - NO user password required (trade-off: lost device = lost data)

**FR-1.3: Data Loss Warning**
- **Priority:** P0
- **User Story:** As a new user, I understand that losing my device means losing my data so I can make an informed decision about cloud backup.
- **Acceptance Criteria:**
  - After onboarding, display modal:
    - Title: "About Your Privacy"
    - Body: "Your data is encrypted on your device. If you lose this device, your data cannot be recovered—not even by us. You can enable optional cloud backup later (also encrypted)."
    - Buttons: "I Understand" (dismisses), "Learn More" (links to privacy explainer)
  - User must acknowledge before accessing app

#### FR-2: Clean Time Tracker

**FR-2.1: Clean Time Display**
- **Priority:** P0
- **User Story:** As a user, I want to see my clean time prominently so I can track my progress.
- **Acceptance Criteria:**
  - Home screen displays:
    - "X Days Clean" (large, bold)
    - "X Hours, X Minutes" (smaller, below days)
    - Visual progress ring (circular, fills as day progresses)
  - Real-time updates (every minute)
  - Persists across app restarts
  - Accessible: Reads out "You have been clean for X days, Y hours, Z minutes"

**FR-2.2: Milestone Celebrations**
- **Priority:** P1
- **User Story:** As a user, I want to celebrate milestones so I feel accomplished and motivated.
- **Acceptance Criteria:**
  - Trigger celebrations at:
    - 24 hours (First Day)
    - 3 days
    - 7 days (One Week)
    - 14 days (Two Weeks)
    - 30 days (One Month)
    - 60 days (Two Months - Phase 3)
    - 90 days (Three Months - Phase 3)
  - Celebration UI:
    - Full-screen modal with achievement badge graphic
    - Confetti animation (subtle, not overwhelming)
    - Message: "You did it! X days clean. Keep going."
    - Share button (optional: generates shareable image WITHOUT identifying info)
  - Badge stored in achievements list

**FR-2.3: Clean Time Reset**
- **Priority:** P1
- **User Story:** As a user who relapsed, I want to reset my clean time with dignity so I can start again.
- **Acceptance Criteria:**
  - Settings → "Reset Clean Time"
  - Confirmation modal:
    - "Are you sure? Your progress will be saved as a milestone, but your counter will restart."
    - Buttons: "Cancel", "Reset" (destructive color, require long-press to confirm)
  - Previous clean time saved in "Milestones" history
  - New clean time starts from reset timestamp
  - NO shame/judgment language (e.g., avoid "failed" or "relapse" - neutral "reset")

#### FR-3: Daily Check-Ins

**FR-3.1: Morning Intention Setting**
- **Priority:** P0
- **User Story:** As a user, I want to set a morning intention so I start my day with purpose.
- **Acceptance Criteria:**
  - Check-in screen displays:
    - "Set the Tone" header
    - Prompt: "What's your intention for today?"
    - Freeform text input (optional, 500 char limit)
    - Quick-select intentions:
      - "Just for today, I won't use"
      - "I will attend a meeting"
      - "I will call my sponsor"
      - "I will journal my feelings"
      - Custom (user can type own)
  - Saved to SQLite (encrypted) with timestamp
  - Accessible via "Today's Intentions" on home screen
  - If user skips AM check-in, prompt appears on app open

**FR-3.2: Evening Pulse Check**
- **Priority:** P0
- **User Story:** As a user, I want to reflect on my day so I can track my emotional state.
- **Acceptance Criteria:**
  - Check-in screen displays:
    - "Pulse Check" header
    - Question: "How was your day?"
    - Mood slider: 1 (Very Difficult) → 5 (Great)
    - Craving intensity slider: 0 (None) → 10 (Intense)
    - Optional: "What helped/hurt today?" (freeform text, 500 char limit)
  - Saved to SQLite (encrypted) with timestamp
  - Data used for future mood analytics (Phase 3)
  - If user skips PM check-in, gentle notification next day: "How was yesterday?"

**FR-3.3: Check-In Streaks**
- **Priority:** P1
- **User Story:** As a user, I want to see my check-in streak so I'm motivated to maintain the habit.
- **Acceptance Criteria:**
  - Home screen displays: "X-Day Check-In Streak"
  - Visual: Flame emoji or streak icon (grows larger as streak increases)
  - Breaks if user misses a full day (no AM or PM check-in)
  - Notification if streak at risk: "Don't break your 7-day streak! Check in before midnight."

#### FR-4: Emergency Support

**FR-4.1: Emergency Button Accessibility**
- **Priority:** P0
- **User Story:** As a user experiencing a craving, I want immediate access to crisis tools so I can get help fast.
- **Acceptance Criteria:**
  - Emergency button visible on ALL screens (persistent bottom bar OR floating action button)
  - Color: Red with "SOS" or "Emergency" label
  - Tap to open Emergency Support screen (no confirmation needed)
  - Works offline (all resources local)
  - Accessible: Voice command "Emergency help" activates

**FR-4.2: Crisis Resources**
- **Priority:** P0
- **User Story:** As a user in crisis, I want to access immediate support so I don't relapse.
- **Acceptance Criteria:**
  - Emergency screen displays:
    - **Crisis Lines** (tap-to-call):
      - SAMHSA National Helpline: 1-800-662-4357
      - 988 Suicide & Crisis Lifeline: 988
      - User can add personal sponsor/emergency contact
    - **Breathing Exercises** (interactive):
      - "Box Breathing" (4-4-4-4 pattern with visual guide)
      - "4-7-8 Breathing" (calming exercise)
    - **Safety Plan** (user-created, editable):
      - "My triggers: ____"
      - "People I can call: ____"
      - "Safe places I can go: ____"
    - **Recovery Scenes** (calming images/videos - local assets):
      - Nature scenes
      - Meditation visuals
  - All resources work offline
  - Usage logged (anonymized) to detect crisis patterns (Phase 3 analytics)

**FR-4.3: Quick Escape Button**
- **Priority:** P1
- **User Story:** As a user who needs privacy, I want to quickly exit the app if someone approaches.
- **Acceptance Criteria:**
  - Shake phone OR triple-tap screen → Immediately exits to home screen
  - Requires re-authentication (PIN/biometric) to re-enter app (security)
  - Preference: Optional in Settings (disabled by default)

#### FR-5: Encrypted Journaling

**FR-5.1: Journal Entry Creation**
- **Priority:** P0
- **User Story:** As a user, I want to journal my thoughts privately so I can process emotions safely.
- **Acceptance Criteria:**
  - Journal screen displays:
    - "New Entry" button (prominent)
    - Entry editor:
      - Title field (optional, 100 char limit)
      - Body field (rich text, NO char limit but warn at 10k chars for performance)
      - Mood slider (1-5: Very Difficult → Great)
      - Craving intensity slider (0-10: None → Intense)
      - Trigger tags (optional, user-created): e.g., "Stress", "Loneliness", "Anger"
      - Save button (encrypts + stores in SQLite)
  - Encryption:
    - Use `encryptContent()` from utils/encryption.ts
    - Each entry generates unique IV (prevents pattern analysis)
    - Encrypted body + metadata stored in journal_entries table
  - Auto-save draft every 30 seconds (encrypted)
  - Accessible: Voice-to-text input supported

**FR-5.2: Journal Entry Viewing**
- **Priority:** P0
- **User Story:** As a user, I want to read past journal entries so I can reflect on my progress.
- **Acceptance Criteria:**
  - Journal list screen displays:
    - Entries sorted by date (newest first)
    - Entry card shows:
      - Date/time
      - Title (or first 50 chars of body if no title)
      - Mood emoji (derived from mood slider)
      - Craving intensity indicator (color-coded: green=low, red=high)
    - Search bar (searches decrypted content locally, NEVER sent to server)
    - Filter by:
      - Date range
      - Mood
      - Trigger tags
  - Tap entry → Opens decrypted entry in read-only view
  - Edit button → Switches to edit mode
  - Delete button → Confirms with "Are you sure? This cannot be undone."

**FR-5.3: Journal Privacy Indicators**
- **Priority:** P1
- **User Story:** As a user, I want to know my journal is encrypted so I trust the app.
- **Acceptance Criteria:**
  - Lock icon displayed on journal screen with tooltip: "Encrypted - only you can read this"
  - First journal entry shows modal:
    - Title: "Your Journal is Private"
    - Body: "Every entry is encrypted before saving. Not even we can read your journal."
    - Button: "Got it"

#### FR-6: Step Work (Simplified for Phase 2)

**FR-6.1: Step 1 Introduction**
- **Priority:** P1
- **User Story:** As a new user, I want guidance on Step 1 so I can begin my recovery work.
- **Acceptance Criteria:**
  - Step Work tab displays:
    - **Step 1 card:**
      - Title: "Step 1: We admitted we were powerless..."
      - Description: "This step is about accepting your addiction."
      - Progress: "0/15 questions answered"
      - "Start Step 1" button
    - Steps 2-12 shown as locked (with "Coming in Phase 3" label)
  - Tap "Start Step 1" → Opens Step 1 questionnaire

**FR-6.2: Step 1 Questionnaire (10-15 Simplified Questions)**
- **Priority:** P1
- **User Story:** As a user working Step 1, I want manageable questions so I'm not overwhelmed.
- **Acceptance Criteria:**
  - Questions (example set - curate with recovery expert):
    1. "When did you first realize your substance use was a problem?"
    2. "What attempts have you made to control your using? What happened?"
    3. "Describe a time when your substance use affected your relationships."
    4. "How has addiction impacted your work or school?"
    5. "What consequences have you faced due to your addiction?"
    6. "In what ways has your life become unmanageable?"
    7. "What does 'powerlessness' mean to you?"
    8. "List situations where you felt powerless over your addiction."
    9. "What are you willing to do to stay clean/sober today?"
    10. "How do you feel about admitting you need help?"
    11-15: (Additional reflective prompts - TBD with recovery expert)
  - Question screen:
    - Question text (large, readable)
    - Freeform text area (10k char limit)
    - Navigation: "Previous", "Next", "Save & Exit"
    - Progress indicator: "Question 3 of 15"
  - Responses encrypted + stored in step_work table
  - User can skip questions (mark as "Incomplete")
  - Completion: "You've completed Step 1! Reflect on your answers with your sponsor."

**FR-6.3: Step Work Review**
- **Priority:** P2
- **User Story:** As a user, I want to review my Step 1 answers so I can discuss them with my sponsor.
- **Acceptance Criteria:**
  - Step 1 review screen displays:
    - All 15 questions with user's encrypted answers (decrypted for display)
    - Edit button (user can revise answers)
    - Export button → Generates PDF (encrypted, can share with sponsor)
  - Accessible: Voice readout of questions/answers

#### FR-7: Achievements & Gamification (Simplified)

**FR-7.1: Basic Achievement System**
- **Priority:** P1
- **User Story:** As a user, I want to earn achievements so I feel rewarded for progress.
- **Acceptance Criteria:**
  - Achievements (Phase 2 scope):
    - **Clean Time:**
      - First 24 Hours
      - 3 Days
      - One Week
      - Two Weeks
      - 30 Days
    - **Engagement:**
      - First Journal Entry
      - 7-Day Check-In Streak
      - 30-Day Check-In Streak
    - **Step Work:**
      - Step 1 Started
      - Step 1 Completed
  - Achievement modal displays when earned:
    - Badge graphic
    - Name: "One Week Clean"
    - Description: "You've made it through your first week. Keep going!"
    - Confetti animation
  - Achievement list viewable in Settings → Achievements
  - NO points/redemption system (deferred to Phase 3)

#### FR-8: Push Notifications (User-Controlled)

**FR-8.1: Notification Preferences**
- **Priority:** P1
- **User Story:** As a user, I want to control when I receive notifications so they're helpful, not annoying.
- **Acceptance Criteria:**
  - Settings → Notifications:
    - Toggle: "Enable Notifications" (default: ON)
    - **Morning Check-In Reminder:**
      - Toggle (default: ON)
      - Time picker (default: 8:00 AM)
    - **Evening Check-In Reminder:**
      - Toggle (default: ON)
      - Time picker (default: 8:00 PM)
    - **Milestone Reminders:**
      - Toggle (default: ON)
      - Example: "Tomorrow you'll hit 7 days clean!"
    - **Streak Protection:**
      - Toggle (default: ON)
      - Example: "Don't break your 7-day streak! Check in before midnight."
  - All times respect user's local timezone

**FR-8.2: Notification Content**
- **Priority:** P1
- **User Story:** As a user, I want motivational notifications so I stay engaged.
- **Acceptance Criteria:**
  - Notification text examples:
    - Morning: "Good morning! Set your intention for today."
    - Evening: "How was your day? Take a moment to reflect."
    - Milestone: "Tomorrow is your 7-day milestone! You've got this."
    - Streak: "Your 14-day check-in streak ends tonight. Keep it going!"
  - NO generic spam (e.g., "Open the app!")
  - Privacy: NO sensitive data in notifications (only motivational prompts)

#### FR-9: Offline-First Sync

**FR-9.1: Local-First Architecture**
- **Priority:** P0
- **User Story:** As a user, I want all features to work offline so I can use the app anywhere.
- **Acceptance Criteria:**
  - SQLite is primary data store (NOT Supabase)
  - All features functional without internet:
    - Onboarding
    - Clean time tracking
    - Daily check-ins
    - Journaling
    - Emergency support
    - Step work
  - Supabase is backup/sync only (user must explicitly enable)

**FR-9.2: Optional Cloud Backup**
- **Priority:** P1
- **User Story:** As a user, I want to back up my encrypted data so I don't lose it if my device is lost.
- **Acceptance Criteria:**
  - Settings → Cloud Backup:
    - Toggle: "Enable Cloud Backup" (default: OFF)
    - Warning: "Your data is encrypted before uploading. We cannot decrypt it."
    - **Manual sync only** (NO automatic background sync for privacy)
    - "Sync Now" button:
      - Encrypts all SQLite records
      - Uploads to Supabase (uses user_id from auth context)
      - Displays progress: "Syncing 47 journal entries..."
      - Success: "Last synced: 2025-12-31 3:45 PM"
    - "Restore from Cloud" button:
      - Downloads encrypted records from Supabase
      - Decrypts using device's encryption key
      - Merges with local SQLite (conflict resolution: last-write-wins for MVP)

**FR-9.3: Sync Status Indicators**
- **Priority:** P2
- **User Story:** As a user, I want to know my sync status so I trust my data is backed up.
- **Acceptance Criteria:**
  - Home screen displays sync status icon:
    - ✅ Green checkmark: "Synced 5 minutes ago"
    - ⏳ Yellow clock: "Sync pending (3 unsynced entries)"
    - ❌ Red X: "Sync failed (check internet connection)"
  - Tap icon → Opens Cloud Backup settings

### 2.2 Non-Functional Requirements

#### NFR-1: Performance

**NFR-1.1: App Launch Time**
- **Requirement:** Cold start ≤ 2 seconds on mid-tier devices (2023 Android/iOS)
- **Measurement:** Time from app icon tap to home screen fully rendered
- **Rationale:** Critical for emergency access during cravings

**NFR-1.2: Journal Entry Load Time**
- **Requirement:** Decryption + rendering ≤ 500ms per entry
- **Measurement:** Time from tap on journal entry to full content display
- **Rationale:** Encryption overhead must not degrade UX

**NFR-1.3: Database Query Performance**
- **Requirement:** List 100 journal entries ≤ 1 second
- **Measurement:** SQLite query + decryption loop
- **Rationale:** Users with months of data need fast access

**NFR-1.4: Encryption Performance**
- **Requirement:** Encrypt 10KB journal entry ≤ 200ms
- **Measurement:** `encryptContent()` function execution time
- **Rationale:** Real-time journaling requires instant saves

#### NFR-2: Security

**NFR-2.1: Encryption Standards**
- **Requirement:** AES-256-CBC with unique IV per record
- **Validation:** NIST-compliant implementation (expo-crypto + crypto-js)
- **Threat Model:** Protects against Supabase breach, device theft (if locked), SQL injection

**NFR-2.2: Key Management**
- **Requirement:** Encryption keys stored ONLY in SecureStore
- **Validation:** Audit code - NO keys in SQLite, AsyncStorage, Supabase
- **Threat Model:** Prevents key exposure via backup extraction

**NFR-2.3: PBKDF2 Key Derivation**
- **Requirement:** 100,000 iterations minimum
- **Validation:** Code review of `generateEncryptionKey()` function
- **Threat Model:** Prevents brute-force attacks on derived keys

**NFR-2.4: RLS Policies (Supabase)**
- **Requirement:** ALL user data tables enforce `user_id = auth.uid()` policy
- **Validation:** Test queries from different user contexts
- **Threat Model:** Prevents horizontal privilege escalation

**NFR-2.5: Data Sanitization in Logs**
- **Requirement:** NO sensitive data (journal content, step work, keys, tokens) in console logs
- **Validation:** Production log audit
- **Threat Model:** Prevents data leaks via crash reports/analytics

#### NFR-3: Accessibility

**NFR-3.1: WCAG AAA Compliance**
- **Requirement:** All components meet WCAG AAA standards
- **Validation:** Automated testing with axe-DevTools + manual screen reader testing
- **Requirements:**
  - Text contrast ratio ≥ 7:1
  - Touch targets ≥ 44x44 dp
  - Screen reader labels on ALL interactive elements
  - Keyboard navigation support (for Android TV/tablets)

**NFR-3.2: Screen Reader Support**
- **Requirement:** All features usable via TalkBack (Android) / VoiceOver (iOS)
- **Validation:** Manual testing with screen reader enabled
- **Examples:**
  - Clean time counter reads out: "You have been clean for 7 days, 3 hours, 12 minutes"
  - Journal entry reads: "Journal entry from December 25th, mood: good, craving intensity: low"

**NFR-3.3: Font Scaling**
- **Requirement:** UI remains functional at 200% font size
- **Validation:** Test with device accessibility settings at max
- **Rationale:** Users with vision impairments need larger text

#### NFR-4: Privacy

**NFR-4.1: Zero-Knowledge Architecture**
- **Requirement:** Backend (Supabase) sees ONLY encrypted blobs (no plaintext)
- **Validation:** Database audit - all sensitive columns store encrypted strings
- **Threat Model:** Supabase breach exposes NO readable data

**NFR-4.2: No Third-Party Analytics**
- **Requirement:** NO data sent to third-party services (Google Analytics, Sentry, etc.) in Phase 2
- **Validation:** Network traffic audit with proxy (Charles/Wireshark)
- **Rationale:** Privacy-first positioning requires zero external data sharing

**NFR-4.3: Minimal Metadata Collection**
- **Requirement:** Collect ONLY:
  - Nickname (user-provided, not verified)
  - Recovery start date
  - Device encryption key (local only, never transmitted)
- **Validation:** Database schema review
- **Rationale:** Data minimization reduces breach impact

**NFR-4.4: Offline-First Default**
- **Requirement:** App fully functional without internet connection
- **Validation:** Test in airplane mode
- **Rationale:** Privacy means users control when data leaves device

#### NFR-5: Reliability

**NFR-5.1: Crash Rate**
- **Requirement:** < 1% crash rate (industry standard)
- **Measurement:** Crashes per 1000 sessions (EAS Update + manual testing)
- **Rationale:** Emergency features must be reliable in crisis

**NFR-5.2: Data Integrity**
- **Requirement:** Zero data loss during encryption/decryption
- **Validation:** Fuzz testing with random inputs
- **Rationale:** Losing journal entries destroys user trust

**NFR-5.3: Sync Conflict Resolution**
- **Requirement:** Last-write-wins for MVP (no manual conflict resolution)
- **Validation:** Test simultaneous edits on multiple devices
- **Rationale:** Edge case, defer complex resolution to Phase 3

#### NFR-6: Compatibility

**NFR-6.1: Device Support**
- **Requirement:** iOS 13+ and Android 8.0+ (96% of active devices)
- **Validation:** Test on target devices + Expo Go
- **Rationale:** Balances modern APIs with market coverage

**NFR-6.2: Screen Sizes**
- **Requirement:** Support 4.7" (iPhone SE) to 6.7" (iPhone Pro Max) + tablets
- **Validation:** Test responsive layouts at min/max breakpoints
- **Rationale:** Recovery users span all device types

**NFR-6.3: React Native Version**
- **Requirement:** React Native 0.81.5 (Expo SDK 54)
- **Risk:** React 19.1 is bleeding edge (potential stability issues)
- **Mitigation:** Monitor for crashes, rollback plan to React 18 if needed

---

## 3. User Interface & Experience

### 3.1 Navigation Structure

**Bottom Tab Navigation (Primary):**
1. **Home** (default tab)
   - Clean time tracker (hero element)
   - Daily check-in buttons (AM/PM)
   - Today's intentions summary
   - Quick actions: "Journal", "Emergency", "Step Work"

2. **Journal**
   - List of entries (newest first)
   - Search + filter bar
   - "New Entry" FAB (floating action button)

3. **Steps** (Step Work tab)
   - Step 1 card (in-progress or completed)
   - Steps 2-12 locked with "Phase 3" label

4. **More** (Settings/Profile)
   - Achievements
   - Cloud Backup settings
   - Notification preferences
   - Privacy Policy
   - About

**Persistent UI Elements:**
- **Emergency Button:** Red SOS button in bottom-right corner (above tab bar)
- **Sync Status Icon:** Top-right corner of home screen

### 3.2 Design Principles

**1. Privacy Reassurance:**
- Lock icons on encrypted content
- "Offline Mode" indicator when no internet
- Clear messaging: "Your data is encrypted"

**2. Calming Aesthetics:**
- Color palette: Soft blues/greens (avoid red except for emergency)
- Generous whitespace (reduce cognitive load)
- Rounded corners (friendlier than sharp edges)
- Dark mode support (OLED-friendly for nighttime journaling)

**3. Accessibility-First:**
- ALL buttons ≥ 44x44 dp
- Color is NEVER the only indicator (use icons + text)
- Focus indicators visible for keyboard navigation

**4. Motivational but Not Pushy:**
- Celebrate milestones (confetti animations)
- Avoid guilt (no "You missed a check-in" shaming)
- Neutral language for resets (no "relapse" or "failure")

### 3.3 Wireframes (Key Screens)

**Screen 1: Onboarding**
```
┌─────────────────────────────┐
│      Welcome to             │
│   Steps to Recovery         │
│                             │
│ [Illustration: Lock + Heart]│
│                             │
│  100% Private               │
│  No sign-up required        │
│  Works offline              │
│                             │
│ What should we call you?    │
│ ┌─────────────────────────┐ │
│ │ Nickname (optional)     │ │
│ └─────────────────────────┘ │
│                             │
│ When did you get clean?     │
│ ┌─────────────────────────┐ │
│ │ 📅 Select Date          │ │
│ └─────────────────────────┘ │
│                             │
│        [Next →]             │
└─────────────────────────────┘
```

**Screen 2: Home Screen**
```
┌─────────────────────────────┐
│ ☁️ Last synced: 5 min ago  │
│                             │
│ ╔═══════════════════════╗   │
│ ║    7 Days Clean       ║   │
│ ║                       ║   │
│ ║   [Circular Progress] ║   │
│ ║   3 hours, 12 minutes ║   │
│ ╚═══════════════════════╝   │
│                             │
│ Today's Intention:          │
│ "Just for today, I won't    │
│  use. I will attend a       │
│  meeting."                  │
│                             │
│ ┌──────────┐ ┌───────────┐ │
│ │ ☀️ Set the│ │ 🌙 Pulse  │ │
│ │   Tone   │ │   Check   │ │
│ └──────────┘ └───────────┘ │
│                             │
│ Quick Actions:              │
│ [📝 Journal] [📖 Steps]    │
│                             │
│                         [🆘]│
├─────────────────────────────┤
│ [Home] [Journal] [Steps] […]│
└─────────────────────────────┘
```

**Screen 3: Emergency Support**
```
┌─────────────────────────────┐
│         Emergency           │
│         Support             │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🚨 Crisis Lines         │ │
│ │                         │ │
│ │ SAMHSA: 1-800-662-4357 │ │
│ │ 988 Lifeline           │ │
│ │ [Add Personal Contact] │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🫁 Breathing Exercises  │ │
│ │                         │ │
│ │ Box Breathing (4-4-4-4)│ │
│ │ 4-7-8 Technique        │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📋 My Safety Plan       │ │
│ │                         │ │
│ │ Triggers: ________     │ │
│ │ People to call: ___    │ │
│ │ Safe places: _______   │ │
│ └─────────────────────────┘ │
│                             │
│          [Close]            │
└─────────────────────────────┘
```

**Screen 4: Journal Entry**
```
┌─────────────────────────────┐
│ 🔒 Encrypted               │
│                             │
│ Title (optional)            │
│ ┌─────────────────────────┐ │
│ │ A difficult day...      │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ I had cravings today    │ │
│ │ when I drove past the   │ │
│ │ old bar. But I called   │ │
│ │ my sponsor and went to  │ │
│ │ a meeting instead...    │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ How was your mood?          │
│ 😞──😐──😊──😁──🤩         │
│     ↑                       │
│                             │
│ Craving intensity?          │
│ 0─2─4─6─8─10                │
│       ↑                     │
│                             │
│ Tags: [Stress] [+Add Tag]  │
│                             │
│         [Save]              │
└─────────────────────────────┘
```

---

## 4. Technical Architecture

### 4.1 Technology Stack

**Core Framework:**
- Expo SDK 54.0.30 (New Architecture enabled)
- React 19.1.0
- React Native 0.81.5
- TypeScript 5.3.0+ (strict mode enforced)
- Node.js ≥ 20.0.0

**State Management:**
- @tanstack/react-query 5.90.15 (server state)
- Zustand 5.0.9 (client state)
- React Context API (Auth, Database, Sync)

**Backend & Storage:**
- @supabase/supabase-js 2.89.0+ (optional cloud backup)
- expo-sqlite 16.0.10 (primary local storage)
- expo-secure-store 15.0.8 (encryption keys & tokens ONLY)
- @react-native-async-storage/async-storage 2.2.0 (non-sensitive preferences)

**Security & Encryption:**
- expo-crypto 15.0.8 + crypto-js 4.2.0 (AES-256-CBC)
- buffer 5.7.1

**Navigation:**
- @react-navigation/native 7.1.26
- @react-navigation/bottom-tabs 7.9.0

**UI:**
- react-native-paper 5.14.5 (Material Design)

### 4.2 Data Models

**SQLite Schema:**

```sql
-- Users Table (local only, NOT synced)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  nickname TEXT,
  clean_date TEXT NOT NULL, -- ISO 8601
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Journal Entries Table
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  encrypted_title TEXT, -- AES-256-CBC encrypted
  encrypted_body TEXT NOT NULL, -- AES-256-CBC encrypted
  encrypted_mood INTEGER, -- 1-5 (encrypted)
  encrypted_craving INTEGER, -- 0-10 (encrypted)
  encrypted_tags TEXT, -- JSON array (encrypted)
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT DEFAULT 'pending', -- 'pending' | 'synced' | 'error'
  supabase_id TEXT, -- NULL if not synced
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Daily Check-ins Table
CREATE TABLE daily_checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  check_in_type TEXT NOT NULL, -- 'morning' | 'evening'
  encrypted_intention TEXT, -- Morning intention (encrypted)
  encrypted_reflection TEXT, -- Evening reflection (encrypted)
  encrypted_mood INTEGER, -- 1-5 (encrypted)
  encrypted_craving INTEGER, -- 0-10 (encrypted)
  created_at TEXT NOT NULL,
  sync_status TEXT DEFAULT 'pending',
  supabase_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Step Work Table
CREATE TABLE step_work (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  step_number INTEGER NOT NULL, -- 1-12
  question_number INTEGER NOT NULL, -- 1-67 (or 1-15 for Phase 2)
  encrypted_answer TEXT, -- AES-256-CBC encrypted
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT DEFAULT 'pending',
  supabase_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, step_number, question_number)
);

-- Achievements Table
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_type TEXT NOT NULL, -- 'milestone' | 'engagement' | 'step_work'
  achievement_key TEXT NOT NULL, -- 'first_24_hours', 'one_week', etc.
  earned_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, achievement_key)
);

-- Sync Queue Table (manages offline changes)
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'insert' | 'update' | 'delete'
  encrypted_payload TEXT NOT NULL, -- JSON (encrypted)
  created_at TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT
);
```

**Supabase Tables (Mirror of SQLite, RLS Protected):**

```sql
-- Supabase: journal_entries (RLS enforced)
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  encrypted_title TEXT,
  encrypted_body TEXT NOT NULL,
  encrypted_mood TEXT, -- Encrypted integer as string
  encrypted_craving TEXT,
  encrypted_tags TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_id TEXT UNIQUE -- Maps to SQLite id
);

-- RLS Policy
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own journal entries"
  ON journal_entries FOR ALL
  USING (auth.uid() = user_id);

-- Similar structure for daily_checkins, step_work, achievements
```

### 4.3 Encryption Flow

**Encryption (Write Path):**
1. User enters journal entry text
2. App calls `encryptContent(plaintext)` from `utils/encryption.ts`
3. Function:
   - Retrieves encryption key from SecureStore
   - Generates random 16-byte IV via expo-crypto
   - Encrypts plaintext using AES-256-CBC (crypto-js)
   - Returns `${iv}:${ciphertext}` string
4. Encrypted string stored in SQLite
5. If sync enabled, encrypted string uploaded to Supabase

**Decryption (Read Path):**
1. User opens journal entry
2. App retrieves `${iv}:${ciphertext}` from SQLite
3. App calls `decryptContent(encrypted)` from `utils/encryption.ts`
4. Function:
   - Retrieves encryption key from SecureStore
   - Splits `${iv}:${ciphertext}` string
   - Decrypts ciphertext using AES-256-CBC + IV
   - Returns plaintext
5. Plaintext displayed in UI

**Key Management:**
- Encryption key generated ONCE on first app launch
- Stored in SecureStore (iOS Keychain / Android KeyStore)
- NEVER transmitted to Supabase
- Lost device = lost data (trade-off for true privacy)

### 4.4 Sync Strategy (Offline-First)

**Design Principle:** SQLite is source of truth, Supabase is backup.

**Sync Flow:**
1. User enables Cloud Backup in Settings
2. User taps "Sync Now"
3. App queries sync_queue table for pending operations
4. For each pending record:
   - Encrypt record (already encrypted in SQLite)
   - POST to Supabase via REST API
   - Update sync_status to 'synced'
   - Store supabase_id for future updates
5. Display sync success/failure

**Conflict Resolution (Last-Write-Wins for MVP):**
- If record exists in Supabase with same client_id:
  - Compare updated_at timestamps
  - Overwrite with newer version
  - Log conflict (for Phase 3 manual resolution)

**Future Improvement (Phase 3):**
- Operational Transform (OT) for real-time collaboration (if sponsee shares step work with sponsor)
- CRDTs for conflict-free merges

### 4.5 Security Considerations

**Threat Model:**

| Threat | Mitigation | Priority |
|--------|-----------|----------|
| Supabase breach | Client-side encryption (zero-knowledge) | P0 |
| Device theft (unlocked) | Require biometric/PIN to open app (future) | P1 |
| Man-in-the-middle attack | TLS 1.3 for Supabase API calls | P0 |
| SQL injection | Parameterized queries (expo-sqlite) | P0 |
| Key extraction from backup | SecureStore excluded from backups | P0 |
| Logging sensitive data | Use `logger` util (sanitizes logs) | P0 |

**Security Checklist:**
- ✅ AES-256-CBC with unique IVs
- ✅ PBKDF2 key derivation (100k iterations)
- ✅ Keys in SecureStore ONLY
- ✅ RLS policies on all Supabase tables
- ✅ TLS 1.3 for network traffic
- ✅ No third-party analytics (no data exfiltration)
- ✅ Parameterized SQL queries

---

## 5. Development Roadmap

### 5.1 Phase 2 Implementation Plan

**Week 1: Core Infrastructure**
- Setup Expo project structure
- Implement encryption utilities (`utils/encryption.ts`, `utils/logger.ts`)
- Create SQLite schema + migrations
- Setup Supabase project + RLS policies
- Accessibility foundation (screen reader testing setup)

**Week 2: Onboarding & Home Screen**
- Onboarding flow (nickname, clean date, tutorial)
- Clean time tracker UI + logic
- Milestone celebrations (achievements system)
- Home screen layout
- Emergency button (persistent UI element)

**Week 3: Daily Check-Ins & Journaling**
- Morning intention (Set the Tone) screen
- Evening pulse check screen
- Check-in streaks logic
- Journal entry creation + encryption
- Journal list + viewing + search

**Week 4: Emergency Support & Step Work**
- Emergency support screen (crisis lines, breathing exercises)
- Safety plan creation/editing
- Step 1 questionnaire (10-15 questions)
- Step work progress tracking
- Step 1 review screen

**Week 5: Notifications & Gamification**
- Push notification setup (expo-notifications)
- Notification preferences UI
- Achievement badge system
- Milestone detection logic
- Confetti animations

**Week 6: Sync & Polish**
- Offline-first sync implementation
- Sync queue management
- Cloud backup settings
- Conflict resolution (last-write-wins)
- Performance optimization (encryption, SQLite queries)

**Week 7-8: Testing & Refinement**
- Unit tests (encryption, decryption, SQLite)
- Integration tests (sync flow, RLS policies)
- Accessibility testing (TalkBack, VoiceOver)
- User testing with 5-10 recovery community members
- Bug fixes + UX polish

### 5.2 Release Strategy

**Alpha (Internal Testing):**
- TestFlight (iOS) / Internal Testing (Android)
- 10 testers from recovery community
- Feedback focus: Privacy trust, usability, bugs
- 2-week test cycle

**Beta (Expanded Testing):**
- 50 testers from AA/NA meetings (recruited via flyers)
- Feedback focus: Retention metrics, feature usage, crash reports
- 4-week test cycle
- Iterate based on feedback

**Production Release:**
- App Store (iOS) + Google Play (Android)
- No monetization (free, no ads, no in-app purchases)
- Privacy policy published
- Community launch (AA/NA meetings, recovery forums)

### 5.3 Post-Launch Metrics

**Week 1-4 Monitoring:**
- Day 7 retention (target: ≥ 15%)
- Day 30 retention (target: ≥ 8%)
- Crash rate (target: < 1%)
- Daily check-in rate (target: ≥ 60%)
- Emergency button usage (indicates crisis prevention value)

**User Feedback Collection:**
- In-app feedback form (anonymous)
- App Store / Google Play reviews
- Direct feedback from recovery community

**Iteration Priorities:**
1. Fix critical bugs (crashes, data loss)
2. Address usability issues (friction points in UX)
3. Improve retention (refine onboarding, notifications)
4. Plan Phase 3 features based on usage data

---

## 6. Success Criteria

### 6.1 Quantitative Metrics

| Metric | Target | Industry Benchmark | Measurement Method |
|--------|--------|-------------------|-------------------|
| **Day 7 Retention** | ≥ 15% | 6.89% (iOS) | Analytics (expo-updates) |
| **Day 30 Retention** | ≥ 8% | 3.10% (iOS) | Analytics (expo-updates) |
| **Daily Check-In Rate** | ≥ 60% | N/A | Daily check-ins / active users |
| **Journal Entry Rate** | ≥ 40% | N/A | Users who create ≥1 entry/week |
| **Step 1 Completion** | ≥ 25% | N/A | Users who complete all 15 questions |
| **Crash Rate** | < 1% | Industry std | Crash reports / sessions |
| **App Store Rating** | ≥ 4.5/5.0 | N/A | iOS App Store + Google Play |

### 6.2 Qualitative Success

**User Testimonials (Target Themes):**
- "This is the most private recovery app I've used."
- "I love that it respects AA traditions (no ads)."
- "The emergency button saved me during a craving."
- "Daily check-ins helped me build a routine."
- "I trust my journal is encrypted."

**Community Adoption:**
- Featured in ≥3 recovery podcasts/blogs
- Recommended by ≥10 AA/NA groups
- Organic word-of-mouth growth (viral coefficient > 1.0)

### 6.3 Privacy & Security Success

**Zero Privacy Incidents:**
- No data breaches
- No user complaints about privacy violations
- No third-party data sharing (verified via audit)

**Voluntary Compliance:**
- Meets 42 CFR Part 2 standards (even if not legally required)
- Exceeds HIPAA encryption requirements
- GDPR-ready (for future international expansion)

---

## 7. Risks & Mitigation

### 7.1 Technical Risks

**Risk 1: React 19.1 Stability**
- **Likelihood:** Medium
- **Impact:** High (crashes, broken features)
- **Mitigation:**
  - Monitor crash reports closely in beta
  - Rollback plan to React 18 if crash rate > 2%
  - Test extensively on real devices (not just simulators)

**Risk 2: Encryption Performance Overhead**
- **Likelihood:** Low
- **Impact:** Medium (slow UX)
- **Mitigation:**
  - Benchmark encryption/decryption on low-end devices
  - Optimize: Batch encrypt for bulk operations (e.g., sync)
  - Consider native encryption module if crypto-js too slow (Phase 3)

**Risk 3: SQLite Data Loss**
- **Likelihood:** Low
- **Impact:** Critical (user loses all data)
- **Mitigation:**
  - Implement auto-export to device files (weekly backup)
  - Add "Export Data" feature (JSON file users can save externally)
  - Test SQLite corruption scenarios (power loss during write)

**Risk 4: Sync Conflicts**
- **Likelihood:** Medium (if user has multiple devices)
- **Impact:** Medium (data inconsistency)
- **Mitigation:**
  - Last-write-wins for MVP (simplest)
  - Display sync conflict warnings in UI
  - Defer complex CRDTs to Phase 3

### 7.2 User Adoption Risks

**Risk 1: Privacy Message Not Trusted**
- **Likelihood:** Medium
- **Impact:** High (low adoption)
- **Mitigation:**
  - Open-source encryption code (GitHub transparency)
  - Third-party security audit (publish results)
  - Clear privacy policy (plain language, not legalese)
  - Community endorsements (AA/NA group leaders)

**Risk 2: Overwhelming Complexity Despite Simplification**
- **Likelihood:** Low
- **Impact:** Medium (Day 7 retention < 15%)
- **Mitigation:**
  - User testing during beta (5-10 users)
  - Iterate onboarding based on feedback
  - A/B test tutorial length (30s vs 60s vs skip option)

**Risk 3: Low Daily Check-In Engagement**
- **Likelihood:** Medium
- **Impact:** Medium (fails habit formation goal)
- **Mitigation:**
  - Optimize notification timing (user testing)
  - Gamify check-ins (streak badges, confetti)
  - Make check-ins faster (1-tap for "I'm okay today")

### 7.3 Regulatory Risks

**Risk 1: FDA Classifies App as Medical Device**
- **Likelihood:** Low (personal tool, not diagnostic/therapeutic)
- **Impact:** Critical (requires FDA clearance)
- **Mitigation:**
  - Avoid medical claims ("diagnose", "treat", "cure")
  - Position as "personal recovery support tool"
  - Consult healthcare attorney if uncertain

**Risk 2: HIPAA Compliance Required (if partnering with treatment centers)**
- **Likelihood:** Low (Phase 2 has no partnerships)
- **Impact:** High (BAA requirements, audits)
- **Mitigation:**
  - Defer partnerships to Phase 3
  - If Phase 3 includes treatment center integration, obtain BAA + HIPAA compliance

**Risk 3: State Privacy Laws (CCPA, etc.)**
- **Likelihood:** Medium (if users in California)
- **Impact:** Medium (data deletion requests, privacy notices)
- **Mitigation:**
  - Include "Delete Account + All Data" feature
  - Privacy policy covers CCPA/GDPR rights
  - No data selling (so most regulations don't apply)

### 7.4 Competitive Risks

**Risk 1: 12 Step Toolkit Removes Ads (Eliminates Our Differentiation)**
- **Likelihood:** Low
- **Impact:** Medium
- **Mitigation:**
  - Our privacy-first architecture still differentiates
  - Focus on "zero-knowledge encryption" messaging
  - Build community loyalty through ethics (not just features)

**Risk 2: Large Player Enters Market (BetterHelp, Headspace)**
- **Likelihood:** Medium
- **Impact:** High (marketing budget advantage)
- **Mitigation:**
  - Niche focus (12-step specific, not general mental health)
  - Community-driven growth (AA/NA meetings, not ads)
  - Open-source model (transparency vs. corporate black box)

---

## 8. Appendices

### Appendix A: Research Sources

See: `_bmad-output/planning-artifacts/research/domain-privacy-first-12-step-recovery-apps-research-2025-12-31.md`

**Total Sources:** 40+ authoritative citations
- Market research: DataIntelo, Precedence Research, Grand View Research
- Competitive analysis: App Store/Google Play reviews, feature comparisons
- Regulatory: HHS.gov, 42 CFR Part 2 final rule, HIPAA guidelines
- Retention research: Pushwoosh, Localytics, Business of Apps

### Appendix B: User Personas (Detailed)

**Persona 1: Early Recovery Sarah**
- **Quote:** *"I need something private. I work in healthcare and can't risk anyone finding out I'm in recovery."*
- **Day in the life:** Wakes up anxious → Attends AA meeting → Works 9-5 → Evening cravings → Calls sponsor → Journals before bed
- **App usage:** Morning check-in during coffee → Emergency button during craving → Evening journaling ritual
- **Pain points:** Fear of judgment, need for anonymity, craving triggers at night (alone)
- **Goals:** Make it through 30 days without relapse

**Persona 2: Continuous Recovery Marcus**
- **Quote:** *"I've been clean 60 days. Now I want to dig deeper into my step work."*
- **Day in the life:** Morning meditation → Work → Lunch meeting → Evening sponsor call → Step work reflection
- **App usage:** Daily journaling → Step work questions → Mood tracking for patterns
- **Pain points:** Wants full 12-step guidance, needs privacy for vulnerable reflections
- **Goals:** Complete all 12 steps, understand relapse patterns, eventually sponsor others

### Appendix C: Glossary

**12-Step Program:** A set of guiding principles (AA, NA, etc.) for addiction recovery.

**AA Traditions:** 12 principles governing AA groups (e.g., Tradition 7: "Every AA group ought to be fully self-supporting, declining outside contributions").

**Clean Time:** Duration of continuous abstinence from substances.

**Craving:** Intense desire to use a substance.

**Powerlessness:** Core concept of Step 1 (admitting inability to control addiction).

**RLS (Row-Level Security):** Database security feature that restricts row access based on user identity.

**Sponsor:** Experienced member who guides a newcomer through the 12 steps.

**Step Work:** Written reflections answering questions for each of the 12 steps.

**Zero-Knowledge Architecture:** System where the server cannot decrypt user data (only client has keys).

### Appendix D: Open Questions (For Architecture Phase)

**Technical:**
1. Should we use SQLCipher (encrypted SQLite at rest) instead of application-layer encryption?
   - Trade-off: Better security vs. added complexity
2. Biometric authentication (Face ID/Touch ID) for app access?
   - Trade-off: Security vs. friction (users in crisis need fast access)
3. Expo Router vs. React Navigation?
   - Current plan: React Navigation (mature, well-documented)

**Product:**
1. Should "Reset Clean Time" save previous attempts as "Milestones"?
   - User feedback needed: Do users want history of past attempts?
2. Default notification timing: 8 AM / 8 PM or user-selected during onboarding?
   - A/B test in beta
3. Should we allow sharing journal entries with sponsors (encrypted, direct share)?
   - Privacy vs. utility trade-off

**UX:**
1. Dark mode as default or light mode?
   - Recovery community preference unknown - test in beta
2. Confetti animations: Subtle or celebratory?
   - A/B test milestone celebrations
3. Tutorial skippable or mandatory?
   - Research shows mandatory = higher retention, but annoying to some users

---

## 9. Revenue Model & Sustainability

### 9.1 Core Philosophy

**100% Free, Community-Supported**

Like AA meetings themselves, Steps to Recovery operates on voluntary contributions from those who find value in the app. Every feature—from onboarding to emergency support to full step work—is **free forever** with no paywalls, ads, or subscriptions.

**AA Tradition 7 Alignment:**
> "Every AA group ought to be fully self-supporting, declining outside contributions."

We interpret this as:
- ✅ Accept voluntary contributions **from users** (community members)
- ✅ Transparent about operational costs
- ✅ No outside corporate funding or advertising
- ✅ Self-supporting through member contributions, like passing the basket

### 9.2 Revenue Model

**Voluntary Donation System**

**How It Works:**
1. **All features always free** - No premium tiers, no locked features
2. **Optional donation prompt** appears after user reaches meaningful milestones:
   - After 7 days clean (user has experienced value)
   - After completing Step 1 (user is engaged)
   - In Settings → "Support This App" (always accessible, never intrusive)
3. **Transparent cost breakdown** shown to users:
   - "This app costs approximately $50/month to operate (server hosting, app store fees, development)"
   - "Your contribution helps keep this free for everyone"
   - "Suggested donation: $2.99/month or $19.99/year—but any amount helps"
4. **Easy to dismiss** - No guilt, no pressure, no repeated nags
   - "Not now" button prominent
   - Donation prompt shows max once per month
   - User can permanently dismiss ("Don't ask again")

**Donation Options:**
- **One-time donations:** $2.99, $4.99, $9.99, $19.99, Custom
- **Recurring (optional):** $2.99/month or $19.99/year
- **Payment methods:** In-app purchase (Apple/Google) OR external (Ko-fi, GitHub Sponsors for web users)

**Recognition (Optional):**
- Donors receive optional "Supporter" badge in Settings (private, not shown to others)
- No feature unlocks, no special treatment
- Recognition is symbolic, not functional

### 9.3 Transparency & Communication

**In-App Messaging:**

*"Steps to Recovery is free for everyone, forever. We don't sell ads, we don't sell your data, and we don't paywall recovery tools.*

*Like AA meetings, we're supported by voluntary contributions from members who find value here. If this app has helped you, please consider supporting it so we can help others.*

*Can't afford to donate? That's okay—the app will always be free. Recovery is priceless."*

**Annual Transparency Report:**
- Published yearly (in Settings → "About")
- Shows: Total costs, number of donations, how funds were used
- Example: "2025 costs: $600 (Supabase $300, App Store $99, Dev tools $201). Supported by 47 donors. Thank you."

### 9.4 Cost Breakdown (Estimated Annual)

**Operational Costs:**
- Supabase (Starter plan): $25/month × 12 = **$300/year**
- Apple Developer Program: **$99/year**
- Google Play Console: **$25 one-time** (negligible amortized)
- Domain (optional, if we build web version): **$12/year**
- Development tools (licenses, APIs): **~$200/year**

**Total: ~$636/year** (excluding developer time)

**Break-Even Target:**
- 22 annual donors at $29.99/year
- OR 18 monthly donors at $2.99/month
- OR mix of one-time + recurring donations

**Stretch Goal:**
- 100+ donors = Covers costs + funds new features
- 500+ donors = Can hire part-time support/development help
- 1,000+ donors = Self-sustaining, can sponsor free therapy/treatment for users in need

### 9.5 What Donations Fund

**Guaranteed (Covered by Donations):**
1. Server hosting (Supabase for encrypted cloud backup)
2. App Store distribution (Apple + Google fees)
3. Security audits (annual third-party review of encryption)
4. Bug fixes and maintenance
5. Keeping the app 100% free with no ads

**Stretch Goals (If Funding Allows):**
1. Professional design improvements (hire UX designer)
2. Accessibility audit + improvements (WCAG AAA compliance testing)
3. Translations (Spanish, French, etc. for international recovery community)
4. iOS + Android native optimizations (performance improvements)
5. Clinical research partnership (validate app effectiveness with peer-reviewed study)
6. Scholarship fund (sponsor therapy/treatment for users who can't afford it)

### 9.6 Donation Prompts (UX Design)

**After 7 Days Clean (Milestone Celebration):**
```
┌─────────────────────────────────┐
│  🎉 7 Days Clean!               │
│                                 │
│  You've made it through your    │
│  first week. We're proud of you.│
│                                 │
│  ────────────────────────────   │
│                                 │
│  This app is free for everyone, │
│  supported by donations from    │
│  members like you.              │
│                                 │
│  If it's helped you, consider   │
│  supporting it.                 │
│                                 │
│  [Support ($2.99)] [Not Now]    │
│                                 │
│  (Donations are optional and    │
│   the app will always be free)  │
└─────────────────────────────────┘
```

**In Settings → "Support This App":**
```
┌─────────────────────────────────┐
│  Support Steps to Recovery      │
│                                 │
│  🔒 No ads. No data selling.    │
│  📱 Free forever.               │
│  ❤️ Supported by you.           │
│                                 │
│  Monthly costs: ~$50            │
│  • Server hosting: $25          │
│  • App stores: $8               │
│  • Development: Your support    │
│                                 │
│  Suggested donation:            │
│  [💚 $2.99/month]               │
│  [💙 $19.99/year]               │
│  [🤍 One-time $9.99]            │
│  [Custom Amount]                │
│                                 │
│  "Can't donate? That's okay.    │
│   This app will always be free."│
│                                 │
│  [Learn More] [Close]           │
└─────────────────────────────────┘
```

### 9.7 Alternative Revenue Streams (Future Consideration)

**NOT PURSUED in Phase 2, but documented for Phase 3+ evaluation:**

1. **Grant Funding:**
   - Apply for SAMHSA, NIH, or recovery organization grants
   - Requires: Non-profit status, research data, clinical partnerships
   - **Pro:** Sustainable funding without user costs
   - **Con:** Time-consuming, competitive, uncertain

2. **White-Label Licensing (B2B):**
   - Free for individuals
   - Treatment centers pay $199-$499/month for branded version
   - **Pro:** Revenue from organizations, not vulnerable individuals
   - **Con:** Sales complexity, support burden, conflicts with open-source transparency

3. **Corporate Sponsorship (Ethical Partners Only):**
   - Recovery-focused organizations (not pharma, not Big Alcohol)
   - Example: Sober living homes, therapy practices
   - **Pro:** Larger donations
   - **Con:** Risk of appearing "bought" or violating AA traditions

4. **Book/Course Sales:**
   - Free app + optional paid workbook/course ($19.99)
   - Example: "30-Day Recovery Toolkit" digital guide
   - **Pro:** Value-add product, not app paywall
   - **Con:** Feels commercial, may erode trust

**Recommendation:** Stick with 100% free + voluntary donations for Phase 2 and Phase 3. Only explore alternatives if donation model fails to cover costs after 12 months.

### 9.8 Success Criteria (Financial Sustainability)

**Month 1-3 (Launch Period):**
- Target: 5-10 donors
- Goal: Cover 25% of monthly costs ($12.50+/month)
- Metric: Donation conversion rate ≥0.5% of active users

**Month 4-6 (Growth Period):**
- Target: 20-30 donors
- Goal: Cover 75% of monthly costs ($37.50+/month)
- Metric: Donation conversion rate ≥1% of active users

**Month 7-12 (Sustainability Period):**
- Target: 40-60 donors
- Goal: 100% cost coverage + modest development fund ($75+/month)
- Metric: Donation conversion rate ≥2% of active users

**Year 2+ (Thriving Period):**
- Target: 100+ donors
- Goal: Self-sustaining + fund feature development
- Metric: Annual budget surplus to fund stretch goals

**Contingency Plan:**
- If donation model fails after 12 months (< 25% cost coverage):
  1. Evaluate user feedback (why aren't people donating?)
  2. Improve donation UX (too hidden? too pushy?)
  3. Consider ethical premium tier (Phase 3 features only)
  4. As last resort: Apply for grant funding OR pause cloud sync (offline-only mode reduces costs to near-zero)

---

## 10. Approval & Sign-Off

**PRD Author:** laine
**Date:** 2025-12-31
**Status:** Complete - Ready for Architecture Phase

**Next Steps:**
1. Execute `create-architecture` workflow to design technical architecture
2. Execute `create-epics-and-stories` workflow to break down into implementation tasks
3. Execute `check-implementation-readiness` workflow to validate PRD + Architecture alignment
4. Begin Phase 2 implementation via `dev-story` workflow

**Stakeholder Review:**
- [ ] Product Owner (laine) - Approval pending
- [ ] Recovery Community Advisor - Feedback pending
- [ ] Privacy/Security Reviewer - Audit pending

---

**Document Version History:**
- v1.0 (2025-12-31): Initial draft (Step 1 of PRD workflow)
- v2.0 (2025-12-31): Complete PRD with research integration (Steps 2-11 completed)
