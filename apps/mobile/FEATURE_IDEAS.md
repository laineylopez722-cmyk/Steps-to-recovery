# Steps to Recovery - Feature Ideas

> A comprehensive list of proposed features for future development.  
> All features maintain the app's core principles: **privacy-first**, **offline-first**, **encryption-first**.

---

## Table of Contents

1. [Step-Specific Unlockable Tools](#1-step-specific-unlockable-tools)
2. [Somatic & Hardware-Based Tools](#2-somatic--hardware-based-tools)
3. [Connection & Community Features](#3-connection--community-features)
4. [Visualization & Gamification](#4-visualization--gamification)
5. [Cognitive & Journaling Tools](#5-cognitive--journaling-tools)
6. [Privacy & Safety Features](#6-privacy--safety-features)
7. [Notifications & Engagement](#7-notifications--engagement)
8. [Accessibility & Inclusivity](#8-accessibility--inclusivity)
9. [Recovery Program Tools](#9-recovery-program-tools)

---

## 1. Step-Specific Unlockable Tools

### The Key Ceremony (Sponsor Unlock Mechanism)

**Description:** Tools for each step are locked until the sponsor approves. Creates a meaningful ritual for step completion.

**How It Works:**
1. User completes step work in the app
2. User requests sponsor review
3. Sponsor scans a QR code on user's phone OR enters a unique 6-digit code
4. Tool unlocks with a celebratory animation

**Database Schema:**
```sql
CREATE TABLE step_approvals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sponsor_connection_id TEXT NOT NULL,
  step_number INTEGER NOT NULL CHECK(step_number >= 1 AND step_number <= 12),
  requested_at TEXT NOT NULL,
  approved_at TEXT,
  approval_method TEXT CHECK(approval_method IN ('qr_code', 'pin', 'in_person')),
  UNIQUE(user_id, step_number)
);
```

---

### Step 4: The Inventory Deck

**Description:** Interactive card-sorting interface for the moral inventory. Makes Step 4 less overwhelming by breaking it into swipeable cards.

**Features:**
- Pre-populated prompt cards (resentments, fears, harms, sexual conduct)
- Swipe right to acknowledge, left to skip for now
- Cards can be expanded for deeper reflection
- Progress saved locally, encrypted
- Unlocked after Step 3 approval

**Interactions:**
- Swipe gestures with haptic feedback
- Card flip animation to reveal reflection prompts
- Deck shuffles to surface unaddressed items

---

### Step 6/7: The Defect Drop

**Description:** Physics-based visualization for "letting go" of character defects. Users drag defect cards into a void/fire/water.

**Features:**
- List of common defects with custom additions
- Drag-and-drop with realistic physics (gravity, bounce)
- Visual metaphor: burning, dissolving, floating away
- Can revisit dropped defects (they don't disappear—recovery is ongoing)
- Haptic feedback on release

---

### Step 8/9: The Repair Shop

**Description:** Amends tracking system with Kintsugi-inspired visuals (Japanese art of repairing broken pottery with gold).

**Features:**
- List of people harmed (encrypted)
- Status tracking: Not Ready → Willing → In Progress → Made → Living Amends
- Visual: cracked bowl slowly filled with gold as amends progress
- Notes for each amend (what to say, when, outcome)
- Reminders for living amends

**Database Schema:**
```sql
CREATE TABLE amends_list (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  encrypted_name TEXT NOT NULL,
  encrypted_harm TEXT,
  encrypted_amend_plan TEXT,
  status TEXT DEFAULT 'not_ready',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

### Step 12: Torchbearer Mode

**Description:** Unlocks "responder" capabilities after completing all steps. Allows user to receive anonymous support requests.

**Features:**
- Opt-in to receive Lifeline signals (see Privacy section)
- Anonymous chat with struggling users
- No identifiable information exchanged
- Can turn off anytime
- Shows "X people helped" counter (local only)

---

## 2. Somatic & Hardware-Based Tools

### Shake for Serenity (Gratitude Jar)

**Description:** Shake phone to receive a random past gratitude entry. Uses accelerometer.

**How It Works:**
1. User saves gratitude entries during check-ins
2. Shake phone triggers accelerometer
3. Random gratitude card appears with gentle animation
4. Haptic pulse on reveal

**Privacy:** All entries encrypted, stored locally.

---

### The Urge Gyroscope

**Description:** Balance game using phone's gyroscope. Hold phone level for 60-90 seconds to "surf" an urge.

**How It Works:**
- Tilt phone to keep a ball/bubble centered
- Timer counts down as user maintains balance
- Gentle audio cues for encouragement
- Stats tracked: longest balance, total urge surfs

**Purpose:** Distraction + mindfulness + somatic grounding.

---

### The Worry Stone

**Description:** Digital fidget tool with haptic feedback. Smooth, tactile comfort without needing to think.

**Features:**
- Circular gesture area on screen
- Subtle haptic pulses as finger moves
- Optional ambient sounds (rain, ocean, white noise)
- No data tracked—just presence

---

### Haptic Heartbeat

**Description:** Phone vibrates in a slow, steady heartbeat pattern (60 BPM) for grounding during anxiety.

**How It Works:**
- One-tap activation
- Phone pulses: `thump-thump... thump-thump...`
- User holds phone to chest or in hand
- Auto-stops after 2 minutes or on tap

---

### The Fog Mirror

**Description:** "Breathe" on screen (proximity sensor) to reveal a meaningful image underneath.

**How It Works:**
1. User sets an "anchor image" (photo of loved one, sobriety chip, meaningful place)
2. Screen appears fogged/blurred
3. Bringing phone close (proximity sensor) or slow exhale reveals image
4. Image fades back to fog after 10 seconds

**Privacy:** Image encrypted, never synced.

---

### The Pocket Sponsor

**Description:** Fake incoming call using proximity sensor. Escape awkward situations gracefully.

**How It Works:**
- Pre-set "sponsor name" and ringtone
- Double-tap power button (or shake) triggers fake call
- Realistic call screen with answer/decline
- Answering plays silence or pre-recorded message

---

### The Vocal Valve

**Description:** Audio catharsis tool. Speak/scream into phone for release—nothing is recorded.

**How It Works:**
- Microphone captures audio levels (not content)
- Visual feedback: waves, flames, or abstract art respond to volume
- No audio ever saved
- Session stats (duration, peak intensity) stored locally

**Purpose:** Emotional release without permanent record.

---

## 3. Connection & Community Features

### The Lifeline (Encrypted Panic Signal)

**Description:** Encrypted SOS to trusted contacts during crisis. Not a suicide hotline—a personal support network.

**How It Works:**
1. User pre-registers 1-3 trusted contacts (sponsor, friend, family)
2. Contacts accept invitation, exchange encryption keys
3. In crisis: User taps Lifeline button
4. Contacts receive encrypted push notification: "[Name] needs support"
5. One-tap to call or message

**Privacy:**
- No location shared unless user opts in
- Message content never stored on server
- Contacts can respond with "I'm here" acknowledgment

**Database Schema:**
```sql
CREATE TABLE lifeline_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  public_key TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE TABLE lifeline_signals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  acknowledged_at TEXT,
  resolved_at TEXT
);
```

---

### The Global Candle (Silent Vigil)

**Description:** See how many people worldwide are "holding space" right now. Anonymous presence, not chat.

**How It Works:**
- User taps to "light their candle"
- Screen shows: "You are not alone. 847 candles lit right now."
- Gentle flickering animation
- No usernames, no chat, just presence
- Uses Supabase Realtime Presence (anonymous)

**Privacy:** Only anonymous count visible. No user data transmitted.

---

### Anonymous Echoes

**Description:** Async voice messages of support. Record, encrypt, send to random struggling user.

**How It Works:**
1. User in good recovery records short encouragement (< 60 seconds)
2. Audio encrypted, uploaded
3. Someone in crisis receives random "echo" from the vault
4. One-way only—no replies, no identity

**Moderation:** AI screening for harmful content before delivery.

---

### Torchbearer Responder Mode

**Description:** (See Step 12 above) Allows completed-step users to receive and respond to anonymous support requests.

---

### Community Hub (Anonymous Posts)

**Description:** Simple anonymous posting board for sharing without identity.

**Features:**
- Text-only posts (no images)
- No usernames—completely anonymous
- Upvote for support (no downvotes)
- Auto-delete after 48 hours
- Topic tags: #gratitude, #struggling, #milestone, #question

**Moderation:** AI + community flagging for harmful content.

---

### Sponsor Co-Working Sessions

**Description:** Scheduled virtual "work time" with sponsor for step work.

**Features:**
- Calendar integration for scheduling
- Shared timer (both see countdown)
- No screen sharing—just accountability
- Post-session reflection prompt

---

## 4. Visualization & Gamification

### The Recovery Garden

**Description:** Procedurally generated garden that grows based on recovery activities.

**What Grows:**
- Daily check-ins → Flowers bloom
- Journal entries → Trees grow
- Meeting attendance → Pathways form
- Milestones → Monuments appear
- Streaks → Garden flourishes

**What Happens on Relapse:**
- Season changes (not destruction)
- Plants go dormant, not dead
- Replanting begins with first action back

**Privacy:** Garden state stored locally, never synced.

---

### Avatar Creator ("The New You")

**Description:** Create a visual representation of your recovering self.

**Features:**
- Simple avatar builder (face, hair, accessories)
- Outfit unlocks tied to milestones
- Avatar appears on dashboard
- Optional: share avatar (not identity) in community

---

### Meditation Timer with Unlockable Sounds

**Description:** Meditation timer that rewards consistency.

**Unlockables:**
- 7-day streak: Rain sounds
- 30-day streak: Forest ambiance
- 90-day streak: Ocean waves
- 1-year: Custom sound upload

**Features:**
- Adjustable timer (1-60 minutes)
- Interval bells
- Stats: total meditation time, longest session

---

### Meeting Logger with Attendance Streaks

**Description:** Log meeting attendance with visual streaks (weekly, not daily).

**Features:**
- Quick-log: Meeting type, duration, mood before/after
- Weekly streak counter (3+ meetings/week)
- Monthly calendar view
- Notes for key takeaways (encrypted)

**Note:** Streaks are weekly to match realistic meeting schedules.

---

### Recovery Timeline

**Description:** Visual timeline of recovery journey.

**Features:**
- Automatic entries: milestones, step completions
- Manual entries: significant moments
- Photos (encrypted, optional)
- Shareable milestone cards (no personal data)

---

## 5. Cognitive & Journaling Tools

### The Shadow & The Spark (Dual-Mode Journaling)

**Description:** Two journaling modes—one for darkness, one for light.

**Shadow Mode:**
- Dark UI theme
- Prompts for difficult feelings
- Option to auto-delete after 24 hours
- No judgment, just release

**Spark Mode:**
- Light UI theme
- Gratitude and wins
- Saved permanently
- Shareable (optional)

---

### The Tape Deck (Audio Cognitive Reframing)

**Description:** Record negative self-talk, then re-record with compassionate response.

**How It Works:**
1. Record the "bad tape" (critical inner voice)
2. Listen back
3. Record the "good tape" (compassionate reframe)
4. Save both for future reference
5. Option to delete bad tape after recording good one

**Privacy:** All audio encrypted locally.

---

### Reflections AI Draft

**Description:** AI-assisted journaling prompts and draft suggestions.

**Features:**
- Context-aware prompts based on mood, step work
- Optional AI expansion of bullet points
- User always edits final version
- AI never sees raw journal content (on-device processing preferred)

---

### Play It Forward (Visual Consequence Tree)

**Description:** Visualize the ripple effects of using vs. not using.

**How It Works:**
1. User inputs current urge/situation
2. App shows branching tree:
   - Left branch: "If I use..." (consequences)
   - Right branch: "If I don't..." (benefits)
3. Each branch expands with time (1 hour, 1 day, 1 week)
4. Personalized based on user's history

---

### Relapse Prevention Plan Builder

**Description:** Structured tool to build and store a relapse prevention plan.

**Sections:**
- Warning signs
- Triggers
- Coping strategies
- Support contacts
- Emergency actions

**Features:**
- Guided prompts for each section
- One-tap access during crisis
- Shareable with sponsor (encrypted)

---

## 6. Privacy & Safety Features

### Crisis Button Enhancements

**Description:** Improvements to existing emergency features.

**Features:**
- Customizable crisis toolkit order
- Quick-dial integration with local crisis lines
- GPS-based nearest meeting finder (opt-in)
- Breathing exercise shortcuts

---

### Decoy Mode

**Description:** App disguises itself as something else (calculator, notes app).

**How It Works:**
- Secondary app icon in settings
- Fake landing screen until PIN entered
- Protects privacy in shared environments

---

### Biometric Journal Lock

**Description:** Extra layer of protection for journal entries.

**Features:**
- Require Face ID/fingerprint to open journal
- Auto-lock after 30 seconds inactive
- Encrypted even beyond standard encryption

---

### Data Self-Destruct

**Description:** Option to permanently delete all data on command.

**Features:**
- Confirmation with cooldown period
- Option to export before deletion
- Irreversible—encryption keys destroyed

---

## 7. Notifications & Engagement

### Mindful Notifications

**Description:** Smart, non-intrusive notification system.

**Types:**
- Morning intention reminder
- Evening reflection prompt
- Meeting reminders (if logged)
- Milestone celebrations
- "Just checking in" (randomized, gentle)

**Anti-Features:**
- No shame-based messaging
- No "you broke your streak" alerts
- Fully customizable frequency
- Easy to disable entirely

---

### Check-in Streak Coaching

**Description:** Gentle encouragement for daily check-in habits.

**Features:**
- Streak counter (non-punitive)
- Encouraging messages at milestones
- "Restart" framing, not "failure" framing
- Weekly summary (optional)

---

### Seasonal & Holiday Risk Alerts

**Description:** Proactive support during high-risk periods.

**Features:**
- Optional alerts before holidays
- Increased check-in prompts
- Curated coping strategies for the season
- Community support visibility boost

---

## 8. Accessibility & Inclusivity

### Accessibility Boosters

**Description:** Features for users with different abilities.

**Features:**
- Full VoiceOver/TalkBack support
- High contrast mode
- Large text scaling (up to 200%)
- Reduced motion option
- Haptic alternatives for audio cues

---

### Multi-Language Support

**Description:** App available in multiple languages.

**Priority Languages:**
- English
- Spanish
- French
- Portuguese
- German

**Features:**
- Localized prompts and content
- RTL support for Arabic, Hebrew

---

### Low-Bandwidth Mode

**Description:** Optimized for users with limited data.

**Features:**
- Offline-first (already core)
- Compressed sync
- Text-only community mode
- Data usage dashboard

---

### Dual Diagnosis Support

**Description:** Content and tools for users with co-occurring mental health conditions.

**Features:**
- Medication reminders (encrypted)
- Mood disorder tracking
- Integration prompts for therapy
- Mental health resources

---

## 9. Recovery Program Tools

### SMART Recovery Tools

**Description:** Support for users following SMART Recovery instead of 12-step.

**Features:**
- 4-Point Program tracking
- Cost-Benefit Analysis tool
- DISARM worksheet (for urges)
- Hierarchy of Values exercise

---

### MAT (Medication-Assisted Treatment) Tracker

**Description:** For users on Suboxone, Methadone, Vivitrol, etc.

**Features:**
- Medication schedule reminders
- Dose tracking
- Appointment reminders
- No judgment—MAT is valid recovery

---

### Treatment Center Finder

**Description:** Database of treatment facilities.

**Features:**
- Location-based search
- Filter by insurance, type, specialty
- Reviews (anonymous)
- Direct contact integration

---

### High-Functioning Addict Self-Assessment

**Description:** Tools for users who "pass" as fine but struggle internally.

**Features:**
- Hidden consequences inventory
- Energy audit
- Relationship impact assessment
- Personalized wake-up prompts

---

## Database Schema Summary

### New Tables Required

| Table Name | Purpose |
|------------|---------|
| `step_approvals` | Sponsor unlock tracking |
| `inventory_cards` | Step 4 card data |
| `amends_list` | Step 8/9 amends tracking |
| `garden_plants` | Recovery Garden state |
| `gratitude_jar_entries` | Shake for Serenity |
| `urge_surf_sessions` | Urge Gyroscope stats |
| `venting_sessions` | Vocal Valve usage (no audio) |
| `anchor_images` | Fog Mirror encrypted images |
| `tape_deck_entries` | Audio reframing pairs |
| `lifeline_connections` | Panic button contacts |
| `lifeline_signals` | SOS event log |
| `vigil_sessions` | Global Candle local stats |
| `community_posts` | Anonymous community posts |
| `meditation_sessions` | Meditation timer history |
| `meeting_logs` | Meeting attendance tracking |

---

## Implementation Priority

### Phase 1: Core Recovery Tools
- [ ] The Inventory Deck (Step 4)
- [ ] The Lifeline (Panic Signal)
- [ ] Shake for Serenity (Gratitude Jar)
- [ ] Meeting Logger with Streaks

### Phase 2: Somatic & Grounding
- [ ] The Urge Gyroscope
- [ ] The Worry Stone
- [ ] Haptic Heartbeat
- [ ] The Fog Mirror

### Phase 3: Connection Features
- [ ] The Global Candle
- [ ] Anonymous Echoes
- [ ] Torchbearer Mode
- [ ] Community Hub

### Phase 4: Step-Specific Tools
- [ ] The Key Ceremony (unlock mechanism)
- [ ] The Defect Drop (Steps 6/7)
- [ ] The Repair Shop (Steps 8/9)
- [ ] Meditation Timer with Unlockables

### Phase 5: Polish & Accessibility
- [ ] Avatar Creator
- [ ] Recovery Garden
- [ ] Recovery Timeline
- [ ] Accessibility Boosters
- [ ] Multi-Language Support

---

## Notes

- All features must pass security audit before implementation
- Encryption-first: sensitive data never stored in plaintext
- Offline-first: all features work without network
- Privacy-first: no tracking, no analytics on personal content
- Compassion-first: no shame-based messaging or punitive mechanics

---

*Last Updated: February 2026*
