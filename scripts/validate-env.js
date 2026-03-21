// =============================================================================
// validate-env.js — Environment variable validation for Steps to Recovery
//
// Usage: node scripts/validate-env.js
//        npm run validate-env
//
// Validates that all required environment variables are present and
// well-formed before the app attempts to start. Provides actionable
// remediation steps when a variable is missing or malformed.
//
// Loads apps/mobile/.env via dotenv (same source as Expo), then falls back
// to variables already in process.env (e.g. CI secrets).
// =============================================================================

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const MOBILE_ENV_PATH = path.join(__dirname, '..', 'apps', 'mobile', '.env');
const envFileExists = fs.existsSync(MOBILE_ENV_PATH);

if (envFileExists) {
  dotenv.config({ path: MOBILE_ENV_PATH, quiet: true });
}

// ---------------------------------------------------------------------------
// Remediation messages — surfaced when a specific error type is detected
// ---------------------------------------------------------------------------
const REMEDIATION = {
  NO_ENV_FILE:
    'Create apps/mobile/.env from the example, then add Supabase values:\n' +
    '     Windows: copy apps\\mobile\\.env.example apps\\mobile\\.env\n' +
    '     macOS/Linux: cp apps/mobile/.env.example apps/mobile/.env\n' +
    '     Then fill in credentials from: https://supabase.com → your project → Settings → API',

  SUPABASE_URL_MISSING:
    'Set EXPO_PUBLIC_SUPABASE_URL in apps/mobile/.env\n' +
    '     Format: https://yourprojectid.supabase.co\n' +
    '     Get it from: Supabase Dashboard > Settings > API > Project URL',

  SUPABASE_URL_PLACEHOLDER:
    'Replace the placeholder value in apps/mobile/.env\n' +
    '     Get your real URL from: Supabase Dashboard > Settings > API > Project URL',

  SUPABASE_URL_INVALID:
    'EXPO_PUBLIC_SUPABASE_URL must be a valid HTTPS URL\n' +
    '     Format: https://yourprojectid.supabase.co',

  SUPABASE_URL_NOT_SUPABASE:
    'EXPO_PUBLIC_SUPABASE_URL does not match *.supabase.co\n' +
    '     If using a self-hosted Supabase instance this is expected.\n' +
    '     Otherwise check the URL in apps/mobile/.env.',

  SUPABASE_KEY_MISSING:
    'Set EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env\n' +
    '     Get it from: Supabase Dashboard > Settings > API > anon/public key',

  SUPABASE_KEY_PLACEHOLDER:
    'Replace the placeholder value in apps/mobile/.env\n' +
    '     Get your real anon key from: Supabase Dashboard > Settings > API',

  SUPABASE_KEY_INVALID:
    'EXPO_PUBLIC_SUPABASE_ANON_KEY must be a JWT (three dot-separated base64url segments)\n' +
    '     It starts with "eyJ" and looks like: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\n' +
    '     Get it from: Supabase Dashboard > Settings > API > anon/public key',
};

const required = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'];
const missing = required.filter((key) => !process.env[key] || process.env[key].trim() === '');

function looksLikePlaceholder(value) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes('your-project') ||
    normalized.includes('your-anon-key') ||
    normalized.includes('example.supabase.co')
  );
}

function isValidHttpUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isSupabaseUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.hostname.endsWith('.supabase.co') && parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isJwt(value) {
  if (!value) return false;
  // JWTs are three base64url segments separated by dots
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value.trim());
}

const invalid = [];
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (supabaseUrl) {
  if (looksLikePlaceholder(supabaseUrl)) {
    invalid.push('EXPO_PUBLIC_SUPABASE_URL (placeholder value detected)');
  } else if (!isValidHttpUrl(supabaseUrl)) {
    invalid.push('EXPO_PUBLIC_SUPABASE_URL (not a valid URL)');
  } else if (!isSupabaseUrl(supabaseUrl)) {
    // Warn but do not fail — allows non-standard Supabase setups (self-hosted, local dev)
    console.warn(
      '[validate-env] Warning: EXPO_PUBLIC_SUPABASE_URL does not match the expected *.supabase.co pattern.',
    );
    console.warn(`[validate-env] ${REMEDIATION.SUPABASE_URL_NOT_SUPABASE}`);
  }
}

if (supabaseAnonKey) {
  if (looksLikePlaceholder(supabaseAnonKey)) {
    invalid.push('EXPO_PUBLIC_SUPABASE_ANON_KEY (placeholder value detected)');
  } else if (!isJwt(supabaseAnonKey)) {
    invalid.push('EXPO_PUBLIC_SUPABASE_ANON_KEY (does not look like a JWT — check the value)');
  }
}

// Warn about missing optional variables without failing the build
const optional = [
  { key: 'EXPO_PUBLIC_SENTRY_DSN', description: 'Sentry error tracking (recommended for production)' },
];
for (const { key, description } of optional) {
  if (!process.env[key] || process.env[key].trim() === '') {
    console.warn(`[validate-env] Warning: ${key} is not set. ${description}`);
  }
}

if (missing.length > 0 || invalid.length > 0) {
  if (!envFileExists) {
    console.error(`[validate-env] Env file not found: ${MOBILE_ENV_PATH}`);
    console.error(`  Remedy: ${REMEDIATION.NO_ENV_FILE}`);
  }

  if (missing.length > 0) {
    console.error(`[validate-env] Missing required variables: ${missing.join(', ')}.`);

    for (const key of missing) {
      if (key === 'EXPO_PUBLIC_SUPABASE_URL') {
        console.error(`  Remedy: ${REMEDIATION.SUPABASE_URL_MISSING}`);
      } else if (key === 'EXPO_PUBLIC_SUPABASE_ANON_KEY') {
        console.error(`  Remedy: ${REMEDIATION.SUPABASE_KEY_MISSING}`);
      }
    }
  }

  if (invalid.length > 0) {
    console.error('[validate-env] Invalid or placeholder variables:');
    for (const item of invalid) {
      console.error(`  - ${item}`);

      if (item.includes('SUPABASE_URL') && item.includes('placeholder')) {
        console.error(`    Remedy: ${REMEDIATION.SUPABASE_URL_PLACEHOLDER}`);
      } else if (item.includes('SUPABASE_URL') && item.includes('not a valid URL')) {
        console.error(`    Remedy: ${REMEDIATION.SUPABASE_URL_INVALID}`);
      } else if (item.includes('SUPABASE_ANON_KEY') && item.includes('placeholder')) {
        console.error(`    Remedy: ${REMEDIATION.SUPABASE_KEY_PLACEHOLDER}`);
      } else if (item.includes('SUPABASE_ANON_KEY') && item.includes('JWT')) {
        console.error(`    Remedy: ${REMEDIATION.SUPABASE_KEY_INVALID}`);
      }
    }
  }

  console.error(
    '[validate-env] Optional: npm run doctor:toolchain (repo root). Full shell check: bash scripts/verify-setup.sh (macOS/Linux/WSL).',
  );
  process.exit(1);
}

const source = envFileExists ? `loaded ${path.relative(process.cwd(), MOBILE_ENV_PATH) || MOBILE_ENV_PATH}` : 'process.env';
console.log(`[validate-env] OK (${source})`);
