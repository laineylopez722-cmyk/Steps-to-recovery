# Expo SDK 54 API Quick Reference

> For Steps to Recovery app development. Current: SDK ~54.0.0, React 19.1.0, RN 0.81.5

## Version Matrix

| Expo SDK | React Native | React   | RN Web  | Min Node |
| -------- | ------------ | ------- | ------- | -------- |
| 54.0.0   | 0.81         | 19.1.0  | 0.21.0  | 20.19.x  |

## Platform Support

| Platform        | Android | compileSdk | targetSdk | iOS    | Xcode  |
| --------------- | ------- | ---------- | --------- | ------ | ------ |
| SDK 54          | 7+      | 36         | 36        | 15.1+  | 16.1+  |

---

## Packages Used in This App

### expo-sqlite (~16.0.10)
- **Platforms**: Android, iOS, macOS, tvOS, Web (alpha)
- **Key APIs**: `openDatabaseAsync()`, `runAsync()`, `getAllAsync()`, `getFirstAsync()`, `getEachAsync()`
- **Prepared Statements**: `prepareAsync()` → `executeAsync()` → `finalizeAsync()`
- **Transactions**: `withTransactionAsync()`, `withExclusiveTransactionAsync()`
- **Provider**: `<SQLiteProvider>` with `useSQLiteContext()` hook
- **Config Plugin**: `enableFTS: true`, `useSQLCipher: false`, `withSQLiteVecExtension: false`
- **Web Setup**: Requires Metro wasm config + COEP/COOP headers for SharedArrayBuffer
- **Best Practice**: Enable WAL journal mode: `PRAGMA journal_mode = WAL`

### expo-secure-store (~15.0.8)
- **Platforms**: Android, iOS
- **Key APIs**: `getItemAsync(key)`, `setItemAsync(key, value)`, `deleteItemAsync(key)`
- **Storage**: iOS Keychain / Android Keystore (hardware-backed when available)
- **Limits**: Values must be ≤2048 bytes (use chunking for larger data)
- **Usage**: Encryption keys, auth tokens — NEVER use AsyncStorage for these

### expo-notifications (~0.32.16)
- **Platforms**: Android (device only), iOS (device only)
- **Key APIs**:
  - `scheduleNotificationAsync({ content, trigger })`
  - `getExpoPushTokenAsync({ projectId })`
  - `setNotificationHandler()` — controls foreground behavior
  - `addNotificationReceivedListener()` / `addNotificationResponseReceivedListener()`
- **Trigger Types**: `TIME_INTERVAL`, `CALENDAR`, `DAILY` (via SchedulableTriggerInputTypes)
- **Android**: Requires notification channel creation before token request (Android 13+)
- **Config Plugin**: `icon`, `color`, `defaultChannel`, `sounds`, `enableBackgroundRemoteNotifications`
- **Push Notifications**: Require development build (not Expo Go on Android SDK 53+)

### expo-audio (~1.1.1)
- **Replaces**: expo-av (deprecated in SDK 54, removed in SDK 55)
- **Playback**: `useAudioPlayer(source, options)` → `player.play()`, `player.seekTo()`
- **Recording**: `useAudioRecorder(preset)` → `recorder.prepareToRecordAsync()`, `recorder.record()`, `recorder.stop()`
- **Status**: `useAudioPlayerStatus(player)`, `useAudioRecorderState(recorder)`
- **Background iOS**: Requires `UIBackgroundModes: ["audio"]` in Info.plist
- **Presets**: `RecordingPresets.HIGH_QUALITY`, `RecordingPresets.LOW_QUALITY`

### expo-local-authentication (~17.0.8)
- **Platforms**: Android, iOS
- **Key APIs**:
  - `authenticateAsync(options)` — biometric or device passcode prompt
  - `hasHardwareAsync()` — check for biometric scanner
  - `isEnrolledAsync()` — check for enrolled biometrics
  - `supportedAuthenticationTypesAsync()` — [FINGERPRINT, FACIAL_RECOGNITION, IRIS]
- **Security Levels**: `weak` (Class 2+3), `strong` (Class 3 only)
- **FaceID**: Requires `NSFaceIDUsageDescription` in Info.plist; NOT available in Expo Go
- **Config Plugin**: `faceIDPermission` string

### expo-location (~19.0.8)
- **Platforms**: Android, iOS, Web
- **Foreground**: `requestForegroundPermissionsAsync()`, `getCurrentPositionAsync()`
- **Background**: `requestBackgroundPermissionsAsync()`, `startLocationUpdatesAsync()`
- **Geofencing**: `startGeofencingAsync()` — Android: 100 max, iOS: 20 max
- **Background Config**: iOS requires `UIBackgroundModes: ["location"]` + `isIosBackgroundLocationEnabled: true`
- **Deferred Updates**: `deferredUpdatesDistance`, `deferredUpdatesInterval` (battery saving)

### expo-task-manager (~14.0.9)
- **Key API**: `TaskManager.defineTask(taskName, taskExecutor)` — must be at top-level scope
- **Usage**: Background location updates, geofencing events
- **Pattern**: Define task → Register with Location/Notifications → Handle in executor

### expo-haptics (~15.0.8)
- **Platforms**: Android, iOS
- **Feedback Types**:
  - `selectionAsync()` — light selection tap
  - `notificationAsync(type)` — Success, Error, Warning
  - `impactAsync(style)` — Light, Medium, Heavy, Rigid, Soft

### expo-updates (~29.0.16)
- **OTA Updates**: Remote JS bundle updates without app store submission
- **Config**: `updates.url`, `runtimeVersion`, `checkAutomatically`
- **Methods**: `checkForUpdateAsync()`, `fetchUpdateAsync()`, `reloadAsync()`
- **Testing**: Most methods only work in release builds

### Other Packages in Use
| Package | Version | Purpose |
|---------|---------|---------|
| expo-background-fetch | ~14.0.9 | Background task scheduling |
| expo-blur | ~15.0.8 | Blur effects for modals |
| expo-clipboard | ~8.0.8 | Copy/paste functionality |
| expo-constants | ~18.0.13 | App config constants |
| expo-crypto | ~15.0.8 | Cryptographic operations |
| expo-image | ~3.0.11 | Optimized image loading |
| expo-linear-gradient | ~15.0.8 | Gradient backgrounds |
| expo-linking | ~8.0.11 | Deep linking |
| expo-print | ~15.0.8 | PDF generation |
| expo-sharing | ~14.0.8 | Share sheet |
| expo-sms | ~14.0.8 | SMS sending |
| expo-splash-screen | ~31.0.13 | Splash screen control |
| expo-status-bar | ~3.0.9 | Status bar styling |
| expo-web-browser | ~15.0.10 | In-app browser |

---

## EAS Build & Submit

### Build Commands
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
eas build --platform all
```

### Submit Commands
```bash
eas submit --platform ios
eas submit --platform android
```

### Automated Build + Submit (EAS Workflows)
```yaml
# .eas/workflows/build-and-submit.yml
name: Build and submit
on:
  push:
    branches: ['main']
jobs:
  build_android:
    type: build
    params:
      platform: android
      profile: production
  build_ios:
    type: build
    params:
      platform: ios
      profile: production
  submit_android:
    type: submit
    needs: [build_android]
    params:
      build_id: ${{ needs.build_android.outputs.build_id }}
  submit_ios:
    type: submit
    needs: [build_ios]
    params:
      build_id: ${{ needs.build_ios.outputs.build_id }}
```

---

## Development Builds vs Expo Go

| Feature | Expo Go | Dev Build |
|---------|---------|-----------|
| Custom native modules | ❌ | ✅ |
| Push notifications (Android) | ❌ (SDK 53+) | ✅ |
| FaceID testing | ❌ | ✅ |
| App/Universal links | ❌ | ✅ |
| Custom splash screen | Limited | ✅ |
| Older SDK versions (iOS device) | ❌ | ✅ |

**Recommendation**: Use development builds for Steps to Recovery (biometrics, push, geofencing all require it).

---

## Sources
- https://docs.expo.dev/versions/latest/
- https://docs.expo.dev/versions/latest/sdk/sqlite/
- https://docs.expo.dev/versions/latest/sdk/notifications/
- https://docs.expo.dev/versions/latest/sdk/audio/
- https://docs.expo.dev/versions/latest/sdk/local-authentication/
- https://docs.expo.dev/versions/latest/sdk/location/
- https://docs.expo.dev/versions/latest/sdk/updates/
- https://docs.expo.dev/build/introduction/
- https://docs.expo.dev/deploy/submit-to-app-stores/
