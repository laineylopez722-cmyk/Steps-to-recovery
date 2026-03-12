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

const invalid = [];
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (supabaseUrl && (looksLikePlaceholder(supabaseUrl) || !isValidHttpUrl(supabaseUrl))) {
  invalid.push('EXPO_PUBLIC_SUPABASE_URL');
}

if (supabaseAnonKey && looksLikePlaceholder(supabaseAnonKey)) {
  invalid.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

if (missing.length > 0 || invalid.length > 0) {
  const hint = loadedFromFile
    ? 'Check apps/mobile/.env values.'
    : 'Create apps/mobile/.env from apps/mobile/.env.example.';

  if (missing.length > 0) {
    console.error(`[validate-env] Missing required variables: ${missing.join(', ')}.`);
  }

  if (invalid.length > 0) {
    console.error(`[validate-env] Invalid or placeholder variables: ${invalid.join(', ')}.`);
    console.error('[validate-env] Replace template values with the real Supabase Project URL and anon/public key from Supabase Dashboard → Settings → API.');
  }

  console.error(`[validate-env] ${hint}`);
  process.exit(1);
}

const source = loadedFromFile ? loadedPath : 'process.env';
console.log(`[validate-env] OK (${source})`);
