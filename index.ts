// Expo `export:embed` in Android release builds resolves the entry file from the repo root.
// This shim delegates to the actual app entry in `apps/mobile/index.ts`.
import './apps/mobile/index';
