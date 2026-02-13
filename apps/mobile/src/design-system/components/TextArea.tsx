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
import { useDs } from '../DsProvider';

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
  const ds = useDs();
  const [isFocused, setIsFocused] = useState(false);

  // Character count display
  const characterCount = value.length;
  const displayCharacterCount = showCharacterCount || maxLength;

  // Determine border color based on state
  const getBorderColor = (): string => {
    if (error) return ds.semantic.intent.alert.solid;
    if (isFocused) return ds.semantic.intent.primary.solid;
    return ds.semantic.surface.overlay;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      <View style={styles.labelContainer}>
        <Text style={[ds.semantic.typography.sectionLabel, { color: ds.semantic.text.primary }]}>
          {label}
          {required && <Text style={{ color: ds.semantic.intent.alert.solid }}> *</Text>}
        </Text>

        {/* Character Count */}
        {displayCharacterCount && (
          <Text style={[ds.semantic.typography.sectionLabel, { color: ds.semantic.text.secondary }]}>
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
            backgroundColor: ds.semantic.surface.card,
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
          style={[styles.textArea, ds.semantic.typography.body, { color: ds.semantic.text.primary }]}
          placeholderTextColor={ds.semantic.text.secondary}
          {...textInputProps}
        />
      </View>

      {/* Error or Hint Text */}
      {error ? (
        <Text style={[ds.semantic.typography.sectionLabel, styles.errorText, { color: ds.semantic.intent.alert.solid }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[ds.semantic.typography.sectionLabel, { color: ds.semantic.text.secondary }]}>
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

