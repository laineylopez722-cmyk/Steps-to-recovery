/**
 * Material Design 3 Core Components
 * 
 * A unified, accessible component library following MD3 specifications.
 * All components include:
 * - WCAG AAA accessibility compliance
 * - Reanimated animations (60fps)
 * - Haptic feedback
 * - Theme integration
 * - TypeScript strict types
 */

// ============================================================================
// BUTTON SYSTEM
// ============================================================================

export { Button } from './Button';
export type { ButtonProps } from './Button';
export {
  buttonVariants,
  buttonTextVariants,
  fabVariants,
  fabIconVariants,
  iconButtonVariants,
  iconButtonIconVariants,
  type ButtonVariantProps,
  type ButtonTextVariantProps,
  type FABVariantProps,
  type FABIconVariantProps,
  type IconButtonVariantProps,
  type IconButtonIconVariantProps,
} from './Button/variants';

// ============================================================================
// CARD COMPONENT
// ============================================================================

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
  CardVariant,
  CardElevation,
} from './Card';

// ============================================================================
// INPUT COMPONENT
// ============================================================================

export { Input } from './Input';
export type { InputProps } from './Input';

// ============================================================================
// PROGRESS INDICATORS
// ============================================================================

export { LinearProgress, CircularProgress } from './Progress';
export type { LinearProgressProps, CircularProgressProps } from './Progress';
