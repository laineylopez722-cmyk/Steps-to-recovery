/**
 * iOS-style Toast Component
 * Lightweight notification for success/error/info messages
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, type ViewStyle, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ds } from '../tokens/ds';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

/** Valid icon names for MaterialIcons used in Toast */
type ToastIconName = ComponentProps<typeof MaterialIcons>['name'];

export interface ToastProps {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onDismiss?: () => void;
  containerStyle?: ViewStyle;
}

export function Toast({
  visible,
  message,
  variant = 'info',
  duration = 3000,
  onDismiss,
  containerStyle,
}: ToastProps): React.ReactElement {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      // Fade in + slide down
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          hideToast();
        }, duration);

        return () => clearTimeout(timer);
      }
      return undefined;
    } else {
      hideToast();
      return undefined;
    }
  }, [visible, duration]);

  const hideToast = (): void => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const getVariantConfig = (): {
    backgroundColor: string;
    icon: ToastIconName;
    iconColor: string;
  } => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: theme.colors.success,
          icon: 'check-circle',
          iconColor: ds.semantic.text.onDark,
        };
      case 'error':
        return {
          backgroundColor: theme.colors.danger,
          icon: 'error',
          iconColor: ds.semantic.text.onDark,
        };
      case 'warning':
        return {
          backgroundColor: ds.colors.warning,
          icon: 'warning',
          iconColor: ds.semantic.text.onDark,
        };
      case 'info':
      default:
        return {
          backgroundColor: theme.colors.primary,
          icon: 'info',
          iconColor: '#ffffff',
        };
    }
  };

  const config = getVariantConfig();

  if (!visible) return <View />;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: config.backgroundColor,
        },
        Platform.OS === 'ios' && styles.iosShadow,
        Platform.OS === 'android' && styles.androidElevation,
        containerStyle,
      ]}
      accessibilityRole="alert"
      accessible={true}
    >
      <MaterialIcons name={config.icon} size={20} color={config.iconColor} />
      <Text style={[styles.message, theme.typography.body, { color: ds.semantic.text.onDark }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 9999,
  },
  iosShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  androidElevation: {
    elevation: 8,
  },
  message: {
    flex: 1,
    marginLeft: 12,
    fontWeight: '500',
  },
});
