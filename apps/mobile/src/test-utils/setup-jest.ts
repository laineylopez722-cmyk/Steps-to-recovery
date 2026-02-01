// Mock React Native to avoid parsing Flow syntax issues
jest.mock('react-native', () => {
  const mock = {
    Platform: {
      OS: 'ios',
      select: jest.fn((dict) => dict.ios || dict.default),
    },
    NativeModules: {},
    Alert: {
      alert: jest.fn(),
    },
    StyleSheet: {
      create: <T>(styles: T): T => styles,
      flatten: <T>(style: T): T => style,
      compose: (...styles: unknown[]): Record<string, unknown> => Object.assign({}, ...styles),
    },
    View: 'View',
    Text: 'Text',
    TextInput: 'TextInput',
    Image: 'Image',
    Pressable: 'Pressable',
    Modal: 'Modal',
    FlatList: 'FlatList',
    SectionList: 'SectionList',
    TouchableHighlight: 'TouchableHighlight',
    TouchableWithoutFeedback: 'TouchableWithoutFeedback',
    TouchableOpacity: 'TouchableOpacity',
    ActivityIndicator: 'ActivityIndicator',
    ScrollView: 'ScrollView',
    SafeAreaView: 'SafeAreaView',
  };

  // @testing-library/react-native detects "host component" names by rendering core RN components.
  // If any host component is missing from this mock, detection can fail with "Element type is invalid".
  // Provide a safe fallback for any missing export by returning its name as a host component.
  return new Proxy(mock, {
    get(target, prop) {
      if (typeof prop === 'string' && prop in target) {
        return (target as Record<string, unknown>)[prop];
      }
      if (typeof prop === 'string') return prop;
      return undefined;
    },
  });
});

// Mock Expo modules before tests run
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn((size: number) => Promise.resolve(new Uint8Array(size).fill(0))),
  randomUUID: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substring(7)),
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
}));

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: jest.fn(() => ({
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    runAsync: jest.fn(),
    execAsync: jest.fn(),
  })),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
    }),
  ),
}));

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));
