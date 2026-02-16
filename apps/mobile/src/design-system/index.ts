// Unified exports for the design system
export {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  EmptySearch,
  EmptyJournal,
  Input,
  ListItem,
  Modal,
  ProgressBar,
  SobrietyCounter,
  TextArea,
  Text,
  Toast,
  Toggle,
  AnimatedCheckmark,
  GlassCard,
  GradientButton,
  CircularProgress,
  BreathingCircle,
  Skeleton,
  SkeletonCard,
  SkeletonListItem,
  SkeletonStats,
  SkeletonHome,
  SkeletonList,
  AsyncImage,
  Avatar,
  ZoomableImage,
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
  AmberButton,
  // Illustration System
  Illustration,
  OnboardingIllustration,
  BadgeIllustration,
  EmptyStateIllustration,
  // Material Design 3 Recovery Components
  DailyCheckInCard,
  AchievementBadge,
  AchievementGrid,
} from './components';

export { ThemeProvider } from './context/ThemeContext';
export { useTheme, useColors, useIsDark } from './hooks/useTheme';
export { useMotionPress } from './hooks/useMotionPress';
export { useThemedStyles } from './hooks/useThemedStyles';
export { Action, useActionMotion } from './primitives';
export { ScreenAnimations } from './tokens/screen-animations';
export {
  serene,
  sereneGlow,
  serenePillRow,
  sereneRing,
  premiumTypographyAliases,
  backgroundTexture,
  getSereneProgressBarStyles,
  getSereneRingMetrics,
  getSereneTextureOverlay,
} from './tokens/serene';
// Legacy motion exports
export {
  MotionTransitions,
  motionDuration,
  motionSpring,
  motionScale,
  motionTiming,
  motionShimmer,
} from './tokens/motion';

// Material Design 3 Motion System
export {
  md3Duration,
  md3Easing,
  md3Motion,
  md3Spring,
  md3Transitions,
  motionSystem,
} from './tokens/motion';
export type {
  MD3DurationKey,
  MD3EasingKey,
  MD3MotionKey,
  MD3SpringKey,
  MD3TransitionKey,
} from './tokens/motion';
export { glass, glow, glassGradients } from './tokens/glass';
export {
  aestheticColors,
  gradients,
  atmosphericShadows,
  aestheticTypography,
  aestheticSpacing,
  aestheticRadius,
  calmingMotion,
  premiumEffects,
  componentPatterns,
} from './tokens/aesthetic';
export {
  useTheme as useThemeTokens,
  darkColors,
  lightColors,
  spacing as themeSpacing,
  typography as themeTypography,
  borderRadius as themeBorderRadius,
} from './tokens/theme';
export type { Theme } from './tokens/theme';

// Material Design 3 Token System
export { md3Colors, md3ColorsDark } from './tokens/colors';
export type { MD3Colors, MD3ColorsDark } from './tokens/colors';

export { md3Typography, typographySystem } from './tokens/typography';
export type { MD3TypographyStyle } from './tokens/typography';

export {
  md3Spacing,
  md3ComponentSpacing,
  md3Elevation,
  spacingSystem,
  getSpacing,
} from './tokens/spacing';
export type { MD3SpacingKey, MD3ComponentSpacingKey, MD3ElevationKey } from './tokens/spacing';

export {
  md3Shadows,
  md3ShadowLevel0,
  md3ShadowLevel1,
  md3ShadowLevel2,
  md3ShadowLevel3,
  md3ShadowLevel4,
  md3ShadowLevel5,
  md3ComponentShadows,
  md3ComponentShadowsDark,
  shadowSystem,
} from './tokens/shadows';
export type { MD3ShadowLevel, MD3ComponentShadowKey } from './tokens/shadows';
export type { ActionRootProps, UseActionMotionOptions } from './primitives';
export {
  pressAnimation,
  hoverAnimation,
  successAnimation,
  attentionAnimation,
  loadingAnimation,
  breathingAnimation,
  usePressAnimation,
  useHoverAnimation,
  useSuccessAnimation,
  useAttentionAnimation,
  useShimmerAnimation,
  useBreathingAnimation,
  useStaggerAnimation,
} from './tokens/micro-animations';

export type {
  BadgeProps,
  ButtonProps,
  CardProps,
  DividerProps,
  EmptyStateProps,
  InputProps,
  ListItemProps,
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
  AnimatedCheckmarkProps,
  GlassCardProps,
  GradientButtonProps,
  CircularProgressProps,
  BreathingCircleProps,
  SkeletonProps,
  AsyncImageProps,
  AvatarProps,
  ZoomableImageProps,
  AmberButtonProps,
  IllustrationProps,
  // Material Design 3 Recovery Component Types
  DailyCheckInCardProps,
  CheckInSection,
  CheckInState,
  AchievementBadgeProps,
  Achievement,
  AchievementGridProps,
} from './components';

// Material Design 3 Warm Theme Tokens
export {
  sageGreen,
  amber,
  coral,
  error,
  neutral,
  neutralVariant,
  md3LightColors,
  md3DarkColors,
  elevationOverlayOpacity,
} from './tokens/md3-colors';
export type { MD3LightColors, MD3DarkColors } from './tokens/md3-colors';

export {
  md3ElevationLight,
  md3ElevationDark,
  stateLayerOpacity,
  md3RippleConfig,
  md3Shape,
  md3Motion as md3MotionElevation,
  md3Typography as md3TypographyElevation,
  md3Tokens,
} from './tokens/md3-elevation';
export type { ElevationStyle } from './tokens/md3-elevation';

// Micro-Interactions and Animation System
export * from './animations';

export * from './review';

// Theme-aware design system tokens
export { DsProvider, useDs, useDsIsDark } from './DsProvider';
export { ds, createDs, paletteLight, colorsLight, semanticLight, shadowsLight } from './tokens/ds';
export type { DS } from './tokens/ds';
