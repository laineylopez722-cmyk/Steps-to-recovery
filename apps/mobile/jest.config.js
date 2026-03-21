/**
 * Jest Configuration for Recovery Companion
 * Uses jest-expo preset for React Native/Expo compatibility
 * @see https://docs.expo.dev/develop/unit-testing/
 */

const { resolve } = require('path');
const expoPreset = require('jest-expo/jest-preset');
const appRoot = __dirname;
const repoRoot = resolve(appRoot, '..', '..');
const importAliases = require('./config/import-aliases.json');

const {
  transform: _transform,
  setupFiles: _setupFiles,
  setupFilesAfterEnv: _setupFilesAfterEnv,
  moduleNameMapper: _moduleNameMapper,
} = expoPreset;

module.exports = {
  ...expoPreset,
  resolver: './apps/mobile/jest.resolver.js',
  // Use repo root to keep node_modules in-scope for Jest runtime
  rootDir: repoRoot,
  // Limit test discovery to the mobile app
  roots: ['<rootDir>/apps/mobile'],

  // Explicit transform ensures TS/TSX + JSX go through babel-jest with our Babel config
  transform: {
    ...(_transform ?? {}),
    '\\.[jt]sx?$': [
      'babel-jest',
      {
        caller: { name: 'metro', bundler: 'metro', platform: 'ios' },
        configFile: resolve(appRoot, 'babel.config.js'),
        babelrc: false,
      },
    ],
  },

  // Preload mocks before React Native / Expo setup
  setupFiles: ['<rootDir>/apps/mobile/jest.preload.js', ...(_setupFiles ?? [])],

  // Setup files to run before tests
  setupFilesAfterEnv: [...(_setupFilesAfterEnv ?? []), '<rootDir>/apps/mobile/jest.setup.js'],

  // Transform settings - handle monorepo and React Native 0.81+
  // Packages that need transformation (ESM or JSX)
  // Use a broad allowlist to support npm/yarn/pnpm node_modules layouts.
  transformIgnorePatterns: [
    'node_modules/(?!.*(' +
      '(jest-)?react-native|' +
      'react-native-.*|' +
      '@react-native(-community)?|' +
      '@react-native/js-polyfills|' +
      'expo|' +
      'expo-.*|' +
      '@expo|' +
      '@expo-google-fonts|' +
      'react-navigation|' +
      '@react-navigation|' +
      '@unimodules|' +
      'unimodules|' +
      '@sentry/react-native|' +
      'nativewind|' +
      '@rn-primitives/.*|' +
      'class-variance-authority|' +
      'clsx|' +
      'tailwind-merge|' +
      '@supabase/supabase-js|' +
      '@supabase/postgrest-js|' +
      'uuid' +
      ')/)',
  ],

  // Module name mappings
  moduleNameMapper: {
    ...(_moduleNameMapper ?? {}),
    ...importAliases.jestModuleNameMapper,
    '^expo$': '<rootDir>/apps/mobile/__mocks__/expo.js',
    '^expo/internal/install-global$':
      '<rootDir>/apps/mobile/__mocks__/expo-internal-install-global.js',
    '^expo/src/winter$': '<rootDir>/apps/mobile/__mocks__/expo-winter.js',
    '^expo/src/winter/runtime(\\.native)?(\\.ts)?$':
      '<rootDir>/apps/mobile/__mocks__/expo-winter-runtime.js',
    '^expo/src/winter/installGlobal(\\.ts)?$':
      '<rootDir>/apps/mobile/__mocks__/expo-winter-installGlobal.js',
    // Mock NativeWind css-interop for Jest - prevents JSX runtime errors
    '^react-native-css-interop/jsx-runtime$':
      '<rootDir>/apps/mobile/__mocks__/react-native-css-interop-jsx-runtime.js',
    '^react-native-css-interop$': '<rootDir>/apps/mobile/__mocks__/react-native-css-interop.js',
  },

  // Test file patterns — relative globs are safe because roots: ['<rootDir>/apps/mobile']
  // restricts Jest discovery to the mobile app directory (avoids Windows path separator issues)
  testMatch: [
    '**/__tests__/**/*.(spec|test).[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/.expo/',
    '/.claude/',
    '/.codex/',
    '/.cursor/',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'apps/mobile/src/lib/**/*.{js,jsx,ts,tsx}',
    'apps/mobile/src/components/**/*.{js,jsx,ts,tsx}',
    'apps/mobile/src/app/**/*.{js,jsx,ts,tsx}',
    'apps/mobile/src/contexts/**/*.{ts,tsx}',
    'apps/mobile/src/features/**/hooks/**/*.{ts,tsx}',
    'apps/mobile/src/services/**/*.{ts,tsx}',
    'apps/mobile/src/utils/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  // Coverage thresholds - Gradually increase as test coverage improves
  // For critical utils (encryption, database, sync), aim for 80%+
  coverageThreshold: {
    // Critical security modules require higher coverage
    'apps/mobile/src/utils/encryption.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    'apps/mobile/src/services/syncService.ts': {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
    // Context coverage thresholds
    'apps/mobile/src/contexts/AuthContext.tsx': {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
    'apps/mobile/src/contexts/SyncContext.tsx': {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
