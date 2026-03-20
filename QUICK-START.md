# Steps to Recovery — Quick Start

Five-minute guide from clone to running app. For full documentation see `SETUP.md`.

---

## First-Time Setup Flow

```
Clone repo
    |
    v
nvm use                    # Activate Node 20.19.4 from .nvmrc
    |
    | Node version mismatch?
    +---> nvm install 20.19.4 && nvm use
    |
    v
npm ci                     # Install exact dependency versions
    |
    | Install fails?
    +---> Check npm version: npm -v  (must be 11.x)
    |     Fix: npm install -g npm@11.8.0
    |
    v
bash scripts/verify-setup.sh   # Automated environment check
    |
    | [FAIL] .env missing?
    +---> cp apps/mobile/.env.example apps/mobile/.env
    |     Fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
    |
    | [FAIL] Supabase credentials invalid?
    +---> Go to supabase.com > your project > Settings > API
    |     Copy "Project URL" and "anon/public" key
    |
    | [FAIL] Node/npm version wrong?
    +---> See "Toolchain" section below
    |
    | [WARN] Sentry DSN missing?
    +---> Optional: add EXPO_PUBLIC_SENTRY_DSN to .env for error monitoring
    |
    v
npm run mobile             # Start Expo development server
    |
    v
Open Expo Go on your device and scan the QR code
  -- or --
Press 'a' for Android emulator
Press 'i' for iOS simulator (macOS only)
```

---

## Step-by-Step Commands

```bash
# 1. Clone the repository
git clone https://github.com/RipKDR/Steps-to-recovery.git
cd Steps-to-recovery

# 2. Activate the pinned Node version (requires nvm)
nvm use
#    If nvm is not installed: https://github.com/nvm-sh/nvm#installing-and-updating
#    If the version is not installed: nvm install 20.19.4 && nvm use

# 3. Install dependencies
npm ci

# 4. Run environment verification
bash scripts/verify-setup.sh
#    All items must show [OK] before proceeding.
#    Follow any [FAIL] remediation steps shown.

# 5. Create your .env file
cp apps/mobile/.env.example apps/mobile/.env
#    Edit the file and replace placeholder values with real Supabase credentials.
#    Get credentials from: https://supabase.com > your project > Settings > API

# 6. Run the app
npm run mobile
```

---

## Toolchain Requirements

| Tool | Required | Check | Fix |
|---|---|---|---|
| Node.js | 20.19.4 (exact) | `node --version` | `nvm install 20.19.4 && nvm use` |
| npm | 11.8.x | `npm --version` | `npm install -g npm@11.8.0` |
| nvm | Any | `nvm --version` | https://github.com/nvm-sh/nvm |
| Expo Go | Latest | App Store / Play Store | Install on physical device |

---

## Supabase Setup (First Time)

1. Create a free project at https://supabase.com
2. Open the SQL Editor and run `supabase-schema.sql` (base tables + RLS policies)
3. Run any `supabase/migrations/*.sql` files in numeric order
4. Copy credentials from Settings > API:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
5. Paste into `apps/mobile/.env`

---

## Common Error Paths

### "nvm: command not found"
Install nvm: https://github.com/nvm-sh/nvm#installing-and-updating
Then restart your shell and run `nvm use` again.

### "npm ERR! code ERESOLVE" during install
```bash
npm ci --legacy-peer-deps
```

### App shows blank screen / auth errors
- Verify `.env` values are real (not placeholders)
- Check Supabase project is active and schema is applied
- Run `npm run validate-env` for detailed diagnostics

### TypeScript errors after install
```bash
npm run type-check
# Fix each error before starting development
```

### Husky hooks not running
```bash
npm install && npx husky
```

---

## What's Running After Setup

| Service | Purpose | Command |
|---|---|---|
| Expo Metro bundler | JavaScript bundler + hot reload | `npm run mobile` |
| Supabase (cloud) | Auth, sync backend | Runs externally |
| SQLite (on device) | Offline-first local storage | Auto-initialized |

---

## Next Steps

- Read `CLAUDE.md` for full architecture, security patterns, and conventions
- Read `VERIFICATION-CHECKLIST.md` before opening your first PR
- Run `npm run verify:strict` before every PR
