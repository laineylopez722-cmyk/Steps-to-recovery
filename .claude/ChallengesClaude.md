# Milestones & Challenges - Claude Prompt

## Objective

Implement milestone tracking (sobriety streak counter) and recovery challenges for engagement.

## Target Files

- `apps/mobile/src/features/progress/screens/ProgressDashboardScreen.tsx` - Progress dashboard
- `apps/mobile/src/features/progress/components/` - Progress UI components (MoodChart, CommitmentCalendar, etc.)
- `apps/mobile/src/features/progress/hooks/` - Analytics hooks (useMoodTrends, useRecoveryAnalytics, etc.)
- `apps/mobile/src/hooks/useAchievements.ts` - Achievement tracking hook
- `apps/mobile/src/features/meetings/screens/AchievementsScreen.tsx` - Achievements display
- `apps/mobile/src/features/home/components/CleanTimeTracker.tsx` - Streak counter component

## Requirements

### Sobriety Streak Counter

- Calculate days sober from sobriety start date
- Display prominently on home/dashboard screen
- Celebrate milestones: 1, 7, 14, 30, 60, 90, 180, 365 days
- Handle date changes (user can reset if needed)
- Visual progress toward next milestone

### Milestone Tracking

- Award badges/tokens for milestones
- Visual achievement gallery
- Milestone history log
- Celebratory animations on achievement
- Shareable milestone graphics (optional)

### Challenges System

1. **Meeting Attendance Challenge**
   - "30 meetings in 30 days"
   - "90 meetings in 90 days"
   - Track consecutive weeks with meetings

2. **Journaling Challenge**
   - Daily journaling streak
   - "7 days in a row"
   - "30 days in a row"

3. **Step Work Challenge**
   - Complete specific steps
   - Time-based step completion goals

### Streak Calculation

```typescript
function calculateStreak(startDate: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
```

### Database Schema

```sql
CREATE TABLE milestones (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  days INTEGER NOT NULL,
  achieved_at INTEGER NOT NULL
);

CREATE TABLE challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  target INTEGER NOT NULL,
  current INTEGER DEFAULT 0,
  start_date INTEGER NOT NULL,
  end_date INTEGER,
  is_completed BOOLEAN DEFAULT 0
);
```

### Gamification Elements

- Progress bars for challenges
- Badge/achievement system
- Streak flames or visual indicators
- Positive reinforcement messages
- NO pressure or negative messaging on resets

### User Experience

- Motivational, not judgmental
- Allow hiding features if stressful
- Celebrate progress, no matter how small
- Handle relapses with compassion
- Optional social sharing of achievements
