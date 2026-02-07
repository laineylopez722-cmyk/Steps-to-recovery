/**
 * LavenderCard - Mindfulness & Reflection
 * 
 * iOS-style card with subtle purple accent
 * Clean design, no blur/glass effects
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Accent colors - subtle purple
const ACCENT = '#BF5AF2';         // iOS purple
const ACCENT_BG = 'rgba(191, 90, 242, 0.08)';
const SURFACE = '#1C1C1E';

export interface LavenderCardProps {
  title?: string;
  description?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  quote?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function LavenderCard({
  title,
  description,
  icon,
  quote,
  children,
  style,
}: LavenderCardProps): React.ReactElement {
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
      
      {quote && (
        <View style={styles.quoteContainer}>
          <Text style={styles.quote}>"{quote}"</Text>
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
  quoteContainer: {
    marginBottom: 12,
  },
  quote: {
    fontSize: 17,
    lineHeight: 24,
    fontStyle: 'italic',
    color: '#8E8E93',
  } as TextStyle,
  description: {
    fontSize: 15,
    lineHeight: 20,
    color: '#8E8E93',
  } as TextStyle,
});
