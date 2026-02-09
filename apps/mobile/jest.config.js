/**
 * Jest Configuration for Recovery Companion
 * Uses jest-expo preset for React Native/Expo compatibility
 * @see https://docs.expo.dev/develop/unit-testing/
 */

const { resolve } = require('path');
const expoPreset = require('jest-expo/jest-preset');

const { transform: _transform, setupFilesAfterEnv: _setupFilesAfterEnv, moduleNameMapper: _moduleNameMapper } = expoPreset;

module.exports = {
  ...expoPreset,
  // Explicitly pin rootDir so Jest resolves Babel config and module paths from apps/mobile
  rootDir: __dirname,

  // Explicit transform ensures TS/TSX + JSX go through babel-jest with our Babel config
  transform: {
    ...(_transform ?? {}),
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        configFile: resolve(__dirname, 'babel.config.js'),
        babelrc: false,
      },
    ],
  },

  // Setup files to run before tests
  setupFilesAfterEnv: [...(_setupFilesAfterEnv ?? []), '<rootDir>/jest.setup.js'],

  // Transform settings - handle monorepo and React Native 0.81+
  // Packages that need transformation (ESM or JSX)
  transformIgnorePatterns: [
    'node_modules/(?!(' +
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
    '^@/(.*)$': '<rootDir>/$1',
    // Mock NativeWind css-interop for Jest - prevents JSX runtime errors
    '^react-native-css-interop/jsx-runtime$':
      '<rootDir>/__mocks__/react-native-css-interop-jsx-runtime.js',
    '^react-native-css-interop$': '<rootDir>/__mocks__/react-native-css-interop.js',
  },

  // Use separate tsconfig for tests with skipLibCheck to avoid React 19 type issues
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.test.json',
    },
  },

  // Test file patterns
  testMatch: ['**/__tests__/**/*.(spec|test).[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],

  // Files to ignore
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/.expo/', '/.claude/', '/.codex/', '/.cursor/'],

  // Coverage configuration
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'src/contexts/**/*.{ts,tsx}',
    'src/features/**/hooks/**/*.{ts,tsx}',
    'src/services/**/*.{ts,tsx}',
    'src/utils/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  // Coverage thresholds - Gradually increase as test coverage improves
  // For critical utils (encryption, database, sync), aim for 80%+
  coverageThreshold: {
    // Critical security modules require higher coverage
    './src/utils/encryption.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    './src/services/syncService.ts': {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
    // Context coverage thresholds
    './src/contexts/AuthContext.tsx': {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
    './src/contexts/SyncContext.tsx': {
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

  // Some RN/native mocks leave background handles alive in Jest.
  // Keep CI/local runs deterministic until the underlying leak is isolated.
  forceExit: true,

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
