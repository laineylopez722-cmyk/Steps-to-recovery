import Reactotron from 'reactotron-react-native';

/**
 * Reactotron configuration for development debugging.
 * 
 * Features:
 * - Network request monitoring
 * - Console log capture
 * - AsyncStorage inspection
 * - Performance benchmarking
 * 
 * This file is only imported in __DEV__ mode.
 */

if (__DEV__) {
  Reactotron
    .configure({
      name: 'Steps to Recovery',
    })
    .useReactNative({
      asyncStorage: false, // We use MMKV now, not AsyncStorage
      networking: {
        ignoreUrls: /symbolicate|127\.0\.0\.1/,
      },
      editor: false,
      errors: { veto: () => false },
      overlay: false,
    })
    .connect();

  // Patch console.log to also send to Reactotron
  const originalConsoleLog = console.log;
  console.log = (...args: unknown[]) => {
    originalConsoleLog(...args);
    Reactotron.log?.(...args);
  };
  
  // Make available globally for debugging
  console.tron = Reactotron;
}

export default Reactotron;
