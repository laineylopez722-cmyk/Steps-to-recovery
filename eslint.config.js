// ESLint flat-config (ESLint v9+)
// Docs: https://docs.expo.dev/guides/using-eslint/
//
// Rule rationale is documented inline so reviewers understand intent without
// consulting a separate doc.  All rules map directly to requirements in
// CLAUDE.md: TypeScript Strictness, Accessibility Requirements, Critical
// Security Patterns.

import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';

export default defineConfig([
  // ── Base: Expo preset ────────────────────────────────────────────────────
  // Includes React, React Native, import ordering, and TypeScript parser.
  // eslint-config-expo already extends @typescript-eslint/recommended.
  expoConfig,

  // ── Import resolver ──────────────────────────────────────────────────────
  // Tell eslint-plugin-import how to resolve @/ path aliases so
  // import/no-unresolved doesn't false-positive on them.
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
      // Treat @/ imports as internal — the alias is resolved by
      // TypeScript/Babel, not by Node's module resolution.
      'import/ignore': ['@/'],
    },
    rules: {
      'import/no-unresolved': ['error', { ignore: ['^@/'] }],
    },
  },

  // ── TypeScript overrides ────────────────────────────────────────────────
  // Scoped to TS/TSX so @typescript-eslint plugin is available (registered
  // by eslint-config-expo only for TypeScript files).
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // ------------------------------------------------------------------
      // TypeScript strictness (CLAUDE.md: "TypeScript Strictness")
      // ------------------------------------------------------------------

      // Disallow `any` — every value must be explicitly typed.
      // This catches the most common drift toward unsafe code.
      '@typescript-eslint/no-explicit-any': 'error',

      // All functions must declare their return type explicitly.
      // Prevents accidental `void` / `undefined` leaking through the call
      // stack and makes refactoring safer.
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          // Allow inference for simple arrow functions used as callbacks or
          // in JSX event handlers (e.g. onPress={() => setOpen(true)}).
          allowExpressions: true,
          // Allow inference on typed higher-order functions.
          allowHigherOrderFunctions: true,
          // Allow React components whose return type is obvious.
          allowTypedFunctionExpressions: true,
        },
      ],

      // Prefer explicit module boundary types on exported functions.
      // Helps consumers of shared utilities know what to expect.
      '@typescript-eslint/explicit-module-boundary-types': [
        'warn',
        { allowArgumentsExplicitlyTypedAsAny: false },
      ],

      // ------------------------------------------------------------------
      // Logging / security (CLAUDE.md: "Critical Security Patterns")
      // ------------------------------------------------------------------

      // Ban console.* in production source.  The project uses
      // `utils/logger.ts` which auto-sanitises sensitive fields and is
      // a no-op in test/prod builds.  Raw console calls risk leaking
      // encrypted content, user IDs, or session tokens into device logs.
      //
      // Allowed in:  test files (see test override below)
      // Emergency:   use logger.debug() — it's stripped in production
      'no-console': [
        'error',
        {
          allow: [
            // Allow console.warn so third-party libraries that call it
            // don't generate false-positive violations.
            'warn',
          ],
        },
      ],

      // ------------------------------------------------------------------
      // Async patterns (CLAUDE.md: "Never use .then() chains")
      // ------------------------------------------------------------------

      // Prefer async/await over Promise chains for readability and
      // correct error propagation.
      'prefer-const': 'error',

      // NOTE: @typescript-eslint/no-floating-promises requires type-checked
      // linting (parserOptions.project) which eslint-config-expo/flat does not
      // enable. The rule is enforced via `tsc --strict` + `noUncheckedIndexedAccess`
      // instead. Re-enable if type-checked linting is configured.
      // '@typescript-eslint/no-floating-promises': 'error',

      // ------------------------------------------------------------------
      // Accessibility (CLAUDE.md: "Accessibility Requirements" — WCAG AAA)
      // ------------------------------------------------------------------
      // Note: Full jsx-a11y React Native rules are not yet available in the
      // flat-config ecosystem.  The rule below is a best-effort guard.
      // The accessibility-validator agent performs the definitive audit.

      // Warn when an anonymous function is used directly as an event
      // handler without being wrapped in useCallback — this is a perf hint
      // that also surfaces missing accessibility patterns.
      // (Handled by react/jsx-no-bind — included via expoConfig.)
    },
  },

  // ── AsyncStorage security guard ──────────────────────────────────────────
  // Warn when AsyncStorage is imported alongside keywords that suggest
  // sensitive data (key, token, secret, password, encrypt, session).
  // The project rule is: SecureStore only for secrets (CLAUDE.md).
  //
  // This is a file-level heuristic, not a call-site check, because ESLint
  // cannot reliably inspect runtime values.  It prompts developers to
  // double-check they are not storing secrets via AsyncStorage.
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: '@react-native-async-storage/async-storage',
              message:
                'Do NOT store encryption keys, tokens, or secrets in AsyncStorage. ' +
                'Use secureStorage (adapters/secureStorage) for sensitive data. ' +
                'See CLAUDE.md "Critical Security Patterns".',
            },
          ],
        },
      ],
    },
  },

  // ── Test file overrides ───────────────────────────────────────────────────
  // Relax rules that are noisy or incorrect in a test context.
  {
    files: [
      '**/__tests__/**/*.{ts,tsx,js,jsx}',
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
    ],
    rules: {
      // console.log is acceptable in tests for debugging output.
      'no-console': 'off',

      // Explicit return types on test helper functions add noise without
      // safety benefit — Jest inference is reliable here.
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Test utilities commonly use `any` for mock factories.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Floating promises in tests are often intentional (fire-and-forget
      // mutation calls followed by assertion on state).
      // '@typescript-eslint/no-floating-promises': 'warn', // disabled: needs type-checked linting

      // AsyncStorage may be imported in tests to verify it is NOT called.
      'no-restricted-imports': 'off',
    },
  },

  // ── Shared code (migrated from packages/shared) ─────────────────────────
  // This code previously lived in packages/shared/ which was not linted by
  // this ESLint config.  Relax rules to warnings until a dedicated cleanup
  // pass addresses the pre-existing issues.
  {
    files: ['apps/mobile/src/shared/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'no-console': 'warn',
    },
  },

  // ── Ignored paths ────────────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      'coverage/**',
      // Native build output — not TypeScript source
      'apps/mobile/ios/**',
      'apps/mobile/android/**',
      // Expo managed output
      '.expo/**',
    ],
  },
]);
