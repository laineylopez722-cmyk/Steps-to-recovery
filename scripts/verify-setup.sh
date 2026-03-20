#!/usr/bin/env bash
# =============================================================================
# verify-setup.sh - Developer environment validation for Steps to Recovery
#
# Usage: bash scripts/verify-setup.sh
#
# Checks that the local environment matches all requirements before development.
# Outputs green checkmarks for passing checks and red X for failures, each with
# an actionable remediation step.
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Color helpers — fall back gracefully when not in a terminal
# ---------------------------------------------------------------------------
if [ -t 1 ] && command -v tput &>/dev/null; then
  RED=$(tput setaf 1)
  GREEN=$(tput setaf 2)
  YELLOW=$(tput setaf 3)
  CYAN=$(tput setaf 6)
  BOLD=$(tput bold)
  RESET=$(tput sgr0)
else
  RED=""
  GREEN=""
  YELLOW=""
  CYAN=""
  BOLD=""
  RESET=""
fi

# ---------------------------------------------------------------------------
# Tracking state
# ---------------------------------------------------------------------------
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass() {
  local label="$1"
  printf "  ${GREEN}%s${RESET} %s\n" "[OK]" "$label"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  local label="$1"
  local remedy="$2"
  printf "  ${RED}%s${RESET} %s\n" "[FAIL]" "$label"
  printf "        ${YELLOW}Fix:${RESET} %s\n" "$remedy"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

warn() {
  local label="$1"
  local note="$2"
  printf "  ${YELLOW}%s${RESET} %s\n" "[WARN]" "$label"
  printf "        ${YELLOW}Note:${RESET} %s\n" "$note"
  WARN_COUNT=$((WARN_COUNT + 1))
}

section() {
  printf "\n${BOLD}${CYAN}%s${RESET}\n" "$1"
}

# ---------------------------------------------------------------------------
# Resolve monorepo root (directory that contains this script's parent)
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

printf "\n${BOLD}Steps to Recovery — Environment Verification${RESET}\n"
printf "Root: %s\n" "$ROOT_DIR"

# ===========================================================================
# 1. Node.js version
# ===========================================================================
section "1. Node.js"

NVMRC_PATH="$ROOT_DIR/.nvmrc"
REQUIRED_NODE_VERSION=""

if [ -f "$NVMRC_PATH" ]; then
  REQUIRED_NODE_VERSION=$(tr -d '[:space:]' < "$NVMRC_PATH")
fi

if command -v node &>/dev/null; then
  CURRENT_NODE=$(node --version | sed 's/^v//')
  CURRENT_NODE_MAJOR=$(echo "$CURRENT_NODE" | cut -d. -f1)

  if [ -n "$REQUIRED_NODE_VERSION" ]; then
    REQUIRED_MAJOR=$(echo "$REQUIRED_NODE_VERSION" | cut -d. -f1)
    if [ "$CURRENT_NODE" = "$REQUIRED_NODE_VERSION" ]; then
      pass "Node.js v$CURRENT_NODE (exact match with .nvmrc)"
    elif [ "$CURRENT_NODE_MAJOR" = "$REQUIRED_MAJOR" ]; then
      warn "Node.js v$CURRENT_NODE (patch differs from .nvmrc v$REQUIRED_NODE_VERSION)" \
           "Run: nvm install $REQUIRED_NODE_VERSION && nvm use"
    else
      fail "Node.js version mismatch — expected v$REQUIRED_NODE_VERSION, found v$CURRENT_NODE" \
           "Run: nvm install $REQUIRED_NODE_VERSION && nvm use"
    fi
  else
    # No .nvmrc — just check >= 20
    if [ "$CURRENT_NODE_MAJOR" -ge 20 ] 2>/dev/null; then
      pass "Node.js v$CURRENT_NODE (>= 20.x)"
    else
      fail "Node.js v$CURRENT_NODE is below minimum v20" \
           "Run: nvm install 20 && nvm use 20"
    fi
  fi
else
  fail "Node.js not found" \
       "Install nvm then run: nvm install $REQUIRED_NODE_VERSION && nvm use"
fi

# ===========================================================================
# 2. npm version
# ===========================================================================
section "2. npm"

ROOT_PKG="$ROOT_DIR/package.json"
REQUIRED_NPM=""

if [ -f "$ROOT_PKG" ] && command -v node &>/dev/null; then
  # Extract packageManager field value, e.g. "npm@11.8.0"
  # Use readFileSync so the path is read at the OS level — avoids /c/... resolution issues on Windows/Git Bash
  REQUIRED_NPM=$(node -e "
    try {
      const fs = require('fs');
      const raw = fs.readFileSync(process.argv[1], 'utf8');
      const p = JSON.parse(raw);
      const f = p.packageManager || '';
      const m = f.match(/^npm@(\S+)/);
      process.stdout.write(m ? m[1] : '');
    } catch(e) {
      process.stdout.write('');
    }
  " "$ROOT_PKG" 2>/dev/null || true)
fi

if command -v npm &>/dev/null; then
  CURRENT_NPM=$(npm --version 2>/dev/null || echo "unknown")
  if [ -n "$REQUIRED_NPM" ]; then
    REQUIRED_NPM_MAJOR=$(echo "$REQUIRED_NPM" | cut -d. -f1)
    CURRENT_NPM_MAJOR=$(echo "$CURRENT_NPM" | cut -d. -f1)
    if [ "$CURRENT_NPM" = "$REQUIRED_NPM" ]; then
      pass "npm v$CURRENT_NPM (exact match with packageManager field)"
    elif [ "$CURRENT_NPM_MAJOR" = "$REQUIRED_NPM_MAJOR" ]; then
      warn "npm v$CURRENT_NPM (patch differs from required v$REQUIRED_NPM)" \
           "Run: npm install -g npm@$REQUIRED_NPM"
    else
      fail "npm version mismatch — expected v$REQUIRED_NPM, found v$CURRENT_NPM" \
           "Run: npm install -g npm@$REQUIRED_NPM"
    fi
  else
    pass "npm v$CURRENT_NPM (no version constraint found)"
  fi
else
  fail "npm not found" \
       "Install Node.js from https://nodejs.org (includes npm)"
fi

# ===========================================================================
# 3. .env file and required variables
# ===========================================================================
section "3. Environment variables"

ENV_PATH="$ROOT_DIR/apps/mobile/.env"
ENV_LOCAL_PATH="$ROOT_DIR/apps/mobile/.env.local"
ENV_EXAMPLE_PATH="$ROOT_DIR/apps/mobile/.env.example"

EFFECTIVE_ENV=""
if [ -f "$ENV_LOCAL_PATH" ]; then
  EFFECTIVE_ENV="$ENV_LOCAL_PATH"
elif [ -f "$ENV_PATH" ]; then
  EFFECTIVE_ENV="$ENV_PATH"
fi

if [ -n "$EFFECTIVE_ENV" ]; then
  pass ".env file found: $EFFECTIVE_ENV"
else
  if [ -f "$ENV_EXAMPLE_PATH" ]; then
    fail ".env file missing at apps/mobile/.env" \
         "Run: cp apps/mobile/.env.example apps/mobile/.env  then fill in real values"
  else
    fail ".env file missing at apps/mobile/.env" \
         "Create apps/mobile/.env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY"
  fi
fi

# Check individual variables when the file exists
if [ -n "$EFFECTIVE_ENV" ]; then
  # Source variable values without executing arbitrary code
  SUPABASE_URL=$(grep -E '^EXPO_PUBLIC_SUPABASE_URL=' "$EFFECTIVE_ENV" | cut -d= -f2- | tr -d '[:space:]' || true)
  SUPABASE_KEY=$(grep -E '^EXPO_PUBLIC_SUPABASE_ANON_KEY=' "$EFFECTIVE_ENV" | cut -d= -f2- | tr -d '[:space:]' || true)

  # Validate SUPABASE_URL
  if [ -z "$SUPABASE_URL" ]; then
    fail "EXPO_PUBLIC_SUPABASE_URL is empty" \
         "Set it in $EFFECTIVE_ENV — get the value from Supabase Dashboard > Settings > API"
  elif echo "$SUPABASE_URL" | grep -qiE 'your-project|example\.supabase\.co'; then
    fail "EXPO_PUBLIC_SUPABASE_URL still contains placeholder value" \
         "Replace the placeholder with your real Supabase project URL"
  elif ! echo "$SUPABASE_URL" | grep -qE '^https://'; then
    fail "EXPO_PUBLIC_SUPABASE_URL does not start with https://" \
         "Check the value in $EFFECTIVE_ENV — format: https://yourproject.supabase.co"
  else
    pass "EXPO_PUBLIC_SUPABASE_URL is set and looks valid"
  fi

  # Validate SUPABASE_ANON_KEY (must be a JWT: three base64url segments)
  if [ -z "$SUPABASE_KEY" ]; then
    fail "EXPO_PUBLIC_SUPABASE_ANON_KEY is empty" \
         "Set it in $EFFECTIVE_ENV — get the value from Supabase Dashboard > Settings > API"
  elif echo "$SUPABASE_KEY" | grep -qiE 'your-anon-key'; then
    fail "EXPO_PUBLIC_SUPABASE_ANON_KEY still contains placeholder value" \
         "Replace the placeholder with your real Supabase anon key (a JWT starting with eyJ)"
  elif ! echo "$SUPABASE_KEY" | grep -qE '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$'; then
    fail "EXPO_PUBLIC_SUPABASE_ANON_KEY does not look like a JWT" \
         "The anon key must be a JWT (three dot-separated base64url segments). Check Supabase Dashboard > Settings > API"
  else
    pass "EXPO_PUBLIC_SUPABASE_ANON_KEY is set and looks like a valid JWT"
  fi

  # Optional: Sentry DSN
  SENTRY_DSN=$(grep -E '^EXPO_PUBLIC_SENTRY_DSN=' "$EFFECTIVE_ENV" | cut -d= -f2- | tr -d '[:space:]' || true)
  if [ -z "$SENTRY_DSN" ]; then
    warn "EXPO_PUBLIC_SENTRY_DSN is not set (optional)" \
         "Add it for production error monitoring — see SETUP.md > Sentry section"
  else
    pass "EXPO_PUBLIC_SENTRY_DSN is set"
  fi
fi

# ===========================================================================
# 4. node_modules installed
# ===========================================================================
section "4. Dependencies"

ROOT_NM="$ROOT_DIR/node_modules"
MOBILE_NM="$ROOT_DIR/apps/mobile/node_modules"

# Check for a handful of key packages instead of just the directory
KEY_PACKAGES=(
  "@tanstack/react-query"
  "expo"
  "react-native"
  "typescript"
  "husky"
)

ALL_PKGS_OK=true
MISSING_PKGS=()

for pkg in "${KEY_PACKAGES[@]}"; do
  # Packages can live in root node_modules or workspace node_modules
  if [ ! -d "$ROOT_NM/$pkg" ] && [ ! -d "$MOBILE_NM/$pkg" ]; then
    ALL_PKGS_OK=false
    MISSING_PKGS+=("$pkg")
  fi
done

if $ALL_PKGS_OK; then
  pass "node_modules installed (key packages verified)"
else
  fail "Missing packages: ${MISSING_PKGS[*]}" \
       "Run: npm install  (from the repo root)"
fi

# ===========================================================================
# 5. Git hooks (husky)
# ===========================================================================
section "5. Git hooks"

HUSKY_DIR="$ROOT_DIR/.husky"
if [ -d "$HUSKY_DIR" ]; then
  # Check at least one hook script exists
  HOOK_COUNT=$(find "$HUSKY_DIR" -maxdepth 1 -type f | wc -l | tr -d '[:space:]')
  if [ "$HOOK_COUNT" -gt 0 ]; then
    pass "Husky git hooks installed ($HOOK_COUNT hook files found)"
  else
    warn "Husky directory exists but contains no hook files" \
         "Run: npx husky  (from the repo root)"
  fi
else
  fail "Husky hooks not installed (.husky/ directory missing)" \
       "Run: npm install && npx husky  (from the repo root)"
fi

# ===========================================================================
# 6. TypeScript — basic compilation check
# ===========================================================================
section "6. TypeScript"

TSC_BIN="$ROOT_DIR/node_modules/.bin/tsc"
MOBILE_TSCONFIG="$ROOT_DIR/apps/mobile/tsconfig.json"

if [ ! -f "$TSC_BIN" ]; then
  warn "tsc not found in node_modules/.bin" \
       "Run: npm install  to ensure typescript is installed"
else
  if [ -f "$MOBILE_TSCONFIG" ]; then
    # Run tsc in noEmit mode; capture exit code without letting set -e kill us
    TSC_OUTPUT=$(cd "$ROOT_DIR/apps/mobile" && "$TSC_BIN" --noEmit 2>&1) && TSC_EXIT=0 || TSC_EXIT=$?
    if [ "$TSC_EXIT" -eq 0 ]; then
      pass "TypeScript compilation passed (apps/mobile)"
    else
      ERROR_COUNT=$(echo "$TSC_OUTPUT" | grep -cE 'error TS' || true)
      fail "TypeScript reports $ERROR_COUNT error(s) in apps/mobile" \
           "Run: cd apps/mobile && npx tsc --noEmit  to see full details"
    fi
  else
    warn "apps/mobile/tsconfig.json not found — skipping TypeScript check" \
         "Ensure tsconfig.json exists in apps/mobile/"
  fi
fi

# ===========================================================================
# 7. ESLint — basic execution check
# ===========================================================================
section "7. ESLint"

ESLINT_BIN="$ROOT_DIR/node_modules/.bin/eslint"
MOBILE_SRC="$ROOT_DIR/apps/mobile/src"
ESLINT_CFG="$ROOT_DIR/eslint.config.js"

if [ ! -f "$ESLINT_BIN" ]; then
  warn "eslint not found in node_modules/.bin" \
       "Run: npm install  to ensure eslint is installed"
else
  if [ -d "$MOBILE_SRC" ] && [ -f "$ESLINT_CFG" ]; then
    # Lint a single small file to verify ESLint is runnable; full lint via npm run lint
    LINT_PROBE=$(find "$MOBILE_SRC" -name "*.ts" -not -path "*/__tests__/*" | head -1)
    if [ -n "$LINT_PROBE" ]; then
      LINT_OUTPUT=$(cd "$ROOT_DIR" && "$ESLINT_BIN" "$LINT_PROBE" 2>&1) && LINT_EXIT=0 || LINT_EXIT=$?
      if [ "$LINT_EXIT" -eq 0 ]; then
        pass "ESLint runs successfully (probe: $(basename "$LINT_PROBE"))"
      elif [ "$LINT_EXIT" -eq 1 ]; then
        warn "ESLint found warnings/errors in probe file ($(basename "$LINT_PROBE"))" \
             "Run: npm run lint  for the full report"
      else
        fail "ESLint exited with error code $LINT_EXIT (configuration issue?)" \
             "Run: npm run lint  to see the full error; check eslint.config.js"
      fi
    else
      warn "No .ts source files found under apps/mobile/src — skipping ESLint probe" \
           "Verify the src directory is populated"
    fi
  else
    warn "ESLint config or src directory missing — skipping ESLint probe" \
         "Ensure eslint.config.js and apps/mobile/src/ exist"
  fi
fi

# ===========================================================================
# Summary
# ===========================================================================
TOTAL=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))
printf "\n%s\n" "─────────────────────────────────────────────"
printf "${BOLD}Results:${RESET} %d checked — ${GREEN}%d passed${RESET}, ${YELLOW}%d warnings${RESET}, ${RED}%d failed${RESET}\n" \
  "$TOTAL" "$PASS_COUNT" "$WARN_COUNT" "$FAIL_COUNT"

if [ "$FAIL_COUNT" -eq 0 ] && [ "$WARN_COUNT" -eq 0 ]; then
  printf "\n${GREEN}${BOLD}Setup complete! You are ready to develop.${RESET}\n"
  printf "Run: ${CYAN}npm run mobile${RESET} to start the Expo dev server.\n\n"
  exit 0
elif [ "$FAIL_COUNT" -eq 0 ]; then
  printf "\n${YELLOW}${BOLD}Setup is functional with %d warning(s). See above for details.${RESET}\n" "$WARN_COUNT"
  printf "Run: ${CYAN}npm run mobile${RESET} to start the Expo dev server.\n\n"
  exit 0
else
  printf "\n${RED}${BOLD}%d issue(s) must be resolved before development. See the Fix hints above.${RESET}\n\n" "$FAIL_COUNT"
  exit 1
fi
