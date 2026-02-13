import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useDs } from '../design-system/DsProvider';

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
  color,
  testID,
}: LoadingSpinnerProps) {
  const ds = useDs();
  const resolvedColor = color ?? ds.semantic.intent.primary.solid;

  const content = (
    <>
      <ActivityIndicator size={size} color={resolvedColor} accessibilityLabel="Loading" />
      {message && <Text style={[styles.message, { color: ds.semantic.text.secondary }]}>{message}</Text>}
    </>
  );

  if (!fullScreen) {
    return (
      <View style={[styles.inline, { padding: ds.space[4] }]} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: ds.semantic.surface.app, padding: ds.space[6] }]}
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
  },
  inline: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});
