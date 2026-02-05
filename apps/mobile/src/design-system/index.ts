/**
 * Design System Barrel Export
 * Central export for all design system tokens, hooks, and components
 */

// Context & Provider
export { ThemeProvider, ThemeContext } from './context/ThemeContext';
export type { Theme } from './context/ThemeContext';

// Hooks
export { useTheme, useColors, useIsDark } from './hooks/useTheme';
export {
  useFadeIn,
  useScaleIn,
  usePressAnimation,
  useBounceAnimation,
  useSlideIn,
  useFadeAndScaleIn,
  useNumberAnimation,
  useShakeAnimation,
  useCountUp,
  getStaggerDelay,
} from './hooks/useAnimation';

// Tokens
export { lightColors, darkColors, categoryColors } from './tokens/colors';
export { darkAccent, gradients, modernShadows, glass, timing } from './tokens/modern';
export type { ColorPalette, CategoryColor } from './tokens/colors';

export { typography } from './tokens/typography';
export type { TypographyStyle } from './tokens/typography';

export { spacing } from './tokens/spacing';
export type { SpacingKey } from './tokens/spacing';

export { radius } from './tokens/radius';
export type { RadiusKey } from './tokens/radius';

export { shadows } from './tokens/shadows';
export type { ShadowKey } from './tokens/shadows';

export {
  springConfigs,
  timingDurations,
  easingCurves,
  scales,
  opacities,
  createTimingConfig,
  animationPresets,
  reanimatedSprings,
} from './tokens/animations';
export type {
  SpringConfigKey,
  TimingDurationKey,
  EasingCurveKey,
  ReanimatedSpringKey,
} from './tokens/animations';

// Components
export {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  FloatingActionButton,
  Input,
  ListItem,
  Modal,
  ProgressBar,
  SobrietyCounter,
  Text,
  TextArea,
  Toast,
  Toggle,
  // Premium UI Components
  AnimatedCheckmark,
  GlassCard,
  GradientButton,
  GlassListItem,
  SwipeableListItem,
  BottomSheet,
  CircularProgress,
  PullToRefresh,
  RefreshIndicator,
  ContextMenu,
  BreathingCircle,
  Skeleton,
  SkeletonGroup,
  ProfileSkeleton,
  CardSkeleton,
} from './components';
export type {
  BadgeProps,
  ButtonProps,
  CardProps,
  DividerProps,
  EmptyStateProps,
  FloatingActionButtonProps,
  InputProps,
  ListItemProps,
  Milestone,
  ModalAction,
  ModalProps,
  ModalVariant,
  ProgressBarProps,
  SobrietyCounterProps,
  TextAreaProps,
  TextProps,
  ToastProps,
  ToastVariant,
  ToggleProps,
  // Premium UI Component Types
  AnimatedCheckmarkProps,
  GlassCardProps,
  GradientButtonProps,
  GlassListItemProps,
  SwipeableListItemProps,
  SwipeAction,
  BottomSheetProps,
  BottomSheetRef,
  CircularProgressProps,
  PullToRefreshProps,
  ContextMenuProps,
  ContextMenuItem,
  BreathingCircleProps,
  SkeletonProps,
  SkeletonGroupProps,
} from './components';
