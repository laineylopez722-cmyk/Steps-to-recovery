/**
 * Design System Components Barrel Export
 */

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { Button } from './Button';
export type { ButtonProps } from './Button';

// Card is exported from GlassCard below as 'Card'
export type { CardProps } from './Card';

export { FloatingActionButton } from './FloatingActionButton';
export type { FloatingActionButtonProps } from './FloatingActionButton';

export { Input } from './Input';
export type { InputProps } from './Input';

export { ProgressBar } from './ProgressBar';
export type { ProgressBarProps } from './ProgressBar';

export { Toggle } from './Toggle';
export type { ToggleProps } from './Toggle';

export { SobrietyCounter } from './SobrietyCounter';
export type { SobrietyCounterProps } from './SobrietyCounter';

export { SobrietyCandle } from './SobrietyCandle';
export type { SobrietyCandleProps } from './SobrietyCandle';

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

// Premium UI Components
export { AnimatedCheckmark } from './AnimatedCheckmark';
export type { AnimatedCheckmarkProps } from './AnimatedCheckmark';

export { SwipeableListItem } from './SwipeableListItem';
export type { SwipeableListItemProps, SwipeAction } from './SwipeableListItem';

export { BottomSheet, ActionSheetItem, ActionSheetDivider } from './BottomSheet';
export type { BottomSheetProps, ActionSheetItemProps } from './BottomSheet';

export { CircularProgress } from './CircularProgress';
export type { CircularProgressProps } from './CircularProgress';

export { PullToRefresh } from './PullToRefresh';
export type { PullToRefreshProps } from './PullToRefresh';

export { ContextMenu } from './ContextMenu';
export type { ContextMenuProps, ContextMenuItem } from './ContextMenu';

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

export { GlassListItem } from './GlassListItem';
export type { GlassListItemProps } from './GlassListItem';

export { ConfettiCelebration, MilestoneCelebration } from './ConfettiCelebration';

export { ParallaxHeader, ParallaxScrollView, StickyHeader } from './ParallaxHeader';

export {
  AnimatedCheckbox,
  AnimatedToggle,
  AnimatedRadio,
  SuccessCheckmark,
  AnimatedCounter,
  FavoriteButton,
  BouncingBadge,
} from './MicroInteractions';

export { ThemeToggle, CompactThemeToggle } from './ThemeToggle';

export { AsyncImage, Avatar, ZoomableImage } from './AsyncImage';
export type { AsyncImageProps, AvatarProps, ZoomableImageProps } from './AsyncImage';

export {
  SearchExperience,
  FilterChip,
  SearchResultsHeader,
  HighlightedText,
} from './SearchExperience';

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

// Themed Components (Organic Calming + Dark Luxury)
export { AmberButton } from './AmberButton';
export type { AmberButtonProps } from './AmberButton';

export { TealCard } from './TealCard';
export type { TealCardProps } from './TealCard';

export { SageCard } from './SageCard';
export type { SageCardProps } from './SageCard';

export { LavenderCard } from './LavenderCard';
export type { LavenderCardProps } from './LavenderCard';

export { GoldButton } from './GoldButton';
export type { GoldButtonProps } from './GoldButton';

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

// StreakCounter - Clean time tracker with circular display
export { StreakCounter } from './StreakCounter';
export type { StreakCounterProps, Milestone } from './StreakCounter';

// DailyCheckInCard - Morning/Evening check-in card
export { DailyCheckInCard } from './DailyCheckInCard';
export type { DailyCheckInCardProps, CheckInSection, CheckInState } from './DailyCheckInCard';

// JournalEntryCard - Journal entry with mood and tags
export { JournalEntryCard } from './JournalEntryCard';
export type { JournalEntryCardProps, MoodType, CravingLevel } from './JournalEntryCard';

// StepProgressTracker - 12-step progress visualization
export { StepProgressTracker } from './StepProgressTracker';
export type { StepProgressTrackerProps, Step, StepStatus } from './StepProgressTracker';

// AchievementBadge - Achievement unlock with animation
export { AchievementBadge, AchievementGrid } from './AchievementBadge';
export type { AchievementBadgeProps, Achievement, AchievementGridProps } from './AchievementBadge';

// CrisisFAB - Emergency safety kit button
export { CrisisFAB, CrisisButtonGroup } from './CrisisFAB';
export type {
  CrisisFABProps,
  CrisisFABVariant,
  CrisisFABSize,
  CrisisButtonGroupProps,
} from './CrisisFAB';

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
  LinearProgress as MD3LinearProgress,
  CircularProgress as MD3CircularProgress,
} from './core/Progress';
export type {
  LinearProgressProps as MD3LinearProgressProps,
  CircularProgressProps as MD3CircularProgressProps,
} from './core/Progress';
