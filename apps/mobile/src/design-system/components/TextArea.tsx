/**
 * iOS-style TextArea Component
 * Multi-line text input optimized for longer content
 */

import { forwardRef, type Ref } from 'react';
import { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

export interface TextAreaProps extends Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'multiline'
> {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  minHeight?: number;
  maxLength?: number;
  showCharacterCount?: boolean;
}

export const TextArea = forwardRef<TextInput, TextAreaProps>(function TextArea(
  {
    label,
    value,
    onChangeText,
    error,
    hint,
    required = false,
    containerStyle,
    minHeight = 120,
    maxLength,
    showCharacterCount = false,
    ...textInputProps
  }: TextAreaProps,
  ref: Ref<TextInput>,
) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // Character count display
  const characterCount = value.length;
  const displayCharacterCount = showCharacterCount || maxLength;

  // Determine border color based on state
  const getBorderColor = (): string => {
    if (error) return theme.colors.danger;
    if (isFocused) return theme.colors.primary;
    return theme.colors.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      <View style={styles.labelContainer}>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>
          {label}
          {required && <Text style={{ color: theme.colors.danger }}> *</Text>}
        </Text>

        {/* Character Count */}
        {displayCharacterCount && (
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            {characterCount}
            {maxLength ? `/${maxLength}` : ''}
          </Text>
        )}
      </View>

      {/* TextArea Container */}
      <View
        style={[
          styles.textAreaContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: getBorderColor(),
            borderRadius: theme.radius.input,
            minHeight,
          },
          error && styles.textAreaError,
        ]}
      >
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          textAlignVertical="top"
          maxLength={maxLength}
          style={[styles.textArea, theme.typography.body, { color: theme.colors.text }]}
          placeholderTextColor={theme.colors.textSecondary}
          {...textInputProps}
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  textAreaContainer: {
    borderWidth: 2,
    padding: 16,
  },
  textAreaError: {
    borderWidth: 2,
  },
  textArea: {
    flex: 1,
    padding: 0, // Remove default padding, use container padding
  },
  errorText: {
    marginTop: 4,
  },
});
