# API and Data Model

This app uses local SQLite/IndexedDB as the source of truth and Supabase as a backup sync target. All sensitive content is encrypted on-device before storage or sync.

## Local Database

Schema and migrations live in `apps/mobile/src/utils/database.ts`.

Primary tables:

- `user_profile`
- `journal_entries` (encrypted fields)
- `daily_checkins` (encrypted fields)
- `step_work` (encrypted fields)
- `achievements`
- `sync_queue`
- `daily_readings`
- `reading_reflections` (encrypted fields)
- `cached_meetings`
- `favorite_meetings` (encrypted fields)
- `meeting_search_cache`

## Supabase

The cloud schema is defined in ordered SQL files under `supabase/migrations/`. RLS policies restrict access to the authenticated user. Supabase stores encrypted payloads only.

## Sync

Sync logic lives in `apps/mobile/src/services/syncService.ts`.

- All writes add a `sync_queue` item via `addToSyncQueue()`
- Deletes are processed before inserts/updates
- `supabase_id` is preserved for idempotent upserts

## Auth

Supabase Auth is configured in `apps/mobile/src/lib/supabase.ts`. Tokens are stored in SecureStore on mobile and encrypted storage on web.

## Notes

This is a privacy-first app. Never store or log plaintext sensitive data. Use `encryptContent()` before storage or sync.
