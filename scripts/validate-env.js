const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const root = path.resolve(__dirname, '..');
const envPaths = [
  path.join(root, 'apps', 'mobile', '.env.local'),
  path.join(root, 'apps', 'mobile', '.env'),
];

let loadedFromFile = false;
let loadedPath = '';
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const parsed = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
    loadedFromFile = true;
    loadedPath = envPath;
    break;
  }
}

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
    console.warn(
      '[validate-env] If using a self-hosted Supabase instance this is expected. Otherwise check the URL.',
    );
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
  const hint = loadedFromFile
    ? 'Check apps/mobile/.env values.'
    : 'Create apps/mobile/.env from apps/mobile/.env.example.';

  if (missing.length > 0) {
    console.error(`[validate-env] Missing required variables: ${missing.join(', ')}.`);
  }

  if (invalid.length > 0) {
    console.error(`[validate-env] Invalid or placeholder variables:`);
    for (const item of invalid) {
      console.error(`  - ${item}`);
    }
    console.error(
      '[validate-env] Obtain real values from Supabase Dashboard → Settings → API.',
    );
  }

  console.error(`[validate-env] ${hint}`);
  process.exit(1);
}

const source = loadedFromFile ? loadedPath : 'process.env';
console.log(`[validate-env] OK (${source})`);
