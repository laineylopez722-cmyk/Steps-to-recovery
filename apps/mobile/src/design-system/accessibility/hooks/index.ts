/**
 * Accessibility Hooks
 *
 * React hooks for accessibility features and screen reader support.
 *
 * @example
 * ```tsx
 * import { useReducedMotion, useA11yAnnouncer } from '@/design-system/accessibility/hooks';
 *
 * function MyComponent() {
 *   const { isReducedMotion } = useReducedMotion();
 *   const { announce } = useA11yAnnouncer();
 *
 *   return <View />;
 * }
 * ```
 */

// Reduced motion detection
export {
  useReducedMotion,
  type UseReducedMotionReturn,
  type ReducedMotionSettings,
} from './useReducedMotion';

// Comprehensive accessibility info
export {
  useAccessibilityInfo,
  type UseAccessibilityInfoReturn,
  type AccessibilityInfoState,
  type ColorBlindnessType,
} from './useAccessibilityInfo';

// Screen reader announcer with queue
export {
  useA11yAnnouncer,
  type UseA11yAnnouncerReturn,
  type AnnouncementPriority,
  type AnnouncementOptions,
} from './useA11yAnnouncer';

// Legacy hook (re-export from parent for compatibility)
export { useAccessibility, type UseAccessibilityReturn } from '../useAccessibility';

// Re-export from useAccessibility for convenience
export {
  useAccessibilityContext,
  AccessibilityProvider,
  type AccessibilityProviderProps,
  type AccessibilityContextValue,
} from '../AccessibilityProvider';
