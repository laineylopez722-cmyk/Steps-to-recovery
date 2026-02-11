/**
 * Animation Components
 *
 * React components for animation error handling.
 *
 * @example
 * ```tsx
 * import { AccessibilityErrorBoundary, SafeAnimation } from '@/design-system/animations/components';
 *
 * <AccessibilityErrorBoundary fallback={<StaticView />}>
 *   <AnimatedView />
 * </AccessibilityErrorBoundary>
 * ```
 */

export {
  AccessibilityErrorBoundary,
  SafeAnimation,
  AnimationDisabledBanner,
  useAnimationError,
  type SafeAnimationProps,
} from './AccessibilityErrorBoundary';
