import { Platform, Dimensions, PixelRatio, StatusBar } from 'react-native';

/**
 * Platform-Specific Utilities
 *
 * Provides consistent patterns for handling platform differences:
 * - iOS vs Android specific code
 * - Device type detection (phone, tablet, TV)
 * - Screen dimensions and safe areas
 * - Platform-specific styling helpers
 * - Feature detection
 *
 * @example
 * ```tsx
 * import { isIOS, isAndroid, isTablet, platformSelect } from './utils/platform';
 *
 * const shadowStyle = platformSelect({
 *   ios: { shadowColor: '#000', shadowOpacity: 0.2 },
 *   android: { elevation: 4 },
 *   default: {},
 * });
 * ```
 */

// Platform detection
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';
export const isNative = !isWeb;

// Get platform-specific value
export function platformSelect<T>(options: {
  ios?: T;
  android?: T;
  web?: T;
  native?: T;
  default?: T;
}): T | undefined {
  if (isIOS && options.ios !== undefined) return options.ios;
  if (isAndroid && options.android !== undefined) return options.android;
  if (isWeb && options.web !== undefined) return options.web;
  if (isNative && options.native !== undefined) return options.native;
  return options.default;
}

// Device type detection
const { width, height } = Dimensions.get('window');
const screenWidth = Math.min(width, height);

/**
 * Check if device is a tablet (based on screen size)
 */
export const isTablet = screenWidth >= 600;

/**
 * Check if device is a phone
 */
export const isPhone = !isTablet;

/**
 * Check if device is in landscape orientation
 */
export const isLandscape = width > height;

/**
 * Check if device is in portrait orientation
 */
export const isPortrait = !isLandscape;

/**
 * Check if device has a notch (iPhone X style)
 */
export const hasNotch = isIOS && (height >= 812 || width >= 812);

/**
 * Check if device has a dynamic island (iPhone 14 Pro+)
 */
export const hasDynamicIsland = isIOS && Platform.OS === 'ios' && (height >= 852 || width >= 852);

// Screen dimensions helpers
export const screenDimensions = {
  width,
  height,
  get aspectRatio() {
    return width / height;
  },
  get isSmall() {
    return screenWidth < 375; // iPhone SE, etc.
  },
  get isMedium() {
    return screenWidth >= 375 && screenWidth < 414;
  },
  get isLarge() {
    return screenWidth >= 414;
  },
};

// Pixel density helpers
export const pixelDensity = {
  ratio: PixelRatio.get(),
  fontScale: PixelRatio.getFontScale(),
  getPixelSizeForLayoutSize(size: number): number {
    return PixelRatio.getPixelSizeForLayoutSize(size);
  },
  roundToNearestPixel(size: number): number {
    return PixelRatio.roundToNearestPixel(size);
  },
};

/**
 * Normalize size based on screen width (responsive sizing)
 * Useful for making designs work across different screen sizes
 */
export function normalize(size: number, factor: number = 0.5): number {
  const baseWidth = 375; // iPhone 8 width as base
  const scale = screenWidth / baseWidth;
  const newSize = size * (1 + (scale - 1) * factor);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

// Safe area insets (for notched devices)
export const safeAreaInsets = {
  top:
    platformSelect({
      ios: hasNotch ? 44 : 20,
      android: StatusBar.currentHeight || 0,
      default: 0,
    }) || 0,
  bottom:
    platformSelect({
      ios: hasNotch ? 34 : 0,
      android: 0,
      default: 0,
    }) || 0,
  left: 0,
  right: 0,
};

// Platform-specific styles
export const platformStyles = {
  // Shadow styles
  shadow: platformSelect({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),

  // Larger shadow
  shadowLarge: platformSelect({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),

  // No shadow
  shadowNone: platformSelect({
    ios: {
      shadowColor: undefined,
      shadowOffset: undefined,
      shadowOpacity: undefined,
      shadowRadius: undefined,
    },
    android: {
      elevation: 0,
    },
    default: {},
  }),

  // Border styles (Android clips shadows, iOS doesn't)
  overflowVisible: platformSelect({
    ios: { overflow: 'visible' as const },
    android: { overflow: 'hidden' as const },
    default: {},
  }),

  // Text selection (Android has default background)
  textSelection: platformSelect({
    ios: {},
    android: { selectionColor: 'rgba(0,0,0,0.2)' },
    default: {},
  }),

  // Touchable feedback (Android uses ripple)
  touchableFeedback: platformSelect({
    ios: {},
    android: { background: { type: 'RippleAndroid' as const, color: undefined } },
    default: {},
  }),
};

// Feature detection
export const features = {
  /**
   * Check if device supports haptic feedback
   */
  get hapticsSupported() {
    return isNative;
  },

  /**
   * Check if device supports push notifications
   */
  get pushNotificationsSupported() {
    return isNative;
  },

  /**
   * Check if device supports biometrics
   */
  get biometricsSupported() {
    return isNative;
  },

  /**
   * Check if device supports local authentication
   */
  get localAuthSupported() {
    return isNative;
  },

  /**
   * Check if device supports file system access
   */
  get fileSystemSupported() {
    return isNative;
  },

  /**
   * Check if device supports background tasks
   */
  get backgroundTasksSupported() {
    return isNative;
  },

  /**
   * Check if device supports sharing
   */
  get sharingSupported() {
    return isNative;
  },

  /**
   * Check if device supports maps
   */
  get mapsSupported() {
    return true; // Most devices support maps
  },

  /**
   * Check if device supports camera
   */
  get cameraSupported() {
    return isNative;
  },

  /**
   * Check if device supports microphone
   */
  get microphoneSupported() {
    return isNative;
  },
};

// OS version helpers
export const osVersion = {
  /**
   * Get major version number
   */
  get major() {
    const version = Platform.Version;
    if (typeof version === 'string') {
      return parseInt(version.split('.')[0], 10);
    }
    return version;
  },

  /**
   * Check if running on iOS 13+
   */
  get isIOS13OrLater() {
    return isIOS && this.major >= 13;
  },

  /**
   * Check if running on iOS 14+
   */
  get isIOS14OrLater() {
    return isIOS && this.major >= 14;
  },

  /**
   * Check if running on iOS 15+
   */
  get isIOS15OrLater() {
    return isIOS && this.major >= 15;
  },

  /**
   * Check if running on Android 10+ (API 29+)
   */
  get isAndroid10OrLater() {
    return isAndroid && this.major >= 29;
  },

  /**
   * Check if running on Android 11+ (API 30+)
   */
  get isAndroid11OrLater() {
    return isAndroid && this.major >= 30;
  },

  /**
   * Check if running on Android 12+ (API 31+)
   */
  get isAndroid12OrLater() {
    return isAndroid && this.major >= 31;
  },
};

// Date/time helpers
export const dateTime = {
  /**
   * Get locale-appropriate date format
   */
  get dateFormat() {
    return platformSelect({
      ios: 'MM/dd/yyyy',
      android: 'dd/MM/yyyy',
      default: 'MM/dd/yyyy',
    });
  },

  /**
   * Get locale-appropriate time format
   */
  get timeFormat() {
    return platformSelect({
      ios: 'h:mm a',
      android: 'HH:mm',
      default: 'h:mm a',
    });
  },
};

// Navigation helpers
export const navigation = {
  /**
   * Default animation for screen transitions
   */
  defaultAnimation: platformSelect({
    ios: 'default',
    android: 'slide_from_right',
    default: 'default',
  }),

  /**
   * Modal presentation style
   */
  modalPresentation: platformSelect({
    ios: 'modal',
    android: 'modal',
    default: 'modal',
  }),

  /**
   * Header height
   */
  headerHeight: platformSelect({
    ios: hasNotch ? 88 : 64,
    android: 56,
    default: 64,
  }),

  /**
   * Tab bar height
   */
  tabBarHeight: platformSelect({
    ios: hasNotch ? 83 : 49,
    android: 56,
    default: 49,
  }),
};

// Keyboard helpers
export const keyboard = {
  /**
   * Behavior for KeyboardAvoidingView
   */
  avoidingViewBehavior: platformSelect<'padding' | 'height' | 'position'>({
    ios: 'padding',
    android: undefined, // Height on Android
    default: 'padding',
  }),

  /**
   * Default keyboard dismiss mode for scroll views
   */
  dismissMode: platformSelect({
    ios: 'interactive',
    android: 'on-drag',
    default: 'none',
  }),
};

// Animation helpers
export const animation = {
  /**
   * Default animation duration
   */
  defaultDuration: 300,

  /**
   * Spring animation config
   */
  springConfig: {
    friction: platformSelect({ ios: 8, android: 9, default: 8 }),
    tension: platformSelect({ ios: 40, android: 95, default: 40 }),
  },

  /**
   * Fade animation duration
   */
  fadeDuration: 200,

  /**
   * Slide animation duration
   */
  slideDuration: 300,
};

// Accessibility helpers
export const accessibility = {
  /**
   * Minimum touch target size (points)
   */
  minTouchTarget: 44,

  /**
   * Focus ring visibility
   */
  focusRingVisible: platformSelect({
    ios: true,
    android: false,
    default: true,
  }),

  /**
   * Screen reader status
   */
  get isScreenReaderEnabled() {
    // This would need to be fetched from AccessibilityInfo
    // Returning default value
    return false;
  },
};

// All utilities are exported as named exports above
