# Feature Guide: Achievements & Milestones

## Architecture

Achievements are stored in the local `achievements` table and synced to Supabase.

### Key Files

| File | Purpose |
|---|---|
| `features/meetings/hooks/useAchievements.ts` | React Query hook for fetching and earning achievements |
| `features/meetings/screens/AchievementsScreen.tsx` | Full achievement display screen |
| `features/meetings/components/AchievementUnlockModal.tsx` | Celebration modal on unlock |
| `features/home/hooks/useCleanTime.ts` | Clean time calculator + milestone detection |
| `utils/database.ts` | `achievements` table schema (lines 162-171) |

### Achievement Types

- **Milestone-based**: Days sober (1, 7, 30, 60, 90, 180, 365, etc.)
- **Activity-based**: Journal entries written, check-ins completed, steps worked

### Data Flow

1. `useCleanTime` detects milestone crossing
2. Calls `earnAchievement()` which writes to `achievements` table
3. `addToSyncQueue()` queues for cloud sync
4. `AchievementUnlockModal` shows celebration animation

---

# Feature Guide: Meeting Finder & Geofencing

## Architecture

Meeting finder uses cached API data and geolocation for proximity search.

### Key Files

| File | Purpose |
|---|---|
| `features/meetings/hooks/useMeetingSearch.ts` | Search by location, day, type |
| `features/meetings/services/meetingCacheService.ts` | Cache management for meeting data |
| `utils/database.ts` | `cached_meetings`, `favorite_meetings`, `meeting_search_cache` tables |

### Geolocation Flow

1. Request location permission via `expo-location`
2. Fetch meetings within radius from API
3. Cache results in `cached_meetings` for offline use
4. Users can favorite meetings → synced to Supabase (encrypted notes)

---

# Feature Guide: Search

## Architecture

Search is implemented via SQLite full-text queries on decrypted content.

### Key Files

| File | Purpose |
|---|---|
| `features/meetings/hooks/useMeetingSearch.ts` | Meeting search with location filtering |
| `features/journal/hooks/useJournalEntries.ts` | Journal search via `LIKE` on decrypted content |

### Search Strategy

- Meeting search: SQLite `LIKE` on cached meeting `name`, `location`, `address`
- Journal search: Decrypt entries in memory → client-side filter
- Step work: Filter by `step_number` and `question_number`

### Privacy Note

Full-text search operates on **decrypted content in memory only**. No search index is persisted — this prevents encrypted data from leaking via search indexes.
