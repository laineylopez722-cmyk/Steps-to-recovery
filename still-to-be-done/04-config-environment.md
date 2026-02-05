# Configuration & Environment Issues

**Review Date**: 2026-02-06

---

## Overview

Configuration management is **mostly good** but has some gaps that could cause setup friction for new developers and deployment issues.

**Overall Grade**: B+

---

## 🔴 Critical Issues

### 1. Missing .env.example File

**Severity**: HIGH  
**Impact**: New developers don't know what environment variables are required

**Current State**:
- ✅ `.env` file exists (gitignored)
- ❌ `.env.example` file missing

**Why This Matters**:
- New team members can't set up project
- CI/CD pipelines need to know required variables
- Documentation is incomplete without example

**Recommended .env.example**:
```bash
# Supabase Configuration (REQUIRED)
# Get these from https://supabase.com/dashboard/project/_/settings/api
EXPO_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Sentry Configuration (Optional - Error Tracking)
# Get from https://sentry.io
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=your-org-name
SENTRY_PROJECT=mobile

# Expo Configuration
EXPO_PUBLIC_APP_ENVIRONMENT=development

# Development Settings (Optional)
EXPO_PUBLIC_API_TIMEOUT_MS=30000
EXPO_PUBLIC_ENABLE_DEBUG_LOGGING=true

# ========================================
# IMPORTANT NOTES:
# ========================================
# 1. Copy this file to .env and fill in your values
# 2. NEVER commit .env to git (it's in .gitignore)
# 3. Supabase anon key is SAFE to expose (protected by RLS)
# 4. Sentry DSN is SAFE to expose (it's a public endpoint)
# 5. For production builds, use EAS Secrets:
#    eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "..."
```

**Action Items**:
- [ ] Create `.env.example` in `apps/mobile/`
- [ ] Document all required variables
- [ ] Add setup instructions to README.md
- [ ] Add to PR template: "Did you update .env.example?"

---

### 2. Environment Validation Not Run at Startup

**Severity**: MEDIUM  
**Impact**: App may crash with cryptic errors if env vars missing

**Current State**:
- ✅ Validation script exists: `scripts/validate-env.js`
- ❌ Not called automatically at app startup
- ❌ Not run in CI/CD pipeline

**Example Failure**:
```bash
# User forgets to set EXPO_PUBLIC_SUPABASE_URL
npm start
# App crashes with: "TypeError: Cannot read property 'from' of undefined"
# vs.
# Better error: "Missing required env var: EXPO_PUBLIC_SUPABASE_URL"
```

**Recommended Fix**:

**Option A**: Validate in app entry point
```typescript
// apps/mobile/index.ts (or App.tsx)
import { validateEnv } from './scripts/validate-env';

// Validate before rendering app
const envErrors = validateEnv();
if (envErrors.length > 0) {
  console.error('Environment validation failed:');
  envErrors.forEach(error => console.error(`  - ${error}`));
  // Show error screen instead of crashing
  throw new Error('Invalid environment configuration');
}
```

**Option B**: Validate in npm scripts
```json
// package.json
{
  "scripts": {
    "start": "npm run validate-env && expo start",
    "validate-env": "node scripts/validate-env.js"
  }
}
```

**Action Items**:
- [ ] Implement env validation at startup
- [ ] Add to CI/CD pipeline
- [ ] Document in CONTRIBUTING.md

---

## 🟡 High-Priority Issues

### 3. TypeScript Config Gaps

**Issue**: Some strictness options disabled  
**File**: `apps/mobile/tsconfig.json`

**Current Config**:
```json
{
  "compilerOptions": {
    "strict": true,                      // ✅ Good
    "noUncheckedIndexedAccess": false,   // ❌ Should be true
    "exactOptionalPropertyTypes": false, // ❌ Should be true
    "allowJs": false                     // ✅ Good
  }
}
```

**Why These Matter**:

**`noUncheckedIndexedAccess: true`**:
```typescript
const entries = data['journal_entries'];
// Current: entries is JournalEntry[]
// With flag: entries is JournalEntry[] | undefined (safer)
```

**`exactOptionalPropertyTypes: true`**:
```typescript
interface Entry {
  title?: string;
}

// Current: Can assign undefined explicitly
const entry: Entry = { title: undefined }; // Allowed but wrong

// With flag: Only omit or assign string
const entry: Entry = {};                   // Correct
const entry: Entry = { title: "My Entry" }; // Correct
const entry: Entry = { title: undefined };  // Error (good!)
```

**Recommendation**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,    // Enable
    "exactOptionalPropertyTypes": true,  // Enable
    "allowJs": false
  }
}
```

**Impact**: May require fixing ~10-20 type errors across codebase

**Action Items**:
- [ ] Enable `noUncheckedIndexedAccess`
- [ ] Enable `exactOptionalPropertyTypes`
- [ ] Fix resulting type errors
- [ ] Add to CONTRIBUTING.md standards

---

### 4. Expo Config Missing Key Fields

**Issue**: Some recommended fields missing from app.json  
**File**: `apps/mobile/app.json`

**Missing Fields**:
```json
{
  "expo": {
    // ❌ Missing privacy policy URL (required for App Store)
    "privacy": "https://example.com/privacy",
    
    // ❌ Missing terms of service URL (required for App Store)
    "termsOfServiceUrl": "https://example.com/terms",
    
    // ❌ Missing support email (recommended)
    "supportUrl": "https://example.com/support",
    
    // ❌ Missing app description (used in stores)
    "description": "A privacy-first recovery companion app",
    
    // ❌ Missing keywords (for App Store search)
    "keywords": ["recovery", "sobriety", "12-step", "journal", "addiction"]
  }
}
```

**Why This Matters**:
- App Store rejects apps without privacy policy
- Users need support contact
- SEO/discoverability in app stores

**Action Items**:
- [ ] Host privacy policy (draft exists in `docs/PRIVACY_POLICY.md`)
- [ ] Host terms of service (draft exists in `docs/TERMS_OF_SERVICE.md`)
- [ ] Add URLs to app.json
- [ ] Set up support email/website

---

### 5. EAS Configuration Incomplete

**Issue**: EAS build configuration needs environment-specific settings  
**File**: `eas.json` (not found in repo)

**Current State**:
- ✅ EAS project ID in app.json
- ❌ No `eas.json` configuration file

**Recommended `eas.json`**:
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_APP_ENVIRONMENT": "staging"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_APP_ENVIRONMENT": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      },
      "android": {
        "serviceAccountKeyPath": "./android-upload-key.json",
        "track": "internal"
      }
    }
  }
}
```

**Action Items**:
- [ ] Create `eas.json` configuration
- [ ] Set up EAS Secrets for production env vars
- [ ] Document build process in DEPLOYMENT.md

---

## 🟠 Medium-Priority Issues

### 6. Package.json Scripts Missing

**Issue**: Common development tasks don't have npm scripts  
**File**: `apps/mobile/package.json`

**Missing Scripts**:
```json
{
  "scripts": {
    // ❌ Missing: Run encryption tests specifically
    // "test:encryption": "jest src/utils/__tests__/encryption.test.ts",
    
    // ❌ Missing: Watch mode for development
    // "test:watch": "jest --watch",
    
    // ❌ Missing: Generate coverage report
    // "test:coverage": "jest --coverage",
    
    // ❌ Missing: Type check only (no build)
    // "type-check": "tsc --noEmit",
    
    // ❌ Missing: Lint with auto-fix
    // "lint:fix": "eslint src --ext .ts,.tsx --fix",
    
    // ❌ Missing: Pre-commit checks
    // "pre-commit": "npm run type-check && npm run lint && npm test"
  }
}
```

**Recommendation**: Add these scripts

**Action Items**:
- [ ] Add missing npm scripts
- [ ] Document in CONTRIBUTING.md
- [ ] Set up pre-commit hooks (husky)

---

### 7. Dependency Version Ranges Too Loose

**Issue**: Some dependencies use caret (^) ranges instead of exact versions  
**Risk**: Unexpected breaking changes in patch/minor updates

**Examples**:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.93.3",     // ❌ Could update to 2.94.x
    "@tanstack/react-query": "^5.90.15",    // ❌ Could update to 5.91.x
    "lucide-react-native": "^0.563.0"       // ❌ Could update to 0.564.x
  }
}
```

**Recommendation**: Use exact versions for critical dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "2.93.3",      // ✅ Exact version
    "@tanstack/react-query": "5.90.15",     // ✅ Exact version
    "lucide-react-native": "0.563.0"        // ✅ Exact version
  }
}
```

**Why**: React Native apps are sensitive to version mismatches. Using exact versions prevents surprise breakage.

**Action Items**:
- [ ] Pin critical dependencies to exact versions
- [ ] Use Dependabot or Renovate for automated updates
- [ ] Test updates in separate PRs

---

### 8. Metro Config Not Optimized

**Issue**: Metro bundler config could be optimized for faster builds  
**File**: `metro.config.js` (default Expo config used)

**Potential Optimizations**:
```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable symlinks for monorepo
config.watchFolders = [
  __dirname,
  path.resolve(__dirname, '../../packages/shared'),
];

// Enable Hermes bytecode caching (faster reload)
config.transformer.unstable_enableRenameClasses = true;

// Exclude unnecessary files from watching
config.resolver.blockList = [
  /.*\/__tests__\/.*/,
  /.*\.test\.ts$/,
  /.*\.spec\.ts$/,
];

module.exports = config;
```

**Action Items**:
- [ ] Create custom Metro config
- [ ] Benchmark build times before/after
- [ ] Document in performance docs

---

## 🟢 Good Configuration Practices

### ✅ Well-Configured:
1. **TypeScript Strict Mode**: Enabled
2. **Path Aliases**: Configured (`@/` prefixes)
3. **Git Ignore**: Comprehensive `.gitignore`
4. **Turbo Repo**: Properly configured for monorepo
5. **Expo Plugins**: All required plugins configured

### ✅ Security Best Practices:
1. **Secrets Not Committed**: `.env` in `.gitignore`
2. **Expo Public Prefix**: Used for client-side env vars
3. **Supabase Anon Key**: Safe to expose (protected by RLS)

---

## Configuration Checklist

### Pre-Launch (P0):
- [ ] Create `.env.example` with all required vars
- [ ] Add env validation at startup
- [ ] Add privacy policy URL to app.json
- [ ] Add terms of service URL to app.json
- [ ] Set up support email/contact

### Post-Launch (P1):
- [ ] Enable `noUncheckedIndexedAccess` in tsconfig
- [ ] Enable `exactOptionalPropertyTypes` in tsconfig
- [ ] Create `eas.json` for build configuration
- [ ] Pin critical dependencies to exact versions
- [ ] Add missing npm scripts

### Optimization (P2):
- [ ] Optimize Metro config for faster builds
- [ ] Set up Dependabot for automated updates
- [ ] Create staging/production environments
- [ ] Document deployment process

---

## Environment Variable Audit

### Required Variables (MUST SET):
```bash
EXPO_PUBLIC_SUPABASE_URL=          # Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon key (safe to expose)
```

### Optional Variables (RECOMMENDED):
```bash
SENTRY_DSN=                        # Error tracking (production)
EXPO_PUBLIC_APP_ENVIRONMENT=       # development|staging|production
```

### Secret Variables (EAS SECRETS ONLY, NOT .env):
```bash
# These should NEVER be in .env files
# Use: eas secret:create --name VAR_NAME --value "secret"
SUPABASE_SERVICE_ROLE_KEY=         # Server-only (NOT in mobile app)
APP_STORE_API_KEY=                 # For automated submissions
GOOGLE_PLAY_API_KEY=               # For automated submissions
```

---

## Configuration Validation Script

**Recommended**: Add this to project:

```typescript
// scripts/validate-env.ts
import 'dotenv/config';

const REQUIRED_VARS = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
];

const OPTIONAL_VARS = [
  'SENTRY_DSN',
  'EXPO_PUBLIC_APP_ENVIRONMENT',
];

function validateEnv(): string[] {
  const errors: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      errors.push(`Missing required env var: ${varName}`);
    }
  }

  // Validate URL format
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    errors.push('EXPO_PUBLIC_SUPABASE_URL must start with https://');
  }

  // Warn about optional variables
  for (const varName of OPTIONAL_VARS) {
    if (!process.env[varName]) {
      console.warn(`Optional env var not set: ${varName}`);
    }
  }

  return errors;
}

const errors = validateEnv();
if (errors.length > 0) {
  console.error('❌ Environment validation failed:');
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log('✅ Environment variables validated successfully');
```

**Action Items**:
- [ ] Create validation script
- [ ] Add to `npm start` script
- [ ] Add to CI/CD pipeline

---

## Deployment Configuration

### iOS Configuration (app.json):
```json
{
  "ios": {
    "bundleIdentifier": "com.recovery.stepstorecovery",
    "buildNumber": "1",
    "infoPlist": {
      "NSLocationAlwaysAndWhenInUseUsageDescription": "...",
      "NSLocationWhenInUseUsageDescription": "...",
      "NSFaceIDUsageDescription": "...",
      "UIBackgroundModes": ["location", "fetch", "processing"]
    }
  }
}
```

**Status**: ✅ GOOD - All required permissions configured

### Android Configuration (app.json):
```json
{
  "android": {
    "package": "com.recovery.stepstorecovery",
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "POST_NOTIFICATIONS",
      "USE_BIOMETRIC"
    ],
    "blockedPermissions": [
      "RECORD_AUDIO",       // ✅ Blocked - not used
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE"
    ]
  }
}
```

**Status**: ✅ GOOD - Minimal permissions requested

---

## Summary of Configuration Issues

### Critical (Fix Before Launch):
1. Missing `.env.example` - HIGH PRIORITY
2. No env validation at startup - MEDIUM PRIORITY
3. Missing privacy/terms URLs in app.json - HIGH PRIORITY

### Important (Fix Soon):
1. TypeScript strictness options disabled
2. Missing EAS configuration
3. Package.json scripts incomplete

### Nice to Have (Optimize Later):
1. Dependency versions too loose
2. Metro config not optimized
3. Deployment docs incomplete

---

**Bottom Line**: Configuration is **mostly good** but has some critical gaps (`.env.example`, env validation, privacy URLs) that must be addressed before launch.
