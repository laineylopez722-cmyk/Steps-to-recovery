# Contributing

Thanks for your interest in Steps to Recovery. This project is an early-stage, privacy-first recovery companion app. Contributions are welcome once the initial release stabilizes.

## Prerequisites

- Node.js 20+ (see `.nvmrc`)
- npm

## Setup

1. Install dependencies:
   - `npm install`
2. Create local env:
   - Copy `apps/mobile/.env.example` to `apps/mobile/.env`
3. Validate env:
   - `npm run validate-env`
4. Start the app:
   - `npm run mobile`

## Development Commands

- `npm run lint` - Lint all workspaces
- `npm run type-check` - TypeScript checks
- `npm run test` - Run tests
- `npm run test:encryption` (from `apps/mobile`) - Required after crypto changes
- `npm run format` - Prettier formatting

## Code Standards

- Encrypt-before-store for all sensitive data
- Use `logger` instead of `console.*`
- Keep SQLite as the source of truth; Supabase is a backup
- Follow adapter patterns for storage/secure storage

## Commit Messages

This repo uses Conventional Commits:

- `feat: add X`
- `fix: correct Y`
- `chore: update Z`

## Pull Requests

Please include:

- A clear summary of changes
- Tests run (or rationale if not run)
- Notes about any schema or encryption changes

## Security

Never log plaintext user data or encryption keys. See `SECURITY.md` for details.
