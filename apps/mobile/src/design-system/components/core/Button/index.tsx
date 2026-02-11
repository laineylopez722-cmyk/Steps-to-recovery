/**
 * Material Design 3 Button Component
 *
 * A comprehensive button system following MD3 specifications:
 * - Filled, Outlined, Text, Elevated, Tonal variants
 * - Press animation with scale feedback (0.95 → 1.0, 150ms)
 * - Haptic feedback on press
 * - Full accessibility support (WCAG AAA)
 * - Loading and disabled states
 *
 * @example
 * ```tsx
 * // Filled button (default)
 * <Button onPress={handlePress}>Save Entry</Button>
 *
 * // Outlined button
 * <Button variant="outlined" onPress={handleCancel}>Cancel</Button>
 *
 * // With icon
 * <Button icon={<PlusIcon />} onPress={handleAdd}>Add New</Button>
 *
 * // Loading state
 * <Button loading onPress={handleSubmit}>Submit</Button>
 *
 * // Full width
 * <Button fullWidth onPress={handleConfirm}>Confirm</Button>
 * ```
 */

import React, { useCallback, forwardRef, type ReactElement, type ReactNode } from 'react';
import {
  Pressable,
  ActivityIndicator,
  type PressableProps,
  type View,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../../hooks/useTheme';
import { hapticLight, hapticMedium } from '../../../../utils/haptics';
import { cn } from '../../../../lib/utils';
import { buttonVariants, buttonTextVariants, type ButtonVariantProps } from './variants';
import { Text } from '../../Text';

// ============================================================================
// TYPES
// ============================================================================

export interface ButtonProps
  extends Omit<PressableProps, 'children' | 'style'>, ButtonVariantProps {
  /**
   * Button label text
   */
  children: string;
  /**
   * Optional icon to display before text
   */
  icon?: ReactNode;
  /**
   * Loading state - shows activity indicator
   */
  loading?: boolean;
  /**
   * Full width button
   */
  fullWidth?: boolean;
  /**
   * Custom container style
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Accessibility label for screen readers
   * Defaults to children text if not provided
   */
  accessibilityLabel?: string;
  /**
   * Accessibility hint describing the action
   */
  accessibilityHint?: string;
  /**
   * Accessibility role
   * @default 'button'
   */
  accessibilityRole?: AccessibilityRole;
  /**
   * Custom haptic style
   * @default 'light'
   */
  hapticStyle?: 'light' | 'medium' | 'none';
  /**
   * Disable press animation
   */
  disableAnimation?: boolean;
  /**
   * Test ID for testing
   */
  testID?: string;
}

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

const PRESS_SCALE = 0.95;
const PRESS_DURATION = 150; // ms
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Material Design 3 Button
 *
 * Features:
 * - Press scale animation (0.95 → 1.0)
 * - Haptic feedback
 * - Loading state with spinner
 * - Full accessibility support
 * - WCAG AAA compliant (48x48dp minimum touch target)
 */
export const Button = forwardRef<View, ButtonProps>(
  (
    {
      children,
      onPress,
      onPressIn,
      onPressOut,
      icon,
      variant = 'filled',
      size = 'medium',
      loading = false,
      disabled = false,
      fullWidth = false,
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole = 'button',
      accessibilityState,
      hapticStyle = 'light',
      disableAnimation = false,
      style,
      testID,
      ...pressableProps
    },
    ref,
  ): ReactElement => {
    const theme = useTheme();
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    // Determine if button is effectively disabled
    const isDisabled = disabled || loading;

    // Animated styles for press feedback
    const animatedStyle = useAnimatedStyle(() => {
      if (disableAnimation || isDisabled) {
        return {};
      }
      return {
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
      };
    }, [disableAnimation, isDisabled]);

    // Handle press in - start scale down animation
    const handlePressIn = useCallback(
      (event: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
        if (isDisabled) return;

        // Scale down animation
        scale.value = withTiming(PRESS_SCALE, {
          duration: PRESS_DURATION,
          easing: Easing.out(Easing.cubic),
        });

        onPressIn?.(event);
      },
      [isDisabled, onPressIn, scale],
    );

    // Handle press out - spring back animation
    const handlePressOut = useCallback(
      (event: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
        if (isDisabled) return;

        // Spring back to normal
        scale.value = withSpring(1, SPRING_CONFIG);

        onPressOut?.(event);
      },
      [isDisabled, onPressOut, scale],
    );

    // Handle press with haptic feedback
    const handlePress = useCallback(
      async (event: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
        if (isDisabled) return;

        // Trigger haptic feedback
        if (hapticStyle !== 'none') {
          try {
            if (hapticStyle === 'medium') {
              await hapticMedium();
            } else {
              await hapticLight();
            }
          } catch {
            // Haptics may not be available, silently fail
          }
        }

        onPress?.(event);
      },
      [isDisabled, hapticStyle, onPress],
    );

    // Compute accessibility state
    const computedAccessibilityState: AccessibilityState = {
      disabled: isDisabled,
      busy: loading,
      ...accessibilityState,
    };

    // Compute class names
    const containerClasses = cn(
      buttonVariants({
        variant,
        size,
        fullWidth,
        disabled: isDisabled,
        loading,
      }),
    );

    const textClasses = cn(
      buttonTextVariants({
        variant,
        size,
        disabled: isDisabled,
      }),
    );

    // Determine indicator color based on variant
    const getIndicatorColor = () => {
      switch (variant) {
        case 'filled':
        case 'tonal':
          return theme.colors.semantic.text.onPrimary;
        case 'outlined':
        case 'text':
        case 'elevated':
        default:
          return theme.colors.primary;
      }
    };

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityLabel={accessibilityLabel || children}
        accessibilityRole={accessibilityRole}
        accessibilityHint={accessibilityHint}
        accessibilityState={computedAccessibilityState}
        testID={testID}
        {...pressableProps}
      >
        <Animated.View style={[animatedStyle, style]} className={containerClasses}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={getIndicatorColor()}
              accessibilityLabel="Loading"
              accessibilityRole="progressbar"
            />
          ) : (
            <>
              {icon && <Animated.View pointerEvents="none">{icon}</Animated.View>}
              <Text className={textClasses}>{children}</Text>
            </>
          )}
        </Animated.View>
      </Pressable>
    );
  },
);

Button.displayName = 'Button';

export default Button;
