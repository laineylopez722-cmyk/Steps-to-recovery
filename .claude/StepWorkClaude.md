# 12-Step Work Tracking - Claude Prompt

## Objective

Provide UI and data models for working through the 12 steps with guided forms and progress tracking.

## Target Files

- `apps/mobile/src/features/steps/screens/StepsListScreen.tsx`
- `apps/mobile/src/features/steps/screens/StepDetailScreen.tsx`
- `apps/mobile/src/features/steps/components/StepCard.tsx`
- `apps/mobile/src/lib/database/steps.ts`

## Requirements

### Steps List Screen

- Display all 12 steps with titles and descriptions
- Progress indicator for each step
- Visual completion badges
- Tap to open step detail

### Step Detail Screen

- Step number, title, and full description
- Guided questions/prompts for each step
- Free-form text input for reflections
- Mark as "completed" functionality
- Save progress (encrypted)

### Special Step Implementations

1. **Step 4** - Moral Inventory
   - Structured form for resentments, fears, harms
   - Tabular format or repeated entry form

2. **Step 10** - Daily Review
   - Quick daily check-in form
   - Nightly reflection prompts
   - History of past reviews

3. **Step 8** - Amends List
   - List builder for people harmed
   - Notes field for each entry
   - Track amends completion status

### Data Storage

- SQLite table for step work entries
- Encrypted sensitive content
- Sync to Supabase with RLS
- Schema:
  ```sql
  CREATE TABLE step_work (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    encrypted_content TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    sync_status TEXT DEFAULT 'pending'
  );
  ```

### User Experience

- Supportive, non-judgmental language
- Celebrate completion of each step
- Allow revisiting and editing step work
- No pressure to complete in order (though encourage it)
