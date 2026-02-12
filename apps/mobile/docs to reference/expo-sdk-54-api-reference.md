# Expo SDK 54 API Reference — Steps to Recovery

> Quick reference for all Expo SDK 54 APIs used in this project.
> Last updated: 2026-02-12

## Version Matrix

| Package | Version | Platform Support |
|---------|---------|-----------------|
| expo | ~54.0.33 | Android, iOS, Web |
| react-native | 0.81.5 | Android, iOS |
| react | 19.1.0 | All |
| react-native-web | ~0.21.0 | Web |
| Node.js minimum | 20.19.x | Build |

## Core Packages Used

### expo-sqlite (~16.0.10)
- **Purpose**: Local offline-first database storage
- **Platform**: Android, iOS, macOS, tvOS, Web (alpha via WASM)
- **Key APIs**: `openDatabaseAsync()`, `runAsync()`, `getAllAsync()`, `getFirstAsync()`, `getEachAsync()`, `withTransactionAsync()`, `withExclusiveTransactionAsync()`, `prepareAsync()`
- **Config Plugin Options**:
  - `enableFTS: true` — Enables FTS3/FTS4/FTS5 full-text search
  - `useSQLCipher: false` — Database-level encryption (consider enabling)
  - `withSQLiteVecExtension: false` — Vector search extension
- **Web Setup**: Requires WASM support in Metro + `Cross-Origin-Embedder-Policy` / `Cross-Origin-Opener-Policy` headers
- **Best Practices**:
  - Enable WAL journal mode: `PRAGMA journal_mode = WAL`
  - Use prepared statements for user input (SQL injection prevention)
  - Use `withExclusiveTransactionAsync()` for isolated transactions
  - Use `SQLiteProvider` with `useSuspense` for React Suspense integration

### expo-secure-store (~15.0.8)
- **Purpose**: Encryption key storage (Keychain on iOS, Keystore on Android)
- **Platform**: Android, iOS (NOT web — requires fallback)
- **Key APIs**: `getItemAsync()`, `setItemAsync()`, `deleteItemAsync()`
- **Limits**: Values must be ≤2048 bytes
- **Web Fallback**: Must use encrypted localStorage/IndexedDB
- **Critical Rule**: ALL encryption keys MUST use SecureStore, never AsyncStorage

### expo-notifications (~0.32.16)
- **Purpose**: Push notifications & local reminders
- **Platform**: Android (device only), iOS (device only)
- **Key APIs**:
  - `scheduleNotificationAsync()` — Schedule local notifications
  - `getExpoPushTokenAsync()` — Get Expo push token
  - `setNotificationHandler()` — Handle foreground notifications
  - `addNotificationReceivedListener()` — Listen for incoming
  - `addNotificationResponseReceivedListener()` — Handle taps
- **Trigger Types** (SDK 54):
  - `SchedulableTriggerInputTypes.TIME_INTERVAL` — After N seconds
  - `SchedulableTriggerInputTypes.CALENDAR` — At specific date/time
  - `SchedulableTriggerInputTypes.DAILY` — Daily recurring
  - `null` — Immediate
- **Android Requirements**: Must create notification channel before requesting permissions (Android 13+)
- **Config Plugin**: `icon`, `color`, `defaultChannel`, `sounds`, `enableBackgroundRemoteNotifications`

### expo-location (~19.0.8)
- **Purpose**: Meeting finder, geofencing reminders
- **Platform**: Android, iOS, Web
- **Key APIs**:
  - `requestForegroundPermissionsAsync()` — Foreground location
  - `requestBackgroundPermissionsAsync()` — Background (geofencing)
  - `getCurrentPositionAsync()` — One-time location
  - `getLastKnownPositionAsync()` — Quick cached location
  - `startGeofencingAsync()` — Register geofence regions
  - `startLocationUpdatesAsync()` — Background tracking
- **Geofencing Limits**: Android: 100 regions, iOS: 20 regions
- **Background Config**: iOS requires `UIBackgroundModes: ["location"]`, Android requires `ACCESS_BACKGROUND_LOCATION`
- **Config Plugin**: `isAndroidBackgroundLocationEnabled: true`, `locationAlwaysAndWhenInUsePermission`

### expo-local-authentication (~17.0.8)
- **Purpose**: Biometric app lock (FaceID/TouchID/Fingerprint)
- **Platform**: Android, iOS (NOT web)
- **Key APIs**:
  - `authenticateAsync()` — Prompt biometric auth
  - `hasHardwareAsync()` — Check biometric hardware
  - `isEnrolledAsync()` — Check enrolled biometrics
  - `supportedAuthenticationTypesAsync()` — List auth methods
  - `getEnrolledLevelAsync()` — Security level (NONE/SECRET/BIOMETRIC_WEAK/BIOMETRIC_STRONG)
- **Options**: `promptMessage`, `cancelLabel`, `disableDeviceFallback`, `biometricsSecurityLevel`
- **iOS Note**: FaceID requires development build (not Expo Go) + `NSFaceIDUsageDescription` in Info.plist

### expo-haptics (~15.0.8)
- **Purpose**: Tactile feedback on interactions
- **Platform**: Android, iOS (NOT web — use no-op fallback)
- **Key APIs**:
  - `impactAsync(style)` — Light/Medium/Heavy/Rigid/Soft
  - `notificationAsync(type)` — Success/Error/Warning
  - `selectionAsync()` — Selection change feedback
- **Usage Rule**: ALL button/tab presses must include haptic feedback

### expo-image (~3.0.11)
- **Purpose**: Performant cross-platform image loading
- **Platform**: Android, iOS, tvOS, Web
- **Features**: Disk/memory caching, BlurHash/ThumbHash placeholders, CSS object-fit/position, animated images
- **Supported Formats**: WebP, PNG/APNG, AVIF, HEIC (not web), JPEG, GIF, SVG, ICO
- **Key Props**: `contentFit`, `placeholder`, `cachePolicy`, `transition`, `accessibilityLabel`
- **Best Practice**: Use instead of React Native `Image` for better performance

### expo-router (~6.0.23)
- **Purpose**: File-based navigation
- **Platform**: Android, iOS, Web
- **Core Concepts**:
  - All routes are files in `app/` directory
  - All pages have URLs (universal deep linking)
  - `_layout.tsx` files define navigation structure
  - `index.tsx` is the initial route
  - Route groups `(name)` don't affect URL
- **Key APIs**: `useRouter()`, `useLocalSearchParams()`, `useSegments()`, `<Link>`, `<Redirect>`
- **Navigation Types**: Stack (default), Tabs, Drawer

### expo-updates (~29.0.16)
- **Purpose**: Over-the-air updates
- **Platform**: Android, iOS, tvOS
- **Key APIs**:
  - `checkForUpdateAsync()` — Check for new updates
  - `fetchUpdateAsync()` — Download available update
  - `reloadAsync()` — Apply downloaded update
- **Config**: `checkAutomatically`, `fallbackToCacheTimeout`, `runtimeVersion`
- **Testing**: Only works in release builds, not development

### expo-task-manager (~14.0.9)
- **Purpose**: Background task execution (geofencing, sync)
- **Platform**: Android, iOS
- **Key APIs**:
  - `defineTask(name, executor)` — Register background task (must be top-level)
  - `isTaskRegisteredAsync(name)` — Check if task exists
  - `unregisterTaskAsync(name)` — Remove task
- **Usage**: Tasks must be defined at module scope (not inside components)

### expo-blur (~15.0.8)
- **Purpose**: Glass effect overlays
- **Platform**: Android, iOS, tvOS, Web
- **Component**: `<BlurView intensity={} tint="light|dark|default">`

### expo-linear-gradient (~15.0.8)
- **Purpose**: Gradient backgrounds
- **Platform**: Android, iOS, tvOS, Web
- **Component**: `<LinearGradient colors={[]} start={{x,y}} end={{x,y}}>`

### expo-clipboard (~8.0.8)
- **Purpose**: Copy/paste functionality
- **Key APIs**: `setStringAsync()`, `getStringAsync()`

### expo-sharing (~14.0.8)
- **Purpose**: Share files/content
- **Key APIs**: `shareAsync(url, options)`

### expo-print (~15.0.8)
- **Purpose**: PDF generation (data export)
- **Key APIs**: `printToFileAsync()`, `printAsync()`

### expo-sms (~14.0.8)
- **Purpose**: Emergency SMS
- **Key APIs**: `sendSMSAsync(addresses, message)`

### expo-web-browser (~15.0.10)
- **Purpose**: In-app browser (OAuth, external links)
- **Key APIs**: `openBrowserAsync()`, `openAuthSessionAsync()`

### expo-splash-screen (~31.0.13)
- **Purpose**: App launch screen
- **Key APIs**: `preventAutoHideAsync()`, `hideAsync()`
- **Config Plugin**: `backgroundColor`, `image`, `imageWidth`

## React Native Companion Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| react-native-reanimated | ~4.1.1 | Performant animations |
| react-native-gesture-handler | ~2.28.0 | Touch gestures |
| react-native-screens | ~4.16.0 | Native navigation primitives |
| react-native-safe-area-context | ~5.6.0 | Safe area insets |
| react-native-svg | 15.12.1 | SVG rendering |
| @shopify/flash-list | 2.0.2 | Performant list rendering |
| @react-native-community/netinfo | 11.4.1 | Network state detection |
| @react-native-community/datetimepicker | 8.4.4 | Date/time picker |
| @react-native-community/slider | 5.0.1 | Slider input |

## State Management

| Library | Version | Purpose |
|---------|---------|---------|
| @tanstack/react-query | ^5.90.15 | Server state, caching |
| zustand | ^5.0.9 | Client state |
| react-hook-form | ^7.71.1 | Form state |
| zod | ^4.3.6 | Schema validation |

## Security Stack

| Library | Version | Purpose |
|---------|---------|---------|
| crypto-js | ^4.2.0 | AES-256-CBC encryption |
| expo-secure-store | ~15.0.8 | Key storage |
| expo-crypto | ~15.0.8 | Crypto primitives |
| @supabase/supabase-js | ^2.93.3 | Auth + RLS |

## Build & Deploy

| Tool | Purpose |
|------|---------|
| EAS Build | Cloud builds for iOS/Android |
| EAS Update | OTA JavaScript updates |
| EAS Submit | App Store/Play Store submission |
| @sentry/react-native | ~7.2.0 | Error tracking |
