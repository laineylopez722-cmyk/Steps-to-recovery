/**
 * Jest Setup File
 * Mocks for Expo modules and React Native APIs
 */

import { cleanup } from '@testing-library/react-native';

// Set up Supabase environment variables BEFORE any module imports
// This prevents supabase.ts from throwing during initialization
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-for-jest';

// ============================================================================
// React 19 + Testing Library Compatibility
// ============================================================================
// Suppress React 19 act() warnings for async state updates in tests
// This is needed because some async operations in providers may update state
// after the initial render, which is expected behavior in production but
// triggers warnings in tests.
//
// Also suppress key prop warnings that arise from:
// 1. Animated values in style arrays being treated as children by react-test-renderer
// 2. React 19's stricter key handling with mocked animation hooks
// These warnings don't indicate actual bugs in the component logic.
const originalError = console.error;
console.error = (...args) => {
  originalError.apply(console, args);
};

// Global afterEach cleanup to prevent test leaks
afterEach(() => {
  cleanup();
  // Clear all timers
  jest.clearAllTimers();

  // Clear all mocks
  jest.clearAllMocks();
});

// Mock react-native-css-interop (NativeWind)
jest.mock('react-native-css-interop/jsx-runtime', () => ({
  jsx: jest.fn((type, props) => require('react').createElement(type, props)),
  jsxs: jest.fn((type, props) => require('react').createElement(type, props)),
  Fragment: require('react').Fragment,
}));

jest.mock('react-native-css-interop', () => ({
  cssInterop: jest.fn((component) => component),
  remapProps: jest.fn(),
  StyleSheet: {
    create: (styles) => styles,
  },
}));

// Mock @sentry/react-native
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
  setTags: jest.fn(),
  setExtra: jest.fn(),
  setExtras: jest.fn(),
  addBreadcrumb: jest.fn(),
  getCurrentScope: jest.fn(() => ({
    setUser: jest.fn(),
    setContext: jest.fn(),
    setTag: jest.fn(),
    setExtra: jest.fn(),
  })),
  getGlobalScope: jest.fn(() => ({
    setUser: jest.fn(),
    setContext: jest.fn(),
  })),
  getIsolationScope: jest.fn(() => ({
    setUser: jest.fn(),
  })),
  Scope: jest.fn(),
  lastEventId: jest.fn(),
  wrap: jest.fn((component) => component),
  withScope: jest.fn((callback) => callback({ setTag: jest.fn() })),
  startSpan: jest.fn(),
  startInactiveSpan: jest.fn(),
  startSpanManual: jest.fn(),
  getActiveSpan: jest.fn(),
  getRootSpan: jest.fn(),
  withActiveSpan: jest.fn(),
  suppressTracing: jest.fn(),
  spanToJSON: jest.fn(),
  spanIsSampled: jest.fn(),
  setMeasurement: jest.fn(),
  getClient: jest.fn(),
  setCurrentClient: jest.fn(),
  addEventProcessor: jest.fn(),
  addIntegration: jest.fn(),
  captureEvent: jest.fn(),
  captureFeedback: jest.fn(),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn((size) => {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return Promise.resolve(bytes.buffer);
  }),
  digestStringAsync: jest.fn(() => Promise.resolve('mock-hash')),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
    SHA512: 'SHA-512',
  },
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn(() => Promise.resolve()),
      runAsync: jest.fn(() => Promise.resolve({ lastInsertRowId: 1, changes: 1 })),
      getFirstAsync: jest.fn(() => Promise.resolve(null)),
      getAllAsync: jest.fn(() => Promise.resolve([])),
      closeAsync: jest.fn(() => Promise.resolve()),
    }),
  ),
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true, error: null })),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
  SecurityLevel: {
    NONE: 0,
    SECRET: 1,
    BIOMETRIC: 2,
  },
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', canAskAgain: true })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', canAskAgain: true })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  cacheDirectory: 'file:///mock/cache/',
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  deleteAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false, isDirectory: false, size: 0 })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-audio
jest.mock('expo-audio', () => {
  const mockRecorder = {
    prepareToRecordAsync: jest.fn(() => Promise.resolve()),
    record: jest.fn(() => Promise.resolve()),
    pause: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    uri: 'file:///mock/recording.m4a',
    getStatus: jest.fn(() => ({
      canRecord: true,
      isRecording: false,
      durationMillis: 0,
      mediaServicesDidReset: false,
      metering: 0,
      url: 'file:///mock/recording.m4a',
    })),
    getURI: jest.fn(() => 'file:///mock/recording.m4a'),
    remove: jest.fn(() => Promise.resolve()),
  };

  const mockPlayer = {
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(() => Promise.resolve()),
    seekTo: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve()),
  };

  return {
    useAudioRecorder: jest.fn(() => mockRecorder),
    useAudioPlayer: jest.fn(() => mockPlayer),
    useAudioRecorderState: jest.fn(() => ({
      isRecording: false,
      durationMillis: 0,
      metering: 0,
      canRecord: true,
      mediaServicesDidReset: false,
      url: 'file:///mock/recording.m4a',
    })),
    useAudioPlayerStatus: jest.fn(() => ({
      playing: false,
      currentTime: 0,
      duration: 0,
      didJustFinish: false,
      loop: false,
      isBuffering: false,
    })),
    AudioModule: {
      requestRecordingPermissionsAsync: jest.fn(() =>
        Promise.resolve({ granted: true, canAskAgain: true }),
      ),
    },
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    RecordingPresets: {
      HIGH_QUALITY: {},
    },
  };
});

// Mock react-native Linking
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock AsyncStorage if needed
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: {},
  }),
  configure: jest.fn(),
  useNetInfo: jest.fn().mockReturnValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  // Suppress specific React Native warnings
  if (
    args[0]?.includes?.('Animated:') ||
    args[0]?.includes?.('componentWillReceiveProps') ||
    args[0]?.includes?.('componentWillMount')
  ) {
    return;
  }
  originalWarn(...args);
};

// Global test utilities
globalThis.testUtils = {
  /**
   * Wait for all promises to resolve
   */
  flushPromises: () => new Promise((resolve) => setImmediate(resolve)),

  /**
   * Create a mock date for testing
   */
  mockDate: (/** @type {string | number | Date} */ date) => {
    const RealDate = Date;
    // @ts-ignore - Mock Date constructor for testing
    globalThis.Date = class extends RealDate {
      /** @param {...any} args */
      constructor(...args) {
        // @ts-ignore - Spread args for Date constructor compatibility
        super(...args);
        if (args.length === 0) {
          return new RealDate(date);
        }
        // @ts-ignore - Spread args for Date constructor compatibility
        return new RealDate(...args);
      }
      static now() {
        return new RealDate(date).getTime();
      }
    };
    return () => {
      global.Date = RealDate;
    };
  },
};

// Add TextEncoder/TextDecoder polyfills for Node environment
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  // @ts-ignore - Node.js TextDecoder has slightly different types than browser
  global.TextDecoder = TextDecoder;
}

// Mock crypto.subtle for AES-GCM tests
if (typeof crypto === 'undefined' || !crypto.subtle) {
  // @ts-ignore - Mock crypto.subtle for testing (incomplete implementation)
  global.crypto = {
    subtle: {
      // @ts-ignore - Mock crypto key for testing
      importKey: jest.fn(() => Promise.resolve('mock-key')),
      encrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
      decrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
    },
    getRandomValues: jest.fn((/** @type {any} */ array) => {
      // @ts-ignore - ArrayBufferView typing issue in test environment
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
  };
}
