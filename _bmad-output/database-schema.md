# Database Schema Reference

_Complete schema for Steps-to-Recovery local SQLite and Supabase cloud databases._

**Schema Version**: 9 (SQLite) | **Supabase Project**: `tbiunmmvfbakwlzykpwq`

---

## SQLite Local Storage (15 tables)

### user_profile

| Column | Type | Constraints | Encrypted |
|--------|------|-------------|-----------|
| id | TEXT | PK | ❌ |
| encrypted_email | TEXT | NOT NULL | ✅ |
| sobriety_start_date | TEXT | NOT NULL | ❌ |
| created_at | TEXT | NOT NULL | ❌ |
| updated_at | TEXT | NOT NULL | ❌ |

### journal_entries

| Column | Type | Constraints | Encrypted |
|--------|------|-------------|-----------|
| id | TEXT | PK | ❌ |
| user_id | TEXT | NOT NULL, FK(user_profile) | ❌ |
| encrypted_title | TEXT | | ✅ |
| encrypted_body | TEXT | NOT NULL | ✅ |
| encrypted_mood | TEXT | | ✅ |
| encrypted_craving | TEXT | | ✅ |
| encrypted_tags | TEXT | | ✅ |
| created_at | TEXT | NOT NULL | ❌ |
| updated_at | TEXT | NOT NULL | ❌ |
| sync_status | TEXT | DEFAULT 'pending' | ❌ |
| supabase_id | TEXT | | ❌ |

Indexes: `idx_journal_user`, `idx_journal_created` | Sync: ✅

### daily_checkins

| Column | Type | Constraints | Encrypted |
|--------|------|-------------|-----------|
| id | TEXT | PK | ❌ |
| user_id | TEXT | NOT NULL, FK(user_profile) | ❌ |
| check_in_type | TEXT | CHECK('morning'\|'evening') | ❌ |
| check_in_date | TEXT | NOT NULL | ❌ |
| encrypted_intention | TEXT | | ✅ |
| encrypted_reflection | TEXT | | ✅ |
| encrypted_mood | TEXT | | ✅ |
| encrypted_craving | TEXT | | ✅ |
| encrypted_gratitude | TEXT | Added v6 | ✅ |
| created_at | TEXT | NOT NULL | ❌ |
| updated_at | TEXT | DEFAULT NOW() | ❌ |
| sync_status | TEXT | DEFAULT 'pending' | ❌ |
| supabase_id | TEXT | Added v1 | ❌ |

Indexes: `idx_checkin_user`, `idx_checkin_date` | Sync: ✅

### step_work

| Column | Type | Constraints | Encrypted |
|--------|------|-------------|-----------|
| id | TEXT | PK | ❌ |
| user_id | TEXT | NOT NULL, FK(user_profile) | ❌ |
| step_number | INTEGER | CHECK(1-12) | ❌ |
| question_number | INTEGER | NOT NULL | ❌ |
| encrypted_answer | TEXT | | ✅ |
| is_complete | INTEGER | DEFAULT 0 | ❌ |
| completed_at | TEXT | | ❌ |
| created_at | TEXT | NOT NULL | ❌ |
| updated_at | TEXT | NOT NULL | ❌ |
| sync_status | TEXT | DEFAULT 'pending' | ❌ |
| supabase_id | TEXT | Added v4 | ❌ |

Unique: `(user_id, step_number, question_number)` | Sync: ✅

### achievements

| Column | Type | Constraints | Encrypted |
|--------|------|-------------|-----------|
| id | TEXT | PK | ❌ |
| user_id | TEXT | NOT NULL, FK(user_profile) | ❌ |
| achievement_key | TEXT | NOT NULL | ❌ |
| achievement_type | TEXT | NOT NULL | ❌ |
| earned_at | TEXT | NOT NULL | ❌ |
| is_viewed | INTEGER | DEFAULT 0 | ❌ |

Unique: `(user_id, achievement_key)`

### sync_queue

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| table_name | TEXT | NOT NULL |
| record_id | TEXT | NOT NULL |
| operation | TEXT | CHECK('insert'\|'update'\|'delete') |
| supabase_id | TEXT | Added v1 |
| created_at | TEXT | NOT NULL |
| retry_count | INTEGER | DEFAULT 0 |
| last_error | TEXT | |
| failed_at | TEXT | Added v2 |

Unique: `(table_name, record_id, operation)`

### cached_meetings (v3)

Public meeting data — not encrypted, not synced.

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| name | TEXT | NOT NULL |
| location | TEXT | NOT NULL |
| address | TEXT | NOT NULL |
| city | TEXT | |
| state | TEXT | |
| postal_code | TEXT | |
| country | TEXT | |
| latitude | REAL | NOT NULL |
| longitude | REAL | NOT NULL |
| day_of_week | INTEGER | |
| time | TEXT | |
| types | TEXT | |
| notes | TEXT | |
| cached_at | TEXT | NOT NULL |
| cache_region | TEXT | NOT NULL |
| created_at | TEXT | NOT NULL |
| updated_at | TEXT | NOT NULL |

### favorite_meetings (v3)

| Column | Type | Constraints | Encrypted |
|--------|------|-------------|-----------|
| id | TEXT | PK | ❌ |
| user_id | TEXT | NOT NULL | ❌ |
| meeting_id | TEXT | NOT NULL, FK(cached_meetings) | ❌ |
| encrypted_notes | TEXT | | ✅ |
| notification_enabled | INTEGER | DEFAULT 0 | ❌ |
| created_at | TEXT | NOT NULL | ❌ |
| sync_status | TEXT | DEFAULT 'pending' | ❌ |
| supabase_id | TEXT | | ❌ |

Unique: `(user_id, meeting_id)` | Sync: ✅

### meeting_search_cache (v3)

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| user_id | TEXT | NOT NULL |
| latitude | REAL | NOT NULL |
| longitude | REAL | NOT NULL |
| radius_miles | INTEGER | DEFAULT 10 |
| last_updated | TEXT | NOT NULL |

### daily_readings (v5)

Static content — not encrypted.

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| day_of_year | INTEGER | UNIQUE, CHECK(1-366) |
| month | INTEGER | CHECK(1-12) |
| day | INTEGER | CHECK(1-31) |
| title | TEXT | NOT NULL |
| content | TEXT | NOT NULL |
| source | TEXT | NOT NULL |
| reflection_prompt | TEXT | NOT NULL |
| created_at | TEXT | NOT NULL |

### reading_reflections (v5)

| Column | Type | Constraints | Encrypted |
|--------|------|-------------|-----------|
| id | TEXT | PK | ❌ |
| user_id | TEXT | NOT NULL | ❌ |
| reading_id | TEXT | NOT NULL, FK(daily_readings) | ❌ |
| reading_date | TEXT | NOT NULL | ❌ |
| encrypted_reflection | TEXT | NOT NULL | ✅ |
| word_count | INTEGER | DEFAULT 0 | ❌ |
| created_at | TEXT | NOT NULL | ❌ |
| updated_at | TEXT | NOT NULL | ❌ |
| sync_status | TEXT | DEFAULT 'pending' | ❌ |
| supabase_id | TEXT | | ❌ |

Unique: `(user_id, reading_date)` | Sync: ✅

### sponsor_connections (v7 + v9 sync)

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| user_id | TEXT | NOT NULL |
| role | TEXT | CHECK('sponsee'\|'sponsor') |
| status | TEXT | CHECK('pending'\|'connected') |
| invite_code | TEXT | NOT NULL |
| display_name | TEXT | |
| own_public_key | TEXT | |
| peer_public_key | TEXT | |
| shared_key | TEXT | |
| pending_private_key | TEXT | |
| created_at | TEXT | NOT NULL |
| updated_at | TEXT | NOT NULL |
| sync_status | TEXT | Added v9 |
| supabase_id | TEXT | Added v9 |

Unique: `(user_id, invite_code, role)` | Sync: ✅ (v9+)

### sponsor_shared_entries (v7 + v9 sync)

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| user_id | TEXT | NOT NULL |
| connection_id | TEXT | NOT NULL, FK(sponsor_connections) |
| direction | TEXT | CHECK('outgoing'\|'incoming'\|'comment') |
| journal_entry_id | TEXT | |
| payload | TEXT | NOT NULL |
| created_at | TEXT | NOT NULL |
| updated_at | TEXT | NOT NULL |
| sync_status | TEXT | Added v9 |
| supabase_id | TEXT | Added v9 |

Sync: ✅ (v9+)

### weekly_reports (v8 + v9 sync)

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| user_id | TEXT | NOT NULL |
| week_start | TEXT | NOT NULL |
| week_end | TEXT | NOT NULL |
| report_json | TEXT | NOT NULL |
| created_at | TEXT | NOT NULL |
| sync_status | TEXT | Added v9 |
| supabase_id | TEXT | Added v9 |

Unique: `(user_id, week_start)` | Sync: ✅ (v9+)

### schema_migrations

| Column | Type | Constraints |
|--------|------|-------------|
| version | INTEGER | PK |
| applied_at | TEXT | NOT NULL |

---

## Migration History

| Version | Feature | Key Changes |
|---------|---------|-------------|
| 0 | Base schema | user_profile, journal_entries, daily_checkins, step_work, achievements, sync_queue |
| 1 | Sync IDs | Added supabase_id to daily_checkins, sync_queue |
| 2 | Retry tracking | Added failed_at to sync_queue |
| 3 | Meeting finder | cached_meetings, favorite_meetings, meeting_search_cache |
| 4 | Step sync | Added supabase_id to step_work |
| 5 | Daily readings | daily_readings, reading_reflections |
| 6 | Gratitude | Added encrypted_gratitude to daily_checkins |
| 7 | Sponsor | sponsor_connections, sponsor_shared_entries |
| 8 | Weekly reports | weekly_reports |
| 9 | Sponsor sync | Added sync_status + supabase_id to sponsor_connections, sponsor_shared_entries, weekly_reports |

---

## Migration Pattern

```typescript
const CURRENT_SCHEMA_VERSION = 9;

// Guard pattern for ALTER TABLE
if (!(await columnExists(db, 'table_name', 'new_column'))) {
  await db.runAsync('ALTER TABLE table_name ADD COLUMN new_column TEXT');
}

// Always use CREATE TABLE IF NOT EXISTS for base tables
// Record migration: INSERT INTO schema_migrations (version, applied_at)
```

---

## Supabase Cloud Tables

All tables have RLS enabled with `auth.uid() = user_id` policy pattern.

### profiles, journal_entries, step_work, sponsorships

_(Base schema — see supabase-schema.sql)_

### Additional Cloud Tables

- favorite_meetings, reading_reflections, daily_checkins, weekly_reports
- sponsor_connections, sponsor_shared_entries
- risky_contacts, close_calls (Safe Dial feature)
- sponsor_notifications (Risk Detection)
- crisis_checkpoints (Before You Use feature)
- ai_usage, user_ai_settings (AI Companion)

---

## Sync-Tracked Tables

Tables with `sync_status` + `supabase_id` columns:

- journal_entries, daily_checkins, step_work
- reading_reflections, favorite_meetings
- sponsor_connections, sponsor_shared_entries, weekly_reports (v9+)

**Sync status values**: `pending` | `synced` | `error`

---

## Encrypted Fields Summary

| Table | Encrypted Columns |
|-------|-------------------|
| user_profile | encrypted_email |
| journal_entries | encrypted_title, encrypted_body, encrypted_mood, encrypted_craving, encrypted_tags |
| daily_checkins | encrypted_intention, encrypted_reflection, encrypted_mood, encrypted_craving, encrypted_gratitude |
| step_work | encrypted_answer |
| reading_reflections | encrypted_reflection |
| favorite_meetings | encrypted_notes |
