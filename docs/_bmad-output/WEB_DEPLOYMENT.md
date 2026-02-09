# Web Deployment Guide - Steps to Recovery

**Last Updated**: 2026-01-01
**Status**: Requires Adaptation ⚠️
**Effort**: 12-16 hours

---

## Current State

The Steps to Recovery app is built with **React Native + Expo**, which CAN run on web via `react-native-web`, BUT uses native modules that need web equivalents.

### Native Modules Used (Need Web Polyfills)
- ❌ **expo-sqlite**: No web equivalent (uses IndexedDB polyfill)
- ❌ **expo-secure-store**: No web equivalent (uses Web Crypto API)
- ❌ **expo-notifications**: Limited web support (Web Push API)
- ⚠️ **@react-native-community/netinfo**: Partial web support
- ⚠️ **expo-location**: Web Geolocation API available

---

## Option 1: Adapt Existing App for Web (Recommended)

**Effort**: 12-16 hours
**Approach**: Platform-specific implementations with web polyfills

### Architecture Changes Required

#### 1. Storage Layer Abstraction
**Current**: Direct SQLite usage
**Web**: Create storage adapter pattern

```typescript
// src/utils/storage.ts
interface StorageAdapter {
  getAllAsync<T>(query: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T>(query: string, params?: any[]): Promise<T | null>;
  runAsync(query: string, params?: any[]): Promise<void>;
}

// Platform-specific implementations
class SQLiteAdapter implements StorageAdapter {
  // Mobile: expo-sqlite
}

class IndexedDBAdapter implements StorageAdapter {
  // Web: IndexedDB with SQL.js
}

export const storage = Platform.OS === 'web'
  ? new IndexedDBAdapter()
  : new SQLiteAdapter();
```

#### 2. Secure Storage Abstraction
**Current**: expo-secure-store
**Web**: Web Crypto API + localStorage (encrypted)

```typescript
// src/utils/secureStorage.ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Use Web Crypto API + encrypted localStorage
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return await webDecrypt(encrypted);
    }
    return SecureStore.getItemAsync(key);
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      const encrypted = await webEncrypt(value);
      localStorage.setItem(key, encrypted);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
};
```

### Required Dependencies
```bash
npm install --save \
  sql.js \
  idb \
  @react-native-async-storage/async-storage \
  react-native-web \
  react-dom
```

### Step-by-Step Implementation

#### Step 1: Install Web Dependencies (1 hour)
```bash
cd apps/mobile
npm install --save-dev @expo/webpack-config
npm install sql.js idb
```

#### Step 2: Create Storage Adapters (4 hours)
Files to create:
- `src/adapters/storage/index.ts` - Platform selector
- `src/adapters/storage/sqlite.ts` - Mobile (existing code)
- `src/adapters/storage/indexeddb.ts` - Web (new)
- `src/adapters/storage/types.ts` - Shared interface

#### Step 3: Create Secure Storage Adapter (2 hours)
Files to create:
- `src/adapters/secureStorage/index.ts`
- `src/adapters/secureStorage/native.ts`
- `src/adapters/secureStorage/web.ts`

#### Step 4: Update All Database Calls (3 hours)
Replace:
```typescript
// OLD
const db = useSQLiteContext();
const entries = await db.getAllAsync('SELECT * FROM...');

// NEW
import { storage } from '../adapters/storage';
const entries = await storage.getAllAsync('SELECT * FROM...');
```

Files to update:
- All hooks in `src/features/*/hooks/`
- `src/services/syncService.ts`
- `src/utils/database.ts`

#### Step 5: Handle Web-Specific UI (2 hours)
- Responsive design (desktop vs mobile)
- Remove mobile-only features (haptics, notifications)
- Add web-specific features (PWA manifest)

#### Step 6: Test & Deploy (1 hour)
```bash
npm run web
npm run build:web  # Creates static site
```

---

## Option 2: Separate Web App (Alternative)

**Effort**: 20-30 hours
**Approach**: Build dedicated Next.js/React web app

### Pros
- Optimized for web (better SEO, performance)
- No polyfill complexity
- Web-native features (better PWA support)

### Cons
- Duplicate code maintenance
- Separate codebase
- More effort upfront

### Tech Stack
- **Framework**: Next.js 14 (React Server Components)
- **Database**: Supabase (direct, no SQLite)
- **State**: React Query + Zustand
- **Auth**: Supabase Auth
- **Encryption**: Web Crypto API (native)

### Shared Code
Use monorepo packages:
- `packages/shared` - Business logic, types, utilities
- `apps/mobile` - React Native app
- `apps/web` - Next.js web app

---

## Recommended Approach

### For MVP: Mobile-Only ✅
**Reasoning**:
- Recovery apps are personal/private (mobile-first use case)
- Offline-first architecture works best on mobile
- 53% faster to market (no web adaptation needed)

**Next Steps**:
1. Launch mobile apps (iOS + Android)
2. Gather user feedback
3. Assess web demand
4. Build web app if needed (Option 2)

### For Web Support: Option 1 (Adapt)
**If web is required now**:
- Implement storage adapters (12-16 hours)
- Test thoroughly (web storage is less reliable)
- Deploy as PWA (installable web app)

---

## Web Deployment (If Adapted)

### 1. Build for Web
```bash
cd apps/mobile
npm run build:web

# Output: web-build/ directory (static site)
```

### 2. Deploy to Netlify (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd apps/mobile
netlify deploy --dir=web-build --prod
```

**Configuration** (`netlify.toml`):
```toml
[build]
  command = "npm run build:web"
  publish = "web-build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Deploy to Vercel (Alternative)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd apps/mobile
vercel --prod
```

### 4. Deploy to Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize
firebase init hosting

# Deploy
npm run build:web
firebase deploy --only hosting
```

---

## Progressive Web App (PWA)

### Enable PWA Features
```javascript
// app.json
{
  "expo": {
    "web": {
      "favicon": "./assets/favicon.png",
      "name": "Steps to Recovery",
      "shortName": "Recovery",
      "description": "Your recovery companion",
      "themeColor": "#4F8FC0",
      "backgroundColor": "#ffffff",
      "display": "standalone",
      "orientation": "portrait"
    }
  }
}
```

### Service Worker (Offline Support)
Expo web builds include service worker automatically for:
- Asset caching
- Offline fallback
- Install prompt

---

## Web-Specific Considerations

### 1. Encryption Keys
**Problem**: Web doesn't have secure hardware keystore
**Solution**:
- Use Web Crypto API's `subtle.crypto`
- Store derived key in IndexedDB (encrypted)
- Require password re-entry for key access

### 2. Offline Data Sync
**Problem**: IndexedDB less reliable than SQLite
**Solution**:
- More aggressive sync strategy
- User-visible sync status
- Data export feature (backup)

### 3. Responsive Design
**Current**: Mobile-only (375-430px width)
**Web**: Support 768px (tablet), 1024px+ (desktop)

```typescript
// Use responsive breakpoints
const isDesktop = useMediaQuery('(min-width: 1024px)');
const isTablet = useMediaQuery('(min-width: 768px)');
```

### 4. Browser Compatibility
**Target**: Chrome, Firefox, Safari, Edge (last 2 versions)
**Polyfills Needed**:
- IndexedDB (for old browsers)
- Web Crypto API (Safari quirks)
- CSS Grid/Flexbox (IE11 if supported)

---

## Testing Web Build Locally

```bash
cd apps/mobile

# Development
npm run web

# Production build
npm run build:web

# Serve locally
npx serve web-build
```

**Test Checklist**:
- [ ] Authentication works
- [ ] Encryption works (Web Crypto API)
- [ ] Data persists (IndexedDB)
- [ ] Sync works (Supabase)
- [ ] Offline mode works (Service Worker)
- [ ] Responsive on mobile/tablet/desktop
- [ ] PWA installable

---

## Performance Optimization (Web)

### 1. Code Splitting
```typescript
// Lazy load routes
const JournalEditor = lazy(() => import('./features/journal/screens/JournalEditorScreen'));
```

### 2. Image Optimization
```bash
# Use WebP format
# Implement lazy loading
# Add srcset for responsive images
```

### 3. Bundle Size
**Target**: <500 KB initial JS bundle
**Techniques**:
- Tree shaking
- Remove unused dependencies
- Lazy load heavy components

---

## Cost Estimate (Web Hosting)

### Free Tier Options
- **Netlify**: 100 GB bandwidth/month (free)
- **Vercel**: 100 GB bandwidth/month (free)
- **Firebase**: 10 GB storage, 360 MB/day transfer (free)

### Paid (If Needed)
- **Netlify Pro**: $19/month
- **Vercel Pro**: $20/month
- **Firebase Blaze**: Pay-as-you-go

**Recommendation**: Start with Netlify free tier

---

## Summary

### Mobile App (Current) ✅
- **Status**: Production ready
- **Platform**: iOS + Android
- **Deploy**: EAS build → App Stores
- **Effort**: Complete

### Web App (Future) ⏸️
- **Status**: Requires adaptation
- **Effort**: 12-16 hours (Option 1) or 20-30 hours (Option 2)
- **Recommendation**: Launch mobile first, add web if needed
- **Deploy**: Netlify/Vercel when ready

---

## Quick Start (If Pursuing Web Now)

```bash
# 1. Install dependencies
cd apps/mobile
npm install sql.js idb react-native-web react-dom

# 2. Test current web build
npm run web

# 3. Create storage adapters (see Step 2 above)

# 4. Update database calls (see Step 4 above)

# 5. Build and deploy
npm run build:web
netlify deploy --dir=web-build --prod
```

**Estimated Timeline**: 1-2 weeks part-time

---

## Resources

- **Expo Web**: https://docs.expo.dev/workflow/web/
- **react-native-web**: https://necolas.github.io/react-native-web/
- **IndexedDB**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Web Crypto API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API

---

**Recommendation**: Focus on mobile launch first (production ready now), then evaluate web demand before investing 12-16 hours in web adaptation.
