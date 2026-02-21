import Reactotron from 'reactotron-react-native';
import { logger } from '../utils/logger';

/**
 * Reactotron configuration for development debugging.
 * 
 * Features:
 * - Network request monitoring
 * - Logger output capture
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

  const logToReactotron = (level: string, message: string): void => {
    Reactotron.log?.({ level, message });
  };

  const originalInfo = logger.info;
  logger.info = (message: string, data?: unknown): void => {
    originalInfo(message, data);
    logToReactotron('info', message);
  };

  const originalWarn = logger.warn;
  logger.warn = (message: string, data?: unknown): void => {
    originalWarn(message, data);
    logToReactotron('warn', message);
  };

  const originalError = logger.error;
  logger.error = (message: string, error?: unknown): void => {
    originalError(message, error);
    logToReactotron('error', message);
  };

  const originalDebug = logger.debug;
  logger.debug = (message: string, data?: unknown): void => {
    originalDebug(message, data);
    logToReactotron('debug', message);
  };
}

export default Reactotron;
