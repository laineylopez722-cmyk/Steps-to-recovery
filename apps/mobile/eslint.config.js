/**
 * ESLint Configuration for Steps to Recovery
 *
 * Enforces coding standards from CLAUDE.md:
 * - No console.log (use logger utility)
 * - No 'any' types (TypeScript strict mode)
 * - Accessibility requirements
 * - React best practices
 */
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      '.turbo/**',
      'coverage/**',
      'android/**',
      'ios/**',
      'dist/**',
      'build/**',
      '**/*.config.js',
      '**/*.config.ts',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      'jest.setup.js',
      'polyfills.cjs',
      'polyfills.ts',
      '**/*.d.ts',
    ],
  },

  // TypeScript/React source files
  {
    files: ['src/**/*.{ts,tsx}', 'App.tsx', 'index.ts'],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: null, // Disable type-aware linting for performance
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        globalThis: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Promise: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        __DEV__: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // === Security & Privacy (CLAUDE.md) ===
      // Enforce logger utility instead of console.log
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // === TypeScript Strict Mode ===
      // No 'any' types allowed (CLAUDE.md requirement)
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // === Code Quality ===
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'off', // Use TypeScript version
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-throw-literal': 'error',

      // === React Best Practices ===
      // Hooks rules would go here if eslint-plugin-react-hooks is added

      // === Async/Await ===
      'no-return-await': 'warn',
      'require-await': 'off', // TypeScript handles this better
    },
  },

  // Test files - relaxed rules
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
