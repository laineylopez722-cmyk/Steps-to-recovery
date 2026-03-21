# Troubleshooting Guide

## Common Issues

### 1. Sync failures / "Sync already in progress"
**Cause**: Concurrent sync attempts or network interruption  
**Fix**: The sync mutex prevents concurrent operations. Wait for the current sync to complete. If stuck, restart the app. Check network connectivity.

### 2. "Failed to get secure item" on Android
**Cause**: Android keystore unavailable (device lock screen changed, rooted device)  
**Fix**: Re-authenticate in the app. If persistent, the user may need to re-create their encryption key. See `adapters/secureStorage/native.ts` for keystore error handling.

### 3. Blank screen after login
**Cause**: Database initialization failed or context initialization order broken  
**Fix**: Context init order is fixed: `AuthContext → DatabaseContext → SyncContext → NotificationContext`. Check logs for `Database initialization complete` message. Clear app data if SQLite is corrupted.

### 4. Tests fail with "queryClient" errors
**Cause**: Missing `QueryClientProvider` wrapper in test  
**Fix**: Use the shared test wrapper: `import { createTestWrapper } from '@/__tests__/utils';` then pass `wrapper: createTestWrapper()` to `renderHook`.

### 5. "Encryption key not found" during decrypt
**Cause**: SecureStore key was deleted (logout, app reinstall, keystore reset)  
**Fix**: The app prompts for re-authentication when this occurs. All local encrypted data requires the key — if lost, the user must re-sync from cloud (where data is stored as encrypted blobs with server-side key derivation).

### 6. E2E tests skip in CI
**Cause**: Missing `MAESTRO_CLOUD_API_KEY` or `E2E_TEST_USER_EMAIL` secrets  
**Fix**: Set up all E2E secrets per `docs/GITHUB_SECRETS.md`. The workflow validates secrets and skips with a warning if missing.

### 7. `npm run web` doesn't start
**Cause**: Missing Expo web dependencies  
**Fix**: Run `npx expo install react-dom react-native-web @expo/metro-runtime` in `apps/mobile/`.

### 8. TypeScript errors after pulling changes
**Cause**: New dependencies or type definitions not installed  
**Fix**: Run `npm install` from repo root, then `cd apps/mobile && npx tsc --noEmit`. If aliases changed, run `npm run doctor:aliases`.

### 9. "Permission denied" for location/notifications
**Cause**: OS-level permissions not granted  
**Fix**: Meeting geofencing requires location permission via `expo-location`. Push notifications require notification permission. The app requests these on first use. If denied, guide users to OS settings.

### 10. Build fails with EAS CLI version mismatch
**Cause**: Local EAS CLI version differs from CI  
**Fix**: All environments use `>= 16.28.0`. Run `npm install -g eas-cli@latest` locally. Check `eas.json` → `cli.version`.

### 11. Pre-commit hook doesn't run
**Cause**: Husky not installed or hook not executable  
**Fix**: Run `npx husky install` from repo root. On macOS/Linux, ensure `.husky/pre-commit` is executable: `chmod +x .husky/pre-commit`.

### 12. Stale sync queue / slow sync
**Cause**: Failed items accumulate in `sync_queue`  
**Fix**: `cleanupSyncQueue()` runs automatically after each sync batch, removing items older than 7 days. For manual cleanup, clear `sync_queue` entries where `failed_at IS NOT NULL`.
