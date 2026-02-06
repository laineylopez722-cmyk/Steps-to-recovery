import React from 'react';
import { View, Text, StyleSheet, Pressable, AccessibilityInfo, type ViewProps } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { darkAccent, spacing, typography } from '../tokens/modern';

// Screen reader only text
export function ScreenReaderText({ children }: { children: string }): React.ReactElement {
  return (
    <Text
      style={styles.screenReaderOnly}
      accessibilityElementsHidden={false}
      importantForAccessibility="yes"
    >
      {children}
    </Text>
  );
}

// Accessible Button wrapper
interface AccessibleButtonProps extends ViewProps {
  onPress: () => void;
  label: string;
  hint?: string;
  role?: 'button' | 'link' | 'menuitem';
  disabled?: boolean;
  children: React.ReactNode;
}

export function AccessibleButton({
  onPress,
  label,
  hint,
  role = 'button',
  disabled = false,
  children,
  ...props
}: AccessibleButtonProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityRole={role}
      accessibilityState={{ disabled }}
      {...props}
    >
      {children}
    </Pressable>
  );
}

// Focus indicator wrapper
interface FocusableProps extends ViewProps {
  children: React.ReactNode;
  isFocused?: boolean;
}

export function Focusable({
  children,
  isFocused,
  style,
  ...props
}: FocusableProps): React.ReactElement {
  return (
    <View style={[style, isFocused && styles.focused]} {...props}>
      {children}
    </View>
  );
}

// Accessible Form Field
interface AccessibleFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

export function AccessibleField({
  label,
  required,
  error,
  helperText,
  children,
}: AccessibleFieldProps): React.ReactElement {
  const labelText = `${label}${required ? ', required' : ''}`;
  const hintText = error || helperText;

  return (
    <View accessible={true} accessibilityLabel={labelText} accessibilityHint={hintText}>
      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      {children}
      {error ? (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

// Accessible Progress indicator
interface AccessibleProgressProps {
  progress: number; // 0-100
  label: string;
}

export function AccessibleProgress({
  progress,
  label,
}: AccessibleProgressProps): React.ReactElement {
  return (
    <View
      accessible={true}
      accessibilityLabel={`${label}, ${Math.round(progress)}% complete`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: progress }}
      style={styles.progressContainer}
    >
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

// Live region for announcements
interface LiveRegionProps {
  children: React.ReactNode;
  type?: 'polite' | 'assertive';
}

export function LiveRegion({ children, type = 'polite' }: LiveRegionProps): React.ReactElement {
  return (
    <View accessibilityLiveRegion={type} accessibilityElementsHidden={false}>
      {children}
    </View>
  );
}

// Skip link for screen readers
interface SkipLinkProps {
  to: string;
  label: string;
}

export function SkipLink({ to: _to, label }: SkipLinkProps): React.ReactElement {
  const handlePress = () => {
    // Navigate to element with id
  };

  return (
    <Pressable onPress={handlePress} style={styles.skipLink} accessibilityRole="link">
      <Text style={styles.skipLinkText}>{label}</Text>
    </Pressable>
  );
}

// Heading levels for semantic structure
interface HeadingProps {
  level: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export function Heading({ level, children, style: _style }: HeadingProps): React.ReactElement {
  const headingStyles = {
    1: typography.h1,
    2: typography.h2,
    3: typography.h3,
    4: typography.h4,
  };

  return (
    <Text style={headingStyles[level]} accessibilityRole="header">
      accessibilityRole="header"
      {children}
    </Text>
  );
}

// Accessible list
interface AccessibleListProps {
  children: React.ReactNode;
  label: string;
}

export function AccessibleList({ children, label }: AccessibleListProps): React.ReactElement {
  return (
    <View accessibilityLabel={label} accessibilityRole="list">
      {children}
    </View>
  );
}

export function AccessibleListItem({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <View accessibilityRole="text">{children}</View>;
}

// Screen reader announcement helper
export function announce(message: string, _priority: 'default' | 'high' = 'default'): void {
  AccessibilityInfo.announceForAccessibility(message);
}

// Check if screen reader is enabled
export async function isScreenReaderEnabled(): Promise<boolean> {
  return AccessibilityInfo.isScreenReaderEnabled();
}

const styles = StyleSheet.create({
  screenReaderOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    // Note: 'clip' is not supported in React Native. Use opacity: 0 instead
    // for visually hiding content while keeping it accessible to screen readers
    opacity: 0,
    borderWidth: 0,
  },
  focused: {
    borderWidth: 2,
    borderColor: darkAccent.primary,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing[1],
  },
  fieldLabel: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
    fontWeight: '500',
  },
  required: {
    color: darkAccent.error,
    fontWeight: '700',
  },
  errorText: {
    ...typography.caption,
    color: darkAccent.error,
    marginTop: spacing[1],
  },
  helperText: {
    ...typography.caption,
    color: darkAccent.textMuted,
    marginTop: spacing[1],
  },
  progressContainer: {
    height: 8,
    backgroundColor: darkAccent.surfaceHigh,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressTrack: {
    flex: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: darkAccent.primary,
    borderRadius: 4,
  },
  skipLink: {
    position: 'absolute',
    top: -100,
    left: 0,
    backgroundColor: darkAccent.primary,
    padding: spacing[2],
    zIndex: 9999,
  },
  skipLinkText: {
    color: '#FFF',
    ...typography.body,
    fontWeight: '600',
  },
});
