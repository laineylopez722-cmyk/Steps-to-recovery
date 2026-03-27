# GEMINI.md — Steps to Recovery

This document provides foundational context and instructions for AI agents working on the **Steps to Recovery** project.

## Project Overview
**Steps to Recovery** is a privacy-first, offline-first mobile companion for individuals in 12-step recovery programs (e.g., AA, NA). It replaces fragmented tools with a unified, encrypted platform for guided step work, journaling, crisis support, and meeting tracking.

- **Mission:** Empower recovery through guided work, AI-driven contextual support, and bulletproof privacy.
- **Core Principle:** Privacy is the product. User data (journal, step work, chat) is AES-256 encrypted on-device.
- **Offline-First:** All core features must work without an internet connection. SQLite is the source of truth.

---

## Tech Stack
- **Framework:** React Native 0.81.5 + Expo SDK 54 (Managed Workflow)
- **Language:** TypeScript (Strict Mode)
- **State Management:** React Query + Zustand
- **Database:** SQLite (`expo-sqlite`) + Drizzle ORM
- **Backend:** Supabase (Auth, Postgres, RLS, Edge Functions for AI)
- **Encryption:** AES-256 via `expo-secure-store`
- **Styling:** Custom Design System + Uniwind (Tailwind-like utility classes)
- **Animations:** `react-native-reanimated` ~4.1.1
- **Testing:** Jest + React Native Testing Library + Maestro (E2E)

---

## Architecture & Structure

### Repository Layout
- `apps/mobile/`: The main React Native application.
- `supabase/`: Backend logic (Edge Functions, migrations).
- `scripts/`: Toolchain validation and maintenance scripts.
- `docs/`: Deep-dive product and engineering documentation.
- `reference/`: Architecture maps and implementation guides.

### Mobile Source Structure (`apps/mobile/src/`)
- `features/`: Domain-driven modules (e.g., `ai-companion`, `steps`, `journal`, `crisis`). Each contains its own components, hooks, and services.
- `design-system/`: Tokens, primitives, and themed components. Uses semantic tokens (`ds.semantic.*`).
- `db/`: Database schema, migrations, and Drizzle client.
- `adapters/`: Platform-specific abstractions (encryption, secure storage).
- `services/`: Global business logic (sync, notifications, risk detection).
- `navigation/`: React Navigation 7 setup (Native Stack + Bottom Tabs).

### Database & Encryption
- **SQLite:** Stores all user data locally.
- **Drizzle ORM:** Used for type-safe queries and migrations.
- **Encryption:** Sensitive fields (journal body, check-in reflections) MUST be encrypted using `encryptContent()` from `src/utils/encryption.ts` before database writes.
- **Keys:** Encryption keys are stored ONLY in `SecureStore`, never in `AsyncStorage` or plain SQLite.

---

## Building and Running

### Prerequisites
- Node.js 20+, npm 11+
- JDK 17 (Required for Android builds; JDK 21+ is incompatible)
- Expo Dev Client (Expo Go is NOT supported due to native modules)

### Key Commands (Root)
- `npm run verify:strict`: Full validation (lint, type-check, tests, doctor scripts).
- `npm run type-check`: Repo-wide TypeScript validation.
- `npm run doctor:toolchain`: Validate local dev environment.

### Key Commands (`apps/mobile`)
- `npm run start:dev`: Start Metro bundler for the development client.
- `npm run android` / `npm run ios`: Run on a local emulator/device.
- `npm run test`: Run unit and integration tests.
- `npm run lint`: Run ESLint.
- `eas build --profile preview --platform android`: Generate a preview APK.

---

## Development Conventions

### 1. TypeScript Strictness
- **Zero `any` policy:** Use `unknown` with type guards or specific interfaces.
- **Explicit Returns:** All exported functions and components must have explicit return types.
- **Strict Null Checks:** Always handle `null`/`undefined` from database results.

### 2. Security & Data Integrity
- **Encrypt Before Storage:** Always call `encryptContent()` before saving sensitive data.
- **Use `logger`:** Avoid `console.log`. Use `src/utils/logger.ts` which sanitizes output and integrates with Sentry.
- **Sync Queue:** Every SQLite write/update must be followed by `addToSyncQueue()` to ensure eventual consistency with Supabase.

### 3. Accessibility (A11y)
- **Mandatory Props:** All interactive elements must have `accessibilityLabel`, `accessibilityRole`, and `accessibilityState`.
- **Touch Targets:** Minimum 48x48dp for all pressable elements.
- **Haptics:** Use `haptics` utility for feedback, but never `await` it in the UI critical path.

### 4. Styling & UI
- **Semantic Tokens:** Use `ds.semantic.*` tokens from the `useDs()` hook. Never use raw hex codes or legacy `theme.colors`.
- **Themed Styles:** Use `useThemedStyles(createStyles)` for all stylesheets to support theme switching and token reactivity.
- **Animations:** Use `react-native-reanimated`. Avoid `framer-motion` (not optimized for RN).

### 5. Testing Standards
- **New Features:** Must include unit tests (Jest) and coverage should hit >75% overall.
- **Encryption Tests:** Any change to crypto logic requires a roundtrip test (encrypt -> decrypt -> compare).
- **Offline Validation:** Manually verify features work in Airplane Mode.

### 6. Git & Commits
- **Conventional Commits:** Enforced via `commitlint`. (e.g., `feat(journal): add mood tags`, `fix(sync): resolve FK conflict`).
- **Single Branch:** Development happens on `feat/*` or `fix/*` branches targeting `main`.

---

## Safety Note
**Steps to Recovery** is a support tool, not a replacement for professional medical or crisis services.
- **Crisis Paths:** Crisis features (Emergency Screen, Before You Use, Craving Surf) must be prioritized for reliability and offline availability.
- **Emergency:** If a user is in immediate danger, the app must prioritize surfacing local emergency services.

---
*For deep-dive technical details, refer to `ARCHITECTURE.md` and `CLAUDE.md`.*
