/**
 * SageCard - Success & Achievement
 *
 * iOS-style card with subtle green accent
 * For milestones, achievements, positive states
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ds } from '../tokens/ds';

// Accent colors - iOS green
const ACCENT = ds.colors.success;
const ACCENT_BG = ds.colors.successMuted;
const SURFACE = ds.colors.bgSecondary;

export interface SageCardProps {
  title?: string;
  description?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  badge?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  glow?: boolean;
}

export function SageCard({
  title,
  description,
  icon,
  badge,
  children,
  style,
  glow = false,
}: SageCardProps): React.ReactElement {
  return (
    <View style={[styles.container, glow && styles.glow, style]}>
      {(title || icon || badge) && (
        <View style={styles.header}>
          {icon && (
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={icon} size={20} color={ACCENT} />
            </View>
          )}
          <View style={styles.titleContainer}>
            {badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
            {title && <Text style={styles.title}>{title}</Text>}
          </View>
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
    shadowColor: ds.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  glow: {
    shadowColor: ACCENT,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  badge: {
    backgroundColor: ACCENT_BG,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: ds.semantic.text.onDark,
    letterSpacing: -0.1,
  } as TextStyle,
  description: {
    fontSize: 15,
    lineHeight: 20,
    color: ds.colors.textSecondary,
  } as TextStyle,
});
