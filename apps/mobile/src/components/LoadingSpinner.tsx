import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { theme } from '../utils/theme';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
  color?: string;
  testID?: string;
}

export function LoadingSpinner({
  message,
  size = 'large',
  fullScreen = true,
  color = theme.colors.primary,
  testID,
}: LoadingSpinnerProps) {
  const content = (
    <>
      <ActivityIndicator size={size} color={color} accessibilityLabel="Loading" />
      {message && <Text style={styles.message}>{message}</Text>}
    </>
  );

  if (!fullScreen) {
    return (
      <View style={styles.inline} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={message || 'Loading content'}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  inline: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  message: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
