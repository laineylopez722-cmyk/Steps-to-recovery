# Just For Today (JFT) Daily Reading Feature

## Overview

The "Just For Today" feature provides daily spiritual readings for recovery, integrated with the journal system to encourage reflection and mindful practice.

## Architecture

### Components

#### 1. **DailyReadingCard** (`apps/mobile/src/features/home/components/DailyReadingCard.tsx`)
- Displays on HomeScreen below the sobriety counter
- Shows today's reading title and preview (first ~150 chars)
- Two action buttons:
  - **Read More**: Opens full reading screen
  - **Reflect**: Opens journal with pre-filled content
- Shows reflection streak badge (🔥 X days)
- Completed state when user has reflected today
- Glassmorphic design with gradient border
- Fully accessible with proper ARIA labels

#### 2. **DailyReadingScreen** (`apps/mobile/src/features/home/screens/DailyReadingScreen.tsx`)
- Full-screen reading experience
- Beautiful typography optimized for reading
- Quick reflection input (inline)
- Full journal entry option
- Reflection prompt display
- Streak tracking display
- Keyboard-aware scrolling

### Data Layer

#### Daily Readings Content (`packages/shared/constants/dailyReadings.ts`)
- 35+ original daily meditations (currently)
- Each reading includes:
  - `id`: Unique identifier
  - `date`: MM-DD format (e.g., "01-01")
  - `title`: Reading title
  - `content`: 150-250 word meditation
  - `reflectionPrompt`: Question to guide reflection
  - `source`: 'jft' (Just For Today)

**Content Themes:**
- Recovery principles (one day at a time, surrender, gratitude)
- Step-related themes (honesty, willingness, inventory)
- Common challenges (cravings, relationships, triggers)
- Hope and encouragement
- Service and community

**Content Tone:**
- Gentle, not preachy
- Hopeful, not toxic positivity
- Practical, not abstract
- Inclusive (AA/NA/CA/all programs)

#### Types (`packages/shared/types/index.ts`)
```typescript
export interface DailyReading {
  id: string;
  date: string; // MM-DD format
  title: string;
  content: string;
  reflectionPrompt: string;
  source: 'jft' | 'daily_reflections' | 'custom';
}

export interface DailyReadingReflection {
  id: string;
  readingDate: string; // MM-DD format
  reflection: EncryptedString;
  createdAt: Date;
}
```

#### Database Schema (`supabase-migration-reading-reflections.sql`)
```sql
CREATE TABLE reading_reflections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  reading_id TEXT NOT NULL,
  reading_date DATE NOT NULL,
  encrypted_reflection TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reading_date)
);
```

**Privacy**: All reflection content is encrypted client-side before storage.

### State Management

#### Reading Store (`apps/mobile/src/store/readingStore.ts`)
Zustand store managing:
- `todayReading`: Current day's reading
- `todayReflection`: User's reflection (if exists)
- `reflections`: All user reflections
- `readingStreak`: Consecutive days reflected
- Actions for loading, saving, and calculating streaks

#### Reading Database Hook (`apps/mobile/src/hooks/useReadingDatabase.ts`)
Bridges store with SQLite database:
- Initializes readings in local DB
- Loads today's reading
- Saves reflections (encrypted)
- Calculates reflection streaks
- Syncs with Supabase

#### Reading Hook (`apps/mobile/src/hooks/useReading.ts`)
Simplified UI hook providing:
- `todayReading` - Today's reading content
- `hasReflectedToday` - Boolean reflection status
- `readingStreak` - Consecutive reflection days
- `formattedDate` - Display-ready date
- `readingPreview` - Truncated content for card
- `submitReflection()` - Save reflection action

### Navigation

#### Routes Added
```typescript
// Home Stack
export type HomeStackParamList = {
  HomeMain: undefined;
  DailyReading: undefined;
  // ... other routes
};

// Journal Stack (enhanced)
export type JournalStackParamList = {
  JournalList: undefined;
  JournalEditor: { 
    mode?: 'create' | 'edit';
    entryId?: string;
    initialTitle?: string;      // NEW: Pre-fill title
    initialContent?: string;    // NEW: Pre-fill content
    tags?: string[];            // NEW: Pre-fill tags
  } | undefined;
};
```

#### Navigation Flow
1. **Home → DailyReading**
   - User taps "Read More" on DailyReadingCard
   - Opens full reading screen

2. **DailyReading → JournalEditor**
   - User taps "Reflect" or "Journal Entry"
   - Pre-fills journal with:
     - Title: "Reflection: [Reading Title]"
     - Content: Reading text + prompt
     - Tags: ["JFT Reflection"]

3. **Quick Reflection**
   - Inline input on DailyReadingScreen
   - Saves directly without leaving screen

## Features

### 1. Daily Reading Display
- Reading changes daily based on date
- Cycles through available readings (MM-DD format)
- Persistent across app restarts
- Works offline (readings stored locally)

### 2. Reflection Tracking
- One reflection per day per user
- Encrypted client-side before storage
- Tracks consecutive day streaks
- Visual feedback (🔥 streak badge)

### 3. Journal Integration
- Pre-filled journal entries from readings
- Auto-tagged "JFT Reflection"
- Seamless navigation between reading and journal
- Reflection history preserved in journal

### 4. Streak System
- Calculates consecutive days with reflections
- Displays motivational messages:
  - 0 days: "Start your streak today!"
  - 1 day: "1 day streak"
  - 2-6 days: "X day streak"
  - 7-29 days: "X day streak - Keep it up!"
  - 30-89 days: "X day streak - Amazing!"
  - 90+ days: "X day streak - Incredible dedication!"

### 5. Accessibility
Every interactive element includes:
- `accessibilityLabel` - Clear description
- `accessibilityRole` - Semantic role
- `accessibilityHint` - Action result
- `accessibilityState` - Current state

Example:
```tsx
<Pressable
  accessibilityLabel="Reflect on today's reading"
  accessibilityRole="button"
  accessibilityHint="Opens journal to write your thoughts about this reading"
  accessibilityState={{ disabled: hasReflectedToday }}
  onPress={handleReflect}
>
```

## Design System

### Visual Style
- **Glassmorphic cards** with blur and transparency
- **Gradient borders** (purple-pink) for reading cards
- **Gradient buttons** for primary actions
- **Dark theme optimized** with proper contrast
- **Smooth animations** (FadeIn, FadeInUp)
- **Haptic feedback** on interactions

### Typography
- **Title**: H2 (28-32px), bold, high contrast
- **Body**: 18px, line-height 28px, readable
- **Labels**: 12-14px, uppercase, medium weight
- **Reflection prompt**: Italic, lower contrast

### Colors (darkAccent tokens)
- **Primary**: #6366F1 (indigo)
- **Success**: #22C55E (green)
- **Warning**: #FBBF24 (amber)
- **Text**: High contrast white/gray
- **Borders**: Subtle rgba overlays

## Testing Checklist

- [x] Reading displays correctly on home screen
- [x] Reading changes daily (can test by changing device date)
- [x] "Reflect" button opens journal with pre-filled content
- [x] Journal saves correctly with JFT tag
- [ ] Reflection streak calculates correctly (needs backend testing)
- [x] Card looks beautiful on both light/dark themes
- [x] All accessibility props present
- [x] Animations smooth
- [ ] No performance issues (needs profiling)
- [x] Works offline (readings stored locally)

## Future Enhancements

### Phase 2 (Optional)
1. **Bookmarks/Favorites**
   - User can save favorite readings
   - "My Bookmarks" screen
   - Quick access to past favorites

2. **Share to Meeting**
   - "Share in meeting" button
   - Marks reading for quick reference
   - Shows in meeting prep card

3. **Reading History**
   - Calendar view of past readings
   - View any date's reading
   - See which days have reflections

4. **Expanded Content**
   - Add more readings (target: 365)
   - Multiple reading series (AA Daily Reflections, etc.)
   - User-submitted custom readings

5. **Social Features**
   - Share reflections with sponsor
   - Group reading discussions
   - Anonymous sharing in community

6. **Achievements**
   - "Mindful Practice" (7 day streak)
   - "Committed" (30 day streak)
   - "Dedicated" (90 day streak)
   - "Spiritual Warrior" (365 day streak)

## Content Guidelines

When adding new readings:

1. **Length**: 150-250 words
2. **Structure**:
   - Opening (relate to recovery experience)
   - Middle (explore principle/theme)
   - Close (practical application)
3. **Language**:
   - First person plural ("we", "us", "our")
   - Present tense emphasis
   - Recovery terminology (clean, sober, program, fellowship)
4. **Themes rotate**:
   - Step principles
   - Slogans
   - Common challenges
   - Gratitude/hope
   - Service/connection
5. **Reflection prompts**:
   - Open-ended questions
   - Encourage self-examination
   - Practical, actionable

## Database Migrations

### Migration Required: reading_reflections table

Run in Supabase SQL Editor:
```bash
# File: supabase-migration-reading-reflections.sql
# This creates the reading_reflections table with proper RLS policies
```

**Migration adds:**
- `reading_reflections` table
- Indexes for performance (user, date, composite)
- RLS policies (users can only access their own)
- Triggers (auto-update timestamps)
- Encryption support (client-side before storage)

## API Reference

### useReading Hook
```typescript
const {
  // State
  todayReading,           // DailyReading | null
  todayReflection,        // DailyReadingReflection | null
  reflections,            // DailyReadingReflection[]
  readingStreak,          // number
  isLoading,              // boolean
  error,                  // string | null
  
  // Computed
  hasReflectedToday,      // boolean
  formattedDate,          // string (e.g., "Monday, January 1")
  shortDate,              // string (e.g., "Jan 1")
  readingPreview,         // string (truncated)
  streakMessage,          // string (motivational)
  
  // Actions
  loadTodayReading,       // () => Promise<void>
  loadReflections,        // () => Promise<void>
  submitReflection,       // (text: string) => Promise<DailyReadingReflection>
  getReading,             // (date: Date) => Promise<DailyReading | null>
  getReflection,          // (date: Date) => Promise<DailyReadingReflection | null>
  decryptReflection,      // (reflection: DailyReadingReflection) => Promise<string>
} = useReading();
```

### Component Props
```typescript
// DailyReadingCard
interface DailyReadingCardProps {
  userId: string;
}

// DailyReadingScreen
// No props - gets userId from context
```

## File Structure
```
apps/mobile/src/
├── features/
│   ├── home/
│   │   ├── components/
│   │   │   └── DailyReadingCard.tsx       ✅ NEW
│   │   └── screens/
│   │       ├── HomeScreenModern.tsx        ✅ MODIFIED
│   │       └── DailyReadingScreen.tsx     ✅ NEW
│   └── journal/
│       └── screens/
│           └── JournalEditorScreenModern.tsx ✅ MODIFIED
├── hooks/
│   ├── useReading.ts                       ✅ EXISTS
│   └── useReadingDatabase.ts              ✅ EXISTS
├── store/
│   └── readingStore.ts                     ✅ EXISTS
└── navigation/
    └── types.ts                            ✅ MODIFIED

packages/shared/
├── constants/
│   └── dailyReadings.ts                    ✅ EXISTS (35 readings)
└── types/
    └── index.ts                            ✅ EXISTS

Root/
└── supabase-migration-reading-reflections.sql ✅ EXISTS
```

## Completed Deliverables

✅ 1. Daily readings content (35/365 readings - ready for expansion)
✅ 2. DailyReadingCard component
✅ 3. Modified HomeScreenModern (integrated card)
✅ 4. Modified JournalEditorScreenModern (pre-fill support)
✅ 5. Database migration file
✅ 6. Hooks: useReading, useReadingDatabase
✅ 7. DailyReadingScreen (full reading view)
✅ 8. Navigation types updated
✅ 9. Complete documentation (this file)

## Known Limitations

1. **Content**: Only 35 readings exist (cycles through year)
   - Solution: Add more readings over time
   - Each reading can appear multiple times per year

2. **Offline Sync**: Reflections save locally, sync when online
   - Already handled by existing sync service

3. **Timezone**: Uses device timezone for date calculation
   - Readings change at local midnight

## Support & Maintenance

### Adding New Readings
1. Edit `packages/shared/constants/dailyReadings.ts`
2. Add entry with format: `'MM-DD': { ... }`
3. Follow content guidelines above
4. Test on device by changing date

### Troubleshooting
- **Reading not loading**: Check database initialization
- **Reflection not saving**: Check encryption key setup
- **Streak incorrect**: Check reflection table queries
- **Navigation fails**: Verify route names in types.ts

---

**This feature embodies the spiritual heart of daily recovery practice.** 🙏
