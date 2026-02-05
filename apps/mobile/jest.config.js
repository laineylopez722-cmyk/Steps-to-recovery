/**
 * Jest Configuration for Recovery Companion
 * Uses jest-expo preset for React Native/Expo compatibility
 */

module.exports = {
  // Explicitly pin rootDir so Jest resolves Babel config and module paths from apps/mobile
  rootDir: __dirname,
  preset: 'jest-expo',

  // Explicit transform ensures TS/TSX + JSX go through babel-jest with our Babel config
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        configFile: require('path').resolve(__dirname, 'babel.config.js'),
        babelrc: false,
      },
    ],
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', '<rootDir>/jest.setup.js'],

  // Transform settings - handle pnpm's .pnpm folder structure and React Native 0.83+
  // pnpm creates: node_modules/.pnpm/package@version/node_modules/package/
  // We need to NOT ignore packages that need transformation
  transformIgnorePatterns: [
    // Match node_modules but allow through packages that need transformation
    // This pattern handles both regular npm/yarn and pnpm structures
    'node_modules/(?!(.pnpm|' +
      '(jest-)?react-native|' +
      'react-native-.*|' + // All react-native-* packages (url-polyfill, css-interop, etc.)
      '@react-native(-community)?|' +
      '@react-native/js-polyfills|' +
      'expo|' +
      'expo-.*|' + // All expo-* packages (expo-modules-core, expo-constants, etc.)
      '@expo|' +
      '@expo-google-fonts|' +
      'react-navigation|' +
      '@react-navigation|' +
      '@unimodules|' +
      'unimodules|' +
      'sentry-expo|' +
      '@sentry/react-native|' + // Sentry React Native SDK
      'native-base|' +
      'nativewind|' +
      '@supabase|' + // Supabase client
      'uuid' +
      ')/)',
  ],

  // Module name mappings
  moduleNameMapper: {
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
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/.expo/'],

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
    global: {
      statements: 40,
      branches: 30,
      functions: 30,
      lines: 40,
    },
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

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
