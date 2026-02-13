/**
 * iOS-style Divider Component
 * Horizontal separator line for sections and lists
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useDs } from '../DsProvider';

export interface DividerProps {
  style?: ViewStyle;
  marginVertical?: number;
  marginHorizontal?: number;
  color?: string;
}

export function Divider({
  style,
  marginVertical = 0,
  marginHorizontal = 0,
  color,
}: DividerProps): React.ReactElement {
  const ds = useDs();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: color || ds.semantic.surface.overlay,
          marginVertical,
          marginHorizontal,
        },
        style,
      ]}
      accessibilityRole="none"
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
