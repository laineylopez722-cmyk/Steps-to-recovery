# Copilot Instructions — Steps to Recovery

## Big picture (privacy & offline-first)

- Encrypt-before-store: sensitive inputs go through `encryptContent()` → local DB → sync queue → Supabase (still encrypted). See [apps/mobile/src/utils/encryption.ts](../apps/mobile/src/utils/encryption.ts) and [apps/mobile/src/services/syncService.ts](../apps/mobile/src/services/syncService.ts).
- SQLite/IndexedDB is the source of truth; cloud is backup-only. Use adapters from [apps/mobile/src/adapters/storage/](../apps/mobile/src/adapters/storage/) and secure keys from [apps/mobile/src/adapters/secureStorage/](../apps/mobile/src/adapters/secureStorage/).
- Provider order matters: Database → Auth → Sync → Notifications (see [apps/mobile/src/contexts/DatabaseContext.tsx](../apps/mobile/src/contexts/DatabaseContext.tsx), [apps/mobile/src/contexts/AuthContext.tsx](../apps/mobile/src/contexts/AuthContext.tsx), [apps/mobile/src/contexts/SyncContext.tsx](../apps/mobile/src/contexts/SyncContext.tsx)).

## Repo structure & imports

- Monorepo: mobile app in [apps/mobile/](../apps/mobile/) and shared types/utils in [packages/shared/](../packages/shared/).
- Path alias in mobile: `@/` → apps/mobile/src (prefer absolute imports). Use `import type` for types.

## Critical workflows (commands)

- Start app: `npm run mobile` (root) or `npm start` inside apps/mobile.
- Platform runs: `npm run android` / `npm run ios` (root) or within apps/mobile.
- Tests: `npm test` (root). Encryption changes require `npm run test:encryption` (apps/mobile).
- Lint/type-check: `npm run lint` (root) and `npx tsc --noEmit` (apps/mobile).

## Data & sync conventions

- Any syncable write must call `addToSyncQueue()` or `addDeleteToSyncQueue()` and set `sync_status` to `pending` (see [apps/mobile/src/services/syncService.ts](../apps/mobile/src/services/syncService.ts)).
- Preserve `supabase_id` for idempotent upserts (see [apps/mobile/src/services/syncService.ts](../apps/mobile/src/services/syncService.ts)).
- Local ↔ Supabase field mappings are documented in [supabase-schema.sql](../supabase-schema.sql) and [supabase-migration-daily-checkins.sql](../supabase-migration-daily-checkins.sql).

## Database migrations (local + cloud)

- Increment `CURRENT_SCHEMA_VERSION` and add a migration in `runMigrations()` with `columnExists()` checks in [apps/mobile/src/utils/database.ts](../apps/mobile/src/utils/database.ts).
- Update cloud schema files (see [supabase-schema.sql](../supabase-schema.sql)) and verify RLS policies.

## Code conventions unique to this repo

- Strict TypeScript: explicit return types; avoid `any`.
- Logging: use `logger` from [apps/mobile/src/utils/logger.ts](../apps/mobile/src/utils/logger.ts); never `console.*` for sensitive data.
- UI: NativeWind classes + design tokens; see [apps/mobile/src/design-system/](../apps/mobile/src/design-system/) and `cn()` helper in [apps/mobile/src/lib/utils.ts](../apps/mobile/src/lib/utils.ts).
- React Query for server state; Zustand for client UI state (stores live in [apps/mobile/src/store/](../apps/mobile/src/store/)).

## Environment & setup

- Create apps/mobile/.env from apps/mobile/.env.example with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Supabase project ref: `tbiunmmvfbakwlzykpwq`.

## Reference docs

- Architecture/deep guidance: [CLAUDE.md](../CLAUDE.md) and [\_bmad-output/reference-docs/SYSTEM-CONTEXT.md](../_bmad-output/reference-docs/SYSTEM-CONTEXT.md).
- Coding standards: [\_bmad-output/reference-docs/CODING-STANDARDS.md](../_bmad-output/reference-docs/CODING-STANDARDS.md).
