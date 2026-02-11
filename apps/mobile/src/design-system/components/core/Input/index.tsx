/**
 * Material Design 3 Input Component
 * 
 * A text input following MD3 specifications:
 * - 56dp height (h-14)
 * - 12dp corner radius (rounded-xl)
 * - Floating label animation
 * - Focus state with border color transition
 * - Error state with helper text
 * - Leading/trailing icons support
 * - Full accessibility (WCAG AAA)
 * 
 * @example
 * ```tsx
 * // Basic input
 * <Input
 *   label="Email"
 *   value={email}
 *   onChangeText={setEmail}
 * />
 * 
 * // With icon and error
 * <Input
 *   label="Password"
 *   value={password}
 *   onChangeText={setPassword}
 *   secureTextEntry
 *   leftIcon={<LockIcon />}
 *   error={passwordError}
 *   helperText="Must be at least 8 characters"
 * />
 * 
 * // Disabled state
 * <Input
 *   label="Username"
 *   value={username}
 *   disabled
 * />
 * ```
 */

import React, {
  useState,
  useCallback,
  forwardRef,
  useRef,
  useEffect,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
  type TextStyle,
  type AccessibilityRole,
  type AccessibilityState,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../../hooks/useTheme';
import { cn } from '../../../../lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /**
   * Input label - floats when focused or has value
   */
  label: string;
  /**
   * Current input value
   */
  value: string;
  /**
   * Change handler
   */
  onChangeText?: (text: string) => void;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Helper text displayed below input
   */
  helperText?: string;
  /**
   * Icon displayed at the start of input
   */
  leftIcon?: ReactNode;
  /**
   * Icon displayed at the end of input
   */
  rightIcon?: ReactNode;
  /**
   * Whether the field is required
   */
  required?: boolean;
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  /**
   * Custom container style
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Custom input style
   */
  inputStyle?: StyleProp<TextStyle>;
  /**
   * Accessibility label
   * Defaults to the label text if not provided
   */
  accessibilityLabel?: string;
  /**
   * Accessibility hint
   */
  accessibilityHint?: string;
  /**
   * Test ID for testing
   */
  testID?: string;
}

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

const FLOATING_LABEL_SCALE = 0.75;
const FLOATING_LABEL_TRANSLATE_Y = -28;
const ANIMATION_DURATION = 200;

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Material Design 3 Input
 * 
 * Features:
 * - Floating label animation
 * - Focus/error state transitions
 * - Leading/trailing icon support
 * - Helper text and error display
 * - Full accessibility support
 * - WCAG AAA compliant (48x48dp minimum touch target)
 */
export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      value,
      onChangeText,
      error,
      helperText,
      leftIcon,
      rightIcon,
      required = false,
      disabled = false,
      secureTextEntry,
      placeholder,
      containerStyle,
      inputStyle,
      accessibilityLabel,
      accessibilityHint,
      testID,
      onFocus,
      onBlur,
      onChange,
      ...textInputProps
    },
    forwardedRef,
  ): ReactElement => {
    const theme = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const inputRef = useRef<TextInput>(null);

    // Determine if label should float (focused or has value)
    const shouldFloat = isFocused || value.length > 0;
    const hasError = !!error;

    // Animation values
    const labelProgress = useSharedValue(shouldFloat ? 1 : 0);
    const borderProgress = useSharedValue(0);

    // Sync animation with state
    useEffect(() => {
      labelProgress.value = withTiming(shouldFloat ? 1 : 0, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    }, [shouldFloat, labelProgress]);

    useEffect(() => {
      borderProgress.value = withTiming(isFocused ? 1 : 0, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    }, [isFocused, borderProgress]);

    // Animated styles
    const labelAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateY: interpolate(
              labelProgress.value,
              [0, 1],
              [0, FLOATING_LABEL_TRANSLATE_Y],
              Extrapolation.CLAMP,
            ),
          },
          {
            scale: interpolate(
              labelProgress.value,
              [0, 1],
              [1, FLOATING_LABEL_SCALE],
              Extrapolation.CLAMP,
            ),
          },
        ],
        opacity: interpolate(
          labelProgress.value,
          [0, 1],
          [0.7, 1],
          Extrapolation.CLAMP,
        ),
      };
    });

    // Handle focus
    const handleFocus = useCallback(
      (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus],
    );

    // Handle blur
    const handleBlur = useCallback(
      (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur],
    );

    // Handle text change
    const handleChangeText = useCallback(
      (text: string) => {
        onChangeText?.(text);
      },
      [onChangeText],
    );

    // Determine effective secure text entry
    const effectiveSecureTextEntry = secureTextEntry
      ? !isPasswordVisible
      : false;

    // Determine border color based on state
    const getBorderColor = () => {
      if (hasError) return 'border-error';
      if (isFocused) return 'border-primary';
      return 'border-outline';
    };

    // Compute accessibility properties
    const computedAccessibilityLabel = accessibilityLabel || label;
    const computedAccessibilityHint =
      accessibilityHint ||
      (required ? 'Required field' : undefined) ||
      (hasError ? error : helperText) ||
      undefined;

    const accessibilityState: AccessibilityState = {
      disabled,
      selected: hasError,
      busy: false,
    };

    return (
      <View
        className="mb-4"
        style={containerStyle}
        testID={testID}
      >
        {/* Input Container */}
        <View
          className={cn(
            'relative min-h-[56px] rounded-xl border-2 bg-surfaceContainerLowest',
            'flex-row items-center overflow-hidden',
            getBorderColor(),
            disabled && 'opacity-50',
          )}
        >
          {/* Left Icon */}
          {leftIcon && (
            <View className="pl-3 justify-center items-center">
              {leftIcon}
            </View>
          )}

          {/* Input and Label Container */}
          <View className="flex-1 justify-center h-14 px-3">
            {/* Floating Label */}
            <Animated.View
              className="absolute left-0"
              style={[
                labelAnimatedStyle,
                {
                  // Adjust position based on left icon
                  left: leftIcon ? 0 : 0,
                },
              ]}
              pointerEvents="none"
            >
              <Animated.Text
                className={cn(
                  'text-base',
                  hasError
                    ? 'text-error'
                    : isFocused
                    ? 'text-primary'
                    : 'text-onSurfaceVariant',
                )}
                accessibilityElementsHidden
              >
                {label}
                {required && <Animated.Text className="text-error"> *</Animated.Text>}
              </Animated.Text>
            </Animated.View>

            {/* Text Input */}
            <TextInput
              ref={(ref) => {
                // Handle both forwarded ref and local ref
                if (typeof forwardedRef === 'function') {
                  forwardedRef(ref);
                } else if (forwardedRef) {
                  (forwardedRef as React.MutableRefObject<TextInput | null>).current = ref;
                }
                (inputRef as React.MutableRefObject<TextInput | null>).current = ref;
              }}
              value={value}
              onChangeText={handleChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              editable={!disabled}
              secureTextEntry={effectiveSecureTextEntry}
              placeholder={shouldFloat ? placeholder : undefined}
              placeholderTextColor={theme.colors.textTertiary}
              className={cn(
                'text-base text-onSurface h-full pt-4',
                Platform.select({
                  ios: 'py-2',
                  android: 'py-1',
                  web: 'py-2',
                }),
              )}
              style={inputStyle}
              accessibilityLabel={computedAccessibilityLabel}
              accessibilityHint={computedAccessibilityHint}
              accessibilityRole="text"
              accessibilityState={accessibilityState}
              {...textInputProps}
            />
          </View>

          {/* Right Icon (password toggle or custom) */}
          {secureTextEntry ? (
            <View className="pr-3 justify-center items-center">
              <PasswordToggle
                isVisible={isPasswordVisible}
                onToggle={() => setIsPasswordVisible(!isPasswordVisible)}
              />
            </View>
          ) : rightIcon ? (
            <View className="pr-3 justify-center items-center">
              {rightIcon}
            </View>
          ) : null}
        </View>

        {/* Helper Text or Error */}
        {(helperText || error) && (
          <Animated.Text
            className={cn(
              'text-xs mt-1 ml-1',
              hasError ? 'text-error' : 'text-onSurfaceVariant',
            )}
            accessibilityRole={hasError ? 'alert' : undefined}
            accessibilityLiveRegion={hasError ? 'polite' : undefined}
          >
            {error || helperText}
          </Animated.Text>
        )}
      </View>
    );
  },
);

Input.displayName = 'Input';

// ============================================================================
// PASSWORD TOGGLE COMPONENT
// ============================================================================

interface PasswordToggleProps {
  isVisible: boolean;
  onToggle: () => void;
}

/**
 * Password visibility toggle button
 */
function PasswordToggle({ isVisible, onToggle }: PasswordToggleProps): ReactElement {
  const theme = useTheme();

  return (
    <View
      className="p-1 rounded-full active:bg-surfaceVariant"
      accessibilityRole="button"
      accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
      accessible
    >
      {/* Using text as placeholder for icon */}
      <Animated.Text
        className="text-onSurfaceVariant text-lg"
        onPress={onToggle}
      >
        {isVisible ? '🙈' : '👁️'}
      </Animated.Text>
    </View>
  );
}

export default Input;
