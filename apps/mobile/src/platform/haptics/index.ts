import { Platform } from 'react-native';
import { nativeModulePort } from '@/platform/runtime/NativeModulePort';
import {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
} from './HapticsPort';
import type {
  HapticsPort,
  ImpactFeedbackStyleValue,
  NotificationFeedbackTypeValue,
} from './HapticsPort';

interface ExpoHapticsModule {
  impactAsync(style: ImpactFeedbackStyleValue): Promise<void>;
  notificationAsync(type: NotificationFeedbackTypeValue): Promise<void>;
  selectionAsync(): Promise<void>;
}

const expoHaptics = nativeModulePort.loadOptional<ExpoHapticsModule>(() => {
  return require('expo-haptics') as ExpoHapticsModule;
});

const isAvailable = Platform.OS !== 'web' && expoHaptics !== null;

const noop = (): Promise<void> => Promise.resolve();

const hapticsPort: HapticsPort = {
  async impactAsync(style: ImpactFeedbackStyleValue): Promise<void> {
    if (!isAvailable || expoHaptics === null) {
      return noop();
    }
    try {
      await expoHaptics.impactAsync(style);
    } catch {
      // Best-effort feedback only.
    }
  },
  async notificationAsync(type: NotificationFeedbackTypeValue): Promise<void> {
    if (!isAvailable || expoHaptics === null) {
      return noop();
    }
    try {
      await expoHaptics.notificationAsync(type);
    } catch {
      // Best-effort feedback only.
    }
  },
  async selectionAsync(): Promise<void> {
    if (!isAvailable || expoHaptics === null) {
      return noop();
    }
    try {
      await expoHaptics.selectionAsync();
    } catch {
      // Best-effort feedback only.
    }
  },
};

export { ImpactFeedbackStyle, NotificationFeedbackType };
export const impactAsync = hapticsPort.impactAsync;
export const notificationAsync = hapticsPort.notificationAsync;
export const selectionAsync = hapticsPort.selectionAsync;
export const isHapticsAvailable = isAvailable;

