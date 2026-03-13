/**
 * Jest Setup File
 * Mocks for Expo modules and React Native APIs
 */

import { act, cleanup } from '@testing-library/react-native';
import process from 'node:process';
import { notifyManager, timeoutManager } from '@tanstack/query-core';

// Set up Supabase environment variables BEFORE any module imports
// This prevents supabase.ts from throwing during initialization
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-for-jest';

// Suppress Node.js deprecation warning for punycode (DEP0040) in test output.
// This is dependency-level noise (jsdom/whatwg-url) and not actionable in app code.
const originalEmitWarning = process.emitWarning.bind(process);
process.emitWarning = (warning, type, code, ctor) => {
  const message = typeof warning === 'string' ? warning : warning?.message;
  const warningCode =
    (typeof warning === 'object' && warning?.code) ||
    (typeof type === 'object' && type?.code) ||
    code;
  if (warningCode === 'DEP0040' || (typeof message === 'string' && message.includes('punycode'))) {
    return;
  }
  // @ts-ignore - Node's overloads allow multiple signatures
  return originalEmitWarning(warning, type, code, ctor);
};

// Ensure React Query updates are wrapped in act(...) during tests
notifyManager.setNotifyFunction((fn) => {
  act(fn);
});

// Prevent React Query GC/retry timers from keeping Node alive after tests complete.
// This targets root-cause lingering handles instead of relying only on forced process exit.
timeoutManager.setTimeoutProvider({
  setTimeout: (callback, delay) => {
    const timeout = setTimeout(callback, delay);
    if (typeof timeout?.unref === 'function') {
      timeout.unref();
    }
    return timeout;
  },
  clearTimeout: (timeout) => clearTimeout(timeout),
  setInterval: (callback, delay) => {
    const interval = setInterval(callback, delay);
    if (typeof interval?.unref === 'function') {
      interval.unref();
    }
    return interval;
  },
  clearInterval: (interval) => clearInterval(interval),
});

// ============================================================================
// Console Policy (Warnings Are Blocking)
// ============================================================================
// Test runs must stay warning-clean for key failure classes that indicate
// nondeterministic behavior or native/runtime wiring issues.
const blockingConsoleMessages = [];
const blockingPatterns = [
  /not wrapped in act/i,
  /you are trying to `import` a file outside of the scope of the test code/i,
  /failed to get nitromodules/i,
  /requireoptionalnativemodule\) is not a function/i,
  /turbomoduleregistry\.getenforcing/i,
  /unhandledpromise(rejection)?/i,
];
const warningAllowlistPatterns = [
  // Legacy warnings from react-test-renderer and animated mocks that do not
  // change runtime behavior in this repository.
  /componentwillreceiveprops/i,
  /componentwillmount/i,
  /^animated:/i,
];

/**
 * @param {unknown[]} args
 * @returns {string}
 */
function formatConsoleArgs(args) {
  return args
    .map((arg) => {
      if (typeof arg === 'string') return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ');
}

/**
 * @param {string} message
 * @returns {boolean}
 */
function isBlockingMessage(message) {
  return blockingPatterns.some((pattern) => pattern.test(message));
}

const originalError = console.error;
console.error = (...args) => {
  const message = formatConsoleArgs(args);
  if (isBlockingMessage(message)) {
    blockingConsoleMessages.push(message);
  }
  originalError.apply(console, args);
};

const originalWarn = console.warn;
console.warn = (...args) => {
  const message = formatConsoleArgs(args);
  const isAllowlisted = warningAllowlistPatterns.some((pattern) => pattern.test(message));
  if (isAllowlisted) {
    return;
  }
  if (isBlockingMessage(message)) {
    blockingConsoleMessages.push(message);
  }
  originalWarn(...args);
};

beforeEach(() => {
  blockingConsoleMessages.length = 0;
});

// Global afterEach cleanup to prevent test leaks
afterEach(() => {
  cleanup();
  // Clear all timers
  jest.clearAllTimers();

  // Clear all mocks
  jest.clearAllMocks();

  // Reset MMKV mock storage between tests
  const mmkvMock = jest.requireMock('react-native-mmkv');
  if (mmkvMock?.__unsafe__reset) {
    mmkvMock.__unsafe__reset();
  }

  if (blockingConsoleMessages.length > 0) {
    const failureDetails = blockingConsoleMessages.map((message) => `- ${message}`).join('\n');
    blockingConsoleMessages.length = 0;
    throw new Error(`Blocking console warnings/errors detected:\n${failureDetails}`);
  }
});

// Mock react-native-worklets (peer dep of Reanimated 4.x)
// Required since Reanimated 4 extracted worklets into a separate native package.
// Worklets 0.5.x no longer ships a mock, so we provide a comprehensive one inline.
jest.mock('react-native-worklets', () => {
  const noopFn = jest.fn();
  const identity = jest.fn((value) => value);
  return {
    WorkletsModule: { makeShareableClone: noopFn },
    isWorklet: jest.fn(() => false),
    isWorkletFunction: jest.fn(() => false),
    isShareable: jest.fn(() => false),
    isRemoteFunction: jest.fn(() => false),
    makeShareable: identity,
    makeShareableCloneRecursive: identity,
    makeShareableCloneOnUIRecursive: identity,
    executeOnUIRuntimeSync: jest.fn(() => noopFn),
    runOnUI: jest.fn(() => noopFn),
    runOnJS: jest.fn(() => noopFn),
    createSerializable: jest.fn((value) => value),
    callMicrotasks: noopFn,
    RuntimeKind: { UI: 'UI', JS: 'JS' },
    WorkletFunction: {},
    SerializableRef: jest.fn(),
    Synchronizable: jest.fn(),
    serializableMappingCache: new Map(),
  };
});

// Mock react-native-css-interop (NativeWind)
jest.mock('react-native-css-interop/jsx-runtime', () => ({
  jsx: jest.fn((type, props) => require('react').createElement(type, props)),
  jsxs: jest.fn((type, props) => require('react').createElement(type, props)),
  Fragment: require('react').Fragment,
}));

jest.mock('react-native-css-interop', () => ({
  cssInterop: jest.fn((/** @type {any} */ component) => component),
  remapProps: jest.fn(),
  StyleSheet: {
    create: (/** @type {Record<string, any>} */ styles) => styles,
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

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-image
jest.mock('expo-image', () => {
  const React = require('react');
  const Image = React.forwardRef((props, ref) =>
    React.createElement('Image', { ...props, ref }),
  );
  Image.displayName = 'ExpoImage';
  return {
    Image,
    default: Image,
  };
});

// Mock react-native-mmkv (native module)
jest.mock('react-native-mmkv', () => {
  const store = new Map();
  return {
    createMMKV: () => ({
      getString: (key) => (store.has(key) ? String(store.get(key)) : undefined),
      set: (key, value) => {
        store.set(key, value);
      },
      remove: (key) => {
        store.delete(key);
      },
      getAllKeys: () => Array.from(store.keys()),
      clearAll: () => store.clear(),
    }),
    __unsafe__reset: () => store.clear(),
  };
});

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
      // deno-lint-ignore constructor-super
      constructor(...args) {
        if (args.length === 0) {
          super(date);
        } else {
          // @ts-ignore - Spread args for Date constructor compatibility
          super(...args);
        }
      }
      static now() {
        return new RealDate(date).getTime();
      }
    };
    return () => {
      globalThis.Date = RealDate;
    };
  },
};

// Add TextEncoder/TextDecoder polyfills for Node environment
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  // @ts-ignore - Node.js TextDecoder has slightly different types than browser
  globalThis.TextDecoder = TextDecoder;
}

// Mock crypto.subtle for AES-GCM tests
if (typeof crypto === 'undefined' || !crypto.subtle) {
  // @ts-ignore - Mock crypto.subtle for testing (incomplete implementation)
  globalThis.crypto = {
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
