/**
 * TealCard - Calming Content
 * 
 * iOS-style card with subtle teal accent
 * For meditation, calming exercises, peaceful content
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Accent colors - teal
const ACCENT = '#5AC8FA';         // iOS light blue
const ACCENT_BG = 'rgba(90, 200, 250, 0.08)';
const SURFACE = '#1C1C1E';

export interface TealCardProps {
  title?: string;
  description?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  children?: React.ReactNode;
  style?: ViewStyle;
  /** @deprecated No effect */
  intensity?: 'light' | 'medium' | 'heavy';
}

export function TealCard({
  title,
  description,
  icon,
  children,
  style,
}: TealCardProps): React.ReactElement {
  return (
    <View style={[styles.container, style]}>
      {(title || icon) && (
        <View style={styles.header}>
          {icon && (
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={icon} size={20} color={ACCENT} />
            </View>
          )}
          {title && <Text style={styles.title}>{title}</Text>}
        </View>
      )}
      
      {description && <Text style={styles.description}>{description}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 16,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ACCENT_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  } as TextStyle,
  description: {
    fontSize: 15,
    lineHeight: 20,
    color: '#8E8E93',
  } as TextStyle,
});
