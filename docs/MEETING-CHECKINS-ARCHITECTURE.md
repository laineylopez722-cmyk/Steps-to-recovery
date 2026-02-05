# Meeting Check-Ins & Achievements System - Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │ Meeting Finder   │  │ Meeting Stats    │  │ Achievements     │    │
│  │   Screen         │  │    Screen        │  │    Screen        │    │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤    │
│  │ • Meeting List   │  │ • Stats Cards    │  │ • Gallery Grid   │    │
│  │ • Check-In Btn ✓ │  │ • 90-in-90 Bar   │  │ • Filters        │    │
│  │ • Filters        │  │ • Achievements   │  │ • Progress Bars  │    │
│  │ • Distance       │  │ • Recent List    │  │ • Unlock Dates   │    │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘    │
│           │                     │                      │               │
│           └─────────────────────┼──────────────────────┘               │
│                                 │                                      │
│  ┌──────────────────────────────┴───────────────────────────────────┐ │
│  │                       MODAL COMPONENTS                            │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │                                                                   │ │
│  │  ┌─────────────────────┐      ┌──────────────────────────────┐  │ │
│  │  │  CheckInModal       │      │ AchievementUnlockModal       │  │ │
│  │  ├─────────────────────┤      ├──────────────────────────────┤  │ │
│  │  │ • Meeting Details   │      │ • Icon Animation             │  │ │
│  │  │ • Notes Input       │      │ • Confetti 🎊                │  │ │
│  │  │ • Impact Preview    │      │ • Shine Effect ✨            │  │ │
│  │  │ • Confirm Button    │      │ • Share Button               │  │ │
│  │  └─────────────────────┘      └──────────────────────────────┘  │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Props & Callbacks
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          REACT QUERY HOOKS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ useMeetingCheckIns   │  │ useAchievements  │  │ use90In90Progress│ │
│  ├──────────────────────┤  ├──────────────────┤  ├──────────────────┤ │
│  │ • Query: Get List    │  │ • Query: Unlocks │  │ • Query: Stats   │ │
│  │ • Mutation: CheckIn  │  │ • Calculate Prog │  │ • % Complete     │ │
│  │ • Cache: 'checkIns'  │  │ • Cache: 'achvmt'│  │ • On Track?      │ │
│  │ • Auto-Invalidate ♻️ │  │ • Auto-Update 🔄 │  │ • Motivational   │ │
│  └──────────┬───────────┘  └──────────┬───────┘  └─────────┬────────┘ │
│             │                         │                     │          │
│             └─────────────────────────┼─────────────────────┘          │
│                                       │                                │
└───────────────────────────────────────┼────────────────────────────────┘
                                        │
                                        │ Service Calls
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER (Business Logic)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  meetingCheckInService.ts                                              │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  • checkInToMeeting(userId, data)      → CheckIn + Achievements  │  │
│  │  • getMeetingCheckIns(userId, limit)   → CheckIn[]               │  │
│  │  • calculateStreak(userId)             → number                  │  │
│  │  • calculateTotal(userId)              → number                  │  │
│  │  • check90In90Progress(userId)         → Progress                │  │
│  │  • getAchievements(userId)             → Achievement[]           │  │
│  │  • getMeetingStats(userId)             → Stats                   │  │
│  │  • hasCheckedInToday(userId)           → boolean                 │  │
│  │  • hasCheckedInToMeetingToday(...)     → boolean                 │  │
│  │                                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ Supabase Client
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       SUPABASE (Backend as a Service)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                          DATABASE TABLES                         │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │                                                                   │  │
│  │  meeting_checkins                    achievements                │  │
│  │  ┌─────────────────────┐             ┌───────────────────────┐  │  │
│  │  │ id (UUID)           │             │ id (UUID)             │  │  │
│  │  │ user_id (FK)        │             │ user_id (FK)          │  │  │
│  │  │ meeting_id          │             │ achievement_key       │  │  │
│  │  │ meeting_name        │             │ unlocked_at           │  │  │
│  │  │ meeting_address     │             └───────────────────────┘  │  │
│  │  │ check_in_type       │                                        │  │
│  │  │ latitude            │                                        │  │
│  │  │ longitude           │             UNIQUE(user, key)         │  │
│  │  │ notes               │                                        │  │
│  │  │ created_at          │                                        │  │
│  │  └─────────────────────┘                                        │  │
│  │                                                                   │  │
│  │  UNIQUE(user, meeting, DATE(created_at))                         │  │
│  │                                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                      RLS POLICIES (Security)                     │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │                                                                   │  │
│  │  meeting_checkins:                                               │  │
│  │    • SELECT: WHERE user_id = auth.uid()                          │  │
│  │    • INSERT: WHERE user_id = auth.uid()                          │  │
│  │    • UPDATE: WHERE user_id = auth.uid()                          │  │
│  │    • DELETE: WHERE user_id = auth.uid()                          │  │
│  │                                                                   │  │
│  │  achievements:                                                   │  │
│  │    • SELECT: WHERE user_id = auth.uid()                          │  │
│  │    • INSERT: WHERE user_id = auth.uid()                          │  │
│  │                                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                   POSTGRESQL FUNCTIONS (RPC)                     │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │                                                                   │  │
│  │  get_user_meeting_streak(user_uuid)                              │  │
│  │  ├─ Check yesterday, day before, etc.                            │  │
│  │  ├─ Stop at first missing day                                    │  │
│  │  └─ Return: INTEGER (consecutive days)                           │  │
│  │                                                                   │  │
│  │  get_user_total_meetings(user_uuid)                              │  │
│  │  ├─ Count unique dates with check-ins                            │  │
│  │  └─ Return: INTEGER (total days)                                 │  │
│  │                                                                   │  │
│  │  get_90_in_90_progress(user_uuid)                                │  │
│  │  ├─ Find first check-in (start date)                             │  │
│  │  ├─ Count days in 90-day window                                  │  │
│  │  ├─ Calculate target date                                        │  │
│  │  └─ Return: JSON {                                               │  │
│  │       daysCompleted, daysRemaining,                              │  │
│  │       isComplete, startDate, targetDate                          │  │
│  │     }                                                             │  │
│  │                                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                  DATABASE TRIGGER (Automation)                   │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │                                                                   │  │
│  │  AFTER INSERT on meeting_checkins                                │  │
│  │    ↓                                                              │  │
│  │  check_achievement_unlocks()                                     │  │
│  │    ├─ Get current stats (total, streak, 90-in-90)                │  │
│  │    ├─ Check requirements for each achievement:                   │  │
│  │    │    • first_meeting:  total >= 1                             │  │
│  │    │    • week_strong:    streak >= 7                            │  │
│  │    │    • 30_in_30:       90in90.days >= 30                      │  │
│  │    │    • 90_in_90:       90in90.complete = true                 │  │
│  │    │    • centurion:      total >= 100                           │  │
│  │    │    • year_strong:    streak >= 365                          │  │
│  │    │    • marathon:       total >= 500                           │  │
│  │    └─ INSERT INTO achievements (if not exists)                   │  │
│  │                                                                   │  │
│  │  This happens AUTOMATICALLY on every check-in! 🎯               │  │
│  │                                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                         INDEXES (Performance)                    │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │                                                                   │  │
│  │  • meeting_checkins.user_id                                      │  │
│  │  • meeting_checkins.created_at (DESC)                            │  │
│  │  • meeting_checkins.(user_id, DATE(created_at))                  │  │
│  │  • achievements.user_id                                          │  │
│  │  • achievements.achievement_key                                  │  │
│  │                                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow: Check-In Process

```
User Taps "Check In"
         │
         ▼
┌─────────────────────┐
│   CheckInModal      │
│   Opens             │
└──────────┬──────────┘
           │
           │ User Confirms
           ▼
┌─────────────────────┐
│   useMeetingCheckIns│
│   .checkIn()        │
└──────────┬──────────┘
           │
           │ Mutation
           ▼
┌─────────────────────┐
│ checkInToMeeting()  │
│ (Service)           │
└──────────┬──────────┘
           │
           │ Supabase Insert
           ▼
┌─────────────────────────────────────┐
│  INSERT INTO meeting_checkins       │
│  VALUES (...)                       │
└──────────┬──────────────────────────┘
           │
           │ Trigger Fires 🔥
           ▼
┌─────────────────────────────────────┐
│  check_achievement_unlocks()        │
│  ├─ Calculate stats                 │
│  ├─ Check requirements              │
│  └─ INSERT achievements             │
└──────────┬──────────────────────────┘
           │
           │ Return Data
           ▼
┌─────────────────────────────────────┐
│  Service Returns:                   │
│  {                                  │
│    checkIn: { ... },                │
│    newAchievements: ['first_step']  │
│  }                                  │
└──────────┬──────────────────────────┘
           │
           │ React Query Success
           ▼
┌─────────────────────────────────────┐
│  Invalidate Queries:                │
│  • 'meetingCheckIns'                │
│  • 'meetingStats'                   │
│  • 'achievements'                   │
│  • '90in90Progress'                 │
└──────────┬──────────────────────────┘
           │
           │ UI Updates ✨
           ▼
┌─────────────────────────────────────┐
│  IF newAchievements.length > 0:     │
│    Show AchievementUnlockModal 🎉   │
│  ELSE:                              │
│    Show Success Animation ✅        │
└─────────────────────────────────────┘
           │
           │ User Sees
           ▼
┌─────────────────────────────────────┐
│  • Check-in appears in list         │
│  • Streak updated                   │
│  • 90-in-90 progress bar moves      │
│  • Achievement celebrated           │
│  • Motivational message             │
└─────────────────────────────────────┘
```

## 🎯 Achievement Unlock Flow

```
Check-In Completed
         │
         ▼
┌─────────────────────────────────────┐
│  Trigger: check_achievement_unlocks │
└──────────┬──────────────────────────┘
           │
           ├─────────────────────────┐
           │                         │
           ▼                         ▼
    Get Total Meetings        Get Current Streak
           │                         │
           ├─────────────────────────┤
           │                         │
           ▼                         ▼
    Get 90-in-90 Progress    Check Requirements
           │                         │
           └─────────────┬───────────┘
                         │
                         ▼
           ┌─────────────────────────┐
           │  For Each Achievement:  │
           │  IF requirement met:    │
           │    INSERT achievement   │
           │    (ON CONFLICT IGNORE) │
           └──────────┬──────────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  Return to App:      │
           │  List of newly       │
           │  unlocked keys       │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  App Shows:          │
           │  • Confetti 🎊       │
           │  • Icon Animation    │
           │  • Shine Effect ✨   │
           │  • Message 💬        │
           │  • Haptic Feedback   │
           └──────────────────────┘
```

## 🔒 Security Architecture

```
┌──────────────┐
│   User App   │
└──────┬───────┘
       │ Supabase Auth Token (JWT)
       │ Contains: user_id, email, roles
       ▼
┌─────────────────────────────────────┐
│      Supabase API Gateway           │
│  (Validates JWT)                    │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│   Row-Level Security (RLS)          │
│                                     │
│   auth.uid() = user_id              │
│                                     │
│   Filters ALL queries automatically │
│   Users ONLY see their own data     │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│     PostgreSQL Database             │
│   (Secure data storage)             │
└─────────────────────────────────────┘
```

## 📊 Cache Architecture (React Query)

```
┌────────────────────────────────────────┐
│         React Query Cache              │
├────────────────────────────────────────┤
│                                        │
│  Key: 'meetingCheckIns'                │
│  ├─ Data: CheckIn[]                    │
│  ├─ Stale: 30s                         │
│  └─ Refetch: On window focus           │
│                                        │
│  Key: 'meetingStats'                   │
│  ├─ Data: { total, streak, longest }  │
│  ├─ Stale: 30s                         │
│  └─ Invalidate: After check-in         │
│                                        │
│  Key: 'achievements'                   │
│  ├─ Data: Achievement[]                │
│  ├─ Stale: 1min                        │
│  └─ Invalidate: After check-in         │
│                                        │
│  Key: '90in90Progress'                 │
│  ├─ Data: { days, complete, ... }     │
│  ├─ Stale: 30s                         │
│  └─ Invalidate: After check-in         │
│                                        │
└────────────────────────────────────────┘
         │                    ▲
         │ Fetch              │ Update
         ▼                    │
┌────────────────────────────────────────┐
│         Supabase Database              │
└────────────────────────────────────────┘
```

## 🎨 Component Hierarchy

```
MeetingFinderScreenModern
├── Meeting List
│   └── Meeting Card
│       ├── Icon
│       ├── Name
│       ├── Time
│       ├── Location
│       └── Check-In Button ✓
│
├── CheckInModal (when check-in tapped)
│   ├── Meeting Details
│   ├── Notes Input
│   ├── Impact Preview
│   └── Confirm Button
│
└── AchievementUnlockModal (if unlocked)
    ├── Confetti Animation
    ├── Achievement Icon
    ├── Title & Description
    ├── Motivational Message
    ├── Share Button
    └── View All Button

MeetingStatsScreen
├── Header
├── Stats Row
│   ├── Total Meetings Card
│   ├── Current Streak Card
│   └── Longest Streak Card
├── 90-in-90 Progress Card
│   ├── Progress Bar
│   ├── Motivational Message
│   └── Status Badge
├── Achievements Preview
│   └── First 4 Achievements
└── Recent Check-Ins
    └── Last 10 Check-Ins

AchievementsScreen
├── Header
├── Stats Banner
│   ├── Unlock Count
│   └── Progress Bar
├── Filter Tabs
│   ├── All
│   ├── Unlocked
│   └── Locked
└── Achievement Grid
    └── Achievement Cards
        ├── Icon (colored/gray)
        ├── Title
        ├── Description
        ├── Progress Bar (if locked)
        ├── Unlock Date (if unlocked)
        └── Shine Effect (if unlocked)
```

## 🚀 Performance Optimizations

```
Database Level:
• Indexes on user_id, created_at
• RPC functions (server-side computation)
• Unique constraints (prevent duplicates)
• Triggers (automatic processing)

Application Level:
• React Query caching
• FlashList (virtualized lists)
• Memoized calculations
• Reanimated (60fps animations)
• Lazy loading components

Network Level:
• Automatic retry (Supabase)
• Offline queue (Supabase)
• Optimistic updates
• Cache-first strategy
```

---

**This architecture is production-ready and scalable!** 🚀
