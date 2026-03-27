/**
 * Design System Components Barrel Export
 */

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { Button } from './Button';
export type { ButtonProps } from './Button';

// Card is exported from GlassCard below as 'Card'
export type { CardProps } from './Card';

export { Input } from './Input';
export type { InputProps } from './Input';

export { ProgressBar } from './ProgressBar';
export type { ProgressBarProps } from './ProgressBar';

export { Toggle } from './Toggle';
export type { ToggleProps } from './Toggle';

export { SobrietyCounter } from './SobrietyCounter';
export type { SobrietyCounterProps } from './SobrietyCounter';

export { Modal } from './Modal';
export type { ModalProps, ModalAction, ModalVariant } from './Modal';

export { TextArea } from './TextArea';
export type { TextAreaProps } from './TextArea';

export { Toast } from './Toast';
export type { ToastProps, ToastVariant } from './Toast';

export { EmptyState, EmptySearch, EmptyJournal } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { ListItem } from './ListItem';
export type { ListItemProps } from './ListItem';

export { Divider } from './Divider';
export type { DividerProps } from './Divider';

export { Text } from './Text';
export type { TextProps } from './Text';

export {
  DisplayLarge,
  DisplayMedium,
  DisplaySmall,
  HeadlineLarge,
  HeadlineMedium,
  HeadlineSmall,
  TitleLarge,
  TitleMedium,
  TitleSmall,
  BodyLarge,
  BodyMedium,
  BodySmall,
  LabelLarge,
  LabelMedium,
  LabelSmall,
} from './Typography';
export type { TypographyProps } from './Typography';

// Premium UI Components
export { AnimatedCheckmark } from './AnimatedCheckmark';
export type { AnimatedCheckmarkProps } from './AnimatedCheckmark';

export { CircularProgress } from './CircularProgress';
export type { CircularProgressProps } from './CircularProgress';

export { BreathingCircle } from './BreathingCircle';
export type { BreathingCircleProps } from './BreathingCircle';

export {
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonListItem,
  SkeletonStats,
  SkeletonHome,
  SkeletonJournalList,
} from './Skeleton';
export type { SkeletonProps } from './Skeleton';

// Modern 2025 Components
export { GlassCard, GlassCard as Card } from './GlassCard';
export type { GlassCardProps, GradientType } from './GlassCard';

export { GradientButton } from './GradientButton';
export type { GradientButtonProps } from './GradientButton';

export { AsyncImage, Avatar, ZoomableImage } from './AsyncImage';
export type { AsyncImageProps, AvatarProps, ZoomableImageProps } from './AsyncImage';

export {
  ScreenReaderText,
  AccessibleButton,
  Focusable,
  AccessibleField,
  AccessibleProgress,
  LiveRegion,
  SkipLink,
  Heading,
  AccessibleList,
  AccessibleListItem,
  announce,
  isScreenReaderEnabled,
} from './AccessibilityHelpers';

// Themed Components
export { AmberButton } from './AmberButton';
export type { AmberButtonProps } from './AmberButton';

// Illustration System
export {
  Illustration,
  OnboardingIllustration,
  BadgeIllustration,
  EmptyStateIllustration,
} from './Illustration';
export type { IllustrationProps } from './Illustration';

// ============================================================================
// Material Design 3 Recovery Components (Warm Theme)
// ============================================================================

// DailyCheckInCard - Morning/Evening check-in card
export { DailyCheckInCard } from './DailyCheckInCard';
export type { DailyCheckInCardProps, CheckInSection, CheckInState } from './DailyCheckInCard';

// AchievementBadge - Achievement unlock with animation
export { AchievementBadge, AchievementGrid } from './AchievementBadge';
export type { AchievementBadgeProps, Achievement, AchievementGridProps } from './AchievementBadge';

// ============================================================================
// Material Design 3 Core Components (New Unified Library)
// ============================================================================

// MD3 Button System
export {
  // Main Button
  Button as MD3Button,
} from './core/Button';
export {
  // Variants
  buttonVariants,
  buttonTextVariants,
  fabVariants,
  fabIconVariants,
  iconButtonVariants,
  iconButtonIconVariants,
  // Types
  type ButtonVariantProps as MD3ButtonVariantProps,
  type ButtonTextVariantProps as MD3ButtonTextVariantProps,
  type FABVariantProps,
  type FABIconVariantProps,
  type IconButtonVariantProps,
  type IconButtonIconVariantProps,
} from './core/Button/variants';
export type { ButtonProps as MD3ButtonProps } from './core/Button';

// MD3 Card System
export {
  Card as MD3Card,
  CardHeader as MD3CardHeader,
  CardTitle as MD3CardTitle,
  CardDescription as MD3CardDescription,
  CardContent as MD3CardContent,
  CardFooter as MD3CardFooter,
} from './core/Card';
export type {
  CardProps as MD3CardProps,
  CardHeaderProps as MD3CardHeaderProps,
  CardTitleProps as MD3CardTitleProps,
  CardDescriptionProps as MD3CardDescriptionProps,
  CardContentProps as MD3CardContentProps,
  CardFooterProps as MD3CardFooterProps,
  CardVariant as MD3CardVariant,
  CardElevation as MD3CardElevation,
} from './core/Card';

// MD3 Input System
export { Input as MD3Input } from './core/Input';
export type { InputProps as MD3InputProps } from './core/Input';

// MD3 Progress Indicators
export {
  CircularProgress as MD3CircularProgress,
} from './core/Progress';
export type {
  CircularProgressProps as MD3CircularProgressProps,
} from './core/Progress';
