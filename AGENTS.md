# Steps to Recovery - AI Agent Guide

> **Single source of truth**: See [CLAUDE.md](CLAUDE.md) for the complete project guide - architecture, security patterns, code conventions, testing, deployment, and all technical documentation.

## Quick Reference

| Command                                     | Purpose                         |
| ------------------------------------------- | ------------------------------- |
| `npm run mobile`                            | Start Expo dev server           |
| `npm test`                                  | Run all tests                   |
| `cd apps/mobile && npm run test:encryption` | Encryption tests (**CRITICAL**) |
| `cd apps/mobile && npx tsc --noEmit`        | Type check                      |
| `npm run lint`                              | ESLint                          |

## Core Philosophy

**Privacy-first, offline-first, security-first.** All sensitive data must be encrypted before storage or transmission.

## Critical Rules

1. **Encrypt everything sensitive** - use `encryptContent()` before any storage
2. **Keys in SecureStore only** - never AsyncStorage, SQLite, or Supabase
3. **No `any` types** - strict TypeScript, explicit return types
4. **WCAG AAA** - `accessibilityLabel` + `accessibilityRole` on all interactive elements
5. **Sync queue** - call `addToSyncQueue()` after every syncable write
6. **No `console.*`** - use `logger` from `utils/logger.ts`

## Tech Stack

| Category        | Technology              | Version           |
| --------------- | ----------------------- | ----------------- |
| Frontend        | React Native + Expo     | SDK ~54.0.0       |
| React           | React                   | 19.1.0            |
| Language        | TypeScript              | ~5.9.3 (strict)   |
| Backend         | Supabase                | ^2.93.3           |
| Offline Storage | expo-sqlite / IndexedDB | ~16.0.10          |
| State           | React Query + Zustand   | ^5.90.15 / ^5.0.9 |
| Encryption      | AES-256-CBC (crypto-js) | ^4.2.0            |
| Key Storage     | expo-secure-store       | ~15.0.8           |

## Agent Swarm

For all development requests, use the **Swarm Coordinator** agent - it routes to specialized agents automatically. See `.claude/agents/swarm-coordinator.md`.

For everything else, see **[CLAUDE.md](CLAUDE.md)**.
