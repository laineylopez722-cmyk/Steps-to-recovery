/**
 * Material Design 3 Card Component
 *
 * A versatile container component following MD3 specifications:
 * - Surface background with tonal elevation
 * - MD3 elevation levels (0-5) with shadow overlays
 * - 16dp corner radius (rounded-2xl)
 * - 16dp padding (p-4)
 * - Optional ripple on press
 * - Hover/focus states for web
 *
 * MD3 Card Types:
 * - Elevated: Card with shadow at level 1
 * - Filled: Card with solid color at level 0
 * - Outlined: Card with outline border
 *
 * @example
 * ```tsx
 * // Basic card
 * <Card>
 *   <CardContent>
 *     <Text>Card content</Text>
 *   </CardContent>
 * </Card>
 *
 * // Elevated card
 * <Card variant="elevated" elevation={2}>
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>Content</CardContent>
 * </Card>
 *
 * // Interactive card with press
 * <Card onPress={handlePress}>
 *   <CardContent>Tap me</CardContent>
 * </Card>
 * ```
 */

import React, { forwardRef, type ReactElement, type ReactNode } from 'react';
import {
  View,
  Pressable,
  type ViewProps,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type AccessibilityRole,
  type AccessibilityState,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../../hooks/useTheme';
import { hapticLight } from '../../../../utils/haptics';
import { cn } from '../../../../lib/utils';
import {
  md3ElevationLight,
  md3ElevationDark,
  type ElevationStyle,
} from '../../../tokens/md3-elevation';

// ============================================================================
// TYPES
// ============================================================================

export type CardVariant = 'elevated' | 'filled' | 'outlined';
export type CardElevation = 0 | 1 | 2 | 3 | 4 | 5;

export interface CardProps extends Omit<ViewProps, 'style'> {
  /**
   * Card variant type
   * @default 'filled'
   */
  variant?: CardVariant;
  /**
   * Elevation level (0-5)
   * Only applies to 'elevated' variant
   * @default 1
   */
  elevation?: CardElevation;
  /**
   * Callback when card is pressed
   * Makes the card interactive with ripple effect
   */
  onPress?: () => void;
  /**
   * Card content
   */
  children: ReactNode;
  /**
   * Custom container style
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Disable press animation
   */
  disableAnimation?: boolean;
  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;
  /**
   * Accessibility hint
   */
  accessibilityHint?: string;
  /**
   * Accessibility role
   * @default 'button' when onPress is provided, otherwise undefined
   */
  accessibilityRole?: AccessibilityRole;
  /**
   * Test ID for testing
   */
  testID?: string;
}

// Sub-component props
export interface CardHeaderProps extends ViewProps {
  children: ReactNode;
}

export interface CardContentProps extends ViewProps {
  children: ReactNode;
}

export interface CardFooterProps extends ViewProps {
  children: ReactNode;
}

export interface CardTitleProps extends ViewProps {
  children: ReactNode;
}

export interface CardDescriptionProps extends ViewProps {
  children: ReactNode;
}

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

const PRESS_SCALE = 0.98;
const PRESS_DURATION = 150;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
};

// ============================================================================
// ELEVATION UTILITIES
// ============================================================================

/**
 * Get elevation styles based on theme and level
 */
function getElevationStyles(isDark: boolean, level: CardElevation): ElevationStyle {
  const elevations = isDark ? md3ElevationDark : md3ElevationLight;
  const key = `level${level}` as const;
  return elevations[key] || elevations.level0;
}

// ============================================================================
// CARD COMPONENT
// ============================================================================

/**
 * Material Design 3 Card
 *
 * Features:
 * - MD3 elevation system with surface tint
 * - Interactive ripple on press
 * - Press scale animation
 * - Full accessibility support
 */
export const Card = forwardRef<View, CardProps>(
  (
    {
      children,
      variant = 'filled',
      elevation = 1,
      onPress,
      style,
      disableAnimation = false,
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole,
      testID,
      ...viewProps
    },
    ref,
  ): ReactElement => {
    const theme = useTheme();
    const isDark = theme.isDark ?? false;
    const scale = useSharedValue(1);
    const isInteractive = !!onPress;

    // Get elevation styles
    const elevationStyles = getElevationStyles(isDark, elevation);

    // Animated style for press feedback
    const animatedStyle = useAnimatedStyle(() => {
      if (!isInteractive || disableAnimation) {
        return {};
      }
      return {
        transform: [{ scale: scale.value }],
      };
    }, [isInteractive, disableAnimation]);

    // Handle press animations
    const handlePressIn = () => {
      if (!isInteractive || disableAnimation) return;
      scale.value = withTiming(PRESS_SCALE, {
        duration: PRESS_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    };

    const handlePressOut = () => {
      if (!isInteractive || disableAnimation) return;
      scale.value = withSpring(1, SPRING_CONFIG);
    };

    const handlePress = async () => {
      if (!isInteractive) return;

      try {
        await hapticLight();
      } catch {
        // Haptics may not be available
      }

      onPress?.();
    };

    // Compute container classes based on variant
    const containerClasses = cn(
      'rounded-2xl p-4 overflow-hidden',
      // Variant-specific styles
      variant === 'filled' && 'bg-surfaceContainerLowest',
      variant === 'elevated' && 'bg-surfaceContainerLow',
      variant === 'outlined' && 'bg-surface border border-outline',
    );

    // Compute shadow/elevation styles
    const shadowStyles: ViewStyle =
      variant === 'elevated'
        ? {
            shadowColor: elevationStyles.shadowColor,
            shadowOffset: elevationStyles.shadowOffset,
            shadowOpacity: elevationStyles.shadowOpacity,
            shadowRadius: elevationStyles.shadowRadius,
            elevation: elevationStyles.elevation,
          }
        : {};

    // Accessibility configuration
    const computedAccessibilityRole: AccessibilityRole | undefined =
      accessibilityRole ?? (isInteractive ? 'button' : undefined);

    const accessibilityState: AccessibilityState | undefined = isInteractive
      ? { disabled: false }
      : undefined;

    const CardContent = (
      <Animated.View
        ref={ref}
        style={[shadowStyles, animatedStyle, style]}
        className={containerClasses}
        testID={testID}
        {...viewProps}
      >
        {children}
      </Animated.View>
    );

    // Wrap in Pressable if interactive
    if (isInteractive) {
      return (
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityRole={computedAccessibilityRole}
          accessibilityState={accessibilityState}
        >
          {CardContent}
        </Pressable>
      );
    }

    return CardContent;
  },
);

Card.displayName = 'Card';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Card Header
 * Contains title, subtitle, and optional actions
 */
export const CardHeader = forwardRef<View, CardHeaderProps>(
  ({ children, className, ...props }, ref): ReactElement => (
    <View ref={ref} className={cn('flex flex-col gap-1 mb-3', className)} {...props}>
      {children}
    </View>
  ),
);
CardHeader.displayName = 'CardHeader';

/**
 * Card Title
 * Main heading within the card
 */
export const CardTitle = forwardRef<View, CardTitleProps>(
  ({ children, className, ...props }, ref): ReactElement => (
    <View ref={ref} className={cn('', className)} {...props}>
      <Animated.Text className="text-lg font-semibold text-onSurface" accessibilityRole="header">
        {children}
      </Animated.Text>
    </View>
  ),
);
CardTitle.displayName = 'CardTitle';

/**
 * Card Description
 * Subtitle or supporting text
 */
export const CardDescription = forwardRef<View, CardDescriptionProps>(
  ({ children, className, ...props }, ref): ReactElement => (
    <View ref={ref} className={cn('', className)} {...props}>
      <Animated.Text className="text-sm text-onSurfaceVariant">{children}</Animated.Text>
    </View>
  ),
);
CardDescription.displayName = 'CardDescription';

/**
 * Card Content
 * Main content area of the card
 */
export const CardContent = forwardRef<View, CardContentProps>(
  ({ children, className, ...props }, ref): ReactElement => (
    <View ref={ref} className={cn('', className)} {...props}>
      {children}
    </View>
  ),
);
CardContent.displayName = 'CardContent';

/**
 * Card Footer
 * Bottom section for actions or additional info
 */
export const CardFooter = forwardRef<View, CardFooterProps>(
  ({ children, className, ...props }, ref): ReactElement => (
    <View
      ref={ref}
      className={cn('flex flex-row items-center justify-end gap-2 mt-4 pt-2', className)}
      {...props}
    >
      {children}
    </View>
  ),
);
CardFooter.displayName = 'CardFooter';

export default Card;
