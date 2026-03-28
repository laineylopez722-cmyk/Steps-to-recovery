# Legacy Maestro Scenarios (Archived)

This directory contains older, exploratory Maestro scenarios kept for historical reference.

## Canonical E2E Suite

Use `apps/mobile/.maestro/` as the source of truth for all active local and CI E2E runs.

- Active docs: `apps/mobile/.maestro/README.md`
- Active flow path: `apps/mobile/.maestro/flows/`
- Active npm scripts: `apps/mobile/package.json` (`e2e*` scripts)

## Important

Do **not** add new production E2E flows to this archived folder.
If you need a new automated E2E flow, add it under `.maestro/flows` instead.
