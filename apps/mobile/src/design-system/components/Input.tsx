/**
 * iOS-style Input Component
 * Text input with label, error states, and icon support
 */

import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export interface InputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    value,
    onChangeText,
    error,
    hint,
    required = false,
    leftIcon,
    rightIcon,
    secureTextEntry,
    containerStyle,
    ...textInputProps
  }: InputProps,
  ref: React.ForwardedRef<TextInput>,
) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Determine border color based on state
  const getBorderColor = () => {
    if (error) return theme.colors.danger;
    if (isFocused) return theme.colors.primary;
    return theme.colors.border;
  };

  // If secureTextEntry is provided, show password toggle
  const hasPasswordToggle = secureTextEntry !== undefined;
  const effectiveSecureTextEntry = hasPasswordToggle ? !isPasswordVisible : false;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      <View style={styles.labelContainer}>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>
          {label}
          {required && <Text style={{ color: theme.colors.danger }}> *</Text>}
        </Text>
      </View>

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: getBorderColor(),
            borderRadius: theme.radius.input,
          },
          error && styles.inputError,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        {/* Text Input */}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={effectiveSecureTextEntry}
          style={[
            styles.input,
            theme.typography.body,
            { color: theme.colors.text },
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon || hasPasswordToggle ? styles.inputWithRightIcon : undefined,
          ].filter(Boolean)}
          placeholderTextColor={theme.colors.textSecondary}
          {...textInputProps}
        />

        {/* Right Icon or Password Toggle */}
        {hasPasswordToggle ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIconContainer}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            <MaterialIcons
              name={isPasswordVisible ? 'visibility' : 'visibility-off'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIconContainer}>{rightIcon}</View>
        ) : null}
      </View>

      {/* Error or Hint Text */}
      {error ? (
        <Text style={[theme.typography.caption, styles.errorText, { color: theme.colors.danger }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    minHeight: 44, // WCAG minimum touch target
  },
  inputError: {
    borderWidth: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIconContainer: {
    paddingLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 4,
  },
});
